import { useState, useRef, useCallback } from 'react';
import { vlog, vwarn, verr } from '@/shared/utils/verbose';
import { ActivityType } from '@/shared/types';

export type SessionState = 'idle' | 'ready' | 'tracking';

export type LiveActivityMetrics = {
  distanceMeters: number;
  steps: number;
  floorsUp: number;
  floorsDown: number;
  durationSeconds: number;
  latitude: number | null;
  longitude: number | null;
  startTime: number | null;
  type: ActivityType;
};

/**
 * Hook for managing live activity tracking (Walk/Run/Floors)
 * Uses Geolocation for distance and DeviceMotion for steps.
 */
export function useLiveActivity() {
  const [sessionState, setSessionState] = useState<SessionState>('idle');
  const [metrics, setMetrics] = useState<LiveActivityMetrics>({
    distanceMeters: 0,
    steps: 0,
    floorsUp: 0,
    floorsDown: 0,
    durationSeconds: 0,
    latitude: null,
    longitude: null,
    startTime: null,
    type: ActivityType.Walk,
  });

  const watchIdRef = useRef<number | null>(null);
  const lastPosRef = useRef<GeolocationCoordinates | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const timerRef = useRef<number | null>(null);
  const pressureSensorRef = useRef<{ stop: () => void } | null>(null);
  const lastPressureRef = useRef<number | null>(null);
  const motionHandlerRef = useRef<((e: DeviceMotionEvent) => void) | null>(null);

  // Track cumulative elevation changes from GPS (3m = 1 floor)
  const elevationGainRef = useRef<number>(0);
  const elevationLossRef = useRef<number>(0);

  /** Calculate distance between two points in meters */
  const calcDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  /** Prepare a session but do not start sensors yet */
  const prepare = useCallback((type: ActivityType = ActivityType.Walk) => {
    setSessionState('ready');
    setMetrics({
      distanceMeters: 0,
      steps: 0,
      floorsUp: 0,
      floorsDown: 0,
      durationSeconds: 0,
      latitude: null,
      longitude: null,
      startTime: null,
      type,
    });
  }, []);

  /** Start tracking sensors */
  const start = useCallback(async () => {
    vlog('[LiveActivity] Starting session', { type: metrics.type });

    // Reset accumulators
    elevationGainRef.current = 0;
    elevationLossRef.current = 0;

    // 1. Request Geolocation (Distance & Elevation fallback)
    if ('geolocation' in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          setMetrics((prev) => ({
            ...prev,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          }));

          if (lastPosRef.current) {
            const dist = calcDistance(
              lastPosRef.current.latitude,
              lastPosRef.current.longitude,
              pos.coords.latitude,
              pos.coords.longitude,
            );

            // Distance tracking
            // Only add if accuracy is decent and distance is meaningful (> 2m)
            if (pos.coords.accuracy < 50 && dist > 2) {
              setMetrics((prev) => ({ ...prev, distanceMeters: prev.distanceMeters + dist }));
            }

            // Elevation tracking (Fallback if no PressureSensor)
            // Use GPS altitude if available and reasonably accurate (e.g. < 20m error)
            if (
              !('PressureSensor' in window) &&
              pos.coords.altitude !== null &&
              lastPosRef.current.altitude !== null &&
              (pos.coords.altitudeAccuracy ?? 100) < 20
            ) {
              const altDiff = pos.coords.altitude - lastPosRef.current.altitude;

              // Only count meaningful altitude changes to filter out GPS jitter
              if (Math.abs(altDiff) > 0.5) {
                if (altDiff > 0) {
                  elevationGainRef.current += altDiff;
                } else {
                  elevationLossRef.current += Math.abs(altDiff);
                }

                // 3 meters = 1 floor
                const newFloorsUp = Math.floor(elevationGainRef.current / 3);
                const newFloorsDown = Math.floor(elevationLossRef.current / 3);

                setMetrics((prev) => ({
                  ...prev,
                  floorsUp: newFloorsUp,
                  floorsDown: newFloorsDown,
                }));
              }
            }
          }
          lastPosRef.current = pos.coords;
        },
        (err) => verr('[LiveActivity] Geolocation error', err),
        { enableHighAccuracy: true },
      );
    }

    // 2. Request Motion (iOS specific permission)
    const DeviceMotionFn =
      typeof DeviceMotionEvent !== 'undefined'
        ? (DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> })
        : null;
    if (DeviceMotionFn && typeof DeviceMotionFn.requestPermission === 'function') {
      try {
        const permission = await DeviceMotionFn.requestPermission();
        if (permission !== 'granted') vwarn('[LiveActivity] Motion permission denied');
      } catch (e) {
        verr('[LiveActivity] Motion permission error', e);
      }
    }

    // 3. Simple step detection logic
    const handleMotion = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity;
      if (!acc) return;
      const total = Math.sqrt((acc.x ?? 0) ** 2 + (acc.y ?? 0) ** 2 + (acc.z ?? 0) ** 2);
      // Simple threshold for a "step" impact
      if (total > 12) {
        setMetrics((prev) => ({ ...prev, steps: prev.steps + 1 }));
      }
    };
    motionHandlerRef.current = handleMotion;
    window.addEventListener('devicemotion', handleMotion);

    // 4. Pressure Sensor (Floors) if supported
    if ('PressureSensor' in window) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sensor = new (window as any).PressureSensor({ frequency: 1 });
        sensor.addEventListener('reading', () => {
          if (lastPressureRef.current !== null) {
            const diff = sensor.pressure - lastPressureRef.current;
            // 0.12 hPa approx 1 meter. 3m = 0.36 hPa
            if (diff < -0.36) {
              // Pressure drop = altitude gain
              setMetrics((prev) => ({ ...prev, floorsUp: prev.floorsUp + 1 }));
            } else if (diff > 0.36) {
              setMetrics((prev) => ({ ...prev, floorsDown: prev.floorsDown + 1 }));
            }
          }
          lastPressureRef.current = sensor.pressure;
        });
        sensor.start();
        pressureSensorRef.current = sensor;
      } catch (e) {
        vwarn('[LiveActivity] PressureSensor failed', e);
      }
    }

    // 5. Wake Lock
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      } catch (e) {
        vwarn('[LiveActivity] WakeLock failed', e);
      }
    }

    // 6. Timer
    const startTime = Date.now();
    setMetrics((prev) => ({ ...prev, startTime }));
    setSessionState('tracking');

    timerRef.current = window.setInterval(() => {
      setMetrics((prev) => ({
        ...prev,
        durationSeconds: Math.floor((Date.now() - (prev.startTime ?? Date.now())) / 1000),
      }));
    }, 1000);
  }, [metrics.type]);

  /** Stop all sensors and timer */
  const stop = useCallback(() => {
    vlog('[LiveActivity] Stopping session');
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    if (wakeLockRef.current) wakeLockRef.current.release();
    if (pressureSensorRef.current) pressureSensorRef.current.stop();
    if (motionHandlerRef.current)
      window.removeEventListener('devicemotion', motionHandlerRef.current);

    setSessionState('idle');
    lastPosRef.current = null;
    lastPressureRef.current = null;
    motionHandlerRef.current = null;

    const finalMetrics = { ...metrics };
    setMetrics({
      distanceMeters: 0,
      steps: 0,
      floorsUp: 0,
      floorsDown: 0,
      durationSeconds: 0,
      latitude: null,
      longitude: null,
      startTime: null,
      type: ActivityType.Walk,
    });

    return finalMetrics;
  }, [metrics]);

  /** Cancel a prepared session */
  const cancel = useCallback(() => {
    if (sessionState === 'tracking') {
      stop();
    } else {
      setSessionState('idle');
    }
  }, [sessionState, stop]);

  /** Force a manual refresh of sensors and permissions */
  const refreshSensors = useCallback(async () => {
    vlog('[LiveActivity] Force refreshing sensors');

    // 1. Force a fresh GPS read bypassing cache
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setMetrics((prev) => ({
            ...prev,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          }));
          lastPosRef.current = pos.coords;
          vlog('[LiveActivity] GPS Refreshed');
        },
        (err) => verr('[LiveActivity] GPS Refresh error', err),
        { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 },
      );
    } else {
      vwarn('[LiveActivity] Geolocation API not available in navigator');
    }

    // 2. Re-request Motion (iOS specific permission)
    const DeviceMotionFn =
      typeof DeviceMotionEvent !== 'undefined'
        ? (DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> })
        : null;
    if (DeviceMotionFn && typeof DeviceMotionFn.requestPermission === 'function') {
      try {
        const permission = await DeviceMotionFn.requestPermission();
        vlog('[LiveActivity] Motion permission re-requested:', permission);
      } catch (e) {
        verr('[LiveActivity] Motion permission error', e);
      }
    } else {
      vlog(
        '[LiveActivity] DeviceMotion requestPermission API not available (standard for non-iOS)',
      );
    }
  }, []);

  return { sessionState, metrics, prepare, start, stop, cancel, refreshSensors };
}

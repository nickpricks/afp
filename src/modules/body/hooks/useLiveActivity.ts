import { useState, useRef, useCallback } from 'react';
import { vlog, vwarn, verr } from '@/shared/utils/verbose';
import { ActivityType } from '@/shared/types';
import {
  computeStepFloors,
  FLOOR_ESTIMATION,
  initialStepState,
  processMotionSample,
  roundMeters,
} from '@/modules/body/step-math';
import type { StepDetectorState } from '@/modules/body/step-math';

/** Configuration constants for live activity tracking sensors */
const LIVE_ACTIVITY_CONFIG = {
  EARTH_RADIUS_M: 6371e3,
  MIN_GPS_ACCURACY_M: 50,
  MIN_DISTANCE_M: 2,
  MAX_ALTITUDE_ACCURACY_M: 20,
  MIN_ALTITUDE_DIFF_M: 0.5,
  METERS_PER_FLOOR: 3,
  PRESSURE_DIFF_HPA_PER_FLOOR: 0.36,
  PRESSURE_SENSOR_FREQ_HZ: 1,
  TIMER_INTERVAL_MS: 1000,
  GPS_REFRESH_TIMEOUT_MS: 10000,
  GPS_MAX_AGE_MS: 0,
} as const;

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
  const stepStateRef = useRef<StepDetectorState>(initialStepState());
  // Stairs mode — steps-per-floor floor estimation for barometer-less devices
  const [stairsMode, setStairsModeState] = useState(false);
  const stairsModeRef = useRef(false);
  const stairStepsRef = useRef(0);
  const stepFloorsCountedRef = useRef(0);

  // Track cumulative elevation changes from GPS
  const elevationGainRef = useRef<number>(0);
  const elevationLossRef = useRef<number>(0);

  /** Compute distance between two points in meters */
  const computeDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = LIVE_ACTIVITY_CONFIG.EARTH_RADIUS_M;
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
            const dist = computeDistance(
              lastPosRef.current.latitude,
              lastPosRef.current.longitude,
              pos.coords.latitude,
              pos.coords.longitude,
            );

            // Distance tracking
            if (
              pos.coords.accuracy < LIVE_ACTIVITY_CONFIG.MIN_GPS_ACCURACY_M &&
              dist > LIVE_ACTIVITY_CONFIG.MIN_DISTANCE_M
            ) {
              // Rounded on every accumulation — the live value never drifts into float noise
              setMetrics((prev) => ({
                ...prev,
                distanceMeters: roundMeters(prev.distanceMeters + dist),
              }));
            }

            // Elevation tracking (Fallback if no PressureSensor)
            if (
              !('PressureSensor' in window) &&
              pos.coords.altitude !== null &&
              lastPosRef.current.altitude !== null &&
              (pos.coords.altitudeAccuracy ?? 100) < LIVE_ACTIVITY_CONFIG.MAX_ALTITUDE_ACCURACY_M
            ) {
              const altDiff = pos.coords.altitude - lastPosRef.current.altitude;

              // Only count meaningful altitude changes to filter out GPS jitter
              if (Math.abs(altDiff) > LIVE_ACTIVITY_CONFIG.MIN_ALTITUDE_DIFF_M) {
                if (altDiff > 0) {
                  elevationGainRef.current += altDiff;
                } else {
                  elevationLossRef.current += Math.abs(altDiff);
                }

                const newFloorsUp = Math.floor(
                  elevationGainRef.current / LIVE_ACTIVITY_CONFIG.METERS_PER_FLOOR,
                );
                const newFloorsDown = Math.floor(
                  elevationLossRef.current / LIVE_ACTIVITY_CONFIG.METERS_PER_FLOOR,
                );

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

    // 3. Step detection — rising-edge + refractory window via pure step-math
    // (raw per-sample threshold counting overcounted badly at ~60Hz sampling)
    stepStateRef.current = initialStepState();
    const handleMotion = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity;
      if (!acc) return;
      const total = Math.sqrt((acc.x ?? 0) ** 2 + (acc.y ?? 0) ** 2 + (acc.z ?? 0) ** 2);
      const result = processMotionSample(stepStateRef.current, {
        t: Date.now(),
        magnitude: total,
      });
      stepStateRef.current = result.state;
      if (result.stepped) {
        // Stairs mode: steps also accumulate toward floors-up (steps-per-floor
        // heuristic) — the fallback signal when no barometer/usable GPS altitude.
        // Direction is up-only by design; corrections come from manual ↓/↑ taps.
        let floorDelta = 0;
        if (stairsModeRef.current) {
          stairStepsRef.current += 1;
          const totalFloors = computeStepFloors(
            stairStepsRef.current,
            FLOOR_ESTIMATION.STEPS_PER_FLOOR,
          );
          floorDelta = totalFloors - stepFloorsCountedRef.current;
          stepFloorsCountedRef.current = totalFloors;
        }
        setMetrics((prev) => ({
          ...prev,
          steps: prev.steps + 1,
          floorsUp: prev.floorsUp + floorDelta,
        }));
      }
    };
    motionHandlerRef.current = handleMotion;
    window.addEventListener('devicemotion', handleMotion);

    // 4. Pressure Sensor (Floors) if supported
    if ('PressureSensor' in window) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sensor = new (window as any).PressureSensor({
          frequency: LIVE_ACTIVITY_CONFIG.PRESSURE_SENSOR_FREQ_HZ,
        });
        sensor.addEventListener('reading', () => {
          if (lastPressureRef.current !== null) {
            const diff = sensor.pressure - lastPressureRef.current;
            if (diff < -LIVE_ACTIVITY_CONFIG.PRESSURE_DIFF_HPA_PER_FLOOR) {
              // Pressure drop = altitude gain
              setMetrics((prev) => ({ ...prev, floorsUp: prev.floorsUp + 1 }));
            } else if (diff > LIVE_ACTIVITY_CONFIG.PRESSURE_DIFF_HPA_PER_FLOOR) {
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
        durationSeconds: Math.floor(
          (Date.now() - (prev.startTime ?? Date.now())) / LIVE_ACTIVITY_CONFIG.TIMER_INTERVAL_MS,
        ),
      }));
    }, LIVE_ACTIVITY_CONFIG.TIMER_INTERVAL_MS);
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
    stairsModeRef.current = false;
    setStairsModeState(false);
    stairStepsRef.current = 0;
    stepFloorsCountedRef.current = 0;

    const finalMetrics = { ...metrics, distanceMeters: roundMeters(metrics.distanceMeters) };
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
        {
          enableHighAccuracy: true,
          maximumAge: LIVE_ACTIVITY_CONFIG.GPS_MAX_AGE_MS,
          timeout: LIVE_ACTIVITY_CONFIG.GPS_REFRESH_TIMEOUT_MS,
        },
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

  /** Manual "tap as you go" floor correction — composes with sensor/stairs-mode counts */
  const addManualFloor = useCallback((direction: 'up' | 'down') => {
    setMetrics((prev) => ({
      ...prev,
      floorsUp: direction === 'up' ? prev.floorsUp + 1 : prev.floorsUp,
      floorsDown: direction === 'down' ? prev.floorsDown + 1 : prev.floorsDown,
    }));
  }, []);

  /** Toggles stairs mode (steps→floors heuristic); resets its counters on each switch */
  const setStairsMode = useCallback((on: boolean) => {
    stairsModeRef.current = on;
    stairStepsRef.current = 0;
    stepFloorsCountedRef.current = 0;
    setStairsModeState(on);
  }, []);

  return {
    sessionState,
    metrics,
    stairsMode,
    prepare,
    start,
    stop,
    cancel,
    refreshSensors,
    addManualFloor,
    setStairsMode,
  };
}

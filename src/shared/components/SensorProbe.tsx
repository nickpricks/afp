import { useEffect, useRef, useState } from 'react';

/** Live sensor availability + readings snapshot for the probe panel */
type ProbeState = {
  geolocation: boolean;
  deviceMotion: boolean;
  motionPermissionApi: boolean;
  pressureSensor: boolean;
  wakeLock: boolean;
  lastMagnitude: number | null;
  sampleCount: number;
};

/** Initial availability sweep — feature detection only, no permissions requested */
function detectAvailability(): ProbeState {
  return {
    geolocation: typeof navigator !== 'undefined' && 'geolocation' in navigator,
    deviceMotion: typeof DeviceMotionEvent !== 'undefined',
    motionPermissionApi:
      typeof DeviceMotionEvent !== 'undefined' &&
      typeof (DeviceMotionEvent as unknown as { requestPermission?: unknown }).requestPermission ===
        'function',
    pressureSensor: typeof window !== 'undefined' && 'PressureSensor' in window,
    wakeLock: typeof navigator !== 'undefined' && 'wakeLock' in navigator,
    lastMagnitude: null,
    sampleCount: 0,
  };
}

/** Availability pill — green when supported */
function Pill({ label, on }: { label: string; on: boolean }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
        on ? 'bg-emerald-500/15 text-emerald-600' : 'bg-red-500/10 text-red-500'
      }`}
    >
      {label}: {on ? 'yes' : 'no'}
    </span>
  );
}

/**
 * DevBench sensor probe (Family Umbrella Pillar 4 decision gate): shows which
 * tracking sensors exist on THIS device and streams live accelerometer magnitude
 * while running — test on the real device fleet before trusting sensor tracking.
 * Listening starts only on explicit tap (iOS permission etiquette).
 */
export function SensorProbe() {
  const [probe, setProbe] = useState<ProbeState>(detectAvailability);
  const [listening, setListening] = useState(false);
  const handlerRef = useRef<((e: DeviceMotionEvent) => void) | null>(null);

  /** Starts the accelerometer stream (requests iOS permission when required) */
  const startListening = async () => {
    const MotionApi = DeviceMotionEvent as unknown as {
      requestPermission?: () => Promise<string>;
    };
    if (typeof MotionApi.requestPermission === 'function') {
      const permission = await MotionApi.requestPermission().catch(() => 'denied');
      if (permission !== 'granted') return;
    }
    const handler = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity;
      if (!acc) return;
      const magnitude = Math.sqrt((acc.x ?? 0) ** 2 + (acc.y ?? 0) ** 2 + (acc.z ?? 0) ** 2);
      setProbe((prev) => ({
        ...prev,
        lastMagnitude: magnitude,
        sampleCount: prev.sampleCount + 1,
      }));
    };
    handlerRef.current = handler;
    window.addEventListener('devicemotion', handler);
    setListening(true);
  };

  /** Stops the accelerometer stream */
  const stopListening = () => {
    if (handlerRef.current) window.removeEventListener('devicemotion', handlerRef.current);
    handlerRef.current = null;
    setListening(false);
  };

  useEffect(() => {
    return () => {
      if (handlerRef.current) window.removeEventListener('devicemotion', handlerRef.current);
    };
  }, []);

  return (
    <div className="rounded-lg border border-line bg-surface-card p-4 space-y-3">
      <h3 className="text-sm font-semibold text-fg">Sensor Probe</h3>
      <div className="flex flex-wrap gap-2">
        <Pill label="Geolocation" on={probe.geolocation} />
        <Pill label="DeviceMotion" on={probe.deviceMotion} />
        <Pill label="Motion permission API (iOS)" on={probe.motionPermissionApi} />
        <Pill label="PressureSensor (floors)" on={probe.pressureSensor} />
        <Pill label="WakeLock" on={probe.wakeLock} />
      </div>
      <div className="flex items-center gap-3">
        {!listening && (
          <button
            type="button"
            onClick={() => void startListening()}
            disabled={!probe.deviceMotion}
            className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-fg-on-accent disabled:opacity-50"
          >
            Start accel stream
          </button>
        )}
        {listening && (
          <button
            type="button"
            onClick={stopListening}
            className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-fg-muted"
          >
            Stop
          </button>
        )}
        <span className="font-mono text-xs tabular-nums text-fg-muted">
          {probe.lastMagnitude === null && 'no samples'}
          {probe.lastMagnitude !== null &&
            `${probe.lastMagnitude.toFixed(2)} m/s² · ${probe.sampleCount} samples`}
        </span>
      </div>
      <p className="text-[10px] text-fg-muted">
        Floors need the barometer (PressureSensor) — budget devices often lack it; GPS-altitude
        fallback applies. Raw samples are never persisted.
      </p>
    </div>
  );
}

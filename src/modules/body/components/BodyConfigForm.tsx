import { useState, useMemo, useCallback } from 'react';

import type { BodyConfig } from '@/modules/body/types';
import { DEFAULT_BODY_CONFIG } from '@/modules/body/types';
import { FLOOR_HEIGHT_OPTIONS, SCORING_WEIGHTS } from '@/modules/body/constants';
import { BodyMsg } from '@/constants/messages';
import { useToast } from '@/shared/errors/useToast';

type ActivityToggle = { key: keyof Pick<BodyConfig, 'floors' | 'walking' | 'running' | 'cycling' | 'yoga'>; label: string; disabled: boolean };

const ACTIVITY_TOGGLES: ActivityToggle[] = [
  { key: 'floors', label: 'Floors', disabled: false },
  { key: 'walking', label: 'Walking', disabled: false },
  { key: 'running', label: 'Running', disabled: false },
  { key: 'cycling', label: 'Cycling', disabled: false },
  { key: 'yoga', label: 'Yoga (coming soon)', disabled: true },
];

/** Goal builder slider definitions — only shown for enabled activities */
const GOAL_SLIDERS = [
  { key: 'floors' as const, id: 'goal-floors-up', label: 'Floors Up', icon: '🪜', min: 0, max: 30, step: 1, unit: '', weight: SCORING_WEIGHTS.FLOOR_UP, defaultVal: 10 },
  { key: 'floors' as const, id: 'goal-floors-down', label: 'Floors Down', icon: '⬇', min: 0, max: 30, step: 1, unit: '', weight: SCORING_WEIGHTS.FLOOR_DOWN, defaultVal: 5 },
  { key: 'walking' as const, id: 'goal-walk', label: 'Walk', icon: '🚶', min: 0, max: 10, step: 0.5, unit: 'km', weight: SCORING_WEIGHTS.WALK_PER_KM, defaultVal: 2 },
  { key: 'running' as const, id: 'goal-run', label: 'Run', icon: '🏃', min: 0, max: 10, step: 0.5, unit: 'km', weight: SCORING_WEIGHTS.RUN_PER_KM, defaultVal: 1 },
  { key: 'cycling' as const, id: 'goal-cycle', label: 'Cycle', icon: '🚴', min: 0, max: 20, step: 0.5, unit: 'km', weight: SCORING_WEIGHTS.CYCLE_PER_KM, defaultVal: 0 },
];

/** Zone definitions for goal feedback */
const ZONES = [
  { max: 20, name: 'Easy Start', hint: 'A few floors, maybe a short stroll.', color: 'text-success' },
  { max: 40, name: 'Light Day', hint: 'Some floors and a walk. Gentle nudge.', color: 'text-accent' },
  { max: 65, name: 'Solid Day', hint: "Good mix of activities. You'll hit this most days.", color: 'text-accent' },
  { max: 90, name: 'Push It', hint: 'Floors + a walk + a run. You meant it.', color: 'text-warning' },
  { max: 120, name: 'High Gear', hint: 'Serious activity day.', color: 'text-warning' },
  { max: Infinity, name: 'Beast Mode', hint: "The full package. You're crushing it.", color: 'text-error' },
];

/** Preset day compositions */
const PRESETS = [
  { label: '🌿 Chill', values: { 'goal-floors-up': 5, 'goal-floors-down': 3, 'goal-walk': 1, 'goal-run': 0, 'goal-cycle': 0 } },
  { label: '💪 Solid', values: { 'goal-floors-up': 10, 'goal-floors-down': 8, 'goal-walk': 2, 'goal-run': 1, 'goal-cycle': 0 } },
  { label: '🔥 Push It', values: { 'goal-floors-up': 15, 'goal-floors-down': 10, 'goal-walk': 3, 'goal-run': 2, 'goal-cycle': 0 } },
  { label: '⚡ Beast', values: { 'goal-floors-up': 25, 'goal-floors-down': 15, 'goal-walk': 5, 'goal-run': 3, 'goal-cycle': 0 } },
];

/** Form for configuring which body activities to track and daily goal */
export function BodyConfigForm({
  initial,
  onSave,
}: {
  initial?: BodyConfig;
  onSave: (config: BodyConfig) => Promise<void>;
}) {
  const { addToast } = useToast();
  const [config, setConfig] = useState<BodyConfig>(initial ?? DEFAULT_BODY_CONFIG);
  const [saving, setSaving] = useState(false);
  const [sliderValues, setSliderValues] = useState<Record<string, number>>(() => {
    const defaults: Record<string, number> = {};
    GOAL_SLIDERS.forEach((s) => { defaults[s.id] = s.defaultVal; });
    return defaults;
  });

  const toggleActivity = (key: ActivityToggle['key']) => {
    setConfig((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const setFloorHeight = (height: number) => {
    setConfig((prev) => ({ ...prev, floorHeight: height }));
  };

  /** Active sliders based on enabled activities */
  const activeSliders = useMemo(() => {
    return GOAL_SLIDERS.filter((s) => config[s.key]);
  }, [config]);

  /** Computed goal from slider values */
  const computedGoal = useMemo(() => {
    let total = 0;
    for (const s of activeSliders) {
      total += (sliderValues[s.id] ?? 0) * s.weight;
    }
    return Math.round(total * 10) / 10;
  }, [activeSliders, sliderValues]);

  /** Current zone based on computed goal */
  const zone = useMemo(() => {
    return ZONES.find((z) => computedGoal <= z.max) ?? ZONES[ZONES.length - 1]!;
  }, [computedGoal]) as (typeof ZONES)[number];

  /** Update a single slider value */
  const setSlider = useCallback((id: string, value: number) => {
    setSliderValues((prev) => ({ ...prev, [id]: value }));
  }, []);

  /** Apply a preset */
  const applyPreset = useCallback((preset: typeof PRESETS[number]) => {
    setSliderValues((prev) => ({ ...prev, ...preset.values }));
  }, []);

  /** Sync computed goal into config before saving */
  const handleSave = async () => {
    const hasAny = config.floors || config.walking || config.running || config.cycling || config.yoga;
    if (!hasAny) {
      addToast(BodyMsg.AtLeastOneActivity, 'error');
      return;
    }
    setSaving(true);
    try {
      await onSave({ ...config, dailyGoal: Math.round(computedGoal) || 50 });
    } finally {
      setSaving(false);
    }
  };

  /** Score ring percentage */
  const ringPct = Math.min(computedGoal / 160, 1);
  const ringCirc = 2 * Math.PI * 42;
  const ringOffset = ringCirc - ringPct * ringCirc;

  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      <div>
        <h2 className="text-lg font-semibold text-fg">Configure Body Tracking</h2>
        <p className="text-sm text-fg-muted mt-1">Choose activities, then build your daily goal.</p>
      </div>

      {/* Activity toggles */}
      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-medium text-fg-muted uppercase tracking-wide">Activities</h3>
        {
ACTIVITY_TOGGLES.map((toggle) => (
          <label
            key={toggle.key}
            className={
              `flex items-center justify-between rounded-lg bg-surface-card border border-line px-4 py-3 ${
                toggle.disabled ? 'opacity-50' : 'cursor-pointer'
              }`
            }
          >
            <span className="text-sm font-medium text-fg">{toggle.label}</span>
            <input
              type="checkbox"
              checked={config[toggle.key]}
              disabled={toggle.disabled}
              onChange={() => toggleActivity(toggle.key)}
              className="h-5 w-5 rounded border-line text-accent accent-accent"
            />
          </label>
        ))
}
      </div>

      {/* Floor height */}
      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-medium text-fg-muted uppercase tracking-wide">Floor Height</h3>
        <div className="flex gap-2">
          {
FLOOR_HEIGHT_OPTIONS.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => setFloorHeight(h)}
              className={
                `flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  config.floorHeight === h
                    ? 'bg-accent text-fg-on-accent'
                    : 'bg-surface-card text-fg border border-line'
                }`
              }
            >
              {h}m
            </button>
          ))
}
        </div>
      </div>

      {/* Daily Goal Builder */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-medium text-fg-muted uppercase tracking-wide">Your Daily Challenge</h3>

        {/* Ring + Zone */}
        <div className="flex items-center justify-center gap-5 py-2">
          <div className="relative" style={{ width: 100, height: 100 }}>
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="var(--line)" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="42" fill="none" strokeWidth="8" strokeLinecap="round"
                stroke="var(--accent)"
                strokeDasharray={ringCirc}
                strokeDashoffset={ringOffset}
                className="transition-[stroke-dashoffset] duration-300 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-extrabold text-fg">{Math.round(computedGoal)}</span>
              <span className="text-[9px] font-semibold text-fg-muted uppercase tracking-wider">Goal</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className={`text-lg font-extrabold ${zone.color}`}>{zone.name}</span>
            <span className="text-xs text-fg-muted leading-relaxed max-w-[180px]">{zone.hint}</span>
          </div>
        </div>

        {/* Presets */}
        <div className="flex gap-2">
          {
PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => applyPreset(p)}
              className="flex-1 rounded-lg border border-line bg-surface-card px-2 py-2 text-center text-xs font-bold text-fg transition-colors hover:border-accent hover:bg-[var(--accent-muted)] active:scale-95"
            >
              {p.label}
            </button>
          ))
}
        </div>

        {/* Activity sliders */}
        <div className="rounded-xl bg-surface-card border border-line p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-fg-muted uppercase tracking-wide">Build your day</span>
            <span className="text-sm font-extrabold text-accent">= {computedGoal} pts</span>
          </div>

          <div className="flex flex-col gap-0.5">
            {
activeSliders.map((s) => {
              const val = sliderValues[s.id] ?? 0;
              const pts = Math.round(val * s.weight * 10) / 10;
              return (
                <div key={s.id} className="flex items-center gap-2.5 py-2 border-b border-line last:border-b-0">
                  <span className="text-base w-6 text-center">{s.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-fg">{s.label}</span>
                      <span className="text-xs font-bold text-fg-muted tabular-nums">
                        {val}{s.unit ? ` ${s.unit}` : ''} → <span className="text-accent">{pts} pts</span>
                      </span>
                    </div>
                    <input
                      type="range"
                      min={s.min}
                      max={s.max}
                      step={s.step}
                      value={val}
                      onChange={(e) => setSlider(s.id, Number(e.target.value))}
                      className="w-full h-1 rounded-full bg-line accent-accent appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-surface-card [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-accent [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:cursor-pointer"
                    />
                  </div>
                </div>
              );
            })
}
          </div>

          {/* Legend — only enabled activities */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 pt-3 border-t border-line">
            {
config.floors && (
              <span className="text-[10px] text-fg-muted">
                <span className="font-bold rounded bg-surface px-1.5 py-0.5">↑×{SCORING_WEIGHTS.FLOOR_UP}</span>{' '}
                <span className="font-bold rounded bg-surface px-1.5 py-0.5">↓×{SCORING_WEIGHTS.FLOOR_DOWN}</span>
              </span>
            )
}
            {
config.walking && (
              <span className="text-[10px] text-fg-muted font-bold rounded bg-surface px-1.5 py-0.5">walk km×{SCORING_WEIGHTS.WALK_PER_KM}</span>
            )
}
            {
config.running && (
              <span className="text-[10px] text-fg-muted font-bold rounded bg-surface px-1.5 py-0.5">run km×{SCORING_WEIGHTS.RUN_PER_KM}</span>
            )
}
            {
config.cycling && (
              <span className="text-[10px] text-fg-muted font-bold rounded bg-surface px-1.5 py-0.5">cycle km×{SCORING_WEIGHTS.CYCLE_PER_KM}</span>
            )
}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="rounded-lg bg-accent px-4 py-3 text-fg-on-accent font-medium disabled:opacity-40 active:scale-95 transition-transform"
      >
        {saving ? 'Saving...' : 'Save Configuration'}
      </button>
    </div>
  );
}

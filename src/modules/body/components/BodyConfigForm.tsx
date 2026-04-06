import { useState } from 'react';

import type { BodyConfig } from '@/modules/body/types';
import { DEFAULT_BODY_CONFIG } from '@/modules/body/types';
import { FLOOR_HEIGHT_OPTIONS } from '@/modules/body/constants';
import { BodyMsg } from '@/constants/messages';
import { useToast } from '@/shared/errors/useToast';

type ActivityToggle = { key: keyof Pick<BodyConfig, 'floors' | 'walking' | 'running' | 'cycling' | 'yoga'>; label: string; disabled: boolean };

const ACTIVITY_TOGGLES: ActivityToggle[] = [
  { key: 'floors', label: 'Floors', disabled: false },
  { key: 'walking', label: 'Walking', disabled: false },
  { key: 'running', label: 'Running', disabled: false },
  { key: 'cycling', label: 'Cycling (coming soon)', disabled: true },
  { key: 'yoga', label: 'Yoga (coming soon)', disabled: true },
];

/** Form for configuring which body activities to track */
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

  const toggleActivity = (key: ActivityToggle['key']) => {
    setConfig((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const setFloorHeight = (height: number) => {
    setConfig((prev) => ({ ...prev, floorHeight: height }));
  };

  const handleSave = async () => {
    const hasAny = config.floors || config.walking || config.running || config.cycling || config.yoga;
    if (!hasAny) {
      addToast(BodyMsg.AtLeastOneActivity, 'error');
      return;
    }
    setSaving(true);
    try {
      await onSave(config);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      <div>
        <h2 className="text-lg font-semibold text-fg">Configure Body Tracking</h2>
        <p className="text-sm text-fg-muted mt-1">Choose which activities you want to track.</p>
      </div>

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

import { useState } from 'react';

import { useChildren } from '@/modules/baby/hooks/useChildren';
import { DEFAULT_CHILD_CONFIG } from '@/modules/baby/constants';
import type { ChildConfig } from '@/modules/baby/types';
import { todayStr } from '@/shared/utils/date';

/** Form for adding a new child with name, DOB, and tracking module toggles */
export function AddChild({ onAdded }: { onAdded?: () => void }) {
  const { addChild } = useChildren();
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [config, setConfig] = useState<ChildConfig>({ ...DEFAULT_CHILD_CONFIG });
  const [saving, setSaving] = useState(false);

  /** Toggles a config flag on/off */
  function toggleConfig(key: keyof ChildConfig) {
    setConfig((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  /** Handles form submission */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !dob) return;

    setSaving(true);
    const now = new Date().toISOString();
    await addChild({
      name: name.trim(),
      dob,
      config,
      createdAt: now,
      updatedAt: now,
    });
    setName('');
    setDob('');
    setConfig({ ...DEFAULT_CHILD_CONFIG });
    setSaving(false);
    onAdded?.();
  }

  const configOptions: { key: keyof ChildConfig; label: string }[] = [
    { key: 'feeding', label: 'Feeding' },
    { key: 'sleep', label: 'Sleep' },
    { key: 'growth', label: 'Growth' },
    { key: 'diapers', label: 'Diapers' },
  ];

  return (
    <div className="rounded-xl bg-surface-card border border-line p-6">
      <h2 className="text-lg font-semibold text-fg mb-4">Add Child</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-fg-muted">Name *</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Baby's name"
            required
            className="w-full px-3 py-2 rounded-lg bg-surface-card border border-line text-fg"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-fg-muted">Date of Birth *</span>
          <input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            max={todayStr()}
            required
            className="w-full px-3 py-2 rounded-lg bg-surface-card border border-line text-fg"
          />
        </label>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm text-fg-muted mb-1">Tracking Modules</legend>
          {
configOptions.map((opt) => (
            <label key={opt.key} className="flex items-center gap-2 text-sm text-fg">
              <input
                type="checkbox"
                checked={config[opt.key]}
                onChange={() => toggleConfig(opt.key)}
                className="rounded border-line"
              />
              {opt.label}
            </label>
          ))
}
        </fieldset>

        <button
          type="submit"
          disabled={saving || !name.trim() || !dob}
          className="w-full py-3 rounded-lg bg-accent text-fg-on-accent font-medium disabled:opacity-50"
        >
          {saving && 'Saving...'}
          {!saving && 'Add Child'}
        </button>
      </form>
    </div>
  );
}

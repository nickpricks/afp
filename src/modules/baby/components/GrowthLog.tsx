import { useState } from 'react';

import { useBabyData } from '@/modules/baby/hooks/useBabyData';
import type { GrowthEntry } from '@/modules/baby/types';
import { todayStr } from '@/shared/utils/date';

/** Growth measurement form with weight, height, head circumference and recent entries */
export function GrowthLog() {
  const { growth, logGrowth } = useBabyData();
  const [date, setDate] = useState(todayStr);
  const [weight, setWeight] = useState(0);
  const [height, setHeight] = useState(0);
  const [headCircumference, setHeadCircumference] = useState(0);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  /** Handles form submission */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await logGrowth({ date, weight, height, headCircumference, notes });
    setWeight(0);
    setHeight(0);
    setHeadCircumference(0);
    setNotes('');
    setSaving(false);
  }

  const recentGrowth = [...growth]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10);

  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-surface-card border border-line text-fg"
        />

        <label className="flex flex-col gap-1">
          <span className="text-sm text-fg-muted">Weight (kg)</span>
          <input
            type="number"
            min={0}
            step={0.01}
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg bg-surface-card border border-line text-fg"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-fg-muted">Height (cm)</span>
          <input
            type="number"
            min={0}
            step={0.1}
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg bg-surface-card border border-line text-fg"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-fg-muted">Head Circumference (cm)</span>
          <input
            type="number"
            min={0}
            step={0.1}
            value={headCircumference}
            onChange={(e) => setHeadCircumference(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg bg-surface-card border border-line text-fg"
          />
        </label>

        <input
          type="text"
          placeholder="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-surface-card border border-line text-fg"
        />

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 rounded-lg bg-accent text-fg-on-accent font-medium disabled:opacity-50"
        >
          {saving && 'Saving...'}
          {!saving && 'Log Growth'}
        </button>
      </form>

      <RecentGrowth entries={recentGrowth} />
    </div>
  );
}

/** Renders a sorted list of recent growth measurements */
function RecentGrowth({ entries }: { entries: GrowthEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium text-fg-muted">Recent Measurements</h3>
      {
entries.map((entry) => (
        <div key={entry.id} className="rounded-lg bg-surface-card border border-line p-3">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-fg">{entry.date}</span>
          </div>
          <p className="text-xs text-fg-muted mt-1">
            {entry.weight} kg &middot; {entry.height} cm &middot; HC {entry.headCircumference} cm
          </p>
          {
entry.notes && (
            <p className="text-xs text-fg-muted mt-1">{entry.notes}</p>
          )
}
        </div>
      ))
}
    </div>
  );
}

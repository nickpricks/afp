import { useState } from 'react';

import { useBabyData } from '@/modules/baby/hooks/useBabyData';
import type { GrowthEntry } from '@/modules/baby/types';
import { todayStr } from '@/shared/utils/date';

/** Growth measurement form with weight, height, head circumference and recent entries */
export function GrowthLog({ childId }: { childId?: string }) {
  const { growth, logGrowth, removeGrowth } = useBabyData(childId ?? null);
  const [date, setDate] = useState(todayStr);
  const [weight, setWeight] = useState<number | null>(null);
  const [height, setHeight] = useState<number | null>(null);
  const [headCircumference, setHeadCircumference] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  /** Handles form submission */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const now = new Date().toISOString();
    await logGrowth({ date, weight, height, headCircumference, createdAt: now, notes });
    setWeight(null);
    setHeight(null);
    setHeadCircumference(null);
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
            value={weight ?? ''}
            onChange={(e) => setWeight(e.target.value ? Number(e.target.value) : null)}
            className="w-full px-3 py-2 rounded-lg bg-surface-card border border-line text-fg"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-fg-muted">Height (cm)</span>
          <input
            type="number"
            min={0}
            step={0.1}
            value={height ?? ''}
            onChange={(e) => setHeight(e.target.value ? Number(e.target.value) : null)}
            className="w-full px-3 py-2 rounded-lg bg-surface-card border border-line text-fg"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-fg-muted">Head Circumference (cm)</span>
          <input
            type="number"
            min={0}
            step={0.1}
            value={headCircumference ?? ''}
            onChange={(e) => setHeadCircumference(e.target.value ? Number(e.target.value) : null)}
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

      <RecentGrowth entries={recentGrowth} onRemove={removeGrowth} />
    </div>
  );
}

/** Renders a sorted list of recent growth measurements with delete action */
function RecentGrowth({ entries, onRemove }: { entries: GrowthEntry[]; onRemove: (id: string) => Promise<void> }) {
  if (entries.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium text-fg-muted">Recent Measurements</h3>
      {
entries.map((entry) => (
        <div key={entry.id} className="rounded-lg bg-surface-card border border-line p-3">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-fg">{entry.date}</span>
            <button
              type="button"
              aria-label="Delete"
              onClick={() => onRemove(entry.id)}
              className="text-xs text-fg-muted hover:text-red-500 transition-colors"
            >
              x
            </button>
          </div>
          <p className="text-xs text-fg-muted mt-1">
            {entry.weight !== null && `${entry.weight} kg`}
            {entry.weight !== null && entry.height !== null && ' \u00B7 '}
            {entry.height !== null && `${entry.height} cm`}
            {(entry.weight !== null || entry.height !== null) && entry.headCircumference !== null && ' \u00B7 '}
            {entry.headCircumference !== null && `HC ${entry.headCircumference} cm`}
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

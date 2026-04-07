import { useState } from 'react';

import { useBabyData } from '@/modules/baby/hooks/useBabyData';
import type { SleepEntry } from '@/modules/baby/types';
import { SleepType, SleepQuality } from '@/modules/baby/types';
import { ALL_SLEEP_TYPES, ALL_SLEEP_QUALITIES, SLEEP_TYPE_LABELS, SLEEP_QUALITY_LABELS } from '@/modules/baby/constants';
import { todayStr } from '@/shared/utils/date';

/** Sleep tracking form with type/quality selection and recent entries list */
export function SleepLog({ childId }: { childId?: string }) {
  const { sleeps, logSleep, removeSleep } = useBabyData(childId ?? null);
  const [type, setType] = useState<SleepType>(SleepType.Nap);
  const [quality, setQuality] = useState<SleepQuality | null>(SleepQuality.Good);
  const [date, setDate] = useState(todayStr);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  /** Handles form submission */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const now = new Date().toISOString();
    await logSleep({
      date,
      startTime,
      endTime,
      type,
      quality,
      timestamp: now,
      createdAt: now,
      notes,
    });
    setStartTime('');
    setEndTime('');
    setNotes('');
    setSaving(false);
  }

  const recentSleeps = [...sleeps]
    .sort((a, b) => `${b.date}T${b.startTime}`.localeCompare(`${a.date}T${a.startTime}`))
    .slice(0, 10);

  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex gap-2">
          {
ALL_SLEEP_TYPES.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setType(st)}
              className={
`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                type === st
                  ? 'bg-accent text-fg-on-accent'
                  : 'bg-surface-card text-fg border border-line'
              }`
}
            >
              {SLEEP_TYPE_LABELS[st]}
            </button>
          ))
}
        </div>

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-surface-card border border-line text-fg"
        />

        <div className="flex gap-3">
          <label className="flex flex-1 flex-col gap-1">
            <span className="text-sm text-fg-muted">Start Time</span>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-surface-card border border-line text-fg"
            />
          </label>
          <label className="flex flex-1 flex-col gap-1">
            <span className="text-sm text-fg-muted">End Time</span>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-surface-card border border-line text-fg"
            />
          </label>
        </div>

        <div className="flex gap-2">
          {
ALL_SLEEP_QUALITIES.map((sq) => (
            <button
              key={sq}
              type="button"
              onClick={() => setQuality(sq)}
              className={
`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                quality === sq
                  ? 'bg-accent text-fg-on-accent'
                  : 'bg-surface-card text-fg border border-line'
              }`
}
            >
              {SLEEP_QUALITY_LABELS[sq]}
            </button>
          ))
}
        </div>

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
          {!saving && 'Log Sleep'}
        </button>
      </form>

      <RecentSleeps entries={recentSleeps} onRemove={removeSleep} />
    </div>
  );
}

/** Renders a sorted list of recent sleep entries with delete action */
function RecentSleeps({ entries, onRemove }: { entries: SleepEntry[]; onRemove: (id: string) => Promise<void> }) {
  if (entries.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium text-fg-muted">Recent Sleep</h3>
      {
entries.map((entry) => (
        <div key={entry.id} className="rounded-lg bg-surface-card border border-line p-3">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-fg">{SLEEP_TYPE_LABELS[entry.type]}</span>
            <div className="flex items-center gap-2">
              <span className="text-fg-muted">{entry.date}</span>
              <button
                type="button"
                aria-label="Delete"
                onClick={() => onRemove(entry.id)}
                className="text-xs text-fg-muted hover:text-red-500 transition-colors"
              >
                x
              </button>
            </div>
          </div>
          <p className="text-xs text-fg-muted mt-1">
            {entry.startTime} &ndash; {entry.endTime}
            {entry.quality !== null && ` \u00B7 ${SLEEP_QUALITY_LABELS[entry.quality]}`}
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

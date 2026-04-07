import { useState } from 'react';

import { useBabyData } from '@/modules/baby/hooks/useBabyData';
import type { DiaperEntry } from '@/modules/baby/types';
import { DiaperType } from '@/modules/baby/types';
import { ALL_DIAPER_TYPES, DIAPER_TYPE_LABELS } from '@/modules/baby/constants';
import { todayStr, nowTime } from '@/shared/utils/date';

/** Diaper tracking form with quick-log buttons and recent entries list */
export function DiaperLog({ childId }: { childId?: string }) {
  const { diapers, logDiaper, removeDiaper } = useBabyData(childId ?? null);
  const [type, setType] = useState<DiaperType>(DiaperType.Wet);
  const [date, setDate] = useState(todayStr);
  const [time, setTime] = useState(nowTime);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  /** Handles form submission */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const now = new Date().toISOString();
    await logDiaper({ date, time, type, timestamp: now, createdAt: now, notes });
    setNotes('');
    setTime(nowTime());
    setSaving(false);
  }

  /** Logs a diaper entry immediately with the given type and current date/time */
  async function quickLog(quickType: DiaperType) {
    setSaving(true);
    const now = new Date().toISOString();
    await logDiaper({
      date: todayStr(),
      time: nowTime(),
      type: quickType,
      timestamp: now,
      createdAt: now,
      notes: '',
    });
    setSaving(false);
  }

  const recentDiapers = [...diapers]
    .sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`))
    .slice(0, 10);

  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      <div className="flex gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={() => quickLog(DiaperType.Wet)}
          className="flex-1 py-3 rounded-lg bg-surface-card text-fg border border-line font-medium disabled:opacity-50 active:scale-95 transition-transform"
        >
          Quick Wet
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => quickLog(DiaperType.Dirty)}
          className="flex-1 py-3 rounded-lg bg-surface-card text-fg border border-line font-medium disabled:opacity-50 active:scale-95 transition-transform"
        >
          Quick Dirty
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex gap-2">
          {
ALL_DIAPER_TYPES.map((dt) => (
            <button
              key={dt}
              type="button"
              onClick={() => setType(dt)}
              className={
`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                type === dt
                  ? 'bg-accent text-fg-on-accent'
                  : 'bg-surface-card text-fg border border-line'
              }`
}
            >
              {DIAPER_TYPE_LABELS[dt]}
            </button>
          ))
}
        </div>

        <div className="flex gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-surface-card border border-line text-fg"
          />
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-surface-card border border-line text-fg"
          />
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
          {!saving && 'Log Diaper'}
        </button>
      </form>

      <RecentDiapers entries={recentDiapers} onRemove={removeDiaper} />
    </div>
  );
}

/** Renders a sorted list of recent diaper entries with delete action */
function RecentDiapers({ entries, onRemove }: { entries: DiaperEntry[]; onRemove: (id: string) => Promise<void> }) {
  if (entries.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium text-fg-muted">Recent Diapers</h3>
      {
entries.map((entry) => (
        <div key={entry.id} className="rounded-lg bg-surface-card border border-line p-3">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-fg">{DIAPER_TYPE_LABELS[entry.type]}</span>
            <div className="flex items-center gap-2">
              <span className="text-fg-muted">{entry.date} {entry.time}</span>
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

import { useState } from 'react';

import { useBabyData } from '@/modules/baby/hooks/useBabyData';
import type { DiaperEntry } from '@/modules/baby/types';
import { DIAPER_TYPES } from '@/modules/baby/constants';
import { todayStr, nowTime } from '@/shared/utils/date';

/** Diaper tracking form with quick-log buttons and recent entries list */
export function DiaperLog() {
  const { diapers, logDiaper } = useBabyData();
  const [type, setType] = useState<(typeof DIAPER_TYPES)[number]>(DIAPER_TYPES[0]);
  const [date, setDate] = useState(todayStr);
  const [time, setTime] = useState(nowTime);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  /** Handles form submission */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await logDiaper({ date, time, type, notes });
    setNotes('');
    setTime(nowTime());
    setSaving(false);
  }

  /** Logs a diaper entry immediately with the given type and current date/time */
  async function quickLog(quickType: (typeof DIAPER_TYPES)[number]) {
    setSaving(true);
    await logDiaper({ date: todayStr(), time: nowTime(), type: quickType, notes: '' });
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
          onClick={() => quickLog('Wet')}
          className="flex-1 py-3 rounded-lg bg-surface-card text-fg border border-line font-medium disabled:opacity-50 active:scale-95 transition-transform"
        >
          Quick Wet
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => quickLog('Dirty')}
          className="flex-1 py-3 rounded-lg bg-surface-card text-fg border border-line font-medium disabled:opacity-50 active:scale-95 transition-transform"
        >
          Quick Dirty
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex gap-2">
          {
DIAPER_TYPES.map((dt) => (
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
              {dt}
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

      <RecentDiapers entries={recentDiapers} />
    </div>
  );
}

/** Renders a sorted list of recent diaper entries */
function RecentDiapers({ entries }: { entries: DiaperEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium text-fg-muted">Recent Diapers</h3>
      {
entries.map((entry) => (
        <div key={entry.id} className="rounded-lg bg-surface-card border border-line p-3">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-fg">{entry.type}</span>
            <span className="text-fg-muted">{entry.date} {entry.time}</span>
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

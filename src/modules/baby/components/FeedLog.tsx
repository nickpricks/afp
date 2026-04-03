import { useState } from 'react';

import { useBabyData } from '@/modules/baby/hooks/useBabyData';
import type { FeedEntry } from '@/modules/baby/types';
import { FEED_TYPES } from '@/modules/baby/constants';
import { todayStr, nowTime } from '@/shared/utils/date';

/** Determines whether the feed type uses quantity (Bottle/Solid Food) */
function isQuantityType(type: string): boolean {
  return type === 'Bottle' || type === 'Solid Food';
}

/** Determines whether the feed type uses duration (Breast types) */
function isDurationType(type: string): boolean {
  return type.startsWith('Breast');
}

/** Feed tracking form with type selection and recent entries list */
export function FeedLog() {
  const { feeds, logFeed } = useBabyData();
  const [type, setType] = useState<(typeof FEED_TYPES)[number]>(FEED_TYPES[0]);
  const [date, setDate] = useState(todayStr);
  const [time, setTime] = useState(nowTime);
  const [quantity, setQuantity] = useState(0);
  const [duration, setDuration] = useState(0);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  /** Handles form submission */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await logFeed({ date, time, type, quantity, duration, notes });
    setQuantity(0);
    setDuration(0);
    setNotes('');
    setTime(nowTime());
    setSaving(false);
  }

  const recentFeeds = [...feeds]
    .sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`))
    .slice(0, 10);

  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {
FEED_TYPES.map((ft) => (
            <button
              key={ft}
              type="button"
              onClick={() => setType(ft)}
              className={
`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                type === ft
                  ? 'bg-accent text-fg-on-accent'
                  : 'bg-surface-card text-fg border border-line'
              }`
}
            >
              {ft}
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

        {
isQuantityType(type) && (
          <label className="flex flex-col gap-1">
            <span className="text-sm text-fg-muted">Quantity (ml/g)</span>
            <input
              type="number"
              min={0}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-surface-card border border-line text-fg"
            />
          </label>
        )
}

        {
isDurationType(type) && (
          <label className="flex flex-col gap-1">
            <span className="text-sm text-fg-muted">Duration (minutes)</span>
            <input
              type="number"
              min={0}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-surface-card border border-line text-fg"
            />
          </label>
        )
}

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
          {!saving && 'Log Feed'}
        </button>
      </form>

      <RecentFeeds entries={recentFeeds} />
    </div>
  );
}

/** Renders a sorted list of recent feed entries */
function RecentFeeds({ entries }: { entries: FeedEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium text-fg-muted">Recent Feeds</h3>
      {
entries.map((entry) => (
        <div key={entry.id} className="rounded-lg bg-surface-card border border-line p-3">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-fg">{entry.type}</span>
            <span className="text-fg-muted">{entry.date} {entry.time}</span>
          </div>
          {
entry.quantity > 0 && (
            <p className="text-xs text-fg-muted mt-1">{entry.quantity} ml/g</p>
          )
}
          {
entry.duration > 0 && (
            <p className="text-xs text-fg-muted mt-1">{entry.duration} min</p>
          )
}
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

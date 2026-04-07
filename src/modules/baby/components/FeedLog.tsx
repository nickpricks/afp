import { useState } from 'react';

import { useBabyData } from '@/modules/baby/hooks/useBabyData';
import type { FeedEntry } from '@/modules/baby/types';
import { FeedType } from '@/modules/baby/types';
import { ALL_FEED_TYPES, FEED_TYPE_LABELS } from '@/modules/baby/constants';
import { todayStr, nowTime } from '@/shared/utils/date';

/** Determines whether the feed type uses amount (Bottle/Solid Food) */
function isAmountType(type: FeedType): boolean {
  return type === FeedType.Bottle || type === FeedType.SolidFood;
}

/** Feed tracking form with type selection and recent entries list */
export function FeedLog({ childId }: { childId?: string }) {
  const { feeds, logFeed, removeFeed } = useBabyData(childId ?? null);
  const [type, setType] = useState<FeedType>(FeedType.Bottle);
  const [date, setDate] = useState(todayStr);
  const [time, setTime] = useState(nowTime);
  const [amount, setAmount] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  /** Handles form submission */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const now = new Date().toISOString();
    await logFeed({
      date,
      time,
      type,
      amount: isAmountType(type) ? amount : null,
      timestamp: now,
      createdAt: now,
      notes,
    });
    setAmount(null);
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
ALL_FEED_TYPES.map((ft) => (
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
              {FEED_TYPE_LABELS[ft]}
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
isAmountType(type) && (
          <label className="flex flex-col gap-1">
            <span className="text-sm text-fg-muted">Amount (ml/g)</span>
            <input
              type="number"
              min={0}
              value={amount ?? ''}
              onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : null)}
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

      <RecentFeeds entries={recentFeeds} onRemove={removeFeed} />
    </div>
  );
}

/** Renders a sorted list of recent feed entries with delete action */
function RecentFeeds({ entries, onRemove }: { entries: FeedEntry[]; onRemove: (id: string) => Promise<void> }) {
  if (entries.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium text-fg-muted">Recent Feeds</h3>
      {
entries.map((entry) => (
        <div key={entry.id} className="rounded-lg bg-surface-card border border-line p-3">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-fg">{FEED_TYPE_LABELS[entry.type]}</span>
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
entry.amount !== null && entry.amount > 0 && (
            <p className="text-xs text-fg-muted mt-1">{entry.amount} ml/g</p>
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

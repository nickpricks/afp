import { useState, useRef } from 'react';

import { useBabyData } from '@/modules/baby/hooks/useBabyData';
import type { FeedEntry } from '@/modules/baby/types';
import { FeedType } from '@/modules/baby/types';
import { ALL_FEED_TYPES, FEED_TYPE_LABELS } from '@/modules/baby/constants';
import { todayStr, nowTime } from '@/shared/utils/date';
import { useToast } from '@/shared/errors/useToast';
import { CONFIG } from '@/constants/config';

/** Determines whether the feed type uses amount (Bottle/Solid Food) */
function isAmountType(type: FeedType): boolean {
  return type === FeedType.Bottle || type === FeedType.SolidFood;
}

/** Feed tracking form with type selection and recent entries list */
export function FeedLog({ childId }: { childId?: string }) {
  const { feeds, logFeed, updateFeed, removeFeed } = useBabyData(childId ?? null);
  const { addToast } = useToast();
  const [type, setType] = useState<FeedType>(FeedType.Bottle);
  const [date, setDate] = useState(todayStr);
  const [time, setTime] = useState(nowTime);
  const [amount, setAmount] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [editEntry, setEditEntry] = useState<FeedEntry | null>(null);
  const [limit, setLimit] = useState(CONFIG.PAGE_SIZE);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const undoRef = useRef(false);

  /** Populates form fields from the selected entry for editing */
  const startEdit = (entry: FeedEntry) => {
    setEditEntry(entry);
    setType(entry.type);
    setDate(entry.date);
    setTime(entry.time);
    setAmount(entry.amount);
    setNotes(entry.notes);
  };

  /** Handles form submission — create or update */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const now = new Date().toISOString();

    if (editEntry) {
      await updateFeed({ ...editEntry, date, time, type, amount: isAmountType(type) ? amount : null, notes });
      setEditEntry(null);
    } else {
      await logFeed({ date, time, type, amount: isAmountType(type) ? amount : null, timestamp: now, createdAt: now, notes });
    }

    setAmount(null);
    setNotes('');
    setTime(nowTime());
    setSaving(false);
  }

  const handleCancelEdit = () => {
    setEditEntry(null);
    setType(FeedType.Bottle);
    setDate(todayStr());
    setTime(nowTime());
    setAmount(null);
    setNotes('');
  };

  const handleUndoDelete = (id: string) => {
    undoRef.current = false;
    setPendingDeleteId(id);
    addToast('Feed deleted', 'info', {
      durationMs: CONFIG.UNDO_DURATION_MS,
      action: { label: 'Undo', onClick: () => { undoRef.current = true; setPendingDeleteId(null); } },
    });
    setTimeout(() => {
      if (!undoRef.current) removeFeed(id);
      setPendingDeleteId(null);
    }, CONFIG.UNDO_DURATION_MS);
  };

  const sortedFeeds = [...feeds]
    .filter((f) => f.id !== pendingDeleteId)
    .sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`));
  const recentFeeds = sortedFeeds.slice(0, limit);
  const hasMore = sortedFeeds.length > limit;

  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {
          editEntry && (
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-fg-on-accent">
                Editing {editEntry.date} {editEntry.time}
              </span>
              <button type="button" onClick={handleCancelEdit} className="text-xs text-fg-muted hover:text-fg">
                Cancel
              </button>
            </div>
          )
        }

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
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-card border border-line text-fg" />
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-card border border-line text-fg" />
        </div>

        {
isAmountType(type) && (
          <label className="flex flex-col gap-1">
            <span className="text-sm text-fg-muted">Amount (ml/g)</span>
            <input type="number" min={0} value={amount ?? ''} onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : null)} className="w-full px-3 py-2 rounded-lg bg-surface-card border border-line text-fg" />
          </label>
        )
}

        <input type="text" placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-card border border-line text-fg" />

        <button type="submit" disabled={saving} className="w-full py-3 rounded-lg bg-accent text-fg-on-accent font-medium disabled:opacity-50">
          {saving && 'Saving...'}
          {!saving && (editEntry ? 'Update Feed' : 'Log Feed')}
        </button>
      </form>

      <RecentFeeds entries={recentFeeds} onEdit={startEdit} editingId={editEntry?.id ?? null} onRemove={handleUndoDelete} />
      {
        hasMore && (
          <button type="button" onClick={() => setLimit((p) => p + CONFIG.PAGE_SIZE)} className="text-xs text-accent font-medium py-1 self-center">
            Show more ({sortedFeeds.length - limit} remaining)
          </button>
        )
      }
      {
        !hasMore && sortedFeeds.length > CONFIG.PAGE_SIZE && (
          <p className="text-xs text-fg-muted text-center py-1">That's all the feeds</p>
        )
      }
    </div>
  );
}

/** Renders a sorted list of recent feed entries with edit/delete actions */
function RecentFeeds({ entries, onEdit, editingId, onRemove }: { entries: FeedEntry[]; onEdit: (e: FeedEntry) => void; editingId: string | null; onRemove: (id: string) => void }) {
  if (entries.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium text-fg-muted">Recent Feeds</h3>
      {
entries.map((entry) => {
        const isActive = editingId === entry.id;
        return (
          <button
            key={entry.id}
            type="button"
            onClick={() => onEdit(entry)}
            className={`rounded-lg border p-3 text-left transition-colors ${
              isActive
                ? 'bg-[var(--accent-muted)] border-l-2 border-l-accent border-line'
                : 'bg-surface-card border-line'
            }`}
          >
            <div className="flex justify-between text-sm">
              <span className="font-medium text-fg">{FEED_TYPE_LABELS[entry.type]}</span>
              <div className="flex items-center gap-2">
                <span className="text-fg-muted">{entry.date} {entry.time}</span>
                <span
                  role="button"
                  tabIndex={0}
                  aria-label="Delete"
                  onClick={(e) => { e.stopPropagation(); onRemove(entry.id); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onRemove(entry.id); } }}
                  className="text-xs text-fg-muted hover:text-red-500 transition-colors"
                >
                  x
                </span>
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
          </button>
        );
      })
}
    </div>
  );
}

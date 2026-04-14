import { useState, useRef } from 'react';

import { useBabyData } from '@/modules/baby/hooks/useBabyData';
import type { SleepEntry } from '@/modules/baby/types';
import { SleepType, SleepQuality } from '@/modules/baby/types';
import { ALL_SLEEP_TYPES, ALL_SLEEP_QUALITIES, SLEEP_TYPE_LABELS, SLEEP_QUALITY_LABELS } from '@/modules/baby/constants';
import { todayStr, nowTime } from '@/shared/utils/date';
import { useToast } from '@/shared/errors/useToast';
import { BabyMsg } from '@/constants/messages';
import { CONFIG } from '@/constants/config';
import { sortNewestFirst } from '@/shared/utils/sort';
import { ToastType } from '@/shared/types';
import { DbSubcollection } from '@/constants/db';
import { logToSiblings } from '@/modules/baby/utils/logToSiblings';

/** Returns current time + offset minutes as HH:MM */
function timeOffset(minutes: number): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() + minutes);
  return d.toTimeString().slice(0, 5);
}

/** Sleep tracking form with type/quality selection and recent entries list */
export function SleepLog({ childId, siblingIds = [], uid = '' }: { childId?: string; siblingIds?: string[]; uid?: string }) {
  const { sleeps, logSleep, updateSleep, removeSleep } = useBabyData(childId ?? null);
  const { addToast } = useToast();
  const [type, setType] = useState<SleepType>(SleepType.Nap);
  const [quality, setQuality] = useState<SleepQuality | null>(SleepQuality.Good);
  const [date, setDate] = useState(todayStr);
  const [startTime, setStartTime] = useState(nowTime);
  const [endTime, setEndTime] = useState(() => timeOffset(15));
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [editEntry, setEditEntry] = useState<SleepEntry | null>(null);
  const [limit, setLimit] = useState(CONFIG.PAGE_SIZE);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [logToAll, setLogToAll] = useState(false);
  const undoRef = useRef(false);
  const hasSiblings = siblingIds.length > 0;

  /** Populates form fields from the selected entry for editing */
  const startEdit = (entry: SleepEntry) => {
    setEditEntry(entry);
    setType(entry.type);
    setQuality(entry.quality);
    setDate(entry.date);
    setStartTime(entry.startTime);
    setEndTime(entry.endTime);
    setNotes(entry.notes);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const now = new Date().toISOString();
    const entryData = { date, startTime, endTime, type, quality, timestamp: now, createdAt: now, notes };

    if (editEntry) {
      await updateSleep({ ...editEntry, date, startTime, endTime, type, quality, notes });
      setEditEntry(null);
    } else {
      await logSleep(entryData);
      if (logToAll && hasSiblings && uid) {
        const count = await logToSiblings(uid, siblingIds, DbSubcollection.Sleep, entryData);
        if (count > 0) addToast(`Copied to ${count} sibling${count > 1 ? 's' : ''}`, ToastType.Info);
      }
    }

    setStartTime(nowTime());
    setEndTime(timeOffset(15));
    setNotes('');
    setSaving(false);
  }

  const handleCancelEdit = () => {
    setEditEntry(null);
    setType(SleepType.Nap);
    setQuality(SleepQuality.Good);
    setDate(todayStr());
    setStartTime(nowTime());
    setEndTime(timeOffset(15));
    setNotes('');
  };

  const handleUndoDelete = (id: string) => {
    undoRef.current = false;
    setPendingDeleteId(id);
    addToast(BabyMsg.SleepDeleted, ToastType.Info, {
      durationMs: CONFIG.UNDO_DURATION_MS,
      action: { label: 'Undo', onClick: () => { undoRef.current = true; setPendingDeleteId(null); } },
    });
    setTimeout(() => {
      if (!undoRef.current) removeSleep(id);
      setPendingDeleteId(null);
    }, CONFIG.UNDO_DURATION_MS);
  };

  const sortedSleeps = sortNewestFirst(
    [...sleeps].filter((s) => s.id !== pendingDeleteId),
    (s) => `${s.date}T${s.startTime}`,
  );
  const recentSleeps = sortedSleeps.slice(0, limit);
  const hasMore = sortedSleeps.length > limit;

  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {
          editEntry && (
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-fg-on-accent">Editing {editEntry.date}</span>
              <button type="button" onClick={handleCancelEdit} className="text-xs text-fg-muted hover:text-fg">Cancel</button>
            </div>
          )
        }

        <div className="flex gap-2">
          {
ALL_SLEEP_TYPES.map((st) => (
            <button key={st} type="button" onClick={() => setType(st)} className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${type === st ? 'bg-accent text-fg-on-accent' : 'bg-surface-card text-fg border border-line'}`}>{SLEEP_TYPE_LABELS[st]}</button>
          ))
}
        </div>

        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-card border border-line text-fg" />

        <div className="flex gap-3">
          <label className="flex flex-1 flex-col gap-1">
            <span className="text-sm text-fg-muted">Start Time</span>
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-card border border-line text-fg" />
          </label>
          <label className="flex flex-1 flex-col gap-1">
            <span className="text-sm text-fg-muted">End Time</span>
            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-card border border-line text-fg" />
          </label>
        </div>

        <div className="flex gap-2">
          {
ALL_SLEEP_QUALITIES.map((sq) => (
            <button key={sq} type="button" onClick={() => setQuality(sq)} className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${quality === sq ? 'bg-accent text-fg-on-accent' : 'bg-surface-card text-fg border border-line'}`}>{SLEEP_QUALITY_LABELS[sq]}</button>
          ))
}
        </div>

        <input type="text" placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-card border border-line text-fg" />

        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="flex-1 py-3 rounded-lg bg-accent text-fg-on-accent font-medium disabled:opacity-50">
            {saving && 'Saving...'}
            {!saving && (editEntry ? 'Update Sleep' : 'Log Sleep')}
          </button>
          {
            hasSiblings && !editEntry && (
              <button type="button" onClick={() => setLogToAll((v) => !v)} className={`px-3 py-3 rounded-lg border text-xs font-medium transition-colors ${logToAll ? 'bg-accent/10 border-accent text-accent' : 'bg-surface-card border-line text-fg-muted'}`} title="Log to all children">All</button>
            )
          }
        </div>
      </form>

      <RecentSleeps entries={recentSleeps} onEdit={startEdit} editingId={editEntry?.id ?? null} onRemove={handleUndoDelete} />
      {
        hasMore && (
          <button type="button" onClick={() => setLimit((p) => p + CONFIG.PAGE_SIZE)} className="text-xs text-accent font-medium py-1 self-center">
            Show more ({sortedSleeps.length - limit} remaining)
          </button>
        )
      }
      {
        !hasMore && sortedSleeps.length > CONFIG.PAGE_SIZE && (
          <p className="text-xs text-fg-muted text-center py-1">That's all the sleep entries</p>
        )
      }
    </div>
  );
}

/** Renders a sorted list of recent sleep entries with edit/delete actions */
function RecentSleeps({ entries, onEdit, editingId, onRemove }: { entries: SleepEntry[]; onEdit: (e: SleepEntry) => void; editingId: string | null; onRemove: (id: string) => void }) {
  if (entries.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium text-fg-muted">Recent Sleep</h3>
      {
entries.map((entry) => {
        const isActive = editingId === entry.id;
        return (
          <button key={entry.id} type="button" onClick={() => onEdit(entry)} className={`rounded-lg border p-3 text-left transition-colors ${isActive ? 'bg-[var(--accent-muted)] border-l-2 border-l-accent border-line' : 'bg-surface-card border-line'}`}>
            <div className="flex justify-between text-sm">
              <span className="font-medium text-fg">{SLEEP_TYPE_LABELS[entry.type]}</span>
              <div className="flex items-center gap-2">
                <span className="text-fg-muted">{entry.date}</span>
                <span role="button" tabIndex={0} aria-label="Delete" onClick={(e) => { e.stopPropagation(); onRemove(entry.id); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onRemove(entry.id); } }} className="text-xs text-fg-muted hover:text-red-500 hover:scale-125 hover:font-bold transition-all">x</span>
              </div>
            </div>
            <p className="text-xs text-fg-muted mt-1">
              {entry.startTime} &ndash; {entry.endTime}
              {entry.quality !== null && ` \u00B7 ${SLEEP_QUALITY_LABELS[entry.quality]}`}
            </p>
            {entry.notes && <p className="text-xs text-fg-muted mt-1">{entry.notes}</p>}
          </button>
        );
      })
}
    </div>
  );
}

import { useState, useRef } from 'react';

import { useBabyData } from '@/modules/baby/hooks/useBabyData';
import type { DiaperEntry } from '@/modules/baby/types';
import { DiaperType } from '@/modules/baby/types';
import { ALL_DIAPER_TYPES, DIAPER_TYPE_LABELS } from '@/modules/baby/constants';
import { todayStr, nowTime } from '@/shared/utils/date';
import { useToast } from '@/shared/errors/useToast';
import { BabyMsg } from '@/constants/messages';
import { CONFIG } from '@/constants/config';
import { sortNewestFirst } from '@/shared/utils/sort';
import { ToastType } from '@/shared/types';
import { DbSubcollection } from '@/constants/db';
import { logToSiblings } from '@/modules/baby/utils/logToSiblings';

/** Diaper tracking form with quick-log buttons and recent entries list */
export function DiaperLog({ childId, siblingIds = [], uid = '' }: { childId?: string; siblingIds?: string[]; uid?: string }) {
  const { diapers, logDiaper, updateDiaper, removeDiaper } = useBabyData(childId ?? null);
  const { addToast } = useToast();
  const [type, setType] = useState<DiaperType>(DiaperType.Wet);
  const [date, setDate] = useState(todayStr);
  const [time, setTime] = useState(nowTime);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [editEntry, setEditEntry] = useState<DiaperEntry | null>(null);
  const [limit, setLimit] = useState(CONFIG.PAGE_SIZE);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [logToAll, setLogToAll] = useState(false);
  const undoRef = useRef(false);
  const hasSiblings = siblingIds.length > 0;

  /** Populates form fields from the selected entry for editing */
  const startEdit = (entry: DiaperEntry) => {
    setEditEntry(entry);
    setType(entry.type);
    setDate(entry.date);
    setTime(entry.time);
    setNotes(entry.notes);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const now = new Date().toISOString();
    const entryData = { date, time, type, timestamp: now, createdAt: now, notes };

    if (editEntry) {
      await updateDiaper({ ...editEntry, date, time, type, notes });
      setEditEntry(null);
    } else {
      await logDiaper(entryData);
      if (logToAll && hasSiblings && uid) {
        const count = await logToSiblings(uid, siblingIds, DbSubcollection.Diapers, entryData);
        if (count > 0) addToast(`Copied to ${count} sibling${count > 1 ? 's' : ''}`, ToastType.Info);
      }
    }

    setNotes('');
    setTime(nowTime());
    setSaving(false);
  }

  const handleCancelEdit = () => {
    setEditEntry(null);
    setType(DiaperType.Wet);
    setDate(todayStr());
    setTime(nowTime());
    setNotes('');
  };

  /** Logs a diaper entry immediately with the given type and current date/time */
  async function quickLog(quickType: DiaperType) {
    setSaving(true);
    const now = new Date().toISOString();
    await logDiaper({ date: todayStr(), time: nowTime(), type: quickType, timestamp: now, createdAt: now, notes: '' });
    setSaving(false);
  }

  const handleUndoDelete = (id: string) => {
    undoRef.current = false;
    setPendingDeleteId(id);
    addToast(BabyMsg.DiaperDeleted, ToastType.Info, {
      durationMs: CONFIG.UNDO_DURATION_MS,
      action: { label: 'Undo', onClick: () => { undoRef.current = true; setPendingDeleteId(null); } },
    });
    setTimeout(() => {
      if (!undoRef.current) removeDiaper(id);
      setPendingDeleteId(null);
    }, CONFIG.UNDO_DURATION_MS);
  };

  const sortedDiapers = sortNewestFirst(
    [...diapers].filter((d) => d.id !== pendingDeleteId),
    (d) => `${d.date}T${d.time}`,
  );
  const recentDiapers = sortedDiapers.slice(0, limit);
  const hasMore = sortedDiapers.length > limit;

  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      {
        !editEntry && (
          <div className="flex gap-2">
            <button type="button" disabled={saving} onClick={() => quickLog(DiaperType.Wet)} className="flex-1 py-3 rounded-lg bg-surface-card text-fg border border-line font-medium disabled:opacity-50 active:scale-95 transition-transform">Quick Wet</button>
            <button type="button" disabled={saving} onClick={() => quickLog(DiaperType.Dirty)} className="flex-1 py-3 rounded-lg bg-surface-card text-fg border border-line font-medium disabled:opacity-50 active:scale-95 transition-transform">Quick Dirty</button>
          </div>
        )
      }

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {
          editEntry && (
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-fg-on-accent">Editing {editEntry.date} {editEntry.time}</span>
              <button type="button" onClick={handleCancelEdit} className="text-xs text-fg-muted hover:text-fg">Cancel</button>
            </div>
          )
        }

        <div className="flex gap-2">
          {
ALL_DIAPER_TYPES.map((dt) => (
            <button key={dt} type="button" onClick={() => setType(dt)} className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${type === dt ? 'bg-accent text-fg-on-accent' : 'bg-surface-card text-fg border border-line'}`}>{DIAPER_TYPE_LABELS[dt]}</button>
          ))
}
        </div>

        <div className="flex gap-3">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-card border border-line text-fg" />
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-card border border-line text-fg" />
        </div>

        <input type="text" placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-card border border-line text-fg" />

        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="flex-1 py-3 rounded-lg bg-accent text-fg-on-accent font-medium disabled:opacity-50">
            {saving && 'Saving...'}
            {!saving && (editEntry ? 'Update Diaper' : 'Log Diaper')}
          </button>
          {
            hasSiblings && !editEntry && (
              <button
                type="button"
                onClick={() => setLogToAll((v) => !v)}
                className={`px-3 py-3 rounded-lg border text-xs font-medium transition-colors ${logToAll ? 'bg-accent/10 border-accent text-accent' : 'bg-surface-card border-line text-fg-muted'}`}
                title="Log to all children"
              >
                All
              </button>
            )
          }
        </div>
      </form>

      <RecentDiapers entries={recentDiapers} onEdit={startEdit} editingId={editEntry?.id ?? null} onRemove={handleUndoDelete} />
      {
        hasMore && (
          <button type="button" onClick={() => setLimit((p) => p + CONFIG.PAGE_SIZE)} className="text-xs text-accent font-medium py-1 self-center">
            Show more ({sortedDiapers.length - limit} remaining)
          </button>
        )
      }
      {
        !hasMore && sortedDiapers.length > CONFIG.PAGE_SIZE && (
          <p className="text-xs text-fg-muted text-center py-1">That's all the diaper entries</p>
        )
      }
    </div>
  );
}

/** Renders a sorted list of recent diaper entries with edit/delete actions */
function RecentDiapers({ entries, onEdit, editingId, onRemove }: { entries: DiaperEntry[]; onEdit: (e: DiaperEntry) => void; editingId: string | null; onRemove: (id: string) => void }) {
  if (entries.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium text-fg-muted">Recent Diapers</h3>
      {
entries.map((entry) => {
        const isActive = editingId === entry.id;
        return (
          <button key={entry.id} type="button" onClick={() => onEdit(entry)} className={`rounded-lg border p-3 text-left transition-colors ${isActive ? 'bg-[var(--accent-muted)] border-l-2 border-l-accent border-line' : 'bg-surface-card border-line'}`}>
            <div className="flex justify-between text-sm">
              <span className="font-medium text-fg">{DIAPER_TYPE_LABELS[entry.type]}</span>
              <div className="flex items-center gap-2">
                <span className="text-fg-muted">{entry.date} {entry.time}</span>
                <span role="button" tabIndex={0} aria-label="Delete" onClick={(e) => { e.stopPropagation(); onRemove(entry.id); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onRemove(entry.id); } }} className="text-xs text-fg-muted hover:text-red-500 hover:scale-125 hover:font-bold transition-all">x</span>
              </div>
            </div>
            {entry.notes && <p className="text-xs text-fg-muted mt-1">{entry.notes}</p>}
          </button>
        );
      })
}
    </div>
  );
}

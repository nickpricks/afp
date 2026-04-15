import { useState, useRef } from 'react';

import { useBabyData } from '@/modules/baby/hooks/useBabyData';
import type { EliminationEntry } from '@/modules/baby/types';
import { DiaperType, EliminationMode, PottyTrainingEvent } from '@/modules/baby/types';
import {
  ALL_DIAPER_TYPES,
  DIAPER_TYPE_LABELS,
  ALL_POTTY_EVENTS,
  POTTY_EVENT_LABELS,
} from '@/modules/baby/constants';
import { todayStr, nowTime } from '@/shared/utils/date';
import { useToast } from '@/shared/errors/useToast';
import { BabyMsg } from '@/constants/messages';
import { CONFIG } from '@/constants/config';
import { sortNewestFirst } from '@/shared/utils/sort';
import { ToastType } from '@/shared/types';
import { DbSubcollection } from '@/constants/db';
import { logToSiblings } from '@/modules/baby/utils/logToSiblings';

type Props = {
  childId?: string;
  siblingIds?: string[];
  uid?: string;
  diapersEnabled: boolean;
  pottyEnabled: boolean;
};

/** Combined Diaper / Potty tracking — mode determined by per-child config flags */
export function EliminationLog({
  childId,
  siblingIds = [],
  uid = '',
  diapersEnabled,
  pottyEnabled,
}: Props) {
  const { elimination, logElimination, updateElimination, removeElimination } = useBabyData(
    childId ?? null,
  );
  const { addToast } = useToast();

  const defaultMode =
    !diapersEnabled && pottyEnabled ? EliminationMode.Potty : EliminationMode.Diaper;

  const [mode, setMode] = useState<EliminationMode>(defaultMode);
  const [diaperType, setDiaperType] = useState<DiaperType>(DiaperType.Wet);
  const [pottyEvent, setPottyEvent] = useState<PottyTrainingEvent>(PottyTrainingEvent.Pee);
  const [date, setDate] = useState(todayStr);
  const [time, setTime] = useState(nowTime);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [editEntry, setEditEntry] = useState<EliminationEntry | null>(null);
  const [limit, setLimit] = useState(CONFIG.PAGE_SIZE);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [logToAll, setLogToAll] = useState(false);
  const undoRef = useRef(false);
  const hasSiblings = siblingIds.length > 0;

  const headerLabel =
    diapersEnabled && pottyEnabled ? 'Elimination Log' : pottyEnabled ? 'Potty Log' : 'Diaper Log';

  /** Populates form fields from the selected entry for editing */
  const startEdit = (entry: EliminationEntry) => {
    setEditEntry(entry);
    setMode(entry.mode);
    if (entry.mode === EliminationMode.Diaper && entry.diaperType !== undefined) {
      setDiaperType(entry.diaperType);
    }
    if (entry.mode === EliminationMode.Potty && entry.pottyEvent !== undefined) {
      setPottyEvent(entry.pottyEvent);
    }
    setDate(entry.date);
    setTime(entry.time);
    setNotes(entry.notes);
  };

  /** Builds an entry payload from current form state, omitting irrelevant mode-specific fields */
  function buildEntryData() {
    const now = new Date().toISOString();
    const base = { date, time, mode, timestamp: now, createdAt: now, notes };
    return mode === EliminationMode.Diaper
      ? { ...base, diaperType }
      : { ...base, pottyEvent };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const entryData = buildEntryData();

    if (editEntry) {
      await updateElimination({ ...editEntry, ...entryData });
      setEditEntry(null);
    } else {
      await logElimination(entryData);
      if (logToAll && hasSiblings && uid) {
        const count = await logToSiblings(
          uid,
          siblingIds,
          DbSubcollection.Elimination,
          entryData,
        );
        if (count > 0) addToast(`Copied to ${count} sibling${count > 1 ? 's' : ''}`, ToastType.Info);
      }
    }

    setNotes('');
    setTime(nowTime());
    setSaving(false);
  }

  const handleCancelEdit = () => {
    setEditEntry(null);
    setDiaperType(DiaperType.Wet);
    setPottyEvent(PottyTrainingEvent.Pee);
    setDate(todayStr());
    setTime(nowTime());
    setNotes('');
  };

  /** Logs a diaper entry immediately with the given type and current date/time */
  async function quickLogDiaper(quickType: DiaperType) {
    setSaving(true);
    const now = new Date().toISOString();
    await logElimination({
      date: todayStr(),
      time: nowTime(),
      mode: EliminationMode.Diaper,
      diaperType: quickType,
      timestamp: now,
      createdAt: now,
      notes: '',
    });
    setSaving(false);
  }

  const handleUndoDelete = (id: string) => {
    undoRef.current = false;
    setPendingDeleteId(id);
    addToast(BabyMsg.EliminationDeleted, ToastType.Info, {
      durationMs: CONFIG.UNDO_DURATION_MS,
      action: {
        label: 'Undo',
        onClick: () => {
          undoRef.current = true;
          setPendingDeleteId(null);
        },
      },
    });
    setTimeout(() => {
      if (!undoRef.current) removeElimination(id);
      setPendingDeleteId(null);
    }, CONFIG.UNDO_DURATION_MS);
  };

  const sortedEntries = sortNewestFirst(
    [...elimination].filter((e) => e.id !== pendingDeleteId),
    (e) => `${e.date}T${e.time}`,
  );
  const recentEntries = sortedEntries.slice(0, limit);
  const hasMore = sortedEntries.length > limit;

  const showQuickLog = !editEntry && mode === EliminationMode.Diaper;

  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      <h2 className="text-lg font-semibold text-fg">{headerLabel}</h2>

      {
        diapersEnabled && pottyEnabled && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode(EliminationMode.Diaper)}
              className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${mode === EliminationMode.Diaper ? 'bg-accent text-fg-on-accent border-accent' : 'bg-surface-card text-fg border-line'}`}
            >
              Diaper
            </button>
            <button
              type="button"
              onClick={() => setMode(EliminationMode.Potty)}
              className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${mode === EliminationMode.Potty ? 'bg-accent text-fg-on-accent border-accent' : 'bg-surface-card text-fg border-line'}`}
            >
              Potty
            </button>
          </div>
        )
      }

      {
        showQuickLog && (
          <div className="flex gap-2">
            <button type="button" disabled={saving} onClick={() => quickLogDiaper(DiaperType.Wet)} className="flex-1 py-3 rounded-lg bg-surface-card text-fg border border-line font-medium disabled:opacity-50 active:scale-95 transition-transform">Quick Wet</button>
            <button type="button" disabled={saving} onClick={() => quickLogDiaper(DiaperType.Dirty)} className="flex-1 py-3 rounded-lg bg-surface-card text-fg border border-line font-medium disabled:opacity-50 active:scale-95 transition-transform">Quick Dirty</button>
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

        {
          mode === EliminationMode.Diaper && (
            <div className="flex gap-2">
              {
ALL_DIAPER_TYPES.map((dt) => (
                <button key={dt} type="button" onClick={() => setDiaperType(dt)} className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${diaperType === dt ? 'bg-accent text-fg-on-accent' : 'bg-surface-card text-fg border border-line'}`}>{DIAPER_TYPE_LABELS[dt]}</button>
              ))
}
            </div>
          )
        }

        {
          mode === EliminationMode.Potty && (
            <div className="flex flex-wrap gap-2">
              {
ALL_POTTY_EVENTS.map((ev) => (
                <button key={ev} type="button" onClick={() => setPottyEvent(ev)} className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${pottyEvent === ev ? 'bg-accent text-fg-on-accent' : 'bg-surface-card text-fg border border-line'}`}>{POTTY_EVENT_LABELS[ev]}</button>
              ))
}
            </div>
          )
        }

        <div className="flex gap-3">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-card border border-line text-fg" />
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-card border border-line text-fg" />
        </div>

        <input type="text" placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-card border border-line text-fg" />

        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="flex-1 py-3 rounded-lg bg-accent text-fg-on-accent font-medium disabled:opacity-50">
            {saving && 'Saving...'}
            {!saving && (editEntry ? 'Update' : 'Log')}
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

      <RecentElimination entries={recentEntries} onEdit={startEdit} editingId={editEntry?.id ?? null} onRemove={handleUndoDelete} />
      {
        hasMore && (
          <button type="button" onClick={() => setLimit((p) => p + CONFIG.PAGE_SIZE)} className="text-xs text-accent font-medium py-1 self-center">
            Show more ({sortedEntries.length - limit} remaining)
          </button>
        )
      }
      {
        !hasMore && sortedEntries.length > CONFIG.PAGE_SIZE && (
          <p className="text-xs text-fg-muted text-center py-1">That&apos;s all the entries</p>
        )
      }
    </div>
  );
}

/** Renders a sorted list of recent elimination entries with edit/delete actions */
function RecentElimination({
  entries,
  onEdit,
  editingId,
  onRemove,
}: {
  entries: EliminationEntry[];
  onEdit: (e: EliminationEntry) => void;
  editingId: string | null;
  onRemove: (id: string) => void;
}) {
  if (entries.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium text-fg-muted">Recent</h3>
      {
entries.map((entry) => {
        const isActive = editingId === entry.id;
        const label =
          entry.mode === EliminationMode.Diaper
            ? DIAPER_TYPE_LABELS[entry.diaperType ?? DiaperType.Wet]
            : POTTY_EVENT_LABELS[entry.pottyEvent ?? PottyTrainingEvent.Pee];
        const modeBadge = entry.mode === EliminationMode.Potty ? '🚽' : '🧷';
        return (
          <button key={entry.id} type="button" onClick={() => onEdit(entry)} className={`rounded-lg border p-3 text-left transition-colors ${isActive ? 'bg-[var(--accent-muted)] border-l-2 border-l-accent border-line' : 'bg-surface-card border-line'}`}>
            <div className="flex justify-between text-sm">
              <span className="font-medium text-fg">{modeBadge} {label}</span>
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

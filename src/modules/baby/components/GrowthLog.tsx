import { useState, useRef } from 'react';

import { useBabyData } from '@/modules/baby/hooks/useBabyData';
import type { GrowthEntry } from '@/modules/baby/types';
import { todayStr } from '@/shared/utils/date';
import { useToast } from '@/shared/errors/useToast';
import { BabyMsg } from '@/constants/messages';
import { CONFIG } from '@/constants/config';
import { sortNewestFirst } from '@/shared/utils/sort';
import { ToastType } from '@/shared/types';

/** Growth measurement form with weight, height, head circumference and recent entries */
export function GrowthLog({ childId }: { childId?: string }) {
  const { growth, logGrowth, updateGrowth, removeGrowth } = useBabyData(childId ?? null);
  const { addToast } = useToast();
  const [date, setDate] = useState(todayStr);
  const [weight, setWeight] = useState<number | null>(null);
  const [height, setHeight] = useState<number | null>(null);
  const [headCircumference, setHeadCircumference] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [editEntry, setEditEntry] = useState<GrowthEntry | null>(null);
  const [limit, setLimit] = useState(CONFIG.PAGE_SIZE);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const undoRef = useRef(false);

  /** Populates form fields from the selected entry for editing */
  const startEdit = (entry: GrowthEntry) => {
    setEditEntry(entry);
    setDate(entry.date);
    setWeight(entry.weight);
    setHeight(entry.height);
    setHeadCircumference(entry.headCircumference);
    setNotes(entry.notes);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const now = new Date().toISOString();

    if (editEntry) {
      await updateGrowth({ ...editEntry, date, weight, height, headCircumference, notes });
      setEditEntry(null);
    } else {
      await logGrowth({ date, weight, height, headCircumference, createdAt: now, notes });
    }

    setWeight(null);
    setHeight(null);
    setHeadCircumference(null);
    setNotes('');
    setSaving(false);
  }

  const handleCancelEdit = () => {
    setEditEntry(null);
    setDate(todayStr());
    setWeight(null);
    setHeight(null);
    setHeadCircumference(null);
    setNotes('');
  };

  const handleUndoDelete = (id: string) => {
    undoRef.current = false;
    setPendingDeleteId(id);
    addToast(BabyMsg.GrowthDeleted, ToastType.Info, {
      durationMs: CONFIG.UNDO_DURATION_MS,
      action: { label: 'Undo', onClick: () => { undoRef.current = true; setPendingDeleteId(null); } },
    });
    setTimeout(() => {
      if (!undoRef.current) removeGrowth(id);
      setPendingDeleteId(null);
    }, CONFIG.UNDO_DURATION_MS);
  };

  const sortedGrowth = sortNewestFirst(
    [...growth].filter((g) => g.id !== pendingDeleteId),
    (g) => g.date,
  );
  const recentGrowth = sortedGrowth.slice(0, limit);
  const hasMore = sortedGrowth.length > limit;

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

        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-card border border-line text-fg" />

        <label className="flex flex-col gap-1">
          <span className="text-sm text-fg-muted">Weight (kg)</span>
          <input type="number" min={0} step={0.01} value={weight ?? ''} onChange={(e) => setWeight(e.target.value ? Number(e.target.value) : null)} className="w-full px-3 py-2 rounded-lg bg-surface-card border border-line text-fg" />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-fg-muted">Height (cm)</span>
          <input type="number" min={0} step={0.1} value={height ?? ''} onChange={(e) => setHeight(e.target.value ? Number(e.target.value) : null)} className="w-full px-3 py-2 rounded-lg bg-surface-card border border-line text-fg" />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-fg-muted">Head Circumference (cm)</span>
          <input type="number" min={0} step={0.1} value={headCircumference ?? ''} onChange={(e) => setHeadCircumference(e.target.value ? Number(e.target.value) : null)} className="w-full px-3 py-2 rounded-lg bg-surface-card border border-line text-fg" />
        </label>

        <input type="text" placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-card border border-line text-fg" />

        <button type="submit" disabled={saving || (weight === null && height === null && headCircumference === null)} className="w-full py-3 rounded-lg bg-accent text-fg-on-accent font-medium disabled:opacity-50">
          {saving && 'Saving...'}
          {!saving && (editEntry ? 'Update Growth' : 'Log Growth')}
        </button>
      </form>

      <RecentGrowth entries={recentGrowth} onEdit={startEdit} editingId={editEntry?.id ?? null} onRemove={handleUndoDelete} />
      {
        hasMore && (
          <button type="button" onClick={() => setLimit((p) => p + CONFIG.PAGE_SIZE)} className="text-xs text-accent font-medium py-1 self-center">
            Show more ({sortedGrowth.length - limit} remaining)
          </button>
        )
      }
      {
        !hasMore && sortedGrowth.length > CONFIG.PAGE_SIZE && (
          <p className="text-xs text-fg-muted text-center py-1">That's all the growth entries</p>
        )
      }
    </div>
  );
}

/** Renders a sorted list of recent growth measurements with edit/delete actions */
function RecentGrowth({ entries, onEdit, editingId, onRemove }: { entries: GrowthEntry[]; onEdit: (e: GrowthEntry) => void; editingId: string | null; onRemove: (id: string) => void }) {
  if (entries.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium text-fg-muted">Recent Measurements</h3>
      {
entries.map((entry) => {
        const isActive = editingId === entry.id;
        return (
          <button key={entry.id} type="button" onClick={() => onEdit(entry)} className={`rounded-lg border p-3 text-left transition-colors ${isActive ? 'bg-[var(--accent-muted)] border-l-2 border-l-accent border-line' : 'bg-surface-card border-line'}`}>
            <div className="flex justify-between text-sm">
              <span className="font-medium text-fg">{entry.date}</span>
              <span role="button" tabIndex={0} aria-label="Delete" onClick={(e) => { e.stopPropagation(); onRemove(entry.id); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onRemove(entry.id); } }} className="text-xs text-fg-muted hover:text-red-500 transition-colors">x</span>
            </div>
            <p className="text-xs text-fg-muted mt-1">
              {entry.weight !== null && `${entry.weight} kg`}
              {entry.weight !== null && entry.height !== null && ' \u00B7 '}
              {entry.height !== null && `${entry.height} cm`}
              {(entry.weight !== null || entry.height !== null) && entry.headCircumference !== null && ' \u00B7 '}
              {entry.headCircumference !== null && `HC ${entry.headCircumference} cm`}
            </p>
            {entry.notes && <p className="text-xs text-fg-muted mt-1">{entry.notes}</p>}
          </button>
        );
      })
}
    </div>
  );
}

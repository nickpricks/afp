import { useState, useRef } from 'react';

import { useBabyData } from '@/modules/baby/hooks/useBabyData';
import type { GrowthEntry } from '@/modules/baby/types';
import { todayStr } from '@/shared/utils/date';
import { useToast } from '@/shared/errors/useToast';
import { BabyMsg } from '@/constants/messages';
import { CONFIG } from '@/constants/config';
import { sortNewestFirst } from '@/shared/utils/sort';
import { ToastType } from '@/shared/types';
import { DbSubcollection } from '@/constants/db';
import { logToSiblings } from '@/modules/baby/utils/logToSiblings';
import { ListControls } from '@/shared/components/ListControls';
import { ListShowMoreFooter } from '@/shared/components/ListShowMoreFooter';
import { DateGroupHeader } from '@/shared/components/lists/DateGroupHeader';
import { useListControls } from '@/shared/hooks/useListControls';
import { filterByDateRange } from '@/shared/utils/filter';
import { paginate, totalPages } from '@/shared/utils/paginate';

/** Growth measurement form with weight, height, head circumference and recent entries */
export function GrowthLog({
  childId,
  siblingIds = [],
  uid = '',
}: {
  childId?: string;
  siblingIds?: string[];
  uid?: string;
}) {
  const { growth, logGrowth, updateGrowth, removeGrowth } = useBabyData(childId ?? null);
  const { addToast } = useToast();
  const [date, setDate] = useState(todayStr);
  const [weight, setWeight] = useState<number | null>(null);
  const [height, setHeight] = useState<number | null>(null);
  const [headCircumference, setHeadCircumference] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [editEntry, setEditEntry] = useState<GrowthEntry | null>(null);
  const ctrl = useListControls();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [logToAll, setLogToAll] = useState(false);
  const undoRef = useRef(false);
  const hasSiblings = siblingIds.length > 0;

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
    const entryData = { date, weight, height, headCircumference, createdAt: now, notes };

    if (editEntry) {
      await updateGrowth({ ...editEntry, date, weight, height, headCircumference, notes });
      setEditEntry(null);
    } else {
      await logGrowth(entryData);
      if (logToAll && hasSiblings && uid) {
        const count = await logToSiblings(uid, siblingIds, DbSubcollection.Growth, entryData);
        if (count > 0)
          addToast(`Copied to ${count} sibling${count > 1 ? 's' : ''}`, ToastType.Info);
      }
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
      action: {
        label: 'Undo',
        onClick: () => {
          undoRef.current = true;
          setPendingDeleteId(null);
        },
      },
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
  const today = todayStr();
  const filteredGrowth = filterByDateRange(sortedGrowth, ctrl.timeRange, today, (g) => g.date);
  const pagesCount = totalPages(filteredGrowth.length, ctrl.pageSize);
  const recentGrowth = ctrl.showAll
    ? filteredGrowth
    : paginate(filteredGrowth, ctrl.page, ctrl.pageSize);

  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {editEntry && (
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-fg-on-accent">
              Editing {editEntry.date}
            </span>
            <button
              type="button"
              onClick={handleCancelEdit}
              className="text-xs text-fg-muted hover:text-fg"
            >
              Cancel
            </button>
          </div>
        )}

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-surface-card border border-line text-fg"
        />

        <label className="flex flex-col gap-1">
          <span className="text-sm text-fg-muted">Weight (kg)</span>
          <input
            type="number"
            min={0}
            step={0.01}
            value={weight ?? ''}
            onChange={(e) => setWeight(e.target.value ? Number(e.target.value) : null)}
            className="w-full px-3 py-2 rounded-lg bg-surface-card border border-line text-fg"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-fg-muted">Height (cm)</span>
          <input
            type="number"
            min={0}
            step={0.1}
            value={height ?? ''}
            onChange={(e) => setHeight(e.target.value ? Number(e.target.value) : null)}
            className="w-full px-3 py-2 rounded-lg bg-surface-card border border-line text-fg"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-fg-muted">Head Circumference (cm)</span>
          <input
            type="number"
            min={0}
            step={0.1}
            value={headCircumference ?? ''}
            onChange={(e) => setHeadCircumference(e.target.value ? Number(e.target.value) : null)}
            className="w-full px-3 py-2 rounded-lg bg-surface-card border border-line text-fg"
          />
        </label>

        <input
          type="text"
          placeholder="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-surface-card border border-line text-fg"
        />

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving || (weight === null && height === null && headCircumference === null)}
            className="flex-1 py-3 rounded-lg bg-accent text-fg-on-accent font-medium disabled:opacity-50"
          >
            {saving && 'Saving...'}
            {!saving && (editEntry ? 'Update Growth' : 'Log Growth')}
          </button>
          {hasSiblings && !editEntry && (
            <button
              type="button"
              onClick={() => setLogToAll((v) => !v)}
              className={`px-3 py-3 rounded-lg border text-xs font-medium transition-colors ${logToAll ? 'bg-accent/10 border-accent text-accent' : 'bg-surface-card border-line text-fg-muted'}`}
              title="Log to all children"
            >
              All
            </button>
          )}
        </div>
      </form>

      {sortedGrowth.length > 0 && (
        <ListControls
          timeRange={ctrl.timeRange}
          onTimeRangeChange={ctrl.setTimeRange}
          pageSize={ctrl.pageSize}
          onPageSizeChange={ctrl.setPageSize}
          page={ctrl.page}
          totalPages={ctrl.showAll ? 1 : pagesCount}
          onPageChange={ctrl.setPage}
        />
      )}
      <RecentGrowth
        entries={recentGrowth}
        today={today}
        onEdit={startEdit}
        editingId={editEntry?.id ?? null}
        onRemove={handleUndoDelete}
      />
      {!ctrl.showAll && (
        <ListShowMoreFooter
          totalCount={filteredGrowth.length}
          shownCount={recentGrowth.length}
          pageSize={ctrl.pageSize}
          onShowAll={() => ctrl.setShowAll(true)}
        />
      )}
    </div>
  );
}

/** Renders a sorted list of recent growth measurements grouped by date */
function RecentGrowth({
  entries,
  today,
  onEdit,
  editingId,
  onRemove,
}: {
  entries: GrowthEntry[];
  today: string;
  onEdit: (e: GrowthEntry) => void;
  editingId: string | null;
  onRemove: (id: string) => void;
}) {
  if (entries.length === 0) return null;

  const groups: Record<string, GrowthEntry[]> = {};
  entries.forEach((e) => {
    (groups[e.date] = groups[e.date] || []).push(e);
  });
  const dateKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  return (
    <div className="flex flex-col">
      <h3 className="mb-2 text-sm font-medium text-fg-muted">Recent Measurements</h3>
      {dateKeys.map((dateKey) => (
        <div key={dateKey}>
          <DateGroupHeader date={dateKey} today={today} />
          {groups[dateKey]!.map((entry) => {
            const isActive = editingId === entry.id;
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => onEdit(entry)}
                className={`block w-full border-t border-line p-3 text-left transition-colors hover:bg-accent-muted ${isActive ? 'bg-accent-muted border-l-2 border-l-accent' : ''}`}
              >
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-fg">Growth</span>
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label="Delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(entry.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.stopPropagation();
                        onRemove(entry.id);
                      }
                    }}
                    className="font-mono text-sm text-fg-muted transition-all hover:scale-125 hover:font-bold hover:text-red-500"
                  >
                    \u00D7
                  </span>
                </div>
                <p className="text-xs text-fg-muted mt-1">
                  {entry.weight !== null && `${entry.weight} kg`}
                  {entry.weight !== null && entry.height !== null && ' \u00B7 '}
                  {entry.height !== null && `${entry.height} cm`}
                  {(entry.weight !== null || entry.height !== null) &&
                    entry.headCircumference !== null &&
                    ' \u00B7 '}
                  {entry.headCircumference !== null && `HC ${entry.headCircumference} cm`}
                </p>
                {entry.notes && <p className="text-xs text-fg-muted mt-1">{entry.notes}</p>}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

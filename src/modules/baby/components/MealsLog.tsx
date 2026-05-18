import { useState, useRef } from 'react';

import { useBabyCollection } from '@/modules/baby/hooks/useBabyCollection';
import type { MealEntry } from '@/modules/baby/types';
import { MealType, MealPortion } from '@/modules/baby/types';
import {
  ALL_MEAL_TYPES,
  MEAL_TYPE_LABELS,
  ALL_MEAL_PORTIONS,
  MEAL_PORTION_LABELS,
} from '@/modules/baby/constants';
import { todayStr, nowTime } from '@/shared/utils/date';
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

/** Props for MealsLog component */
type Props = {
  childId?: string;
  siblingIds?: string[];
  uid?: string;
};

/** Suggests a meal type based on the current hour of day */
function defaultMealType(): MealType {
  const h = new Date().getHours();
  if (h < 10) return MealType.Breakfast;
  if (h < 14) return MealType.Lunch;
  if (h < 19) return MealType.Dinner;
  return MealType.Snack;
}

/** Meals/food tracking — form-at-top + recent list with tap-to-edit + undo-delete */
export function MealsLog({ childId, siblingIds = [], uid = '' }: Props) {
  const { items, log, update, remove } = useBabyCollection<MealEntry>(
    childId ?? null,
    DbSubcollection.Meals,
    'Meal',
  );
  const { addToast } = useToast();

  const [type, setType] = useState<MealType>(defaultMealType);
  const [description, setDescription] = useState('');
  const [portion, setPortion] = useState<MealPortion | null>(null);
  const [date, setDate] = useState(todayStr);
  const [time, setTime] = useState(nowTime);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [editEntry, setEditEntry] = useState<MealEntry | null>(null);
  const ctrl = useListControls();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [logToAll, setLogToAll] = useState(false);
  const undoRef = useRef(false);
  const hasSiblings = siblingIds.length > 0;

  /** Populates form fields from the selected entry for editing */
  const startEdit = (entry: MealEntry) => {
    setEditEntry(entry);
    setType(entry.type);
    setDescription(entry.description);
    setPortion(entry.portion);
    setDate(entry.date);
    setTime(entry.time);
    setNotes(entry.notes);
  };

  /** Clears the edit state and resets all form fields to defaults */
  const handleCancelEdit = () => {
    setEditEntry(null);
    setType(defaultMealType());
    setDescription('');
    setPortion(null);
    setDate(todayStr());
    setTime(nowTime());
    setNotes('');
  };

  /** Handles form submission — create or update meal entry */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) {
      addToast(BabyMsg.MealDescriptionRequired, ToastType.Error);
      return;
    }
    setSaving(true);
    const now = new Date().toISOString();
    const entryData = {
      date,
      time,
      type,
      description: description.trim(),
      portion,
      timestamp: now,
      createdAt: now,
      notes,
    };

    if (editEntry) {
      const ok = await update({ ...editEntry, ...entryData });
      if (ok) setEditEntry(null);
    } else {
      const saved = await log(entryData);
      if (!saved) {
        setSaving(false);
        return;
      }
      if (logToAll && hasSiblings && uid) {
        const { ok, failed } = await logToSiblings(
          uid,
          siblingIds,
          DbSubcollection.Meals,
          entryData,
        );
        if (failed > 0) {
          addToast(`${ok} of ${ok + failed} copied — ${failed} failed`, ToastType.Error);
        } else if (ok > 0) {
          addToast(`Copied to ${ok} sibling${ok > 1 ? 's' : ''}`, ToastType.Info);
        }
      }
    }

    setDescription('');
    setPortion(null);
    setNotes('');
    setTime(nowTime());
    setSaving(false);
  }

  /** Stages a delete with undo toast; fires actual delete after undo window expires */
  const handleUndoDelete = (id: string) => {
    undoRef.current = false;
    setPendingDeleteId(id);
    addToast(BabyMsg.MealDeleted, ToastType.Info, {
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
      if (!undoRef.current) remove(id);
      setPendingDeleteId(null);
    }, CONFIG.UNDO_DURATION_MS);
  };

  const sortedEntries = sortNewestFirst(
    [...items].filter((m) => m.id !== pendingDeleteId),
    (m) => `${m.date}T${m.time}`,
  );
  const today = todayStr();
  const filteredEntries = filterByDateRange(sortedEntries, ctrl.timeRange, today, (m) => m.date);
  const pagesCount = totalPages(filteredEntries.length, ctrl.pageSize);
  const recentEntries = ctrl.showAll
    ? filteredEntries
    : paginate(filteredEntries, ctrl.page, ctrl.pageSize);

  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      <h2 className="text-lg font-semibold text-fg">Meals</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {editEntry && (
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-fg-on-accent">
              Editing {editEntry.date} {editEntry.time}
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

        <div className="flex flex-wrap gap-2">
          {ALL_MEAL_TYPES.map((mt) => (
            <button
              key={mt}
              type="button"
              onClick={() => setType(mt)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${type === mt ? 'bg-accent text-fg-on-accent' : 'bg-surface-card text-fg border border-line'}`}
            >
              {MEAL_TYPE_LABELS[mt]}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="What was served (e.g. rice + dal + carrot)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-surface-card border border-line text-fg"
        />

        <select
          value={portion ?? ''}
          onChange={(e) =>
            setPortion(e.target.value === '' ? null : (Number(e.target.value) as MealPortion))
          }
          className="w-full px-3 py-2 rounded-lg bg-surface-card border border-line text-fg"
        >
          <option value="">Portion (optional)</option>
          {ALL_MEAL_PORTIONS.map((p) => (
            <option key={p} value={p}>
              {MEAL_PORTION_LABELS[p]}
            </option>
          ))}
        </select>

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
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-surface-card border border-line text-fg"
        />

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-3 rounded-lg bg-accent text-fg-on-accent font-medium disabled:opacity-50"
          >
            {saving && 'Saving...'}
            {!saving && (editEntry ? 'Update Meal' : 'Log Meal')}
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

      {sortedEntries.length > 0 && (
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
      <RecentMeals
        entries={recentEntries}
        today={today}
        onEdit={startEdit}
        editingId={editEntry?.id ?? null}
        onRemove={handleUndoDelete}
      />
      {!ctrl.showAll && (
        <ListShowMoreFooter
          totalCount={filteredEntries.length}
          shownCount={recentEntries.length}
          pageSize={ctrl.pageSize}
          onShowAll={() => ctrl.setShowAll(true)}
        />
      )}
    </div>
  );
}

/** Renders a sorted list of recent meal entries grouped by date */
function RecentMeals({
  entries,
  today,
  onEdit,
  editingId,
  onRemove,
}: {
  entries: MealEntry[];
  today: string;
  onEdit: (e: MealEntry) => void;
  editingId: string | null;
  onRemove: (id: string) => void;
}) {
  if (entries.length === 0) return null;

  const groups: Record<string, MealEntry[]> = {};
  entries.forEach((e) => {
    (groups[e.date] = groups[e.date] || []).push(e);
  });
  const dateKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  return (
    <div className="flex flex-col">
      <h3 className="mb-2 text-sm font-medium text-fg-muted">Recent Meals</h3>
      {dateKeys.map((dateKey) => (
        <div key={dateKey}>
          <DateGroupHeader date={dateKey} today={today} />
          {groups[dateKey]!.map((entry) => {
            const isActive = editingId === entry.id;
            const portionLabel =
              entry.portion !== null ? ` · ${MEAL_PORTION_LABELS[entry.portion]}` : '';
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => onEdit(entry)}
                className={`block w-full border-t border-line p-3 text-left transition-colors hover:bg-accent-muted ${isActive ? 'bg-accent-muted border-l-2 border-l-accent' : ''}`}
              >
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-fg">
                    🍽 {MEAL_TYPE_LABELS[entry.type]}: {entry.description}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs tabular-nums text-fg-muted">
                      {entry.time}
                    </span>
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
                      ×
                    </span>
                  </div>
                </div>
                {(entry.notes || portionLabel) && (
                  <p className="text-xs text-fg-muted mt-1">
                    {portionLabel.replace(/^ · /, '')}
                    {entry.notes && portionLabel ? ' — ' : ''}
                    {entry.notes}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

import { useState, useRef } from 'react';

import { useBabyCollection } from '@/modules/baby/hooks/useBabyCollection';
import type { NeedEntry } from '@/modules/baby/types';
import { NeedCategory, NeedStatus } from '@/modules/baby/types';
import {
  ALL_NEED_CATEGORIES,
  NEED_CATEGORY_LABELS,
  NEED_STATUS_LABELS,
} from '@/modules/baby/constants';
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

/** Props for NeedsLog component */
type Props = {
  childId?: string;
  siblingIds?: string[];
  uid?: string;
};

/** Needs (wishlist + inventory) tracking — filter chips, status lifecycle, tap-to-edit, undo-delete */
export function NeedsLog({ childId, siblingIds = [], uid = '' }: Props) {
  const { items, log, update, remove } = useBabyCollection<NeedEntry>(
    childId ?? null,
    DbSubcollection.Needs,
    'Need',
  );
  const { addToast } = useToast();

  const [filter, setFilter] = useState<NeedStatus | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<NeedCategory>(NeedCategory.Apparel);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [editEntry, setEditEntry] = useState<NeedEntry | null>(null);
  const ctrl = useListControls();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [logToAll, setLogToAll] = useState(false);
  const undoRef = useRef(false);
  const hasSiblings = siblingIds.length > 0;

  /** Populates form fields from the selected entry for editing */
  const startEdit = (entry: NeedEntry) => {
    setEditEntry(entry);
    setTitle(entry.title);
    setCategory(entry.category);
    setNotes(entry.notes);
  };

  /** Resets form to defaults */
  const handleCancelEdit = () => {
    setEditEntry(null);
    setTitle('');
    setCategory(NeedCategory.Apparel);
    setNotes('');
  };

  /** Handles form submission — create or update need entry */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      addToast(BabyMsg.NeedTitleRequired, ToastType.Error);
      return;
    }
    setSaving(true);
    const now = new Date().toISOString();

    if (editEntry) {
      const ok = await update({
        ...editEntry,
        title: title.trim(),
        category,
        notes,
        updatedAt: now,
      });
      if (ok) setEditEntry(null);
    } else {
      const entryData = {
        date: todayStr(),
        title: title.trim(),
        category,
        status: NeedStatus.Wishlist,
        notes,
        createdAt: now,
        updatedAt: now,
      };
      const saved = await log(entryData);
      if (!saved) {
        setSaving(false);
        return;
      }
      if (logToAll && hasSiblings && uid) {
        const { ok, failed } = await logToSiblings(
          uid,
          siblingIds,
          DbSubcollection.Needs,
          entryData,
        );
        if (failed > 0) {
          addToast(`${ok} of ${ok + failed} copied — ${failed} failed`, ToastType.Error);
        } else if (ok > 0) {
          addToast(`Copied to ${ok} sibling${ok > 1 ? 's' : ''}`, ToastType.Info);
        }
      }
    }

    setTitle('');
    setNotes('');
    setCategory(NeedCategory.Apparel);
    setSaving(false);
  }

  /** Moves an entry to a new status — suppresses the hook's generic toast to show a status-specific one */
  async function changeStatus(need: NeedEntry, newStatus: NeedStatus) {
    const now = new Date().toISOString();
    const ok = await update({ ...need, status: newStatus, updatedAt: now }, { silent: true });
    if (ok) {
      if (newStatus === NeedStatus.Inventory) {
        addToast(BabyMsg.NeedMovedToInventory, ToastType.Success);
      } else if (newStatus === NeedStatus.Outgrown) {
        addToast(BabyMsg.NeedMovedToOutgrown, ToastType.Success);
      }
    }
  }

  /** Initiates undo-able delete with 10s window */
  const handleUndoDelete = (id: string) => {
    undoRef.current = false;
    setPendingDeleteId(id);
    addToast(BabyMsg.NeedDeleted, ToastType.Info, {
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

  const filtered = filter === null ? items : items.filter((n) => n.status === filter);
  const sortedEntries = sortNewestFirst(
    [...filtered].filter((n) => n.id !== pendingDeleteId),
    (n) => n.createdAt,
  );
  const today = todayStr();
  const dateFilteredEntries = filterByDateRange(
    sortedEntries,
    ctrl.timeRange,
    today,
    (n) => n.date,
  );
  const pagesCount = totalPages(dateFilteredEntries.length, ctrl.pageSize);
  const recentEntries = ctrl.showAll
    ? dateFilteredEntries
    : paginate(dateFilteredEntries, ctrl.page, ctrl.pageSize);

  const filterChips: { label: string; value: NeedStatus | null }[] = [
    { label: 'All', value: null },
    { label: NEED_STATUS_LABELS[NeedStatus.Wishlist], value: NeedStatus.Wishlist },
    { label: NEED_STATUS_LABELS[NeedStatus.Inventory], value: NeedStatus.Inventory },
    { label: NEED_STATUS_LABELS[NeedStatus.Outgrown], value: NeedStatus.Outgrown },
  ];

  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      <h2 className="text-lg font-semibold text-fg">Needs</h2>

      <div className="flex gap-2">
        {filterChips.map((chip) => (
          <button
            key={chip.label}
            type="button"
            onClick={() => setFilter(chip.value)}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${filter === chip.value ? 'bg-accent text-fg-on-accent' : 'bg-surface-card text-fg border border-line'}`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {editEntry && (
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-fg-on-accent">
              Editing: {editEntry.title}
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
          type="text"
          placeholder="What's needed (e.g. winter jacket size 3)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-surface-card border border-line text-fg"
        />

        <div className="flex flex-wrap gap-2">
          {ALL_NEED_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${category === cat ? 'bg-accent text-fg-on-accent' : 'bg-surface-card text-fg border border-line'}`}
            >
              {NEED_CATEGORY_LABELS[cat]}
            </button>
          ))}
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
            {!saving && (editEntry ? 'Update Need' : 'Add to Wishlist')}
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
      <RecentNeeds
        entries={recentEntries}
        today={today}
        onEdit={startEdit}
        editingId={editEntry?.id ?? null}
        onRemove={handleUndoDelete}
        onChangeStatus={changeStatus}
      />
      {!ctrl.showAll && (
        <ListShowMoreFooter
          totalCount={dateFilteredEntries.length}
          shownCount={recentEntries.length}
          pageSize={ctrl.pageSize}
          onShowAll={() => ctrl.setShowAll(true)}
        />
      )}
    </div>
  );
}

/** Renders a sorted list of recent need entries with edit/delete/status-transition actions */
function RecentNeeds({
  entries,
  today,
  onEdit,
  editingId,
  onRemove,
  onChangeStatus,
}: {
  entries: NeedEntry[];
  today: string;
  onEdit: (e: NeedEntry) => void;
  editingId: string | null;
  onRemove: (id: string) => void;
  onChangeStatus: (need: NeedEntry, newStatus: NeedStatus) => void;
}) {
  if (entries.length === 0) return null;

  const groups: Record<string, NeedEntry[]> = {};
  entries.forEach((e) => {
    (groups[e.date] = groups[e.date] || []).push(e);
  });
  const dateKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  return (
    <div className="flex flex-col">
      <h3 className="mb-2 text-sm font-medium text-fg-muted">Recent Needs</h3>
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
                  <span className="font-medium text-fg">
                    {entry.title}
                    <span className="ml-2 text-xs text-fg-muted">
                      {NEED_CATEGORY_LABELS[entry.category]} &middot;{' '}
                      {NEED_STATUS_LABELS[entry.status]}
                    </span>
                  </span>
                  <div className="flex items-center gap-2">
                    {entry.status === NeedStatus.Wishlist && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          onChangeStatus(entry, NeedStatus.Inventory);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.stopPropagation();
                            onChangeStatus(entry, NeedStatus.Inventory);
                          }
                        }}
                        className="rounded border border-line px-2 py-1 text-xs text-accent hover:bg-accent hover:text-fg-on-accent transition-colors"
                      >
                        Bought
                      </span>
                    )}
                    {entry.status === NeedStatus.Inventory && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          onChangeStatus(entry, NeedStatus.Outgrown);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.stopPropagation();
                            onChangeStatus(entry, NeedStatus.Outgrown);
                          }
                        }}
                        className="rounded border border-line px-2 py-1 text-xs text-accent hover:bg-accent hover:text-fg-on-accent transition-colors"
                      >
                        Outgrew
                      </span>
                    )}
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
                      className="text-xs text-fg-muted hover:text-red-500 hover:scale-125 hover:font-bold transition-all"
                    >
                      x
                    </span>
                  </div>
                </div>
                {entry.notes && <p className="text-xs text-fg-muted mt-1">{entry.notes}</p>}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

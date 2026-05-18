import { useState, useRef } from 'react';

import { useBabyCollection } from '@/modules/baby/hooks/useBabyCollection';
import type { Milestone } from '@/modules/baby/types';
import { MilestoneCategory } from '@/modules/baby/types';
import { ALL_MILESTONE_CATEGORIES, MILESTONE_CATEGORY_LABELS } from '@/modules/baby/constants';
import { MILESTONE_TEMPLATES } from '@/modules/baby/milestone-templates';
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
import { useListControls } from '@/shared/hooks/useListControls';
import { filterByDateRange } from '@/shared/utils/filter';
import { paginate, totalPages } from '@/shared/utils/paginate';
import { relativeDateLabel } from '@/shared/utils/relative-date';

/** Props for MilestonesLog component */
type Props = {
  childId?: string;
  siblingIds?: string[];
  uid?: string;
};

/** Local alias for a single milestone template entry */
type TemplateShape = (typeof MILESTONE_TEMPLATES)[number];

/** Milestone tracking — templates + form + grouped-by-category list with tap-to-edit */
export function MilestonesLog({ childId, siblingIds = [], uid = '' }: Props) {
  const { items, log, update, remove } = useBabyCollection<Milestone>(
    childId ?? null,
    DbSubcollection.Milestones,
    'Milestone',
  );
  const { addToast } = useToast();

  const [date, setDate] = useState(todayStr);
  const [category, setCategory] = useState<MilestoneCategory>(MilestoneCategory.Other);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [editEntry, setEditEntry] = useState<Milestone | null>(null);
  const ctrl = useListControls();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [logToAll, setLogToAll] = useState(false);
  const undoRef = useRef(false);
  const hasSiblings = siblingIds.length > 0;

  /** Applies a quick-add template — prefills title and category without submitting */
  const applyTemplate = (template: TemplateShape) => {
    setTitle(template.title);
    setCategory(template.category);
    setEditEntry(null);
  };

  /** Populates form fields from the selected entry for editing */
  const startEdit = (entry: Milestone) => {
    setEditEntry(entry);
    setDate(entry.date);
    setCategory(entry.category);
    setTitle(entry.title);
    setDescription(entry.description ?? '');
    setMediaUrl(entry.mediaUrl ?? '');
    setNotes(entry.notes);
  };

  /** Clears the edit state and resets all form fields to defaults */
  const handleCancelEdit = () => {
    setEditEntry(null);
    setDate(todayStr());
    setCategory(MilestoneCategory.Other);
    setTitle('');
    setDescription('');
    setMediaUrl('');
    setNotes('');
  };

  /** Handles form submission — create or update milestone entry */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      addToast(BabyMsg.MilestoneTitleRequired, ToastType.Error);
      return;
    }
    setSaving(true);
    const now = new Date().toISOString();
    const entryData = {
      date,
      category,
      title: title.trim(),
      description: description.trim() || undefined,
      mediaUrl: mediaUrl.trim() || undefined,
      timestamp: now,
      createdAt: now,
      notes,
    };

    if (editEntry) {
      const ok = await update({ ...editEntry, ...entryData });
      if (ok) setEditEntry(null);
    } else {
      await log(entryData);
      if (logToAll && hasSiblings && uid) {
        const { ok, failed } = await logToSiblings(
          uid,
          siblingIds,
          DbSubcollection.Milestones,
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
    setDescription('');
    setMediaUrl('');
    setNotes('');
    setSaving(false);
  }

  /** Stages a delete with undo toast; fires actual delete after undo window expires */
  const handleUndoDelete = (id: string) => {
    undoRef.current = false;
    setPendingDeleteId(id);
    addToast(BabyMsg.MilestoneDeleted, ToastType.Info, {
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

  const sortedAll = sortNewestFirst(
    [...items].filter((m) => m.id !== pendingDeleteId),
    (m) => `${m.date}T${m.createdAt}`,
  );
  const today = todayStr();
  const filteredAll = filterByDateRange(sortedAll, ctrl.timeRange, today, (m) => m.date);
  const pagesCount = totalPages(filteredAll.length, ctrl.pageSize);
  const visible = ctrl.showAll ? filteredAll : paginate(filteredAll, ctrl.page, ctrl.pageSize);

  // Group visible entries by category, preserving the order within each group
  const grouped = new Map<MilestoneCategory, Milestone[]>();
  for (const m of visible) {
    const list = grouped.get(m.category) ?? [];
    list.push(m);
    grouped.set(m.category, list);
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      <h2 className="text-lg font-semibold text-fg">Milestones</h2>

      <div>
        <p className="mb-2 text-xs uppercase tracking-wide text-fg-muted">Quick-add</p>
        <div className="flex flex-wrap gap-1">
          {MILESTONE_TEMPLATES.map((t) => (
            <button
              key={t.title}
              type="button"
              onClick={() => applyTemplate(t)}
              className="rounded-full border border-line bg-surface-card px-2.5 py-1 text-xs text-fg-muted hover:bg-[var(--accent-muted)] hover:text-fg transition-colors"
            >
              {t.title}
            </button>
          ))}
        </div>
      </div>

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

        <div className="flex gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-surface-card border border-line text-fg"
          />
          <select
            value={category}
            onChange={(e) => setCategory(Number(e.target.value) as MilestoneCategory)}
            className="w-full px-3 py-2 rounded-lg bg-surface-card border border-line text-fg"
          >
            {ALL_MILESTONE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {MILESTONE_CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>

        <input
          type="text"
          placeholder="Milestone title (e.g. First word, New hobby: piano)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-surface-card border border-line text-fg"
        />

        <input
          type="text"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-surface-card border border-line text-fg"
        />

        <input
          type="url"
          placeholder="Media URL (optional)"
          value={mediaUrl}
          onChange={(e) => setMediaUrl(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-surface-card border border-line text-fg"
        />

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
            {!saving && (editEntry ? 'Update Milestone' : 'Log Milestone')}
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

      {sortedAll.length === 0 && (
        <p className="text-sm text-fg-muted text-center">
          No milestones yet — tap a quick-add chip or fill the form.
        </p>
      )}

      {sortedAll.length > 0 && (
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

      {ALL_MILESTONE_CATEGORIES.map((cat) => {
        const entries = grouped.get(cat);
        if (!entries || entries.length === 0) return null;
        return (
          <div key={cat} className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-fg-muted">{MILESTONE_CATEGORY_LABELS[cat]}</h3>
            {entries.map((m) => {
              const isActive = editEntry?.id === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => startEdit(m)}
                  className={`block w-full border-t border-line p-3 text-left transition-colors hover:bg-accent-muted ${isActive ? 'bg-accent-muted border-l-2 border-l-accent' : ''}`}
                >
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-fg">🌟 {m.title}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs tabular-nums text-fg-muted">
                        {(() => {
                          const lbl = relativeDateLabel(m.date, today);
                          return lbl.relative ?? lbl.structural;
                        })()}
                      </span>
                      {m.mediaUrl && (
                        <a
                          href={m.mediaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          aria-label="media"
                          className="text-xs text-accent underline"
                        >
                          media
                        </a>
                      )}
                      <span
                        role="button"
                        tabIndex={0}
                        aria-label="Delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUndoDelete(m.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.stopPropagation();
                            handleUndoDelete(m.id);
                          }
                        }}
                        className="text-xs text-fg-muted hover:text-red-500 hover:scale-125 hover:font-bold transition-all"
                      >
                        x
                      </span>
                    </div>
                  </div>
                  {m.description && <p className="text-xs text-fg-muted mt-1">{m.description}</p>}
                  {m.notes && <p className="text-xs text-fg-muted mt-1">{m.notes}</p>}
                </button>
              );
            })}
          </div>
        );
      })}

      {!ctrl.showAll && (
        <ListShowMoreFooter
          totalCount={filteredAll.length}
          shownCount={visible.length}
          pageSize={ctrl.pageSize}
          onShowAll={() => ctrl.setShowAll(true)}
        />
      )}
    </div>
  );
}

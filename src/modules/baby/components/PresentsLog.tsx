import { useState, useRef } from 'react';

import { useBabyCollection } from '@/modules/baby/hooks/useBabyCollection';
import type { GiftEntry, FinanceEntry } from '@/modules/baby/types';
import { GiftStatus, FinanceStatus } from '@/modules/baby/types';
import {
  GIFT_STATUS_LABELS,
  ALL_GIFT_STATUSES,
  FINANCE_STATUS_LABELS,
  ALL_FINANCE_STATUSES,
} from '@/modules/baby/constants';
import { todayStr } from '@/shared/utils/date';
import { useToast } from '@/shared/errors/useToast';
import { CONFIG } from '@/constants/config';
import { sortNewestFirst } from '@/shared/utils/sort';
import { ToastType } from '@/shared/types';
import { DbSubcollection } from '@/constants/db';
import { ListControls } from '@/shared/components/ListControls';
import { ListShowMoreFooter } from '@/shared/components/ListShowMoreFooter';
import { DateGroupHeader } from '@/shared/components/lists/DateGroupHeader';
import { useListControls } from '@/shared/hooks/useListControls';
import { filterByDateRange } from '@/shared/utils/filter';
import { paginate, totalPages } from '@/shared/utils/paginate';

type Props = {
  childId?: string;
  siblingIds?: string[];
  uid?: string;
};

type PresentType = 'finances' | 'gifts';

/** Presents tracking (Gifts + Finances) — sub-tabs, status lifecycle, tap-to-edit, undo-delete */
export function PresentsLog({ childId, siblingIds = [], uid = '' }: Props) {
  const [activeSubTab, setActiveSubTab] = useState<PresentType>('finances');
  const { addToast } = useToast();
  
  // Finances
  const finances = useBabyCollection<FinanceEntry>(
    childId ?? null,
    DbSubcollection.Finances,
    'Finance Entry'
  );
  
  // Gifts
  const gifts = useBabyCollection<GiftEntry>(
    childId ?? null,
    DbSubcollection.Gifts,
    'Gift'
  );

  const ctrl = useListControls();
  const [editFinance, setEditFinance] = useState<FinanceEntry | null>(null);
  const [editGift, setEditGift] = useState<GiftEntry | null>(null);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [title, setTitle] = useState(''); // description for finance, title for gift
  const [amount, setAmount] = useState('');
  const [giver, setGiver] = useState('');
  const [occasion, setOccasion] = useState('');
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setTitle('');
    setAmount('');
    setGiver('');
    setOccasion('');
    setNotes('');
    setEditFinance(null);
    setEditGift(null);
  };

  const startEditFinance = (entry: FinanceEntry) => {
    setActiveSubTab('finances');
    setEditFinance(entry);
    setTitle(entry.description);
    setAmount(entry.amount.toString());
    setGiver(entry.giver);
    setOccasion(entry.occasion);
    setNotes(entry.notes);
  };

  const startEditGift = (entry: GiftEntry) => {
    setActiveSubTab('gifts');
    setEditGift(entry);
    setTitle(entry.title);
    setGiver(entry.giver);
    setOccasion(entry.occasion);
    setNotes(entry.notes);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      addToast('Description/Title is required', ToastType.Error);
      return;
    }
    setSaving(true);
    const now = new Date().toISOString();

    if (activeSubTab === 'finances') {
      const numAmount = parseFloat(amount) || 0;
      if (editFinance) {
        await finances.update({
          ...editFinance,
          amount: numAmount,
          description: title.trim(),
          giver,
          occasion,
          notes,
          updatedAt: now,
        });
      } else {
        await finances.log({
          date: todayStr(),
          amount: numAmount,
          description: title.trim(),
          giver,
          occasion,
          status: FinanceStatus.Received,
          notes,
          createdAt: now,
          updatedAt: now,
        });
      }
    } else {
      if (editGift) {
        await gifts.update({
          ...editGift,
          title: title.trim(),
          giver,
          occasion,
          notes,
          updatedAt: now,
        });
      } else {
        await gifts.log({
          date: todayStr(),
          title: title.trim(),
          giver,
          occasion,
          status: GiftStatus.Received,
          notes,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    resetForm();
    setSaving(false);
  }

  const items = activeSubTab === 'finances' ? finances.items : gifts.items;
  const sortedEntries = sortNewestFirst(items, (n) => n.createdAt);
  const today = todayStr();
  const dateFilteredEntries = filterByDateRange(
    sortedEntries,
    ctrl.timeRange,
    today,
    (n) => n.date,
  );
  const pagesCount = totalPages(dateFilteredEntries.length, ctrl.pageSize);
  const visibleEntries = ctrl.showAll
    ? dateFilteredEntries
    : paginate(dateFilteredEntries, ctrl.page, ctrl.pageSize);

  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-fg">Presents</h2>
        <div className="flex rounded-lg border border-line bg-surface-card p-1">
          <button
            type="button"
            onClick={() => { setActiveSubTab('finances'); resetForm(); }}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${activeSubTab === 'finances' ? 'bg-accent text-fg-on-accent' : 'text-fg-muted hover:text-fg'}`}
          >
            Finances
          </button>
          <button
            type="button"
            onClick={() => { setActiveSubTab('gifts'); resetForm(); }}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${activeSubTab === 'gifts' ? 'bg-accent text-fg-on-accent' : 'text-fg-muted hover:text-fg'}`}
          >
            Gifts
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {(editFinance || editGift) && (
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-fg-on-accent">
              Editing: {title}
            </span>
            <button
              type="button"
              onClick={resetForm}
              className="text-xs text-fg-muted hover:text-fg"
            >
              Cancel
            </button>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <input
            type="text"
            placeholder={activeSubTab === 'finances' ? "Description (e.g. Birthday Cash)" : "Gift Title (e.g. Lego Set)"}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-surface-card border border-line text-fg"
          />
          
          {activeSubTab === 'finances' && (
            <input
              type="number"
              step="0.01"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-surface-card border border-line text-fg"
            />
          )}

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Giver"
              value={giver}
              onChange={(e) => setGiver(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg bg-surface-card border border-line text-fg"
            />
            <input
              type="text"
              placeholder="Occasion"
              value={occasion}
              onChange={(e) => setOccasion(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg bg-surface-card border border-line text-fg"
            />
          </div>

          <input
            type="text"
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-surface-card border border-line text-fg"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 rounded-lg bg-accent text-fg-on-accent font-medium disabled:opacity-50"
        >
          {saving ? 'Saving...' : (editFinance || editGift ? 'Update' : `Add ${activeSubTab === 'finances' ? 'Finance' : 'Gift'}`)}
        </button>
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

      {activeSubTab === 'finances' ? (
        <FinanceList
          entries={visibleEntries as FinanceEntry[]}
          today={today}
          onEdit={startEditFinance}
          editingId={editFinance?.id ?? null}
          onRemove={finances.remove}
          onStatusChange={(entry, status) => finances.update({ ...entry, status })}
        />
      ) : (
        <GiftList
          entries={visibleEntries as GiftEntry[]}
          today={today}
          onEdit={startEditGift}
          editingId={editGift?.id ?? null}
          onRemove={gifts.remove}
          onStatusChange={(entry, status) => gifts.update({ ...entry, status })}
        />
      )}

      {!ctrl.showAll && (
        <ListShowMoreFooter
          totalCount={dateFilteredEntries.length}
          shownCount={visibleEntries.length}
          pageSize={ctrl.pageSize}
          onShowAll={() => ctrl.setShowAll(true)}
        />
      )}
    </div>
  );
}

function FinanceList({
  entries,
  today,
  onEdit,
  editingId,
  onRemove,
  onStatusChange,
}: {
  entries: FinanceEntry[];
  today: string;
  onEdit: (e: FinanceEntry) => void;
  editingId: string | null;
  onRemove: (id: string) => void;
  onStatusChange: (e: FinanceEntry, s: FinanceStatus) => void;
}) {
  if (entries.length === 0) return null;
  const groups = groupEntriesByDate(entries);
  
  return (
    <div className="flex flex-col gap-2">
      {Object.keys(groups).sort((a,b) => b.localeCompare(a)).map(date => (
        <div key={date}>
          <DateGroupHeader date={date} today={today} />
          {groups[date].map(entry => (
            <div key={entry.id} className={`flex flex-col border-b border-line p-3 gap-1 hover:bg-surface-card transition-colors ${editingId === entry.id ? 'bg-accent-muted border-l-2 border-l-accent' : ''}`}>
              <div className="flex justify-between items-start">
                <div onClick={() => onEdit(entry)} className="cursor-pointer">
                  <p className="font-medium text-fg">{entry.description}</p>
                  <p className="text-xs text-fg-muted">
                    {entry.giver} · {entry.occasion}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <p className="font-bold text-accent">₹{entry.amount.toLocaleString()}</p>
                  <div className="flex items-center gap-1">
                    <select 
                      value={entry.status}
                      onChange={(e) => onStatusChange(entry, parseInt(e.target.value))}
                      className="text-[10px] bg-surface-card border border-line rounded px-1 py-0.5 text-fg-muted outline-none"
                    >
                      {ALL_FINANCE_STATUSES.map(s => (
                        <option key={s} value={s}>{FINANCE_STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                    <button onClick={() => onRemove(entry.id)} className="text-xs text-fg-muted hover:text-red-500 ml-2">x</button>
                  </div>
                </div>
              </div>
              {entry.notes && <p className="text-xs text-fg-muted italic">{entry.notes}</p>}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function GiftList({
  entries,
  today,
  onEdit,
  editingId,
  onRemove,
  onStatusChange,
}: {
  entries: GiftEntry[];
  today: string;
  onEdit: (e: GiftEntry) => void;
  editingId: string | null;
  onRemove: (id: string) => void;
  onStatusChange: (e: GiftEntry, s: GiftStatus) => void;
}) {
  if (entries.length === 0) return null;
  const groups = groupEntriesByDate(entries);

  return (
    <div className="flex flex-col gap-2">
      {Object.keys(groups).sort((a,b) => b.localeCompare(a)).map(date => (
        <div key={date}>
          <DateGroupHeader date={date} today={today} />
          {groups[date].map(entry => (
            <div key={entry.id} className={`flex flex-col border-b border-line p-3 gap-1 hover:bg-surface-card transition-colors ${editingId === entry.id ? 'bg-accent-muted border-l-2 border-l-accent' : ''}`}>
              <div className="flex justify-between items-start">
                <div onClick={() => onEdit(entry)} className="cursor-pointer">
                  <p className="font-medium text-fg">{entry.title}</p>
                  <p className="text-xs text-fg-muted">
                    {entry.giver} · {entry.occasion}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <select 
                    value={entry.status}
                    onChange={(e) => onStatusChange(entry, parseInt(e.target.value))}
                    className="text-[10px] bg-surface-card border border-line rounded px-1 py-0.5 text-fg-muted outline-none"
                  >
                    {ALL_GIFT_STATUSES.map(s => (
                      <option key={s} value={s}>{GIFT_STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                  <button onClick={() => onRemove(entry.id)} className="text-xs text-fg-muted hover:text-red-500 ml-2">x</button>
                </div>
              </div>
              {entry.notes && <p className="text-xs text-fg-muted italic">{entry.notes}</p>}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function groupEntriesByDate<T extends { date: string }>(entries: T[]): Record<string, T[]> {
  const groups: Record<string, T[]> = {};
  entries.forEach((e) => {
    (groups[e.date] = groups[e.date] || []).push(e);
  });
  return groups;
}

import { CATEGORIES } from '@/modules/expenses/categories';
import { computeFamilyTotals } from '@/modules/expenses/budget-math';
import { useFamilyExpenses } from '@/modules/expenses/hooks/useFamilyExpenses';
import type { FamilyExpenseRow } from '@/modules/expenses/hooks/useFamilyExpenses';
import { DateGroupHeader } from '@/shared/components/lists/DateGroupHeader';
import { ListControls } from '@/shared/components/ListControls';
import { ListShowMoreFooter } from '@/shared/components/ListShowMoreFooter';
import { useListControls } from '@/shared/hooks/useListControls';
import { CONFIG } from '@/constants/config';
import { TimeRange } from '@/shared/types';
import { filterByDateRange } from '@/shared/utils/filter';
import { paginate, totalPages } from '@/shared/utils/paginate';
import { sortNewestFirst } from '@/shared/utils/sort';
import { todayStr } from '@/shared/utils/date';

/** Stable member chip palette — index derived from position in the member list */
const CHIP_CLASSES = [
  'bg-indigo-500/15 text-indigo-500',
  'bg-emerald-500/15 text-emerald-600',
  'bg-pink-500/15 text-pink-500',
  'bg-amber-500/15 text-amber-600',
] as const;

/**
 * Read-only Family ledger: every member's expenses in one Daily Ledger list with
 * member attribution chips + per-member totals. No mutators by construction —
 * no delete ×, no swipe, no tap-to-populate (spec D2/D3).
 */
export function FamilyLedgerTab({
  familyId,
  timeRange,
  onTimeRangeChange,
}: {
  familyId: string;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
}) {
  const { rows, members, ready } = useFamilyExpenses(familyId);
  const ctrl = useListControls();
  const today = todayStr();

  /** Chip class for a member uid, stable per membership ordering */
  const chipFor = (uid: string) => {
    const idx = members.findIndex((m) => m.uid === uid);
    return CHIP_CLASSES[(idx >= 0 ? idx : 0) % CHIP_CLASSES.length];
  };

  /** Time-range changes also reset pagination at the list layer */
  const handleTimeRangeChange = (range: TimeRange) => {
    onTimeRangeChange(range);
    ctrl.setPage(1);
    ctrl.setShowAll(false);
  };

  const totals = computeFamilyTotals(members, timeRange, today);
  const sorted = sortNewestFirst(rows, (r) => r.expense.date);
  const filtered = filterByDateRange(sorted, timeRange, today, (r) => r.expense.date);
  const pagesCount = totalPages(filtered.length, ctrl.pageSize);
  const visible = ctrl.showAll ? filtered : paginate(filtered, ctrl.page, ctrl.pageSize);

  if (!ready) {
    return <p className="px-4 py-8 text-center text-fg-muted">Loading family ledger…</p>;
  }
  if (rows.length === 0) {
    return <p className="px-4 py-8 text-center text-fg-muted">No family expenses yet</p>;
  }

  const groups: Record<string, FamilyExpenseRow[]> = {};
  visible.forEach((r) => {
    (groups[r.expense.date] = groups[r.expense.date] || []).push(r);
  });
  const dateKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  return (
    <div className="flex flex-col">
      {/* Per-member contribution summary */}
      <div className="mx-4 mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-line bg-surface-card px-3 py-2">
        {totals.perMember.map((m) => (
          <span
            key={m.uid}
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${chipFor(m.uid)}`}
          >
            {m.name} · {CONFIG.CURRENCY_SYMBOL}
            {m.total}
          </span>
        ))}
        <span className="ml-auto font-mono text-sm font-semibold tabular-nums text-accent">
          {CONFIG.CURRENCY_SYMBOL}
          {totals.familyTotal}
        </span>
      </div>

      <ListControls
        timeRange={timeRange}
        onTimeRangeChange={handleTimeRangeChange}
        pageSize={ctrl.pageSize}
        onPageSizeChange={ctrl.setPageSize}
        page={ctrl.page}
        totalPages={ctrl.showAll ? 1 : pagesCount}
        onPageChange={ctrl.setPage}
      />
      <div className="flex flex-col bg-surface">
        {dateKeys.map((dateKey) => (
          <div key={dateKey}>
            <DateGroupHeader date={dateKey} today={today} />
            {groups[dateKey]!.map(({ expense, ownerUid, ownerName }) => (
              <div
                key={`${ownerUid}-${expense.id}`}
                className="flex items-center justify-between border-t border-line px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-semibold tabular-nums text-accent">
                    {CONFIG.CURRENCY_SYMBOL}
                    {expense.amount}
                  </span>
                  <span className="text-xs text-fg-muted">
                    {CATEGORIES[expense.category]?.label ?? String(expense.category)}
                    {expense.subCat && ` > ${expense.subCat}`}
                  </span>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${chipFor(ownerUid)}`}
                >
                  {ownerName}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
      {!ctrl.showAll && (
        <ListShowMoreFooter
          totalCount={filtered.length}
          shownCount={visible.length}
          pageSize={ctrl.pageSize}
          onShowAll={() => ctrl.setShowAll(true)}
        />
      )}
    </div>
  );
}

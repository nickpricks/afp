import { useAllKidsFinances } from '@/modules/expenses/hooks/useAllKidsFinances';
import { FINANCE_STATUS_LABELS } from '@/modules/baby/constants';
import { computeKidWealth } from '@/modules/baby/presents-math';
import { BudgetMsg } from '@/constants/messages';
import { DateGroupHeader } from '@/shared/components/lists/DateGroupHeader';
import { todayStr } from '@/shared/utils/date';
import { sortNewestFirst } from '@/shared/utils/sort';

/** Aggregate view of all kids' financial entries for the Budget module */
export function KidsFinanceTab() {
  const { entries, loading } = useAllKidsFinances();
  const today = todayStr();

  if (loading) {
    return <div className="py-8 text-center text-fg-muted">Loading kid finances...</div>;
  }

  if (entries.length === 0) {
    return (
      <div className="py-12 text-center flex flex-col items-center gap-2">
        <p className="text-fg-muted italic">{BudgetMsg.KidsTabEmpty}</p>
        <p className="text-xs text-fg-muted px-8">
          Money logged in the Presents tab of a child's profile will appear here.
        </p>
      </div>
    );
  }

  const sorted = sortNewestFirst(entries, (e) => e.date);
  const groups: Record<string, typeof entries> = {};
  sorted.forEach((e) => {
    (groups[e.date] = groups[e.date] || []).push(e);
  });
  const dateKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));
  const totalWealth = computeKidWealth(entries);

  return (
    <div className="flex flex-col gap-4 px-4 pb-20">
      <div className="rounded-lg bg-accent/5 border border-accent/10 p-3 mb-2">
        <p className="text-xs text-accent font-medium">
          Total Kid Wealth: ₹{totalWealth.toLocaleString()}
        </p>
      </div>

      {dateKeys.map((date) => (
        <div key={date} className="flex flex-col">
          <DateGroupHeader date={date} today={today} />
          {(groups[date] ?? []).map((entry) => (
            <div
              key={entry.id}
              className="flex justify-between items-start border-b border-line py-3 px-1"
            >
              <div>
                <p className="font-medium text-fg">{entry.description}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded-full font-bold">
                    {entry.childName}
                  </span>
                  <p className="text-xs text-fg-muted">
                    {entry.giver} · {FINANCE_STATUS_LABELS[entry.status]}
                  </p>
                </div>
              </div>
              <p className="font-bold text-accent">₹{entry.amount.toLocaleString()}</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

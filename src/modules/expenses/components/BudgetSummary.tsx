import { computeTotalIncome, computeTotalSpent, computeCCOutstanding } from '@/modules/expenses/budget-math';
import type { Expense, Income } from '@/modules/expenses/types';
import { CONFIG } from '@/constants/config';

/** Displays budget summary: total income, total spent, remaining balance */
export function BudgetSummary({
  expenses,
  income,
}: {
  expenses: Expense[];
  income: Income[];
}) {
  const totalIncome = computeTotalIncome(income);
  const totalSpent = computeTotalSpent(expenses);
  const remaining = totalIncome - totalSpent;
  const ccOutstanding = computeCCOutstanding(expenses);

  return (
    <div className="mx-4 mb-4 grid grid-cols-2 gap-2">
      <div className="rounded-lg border border-line bg-surface-card px-3 py-2">
        <p className="text-xs text-fg-muted">Income</p>
        <p className="text-lg font-semibold text-fg">
          {CONFIG.CURRENCY_SYMBOL}{totalIncome.toLocaleString()}
        </p>
      </div>
      <div className="rounded-lg border border-line bg-surface-card px-3 py-2">
        <p className="text-xs text-fg-muted">Spent</p>
        <p className="text-lg font-semibold text-fg">
          {CONFIG.CURRENCY_SYMBOL}{totalSpent.toLocaleString()}
        </p>
      </div>
      <div className="rounded-lg border border-line bg-surface-card px-3 py-2">
        <p className="text-xs text-fg-muted">Remaining</p>
        <p className={`text-lg font-semibold ${remaining >= 0 ? 'text-fg' : 'text-error'}`}>
          {CONFIG.CURRENCY_SYMBOL}{remaining.toLocaleString()}
        </p>
      </div>
      {
        ccOutstanding > 0 && (
          <div className="rounded-lg border border-line bg-surface-card px-3 py-2">
            <p className="text-xs text-fg-muted">CC Outstanding</p>
            <p className="text-lg font-semibold text-warning">
              {CONFIG.CURRENCY_SYMBOL}{ccOutstanding.toLocaleString()}
            </p>
          </div>
        )
      }
    </div>
  );
}

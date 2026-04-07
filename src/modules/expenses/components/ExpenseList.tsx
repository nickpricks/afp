import { Trash2 } from 'lucide-react';

import { CATEGORIES, PAYMENT_METHOD_LABELS } from '@/modules/expenses/categories';
import type { Expense } from '@/modules/expenses/types';
import { CONFIG } from '@/constants/config';
import type { ExpenseCategory } from '@/shared/types';

/** Formats a category ID and subcategory into a readable label */
function formatCategory(category: ExpenseCategory, subCat: string): string {
  const label = CATEGORIES[category]?.label ?? String(category);
  return subCat ? `${label} > ${subCat}` : label;
}

/** Displays a sorted list of expenses with delete actions and empty state */
export function ExpenseList({
  expenses,
  onDelete,
}: {
  expenses: Expense[];
  onDelete: (id: string) => void;
}) {
  const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date));

  if (sorted.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-fg-muted">No expenses yet</p>
    );
  }

  return (
    <ul className="flex flex-col gap-2 px-4">
      {
sorted.map((expense) => {
        const pmLabel = PAYMENT_METHOD_LABELS[expense.paymentMethod];
        return (
          <li
            key={expense.id}
            className="flex items-center justify-between rounded-lg border border-line bg-surface-card px-3 py-2"
          >
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="font-medium text-fg">
                  {CONFIG.CURRENCY_SYMBOL}{expense.amount}
                </span>
                {
                  pmLabel && (
                    <span className="rounded bg-surface px-1.5 py-0.5 text-[10px] text-fg-muted">
                      {pmLabel.shortLabel}
                    </span>
                  )
                }
                {
                  expense.isSettlement && (
                    <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[10px] text-accent">
                      Settlement
                    </span>
                  )
                }
              </div>
              <span className="text-xs text-fg-muted">
                {formatCategory(expense.category, expense.subCat)}
              </span>
              <span className="text-xs text-fg-muted">
                {expense.date}
                {expense.note ? ` \u2014 ${expense.note}` : ''}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onDelete(expense.id)}
              className="rounded-lg p-2 text-error hover:bg-surface active:scale-95 transition-transform"
            >
              <Trash2 size={16} />
            </button>
          </li>
        );
      })
}
    </ul>
  );
}

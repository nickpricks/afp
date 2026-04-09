import { useState, useRef } from 'react';
import { Trash2 } from 'lucide-react';

import { CATEGORIES, PAYMENT_METHOD_LABELS } from '@/modules/expenses/categories';
import type { Expense } from '@/modules/expenses/types';
import { sortNewestFirst } from '@/shared/utils/sort';
import { CONFIG } from '@/constants/config';
import type { ExpenseCategory } from '@/shared/types';
import { useToast } from '@/shared/errors/useToast';

/** Formats a category ID and subcategory into a readable label */
function formatCategory(category: ExpenseCategory, subCat: string): string {
  const label = CATEGORIES[category]?.label ?? String(category);
  return subCat ? `${label} > ${subCat}` : label;
}

/** Displays a paginated list of expenses with undo-able delete */
export function ExpenseList({
  expenses,
  onDelete,
}: {
  expenses: Expense[];
  onDelete: (id: string) => void;
}) {
  const { addToast } = useToast();
  const [limit, setLimit] = useState(CONFIG.PAGE_SIZE);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const undoRef = useRef(false);

  const sorted = sortNewestFirst(
    expenses.filter((e) => e.id !== pendingDeleteId),
    (e) => e.date,
  );
  const visible = sorted.slice(0, limit);
  const hasMore = sorted.length > limit;

  /** Optimistic delete with 10s undo window */
  const handleDelete = (id: string) => {
    undoRef.current = false;
    setPendingDeleteId(id);
    addToast('Expense deleted', 'info', {
      durationMs: CONFIG.UNDO_DURATION_MS,
      action: {
        label: 'Undo',
        onClick: () => { undoRef.current = true; setPendingDeleteId(null); },
      },
    });
    setTimeout(() => {
      if (!undoRef.current) {
        onDelete(id);
      }
      setPendingDeleteId(null);
    }, CONFIG.UNDO_DURATION_MS);
  };

  if (sorted.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-fg-muted">No expenses yet</p>
    );
  }

  return (
    <div className="flex flex-col gap-2 px-4">
      <ul className="flex flex-col gap-2">
        {
visible.map((expense) => {
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
                onClick={() => handleDelete(expense.id)}
                className="rounded-lg p-2 text-error hover:bg-surface active:scale-95 transition-transform"
              >
                <Trash2 size={16} />
              </button>
            </li>
          );
        })
}
      </ul>
      {
        hasMore && (
          <button
            type="button"
            onClick={() => setLimit((prev) => prev + CONFIG.PAGE_SIZE)}
            className="text-xs text-accent font-medium py-2 self-center"
          >
            Show more ({sorted.length - limit} remaining)
          </button>
        )
      }
      {
        !hasMore && sorted.length > CONFIG.PAGE_SIZE && (
          <p className="text-xs text-fg-muted text-center py-2">That's all the expenses</p>
        )
      }
    </div>
  );
}

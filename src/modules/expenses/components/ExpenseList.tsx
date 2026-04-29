import { useState, useRef } from 'react';
import { Trash2 } from 'lucide-react';

import { CATEGORIES, PAYMENT_METHOD_LABELS } from '@/modules/expenses/categories';
import type { Expense } from '@/modules/expenses/types';
import { sortNewestFirst } from '@/shared/utils/sort';
import { todayStr } from '@/shared/utils/date';
import { CONFIG } from '@/constants/config';
import { ToastType } from '@/shared/types';
import type { ExpenseCategory } from '@/shared/types';
import { useToast } from '@/shared/errors/useToast';
import { BudgetMsg } from '@/constants/messages';
import { DateGroupHeader } from '@/shared/components/lists/DateGroupHeader';

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
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const undoRef = useRef(false);

  const sorted = sortNewestFirst(
    expenses.filter((e) => e.id !== pendingDeleteId),
    (e) => e.date,
  );

  /** Optimistic delete with 10s undo window */
  const handleDelete = (id: string) => {
    undoRef.current = false;
    setPendingDeleteId(id);
    addToast(BudgetMsg.ExpenseDeleted, ToastType.Info, {
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
      if (!undoRef.current) {
        onDelete(id);
      }
      setPendingDeleteId(null);
    }, CONFIG.UNDO_DURATION_MS);
  };

  if (sorted.length === 0) {
    return <p className="px-4 py-8 text-center text-fg-muted">No expenses yet</p>;
  }

  // Group by date for sticky day headers
  const today = todayStr();
  const groups: Record<string, Expense[]> = {};
  sorted.forEach((e) => {
    (groups[e.date] = groups[e.date] || []).push(e);
  });
  const dateKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  return (
    <div className="flex flex-col bg-surface">
      {dateKeys.map((dateKey) => (
        <div key={dateKey}>
          <DateGroupHeader date={dateKey} today={today} />
          {groups[dateKey]!.map((expense) => {
            const pmLabel = PAYMENT_METHOD_LABELS[expense.paymentMethod];
            return (
              <div
                key={expense.id}
                className="flex items-center justify-between border-t border-line px-4 py-3 transition-colors hover:bg-accent-muted"
              >
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-semibold tabular-nums text-accent">
                      {CONFIG.CURRENCY_SYMBOL}
                      {expense.amount}
                    </span>
                    {pmLabel && (
                      <span className="rounded bg-surface-card px-1.5 py-0.5 text-[10px] text-fg-muted">
                        {pmLabel.shortLabel}
                      </span>
                    )}
                    {expense.isSettlement && (
                      <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[10px] text-accent">
                        Settlement
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-fg-muted">
                    {formatCategory(expense.category, expense.subCat)}
                  </span>
                  {expense.note && (
                    <span className="text-xs text-fg-muted">\u2014 {expense.note}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(expense.id)}
                  className="rounded-lg p-2 text-error hover:bg-surface active:scale-95 transition-transform"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

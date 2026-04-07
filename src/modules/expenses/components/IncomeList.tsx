import { Trash2 } from 'lucide-react';

import { INCOME_SOURCE_LABELS } from '@/modules/expenses/categories';
import type { Income } from '@/modules/expenses/types';
import { CONFIG } from '@/constants/config';

/** Displays a sorted list of income entries with delete actions and empty state */
export function IncomeList({
  income,
  onDelete,
}: {
  income: Income[];
  onDelete: (id: string) => void;
}) {
  const sorted = [...income].sort((a, b) => b.date.localeCompare(a.date));

  if (sorted.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-fg-muted">No income yet</p>
    );
  }

  return (
    <ul className="flex flex-col gap-2 px-4">
      {
sorted.map((entry) => {
        const sourceLabel = INCOME_SOURCE_LABELS[entry.source];
        return (
          <li
            key={entry.id}
            className="flex items-center justify-between rounded-lg border border-line bg-surface-card px-3 py-2"
          >
            <div className="flex flex-col gap-0.5">
              <span className="font-medium text-fg">
                {CONFIG.CURRENCY_SYMBOL}{entry.amount.toLocaleString()}
              </span>
              <span className="text-xs text-fg-muted">
                {sourceLabel.emoji} {sourceLabel.label}
              </span>
              <span className="text-xs text-fg-muted">
                {entry.date}
                {entry.note ? ` \u2014 ${entry.note}` : ''}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onDelete(entry.id)}
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

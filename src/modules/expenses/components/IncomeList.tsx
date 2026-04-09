import { useState, useRef } from 'react';
import { Trash2 } from 'lucide-react';

import { INCOME_SOURCE_LABELS } from '@/modules/expenses/categories';
import type { Income } from '@/modules/expenses/types';
import { sortNewestFirst } from '@/shared/utils/sort';
import { CONFIG } from '@/constants/config';
import { useToast } from '@/shared/errors/useToast';

/** Displays a paginated list of income entries with undo-able delete */
export function IncomeList({
  income,
  onDelete,
}: {
  income: Income[];
  onDelete: (id: string) => void;
}) {
  const { addToast } = useToast();
  const [limit, setLimit] = useState(CONFIG.PAGE_SIZE);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const undoRef = useRef(false);

  const sorted = sortNewestFirst(
    income.filter((e) => e.id !== pendingDeleteId),
    (e) => e.date,
  );
  const visible = sorted.slice(0, limit);
  const hasMore = sorted.length > limit;

  const handleDelete = (id: string) => {
    undoRef.current = false;
    setPendingDeleteId(id);
    addToast('Income deleted', 'info', {
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
      <p className="px-4 py-8 text-center text-fg-muted">No income yet</p>
    );
  }

  return (
    <div className="flex flex-col gap-2 px-4">
      <ul className="flex flex-col gap-2">
        {
visible.map((entry) => {
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
                onClick={() => handleDelete(entry.id)}
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
          <p className="text-xs text-fg-muted text-center py-2">That's all the income</p>
        )
      }
    </div>
  );
}

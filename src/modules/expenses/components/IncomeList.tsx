import { useState, useRef } from 'react';
import { Trash2 } from 'lucide-react';

import { INCOME_SOURCE_LABELS } from '@/modules/expenses/categories';
import type { Income } from '@/modules/expenses/types';
import { sortNewestFirst } from '@/shared/utils/sort';
import { todayStr } from '@/shared/utils/date';
import { CONFIG } from '@/constants/config';
import { useToast } from '@/shared/errors/useToast';
import { BudgetMsg } from '@/constants/messages';
import { ToastType } from '@/shared/types';
import { DateGroupHeader } from '@/shared/components/lists/DateGroupHeader';

/** Displays a paginated list of income entries with undo-able delete */
export function IncomeList({
  income,
  onDelete,
}: {
  income: Income[];
  onDelete: (id: string) => void;
}) {
  const { addToast } = useToast();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const undoRef = useRef(false);

  const sorted = sortNewestFirst(
    income.filter((e) => e.id !== pendingDeleteId),
    (e) => e.date,
  );

  const handleDelete = (id: string) => {
    undoRef.current = false;
    setPendingDeleteId(id);
    addToast(BudgetMsg.IncomeDeleted, ToastType.Info, {
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
    return <p className="px-4 py-8 text-center text-fg-muted">No income yet</p>;
  }

  const today = todayStr();
  const groups: Record<string, Income[]> = {};
  sorted.forEach((e) => {
    (groups[e.date] = groups[e.date] || []).push(e);
  });
  const dateKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  return (
    <div className="flex flex-col bg-surface">
      {dateKeys.map((dateKey) => (
        <div key={dateKey}>
          <DateGroupHeader date={dateKey} today={today} />
          {groups[dateKey]!.map((entry) => {
            const sourceLabel = INCOME_SOURCE_LABELS[entry.source];
            return (
              <div
                key={entry.id}
                className="flex items-center justify-between border-t border-line px-4 py-3 transition-colors hover:bg-accent-muted"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-base font-semibold tabular-nums text-accent">
                    {CONFIG.CURRENCY_SYMBOL}
                    {entry.amount.toLocaleString()}
                  </span>
                  <span className="text-xs text-fg-muted">
                    {sourceLabel.emoji} {sourceLabel.label}
                  </span>
                  {entry.note && (
                    <span className="text-xs text-fg-muted">\u2014 {entry.note}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(entry.id)}
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

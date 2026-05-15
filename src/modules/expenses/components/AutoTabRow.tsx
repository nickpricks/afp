import type { Expense } from '@/modules/expenses/types';
import { renderBadge } from '@/modules/expenses/expense-badges';
import { CATEGORIES, PAYMENT_METHOD_LABELS } from '@/modules/expenses/categories';
import { CONFIG } from '@/constants/config';

interface AutoTabRowProps {
  expense: Expense;
  isActive: boolean;
  onTap: () => void;
  onDelete: () => void;
}

/** A single Auto tab row — amount, payment method, category, badge, with tap-to-edit and delete. */
export function AutoTabRow({ expense, isActive, onTap, onDelete }: AutoTabRowProps) {
  const pmLabel = PAYMENT_METHOD_LABELS[expense.paymentMethod];
  const catLabel = CATEGORIES[expense.category]?.label ?? '';
  const badge = renderBadge(expense.meta);

  return (
    <div
      role="button"
      tabIndex={0}
      className={`flex items-center justify-between border-t border-line px-4 py-3 transition-colors ${
        isActive ? 'bg-[var(--accent-muted)] border-l-2 border-l-accent' : 'hover:bg-accent-muted'
      }`}
      onClick={onTap}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onTap();
        }
      }}
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
        </div>
        <span className="text-xs text-fg-muted">
          {catLabel} {expense.subCat && `> ${expense.subCat}`}
        </span>
        {badge && <span className="text-[11px] text-fg-muted">{badge}</span>}
        {!expense.meta && (
          <span className="rounded bg-fg-muted/10 px-1.5 py-0.5 text-[10px] text-fg-muted">
            incomplete
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="text-fg-muted hover:text-red-500 hover:scale-125 hover:font-bold transition-all"
      >
        ×
      </button>
    </div>
  );
}

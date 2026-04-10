import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

import { BudgetSummary } from '@/modules/expenses/components/BudgetSummary';
import { ExpenseList } from '@/modules/expenses/components/ExpenseList';
import { IncomeList } from '@/modules/expenses/components/IncomeList';
import { ReconciliationView } from '@/modules/expenses/components/ReconciliationView';
import { useExpenses } from '@/modules/expenses/hooks/useExpenses';
import { useIncome } from '@/modules/expenses/hooks/useIncome';
import { filterByDateRange } from '@/modules/expenses/budget-math';
import { ROUTES } from '@/constants/routes';
import { BudgetView } from '@/shared/types';
import { todayStr } from '@/shared/utils/date';

type BudgetTab = 'expenses' | 'income' | 'reconcile';

const VIEW_OPTIONS: { id: BudgetView; label: string }[] = [
  { id: BudgetView.Today, label: 'Today' },
  { id: BudgetView.Week, label: 'Week' },
  { id: BudgetView.Month, label: 'Month' },
  { id: BudgetView.All, label: 'All' },
];

/** Page wrapper showing budget summary, expense/income toggle, and list */
export function ExpenseListPage() {
  const { expenses, deleteExpense } = useExpenses();
  const { income, deleteIncome } = useIncome();
  const [activeTab, setActiveTab] = useState<BudgetTab>('expenses');
  const [view, setView] = useState<BudgetView>(BudgetView.All);

  const today = todayStr();
  const filteredExpenses = filterByDateRange(expenses, view, today);
  const filteredIncome = filterByDateRange(income, view, today);

  return (
    <div className="relative">
      <BudgetSummary expenses={filteredExpenses} income={filteredIncome} />

      {/* Time-range filter */}
      <div className="mx-4 mb-3 flex gap-1 rounded-lg border border-line bg-surface-card p-1">
        {
          VIEW_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setView(opt.id)}
              className={
                `flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                  view === opt.id
                    ? 'bg-accent text-fg-on-accent'
                    : 'text-fg-muted hover:text-fg'
                }`
              }
            >
              {opt.label}
            </button>
          ))
        }
      </div>

      <div className="mx-4 mb-3 flex rounded-lg border border-line bg-surface-card p-1">
        <button
          type="button"
          onClick={() => setActiveTab('expenses')}
          className={
`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            activeTab === 'expenses'
              ? 'bg-accent text-fg-on-accent'
              : 'text-fg-muted hover:text-fg'
          }`
}
        >
          Expenses
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('income')}
          className={
`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            activeTab === 'income'
              ? 'bg-accent text-fg-on-accent'
              : 'text-fg-muted hover:text-fg'
          }`
}
        >
          Income
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('reconcile')}
          className={
`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            activeTab === 'reconcile'
              ? 'bg-accent text-fg-on-accent'
              : 'text-fg-muted hover:text-fg'
          }`
}
        >
          CC
        </button>
      </div>

      {activeTab === 'expenses' && <ExpenseList expenses={filteredExpenses} onDelete={deleteExpense} />}
      {activeTab === 'income' && <IncomeList income={filteredIncome} onDelete={deleteIncome} />}
      {activeTab === 'reconcile' && <ReconciliationView expenses={filteredExpenses} />}

      <Link
        to={ROUTES.BUDGET_ADD}
        className="fixed bottom-20 right-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-fg-on-accent shadow-lg transition hover:bg-accent/90 active:scale-95"
        aria-label="Add entry"
      >
        <Plus size={24} />
      </Link>
    </div>
  );
}

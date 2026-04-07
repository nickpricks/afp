import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

import { BudgetSummary } from '@/modules/expenses/components/BudgetSummary';
import { ExpenseList } from '@/modules/expenses/components/ExpenseList';
import { IncomeList } from '@/modules/expenses/components/IncomeList';
import { useExpenses } from '@/modules/expenses/hooks/useExpenses';
import { useIncome } from '@/modules/expenses/hooks/useIncome';
import { ROUTES } from '@/constants/routes';

type BudgetTab = 'expenses' | 'income';

/** Page wrapper showing budget summary, expense/income toggle, and list */
export function ExpenseListPage() {
  const { expenses, deleteExpense } = useExpenses();
  const { income, deleteIncome } = useIncome();
  const [activeTab, setActiveTab] = useState<BudgetTab>('expenses');

  return (
    <div className="relative">
      <BudgetSummary expenses={expenses} income={income} />

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
      </div>

      {activeTab === 'expenses' && <ExpenseList expenses={expenses} onDelete={deleteExpense} />}
      {activeTab === 'income' && <IncomeList income={income} onDelete={deleteIncome} />}

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

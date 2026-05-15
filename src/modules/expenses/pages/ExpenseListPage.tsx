import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

import { BudgetSummary } from '@/modules/expenses/components/BudgetSummary';
import { ExpenseList } from '@/modules/expenses/components/ExpenseList';
import { IncomeList } from '@/modules/expenses/components/IncomeList';
import { ReconciliationView } from '@/modules/expenses/components/ReconciliationView';
import { AutoTab } from '@/modules/expenses/components/AutoTab';
import { useExpenses } from '@/modules/expenses/hooks/useExpenses';
import { useIncome } from '@/modules/expenses/hooks/useIncome';
import { ROUTES } from '@/constants/routes';

type BudgetTab = 'expenses' | 'income' | 'auto' | 'reconcile';

/** Page wrapper showing budget summary, expense/income/auto tabs, and list */
export function ExpenseListPage() {
  const { expenses, addExpense, updateExpense, deleteExpense } = useExpenses();
  const { income, deleteIncome } = useIncome();
  const [activeTab, setActiveTab] = useState<BudgetTab>('expenses');

  return (
    <div className="relative">
      <BudgetSummary expenses={expenses} income={income} />

      <div className="mx-4 mb-3 flex rounded-lg border border-line bg-surface-card p-1">
        <TabButton
          label="Expenses"
          isActive={activeTab === 'expenses'}
          onClick={() => setActiveTab('expenses')}
        />
        <TabButton
          label="Income"
          isActive={activeTab === 'income'}
          onClick={() => setActiveTab('income')}
        />
        <TabButton
          label="Auto"
          isActive={activeTab === 'auto'}
          onClick={() => setActiveTab('auto')}
        />
        <TabButton
          label="CC"
          isActive={activeTab === 'reconcile'}
          onClick={() => setActiveTab('reconcile')}
        />
      </div>

      {activeTab === 'expenses' && (
        <ExpenseList expenses={expenses} onDelete={deleteExpense} />
      )}
      {activeTab === 'income' && <IncomeList income={income} onDelete={deleteIncome} />}
      {activeTab === 'auto' && (
        <AutoTab
          expenses={expenses}
          onAdd={(input) =>
            addExpense({
              date: input.date,
              category: input.category,
              subCat: input.subCat,
              amount: input.amount,
              paymentMethod: input.paymentMethod,
              note: input.note,
              meta: input.meta,
            })
          }
          onUpdate={updateExpense}
          onDelete={deleteExpense}
        />
      )}
      {activeTab === 'reconcile' && <ReconciliationView expenses={expenses} />}

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

function TabButton({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
        isActive ? 'bg-accent text-fg-on-accent' : 'text-fg-muted hover:text-fg'
      }`}
    >
      {label}
    </button>
  );
}

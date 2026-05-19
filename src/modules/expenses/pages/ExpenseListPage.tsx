import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

import { BudgetSummary } from '@/modules/expenses/components/BudgetSummary';
import { ExpenseList } from '@/modules/expenses/components/ExpenseList';
import { IncomeList } from '@/modules/expenses/components/IncomeList';
import { KidsFinanceTab } from '@/modules/expenses/components/KidsFinanceTab';
import { ReconciliationView } from '@/modules/expenses/components/ReconciliationView';
import { AutoTab } from '@/modules/expenses/components/AutoTab';
import { useExpenses } from '@/modules/expenses/hooks/useExpenses';
import { useIncome } from '@/modules/expenses/hooks/useIncome';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/shared/auth/useAuth';
import { ModuleId, TimeRange } from '@/shared/types';
import { PaymentMethod } from '@/shared/types';

/** Union of budget tab identifiers for the ExpenseListPage tab switcher */
type BudgetTab = 'expenses' | 'income' | 'kids' | 'auto' | 'reconcile';

/** Page wrapper showing budget summary, expense/income/kids/auto/CC tabs, and list */
export function ExpenseListPage() {
  const { expenses, addExpense, updateExpense, deleteExpense } = useExpenses();
  const { income, deleteIncome } = useIncome();
  const { profile } = useAuth();
  const babyEnabled = profile?.modules?.[ModuleId.Baby] === true;
  const [activeTab, setActiveTab] = useState<BudgetTab>('expenses');
  // Shared across BudgetSummary + ExpenseList + IncomeList so summary card matches list contents.
  // Pagination stays per-list; only the date filter is hoisted.
  const [timeRange, setTimeRange] = useState<TimeRange>(TimeRange.All);

  return (
    <div className="relative">
      <BudgetSummary expenses={expenses} income={income} timeRange={timeRange} />

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
          label="CC"
          isActive={activeTab === 'reconcile'}
          onClick={() => setActiveTab('reconcile')}
        />
        {babyEnabled && (
          <TabButton
            label="Kids"
            isActive={activeTab === 'kids'}
            onClick={() => setActiveTab('kids')}
          />
        )}
        <TabButton
          label="Auto"
          isActive={activeTab === 'auto'}
          onClick={() => setActiveTab('auto')}
        />
      </div>

      {activeTab === 'expenses' && (
        <ExpenseList
          expenses={expenses}
          onDelete={deleteExpense}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
        />
      )}
      {activeTab === 'income' && (
        <IncomeList
          income={income}
          onDelete={deleteIncome}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
        />
      )}
      {activeTab === 'kids' && <KidsFinanceTab />}
      {activeTab === 'auto' && (
        <AutoTab
          expenses={expenses}
          onAdd={(input) =>
            addExpense({
              date: input.date,
              category: input.category,
              subCat: input.subCat,
              amount: input.amount,
              // Auto tab's payment-method picker can yield null — the hook validates and toasts
              // PaymentMethodRequired. Default to UPI here only when input is explicitly null
              // AND we want the legacy fallback (currently we let the hook flag it).
              paymentMethod: input.paymentMethod ?? PaymentMethod.UpiBankAccount,
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

/** Single tab button pill for the budget tab strip */
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

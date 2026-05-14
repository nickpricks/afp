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
import { ListControls } from '@/shared/components/ListControls';
import { ListShowMoreFooter } from '@/shared/components/ListShowMoreFooter';
import { useListControls } from '@/shared/hooks/useListControls';
import { useAuth } from '@/shared/auth/useAuth';
import { ModuleId } from '@/shared/types';
import { todayStr } from '@/shared/utils/date';
import { filterByDateRange } from '@/shared/utils/filter';
import { paginate, totalPages } from '@/shared/utils/paginate';
import { PaymentMethod } from '@/shared/types';

type BudgetTab = 'expenses' | 'income' | 'kids' | 'auto' | 'reconcile';

/** Page wrapper showing budget summary, expense/income/auto tabs, and list */
export function ExpenseListPage() {
  const { expenses, addExpense, updateExpense, deleteExpense } = useExpenses();
  const { income, deleteIncome } = useIncome();
  const { profile } = useAuth();
  const babyEnabled = profile?.modules?.[ModuleId.Baby] === true;
  const [activeTab, setActiveTab] = useState<BudgetTab>('expenses');
  const ctrl = useListControls();

  const today = todayStr();
  const filteredExpenses = filterByDateRange(expenses, ctrl.timeRange, today, (e) => e.date);
  const filteredIncome = filterByDateRange(income, ctrl.timeRange, today, (i) => i.date);

  const activeFiltered = activeTab === 'income' ? filteredIncome : filteredExpenses;
  const pagesCount = totalPages(activeFiltered.length, ctrl.pageSize);
  const visibleExpenses = ctrl.showAll
    ? filteredExpenses
    : paginate(filteredExpenses, ctrl.page, ctrl.pageSize);
  const visibleIncome = ctrl.showAll
    ? filteredIncome
    : paginate(filteredIncome, ctrl.page, ctrl.pageSize);
  const visibleCount = activeTab === 'income' ? visibleIncome.length : visibleExpenses.length;

  return (
    <div className="relative">
      <BudgetSummary expenses={filteredExpenses} income={filteredIncome} />

      {activeTab !== 'auto' && activeTab !== 'kids' && (
        <ListControls
          timeRange={ctrl.timeRange}
          onTimeRangeChange={ctrl.setTimeRange}
          pageSize={ctrl.pageSize}
          onPageSizeChange={ctrl.setPageSize}
          page={ctrl.page}
          totalPages={ctrl.showAll ? 1 : pagesCount}
          onPageChange={ctrl.setPage}
        />
      )}

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
        <ExpenseList expenses={visibleExpenses} onDelete={deleteExpense} />
      )}
      {activeTab === 'income' && <IncomeList income={visibleIncome} onDelete={deleteIncome} />}
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
              note: input.note,
              meta: input.meta,
              // Auto tab is a quick-add for vehicle expenses with no payment-method picker.
              // The default is set explicitly here (not silently in the hook) so the choice
              // is visible at the call site; a future picker would replace this default.
              paymentMethod: PaymentMethod.UpiBankAccount,
            })
          }
          onUpdate={updateExpense}
          onDelete={deleteExpense}
        />
      )}
      {activeTab === 'reconcile' && <ReconciliationView expenses={filteredExpenses} />}

      {(activeTab === 'expenses' || activeTab === 'income') && !ctrl.showAll && (
        <ListShowMoreFooter
          totalCount={activeFiltered.length}
          shownCount={visibleCount}
          pageSize={ctrl.pageSize}
          onShowAll={() => ctrl.setShowAll(true)}
        />
      )}

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

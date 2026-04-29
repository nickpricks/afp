import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

import { BudgetSummary } from '@/modules/expenses/components/BudgetSummary';
import { ExpenseList } from '@/modules/expenses/components/ExpenseList';
import { IncomeList } from '@/modules/expenses/components/IncomeList';
import { ReconciliationView } from '@/modules/expenses/components/ReconciliationView';
import { useExpenses } from '@/modules/expenses/hooks/useExpenses';
import { useIncome } from '@/modules/expenses/hooks/useIncome';
import { ROUTES } from '@/constants/routes';
import { ListControls } from '@/shared/components/ListControls';
import { ListShowMoreFooter } from '@/shared/components/ListShowMoreFooter';
import { useListControls } from '@/shared/hooks/useListControls';
import { todayStr } from '@/shared/utils/date';
import { filterByDateRange } from '@/shared/utils/filter';
import { paginate, totalPages } from '@/shared/utils/paginate';

type BudgetTab = 'expenses' | 'income' | 'reconcile';

/** Page wrapper showing budget summary, expense/income toggle, and list */
export function ExpenseListPage() {
  const { expenses, deleteExpense } = useExpenses();
  const { income, deleteIncome } = useIncome();
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

      <ListControls
        timeRange={ctrl.timeRange}
        onTimeRangeChange={ctrl.setTimeRange}
        pageSize={ctrl.pageSize}
        onPageSizeChange={ctrl.setPageSize}
        page={ctrl.page}
        totalPages={ctrl.showAll ? 1 : pagesCount}
        onPageChange={ctrl.setPage}
      />

      <div className="mx-4 mb-3 flex rounded-lg border border-line bg-surface-card p-1">
        <button
          type="button"
          onClick={() => setActiveTab('expenses')}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            activeTab === 'expenses' ? 'bg-accent text-fg-on-accent' : 'text-fg-muted hover:text-fg'
          }`}
        >
          Expenses
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('income')}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            activeTab === 'income' ? 'bg-accent text-fg-on-accent' : 'text-fg-muted hover:text-fg'
          }`}
        >
          Income
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('reconcile')}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            activeTab === 'reconcile'
              ? 'bg-accent text-fg-on-accent'
              : 'text-fg-muted hover:text-fg'
          }`}
        >
          CC
        </button>
      </div>

      {activeTab === 'expenses' && (
        <ExpenseList expenses={visibleExpenses} onDelete={deleteExpense} />
      )}
      {activeTab === 'income' && <IncomeList income={visibleIncome} onDelete={deleteIncome} />}
      {activeTab === 'reconcile' && <ReconciliationView expenses={filteredExpenses} />}

      {activeTab !== 'reconcile' && !ctrl.showAll && (
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

import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

import { ExpenseList } from '@/modules/expenses/components/ExpenseList';
import { useExpenses } from '@/modules/expenses/hooks/useExpenses';
import { ROUTES } from '@/constants/routes';

/** Page wrapper that connects ExpenseList to the expense data hook */
export function ExpenseListPage() {
  const { expenses, deleteExpense } = useExpenses();

  return (
    <div className="relative">
      <ExpenseList expenses={expenses} onDelete={deleteExpense} />
      <Link
        to={ROUTES.BUDGET_ADD}
        className="fixed bottom-20 right-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-fg-on-accent shadow-lg transition hover:bg-accent-hover active:scale-95"
        aria-label="Add expense"
      >
        <Plus size={24} />
      </Link>
    </div>
  );
}

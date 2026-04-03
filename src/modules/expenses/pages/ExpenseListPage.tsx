import { ExpenseList } from '@/modules/expenses/components/ExpenseList';
import { useExpenses } from '@/modules/expenses/hooks/useExpenses';

/** Page wrapper that connects ExpenseList to the expense data hook */
export function ExpenseListPage() {
  const { expenses, deleteExpense } = useExpenses();

  return <ExpenseList expenses={expenses} onDelete={deleteExpense} />;
}

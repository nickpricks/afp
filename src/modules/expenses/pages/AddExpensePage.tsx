import { useNavigate } from 'react-router-dom';

import { AddExpense } from '@/modules/expenses/components/AddExpense';
import { useExpenses } from '@/modules/expenses/hooks/useExpenses';

/** Page wrapper that connects AddExpense to the expense data hook */
export function AddExpensePage() {
  const { addExpense } = useExpenses();
  const navigate = useNavigate();

  /** Submits the expense and navigates back to the list on success */
  async function handleSubmit(input: {
    date: string;
    category: string;
    subCat: string;
    amount: number;
    note: string;
  }): Promise<boolean> {
    const success = await addExpense(input);
    if (success) {
      navigate('/expenses', { replace: true });
    }
    return success;
  }

  return <AddExpense onSubmit={handleSubmit} />;
}

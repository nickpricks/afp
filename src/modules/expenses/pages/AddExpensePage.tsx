import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { AddExpense } from '@/modules/expenses/components/AddExpense';
import { AddIncome } from '@/modules/expenses/components/AddIncome';
import { useExpenses } from '@/modules/expenses/hooks/useExpenses';
import { useIncome } from '@/modules/expenses/hooks/useIncome';
import { ROUTES } from '@/constants/routes';
import type { ExpenseCategory, IncomeSource, PaymentMethod } from '@/shared/types';

type AddTab = 'expense' | 'income';

/** Page wrapper with Expense/Income toggle and the corresponding add form */
export function AddExpensePage() {
  const { addExpense } = useExpenses();
  const { addIncome } = useIncome();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AddTab>('expense');

  /** Submits the expense and navigates back on success */
  async function handleExpenseSubmit(input: {
    date: string;
    category: ExpenseCategory;
    subCat: string;
    amount: number;
    paymentMethod: PaymentMethod | null;
    isSettlement: boolean;
    note: string;
  }): Promise<boolean> {
    const success = await addExpense({
      ...input,
      paymentMethod: input.paymentMethod ?? undefined,
    });
    if (success) {
      navigate(ROUTES.BUDGET, { replace: true });
    }
    return success;
  }

  /** Submits the income and navigates back on success */
  async function handleIncomeSubmit(input: {
    date: string;
    source: IncomeSource;
    amount: number;
    paymentMethod: PaymentMethod;
    note: string;
  }): Promise<boolean> {
    const success = await addIncome(input);
    if (success) {
      navigate(ROUTES.BUDGET, { replace: true });
    }
    return success;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="mx-4 flex rounded-lg border border-line bg-surface-card p-1">
        <button
          type="button"
          onClick={() => setActiveTab('expense')}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            activeTab === 'expense' ? 'bg-accent text-fg-on-accent' : 'text-fg-muted hover:text-fg'
          }`}
        >
          Expense
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
      </div>

      {activeTab === 'expense' && <AddExpense onSubmit={handleExpenseSubmit} />}
      {activeTab === 'income' && <AddIncome onSubmit={handleIncomeSubmit} />}
    </div>
  );
}

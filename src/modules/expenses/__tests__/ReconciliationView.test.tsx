import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ReconciliationView } from '@/modules/expenses/components/ReconciliationView';
import type { Expense } from '@/modules/expenses/types';
import { ExpenseCategory, PaymentMethod } from '@/shared/types';

/** Creates a minimal expense for testing */
function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: crypto.randomUUID(),
    date: '2026-04-07',
    category: ExpenseCategory.Food,
    subCat: '',
    amount: 100,
    paymentMethod: PaymentMethod.UpiBankAccount,
    isSettlement: false,
    note: '',
    isDeleted: false,
    createdAt: '2026-04-07T00:00:00Z',
    updatedAt: '2026-04-07T00:00:00Z',
    ...overrides,
  };
}

describe('ReconciliationView', () => {
  it('shows Charged, Settled, and Outstanding summary cards', () => {
    const expenses = [
      makeExpense({ amount: 1000, paymentMethod: PaymentMethod.CreditCard }),
      makeExpense({ amount: 500, paymentMethod: PaymentMethod.UpiCreditCard }),
      makeExpense({ amount: 300, isSettlement: true }),
      makeExpense({ amount: 200, paymentMethod: PaymentMethod.UpiBankAccount }),
    ];
    render(<ReconciliationView expenses={expenses} />);
    // Summary labels exist
    expect(screen.getByText('Charged')).toBeInTheDocument();
    expect(screen.getByText('Settled')).toBeInTheDocument();
    expect(screen.getByText('Outstanding')).toBeInTheDocument();
    // CC Charges section header
    expect(screen.getByText('CC Charges')).toBeInTheDocument();
    // Settlements section header
    expect(screen.getByText('Settlements')).toBeInTheDocument();
  });

  it('computes correct outstanding (charged - settled)', () => {
    const expenses = [
      makeExpense({ amount: 1000, paymentMethod: PaymentMethod.CreditCard }),
      makeExpense({ amount: 300, isSettlement: true }),
    ];
    render(<ReconciliationView expenses={expenses} />);
    // Outstanding: 1000 - 300 = 700 — unique value, no ambiguity
    expect(screen.getByText(/700/)).toBeInTheDocument();
  });

  it('shows "No CC activity" when no credit card expenses', () => {
    const expenses = [makeExpense({ amount: 100, paymentMethod: PaymentMethod.UpiBankAccount })];
    render(<ReconciliationView expenses={expenses} />);
    expect(screen.getByText(/no cc activity/i)).toBeInTheDocument();
  });
});

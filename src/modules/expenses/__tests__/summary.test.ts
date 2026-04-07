import { describe, it, expect } from 'vitest';

import {
  computeTotalIncome,
  computeTotalSpent,
  computeCCOutstanding,
} from '@/modules/expenses/budget-math';
import type { Expense, Income } from '@/modules/expenses/types';
import { ExpenseCategory, IncomeSource, PaymentMethod } from '@/shared/types';

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

/** Creates a minimal income for testing */
function makeIncome(overrides: Partial<Income> = {}): Income {
  return {
    id: crypto.randomUUID(),
    date: '2026-04-07',
    amount: 1000,
    source: IncomeSource.Salary,
    paymentMethod: PaymentMethod.UpiBankAccount,
    note: '',
    createdAt: '2026-04-07T00:00:00Z',
    updatedAt: '2026-04-07T00:00:00Z',
    ...overrides,
  };
}

describe('computeTotalIncome', () => {
  it('sums all income entries', () => {
    const income = [makeIncome({ amount: 5000 }), makeIncome({ amount: 3000 })];
    expect(computeTotalIncome(income)).toBe(8000);
  });

  it('returns 0 for empty array', () => {
    expect(computeTotalIncome([])).toBe(0);
  });
});

describe('computeTotalSpent', () => {
  it('sums all non-settlement expenses', () => {
    const expenses = [
      makeExpense({ amount: 200 }),
      makeExpense({ amount: 300 }),
    ];
    expect(computeTotalSpent(expenses)).toBe(500);
  });

  it('excludes settlement expenses', () => {
    const expenses = [
      makeExpense({ amount: 200 }),
      makeExpense({ amount: 500, isSettlement: true }),
      makeExpense({ amount: 100 }),
    ];
    expect(computeTotalSpent(expenses)).toBe(300);
  });

  it('returns 0 when all expenses are settlements', () => {
    const expenses = [
      makeExpense({ amount: 500, isSettlement: true }),
    ];
    expect(computeTotalSpent(expenses)).toBe(0);
  });

  it('returns 0 for empty array', () => {
    expect(computeTotalSpent([])).toBe(0);
  });
});

describe('computeCCOutstanding', () => {
  it('computes CC spend minus settlements', () => {
    const expenses = [
      makeExpense({ amount: 1000, paymentMethod: PaymentMethod.CreditCard }),
      makeExpense({ amount: 500, paymentMethod: PaymentMethod.UpiCreditCard }),
      makeExpense({ amount: 300, isSettlement: true }),
    ];
    expect(computeCCOutstanding(expenses)).toBe(1200);
  });

  it('does not go below zero', () => {
    const expenses = [
      makeExpense({ amount: 100, paymentMethod: PaymentMethod.CreditCard }),
      makeExpense({ amount: 500, isSettlement: true }),
    ];
    expect(computeCCOutstanding(expenses)).toBe(0);
  });

  it('ignores non-CC expenses in CC calculation', () => {
    const expenses = [
      makeExpense({ amount: 1000, paymentMethod: PaymentMethod.UpiBankAccount }),
      makeExpense({ amount: 200, paymentMethod: PaymentMethod.CreditCard }),
    ];
    expect(computeCCOutstanding(expenses)).toBe(200);
  });

  it('returns 0 for empty array', () => {
    expect(computeCCOutstanding([])).toBe(0);
  });
});

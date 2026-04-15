import { describe, it, expect } from 'vitest';

import { validateExpense, validateIncome } from '@/modules/expenses/validation';
import { isOk, isErr, ExpenseCategory, IncomeSource } from '@/shared/types';

/** Extracts only numeric values from a numeric TypeScript enum */
const numericValues = <T extends Record<string, string | number>>(e: T): number[] =>
  Object.values(e).filter((v): v is number => typeof v === 'number');

describe('validateExpense', () => {
  it('accepts a valid expense with enum category', () => {
    const result = validateExpense({
      date: '2026-04-02',
      category: ExpenseCategory.Food,
      amount: 100,
    });
    expect(isOk(result)).toBe(true);
  });

  it('accepts all enum categories', () => {
    for (const cat of numericValues(ExpenseCategory)) {
      const result = validateExpense({
        date: '2026-04-02',
        category: cat as ExpenseCategory,
        amount: 50,
      });
      expect(isOk(result)).toBe(true);
    }
  });

  it('rejects a missing date', () => {
    const result = validateExpense({ date: '', category: ExpenseCategory.Food, amount: 100 });
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error).toBe('Date is required');
  });

  it('rejects an invalid date format', () => {
    const result = validateExpense({
      date: '02-04-2026',
      category: ExpenseCategory.Food,
      amount: 100,
    });
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error).toBe('Date must be in YYYY-MM-DD format');
  });

  it('rejects an unknown category', () => {
    const result = validateExpense({
      date: '2026-04-02',
      category: 'unknown' as ExpenseCategory,
      amount: 100,
    });
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error).toBe('Unknown category');
  });

  it('rejects zero amount', () => {
    const result = validateExpense({
      date: '2026-04-02',
      category: ExpenseCategory.Food,
      amount: 0,
    });
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error).toBe('Amount must be greater than zero');
  });

  it('rejects negative amount', () => {
    const result = validateExpense({
      date: '2026-04-02',
      category: ExpenseCategory.Food,
      amount: -50,
    });
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error).toBe('Amount must be greater than zero');
  });
});

describe('validateIncome', () => {
  it('accepts a valid income entry', () => {
    const result = validateIncome({
      date: '2026-04-02',
      source: IncomeSource.Salary,
      amount: 50000,
    });
    expect(isOk(result)).toBe(true);
  });

  it('accepts all enum sources', () => {
    for (const src of numericValues(IncomeSource)) {
      const result = validateIncome({
        date: '2026-04-02',
        source: src as IncomeSource,
        amount: 100,
      });
      expect(isOk(result)).toBe(true);
    }
  });

  it('rejects a missing date', () => {
    const result = validateIncome({ date: '', source: IncomeSource.Salary, amount: 100 });
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error).toBe('Date is required');
  });

  it('rejects an invalid date format', () => {
    const result = validateIncome({ date: '02-04-2026', source: IncomeSource.Salary, amount: 100 });
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error).toBe('Date must be in YYYY-MM-DD format');
  });

  it('rejects an unknown income source', () => {
    const result = validateIncome({
      date: '2026-04-02',
      source: 'unknown' as IncomeSource,
      amount: 100,
    });
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error).toBe('Unknown income source');
  });

  it('rejects zero amount', () => {
    const result = validateIncome({ date: '2026-04-02', source: IncomeSource.Salary, amount: 0 });
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error).toBe('Amount must be greater than zero');
  });

  it('rejects negative amount', () => {
    const result = validateIncome({ date: '2026-04-02', source: IncomeSource.Salary, amount: -50 });
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error).toBe('Amount must be greater than zero');
  });
});

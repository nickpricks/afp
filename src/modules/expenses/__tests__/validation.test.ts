import { describe, it, expect } from 'vitest';

import { validateExpense } from '@/modules/expenses/validation';
import { isOk, isErr } from '@/shared/types';

describe('validateExpense', () => {
  it('accepts a valid expense', () => {
    const result = validateExpense({ date: '2026-04-02', category: 'food', amount: 100 });
    expect(isOk(result)).toBe(true);
  });

  it('rejects a missing date', () => {
    const result = validateExpense({ date: '', category: 'food', amount: 100 });
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error).toBe('Date is required');
  });

  it('rejects an invalid date format', () => {
    const result = validateExpense({ date: '02-04-2026', category: 'food', amount: 100 });
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error).toBe('Date must be in YYYY-MM-DD format');
  });

  it('rejects an unknown category', () => {
    const result = validateExpense({ date: '2026-04-02', category: 'unknown', amount: 100 });
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error).toBe('Unknown category');
  });

  it('rejects zero amount', () => {
    const result = validateExpense({ date: '2026-04-02', category: 'food', amount: 0 });
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error).toBe('Amount must be greater than zero');
  });

  it('rejects negative amount', () => {
    const result = validateExpense({ date: '2026-04-02', category: 'food', amount: -50 });
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error).toBe('Amount must be greater than zero');
  });
});

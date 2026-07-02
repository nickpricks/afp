import { describe, expect, it } from 'vitest';

import { computeFamilyTotals } from '@/modules/expenses/budget-math';
import type { MemberExpenses } from '@/modules/expenses/budget-math';
import type { Expense } from '@/modules/expenses/types';
import { ExpenseCategory, PaymentMethod, TimeRange } from '@/shared/types';

/** Builds a minimal expense fixture on the given date/amount */
function exp(date: string, amount: number, isSettlement = false): Expense {
  return {
    id: crypto.randomUUID(),
    date,
    category: ExpenseCategory.Food,
    subCat: '',
    amount,
    paymentMethod: PaymentMethod.Cash,
    isSettlement,
    note: '',
    isDeleted: false,
    createdAt: `${date}T10:00:00Z`,
    updatedAt: `${date}T10:00:00Z`,
  };
}

const TODAY = '2026-07-02';

/** Tests computeFamilyTotals aggregation, range filtering, and settlement exclusion */
describe('computeFamilyTotals', () => {
  it('returns zero totals for an empty family', () => {
    expect(computeFamilyTotals([], TimeRange.All, TODAY)).toEqual({
      perMember: [],
      familyTotal: 0,
    });
  });

  it('sums per member and family-wide', () => {
    const members: MemberExpenses[] = [
      { uid: 'a', name: 'Alice', expenses: [exp('2026-07-01', 100), exp('2026-07-02', 50)] },
      { uid: 'b', name: 'Bob', expenses: [exp('2026-07-02', 25)] },
    ];
    const totals = computeFamilyTotals(members, TimeRange.All, TODAY);
    expect(totals.perMember).toEqual([
      { uid: 'a', name: 'Alice', total: 150 },
      { uid: 'b', name: 'Bob', total: 25 },
    ]);
    expect(totals.familyTotal).toBe(175);
  });

  it('honors the time range (Today drops older expenses)', () => {
    const members: MemberExpenses[] = [
      { uid: 'a', name: 'Alice', expenses: [exp('2026-06-01', 100), exp('2026-07-02', 50)] },
    ];
    const totals = computeFamilyTotals(members, TimeRange.Today, TODAY);
    expect(totals.perMember[0]!.total).toBe(50);
    expect(totals.familyTotal).toBe(50);
  });

  it('excludes settlements like computeTotalSpent', () => {
    const members: MemberExpenses[] = [
      { uid: 'a', name: 'Alice', expenses: [exp('2026-07-02', 50), exp('2026-07-02', 500, true)] },
    ];
    expect(computeFamilyTotals(members, TimeRange.All, TODAY).familyTotal).toBe(50);
  });
});

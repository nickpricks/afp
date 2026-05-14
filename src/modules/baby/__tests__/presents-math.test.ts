import { describe, it, expect } from 'vitest';
import { computeKidWealth, filterByStatus } from '@/modules/baby/presents-math';
import { FinanceStatus, type FinanceEntry } from '@/modules/baby/types';

function makeFinance(over: Partial<FinanceEntry>): FinanceEntry {
  return {
    id: over.id ?? 'f1',
    date: '2026-05-14',
    amount: over.amount ?? 0,
    description: '',
    giver: '',
    occasion: '',
    status: over.status ?? FinanceStatus.Received,
    notes: '',
    timestamp: '2026-05-14T00:00:00.000Z',
    createdAt: '2026-05-14T00:00:00.000Z',
    updatedAt: '2026-05-14T00:00:00.000Z',
    ...over,
  };
}

describe('computeKidWealth', () => {
  it('returns 0 for empty list', () => {
    expect(computeKidWealth([])).toBe(0);
  });

  it('sums Received and Saved entries', () => {
    const entries = [
      makeFinance({ amount: 100, status: FinanceStatus.Received }),
      makeFinance({ amount: 200, status: FinanceStatus.Saved }),
    ];
    expect(computeKidWealth(entries)).toBe(300);
  });

  it('excludes Spent entries', () => {
    const entries = [
      makeFinance({ amount: 100, status: FinanceStatus.Received }),
      makeFinance({ amount: 50, status: FinanceStatus.Spent }),
    ];
    expect(computeKidWealth(entries)).toBe(100);
  });

  it('handles all-spent list', () => {
    const entries = [
      makeFinance({ amount: 100, status: FinanceStatus.Spent }),
      makeFinance({ amount: 50, status: FinanceStatus.Spent }),
    ];
    expect(computeKidWealth(entries)).toBe(0);
  });
});

describe('filterByStatus', () => {
  it('returns only entries matching the given status', () => {
    const entries = [
      makeFinance({ id: 'a', status: FinanceStatus.Received }),
      makeFinance({ id: 'b', status: FinanceStatus.Saved }),
      makeFinance({ id: 'c', status: FinanceStatus.Received }),
    ];
    const result = filterByStatus(entries, FinanceStatus.Received);
    expect(result.map((e) => e.id)).toEqual(['a', 'c']);
  });

  it('returns empty array when no matches', () => {
    const entries = [makeFinance({ status: FinanceStatus.Spent })];
    expect(filterByStatus(entries, FinanceStatus.Received)).toEqual([]);
  });
});

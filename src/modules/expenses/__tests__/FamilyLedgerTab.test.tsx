import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { FamilyLedgerTab } from '@/modules/expenses/components/FamilyLedgerTab';
import { ExpenseCategory, PaymentMethod, TimeRange } from '@/shared/types';
import type { Expense } from '@/modules/expenses/types';

/** Minimal expense fixture builder */
function exp(id: string, date: string, amount: number): Expense {
  return {
    id,
    date,
    category: ExpenseCategory.Food,
    subCat: 'Groceries',
    amount,
    paymentMethod: PaymentMethod.Cash,
    isSettlement: false,
    note: '',
    isDeleted: false,
    createdAt: `${date}T10:00:00Z`,
    updatedAt: `${date}T10:00:00Z`,
  };
}

const aliceExpenses = [exp('e1', '2026-07-02', 100)];
const bobExpenses = [exp('e3', '2026-07-02', 25)];

vi.mock('@/modules/expenses/hooks/useFamilyExpenses', () => ({
  useFamilyExpenses: () => ({
    rows: [
      ...aliceExpenses.map((expense) => ({ expense, ownerUid: 'uid-a', ownerName: 'Alice' })),
      ...bobExpenses.map((expense) => ({ expense, ownerUid: 'uid-b', ownerName: 'Bob' })),
    ],
    members: [
      { uid: 'uid-a', name: 'Alice', expenses: aliceExpenses },
      { uid: 'uid-b', name: 'Bob', expenses: bobExpenses },
    ],
    ready: true,
  }),
}));

/** Tests the read-only family ledger rendering — attribution chips, totals, no mutator UI */
describe('FamilyLedgerTab', () => {
  const noop = vi.fn();

  it('renders member attribution chips and family total', () => {
    render(<FamilyLedgerTab familyId="fam-1" timeRange={TimeRange.All} onTimeRangeChange={noop} />);
    expect(screen.getAllByText('Alice').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Bob').length).toBeGreaterThan(0);
    // Family total = 125 (per-member summary strip)
    expect(screen.getByText(/125/)).toBeInTheDocument();
  });

  it('is read-only — no delete × and no Trash affordance', () => {
    render(<FamilyLedgerTab familyId="fam-1" timeRange={TimeRange.All} onTimeRangeChange={noop} />);
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
    expect(screen.queryByText('×')).not.toBeInTheDocument();
  });

  it('renders the universal list controls strip', () => {
    render(<FamilyLedgerTab familyId="fam-1" timeRange={TimeRange.All} onTimeRangeChange={noop} />);
    expect(screen.getByRole('button', { name: 'Today' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
  });
});

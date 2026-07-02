import { beforeEach, describe, expect, it } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

import { useFamilyExpenses } from '@/modules/expenses/hooks/useFamilyExpenses';
import { FamilyRole } from '@/shared/types';

/** Seeds the dev-mode localStorage adapter with a family + member profiles + expenses */
function seed(): void {
  localStorage.setItem(
    'afp::families',
    JSON.stringify([
      {
        id: 'fam-1',
        name: 'The Nicks',
        createdBy: 'admin',
        createdAt: '2026-07-01T00:00:00Z',
        members: { 'uid-a': FamilyRole.Owner, 'uid-b': FamilyRole.Adult },
      },
    ]),
  );
  localStorage.setItem('afp:users/uid-a:profile', JSON.stringify([{ id: 'main', name: 'Alice' }]));
  localStorage.setItem('afp:users/uid-b:profile', JSON.stringify([{ id: 'main', name: 'Bob' }]));
  localStorage.setItem(
    'afp:users/uid-a:expenses',
    JSON.stringify([
      { id: 'e1', date: '2026-07-02', amount: 100, isDeleted: false },
      { id: 'e2', date: '2026-07-01', amount: 40, isDeleted: true },
    ]),
  );
  localStorage.setItem(
    'afp:users/uid-b:expenses',
    JSON.stringify([{ id: 'e3', date: '2026-07-02', amount: 25, isDeleted: false }]),
  );
}

/** Tests the read-only per-member fan-out (rows, names, soft-delete filter, readiness) */
describe('useFamilyExpenses', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('resolves ready with no rows when familyId is null', async () => {
    const { result } = renderHook(() => useFamilyExpenses(null));
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.rows).toEqual([]);
  });

  it('aggregates every member expenses with owner attribution', async () => {
    seed();
    const { result } = renderHook(() => useFamilyExpenses('fam-1'));
    await waitFor(() => expect(result.current.ready).toBe(true));
    await waitFor(() => expect(result.current.rows.length).toBe(2));
    const owners = result.current.rows.map((r) => r.ownerName).sort();
    expect(owners).toEqual(['Alice', 'Bob']);
  });

  it('filters soft-deleted expenses', async () => {
    seed();
    const { result } = renderHook(() => useFamilyExpenses('fam-1'));
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.rows.find((r) => r.expense.id === 'e2')).toBeUndefined();
  });

  it('exposes no mutators (read-only by construction)', () => {
    seed();
    const { result } = renderHook(() => useFamilyExpenses('fam-1'));
    const keys = Object.keys(result.current);
    expect(keys.sort()).toEqual(['members', 'ready', 'rows']);
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import { useExpenses } from '@/modules/expenses/hooks/useExpenses';
import { BudgetMsg } from '@/constants/messages';
import { ToastType } from '@/shared/types';
import { ExpenseCategory } from '@/shared/types';
import { PaymentMethod } from '@/shared/types';

const mockAddToast = vi.fn();
const mockSetSyncStatus = vi.fn();

vi.mock('@/shared/errors/useToast', () => ({
  useToast: () => ({ addToast: mockAddToast }),
}));

// Null firebaseUser => uid is undefined => useEffect returns early => adapter stays null
vi.mock('@/shared/auth/useAuth', () => ({
  useAuth: () => ({ firebaseUser: null, setSyncStatus: mockSetSyncStatus }),
}));

vi.mock('@/shared/storage/create-adapter', () => ({
  createAdapter: vi.fn(),
}));

beforeEach(() => {
  mockAddToast.mockClear();
  mockSetSyncStatus.mockClear();
});

describe('useExpenses adapter-null guards', () => {
  it('addExpense toasts AdapterNotReady when adapter is null', async () => {
    const { result } = renderHook(() => useExpenses());

    let returned: boolean | undefined;
    await act(async () => {
      returned = await result.current.addExpense({
        date: '2026-05-15',
        category: ExpenseCategory.Food,
        subCat: 'Groceries',
        amount: 100,
        paymentMethod: PaymentMethod.UpiBankAccount,
        note: 'test',
      });
    });

    expect(returned).toBe(false);
    expect(mockAddToast).toHaveBeenCalledWith(
      BudgetMsg.AdapterNotReady,
      ToastType.Error,
    );
  });

  it('updateExpense toasts AdapterNotReady when adapter is null', async () => {
    const { result } = renderHook(() => useExpenses());

    let returned: boolean | undefined;
    await act(async () => {
      returned = await result.current.updateExpense({
        id: 'exp-1',
        date: '2026-05-15',
        category: ExpenseCategory.Food,
        subCat: 'Groceries',
        amount: 100,
        paymentMethod: PaymentMethod.UpiBankAccount,
        isSettlement: false,
        note: 'test',
        isDeleted: false,
        createdAt: '2026-05-15T00:00:00Z',
        updatedAt: '2026-05-15T00:00:00Z',
      });
    });

    expect(returned).toBe(false);
    expect(mockAddToast).toHaveBeenCalledWith(
      BudgetMsg.AdapterNotReady,
      ToastType.Error,
    );
  });

  it('deleteExpense toasts AdapterNotReady when adapter is null', async () => {
    const { result } = renderHook(() => useExpenses());

    await act(async () => {
      await result.current.deleteExpense('exp-1');
    });

    expect(mockAddToast).toHaveBeenCalledWith(
      BudgetMsg.AdapterNotReady,
      ToastType.Error,
    );
  });
});

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useExpenseForm } from '../useExpenseForm';
import { ExpenseMetaType } from '../../types';
import { PaymentMethod } from '@/shared/types';

describe('useExpenseForm', () => {
  it('initializes with default values when no props passed', () => {
    const { result } = renderHook(() => useExpenseForm());
    expect(result.current.date).toMatch(/^\d{4}-\d{2}-\d{2}$/); // todayStr() shape
    expect(result.current.amount).toBe('');
    expect(result.current.note).toBe('');
    expect(result.current.meta).toBeUndefined();
    expect(result.current.paymentMethod).toBe(PaymentMethod.UpiBankAccount);
  });

  it('initializes with passed initial values', () => {
    const { result } = renderHook(() =>
      useExpenseForm({
        initialDate: '2026-04-01',
        initialAmount: '500',
        initialNote: 'fuel',
        initialPaymentMethod: PaymentMethod.Cash,
      }),
    );
    expect(result.current.date).toBe('2026-04-01');
    expect(result.current.amount).toBe('500');
    expect(result.current.note).toBe('fuel');
    expect(result.current.paymentMethod).toBe(PaymentMethod.Cash);
  });

  it('populate(expense) sets all fields from an Expense object', () => {
    const { result } = renderHook(() => useExpenseForm());
    act(() =>
      result.current.populate({
        id: 'x',
        date: '2026-04-02',
        amount: 1000,
        note: 'fuel',
        meta: {
          type: ExpenseMetaType.Fuel,
          liters: 40,
          pricePerLiter: 25,
          odometer: null,
          tripOdo: null,
          displayedMileage: null,
          fullTank: false,
        },
        paymentMethod: PaymentMethod.Cash,
        category: 4,
        subCat: 'Fuel',
        isSettlement: false,
        isDeleted: false,
        createdAt: '',
        updatedAt: '',
      } as never),
    );
    expect(result.current.date).toBe('2026-04-02');
    expect(result.current.amount).toBe('1000');
    expect(result.current.note).toBe('fuel');
    expect(result.current.paymentMethod).toBe(PaymentMethod.Cash);
    expect(result.current.meta?.type).toBe(ExpenseMetaType.Fuel);
  });

  it('reset() clears amount/note/meta and restores initial date + paymentMethod', () => {
    const { result } = renderHook(() =>
      useExpenseForm({
        initialDate: '2026-04-01',
        initialPaymentMethod: PaymentMethod.Cash,
      }),
    );
    act(() => {
      result.current.setAmount('500');
      result.current.setNote('hi');
    });
    act(() => result.current.reset());
    expect(result.current.amount).toBe('');
    expect(result.current.note).toBe('');
    expect(result.current.date).toBe('2026-04-01');
    expect(result.current.paymentMethod).toBe(PaymentMethod.Cash);
  });
});

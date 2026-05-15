import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuth } from '@/shared/auth/useAuth';
import { useToast } from '@/shared/errors/useToast';
import { createAdapter } from '@/shared/storage/create-adapter';
import type { StorageAdapter } from '@/shared/storage/adapter';
import type { Expense, ExpenseMeta } from '@/modules/expenses/types';
import { ExpenseMetaType } from '@/modules/expenses/types';
import { assertNever } from '@/shared/utils/types';
import { validateExpense } from '@/modules/expenses/validation';
import { SyncStatus, isOk, ToastType, PaymentMethod } from '@/shared/types';
import type { ExpenseCategory } from '@/shared/types';
import { BudgetMsg } from '@/constants/messages';
import { DbSubcollection, userPath } from '@/constants/db';

type ExpenseInput = {
  date: string;
  category: ExpenseCategory;
  subCat: string;
  amount: number;
  paymentMethod?: PaymentMethod;
  isSettlement?: boolean;
  note: string;
  meta?: ExpenseMeta;
};

/** Provides expense CRUD (add/update/soft-delete) with real-time sync. */
export function useExpenses(targetUid?: string) {
  const { firebaseUser, setSyncStatus } = useAuth();
  const { addToast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const adapterRef = useRef<StorageAdapter | null>(null);

  const uid = targetUid ?? firebaseUser?.uid;
  const readOnly = targetUid != null && targetUid !== firebaseUser?.uid;

  useEffect(() => {
    if (!uid) return;

    const syncFn = readOnly ? () => {} : setSyncStatus;
    const adapter = createAdapter(userPath(uid));
    adapterRef.current = adapter;
    syncFn(SyncStatus.Syncing);

    const unsubscribe = adapter.onSnapshot<Expense>(
      DbSubcollection.Expenses,
      (items) => {
        setExpenses(items.filter((e) => !e.isDeleted));
        syncFn(SyncStatus.Synced);
      },
      (error) => {
        // TODO(sentry): pipe onError to centralized logError once Sentry lands.
        console.error('[AFP] Expenses listener error:', error);
        syncFn(SyncStatus.Error);
      },
    );

    return () => {
      unsubscribe();
      adapterRef.current = null;
    };
  }, [uid, readOnly, setSyncStatus]);

  /** Validates and persists a new expense, showing a toast on success or failure */
  const addExpense = useCallback(
    async (input: ExpenseInput) => {
      if (readOnly) return false;
      const validation = validateExpense(input);
      if (!isOk(validation)) {
        addToast(validation.error, ToastType.Error);
        return false;
      }

      const adapter = adapterRef.current;
      if (!adapter) {
        addToast(BudgetMsg.AdapterNotReady, ToastType.Error);
        return false;
      }

      const now = new Date().toISOString();
      const expense: Expense = {
        id: crypto.randomUUID(),
        date: input.date,
        category: input.category,
        subCat: input.subCat,
        amount: input.amount,
        paymentMethod: input.paymentMethod ?? PaymentMethod.UpiBankAccount,
        isSettlement: input.isSettlement ?? false,
        note: input.note,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
        ...(input.meta ? { meta: input.meta } : {}),
      };

      const result = await adapter.save(DbSubcollection.Expenses, { ...expense });
      if (!isOk(result)) {
        addToast(result.error, ToastType.Error);
        return false;
      }

      addToast(toastForAdd(input.meta), ToastType.Success);
      return true;
    },
    [addToast, readOnly],
  );

  /** Validates and persists an updated expense (full replace by id) */
  const updateExpense = useCallback(
    async (expense: Expense) => {
      if (readOnly) return false;
      const validation = validateExpense(expense);
      if (!isOk(validation)) {
        addToast(validation.error, ToastType.Error);
        return false;
      }

      const adapter = adapterRef.current;
      if (!adapter) {
        addToast(BudgetMsg.AdapterNotReady, ToastType.Error);
        return false;
      }

      const updated: Expense = { ...expense, updatedAt: new Date().toISOString() };
      const result = await adapter.save(DbSubcollection.Expenses, { ...updated });
      if (!isOk(result)) {
        addToast(result.error, ToastType.Error);
        return false;
      }

      addToast(toastForUpdate(expense.meta), ToastType.Success);
      return true;
    },
    [addToast, readOnly],
  );

  /** Soft-deletes an expense by marking it as deleted */
  const deleteExpense = useCallback(
    async (id: string) => {
      if (readOnly) return;
      const adapter = adapterRef.current;
      if (!adapter) {
        addToast(BudgetMsg.AdapterNotReady, ToastType.Error);
        return;
      }

      const result = await adapter.save(DbSubcollection.Expenses, {
        id,
        isDeleted: true,
        updatedAt: new Date().toISOString(),
      });

      if (!isOk(result)) {
        addToast(result.error, ToastType.Error);
        return;
      }

      addToast(BudgetMsg.ExpenseDeleted, ToastType.Success);
    },
    [addToast, readOnly],
  );

  return { expenses, addExpense, updateExpense, deleteExpense };
}

/** Returns the appropriate toast message for an add operation based on meta type */
function toastForAdd(meta: ExpenseMeta | undefined): BudgetMsg {
  if (!meta) return BudgetMsg.ExpenseAdded;
  switch (meta.type) {
    case ExpenseMetaType.Fuel:
      return BudgetMsg.FuelLogged;
    case ExpenseMetaType.Travel:
      return BudgetMsg.TripLogged;
    case ExpenseMetaType.Maintenance:
      return BudgetMsg.ServiceLogged;
    default:
      return assertNever(meta);
  }
}

/** Returns the appropriate toast message for an update operation based on meta type */
function toastForUpdate(meta: ExpenseMeta | undefined): BudgetMsg {
  if (!meta) return BudgetMsg.ExpenseUpdated;
  switch (meta.type) {
    case ExpenseMetaType.Fuel:
      return BudgetMsg.FuelUpdated;
    case ExpenseMetaType.Travel:
      return BudgetMsg.TripUpdated;
    case ExpenseMetaType.Maintenance:
      return BudgetMsg.ServiceUpdated;
    default:
      return assertNever(meta);
  }
}

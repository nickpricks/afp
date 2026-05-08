import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuth } from '@/shared/auth/useAuth';
import { useToast } from '@/shared/errors/useToast';
import { createAdapter } from '@/shared/storage/create-adapter';
import type { StorageAdapter } from '@/shared/storage/adapter';
import type { Expense, ExpenseMeta } from '@/modules/expenses/types';
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
  /** `null` indicates the user explicitly de-selected the payment method via the form's
   * toggle pattern. Validated explicitly in {@link useExpenses} — never silently defaulted. */
  paymentMethod: PaymentMethod | null;
  isSettlement?: boolean;
  note: string;
  meta?: ExpenseMeta;
};

/** Add/update toast lookup keyed on the meta discriminator. Adding a new meta variant means
 * adding one row here — no parallel switch updates. The `default` shape covers the no-meta case. */
const META_TOAST: Record<ExpenseMeta['type'] | 'default', { add: BudgetMsg; update: BudgetMsg }> = {
  fuel: { add: BudgetMsg.FuelLogged, update: BudgetMsg.FuelUpdated },
  travel: { add: BudgetMsg.TripLogged, update: BudgetMsg.TripUpdated },
  maintenance: { add: BudgetMsg.ServiceLogged, update: BudgetMsg.ServiceUpdated },
  default: { add: BudgetMsg.ExpenseAdded, update: BudgetMsg.ExpenseUpdated },
};

const metaToast = (meta: ExpenseMeta | undefined, action: 'add' | 'update'): BudgetMsg =>
  META_TOAST[meta?.type ?? 'default'][action];

/** Provides expense CRUD operations with real-time sync and soft-delete */
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
      if (input.paymentMethod === null) {
        addToast(BudgetMsg.PaymentMethodRequired, ToastType.Error);
        return false;
      }
      const validation = validateExpense(input);
      if (!isOk(validation)) {
        addToast(validation.error, ToastType.Error);
        return false;
      }

      const adapter = adapterRef.current;
      if (!adapter) return false;

      const now = new Date().toISOString();
      const expense: Expense = {
        id: crypto.randomUUID(),
        date: input.date,
        category: input.category,
        subCat: input.subCat,
        amount: input.amount,
        paymentMethod: input.paymentMethod,
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

      addToast(metaToast(input.meta, 'add'), ToastType.Success);
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
      if (!adapter) return false;

      const updated: Expense = { ...expense, updatedAt: new Date().toISOString() };
      const result = await adapter.save(DbSubcollection.Expenses, { ...updated });
      if (!isOk(result)) {
        addToast(result.error, ToastType.Error);
        return false;
      }

      addToast(metaToast(expense.meta, 'update'), ToastType.Success);
      return true;
    },
    [addToast, readOnly],
  );

  /** Soft-deletes an expense by marking it as deleted */
  const deleteExpense = useCallback(
    async (id: string) => {
      if (readOnly) return;
      const adapter = adapterRef.current;
      if (!adapter) return;

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

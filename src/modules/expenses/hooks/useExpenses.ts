import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuth } from '@/shared/auth/useAuth';
import { useToast } from '@/shared/errors/useToast';
import { createAdapter } from '@/shared/storage/create-adapter';
import type { StorageAdapter } from '@/shared/storage/adapter';
import type { Expense } from '@/modules/expenses/types';
import { validateExpense } from '@/modules/expenses/validation';
import { SyncStatus, isOk } from '@/shared/types';
import { ExpenseMsg } from '@/constants/messages';
import { DbSubcollection, userPath } from '@/constants/db';

/** Provides expense CRUD operations with real-time sync and soft-delete */
export function useExpenses() {
  const { firebaseUser, setSyncStatus } = useAuth();
  const { addToast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const adapterRef = useRef<StorageAdapter | null>(null);

  useEffect(() => {
    if (!firebaseUser) return;

    const adapter = createAdapter(userPath(firebaseUser.uid));
    adapterRef.current = adapter;
    setSyncStatus(SyncStatus.Syncing);

    const unsubscribe = adapter.onSnapshot<Expense>(
      DbSubcollection.Expenses,
      (items) => {
        setExpenses(items.filter((e) => !e.isDeleted));
        setSyncStatus(SyncStatus.Synced);
      },
      (error) => {
        console.error('[AFP] Expenses listener error:', error);
        setSyncStatus(SyncStatus.Error);
      },
    );

    return () => {
      unsubscribe();
      adapterRef.current = null;
    };
  }, [firebaseUser, setSyncStatus]);

  /** Validates and persists a new expense, showing a toast on success or failure */
  const addExpense = useCallback(
    async (input: {
      date: string;
      category: string;
      subCat: string;
      amount: number;
      note: string;
    }) => {
      const validation = validateExpense(input);
      if (!isOk(validation)) {
        addToast(validation.error, 'error');
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
        note: input.note,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
      };

      const result = await adapter.save(DbSubcollection.Expenses, { ...expense });
      if (!isOk(result)) {
        addToast(result.error, 'error');
        return false;
      }

      addToast(ExpenseMsg.Added, 'success');
      return true;
    },
    [addToast],
  );

  /** Soft-deletes an expense by marking it as deleted */
  const deleteExpense = useCallback(
    async (id: string) => {
      const adapter = adapterRef.current;
      if (!adapter) return;

      const result = await adapter.save(DbSubcollection.Expenses, {
        id,
        isDeleted: true,
        updatedAt: new Date().toISOString(),
      });

      if (!isOk(result)) {
        addToast(result.error, 'error');
        return;
      }

      addToast(ExpenseMsg.Deleted, 'success');
    },
    [addToast],
  );

  return { expenses, addExpense, deleteExpense };
}

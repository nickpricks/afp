import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuth } from '@/shared/auth/useAuth';
import { useToast } from '@/shared/errors/useToast';
import { createAdapter } from '@/shared/storage/create-adapter';
import type { StorageAdapter } from '@/shared/storage/adapter';
import type { Income } from '@/modules/expenses/types';
import { validateIncome } from '@/modules/expenses/validation';
import { SyncStatus, isOk } from '@/shared/types';
import type { IncomeSource, PaymentMethod } from '@/shared/types';
import { BudgetMsg } from '@/constants/messages';
import { DbSubcollection, userPath } from '@/constants/db';

/** Provides income CRUD operations with real-time sync */
export function useIncome(targetUid?: string) {
  const { firebaseUser, setSyncStatus } = useAuth();
  const { addToast } = useToast();
  const [income, setIncome] = useState<Income[]>([]);
  const adapterRef = useRef<StorageAdapter | null>(null);

  const uid = targetUid ?? firebaseUser?.uid;
  const readOnly = targetUid != null && targetUid !== firebaseUser?.uid;

  useEffect(() => {
    if (!uid) return;

    const syncFn = readOnly ? () => {} : setSyncStatus;
    const adapter = createAdapter(userPath(uid));
    adapterRef.current = adapter;
    syncFn(SyncStatus.Syncing);

    const unsubscribe = adapter.onSnapshot<Income>(
      DbSubcollection.Income,
      (items) => {
        setIncome(items);
        syncFn(SyncStatus.Synced);
      },
      (error) => {
        console.error('[AFP] Income listener error:', error);
        syncFn(SyncStatus.Error);
      },
    );

    return () => {
      unsubscribe();
      adapterRef.current = null;
    };
  }, [uid, readOnly, setSyncStatus]);

  /** Validates and persists a new income entry, showing a toast on success or failure */
  const addIncome = useCallback(
    async (input: {
      date: string;
      source: IncomeSource;
      amount: number;
      paymentMethod: PaymentMethod;
      note: string;
    }) => {
      if (readOnly) return false;
      const validation = validateIncome(input);
      if (!isOk(validation)) {
        addToast(validation.error, 'error');
        return false;
      }

      const adapter = adapterRef.current;
      if (!adapter) return false;

      const now = new Date().toISOString();
      const entry: Income = {
        id: crypto.randomUUID(),
        date: input.date,
        source: input.source,
        amount: input.amount,
        paymentMethod: input.paymentMethod,
        note: input.note,
        createdAt: now,
        updatedAt: now,
      };

      const result = await adapter.save(DbSubcollection.Income, { ...entry });
      if (!isOk(result)) {
        addToast(result.error, 'error');
        return false;
      }

      addToast(BudgetMsg.IncomeAdded, 'success');
      return true;
    },
    [addToast, readOnly],
  );

  /** Deletes an income entry by ID */
  const deleteIncome = useCallback(
    async (id: string) => {
      if (readOnly) return;
      const adapter = adapterRef.current;
      if (!adapter) return;

      const result = await adapter.remove(DbSubcollection.Income, id);

      if (!isOk(result)) {
        addToast(result.error, 'error');
        return;
      }

      addToast(BudgetMsg.IncomeDeleted, 'success');
    },
    [addToast, readOnly],
  );

  return { income, addIncome, deleteIncome };
}

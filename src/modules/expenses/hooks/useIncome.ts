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
export function useIncome() {
  const { firebaseUser, setSyncStatus } = useAuth();
  const { addToast } = useToast();
  const [income, setIncome] = useState<Income[]>([]);
  const adapterRef = useRef<StorageAdapter | null>(null);

  useEffect(() => {
    if (!firebaseUser) return;

    const adapter = createAdapter(userPath(firebaseUser.uid));
    adapterRef.current = adapter;
    setSyncStatus(SyncStatus.Syncing);

    const unsubscribe = adapter.onSnapshot<Income>(
      DbSubcollection.Income,
      (items) => {
        setIncome(items);
        setSyncStatus(SyncStatus.Synced);
      },
      (error) => {
        console.error('[AFP] Income listener error:', error);
        setSyncStatus(SyncStatus.Error);
      },
    );

    return () => {
      unsubscribe();
      adapterRef.current = null;
    };
  }, [firebaseUser, setSyncStatus]);

  /** Validates and persists a new income entry, showing a toast on success or failure */
  const addIncome = useCallback(
    async (input: {
      date: string;
      source: IncomeSource;
      amount: number;
      paymentMethod: PaymentMethod;
      note: string;
    }) => {
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
    [addToast],
  );

  /** Deletes an income entry by ID */
  const deleteIncome = useCallback(
    async (id: string) => {
      const adapter = adapterRef.current;
      if (!adapter) return;

      const result = await adapter.remove(DbSubcollection.Income, id);

      if (!isOk(result)) {
        addToast(result.error, 'error');
        return;
      }

      addToast(BudgetMsg.IncomeDeleted, 'success');
    },
    [addToast],
  );

  return { income, addIncome, deleteIncome };
}

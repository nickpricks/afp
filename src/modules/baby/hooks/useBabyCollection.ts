import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuth } from '@/shared/auth/useAuth';
import { useToast } from '@/shared/errors/useToast';
import { createAdapter } from '@/shared/storage/create-adapter';
import type { StorageAdapter } from '@/shared/storage/adapter';
import { isOk, ToastType } from '@/shared/types';
import { childPath } from '@/constants/db';

/** Generic hook for a baby subcollection nested under a child — handles listener, state, and save */
export function useBabyCollection<T extends Record<string, unknown> & { id: string }>(
  childId: string | null,
  subcollection: string,
  label: string,
  targetUid?: string,
) {
  const { firebaseUser } = useAuth();
  const { addToast } = useToast();
  const [items, setItems] = useState<T[]>([]);
  const [ready, setReady] = useState(false);
  const adapterRef = useRef<StorageAdapter | null>(null);

  const uid = targetUid ?? firebaseUser?.uid;
  const readOnly = targetUid != null && targetUid !== firebaseUser?.uid;

  useEffect(() => {
    if (!uid || !childId) return;

    const adapter = createAdapter(childPath(uid, childId));
    adapterRef.current = adapter;

    const unsubscribe = adapter.onSnapshot<T>(
      subcollection,
      (data) => {
        setItems(data);
        setReady(true);
      },
      (error) => {
        console.error(`[AFP] Baby ${label} listener error:`, error);
      },
    );

    return () => {
      unsubscribe();
      adapterRef.current = null;
    };
  }, [uid, childId, subcollection, label]);

  const log = useCallback(
    async (data: Omit<T, 'id'>) => {
      if (readOnly) return;
      const adapter = adapterRef.current;
      if (!adapter) return;
      const entry = { ...data, id: crypto.randomUUID() } as T;
      const result = await adapter.save(subcollection, entry);
      if (isOk(result)) {
        addToast(`${label} logged`, ToastType.Success);
      } else {
        addToast(result.error, ToastType.Error);
      }
    },
    [addToast, subcollection, label, readOnly],
  );

  /** Removes an entry by ID */
  const remove = useCallback(
    async (id: string) => {
      if (readOnly) return;
      const adapter = adapterRef.current;
      if (!adapter) return;
      const result = await adapter.remove(subcollection, id);
      if (isOk(result)) {
        addToast(`${label} deleted`, ToastType.Success);
      } else {
        addToast(result.error, ToastType.Error);
      }
    },
    [addToast, subcollection, label, readOnly],
  );

  /** Updates an existing entry by ID */
  const update = useCallback(
    async (data: T) => {
      if (readOnly) return;
      const adapter = adapterRef.current;
      if (!adapter) return;
      const result = await adapter.save(subcollection, data);
      if (isOk(result)) {
        addToast(`${label} updated`, ToastType.Success);
      } else {
        addToast(result.error, ToastType.Error);
      }
    },
    [addToast, subcollection, label, readOnly],
  );

  return { items, ready, log, update, remove };
}

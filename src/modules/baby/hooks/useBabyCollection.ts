import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuth } from '@/shared/auth/useAuth';
import { useToast } from '@/shared/errors/useToast';
import { createAdapter } from '@/shared/storage/create-adapter';
import type { StorageAdapter } from '@/shared/storage/adapter';
import { isOk, SyncStatus, ToastType } from '@/shared/types';
import { childPath } from '@/constants/db';
import { CommonMsg } from '@/constants/messages';

/** Generic hook for a baby subcollection nested under a child — handles listener, state, and save */
export function useBabyCollection<T extends Record<string, unknown> & { id: string }>(
  childId: string | null,
  subcollection: string,
  label: string,
  targetUid?: string,
) {
  const { firebaseUser, setSyncStatus } = useAuth();
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
        // TODO(sentry): pipe onError to centralized logError once Sentry lands.
        console.error(`[AFP] Baby ${label} listener error:`, error);
        setSyncStatus(SyncStatus.Error);
      },
    );

    return () => {
      unsubscribe();
      adapterRef.current = null;
    };
  }, [uid, childId, subcollection, label, setSyncStatus]);

  /** Saves a new entry with a generated UUID and shows a success/error toast */
  const log = useCallback(
    async (data: Omit<T, 'id'>): Promise<boolean> => {
      if (readOnly) {
        addToast(CommonMsg.ReadOnlyMode, ToastType.Info);
        return false;
      }
      const adapter = adapterRef.current;
      if (!adapter) return false;
      const entry = { ...data, id: crypto.randomUUID() } as T;
      const result = await adapter.save(subcollection, entry);
      if (isOk(result)) {
        addToast(`${label} logged`, ToastType.Success);
        return true;
      } else {
        addToast(result.error, ToastType.Error);
        return false;
      }
    },
    [addToast, subcollection, label, readOnly],
  );

  /** Removes an entry by ID */
  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      if (readOnly) {
        addToast(CommonMsg.ReadOnlyMode, ToastType.Info);
        return false;
      }
      const adapter = adapterRef.current;
      if (!adapter) return false;
      const result = await adapter.remove(subcollection, id);
      if (isOk(result)) {
        addToast(`${label} deleted`, ToastType.Success);
        return true;
      } else {
        addToast(result.error, ToastType.Error);
        return false;
      }
    },
    [addToast, subcollection, label, readOnly],
  );

  /** Updates an existing entry by ID */
  const update = useCallback(
    async (data: T): Promise<boolean> => {
      if (readOnly) {
        addToast(CommonMsg.ReadOnlyMode, ToastType.Info);
        return false;
      }
      const adapter = adapterRef.current;
      if (!adapter) return false;
      const result = await adapter.save(subcollection, data);
      if (isOk(result)) {
        addToast(`${label} updated`, ToastType.Success);
        return true;
      } else {
        addToast(result.error, ToastType.Error);
        return false;
      }
    },
    [addToast, subcollection, label, readOnly],
  );

  return { items, ready, log, update, remove };
}

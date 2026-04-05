import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuth } from '@/shared/auth/useAuth';
import { useToast } from '@/shared/errors/useToast';
import { createAdapter } from '@/shared/storage/create-adapter';
import type { StorageAdapter } from '@/shared/storage/adapter';
import { isOk } from '@/shared/types';
import { userPath } from '@/constants/db';

/** Generic hook for a baby subcollection — handles listener, state, and save */
export function useBabyCollection<T extends Record<string, unknown> & { id: string }>(
  subcollection: string,
  label: string,
) {
  const { firebaseUser } = useAuth();
  const { addToast } = useToast();
  const [items, setItems] = useState<T[]>([]);
  const [ready, setReady] = useState(false);
  const adapterRef = useRef<StorageAdapter | null>(null);

  useEffect(() => {
    if (!firebaseUser) return;

    const adapter = createAdapter(userPath(firebaseUser.uid));
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
      // Do not reset ready — it's a one-time "first snapshot arrived" signal.
      // Resetting on unmount causes useBabyData to flip sync status to Syncing.
    };
  }, [firebaseUser, subcollection, label]);

  const log = useCallback(
    async (data: Omit<T, 'id'>) => {
      const adapter = adapterRef.current;
      if (!adapter) return;
      const entry = { ...data, id: crypto.randomUUID() } as T;
      const result = await adapter.save(subcollection, entry);
      if (isOk(result)) {
        addToast(`${label} logged`, 'success');
      } else {
        addToast(result.error, 'error');
      }
    },
    [addToast, subcollection, label],
  );

  return { items, ready, log };
}

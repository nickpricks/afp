import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuth } from '@/shared/auth/useAuth';
import { useToast } from '@/shared/errors/useToast';
import { createAdapter } from '@/shared/storage/create-adapter';
import type { StorageAdapter } from '@/shared/storage/adapter';
import { isOk } from '@/shared/types';
import { childPath } from '@/constants/db';

/** Generic hook for a baby subcollection nested under a child — handles listener, state, and save */
export function useBabyCollection<T extends Record<string, unknown> & { id: string }>(
  childId: string | null,
  subcollection: string,
  label: string,
) {
  const { firebaseUser } = useAuth();
  const { addToast } = useToast();
  const [items, setItems] = useState<T[]>([]);
  const [ready, setReady] = useState(false);
  const adapterRef = useRef<StorageAdapter | null>(null);

  useEffect(() => {
    if (!firebaseUser || !childId) return;

    const adapter = createAdapter(childPath(firebaseUser.uid, childId));
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
  }, [firebaseUser, childId, subcollection, label]);

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

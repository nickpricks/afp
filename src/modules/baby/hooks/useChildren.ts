import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuth } from '@/shared/auth/useAuth';
import { useToast } from '@/shared/errors/useToast';
import { createAdapter } from '@/shared/storage/create-adapter';
import type { StorageAdapter } from '@/shared/storage/adapter';
import { isOk } from '@/shared/types';
import type { Result } from '@/shared/types';
import { ok, err } from '@/shared/types';
import { userPath, DbSubcollection } from '@/constants/db';
import { BabyMsg } from '@/constants/messages';
import type { Child } from '@/modules/baby/types';

/** Manages the children collection for a user */
export function useChildren(targetUid?: string) {
  const { firebaseUser } = useAuth();
  const { addToast } = useToast();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const adapterRef = useRef<StorageAdapter | null>(null);

  const uid = targetUid ?? firebaseUser?.uid;
  const readOnly = targetUid != null && targetUid !== firebaseUser?.uid;

  useEffect(() => {
    if (!uid) return;

    const adapter = createAdapter(userPath(uid));
    adapterRef.current = adapter;

    const unsubscribe = adapter.onSnapshot<Child>(
      DbSubcollection.Children,
      (data) => {
        setChildren(data);
        setLoading(false);
      },
      (error) => {
        console.error('[AFP] Children listener error:', error);
      },
    );

    return () => {
      unsubscribe();
      adapterRef.current = null;
    };
  }, [uid]);

  const addChild = useCallback(
    async (child: Omit<Child, 'id'>): Promise<Result<string>> => {
      if (readOnly) return err('Read-only mode');
      const adapter = adapterRef.current;
      if (!adapter) {
        return err('Not authenticated');
      }
      const id = crypto.randomUUID();
      const entry = { ...child, id } as Child & { id: string };
      const result = await adapter.save(DbSubcollection.Children, entry);
      if (isOk(result)) {
        addToast(BabyMsg.ChildAdded, 'success');
        return ok(id);
      }
      addToast(result.error, 'error');
      return err(result.error);
    },
    [addToast],
  );

  const updateChild = useCallback(
    async (childId: string, data: Partial<Omit<Child, 'id'>>): Promise<Result<void>> => {
      if (readOnly) return err('Read-only mode');
      const adapter = adapterRef.current;
      if (!adapter) {
        return err('Not authenticated');
      }
      const existing = children.find((c) => c.id === childId);
      if (!existing) {
        return err('Child not found');
      }
      const updated = { ...existing, ...data, id: childId };
      const result = await adapter.save(DbSubcollection.Children, updated);
      if (isOk(result)) {
        addToast(BabyMsg.ChildUpdated, 'success');
        return ok(undefined);
      }
      addToast(result.error, 'error');
      return err(result.error);
    },
    [addToast, children],
  );

  return { children, addChild, updateChild, loading };
}

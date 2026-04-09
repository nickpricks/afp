import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuth } from '@/shared/auth/useAuth';
import { useToast } from '@/shared/errors/useToast';
import { createAdapter } from '@/shared/storage/create-adapter';
import type { StorageAdapter } from '@/shared/storage/adapter';
import type { BodyConfig } from '@/modules/body/types';
import { DEFAULT_BODY_CONFIG } from '@/modules/body/types';
import { SyncStatus, isOk } from '@/shared/types';
import { DbSubcollection, DbDoc, userPath } from '@/constants/db';
import { BodyMsg } from '@/constants/messages';

/** Provides body module configuration state, loading, and save action */
export function useBodyConfig(targetUid?: string) {
  const { firebaseUser, setSyncStatus } = useAuth();
  const { addToast } = useToast();
  const [config, setConfig] = useState<BodyConfig>(DEFAULT_BODY_CONFIG);
  const [loading, setLoading] = useState(true);
  const adapterRef = useRef<StorageAdapter | null>(null);

  const uid = targetUid ?? firebaseUser?.uid;
  const readOnly = targetUid != null && targetUid !== firebaseUser?.uid;

  const isConfigured = config.configuredAt !== '';

  useEffect(() => {
    if (!uid) return;

    const syncFn = readOnly ? () => {} : setSyncStatus;
    const adapter = createAdapter(userPath(uid));
    adapterRef.current = adapter;
    syncFn(SyncStatus.Syncing);

    const unsub = adapter.onSnapshot<BodyConfig>(
      DbSubcollection.BodyConfig,
      (items) => {
        const doc = items.find((item) => (item as Record<string, unknown>)['id'] === DbDoc.Main);
        if (doc) {
          setConfig(doc);
        }
        setLoading(false);
        syncFn(SyncStatus.Synced);
      },
      (error) => {
        console.error('[AFP] Body config listener error:', error);
        setLoading(false);
        syncFn(SyncStatus.Error);
      },
    );

    return () => {
      unsub();
      adapterRef.current = null;
    };
  }, [uid, readOnly, setSyncStatus]);

  /** Persists the body config */
  const saveConfig = useCallback(
    async (updated: BodyConfig) => {
      if (readOnly) return;
      const adapter = adapterRef.current;
      if (!adapter) return;

      const withTimestamp: BodyConfig = {
        ...updated,
        configuredAt: updated.configuredAt || new Date().toISOString(),
      };

      setConfig(withTimestamp);

      const result = await adapter.save(DbSubcollection.BodyConfig, {
        ...withTimestamp,
        id: DbDoc.Main,
      });
      if (!isOk(result)) {
        addToast(BodyMsg.ConfigFailed, 'error');
      } else {
        addToast(BodyMsg.ConfigSaved, 'success');
      }
    },
    [addToast, readOnly],
  );

  return { config, isConfigured, loading, saveConfig };
}

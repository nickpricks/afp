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
export function useBodyConfig() {
  const { firebaseUser, setSyncStatus } = useAuth();
  const { addToast } = useToast();
  const [config, setConfig] = useState<BodyConfig>(DEFAULT_BODY_CONFIG);
  const [loading, setLoading] = useState(true);
  const adapterRef = useRef<StorageAdapter | null>(null);

  const isConfigured = config.configuredAt !== '';

  useEffect(() => {
    if (!firebaseUser) return;

    const adapter = createAdapter(userPath(firebaseUser.uid));
    adapterRef.current = adapter;
    setSyncStatus(SyncStatus.Syncing);

    const unsub = adapter.onSnapshot<BodyConfig>(
      DbSubcollection.BodyConfig,
      (items) => {
        const doc = items.find((item) => (item as Record<string, unknown>)['id'] === DbDoc.Main);
        if (doc) {
          setConfig(doc);
        }
        setLoading(false);
        setSyncStatus(SyncStatus.Synced);
      },
      (error) => {
        console.error('[AFP] Body config listener error:', error);
        setLoading(false);
        setSyncStatus(SyncStatus.Error);
      },
    );

    return () => {
      unsub();
      adapterRef.current = null;
    };
  }, [firebaseUser, setSyncStatus]);

  /** Persists the body config */
  const saveConfig = useCallback(
    async (updated: BodyConfig) => {
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
    [addToast],
  );

  return { config, isConfigured, loading, saveConfig };
}

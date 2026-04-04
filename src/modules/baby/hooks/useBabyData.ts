import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuth } from '@/shared/auth/useAuth';
import { useToast } from '@/shared/errors/useToast';
import { createAdapter } from '@/shared/storage/create-adapter';
import type { StorageAdapter } from '@/shared/storage/adapter';
import type { FeedEntry, SleepEntry, GrowthEntry, DiaperEntry } from '@/modules/baby/types';
import { SyncStatus, isOk } from '@/shared/types';
import { DbSubcollection, userPath } from '@/constants/db';

/** Saves a record to a collection via the adapter, showing a toast on result */
async function saveEntry<T extends Record<string, unknown>>(
  adapter: StorageAdapter,
  collectionName: string,
  data: T,
  addToast: (message: string, type: 'success' | 'error') => void,
  label: string,
): Promise<boolean> {
  const result = await adapter.save(collectionName, data);
  if (isOk(result)) {
    addToast(`${label} logged`, 'success');
    return true;
  }
  addToast(result.error, 'error');
  return false;
}

/** Provides baby tracking state, real-time sync, and log actions for all subcollections */
export function useBabyData() {
  const { firebaseUser, setSyncStatus } = useAuth();
  const { addToast } = useToast();
  const [feeds, setFeeds] = useState<FeedEntry[]>([]);
  const [sleeps, setSleeps] = useState<SleepEntry[]>([]);
  const [growth, setGrowth] = useState<GrowthEntry[]>([]);
  const [diapers, setDiapers] = useState<DiaperEntry[]>([]);
  const adapterRef = useRef<StorageAdapter | null>(null);

  useEffect(() => {
    if (!firebaseUser) return;

    const adapter = createAdapter(userPath(firebaseUser.uid));
    adapterRef.current = adapter;
    setSyncStatus(SyncStatus.Syncing);

    const handleError = (label: string) => (error: Error) => {
      console.error(`[AFP] Baby ${label} listener error:`, error);
      setSyncStatus(SyncStatus.Error);
    };

    const unsubFeeds = adapter.onSnapshot<FeedEntry>(DbSubcollection.BabyFeeds, (items) => {
      setFeeds(items);
      setSyncStatus(SyncStatus.Synced);
    }, handleError(DbSubcollection.BabyFeeds));

    const unsubSleeps = adapter.onSnapshot<SleepEntry>(DbSubcollection.BabySleep, (items) => {
      setSleeps(items);
      setSyncStatus(SyncStatus.Synced);
    }, handleError(DbSubcollection.BabySleep));

    const unsubGrowth = adapter.onSnapshot<GrowthEntry>(DbSubcollection.BabyGrowth, (items) => {
      setGrowth(items);
      setSyncStatus(SyncStatus.Synced);
    }, handleError(DbSubcollection.BabyGrowth));

    const unsubDiapers = adapter.onSnapshot<DiaperEntry>(DbSubcollection.BabyDiapers, (items) => {
      setDiapers(items);
      setSyncStatus(SyncStatus.Synced);
    }, handleError(DbSubcollection.BabyDiapers));

    return () => {
      unsubFeeds();
      unsubSleeps();
      unsubGrowth();
      unsubDiapers();
      adapterRef.current = null;
    };
  }, [firebaseUser, setSyncStatus]);

  /** Logs a new feed entry */
  const logFeed = useCallback(
    async (data: Omit<FeedEntry, 'id'>) => {
      const adapter = adapterRef.current;
      if (!adapter) return;
      await saveEntry(adapter, DbSubcollection.BabyFeeds, { ...data, id: crypto.randomUUID() }, addToast, 'Feed');
    },
    [addToast],
  );

  /** Logs a new sleep entry */
  const logSleep = useCallback(
    async (data: Omit<SleepEntry, 'id'>) => {
      const adapter = adapterRef.current;
      if (!adapter) return;
      await saveEntry(adapter, DbSubcollection.BabySleep, { ...data, id: crypto.randomUUID() }, addToast, 'Sleep');
    },
    [addToast],
  );

  /** Logs a new growth entry */
  const logGrowth = useCallback(
    async (data: Omit<GrowthEntry, 'id'>) => {
      const adapter = adapterRef.current;
      if (!adapter) return;
      await saveEntry(adapter, DbSubcollection.BabyGrowth, { ...data, id: crypto.randomUUID() }, addToast, 'Growth');
    },
    [addToast],
  );

  /** Logs a new diaper entry */
  const logDiaper = useCallback(
    async (data: Omit<DiaperEntry, 'id'>) => {
      const adapter = adapterRef.current;
      if (!adapter) return;
      await saveEntry(adapter, DbSubcollection.BabyDiapers, { ...data, id: crypto.randomUUID() }, addToast, 'Diaper');
    },
    [addToast],
  );

  return { feeds, sleeps, growth, diapers, logFeed, logSleep, logGrowth, logDiaper };
}

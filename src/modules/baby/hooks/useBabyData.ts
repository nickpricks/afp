import { useEffect } from 'react';

import { useAuth } from '@/shared/auth/useAuth';
import { useBabyCollection } from '@/modules/baby/hooks/useBabyCollection';
import type { FeedEntry, SleepEntry, GrowthEntry, DiaperEntry } from '@/modules/baby/types';
import { SyncStatus } from '@/shared/types';
import { DbSubcollection } from '@/constants/db';

/** Provides baby tracking state, real-time sync, and log actions for all subcollections of a child */
export function useBabyData(childId: string | null, targetUid?: string) {
  const { setSyncStatus } = useAuth();

  const feedCol = useBabyCollection<FeedEntry>(childId, DbSubcollection.Feeds, 'Feed', targetUid);
  const sleepCol = useBabyCollection<SleepEntry>(childId, DbSubcollection.Sleep, 'Sleep', targetUid);
  const growthCol = useBabyCollection<GrowthEntry>(childId, DbSubcollection.Growth, 'Growth', targetUid);
  const diaperCol = useBabyCollection<DiaperEntry>(childId, DbSubcollection.Diapers, 'Diaper', targetUid);

  // Only set Synced when ALL listeners have reported
  useEffect(() => {
    if (!childId) return;
    const allReady = feedCol.ready && sleepCol.ready && growthCol.ready && diaperCol.ready;
    setSyncStatus(allReady ? SyncStatus.Synced : SyncStatus.Syncing);
  }, [childId, feedCol.ready, sleepCol.ready, growthCol.ready, diaperCol.ready, setSyncStatus]);

  return {
    feeds: feedCol.items,
    sleeps: sleepCol.items,
    growth: growthCol.items,
    diapers: diaperCol.items,
    logFeed: feedCol.log,
    logSleep: sleepCol.log,
    logGrowth: growthCol.log,
    logDiaper: diaperCol.log,
    removeFeed: feedCol.remove,
    removeSleep: sleepCol.remove,
    removeGrowth: growthCol.remove,
    removeDiaper: diaperCol.remove,
  };
}

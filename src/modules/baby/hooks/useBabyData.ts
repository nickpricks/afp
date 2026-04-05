import { useEffect } from 'react';

import { useAuth } from '@/shared/auth/useAuth';
import { useBabyCollection } from '@/modules/baby/hooks/useBabyCollection';
import type { FeedEntry, SleepEntry, GrowthEntry, DiaperEntry } from '@/modules/baby/types';
import { SyncStatus } from '@/shared/types';
import { DbSubcollection } from '@/constants/db';

/** Provides baby tracking state, real-time sync, and log actions for all subcollections */
export function useBabyData() {
  const { setSyncStatus } = useAuth();

  const feedCol = useBabyCollection<FeedEntry>(DbSubcollection.BabyFeeds, 'Feed');
  const sleepCol = useBabyCollection<SleepEntry>(DbSubcollection.BabySleep, 'Sleep');
  const growthCol = useBabyCollection<GrowthEntry>(DbSubcollection.BabyGrowth, 'Growth');
  const diaperCol = useBabyCollection<DiaperEntry>(DbSubcollection.BabyDiapers, 'Diaper');

  // Only set Synced when ALL listeners have reported
  useEffect(() => {
    const allReady = feedCol.ready && sleepCol.ready && growthCol.ready && diaperCol.ready;
    setSyncStatus(allReady ? SyncStatus.Synced : SyncStatus.Syncing);
  }, [feedCol.ready, sleepCol.ready, growthCol.ready, diaperCol.ready, setSyncStatus]);

  return {
    feeds: feedCol.items,
    sleeps: sleepCol.items,
    growth: growthCol.items,
    diapers: diaperCol.items,
    logFeed: feedCol.log,
    logSleep: sleepCol.log,
    logGrowth: growthCol.log,
    logDiaper: diaperCol.log,
  };
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from '@/shared/auth/useAuth';
import { useToast } from '@/shared/errors/useToast';
import { createAdapter } from '@/shared/storage/create-adapter';
import type { StorageAdapter } from '@/shared/storage/adapter';
import type { ActivityEntry, BodyRecord } from '@/modules/body/types';
import { ActivityType } from '@/modules/body/types';
import { computeBodyScore } from '@/modules/body/scoring';
import { todayStr, nowTime } from '@/shared/utils/date';
import { SyncStatus, isOk } from '@/shared/types';
import { DbSubcollection, userPath } from '@/constants/db';

/** Creates a zero-valued BodyRecord for the given date */
function emptyRecord(dateStr: string): BodyRecord {
  return { id: dateStr, dateStr, floors: { up: 0, down: 0 }, walkMeters: 0, runMeters: 0, total: 0 };
}

/** Recomputes the daily summary from activities + existing floors */
function recomputeSummary(record: BodyRecord, activities: ActivityEntry[]): BodyRecord {
  const todayActivities = activities.filter((a) => a.dateStr === record.dateStr);
  let walkMeters = 0;
  let runMeters = 0;
  for (const a of todayActivities) {
    if (a.type === ActivityType.Walk) {
      walkMeters += a.distanceMeters;
    } else if (a.type === ActivityType.Run) {
      runMeters += a.distanceMeters;
    }
  }
  const updated = { ...record, walkMeters, runMeters };
  updated.total = computeBodyScore(updated);
  return updated;
}

/** Provides body tracking state, real-time sync, and tap/log actions */
export function useBodyData() {
  const { firebaseUser, setSyncStatus } = useAuth();
  const { addToast } = useToast();
  const [records, setRecords] = useState<Record<string, BodyRecord>>({});
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const activitiesRef = useRef<ActivityEntry[]>([]);
  const adapterRef = useRef<StorageAdapter | null>(null);

  useEffect(() => {
    if (!firebaseUser) return;

    const adapter = createAdapter(userPath(firebaseUser.uid));
    adapterRef.current = adapter;
    setSyncStatus(SyncStatus.Syncing);

    const unsubBody = adapter.onSnapshot<BodyRecord>(
      DbSubcollection.Body,
      (items) => {
        const mapped: Record<string, BodyRecord> = {};
        for (const item of items) {
          mapped[item.dateStr] = item;
        }
        setRecords(mapped);
        setSyncStatus(SyncStatus.Synced);
      },
      (error) => {
        console.error('[AFP] Body listener error:', error);
        setSyncStatus(SyncStatus.Error);
      },
    );

    const unsubActivities = adapter.onSnapshot<ActivityEntry>(
      DbSubcollection.BodyActivities,
      (items) => {
        setActivities(items);
        activitiesRef.current = items;
      },
      (error) => {
        console.error('[AFP] Body activities listener error:', error);
        setSyncStatus(SyncStatus.Error);
      },
    );

    return () => {
      unsubBody();
      unsubActivities();
      adapterRef.current = null;
    };
  }, [firebaseUser, setSyncStatus]);

  const todayKey = todayStr();

  const todayRecord = useMemo<BodyRecord>(() => {
    const base = records[todayKey] ?? emptyRecord(todayKey);
    return recomputeSummary(base, activities);
  }, [records, activities, todayKey]);

  const todayActivities = useMemo(() => {
    return activities
      .filter((a) => a.dateStr === todayKey)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [activities, todayKey]);

  /** Taps a floor up or down */
  const tap = useCallback(
    async (type: 'up' | 'down') => {
      const adapter = adapterRef.current;
      if (!adapter) return;

      const key = todayStr();
      const current = records[key] ?? emptyRecord(key);
      const updated: BodyRecord = {
        ...current,
        floors: {
          up: current.floors.up + (type === 'up' ? 1 : 0),
          down: current.floors.down + (type === 'down' ? 1 : 0),
        },
      };
      // Recompute with current activity totals
      const withActivities = recomputeSummary(updated, activities);

      setRecords((prev) => ({ ...prev, [key]: withActivities }));

      const result = await adapter.save(DbSubcollection.Body, { ...withActivities, id: key });
      if (!isOk(result)) {
        addToast(result.error, 'error');
        setRecords((prev) => ({ ...prev, [key]: current }));
      }
    },
    [records, activities, addToast],
  );

  /** Logs a new walk or run activity */
  const logActivity = useCallback(
    async (type: ActivityType, distanceMeters: number) => {
      const adapter = adapterRef.current;
      if (!adapter || distanceMeters <= 0) return;

      const entry: ActivityEntry = {
        id: crypto.randomUUID(),
        type,
        distanceMeters,
        dateStr: todayStr(),
        createdAt: nowTime(),
      };

      // Optimistically add to local state + ref
      const optimistic = [...activitiesRef.current, entry];
      activitiesRef.current = optimistic;
      setActivities(optimistic);

      const result = await adapter.save(DbSubcollection.BodyActivities, entry);
      if (!isOk(result)) {
        addToast(result.error, 'error');
        const rolled = activitiesRef.current.filter((a) => a.id !== entry.id);
        activitiesRef.current = rolled;
        setActivities(rolled);
        return;
      }

      // Persist updated daily summary using current ref (not stale closure)
      const key = entry.dateStr;
      const base = records[key] ?? emptyRecord(key);
      const updated = recomputeSummary(base, activitiesRef.current);
      const summaryResult = await adapter.save(DbSubcollection.Body, { ...updated, id: key });
      if (!isOk(summaryResult)) {
        addToast(summaryResult.error, 'error');
      }
    },
    [records, addToast],
  );

  return { records, todayRecord, todayActivities, tap, logActivity };
}

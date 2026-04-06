import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from '@/shared/auth/useAuth';
import { useToast } from '@/shared/errors/useToast';
import { createAdapter } from '@/shared/storage/create-adapter';
import type { StorageAdapter } from '@/shared/storage/adapter';
import type { BodyActivity, BodyRecord } from '@/modules/body/types';
import { computeBodyScore } from '@/modules/body/scoring';
import { todayStr, nowTime } from '@/shared/utils/date';
import { ActivityType, SyncStatus, isOk } from '@/shared/types';
import { DbSubcollection, userPath } from '@/constants/db';
import { BodyMsg } from '@/constants/messages';

/** Creates a zero-valued BodyRecord for the given date */
function emptyRecord(dateStr: string): BodyRecord {
  return { dateStr, up: 0, down: 0, walkMeters: 0, runMeters: 0, total: 0, updatedAt: '' };
}

/** Recomputes the daily summary from activities + existing floors */
function recomputeSummary(record: BodyRecord, activities: BodyActivity[]): BodyRecord {
  const dayActivities = activities.filter((a) => a.date === record.dateStr);
  let walkMeters = 0;
  let runMeters = 0;
  for (const a of dayActivities) {
    if (a.type === ActivityType.Walk) {
      walkMeters += a.distance ?? 0;
    } else if (a.type === ActivityType.Run) {
      runMeters += a.distance ?? 0;
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
  const [activities, setActivities] = useState<BodyActivity[]>([]);
  const activitiesRef = useRef<BodyActivity[]>([]);
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

    const unsubActivities = adapter.onSnapshot<BodyActivity>(
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
      .filter((a) => a.date === todayKey)
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
        up: current.up + (type === 'up' ? 1 : 0),
        down: current.down + (type === 'down' ? 1 : 0),
        updatedAt: new Date().toISOString(),
      };
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

  /** Logs a new activity (walk, run, etc.) */
  const logActivity = useCallback(
    async (type: ActivityType, distanceMeters: number) => {
      const adapter = adapterRef.current;
      if (!adapter || distanceMeters <= 0) return;

      const entry: BodyActivity = {
        id: crypto.randomUUID(),
        type,
        distance: distanceMeters,
        duration: null,
        date: todayStr(),
        timestamp: new Date().toISOString(),
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
      const key = entry.date;
      const base = records[key] ?? emptyRecord(key);
      const updated = recomputeSummary(base, activitiesRef.current);
      const summaryResult = await adapter.save(DbSubcollection.Body, { ...updated, id: key });
      if (!isOk(summaryResult)) {
        addToast(summaryResult.error, 'error');
      }
    },
    [records, addToast],
  );

  /** Saves or updates a body record for any date (edit/backfill) */
  const saveRecord = useCallback(
    async (dateKey: string, data: Partial<Pick<BodyRecord, 'up' | 'down'>>) => {
      const adapter = adapterRef.current;
      if (!adapter) return;

      const current = records[dateKey] ?? emptyRecord(dateKey);
      const merged: BodyRecord = {
        ...current,
        up: data.up ?? current.up,
        down: data.down ?? current.down,
        updatedAt: new Date().toISOString(),
      };
      const withActivities = recomputeSummary(merged, activitiesRef.current);

      setRecords((prev) => ({ ...prev, [dateKey]: withActivities }));

      const result = await adapter.save(DbSubcollection.Body, { ...withActivities, id: dateKey });
      if (!isOk(result)) {
        addToast(BodyMsg.RecordFailed, 'error');
        setRecords((prev) => ({ ...prev, [dateKey]: current }));
      } else {
        addToast(BodyMsg.RecordSaved, 'success');
      }
    },
    [records, addToast],
  );

  /** Updates an existing activity's distance */
  const updateActivity = useCallback(
    async (id: string, data: { distance?: number }) => {
      const adapter = adapterRef.current;
      if (!adapter) return;

      const current = activitiesRef.current.find((a) => a.id === id);
      if (!current) return;

      const updated: BodyActivity = {
        ...current,
        distance: data.distance ?? current.distance,
        timestamp: new Date().toISOString(),
      };

      // Optimistic update
      const optimistic = activitiesRef.current.map((a) => (a.id === id ? updated : a));
      activitiesRef.current = optimistic;
      setActivities(optimistic);

      const result = await adapter.save(DbSubcollection.BodyActivities, updated);
      if (!isOk(result)) {
        addToast(BodyMsg.ActivityUpdateFailed, 'error');
        const rolled = activitiesRef.current.map((a) => (a.id === id ? current : a));
        activitiesRef.current = rolled;
        setActivities(rolled);
        return;
      }

      addToast(BodyMsg.ActivityUpdated, 'success');

      // Recompute daily summary
      const key = current.date;
      const base = records[key] ?? emptyRecord(key);
      const recomputed = recomputeSummary(base, activitiesRef.current);
      const summaryResult = await adapter.save(DbSubcollection.Body, { ...recomputed, id: key });
      if (!isOk(summaryResult)) {
        addToast(summaryResult.error, 'error');
      }
    },
    [records, addToast],
  );

  return { records, todayRecord, activities, todayActivities, tap, logActivity, saveRecord, updateActivity };
}

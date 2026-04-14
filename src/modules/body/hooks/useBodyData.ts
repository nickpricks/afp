import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from '@/shared/auth/useAuth';
import { useToast } from '@/shared/errors/useToast';
import { createAdapter } from '@/shared/storage/create-adapter';
import type { StorageAdapter } from '@/shared/storage/adapter';
import type { BodyActivity, BodyRecord } from '@/modules/body/types';
import { computeBodyScore } from '@/modules/body/scoring';
import { todayStr } from '@/shared/utils/date';
import { ActivityType, SyncStatus, ToastType, isOk } from '@/shared/types';
import { DbSubcollection, userPath } from '@/constants/db';
import { BodyMsg } from '@/constants/messages';
import { sortNewestFirst } from '@/shared/utils/sort';

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
export function useBodyData(targetUid?: string) {
  const { firebaseUser, setSyncStatus } = useAuth();
  const { addToast } = useToast();
  const [records, setRecords] = useState<Record<string, BodyRecord>>({});
  const [activities, setActivities] = useState<BodyActivity[]>([]);
  const activitiesRef = useRef<BodyActivity[]>([]);
  const recordsRef = useRef<Record<string, BodyRecord>>({});
  const adapterRef = useRef<StorageAdapter | null>(null);

  const uid = targetUid ?? firebaseUser?.uid;
  const readOnly = targetUid != null && targetUid !== firebaseUser?.uid;

  useEffect(() => {
    if (!uid) return;

    const syncFn = readOnly ? () => {} : setSyncStatus;
    const adapter = createAdapter(userPath(uid));
    adapterRef.current = adapter;
    syncFn(SyncStatus.Syncing);

    const unsubBody = adapter.onSnapshot<BodyRecord>(
      DbSubcollection.Body,
      (items) => {
        const mapped: Record<string, BodyRecord> = {};
        for (const item of items) {
          mapped[item.dateStr] = item;
        }
        recordsRef.current = mapped;
        setRecords(mapped);
        syncFn(SyncStatus.Synced);
      },
      (error) => {
        console.error('[AFP] Body listener error:', error);
        syncFn(SyncStatus.Error);
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
        syncFn(SyncStatus.Error);
      },
    );

    return () => {
      unsubBody();
      unsubActivities();
      adapterRef.current = null;
    };
  }, [uid, readOnly, setSyncStatus]);

  const todayKey = todayStr();

  const todayRecord = useMemo<BodyRecord>(() => {
    const base = records[todayKey] ?? emptyRecord(todayKey);
    return recomputeSummary(base, activities);
  }, [records, activities, todayKey]);

  const todayActivities = useMemo(() => {
    return sortNewestFirst(
      activities.filter((a) => a.date === todayKey),
      (a) => a.createdAt,
    );
  }, [activities, todayKey]);

  /** Taps a floor up or down */
  const tap = useCallback(
    async (type: 'up' | 'down') => {
      if (readOnly) return;
      const adapter = adapterRef.current;
      if (!adapter) return;

      const key = todayStr();
      const current = recordsRef.current[key] ?? emptyRecord(key);
      const updated: BodyRecord = {
        ...current,
        up: current.up + (type === 'up' ? 1 : 0),
        down: current.down + (type === 'down' ? 1 : 0),
        updatedAt: new Date().toISOString(),
      };
      const withActivities = recomputeSummary(updated, activitiesRef.current);

      // Optimistic update for responsive tap UX
      recordsRef.current = { ...recordsRef.current, [key]: withActivities };
      setRecords((prev) => ({ ...prev, [key]: withActivities }));

      const result = await adapter.save(DbSubcollection.Body, { ...withActivities, id: key });
      if (!isOk(result)) {
        addToast(result.error, ToastType.Error);
        recordsRef.current = { ...recordsRef.current, [key]: current };
        setRecords((prev) => ({ ...prev, [key]: current }));
      }
    },
    [addToast, readOnly],
  );

  /** Logs a new activity (walk, run, etc.) — defaults to today, pass date for backfill */
  const logActivity = useCallback(
    async (type: ActivityType, distanceMeters: number, date?: string) => {
      if (readOnly) return;
      const adapter = adapterRef.current;
      if (!adapter || distanceMeters <= 0) return;

      const entry: BodyActivity = {
        id: crypto.randomUUID(),
        type,
        distance: distanceMeters,
        duration: null,
        date: date ?? todayStr(),
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      // Save activity — snapshot listener will update state
      const result = await adapter.save(DbSubcollection.BodyActivities, entry);
      if (!isOk(result)) {
        addToast(result.error, ToastType.Error);
        return;
      }

      // Persist updated daily summary using current refs (not stale closure)
      const key = entry.date;
      const base = recordsRef.current[key] ?? emptyRecord(key);
      const updated = recomputeSummary(base, activitiesRef.current);
      const summaryResult = await adapter.save(DbSubcollection.Body, { ...updated, id: key });
      if (!isOk(summaryResult)) {
        addToast(summaryResult.error, ToastType.Error);
      }
    },
    [addToast, readOnly],
  );

  /** Saves or updates a body record for any date (edit/backfill) */
  const saveRecord = useCallback(
    async (dateKey: string, data: Partial<Pick<BodyRecord, 'up' | 'down'>>) => {
      if (readOnly) return;
      const adapter = adapterRef.current;
      if (!adapter) return;

      const current = recordsRef.current[dateKey] ?? emptyRecord(dateKey);
      const merged: BodyRecord = {
        ...current,
        up: data.up ?? current.up,
        down: data.down ?? current.down,
        updatedAt: new Date().toISOString(),
      };
      const withActivities = recomputeSummary(merged, activitiesRef.current);

      // Optimistic update for responsive edit UX
      recordsRef.current = { ...recordsRef.current, [dateKey]: withActivities };
      setRecords((prev) => ({ ...prev, [dateKey]: withActivities }));

      const result = await adapter.save(DbSubcollection.Body, { ...withActivities, id: dateKey });
      if (!isOk(result)) {
        addToast(BodyMsg.RecordFailed, ToastType.Error);
        recordsRef.current = { ...recordsRef.current, [dateKey]: current };
        setRecords((prev) => ({ ...prev, [dateKey]: current }));
      } else {
        addToast(BodyMsg.RecordSaved, ToastType.Success);
      }
    },
    [addToast, readOnly],
  );

  /** Updates an existing activity's distance */
  const updateActivity = useCallback(
    async (id: string, data: { distance?: number }) => {
      if (readOnly) return;
      const adapter = adapterRef.current;
      if (!adapter) return;

      const current = activitiesRef.current.find((a) => a.id === id);
      if (!current) return;

      const updated: BodyActivity = {
        ...current,
        distance: data.distance ?? current.distance,
        timestamp: new Date().toISOString(),
      };

      // Save activity — snapshot listener will update state
      const result = await adapter.save(DbSubcollection.BodyActivities, updated);
      if (!isOk(result)) {
        addToast(BodyMsg.ActivityUpdateFailed, ToastType.Error);
        return;
      }

      addToast(BodyMsg.ActivityUpdated, ToastType.Success);

      // Recompute daily summary using current refs
      const key = current.date;
      const base = recordsRef.current[key] ?? emptyRecord(key);
      const recomputed = recomputeSummary(base, activitiesRef.current);
      const summaryResult = await adapter.save(DbSubcollection.Body, { ...recomputed, id: key });
      if (!isOk(summaryResult)) {
        addToast(summaryResult.error, ToastType.Error);
      }
    },
    [addToast, readOnly],
  );

  /** Deletes an activity by ID and recomputes the daily summary */
  const deleteActivity = useCallback(
    async (id: string) => {
      if (readOnly) return;
      const adapter = adapterRef.current;
      if (!adapter) return;

      const target = activitiesRef.current.find((a) => a.id === id);
      if (!target) return;

      const result = await adapter.remove(DbSubcollection.BodyActivities, id);
      if (!isOk(result)) {
        addToast(BodyMsg.ActivityDeleteFailed, ToastType.Error);
        return;
      }

      // Recompute daily summary — manually exclude deleted activity since snapshot may not have fired yet
      const key = target.date;
      const base = recordsRef.current[key] ?? emptyRecord(key);
      const remaining = activitiesRef.current.filter((a) => a.id !== id);
      const recomputed = recomputeSummary(base, remaining);
      const summaryResult = await adapter.save(DbSubcollection.Body, { ...recomputed, id: key });
      if (!isOk(summaryResult)) {
        addToast(summaryResult.error, ToastType.Error);
      }
    },
    [addToast, readOnly],
  );

  /** Deletes a floor record (entire day) by date key */
  const deleteRecord = useCallback(
    async (dateKey: string) => {
      if (readOnly) return;
      const adapter = adapterRef.current;
      if (!adapter) return;

      const result = await adapter.remove(DbSubcollection.Body, dateKey);
      if (!isOk(result)) {
        addToast(BodyMsg.RecordDeleteFailed, ToastType.Error);
      }
    },
    [addToast, readOnly],
  );

  return {
    records,
    todayRecord,
    activities,
    todayActivities,
    tap,
    logActivity,
    saveRecord,
    updateActivity,
    deleteActivity,
    deleteRecord,
  };
}

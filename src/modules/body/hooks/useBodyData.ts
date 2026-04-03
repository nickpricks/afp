import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from '@/shared/auth/useAuth';
import { useToast } from '@/shared/errors/useToast';
import { createAdapter } from '@/shared/storage/create-adapter';
import type { StorageAdapter } from '@/shared/storage/adapter';
import type { BodyRecord } from '@/modules/body/types';
import { computeBodyScore } from '@/modules/body/scoring';
import { todayStr } from '@/shared/utils/date';
import { SyncStatus, isOk } from '@/shared/types';
import { DbSubcollection, userPath } from '@/constants/db';

/** Creates a zero-valued BodyRecord for the given date */
function emptyRecord(dateStr: string): BodyRecord {
  return { id: dateStr, dateStr, floors: { up: 0, down: 0 }, steps: null, running: null, exercise: null, total: 0 };
}

/** Provides body tracking state, real-time sync, and tap actions */
export function useBodyData() {
  const { firebaseUser, setSyncStatus } = useAuth();
  const { addToast } = useToast();
  const [records, setRecords] = useState<Record<string, BodyRecord>>({});
  const adapterRef = useRef<StorageAdapter | null>(null);

  useEffect(() => {
    if (!firebaseUser) return;

    const adapter = createAdapter(userPath(firebaseUser.uid));
    adapterRef.current = adapter;
    setSyncStatus(SyncStatus.Syncing);

    const unsubscribe = adapter.onSnapshot<BodyRecord>(
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

    return () => {
      unsubscribe();
      adapterRef.current = null;
    };
  }, [firebaseUser, setSyncStatus]);

  const todayRecord = useMemo<BodyRecord>(() => {
    const key = todayStr();
    return records[key] ?? emptyRecord(key);
  }, [records]);

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
      updated.total = computeBodyScore(updated.floors.up, updated.floors.down);

      setRecords((prev) => ({ ...prev, [key]: updated }));

      const result = await adapter.save(DbSubcollection.Body, { ...updated, id: key });
      if (!isOk(result)) {
        addToast(result.error, 'error');
        setRecords((prev) => ({ ...prev, [key]: current }));
      }
    },
    [records, addToast],
  );

  return { records, todayRecord, tap };
}

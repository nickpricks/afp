import { useEffect, useMemo, useState } from 'react';
import { useChildren } from '@/modules/baby/hooks/useChildren';
import { useAuth } from '@/shared/auth/useAuth';
import { createAdapter } from '@/shared/storage/create-adapter';
import { childPath, DbSubcollection } from '@/constants/db';
import type { FinanceEntry } from '@/modules/baby/types';

export type KidsFinanceEntry = FinanceEntry & {
  childId: string;
  childName: string;
};

/** Aggregates financial entries across all children. Optional targetUid for viewer mode. */
export function useAllKidsFinances(targetUid?: string) {
  const { children, loading: kidsLoading } = useChildren(targetUid);
  const { firebaseUser } = useAuth();
  const ownerUid = targetUid ?? firebaseUser?.uid ?? null;

  const [entries, setEntries] = useState<KidsFinanceEntry[]>([]);
  // readyIds tracks which child listeners have fired at least once.
  const [readyIds, setReadyIds] = useState<ReadonlySet<string>>(new Set());

  const childrenKey = useMemo(() => children.map((c) => c.id).join(','), [children]);

  // Derive loading from observable state — no setState in effect body needed.
  // - Still waiting on children list: loading
  // - No uid yet: loading
  // - No children: not loading (nothing to wait for)
  // - Some children: loading until every child id has at least one snapshot
  const loading = useMemo(() => {
    if (kidsLoading || !ownerUid) return true;
    if (children.length === 0) return false;
    const childIds = children.map((c) => c.id!);
    return !childIds.every((id) => readyIds.has(id));
  }, [kidsLoading, ownerUid, children, readyIds]);

  useEffect(() => {
    if (kidsLoading || !ownerUid || children.length === 0) return;

    // Reset ready state for this listener batch.
    setReadyIds(new Set());

    const unsubscribes: Array<() => void> = [];
    const allEntriesMap: Record<string, KidsFinanceEntry[]> = {};

    children.forEach((child) => {
      const childId = child.id!;
      const adapter = createAdapter(childPath(ownerUid, childId));

      const unsub = adapter.onSnapshot<FinanceEntry>(
        DbSubcollection.Finances,
        (data) => {
          allEntriesMap[childId] = data.map((e) => ({
            ...e,
            childId,
            childName: child.name,
          }));

          setEntries(Object.values(allEntriesMap).flat());
          setReadyIds((prev) => new Set([...prev, childId]));
        },
        (error) => {
          console.error(`[AFP] Error fetching finances for child ${childId}:`, error);
        },
      );
      unsubscribes.push(unsub);
    });

    return () => unsubscribes.forEach((unsub) => unsub());
    // childrenKey ensures the effect re-runs when the children array reference changes
    // without causing re-runs on every render. eslint-disable-next-line is intentional.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childrenKey, kidsLoading, ownerUid]);

  return { entries, loading };
}

import { useEffect, useState } from 'react';
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (kidsLoading || !ownerUid) return;

    if (children.length === 0) {
      setEntries([]);
      setLoading(false);
      return;
    }

    const unsubscribes: Array<() => void> = [];
    const allEntriesMap: Record<string, KidsFinanceEntry[]> = {};
    const readyMap: Record<string, true> = {};

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
          readyMap[childId] = true;

          setEntries(Object.values(allEntriesMap).flat());
          if (Object.keys(readyMap).length === children.length) {
            setLoading(false);
          }
        },
        (error) => {
          console.error(`[AFP] Error fetching finances for child ${childId}:`, error);
        },
      );
      unsubscribes.push(unsub);
    });

    return () => unsubscribes.forEach((unsub) => unsub());
  }, [children, kidsLoading, ownerUid]);

  return { entries, loading };
}

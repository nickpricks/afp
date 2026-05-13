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

/** Aggregates financial entries across all children */
export function useAllKidsFinances() {
  const { children, loading: kidsLoading } = useChildren();
  const { firebaseUser } = useAuth();
  const [entries, setEntries] = useState<KidsFinanceEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (kidsLoading || !firebaseUser) return;

    const unsubscribes: (() => void)[] = [];
    const allEntriesMap: Record<string, KidsFinanceEntry[]> = {};

    children.forEach((child) => {
      const childId = child.id!;
      const adapter = createAdapter(childPath(firebaseUser.uid, childId));
      
      const unsub = adapter.onSnapshot<FinanceEntry>(
        DbSubcollection.Finances,
        (data) => {
          allEntriesMap[childId] = data.map(e => ({
            ...e,
            childId,
            childName: child.name,
          }));
          
          // Merge all entries
          const merged = Object.values(allEntriesMap).flat();
          setEntries(merged);
          setLoading(false);
        },
        (error) => {
          console.error(`[AFP] Error fetching finances for child ${childId}:`, error);
        }
      );
      unsubscribes.push(unsub);
    });

    if (children.length === 0) {
      setLoading(false);
    }

    return () => unsubscribes.forEach(unsub => unsub());
  }, [children, kidsLoading, firebaseUser]);

  return { entries, loading };
}

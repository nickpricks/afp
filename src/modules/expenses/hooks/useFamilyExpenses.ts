import { useEffect, useState } from 'react';

import { useFamily } from '@/shared/hooks/useFamily';
import { createAdapter } from '@/shared/storage/create-adapter';
import { DbDoc, DbSubcollection, userPath } from '@/constants/db';
import { isOk } from '@/shared/types';
import type { UserProfile } from '@/shared/types';
import type { Expense } from '@/modules/expenses/types';
import type { MemberExpenses } from '@/modules/expenses/budget-math';

/** A family ledger row — an expense tagged with its owner (the owner IS the payer) */
export interface FamilyExpenseRow {
  expense: Expense;
  ownerUid: string;
  ownerName: string;
}

/**
 * Read-only fan-out over every family member's expenses: one per-member adapter
 * from the family members map (NO collectionGroup — Firebase boundary stays in
 * `src/shared/storage/`). Exposes no mutators by construction; `ready` reports
 * only when the family doc AND every member listener have resolved.
 */
export function useFamilyExpenses(familyId: string | null | undefined): {
  rows: FamilyExpenseRow[];
  members: MemberExpenses[];
  ready: boolean;
} {
  const { memberUids, ready: familyReady } = useFamily(familyId);
  const [byMember, setByMember] = useState<Record<string, Expense[]>>({});
  const [names, setNames] = useState<Record<string, string>>({});
  const [reported, setReported] = useState<Set<string>>(new Set());
  // Stable key so the effect re-runs only when membership actually changes
  const memberKey = memberUids.join(',');

  useEffect(() => {
    const uids = memberKey ? memberKey.split(',') : [];
    if (uids.length === 0) return;

    /** Marks a member listener as having reported (success or error) */
    const markReported = (uid: string) => {
      setReported((prev) => (prev.has(uid) ? prev : new Set(prev).add(uid)));
    };

    const unsubs = uids.map((uid) => {
      const adapter = createAdapter(userPath(uid));
      void adapter.getById<UserProfile>(DbSubcollection.Profile, DbDoc.Main).then((result) => {
        setNames((prev) => ({ ...prev, [uid]: isOk(result) ? result.data.name : uid }));
      });
      return adapter.onSnapshot<Expense>(
        DbSubcollection.Expenses,
        (data) => {
          setByMember((prev) => ({ ...prev, [uid]: data.filter((e) => !e.isDeleted) }));
          markReported(uid);
        },
        () => markReported(uid),
      );
    });
    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [memberKey]);

  const members: MemberExpenses[] = memberUids.map((uid) => ({
    uid,
    name: names[uid] ?? uid,
    expenses: byMember[uid] ?? [],
  }));
  const rows: FamilyExpenseRow[] = members.flatMap((m) =>
    m.expenses.map((expense) => ({ expense, ownerUid: m.uid, ownerName: m.name })),
  );
  const ready = familyReady && memberUids.every((uid) => reported.has(uid));
  return { rows, members, ready };
}

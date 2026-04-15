import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';

import { db } from '@/shared/auth/firebase-config';
import { ok, err, type Result } from '@/shared/types';
import { DbCollection, DbSubcollection } from '@/constants/db';

import { EliminationMode, type DiaperEntry, type EliminationEntry } from '../types';

/** Pure transform — DiaperEntry → EliminationEntry with mode=Diaper */
export function transformDiaperToElimination(diaper: DiaperEntry): EliminationEntry {
  return {
    id: diaper.id,
    date: diaper.date,
    time: diaper.time,
    mode: EliminationMode.Diaper,
    diaperType: diaper.type,
    timestamp: diaper.timestamp,
    createdAt: diaper.createdAt,
    notes: diaper.notes,
  };
}

/** One-time backfill — copies `diapers/*` under a child into `elimination/*` (non-destructive; old entries preserved) */
export async function migrateChildDiapersToElimination(
  uid: string,
  childId: string,
): Promise<Result<{ migrated: number }>> {
  try {
    const diapersRef = collection(
      db,
      `${DbCollection.Users}/${uid}/${DbSubcollection.Children}/${childId}/${DbSubcollection.Diapers}`,
    );
    const snap = await getDocs(diapersRef);
    if (snap.empty) return ok({ migrated: 0 });

    const batch = writeBatch(db);
    let count = 0;
    snap.forEach((d) => {
      const diaper = { id: d.id, ...d.data() } as DiaperEntry;
      const eliminationEntry = transformDiaperToElimination(diaper);
      const targetRef = doc(
        db,
        `${DbCollection.Users}/${uid}/${DbSubcollection.Children}/${childId}/${DbSubcollection.Elimination}/${d.id}`,
      );
      batch.set(targetRef, eliminationEntry);
      count += 1;
    });
    await batch.commit();
    return ok({ migrated: count });
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}

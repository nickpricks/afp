import { useEffect, useState } from 'react';
import { collectionGroup, onSnapshot as firestoreOnSnapshot, query } from 'firebase/firestore';

import { db, isFirebaseConfigured } from '@/shared/auth/firebase-config';
import { DbSubcollection } from '@/constants/db';
import type { UserProfile } from '@/shared/types';

/** User profile entry with uid */
export type UserEntry = UserProfile & { uid: string };

/**
 * Extracts the user UID from a profile document's path.
 * Profile docs live at `users/{uid}/profile/main` — the uid is the second segment.
 */
function extractUid(docPath: string): string {
  const segments = docPath.split('/');
  if (segments.length < 4 || !segments[1]) {
    console.warn('[AFP] extractUid: unexpected path shape:', docPath);
    return '';
  }
  return segments[1];
}

/** Lists all profiled users — admin only. Enabled by default but can be disabled to avoid unnecessary listeners. */
export function useAllUsers(enabled = true) {
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [loading, setLoading] = useState(isFirebaseConfigured && enabled);

  useEffect(() => {
    if (!isFirebaseConfigured || !enabled) {
      return;
    }

    const q = query(collectionGroup(db, DbSubcollection.Profile));

    const unsubscribe = firestoreOnSnapshot(
      q,
      (snapshot) => {
        const profiles: UserEntry[] = snapshot.docs
          .filter((d) => d.data()['role'] != null)
          .map(
            (d) =>
              ({
                ...d.data(),
                uid: extractUid(d.ref.path),
              }) as unknown as UserEntry,
          )
          .filter((u) => u.uid !== '');
        setUsers(profiles);
        setLoading(false);
      },
      (error) => {
        console.error('[AFP] useAllUsers snapshot error:', error);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [enabled]);

  return { users, loading };
}

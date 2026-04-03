import { useEffect, useState } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';

import type { InviteRecord } from '@/shared/auth/invite';
import { db, isFirebaseConfigured } from '@/shared/auth/firebase-config';
import { CONFIG } from '@/constants/config';
import { DbCollection } from '@/constants/db';

/** Reads dev invites from localStorage for the initial state */
function readDevInvites(): InviteRecord[] {
  try {
    const raw = localStorage.getItem(CONFIG.DEV_INVITES_KEY);
    return raw ? (JSON.parse(raw) as InviteRecord[]) : [];
  } catch (e) {
    console.warn('[AFP] Corrupt dev invites data:', e);
    return [];
  }
}

/** Subscribes to the invites collection and returns all invite records in real-time */
export function useAdmin() {
  const [invites, setInvites] = useState<InviteRecord[]>(
    isFirebaseConfigured ? [] : readDevInvites,
  );

  useEffect(() => {
    if (!isFirebaseConfigured) return;

    const q = query(collection(db, DbCollection.Invites));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setInvites(snapshot.docs.map((d) => d.data() as InviteRecord));
      },
      (error) => {
        console.error('[AFP] Invites listener error:', error);
      },
    );

    return unsubscribe;
  }, []);

  return { invites };
}

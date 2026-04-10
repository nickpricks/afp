import { doc, getDoc, runTransaction } from 'firebase/firestore';

import { db, isFirebaseConfigured } from '@/shared/auth/firebase-config';
import { DbCollection } from '@/constants/db';
import { err, ok, type Result } from '@/shared/types';
import { toErrorMessage } from '@/shared/utils/error';

/** Regex for valid usernames: 3-20 chars, alphanumeric + underscore */
export const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

/** Validates that a username meets format requirements */
export const isValidUsername = (username: string): boolean => {
  return USERNAME_RE.test(username);
};

/** Checks whether a username is available (not yet claimed) */
export const isUsernameAvailable = async (username: string): Promise<boolean> => {
  const lower = username.toLowerCase();

  if (!isFirebaseConfigured) {
    const stored = localStorage.getItem(`afp:usernames:${lower}`);
    return stored === null;
  }

  const ref = doc(db, DbCollection.Usernames, lower);
  const snap = await getDoc(ref);
  return !snap.exists();
};

/** Claims a username for a user — uses a transaction for atomicity */
export const claimUsername = async (username: string, uid: string): Promise<Result<void>> => {
  const lower = username.toLowerCase();

  if (!isFirebaseConfigured) {
    const stored = localStorage.getItem(`afp:usernames:${lower}`);
    if (stored !== null) {
      const parsed = JSON.parse(stored) as { uid: string };
      if (parsed.uid !== uid) {
        return err('Username is already taken');
      }
    }
    localStorage.setItem(
      `afp:usernames:${lower}`,
      JSON.stringify({ uid, createdAt: new Date().toISOString() }),
    );
    return ok(undefined);
  }

  try {
    const ref = doc(db, DbCollection.Usernames, lower);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (snap.exists()) {
        const data = snap.data() as { uid: string };
        if (data.uid !== uid) {
          throw new Error('Username is already taken');
        }
        return;
      }
      tx.set(ref, { uid, createdAt: new Date().toISOString() });
    });
    return ok(undefined);
  } catch (e: unknown) {
    return err(toErrorMessage(e));
  }
};

/** Releases a username if it belongs to the given user */
export const releaseUsername = async (username: string, uid: string): Promise<Result<void>> => {
  const lower = username.toLowerCase();

  if (!isFirebaseConfigured) {
    const stored = localStorage.getItem(`afp:usernames:${lower}`);
    if (stored !== null) {
      const parsed = JSON.parse(stored) as { uid: string };
      if (parsed.uid === uid) {
        localStorage.removeItem(`afp:usernames:${lower}`);
      }
    }
    return ok(undefined);
  }

  try {
    const ref = doc(db, DbCollection.Usernames, lower);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (snap.exists()) {
        const data = snap.data() as { uid: string };
        if (data.uid === uid) {
          tx.delete(ref);
        }
      }
    });
    return ok(undefined);
  } catch (e: unknown) {
    return err(toErrorMessage(e));
  }
};

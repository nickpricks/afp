import {
  createContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInAnonymously,
  signInWithCredential,
  type User,
} from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

import { ModuleId, SyncStatus, UserRole, type UserProfile } from '@/shared/types';
import { auth, db, isFirebaseConfigured } from '@/shared/auth/firebase-config';
import { DbCollection, DbSubcollection, DbDoc, DbField } from '@/constants/db';
import { createDefaultProfile } from '@/shared/utils/profile';

export interface AuthContextValue {
  firebaseUser: User | null;
  profile: UserProfile | null;
  isTheAdminNick: boolean;
  isLoading: boolean;
  syncStatus: SyncStatus;
  setSyncStatus: (status: SyncStatus) => void;
  adminUid: string | null;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

/** Dev-mode profile with all modules enabled */
const DEV_PROFILE: UserProfile = createDefaultProfile('Dev User', UserRole.TheAdminNick, {
  [ModuleId.Body]: true,
  [ModuleId.Budget]: true,
  [ModuleId.Baby]: true,
});

/** Provides Firebase auth state and user profile — bypasses auth in dev when Firebase isn't configured */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(
    isFirebaseConfigured ? null : ({ uid: 'dev-user' } as User),
  );
  const [profile, setProfile] = useState<UserProfile | null>(
    isFirebaseConfigured ? null : DEV_PROFILE,
  );
  const [isLoading, setIsLoading] = useState(isFirebaseConfigured);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(SyncStatus.Offline);
  const [adminUid, setAdminUid] = useState<string | null>(
    !isFirebaseConfigured ? 'dev-user' : null,
  );

  useEffect(() => {
    if (!isFirebaseConfigured) {
      return;
    }
    const configRef = doc(db, DbCollection.App, DbDoc.Config);
    const unsubscribe = onSnapshot(configRef, (snap) => {
      if (snap.exists()) {
        setAdminUid((snap.data()[DbField.AdminUid] as string | undefined) ?? null);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      console.info('[AFP] Dev mode — Firebase not configured, using local dev profile');
      return;
    }

    // Handle redirect result (mobile fallback from signInWithRedirect/linkWithRedirect)
    getRedirectResult(auth).catch(async (error) => {
      if (error?.code === 'auth/credential-already-in-use') {
        const credential = GoogleAuthProvider.credentialFromError(error);
        if (credential) {
          await signInWithCredential(auth, credential);
        }
      }
    });

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setFirebaseUser(user);
        setIsLoading(false);
        return;
      }

      signInAnonymously(auth).catch((error) => {
        console.error('[AFP] Anonymous auth failed:', error);
        setSyncStatus(SyncStatus.Error);
        setIsLoading(false);
      });
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured || !firebaseUser) {
      return;
    }

    const profileRef = doc(db, DbCollection.Users, firebaseUser.uid, DbSubcollection.Profile, DbDoc.Main);

    const unsubscribe = onSnapshot(
      profileRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setProfile(snapshot.data() as UserProfile);
          setSyncStatus(SyncStatus.Synced);
        } else {
          setProfile(createDefaultProfile('', UserRole.User));
          setSyncStatus(SyncStatus.Synced);
        }
      },
      (error) => {
        console.error('[AFP] Profile listener error:', error);
        setSyncStatus(SyncStatus.Error);
      },
    );

    return unsubscribe;
  }, [firebaseUser]);

  const isTheAdminNick = profile?.role === UserRole.TheAdminNick;

  return (
    <AuthContext value={
{
      firebaseUser,
      profile,
      isTheAdminNick,
      isLoading,
      syncStatus,
      setSyncStatus,
      adminUid,
    }
}>
      {children}
    </AuthContext>
  );
}

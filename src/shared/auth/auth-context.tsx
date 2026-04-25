import { createContext, useEffect, useState, type ReactNode } from 'react';
import {
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInAnonymously,
  signInWithCredential,
  type User,
} from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

import { ModuleId, SyncStatus, UserRole, DEFAULT_MODULES, type UserProfile } from '@/shared/types';
import { auth, db, isFirebaseConfigured } from '@/shared/auth/firebase-config';
import { DbCollection, DbSubcollection, DbDoc, DbField } from '@/constants/db';
import { createDefaultProfile } from '@/shared/utils/profile';
import { createLocalStorageAdapter } from '@/shared/storage/localStorage-adapter';

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
    if (!firebaseUser) return;

    if (isFirebaseConfigured) {
      const profileRef = doc(
        db,
        DbCollection.Users,
        firebaseUser.uid,
        DbSubcollection.Profile,
        DbDoc.Main,
      );

      return onSnapshot(
        profileRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data() as UserProfile;
            setProfile({
              ...data,
              modules: data.modules || DEFAULT_MODULES,
            });
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
    } else {
      // In Dev Mode, sync profile from localStorage
      const adapter = createLocalStorageAdapter(`users/${firebaseUser.uid}`);
      return adapter.onSnapshot<UserProfile & { id: string }>(
        DbSubcollection.Profile,
        (data) => {
          const mainDoc = data.find((d) => d.id === DbDoc.Main);
          if (mainDoc) {
            // Ensure modules exist even in older local data
            setProfile({
              ...mainDoc,
              modules: mainDoc.modules || DEFAULT_MODULES,
            });
          } else {
            // Initialize local profile if missing
            const defaultProfile = createDefaultProfile('Dev User', UserRole.TheAdminNick);
            setProfile(defaultProfile);
            adapter.save(DbSubcollection.Profile, { ...defaultProfile, id: DbDoc.Main });
          }
          setSyncStatus(SyncStatus.Synced);
        },
        (error) => {
          console.error('[AFP] Local profile sync error:', error);
          setSyncStatus(SyncStatus.Error);
        },
      );
    }
  }, [firebaseUser]);

  const isTheAdminNick = profile?.role === UserRole.TheAdminNick;

  return (
    <AuthContext
      value={{
        firebaseUser,
        profile,
        isTheAdminNick,
        isLoading,
        syncStatus,
        setSyncStatus,
        adminUid,
      }}
    >
      {children}
    </AuthContext>
  );
}

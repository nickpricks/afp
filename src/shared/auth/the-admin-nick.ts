import { doc, getDoc, updateDoc, runTransaction } from 'firebase/firestore';

import { db } from '@/shared/auth/firebase-config';
import { DbCollection, DbSubcollection, DbDoc, DbField } from '@/constants/db';
import { ModuleId, UserRole, type ModuleConfig } from '@/shared/types';
import { err, ok, type Result } from '@/shared/types';
import { toErrorMessage } from '@/shared/utils/error';
import { createDefaultProfile } from '@/shared/utils/profile';
import { vlog, verr } from '@/shared/utils/verbose';

/** Checks whether app/config exists (i.e., admin has been claimed) */
export async function isAppClaimed(): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, DbCollection.App, DbDoc.Config));
    const claimed = snap.exists();
    vlog('[AFP:admin] isAppClaimed:', claimed);
    return claimed;
  } catch (e) {
    verr('[AFP:admin] isAppClaimed error:', e);
    return false;
  }
}

/** Checks whether the given UID matches the admin UID in app/config */
export async function isCurrentUserAdmin(uid: string): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, DbCollection.App, DbDoc.Config));
    if (!snap.exists()) return false;
    const isAdmin = snap.data()[DbField.AdminUid] === uid;
    vlog('[AFP:admin] isCurrentUserAdmin:', { uid, isAdmin });
    return isAdmin;
  } catch (e) {
    verr('[AFP:admin] isCurrentUserAdmin error:', e);
    return false;
  }
}

/** Sets up the app/config doc and creates the admin user profile atomically */
export async function initializeAdmin(
  uid: string,
  name: string,
): Promise<Result<void>> {
  vlog('[AFP:admin] initializeAdmin start', { uid, name });
  try {
    const configRef = doc(db, DbCollection.App, DbDoc.Config);
    const profileRef = doc(db, DbCollection.Users, uid, DbSubcollection.Profile, DbDoc.Main);

    const allEnabled: ModuleConfig = {
      [ModuleId.Body]: true,
      [ModuleId.Budget]: true,
      [ModuleId.Baby]: true,
    };
    const profile = createDefaultProfile(name, UserRole.TheAdminNick, allEnabled);
    vlog('[AFP:admin] Writing app/config + profile in transaction');

    await runTransaction(db, async (tx) => {
      const snap = await tx.get(configRef);
      if (snap.exists()) {
        throw new Error('Admin already claimed');
      }
      tx.set(configRef, { [DbField.AdminUid]: uid });
      tx.set(profileRef, profile);
    });

    vlog('[AFP:admin] initializeAdmin success');
    return ok(undefined);
  } catch (e) {
    verr('[AFP:admin] initializeAdmin failed:', e);
    return err(`Failed to initialize admin: ${toErrorMessage(e)}`);
  }
}

/** Updates the module configuration for a user's profile */
export async function updateUserModules(
  uid: string,
  modules: ModuleConfig,
): Promise<Result<void>> {
  vlog('[AFP:admin] updateUserModules', { uid, modules });
  try {
    await updateDoc(doc(db, DbCollection.Users, uid, DbSubcollection.Profile, DbDoc.Main), { [DbField.Modules]: modules });
    vlog('[AFP:admin] updateUserModules success');
    return ok(undefined);
  } catch (e) {
    verr('[AFP:admin] updateUserModules failed:', e);
    return err(`Failed to update modules: ${toErrorMessage(e)}`);
  }
}

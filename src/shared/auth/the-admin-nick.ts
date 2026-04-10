import { doc, getDoc, updateDoc, runTransaction } from 'firebase/firestore';

import { db } from '@/shared/auth/firebase-config';
import { DbCollection, DbSubcollection, DbDoc, DbField } from '@/constants/db';
import { ModuleId, UserRole, type ModuleConfig } from '@/shared/types';
import { err, ok, type Result } from '@/shared/types';
import { toErrorMessage } from '@/shared/utils/error';
import { createDefaultProfile } from '@/shared/utils/profile';

/** Checks whether app/config exists (i.e., admin has been claimed) */
export async function isAppClaimed(): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, DbCollection.App, DbDoc.Config));
    return snap.exists();
  } catch {
    return false;
  }
}

/** Checks whether the given UID matches the admin UID in app/config */
export async function isCurrentUserAdmin(uid: string): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, DbCollection.App, DbDoc.Config));
    if (!snap.exists()) return false;
    return snap.data()[DbField.AdminUid] === uid;
  } catch {
    return false;
  }
}

/** Sets up the app/config doc and creates the admin user profile atomically */
export async function initializeAdmin(
  uid: string,
  name: string,
): Promise<Result<void>> {
  try {
    const configRef = doc(db, DbCollection.App, DbDoc.Config);
    const profileRef = doc(db, DbCollection.Users, uid, DbSubcollection.Profile, DbDoc.Main);

    const allEnabled: ModuleConfig = {
      [ModuleId.Body]: true,
      [ModuleId.Budget]: true,
      [ModuleId.Baby]: true,
    };
    const profile = createDefaultProfile(name, UserRole.TheAdminNick, allEnabled);

    await runTransaction(db, async (tx) => {
      const snap = await tx.get(configRef);
      if (snap.exists()) {
        throw new Error('Admin already claimed');
      }
      tx.set(configRef, { [DbField.AdminUid]: uid });
      tx.set(profileRef, profile);
    });

    return ok(undefined);
  } catch (e) {
    return err(`Failed to initialize admin: ${toErrorMessage(e)}`);
  }
}

/** Updates the module configuration for a user's profile */
export async function updateUserModules(
  uid: string,
  modules: ModuleConfig,
): Promise<Result<void>> {
  try {
    await updateDoc(doc(db, DbCollection.Users, uid, DbSubcollection.Profile, DbDoc.Main), { [DbField.Modules]: modules });
    return ok(undefined);
  } catch (e) {
    return err(`Failed to update modules: ${toErrorMessage(e)}`);
  }
}

import { useCallback } from 'react';
import { doc, updateDoc } from 'firebase/firestore';

import { db, isFirebaseConfigured } from '@/shared/auth/firebase-config';
import { useToast } from '@/shared/errors/useToast';
import { DbCollection, DbSubcollection, DbDoc } from '@/constants/db';
import { AdminMsg } from '@/constants/messages';
import {
  isOk,
  ok,
  err,
  ToastType,
  type Result,
  type ModuleConfig,
  type UserRole,
} from '@/shared/types';
import { toErrorMessage } from '@/shared/utils/error';

/** Updates a user's profile field in Firestore or localStorage */
async function updateProfileField(
  uid: string,
  field: string,
  value: unknown,
): Promise<Result<void>> {
  if (!isFirebaseConfigured) {
    try {
      const key = `afp:${uid}:profile`;
      const raw = localStorage.getItem(key);
      const profile = raw ? JSON.parse(raw) : {};
      profile[field] = value;
      profile.updatedAt = new Date().toISOString();
      localStorage.setItem(key, JSON.stringify(profile));
      return ok(undefined);
    } catch (e) {
      return err(`Failed to update profile (dev): ${toErrorMessage(e)}`);
    }
  }

  try {
    const profileRef = doc(db, DbCollection.Users, uid, DbSubcollection.Profile, DbDoc.Main);
    await updateDoc(profileRef, { [field]: value, updatedAt: new Date().toISOString() });
    return ok(undefined);
  } catch (e) {
    return err(`Failed to update profile: ${toErrorMessage(e)}`);
  }
}

/** Admin actions for managing user profiles */
export function useAdminActions() {
  const { addToast } = useToast();

  /** Updates a user's enabled modules */
  const updateUserModules = useCallback(
    async (uid: string, modules: ModuleConfig) => {
      const result = await updateProfileField(uid, 'modules', modules);
      if (isOk(result)) {
        addToast(AdminMsg.ModulesUpdated, ToastType.Success);
      } else {
        addToast(AdminMsg.ModulesUpdateFailed, ToastType.Error);
      }
      return result;
    },
    [addToast],
  );

  /** Updates a user's role */
  const updateUserRole = useCallback(
    async (uid: string, role: UserRole) => {
      const result = await updateProfileField(uid, 'role', role);
      if (isOk(result)) {
        addToast(AdminMsg.RoleUpdated, ToastType.Success);
      } else {
        addToast(AdminMsg.RoleUpdateFailed, ToastType.Error);
      }
      return result;
    },
    [addToast],
  );

  return { updateUserModules, updateUserRole };
}

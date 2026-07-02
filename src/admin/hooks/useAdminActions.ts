import { useCallback } from 'react';
import { doc, updateDoc } from 'firebase/firestore';

import { db, isFirebaseConfigured } from '@/shared/auth/firebase-config';
import { useAuth } from '@/shared/auth/useAuth';
import { createAdapter } from '@/shared/storage/create-adapter';
import { useToast } from '@/shared/errors/useToast';
import { DbCollection, DbSubcollection, DbDoc, ROOT_PATH } from '@/constants/db';
import { AdminMsg, FamilyMsg } from '@/constants/messages';
import {
  isOk,
  ok,
  err,
  FamilyRole,
  ToastType,
  type Family,
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
  const { firebaseUser } = useAuth();

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

  /**
   * Creates a `families/{id}` doc (first member = Owner, rest = Adults) and stamps
   * `familyId` on every member profile. Data hook contract: `Promise<boolean>`, owns its toasts.
   */
  const createFamily = useCallback(
    async (name: string, memberUids: string[]): Promise<boolean> => {
      if (!name.trim()) {
        addToast(FamilyMsg.NameRequired, ToastType.Error);
        return false;
      }
      if (memberUids.length === 0) {
        addToast(FamilyMsg.MembersRequired, ToastType.Error);
        return false;
      }
      const members: Record<string, FamilyRole> = {};
      memberUids.forEach((uid, i) => {
        members[uid] = i === 0 ? FamilyRole.Owner : FamilyRole.Adult;
      });
      const family: Family = {
        id: crypto.randomUUID(),
        name: name.trim(),
        createdBy: firebaseUser?.uid ?? '',
        createdAt: new Date().toISOString(),
        members,
      };
      const saved = await createAdapter(ROOT_PATH).save(DbCollection.Families, { ...family });
      if (!isOk(saved)) {
        addToast(FamilyMsg.CreateFailed, ToastType.Error);
        return false;
      }
      const stamps = await Promise.all(
        memberUids.map((uid) => updateProfileField(uid, 'familyId', family.id)),
      );
      const allOk = stamps.every(isOk);
      addToast(
        allOk ? FamilyMsg.Created : FamilyMsg.CreateFailed,
        allOk ? ToastType.Success : ToastType.Error,
      );
      return allOk;
    },
    [addToast, firebaseUser],
  );

  /**
   * Unlinks a member: writes a `null` tombstone into the family members map (the adapter
   * merge-saves, so map keys can't be deleted) and clears the member's profile `familyId`.
   */
  const unlinkFamilyMember = useCallback(
    async (family: Family, uid: string): Promise<boolean> => {
      const saved = await createAdapter(ROOT_PATH).save(DbCollection.Families, {
        id: family.id,
        members: { ...family.members, [uid]: null },
      });
      if (!isOk(saved)) {
        addToast(FamilyMsg.UnlinkFailed, ToastType.Error);
        return false;
      }
      const cleared = await updateProfileField(uid, 'familyId', null);
      addToast(
        isOk(cleared) ? FamilyMsg.MemberUnlinked : FamilyMsg.UnlinkFailed,
        isOk(cleared) ? ToastType.Success : ToastType.Error,
      );
      return isOk(cleared);
    },
    [addToast],
  );

  return { updateUserModules, updateUserRole, createFamily, unlinkFamilyMember };
}

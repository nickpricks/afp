import { doc, runTransaction, setDoc } from 'firebase/firestore';

import { db, isFirebaseConfigured } from '@/shared/auth/firebase-config';
import { DbCollection, DbSubcollection, DbDoc, DbField } from '@/constants/db';
import { UserRole, type ModuleConfig } from '@/shared/types';
import { err, ok, type Result } from '@/shared/types';
import { toErrorMessage } from '@/shared/utils/error';
import { createDefaultProfile } from '@/shared/utils/profile';
import { CONFIG } from '@/constants/config';
import { InviteMsg } from '@/constants/messages';
import { INVITE_CODE_RE } from '@/shared/utils/regex';

export interface InviteRecord {
  code: string;
  name: string;
  modules: ModuleConfig;
  createdBy: string;
  linkedUid: string | null;
  createdAt: string;
  usedAt: string | null;
}

/** Generates a lowercase alphanumeric invite code using crypto.getRandomValues */
export function generateInviteCode(): string {
  const values = crypto.getRandomValues(new Uint8Array(CONFIG.INVITE_CODE_LENGTH));
  return Array.from(values, (v) => CONFIG.INVITE_CODE_CHARSET[v % CONFIG.INVITE_CODE_CHARSET.length]).join('');
}

/** Validates that a string matches the expected invite code format */
export function isValidInviteCode(code: string): boolean {
  return INVITE_CODE_RE.test(code);
}

/** Creates an invite record — persists to Firestore in production, localStorage in dev */
export async function createInvite(
  code: string,
  name: string,
  modules: ModuleConfig,
  createdByUid: string,
): Promise<Result<InviteRecord>> {
  const record: InviteRecord = {
    code,
    name,
    modules,
    createdBy: createdByUid,
    linkedUid: null,
    createdAt: new Date().toISOString(),
    usedAt: null,
  };

  if (!isFirebaseConfigured) {
    try {
      const stored = JSON.parse(localStorage.getItem(CONFIG.DEV_INVITES_KEY) ?? '[]') as InviteRecord[];
      stored.push(record);
      localStorage.setItem(CONFIG.DEV_INVITES_KEY, JSON.stringify(stored));
      return ok(record);
    } catch (e) {
      return err(`Failed to create invite (dev): ${toErrorMessage(e)}`);
    }
  }

  try {
    await setDoc(doc(db, DbCollection.Invites, code), record);
    return ok(record);
  } catch (e) {
    return err(`Failed to create invite: ${toErrorMessage(e)}`);
  }
}

/** Redeems an invite code atomically — links UID and creates user profile in one transaction */
export async function redeemInvite(
  code: string,
  uid: string,
): Promise<Result<InviteRecord>> {
  if (!isFirebaseConfigured) {
    return err(InviteMsg.DevModeUnsupported);
  }

  try {
    const inviteRef = doc(db, DbCollection.Invites, code);
    const profileRef = doc(db, DbCollection.Users, uid, DbSubcollection.Profile, DbDoc.Main);

    const updatedRecord = await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(inviteRef);

      if (!snap.exists()) {
        throw new Error(InviteMsg.NotFound);
      }

      const record = snap.data() as InviteRecord;

      if (record.linkedUid !== null) {
        throw new Error(InviteMsg.AlreadyUsed);
      }

      const now = new Date().toISOString();
      const updated: InviteRecord = { ...record, linkedUid: uid, usedAt: now };

      transaction.update(inviteRef, { [DbField.LinkedUid]: uid, [DbField.UsedAt]: now });
      transaction.set(profileRef, createDefaultProfile(record.name, UserRole.User, record.modules));

      return updated;
    });

    return ok(updatedRecord);
  } catch (e) {
    return err(`Failed to redeem invite: ${toErrorMessage(e)}`);
  }
}

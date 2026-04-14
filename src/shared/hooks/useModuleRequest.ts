import { useCallback } from 'react';

import { useAuth } from '@/shared/auth/useAuth';
import { useToast } from '@/shared/errors/useToast';
import { createAdapter } from '@/shared/storage/create-adapter';
import { userPath, DbSubcollection, DbDoc } from '@/constants/db';
import { NotificationMsg } from '@/constants/messages';
import { isOk, NotificationType, ToastType } from '@/shared/types';
import type { ModuleId, Notification } from '@/shared/types';
import { nowTime } from '@/shared/utils/date';

/** Sends a module request: writes to admin's notifications + updates own requestedModules */
export function useModuleRequest(adminUid: string | null) {
  const { firebaseUser, profile } = useAuth();
  const { addToast } = useToast();

  const requestModule = useCallback(
    async (moduleId: ModuleId) => {
      if (!firebaseUser?.uid || !profile || !adminUid) return;

      // Guard: already requested
      if (profile.requestedModules?.includes(moduleId)) {
        addToast(NotificationMsg.ModuleAlreadyRequested, ToastType.Info);
        return;
      }

      // Guard: already enabled
      if (profile.modules[moduleId]) return;

      const notification: Notification = {
        id: crypto.randomUUID(),
        type: NotificationType.ModuleRequest,
        moduleId,
        requestedBy: firebaseUser.uid,
        requestedByName: profile.name,
        createdAt: nowTime(),
        read: false,
        dismissed: false,
      };

      // Write 1: notification to admin's subcollection
      const adminAdapter = createAdapter(userPath(adminUid));
      const notifResult = await adminAdapter.save(
        DbSubcollection.Notifications,
        notification as unknown as Record<string, unknown> & { id: string },
      );

      if (!isOk(notifResult)) {
        addToast(NotificationMsg.ModuleRequestFailed, ToastType.Error);
        return;
      }

      // Write 2: append to own requestedModules
      const selfAdapter = createAdapter(userPath(firebaseUser.uid));
      const updated = [...(profile.requestedModules ?? []), moduleId];
      await selfAdapter.save(DbSubcollection.Profile, {
        id: DbDoc.Main,
        requestedModules: updated,
        updatedAt: nowTime(),
      });

      addToast(NotificationMsg.ModuleRequested, ToastType.Success);
    },
    [firebaseUser, profile, adminUid, addToast],
  );

  return { requestModule };
}

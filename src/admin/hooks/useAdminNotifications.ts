import { useCallback } from 'react';

import { useAuth } from '@/shared/auth/useAuth';
import { useToast } from '@/shared/errors/useToast';
import { useNotifications } from '@/shared/hooks/useNotifications';
import { useAllUsers } from '@/admin/hooks/useAllUsers';
import { useAdminActions } from '@/admin/hooks/useAdminActions';
import { createAdapter } from '@/shared/storage/create-adapter';
import { userPath, DbSubcollection, DbDoc } from '@/constants/db';
import { NotificationMsg } from '@/constants/messages';
import {
  isOk,
  NotificationType,
  ToastType,
} from '@/shared/types';
import type {
  AlertType,
  ModuleId,
  ModuleConfig,
  Notification,
  Severity,
} from '@/shared/types';
import { nowTime } from '@/shared/utils/date';

interface CreateAlertParams {
  message: string;
  severity: Severity;
  alertType: AlertType;
  shownTillDate: string;
  targetUids: string[];
}

/** Admin actions for notifications: send alerts, approve module requests */
export function useAdminNotifications() {
  const { firebaseUser } = useAuth();
  const { addToast } = useToast();
  const { notifications, unreadCount, ready, markRead } = useNotifications();
  const { users } = useAllUsers();
  const { updateUserModules } = useAdminActions();

  /** Pending module requests from admin's notification inbox */
  const moduleRequests = notifications.filter(
    (n) => n.type === NotificationType.ModuleRequest && !n.read,
  );

  /** Send alert to target users */
  const sendAlert = useCallback(
    async (params: CreateAlertParams) => {
      if (!firebaseUser?.uid) return;

      const notification: Omit<Notification, 'id'> & { id?: string } = {
        type: NotificationType.AdminAlert,
        message: params.message,
        severity: params.severity,
        alertType: params.alertType,
        shownTillDate: params.shownTillDate,
        createdAt: nowTime(),
        read: false,
        dismissed: false,
      };

      let allOk = true;
      for (const uid of params.targetUids) {
        const adapter = createAdapter(userPath(uid));
        const entry = { ...notification, id: crypto.randomUUID() };
        const result = await adapter.save(DbSubcollection.Notifications, entry as unknown as Record<string, unknown> & { id: string });
        if (!isOk(result)) allOk = false;
      }

      if (allOk) {
        addToast(NotificationMsg.AlertCreated, ToastType.Success);
      } else {
        addToast(NotificationMsg.AlertCreateFailed, ToastType.Error);
      }
    },
    [firebaseUser, addToast],
  );

  /** One-click approve a module request */
  const approveModuleRequest = useCallback(
    async (request: Notification) => {
      if (!request.requestedBy || !request.moduleId) return;

      const targetUser = users.find((u) => u.uid === request.requestedBy);
      if (!targetUser) return;

      const updatedModules: ModuleConfig = {
        ...targetUser.modules,
        [request.moduleId as ModuleId]: true,
      };
      const moduleResult = await updateUserModules(request.requestedBy, updatedModules);
      if (!isOk(moduleResult)) {
        addToast(NotificationMsg.ModuleApproveFailed, ToastType.Error);
        return;
      }

      const userAdapter = createAdapter(userPath(request.requestedBy));
      const updatedRequested = (targetUser as unknown as { requestedModules?: string[] }).requestedModules
        ?.filter((m: string) => m !== request.moduleId) ?? [];
      await userAdapter.save(DbSubcollection.Profile, {
        id: DbDoc.Main,
        requestedModules: updatedRequested,
        updatedAt: nowTime(),
      });

      await markRead(request.id);
      addToast(NotificationMsg.ModuleApproved, ToastType.Success);
    },
    [users, updateUserModules, markRead, addToast],
  );

  /** Delete an alert from a specific user's notifications */
  const deleteAlert = useCallback(
    async (targetUid: string, notificationId: string) => {
      const adapter = createAdapter(userPath(targetUid));
      const result = await adapter.remove(DbSubcollection.Notifications, notificationId);
      if (isOk(result)) {
        addToast(NotificationMsg.AlertDeleted, ToastType.Success);
      } else {
        addToast(NotificationMsg.AlertDeleteFailed, ToastType.Error);
      }
    },
    [addToast],
  );

  return {
    moduleRequests,
    unreadCount,
    ready,
    sendAlert,
    approveModuleRequest,
    deleteAlert,
  };
}

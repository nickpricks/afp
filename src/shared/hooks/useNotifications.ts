import { useEffect, useRef, useState, useCallback } from 'react';

import { useAuth } from '@/shared/auth/useAuth';
import { createAdapter } from '@/shared/storage/create-adapter';
import { userPath, DbSubcollection } from '@/constants/db';
import type { StorageAdapter } from '@/shared/storage/adapter';
import type { Notification } from '@/shared/types';
import { todayStr } from '@/shared/utils/date';

/** Reads the current user's notifications subcollection with real-time updates */
export function useNotifications() {
  const { firebaseUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [ready, setReady] = useState(false);
  const adapterRef = useRef<StorageAdapter | null>(null);

  const uid = firebaseUser?.uid;

  useEffect(() => {
    if (!uid) return;
    const adapter = createAdapter(userPath(uid));
    adapterRef.current = adapter;
    const unsubscribe = adapter.onSnapshot<Notification>(
      DbSubcollection.Notifications,
      (data) => {
        setNotifications(data);
        setReady(true);
      },
      (error) => {
        console.error('[AFP] Notifications listener error:', error);
      },
    );
    return () => {
      unsubscribe();
      adapterRef.current = null;
    };
  }, [uid]);

  /** Active admin alerts: not dismissed, not expired */
  const activeAlerts = notifications.filter(
    (n) =>
      n.type === 'admin_alert' &&
      !n.dismissed &&
      (!n.shownTillDate || n.shownTillDate >= todayStr()),
  );

  /** Unread count (for badge) */
  const unreadCount = notifications.filter((n) => !n.read).length;

  /** Mark a notification as read */
  const markRead = useCallback(
    async (id: string) => {
      const adapter = adapterRef.current;
      if (!adapter) return;
      const notif = notifications.find((n) => n.id === id);
      if (!notif || notif.read) return;
      await adapter.save(DbSubcollection.Notifications, { ...notif, read: true });
    },
    [notifications],
  );

  /** Dismiss a notification (sets dismissed: true) */
  const dismiss = useCallback(
    async (id: string) => {
      const adapter = adapterRef.current;
      if (!adapter) return;
      const notif = notifications.find((n) => n.id === id);
      if (!notif) return;
      await adapter.save(DbSubcollection.Notifications, {
        ...notif,
        read: true,
        dismissed: true,
      });
    },
    [notifications],
  );

  return { notifications, activeAlerts, unreadCount, ready, markRead, dismiss };
}

# 🔔 Notifications & Module Requests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Add a per-user notification subcollection powering two features: users can request modules from their Profile page (admin sees requests and one-click approves), and admin can post alerts/notices that appear as color-coded banners across all pages.

**Architecture:** Single `notifications` subcollection under each user's profile. User→admin direction: module request writes to admin's notifications + `requestedModules` field on user's own profile. Admin→user direction: admin writes alert entries to target users' notifications. No root broadcast collection — "alert all" loops over users. Dismissal state stored in Firestore (not localStorage).

**Tech Stack:** React 19, TypeScript (strict), Tailwind CSS v4, Firebase Firestore, Vitest

**Design Spec:** `docs/specs/2026-04-14-notifications-module-requests-design.md`

---

## 📋 Step Summary

| # | Step | Description | Status |
|---|------|-------------|--------|
| 0 | 🔑 Expose Admin UID | Add `adminUid` to auth context from `app/config` | ✅ |
| 1 | 🏗️ Types & Constants | Notification types, enums, DB paths, messages | ✅ |
| 2 | 🧪 Types Tests | Unit tests for notification type helpers | ✅ |
| 3 | 🪝 useNotifications Hook | Generic subcollection hook for reading own notifications | ✅ |
| 4 | 🧪 useNotifications Tests | Hook tests with mock adapter | ✅ |
| 5 | 📨 useModuleRequest Hook | User sends module request (dual-write) | ✅ |
| 6 | 🧪 useModuleRequest Tests | Test dual-write and guard logic | ✅ |
| 7 | 🖥️ Profile Module Request UI | "Request" buttons on Profile page | ✅ |
| 8 | 🧪 Profile Module Request Tests | Render tests for request buttons | ✅ |
| 9 | 🔔 AlertBanner Component | Top banner rendering notifications | ✅ |
| 10 | 🧪 AlertBanner Tests | Render + dismiss tests | ✅ |
| 11 | 📐 Layout Integration | Wire AlertBanner + admin header badge into Layout | ✅ |
| 12 | 👑 useAdminNotifications Hook | Admin reads own notifications + sends alerts | ✅ |
| 13 | 🧪 useAdminNotifications Tests | Test send/approve/dismiss logic | ✅ |
| 14 | 📢 BroadcastsTab Component | Admin compose form + alert list | ✅ |
| 15 | 🧪 BroadcastsTab Tests | Render + compose tests | ✅ |
| 16 | 📋 AdminPanel + UsersTab Updates | Third tab + request badges on user rows | ✅ |
| 17 | 🧪 AdminPanel + UsersTab Tests | Tab switching + badge render tests | ✅ |
| 18 | 🔒 Firestore Rules | Security rules for notifications subcollection | ✅ |
| 19 | 📝 CLAUDE.md + CHANGELOG | Documentation updates | ✅ |

## 📁 File Manifest

| Emoji | Action | File | Purpose |
|-------|--------|------|---------|
| 📝 | Modify | `src/shared/auth/auth-context.tsx` | Add `adminUid` state, read from `app/config`, expose in context |
| 📝 | Modify | `src/shared/types.ts` | Add `Notification`, `NotificationType`, `AlertType`, `Severity` types + `requestedModules` on `UserProfile` |
| 📝 | Modify | `src/constants/db.ts` | Add `Notifications` to `DbSubcollection` |
| 📝 | Modify | `src/constants/messages.ts` | Add `NotificationMsg` enum |
| 🆕 | Create | `src/shared/hooks/useNotifications.ts` | Generic hook: listen to own `notifications` subcollection |
| 🆕 | Create | `src/shared/hooks/__tests__/useNotifications.test.ts` | Hook tests |
| 🆕 | Create | `src/shared/hooks/useModuleRequest.ts` | Dual-write: request to admin's notifications + own `requestedModules` |
| 🆕 | Create | `src/shared/hooks/__tests__/useModuleRequest.test.ts` | Hook tests |
| 📝 | Modify | `src/shared/components/ProfilePage.tsx` | Add disabled module chips with "Request" button |
| 🆕 | Create | `src/shared/components/__tests__/ProfileModuleRequest.test.tsx` | Render tests for request UI |
| 🆕 | Create | `src/shared/components/AlertBanner.tsx` | Top banner component for admin alerts |
| 🆕 | Create | `src/shared/components/__tests__/AlertBanner.test.tsx` | Render + dismiss tests |
| 📝 | Modify | `src/shared/components/Layout.tsx` | Render `AlertBanner` above header |
| 🆕 | Create | `src/admin/hooks/useAdminNotifications.ts` | Admin: read own notifications, send alerts, approve requests |
| 🆕 | Create | `src/admin/hooks/__tests__/useAdminNotifications.test.ts` | Hook tests |
| 🆕 | Create | `src/admin/components/BroadcastsTab.tsx` | Compose form + active/expired alert list |
| 🆕 | Create | `src/admin/components/__tests__/BroadcastsTab.test.tsx` | Render + compose tests |
| 📝 | Modify | `src/admin/components/AdminPanel.tsx` | Add "Broadcasts" tab (3rd tab) |
| 📝 | Modify | `src/admin/components/UsersTab.tsx` | Add request badge chips on user rows |
| 🆕 | Create | `src/admin/components/__tests__/AdminPanel.test.tsx` | Tab switching tests |
| 📝 | Modify | `firestore.rules` | Add notification subcollection rules |
| 📝 | Modify | `CLAUDE.md` | Document notification architecture |
| 📝 | Modify | `CHANGELOG.md` | Add entry for notifications + module requests |

---

## Task 0: 🔑 Expose Admin UID

**Files:**
- Modify: `src/shared/auth/auth-context.tsx`
- Modify: `src/shared/auth/useAuth.ts` (type only — `AuthContextValue` change)

The admin UID lives in `app/config.headminickUid` (Firestore) but isn't exposed to hooks. `useModuleRequest` needs it to write to the admin's notifications subcollection.

- [x] **Step 1: Add `adminUid` to `AuthContextValue`**

In `src/shared/auth/auth-context.tsx`, add to the interface:

```typescript
export interface AuthContextValue {
  firebaseUser: User | null;
  profile: UserProfile | null;
  isTheAdminNick: boolean;
  isLoading: boolean;
  syncStatus: SyncStatus;
  setSyncStatus: (status: SyncStatus) => void;
  adminUid: string | null;
}
```

- [x] **Step 2: Read admin UID from `app/config` in `AuthProvider`**

In the `AuthProvider` component, add state and a one-time read:

```typescript
const [adminUid, setAdminUid] = useState<string | null>(null);

useEffect(() => {
  if (!isFirebaseConfigured) {
    setAdminUid('dev-user');
    return;
  }
  const configRef = doc(db, DbCollection.App, DbDoc.Config);
  const unsubscribe = onSnapshot(configRef, (snap) => {
    if (snap.exists()) {
      setAdminUid(snap.data()[DbField.AdminUid] ?? null);
    }
  });
  return unsubscribe;
}, []);
```

Pass `adminUid` in the context value.

- [x] **Step 3: Run type check**

Run: `bun run lint`
Expected: PASS

- [x] **Step 4: Commit**

```bash
git add src/shared/auth/auth-context.tsx
git commit -m "feat: expose adminUid in auth context from app/config"
```

---

## Task 1: 🏗️ Types & Constants

**Files:**
- Modify: `src/shared/types.ts`
- Modify: `src/constants/db.ts`
- Modify: `src/constants/messages.ts`

- [x] **Step 1: Add notification types to `src/shared/types.ts`**

Add after the `SyncStatus` enum (after line 88):

```typescript
// ─── Notification Types ─────────────────────────────────────────────────────

/** Type of notification entry */
export enum NotificationType {
  ModuleRequest = 'module_request',
  AdminAlert = 'admin_alert',
}

/** Behavioral type for admin alerts */
export enum AlertType {
  Alert = 'alert',
  Notice = 'notice',
}

/** Visual severity level for alert banners */
export enum Severity {
  Info = 'info',
  Warning = 'warning',
  Critical = 'critical',
}

/** A notification entry stored in users/{uid}/notifications/{id} */
export interface Notification {
  id: string;
  type: NotificationType;

  // Module request fields (user → admin's subcollection)
  moduleId?: ModuleId;
  requestedBy?: string;
  requestedByName?: string;

  // Admin alert fields (admin → user's subcollection)
  message?: string;
  severity?: Severity;
  alertType?: AlertType;
  shownTillDate?: string;

  // Common
  createdAt: string;
  read: boolean;
  dismissed: boolean;
}
```

- [x] **Step 2: Add `requestedModules` to `UserProfile`**

In `src/shared/types.ts`, add to the `UserProfile` interface after `updatedAt`:

```typescript
export interface UserProfile {
  role: UserRole;
  name: string;
  email: string | null;
  username: string | null;
  viewerOf: string | null;
  theme: string;
  colorMode: 'light' | 'dark' | 'system';
  effectCount?: number;
  effectSize?: 'small' | 'medium' | 'large';
  modules: ModuleConfig;
  createdAt: string;
  updatedAt: string;
  requestedModules?: string[];
}
```

- [x] **Step 3: Add `Notifications` to `DbSubcollection` in `src/constants/db.ts`**

```typescript
export enum DbSubcollection {
  Profile = 'profile',
  Body = 'body',
  BodyActivities = 'body_activities',
  BodyConfig = 'body_config',
  BudgetConfig = 'budget_config',
  Expenses = 'expenses',
  Income = 'income',
  Children = 'children',
  Feeds = 'feeds',
  Sleep = 'sleep',
  Growth = 'growth',
  Diapers = 'diapers',
  Notifications = 'notifications',
}
```

- [x] **Step 4: Add `NotificationMsg` enum to `src/constants/messages.ts`**

Add at end of file:

```typescript
/** Notification and module request messages */
export enum NotificationMsg {
  ModuleRequested = 'Module requested',
  ModuleRequestFailed = 'Failed to request module',
  ModuleAlreadyRequested = 'Module already requested',
  ModuleApproved = 'Module enabled',
  ModuleApproveFailed = 'Failed to approve module request',
  AlertCreated = 'Alert sent',
  AlertCreateFailed = 'Failed to send alert',
  AlertDismissed = 'Alert dismissed',
  AlertDismissFailed = 'Failed to dismiss alert',
  AlertDeleted = 'Alert removed',
  AlertDeleteFailed = 'Failed to remove alert',
}
```

- [x] **Step 5: Run type check**

Run: `bun run lint`
Expected: PASS — no type errors

- [x] **Step 6: Commit**

```bash
git add src/shared/types.ts src/constants/db.ts src/constants/messages.ts
git commit -m "feat: add notification types, DB paths, and messages"
```

---

## Task 2: 🧪 Types Tests

**Files:**
- Create: `src/shared/__tests__/notification-types.test.ts`

- [x] **Step 1: Write tests for notification type enums**

```typescript
import { describe, expect, it } from 'vitest';
import {
  NotificationType,
  AlertType,
  Severity,
  type Notification,
  ModuleId,
} from '@/shared/types';

describe('Notification types', () => {
  it('NotificationType has correct values', () => {
    expect(NotificationType.ModuleRequest).toBe('module_request');
    expect(NotificationType.AdminAlert).toBe('admin_alert');
  });

  it('AlertType has correct values', () => {
    expect(AlertType.Alert).toBe('alert');
    expect(AlertType.Notice).toBe('notice');
  });

  it('Severity has correct values', () => {
    expect(Severity.Info).toBe('info');
    expect(Severity.Warning).toBe('warning');
    expect(Severity.Critical).toBe('critical');
  });

  it('Notification interface accepts module request shape', () => {
    const notif: Notification = {
      id: 'test-1',
      type: NotificationType.ModuleRequest,
      moduleId: ModuleId.Body,
      requestedBy: 'uid-123',
      requestedByName: 'Priya',
      createdAt: '2026-04-14T10:00:00Z',
      read: false,
      dismissed: false,
    };
    expect(notif.type).toBe(NotificationType.ModuleRequest);
    expect(notif.moduleId).toBe(ModuleId.Body);
  });

  it('Notification interface accepts admin alert shape', () => {
    const notif: Notification = {
      id: 'test-2',
      type: NotificationType.AdminAlert,
      message: 'Scheduled maintenance tonight',
      severity: Severity.Info,
      alertType: AlertType.Notice,
      shownTillDate: '2026-04-15',
      createdAt: '2026-04-14T10:00:00Z',
      read: false,
      dismissed: false,
    };
    expect(notif.type).toBe(NotificationType.AdminAlert);
    expect(notif.alertType).toBe(AlertType.Notice);
  });
});
```

- [x] **Step 2: Run test to verify it passes**

Run: `bunx vitest run src/shared/__tests__/notification-types.test.ts`
Expected: PASS — all 4 tests pass

- [x] **Step 3: Commit**

```bash
git add src/shared/__tests__/notification-types.test.ts
git commit -m "test: add notification type enum tests"
```

---

## Task 3: 🪝 useNotifications Hook

**Files:**
- Create: `src/shared/hooks/useNotifications.ts`

This hook follows the `useBabyCollection` pattern: `createAdapter(userPath(uid))` → `onSnapshot` on the `notifications` subcollection. Any user reads their own notifications.

- [x] **Step 1: Create the hook**

```typescript
import { useEffect, useRef, useState, useCallback } from 'react';

import { useAuth } from '@/shared/auth/useAuth';
import { createAdapter } from '@/shared/storage/create-adapter';
import { userPath, DbSubcollection } from '@/constants/db';
import { isOk } from '@/shared/types';
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
```

- [x] **Step 2: Run type check**

Run: `bun run lint`
Expected: PASS

- [x] **Step 3: Commit**

```bash
git add src/shared/hooks/useNotifications.ts
git commit -m "feat: add useNotifications hook for per-user notification inbox"
```

---

## Task 4: 🧪 useNotifications Tests

**Files:**
- Create: `src/shared/hooks/__tests__/useNotifications.test.ts`

- [x] **Step 1: Write failing test**

```typescript
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNotifications } from '@/shared/hooks/useNotifications';
import { NotificationType, AlertType, Severity } from '@/shared/types';
import type { Notification } from '@/shared/types';

// Mock dependencies
vi.mock('@/shared/auth/useAuth', () => ({
  useAuth: () => ({ firebaseUser: { uid: 'test-user' } }),
}));

const mockSave = vi.fn().mockResolvedValue({ ok: true, data: undefined });
let snapshotCallback: ((data: Notification[]) => void) | null = null;

vi.mock('@/shared/storage/create-adapter', () => ({
  createAdapter: () => ({
    onSnapshot: (_col: string, cb: (data: Notification[]) => void) => {
      snapshotCallback = cb;
      return () => { snapshotCallback = null; };
    },
    save: (...args: unknown[]) => mockSave(...args),
  }),
}));

vi.mock('@/shared/utils/date', () => ({
  todayStr: () => '2026-04-14',
}));

const makeAlert = (overrides: Partial<Notification> = {}): Notification => ({
  id: 'alert-1',
  type: NotificationType.AdminAlert,
  message: 'Test alert',
  severity: Severity.Info,
  alertType: AlertType.Notice,
  shownTillDate: '2026-04-20',
  createdAt: '2026-04-14T10:00:00Z',
  read: false,
  dismissed: false,
  ...overrides,
});

describe('useNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    snapshotCallback = null;
  });

  it('returns empty state initially', () => {
    const { result } = renderHook(() => useNotifications());
    expect(result.current.notifications).toEqual([]);
    expect(result.current.ready).toBe(false);
    expect(result.current.unreadCount).toBe(0);
  });

  it('populates notifications from snapshot', () => {
    const { result } = renderHook(() => useNotifications());
    act(() => snapshotCallback?.([makeAlert()]));
    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.ready).toBe(true);
  });

  it('filters activeAlerts — excludes dismissed', () => {
    const { result } = renderHook(() => useNotifications());
    act(() => snapshotCallback?.([
      makeAlert({ id: 'a1', dismissed: false }),
      makeAlert({ id: 'a2', dismissed: true }),
    ]));
    expect(result.current.activeAlerts).toHaveLength(1);
    expect(result.current.activeAlerts[0].id).toBe('a1');
  });

  it('filters activeAlerts — excludes expired', () => {
    const { result } = renderHook(() => useNotifications());
    act(() => snapshotCallback?.([
      makeAlert({ id: 'a1', shownTillDate: '2026-04-10' }),
    ]));
    expect(result.current.activeAlerts).toHaveLength(0);
  });

  it('computes unreadCount', () => {
    const { result } = renderHook(() => useNotifications());
    act(() => snapshotCallback?.([
      makeAlert({ id: 'a1', read: false }),
      makeAlert({ id: 'a2', read: true }),
      makeAlert({ id: 'a3', read: false }),
    ]));
    expect(result.current.unreadCount).toBe(2);
  });

  it('dismiss sets read + dismissed on the notification', async () => {
    const { result } = renderHook(() => useNotifications());
    act(() => snapshotCallback?.([makeAlert({ id: 'a1' })]));
    await act(async () => result.current.dismiss('a1'));
    expect(mockSave).toHaveBeenCalledWith(
      'notifications',
      expect.objectContaining({ id: 'a1', read: true, dismissed: true }),
    );
  });

  it('markRead sets read without dismissed', async () => {
    const { result } = renderHook(() => useNotifications());
    act(() => snapshotCallback?.([makeAlert({ id: 'a1' })]));
    await act(async () => result.current.markRead('a1'));
    expect(mockSave).toHaveBeenCalledWith(
      'notifications',
      expect.objectContaining({ id: 'a1', read: true, dismissed: false }),
    );
  });
});
```

- [x] **Step 2: Run test to verify it passes**

Run: `bunx vitest run src/shared/hooks/__tests__/useNotifications.test.ts`
Expected: PASS — all 7 tests

- [x] **Step 3: Commit**

```bash
git add src/shared/hooks/__tests__/useNotifications.test.ts
git commit -m "test: add useNotifications hook tests"
```

---

## Task 5: 📨 useModuleRequest Hook

**Files:**
- Create: `src/shared/hooks/useModuleRequest.ts`

Dual-write: writes `module_request` notification to admin's subcollection + appends to own `requestedModules` array. Needs admin UID from app config.

- [x] **Step 1: Create the hook**

```typescript
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
        notification,
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
```

- [x] **Step 2: Run type check**

Run: `bun run lint`
Expected: PASS

- [x] **Step 3: Commit**

```bash
git add src/shared/hooks/useModuleRequest.ts
git commit -m "feat: add useModuleRequest hook with dual-write to admin notifications"
```

---

## Task 6: 🧪 useModuleRequest Tests

**Files:**
- Create: `src/shared/hooks/__tests__/useModuleRequest.test.ts`

- [x] **Step 1: Write tests**

```typescript
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useModuleRequest } from '@/shared/hooks/useModuleRequest';
import { ModuleId, NotificationType, ToastType } from '@/shared/types';

const mockAddToast = vi.fn();
const mockSave = vi.fn().mockResolvedValue({ ok: true, data: undefined });

vi.mock('@/shared/auth/useAuth', () => ({
  useAuth: () => ({
    firebaseUser: { uid: 'user-1' },
    profile: {
      name: 'Priya',
      modules: { body: true, budget: false, baby: false },
      requestedModules: [],
    },
  }),
}));

vi.mock('@/shared/errors/useToast', () => ({
  useToast: () => ({ addToast: mockAddToast }),
}));

vi.mock('@/shared/storage/create-adapter', () => ({
  createAdapter: () => ({ save: (...args: unknown[]) => mockSave(...args) }),
}));

vi.mock('@/shared/utils/date', () => ({
  nowTime: () => '2026-04-14T10:00:00Z',
}));

describe('useModuleRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('writes notification to admin subcollection and updates own profile', async () => {
    const { result } = renderHook(() => useModuleRequest('admin-uid'));
    await act(async () => result.current.requestModule(ModuleId.Budget));

    // First call: admin's notifications
    expect(mockSave).toHaveBeenCalledWith(
      'notifications',
      expect.objectContaining({
        type: NotificationType.ModuleRequest,
        moduleId: ModuleId.Budget,
        requestedBy: 'user-1',
        requestedByName: 'Priya',
      }),
    );

    // Second call: own profile requestedModules
    expect(mockSave).toHaveBeenCalledWith(
      'profile',
      expect.objectContaining({
        id: 'main',
        requestedModules: [ModuleId.Budget],
      }),
    );

    expect(mockAddToast).toHaveBeenCalledWith('Module requested', ToastType.Success);
  });

  it('does not request an already-enabled module', async () => {
    const { result } = renderHook(() => useModuleRequest('admin-uid'));
    await act(async () => result.current.requestModule(ModuleId.Body));
    expect(mockSave).not.toHaveBeenCalled();
  });

  it('does nothing without admin UID', async () => {
    const { result } = renderHook(() => useModuleRequest(null));
    await act(async () => result.current.requestModule(ModuleId.Budget));
    expect(mockSave).not.toHaveBeenCalled();
  });
});
```

- [x] **Step 2: Run tests**

Run: `bunx vitest run src/shared/hooks/__tests__/useModuleRequest.test.ts`
Expected: PASS — all 3 tests

- [x] **Step 3: Commit**

```bash
git add src/shared/hooks/__tests__/useModuleRequest.test.ts
git commit -m "test: add useModuleRequest hook tests"
```

---

## Task 7: 🖥️ Profile Module Request UI

**Files:**
- Modify: `src/shared/components/ProfilePage.tsx`

Currently the Modules section (lines 359-380) only shows enabled modules. Add disabled modules as greyed-out chips with a "Request" button.

- [x] **Step 1: Add imports at top of `ProfilePage.tsx`**

Add to existing imports:

```typescript
import { useModuleRequest } from '@/shared/hooks/useModuleRequest';
import { ALL_MODULES } from '@/shared/types';
```

- [x] **Step 2: Add hook call in component body**

Near the existing `enabledModules` derivation (around line 197), add:

```typescript
const { requestModule } = useModuleRequest(adminUid);
```

`adminUid` comes from `useAuth().adminUid` (added in Task 0). Extract it alongside `profile` and `isTheAdminNick`.

- [x] **Step 3: Replace the Modules section**

Replace lines 359-380 with:

```tsx
      {/* Module Status Section */}
      <section className="rounded-lg border border-line bg-surface-card p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-fg-muted">
          Modules
        </h2>
        <ul className="space-y-2">
          {ALL_MODULES.map((id) => {
            const enabled = profile?.modules[id] ?? false;
            const requested = profile?.requestedModules?.includes(id) ?? false;
            return (
              <li
                key={id}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${
                      enabled ? 'bg-accent' : 'bg-fg-muted/30'
                    }`}
                  />
                  <span className={enabled ? 'text-fg' : 'text-fg-muted'}>
                    {MODULE_LABELS[id]}
                  </span>
                </div>
                {!enabled && !requested && !isTheAdminNick && (
                  <button
                    type="button"
                    onClick={() => requestModule(id)}
                    className="rounded-md bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent hover:bg-accent/20 transition-colors"
                  >
                    Request
                  </button>
                )}
                {!enabled && requested && (
                  <span className="rounded-md bg-fg-muted/10 px-2.5 py-1 text-xs font-medium text-fg-muted">
                    Requested
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </section>
```

- [x] **Step 4: Run type check + dev server visual verification**

Run: `bun run lint`
Expected: PASS

Run: `bun run dev`
Open Profile page — verify enabled modules show active, disabled show greyed with "Request" button.

- [x] **Step 5: Commit**

```bash
git add src/shared/components/ProfilePage.tsx
git commit -m "feat: add module request buttons to Profile page"
```

---

## Task 8: 🧪 Profile Module Request Tests

**Files:**
- Create: `src/shared/components/__tests__/ProfileModuleRequest.test.tsx`

- [x] **Step 1: Write render tests**

```typescript
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Test only the module section behavior, not the full ProfilePage
// Mock out the hooks and render the relevant section

const mockRequestModule = vi.fn();

vi.mock('@/shared/hooks/useModuleRequest', () => ({
  useModuleRequest: () => ({ requestModule: mockRequestModule }),
}));

vi.mock('@/shared/auth/useAuth', () => ({
  useAuth: () => ({
    firebaseUser: { uid: 'user-1', isAnonymous: false, photoURL: null },
    profile: {
      name: 'Test User',
      role: 'user',
      modules: { body: true, budget: false, baby: false },
      requestedModules: ['baby'],
      theme: 'family-blue',
      colorMode: 'dark',
    },
    isLoading: false,
    isTheAdminNick: false,
  }),
}));

vi.mock('@/shared/errors/useToast', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

// Import after mocks
import { ProfilePage } from '@/shared/components/ProfilePage';

describe('ProfilePage module request UI', () => {
  it('shows "Request" button for disabled unrequested modules', () => {
    render(<ProfilePage />);
    const buttons = screen.getAllByRole('button', { name: 'Request' });
    // Budget is disabled and not requested → should have Request button
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it('shows "Requested" chip for already-requested modules', () => {
    render(<ProfilePage />);
    // Baby is disabled but already requested
    expect(screen.getByText('Requested')).toBeInTheDocument();
  });

  it('does not show Request button for enabled modules', () => {
    render(<ProfilePage />);
    // Body is enabled — no Request button next to it
    const bodyRow = screen.getByText('Body & Fitness').closest('li');
    expect(bodyRow?.querySelector('button')).toBeNull();
  });

  it('calls requestModule when Request button is clicked', async () => {
    render(<ProfilePage />);
    const requestButton = screen.getAllByRole('button', { name: 'Request' })[0];
    await userEvent.click(requestButton);
    expect(mockRequestModule).toHaveBeenCalledWith('budget');
  });
});
```

- [x] **Step 2: Run tests**

Run: `bunx vitest run src/shared/components/__tests__/ProfileModuleRequest.test.tsx`
Expected: PASS — all 4 tests

- [x] **Step 3: Commit**

```bash
git add src/shared/components/__tests__/ProfileModuleRequest.test.tsx
git commit -m "test: add Profile module request UI tests"
```

---

## Task 9: 🔔 AlertBanner Component

**Files:**
- Create: `src/shared/components/AlertBanner.tsx`

- [x] **Step 1: Create the component**

```tsx
import { AlertType, Severity } from '@/shared/types';
import type { Notification } from '@/shared/types';

/** Color classes by severity */
const SEVERITY_STYLES: Record<Severity, string> = {
  [Severity.Info]: 'bg-blue-900/80 text-blue-200 border-blue-700',
  [Severity.Warning]: 'bg-amber-900/80 text-amber-200 border-amber-700',
  [Severity.Critical]: 'bg-red-900/80 text-red-200 border-red-700',
};

/** Severity emoji prefix */
const SEVERITY_ICON: Record<Severity, string> = {
  [Severity.Info]: 'ℹ️',
  [Severity.Warning]: '⚠️',
  [Severity.Critical]: '🚨',
};

interface AlertBannerProps {
  alerts: Notification[];
  onDismiss: (id: string) => void;
}

/** Renders stacked admin alert banners above the header */
export function AlertBanner({ alerts, onDismiss }: AlertBannerProps) {
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-0">
      {alerts.map((alert) => {
        const severity = (alert.severity as Severity) ?? Severity.Info;
        const isDismissible = alert.alertType === AlertType.Notice;

        return (
          <div
            key={alert.id}
            className={`flex items-center justify-between px-4 py-2 text-sm border-b ${SEVERITY_STYLES[severity]}`}
          >
            <span>
              {SEVERITY_ICON[severity]} {alert.message}
            </span>
            {isDismissible && (
              <button
                type="button"
                onClick={() => onDismiss(alert.id)}
                className="ml-3 opacity-60 hover:opacity-100 transition-opacity"
                aria-label="Dismiss alert"
              >
                ✕
              </button>
            )}
            {!isDismissible && (
              <span className="ml-3 text-xs opacity-40">
                Expires {alert.shownTillDate}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

- [x] **Step 2: Run type check**

Run: `bun run lint`
Expected: PASS

- [x] **Step 3: Commit**

```bash
git add src/shared/components/AlertBanner.tsx
git commit -m "feat: add AlertBanner component with severity-coded styling"
```

---

## Task 10: 🧪 AlertBanner Tests

**Files:**
- Create: `src/shared/components/__tests__/AlertBanner.test.tsx`

- [x] **Step 1: Write tests**

```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AlertBanner } from '@/shared/components/AlertBanner';
import { NotificationType, AlertType, Severity } from '@/shared/types';
import type { Notification } from '@/shared/types';

const makeAlert = (overrides: Partial<Notification> = {}): Notification => ({
  id: 'alert-1',
  type: NotificationType.AdminAlert,
  message: 'Test maintenance notice',
  severity: Severity.Info,
  alertType: AlertType.Notice,
  shownTillDate: '2026-04-20',
  createdAt: '2026-04-14T10:00:00Z',
  read: false,
  dismissed: false,
  ...overrides,
});

describe('AlertBanner', () => {
  it('renders nothing when alerts is empty', () => {
    const { container } = render(<AlertBanner alerts={[]} onDismiss={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders alert message text', () => {
    render(<AlertBanner alerts={[makeAlert()]} onDismiss={vi.fn()} />);
    expect(screen.getByText(/Test maintenance notice/)).toBeInTheDocument();
  });

  it('shows dismiss button for notice type', () => {
    render(<AlertBanner alerts={[makeAlert({ alertType: AlertType.Notice })]} onDismiss={vi.fn()} />);
    expect(screen.getByLabelText('Dismiss alert')).toBeInTheDocument();
  });

  it('hides dismiss button for alert type', () => {
    render(<AlertBanner alerts={[makeAlert({ alertType: AlertType.Alert })]} onDismiss={vi.fn()} />);
    expect(screen.queryByLabelText('Dismiss alert')).not.toBeInTheDocument();
  });

  it('shows expiry date for non-dismissible alerts', () => {
    render(<AlertBanner alerts={[makeAlert({ alertType: AlertType.Alert, shownTillDate: '2026-04-20' })]} onDismiss={vi.fn()} />);
    expect(screen.getByText(/Expires 2026-04-20/)).toBeInTheDocument();
  });

  it('calls onDismiss with alert id when dismiss clicked', async () => {
    const onDismiss = vi.fn();
    render(<AlertBanner alerts={[makeAlert({ id: 'a99' })]} onDismiss={onDismiss} />);
    await userEvent.click(screen.getByLabelText('Dismiss alert'));
    expect(onDismiss).toHaveBeenCalledWith('a99');
  });

  it('renders multiple alerts stacked', () => {
    const alerts = [
      makeAlert({ id: 'a1', message: 'First notice' }),
      makeAlert({ id: 'a2', message: 'Second notice', severity: Severity.Warning }),
    ];
    render(<AlertBanner alerts={alerts} onDismiss={vi.fn()} />);
    expect(screen.getByText(/First notice/)).toBeInTheDocument();
    expect(screen.getByText(/Second notice/)).toBeInTheDocument();
  });
});
```

- [x] **Step 2: Run tests**

Run: `bunx vitest run src/shared/components/__tests__/AlertBanner.test.tsx`
Expected: PASS — all 7 tests

- [x] **Step 3: Commit**

```bash
git add src/shared/components/__tests__/AlertBanner.test.tsx
git commit -m "test: add AlertBanner component tests"
```

---

## Task 11: 📐 Layout Integration

**Files:**
- Modify: `src/shared/components/Layout.tsx`

- [x] **Step 1: Add imports**

Add to `Layout.tsx` imports:

```typescript
import { AlertBanner } from '@/shared/components/AlertBanner';
import { useNotifications } from '@/shared/hooks/useNotifications';
```

- [x] **Step 2: Add hook call in Layout component**

After existing hooks (around line 21), add:

```typescript
const { activeAlerts, dismiss } = useNotifications();
```

- [x] **Step 3: Render AlertBanner above header**

In the return JSX, add `<AlertBanner>` between the ambient effects div and the header. Replace:

```tsx
      <div className="fx-ambient" aria-hidden="true" />
      <header className="flex items-center justify-between px-4 py-3 bg-surface-card border-b border-line">
```

With:

```tsx
      <div className="fx-ambient" aria-hidden="true" />
      <AlertBanner alerts={activeAlerts} onDismiss={dismiss} />
      <header className="flex items-center justify-between px-4 py-3 bg-surface-card border-b border-line">
```

- [x] **Step 4: Add admin notification badge to header**

For the admin user, show an unread badge on their profile avatar. In the header section where the profile button is rendered (around line 52-68), wrap the admin's avatar with a relative container and add a badge:

```tsx
{isTheAdminNick && unreadCount > 0 && (
  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
    {unreadCount}
  </span>
)}
```

Add the profile avatar button wrapper as `relative` (add `className="relative rounded-full"` to the button).

Also destructure `isTheAdminNick` from `useAuth()` and `unreadCount` from `useNotifications()`.

- [x] **Step 5: Run type check + visual verification**

Run: `bun run lint`
Expected: PASS

Run: `bun run dev`
Verify: No banner visible when no active alerts. Admin avatar shows badge when unread notifications exist.

- [x] **Step 6: Commit**

```bash
git add src/shared/components/Layout.tsx
git commit -m "feat: wire AlertBanner into Layout shell + admin notification badge"
```

---

## Task 12: 👑 useAdminNotifications Hook

**Files:**
- Create: `src/admin/hooks/useAdminNotifications.ts`

Admin reads own notifications (for request badges) and writes to user subcollections (for alerts).

- [x] **Step 1: Create the hook**

```typescript
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
        const result = await adapter.save(DbSubcollection.Notifications, entry);
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

      // Enable the module
      const updatedModules: ModuleConfig = {
        ...targetUser.modules,
        [request.moduleId as ModuleId]: true,
      };
      const moduleResult = await updateUserModules(request.requestedBy, updatedModules);
      if (!isOk(moduleResult)) {
        addToast(NotificationMsg.ModuleApproveFailed, ToastType.Error);
        return;
      }

      // Clear requestedModules on user's profile
      const userAdapter = createAdapter(userPath(request.requestedBy));
      const updatedRequested = (targetUser as { requestedModules?: string[] }).requestedModules
        ?.filter((m: string) => m !== request.moduleId) ?? [];
      await userAdapter.save(DbSubcollection.Profile, {
        id: DbDoc.Main,
        requestedModules: updatedRequested,
        updatedAt: nowTime(),
      });

      // Mark notification as read
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
```

- [x] **Step 2: Run type check**

Run: `bun run lint`
Expected: PASS

- [x] **Step 3: Commit**

```bash
git add src/admin/hooks/useAdminNotifications.ts
git commit -m "feat: add useAdminNotifications hook for alerts and request approval"
```

---

## Task 13: 🧪 useAdminNotifications Tests

**Files:**
- Create: `src/admin/hooks/__tests__/useAdminNotifications.test.ts`

- [x] **Step 1: Write tests**

```typescript
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAdminNotifications } from '@/admin/hooks/useAdminNotifications';
import { NotificationType, Severity, AlertType, ModuleId } from '@/shared/types';
import type { Notification } from '@/shared/types';

const mockAddToast = vi.fn();
const mockSave = vi.fn().mockResolvedValue({ ok: true, data: undefined });
const mockRemove = vi.fn().mockResolvedValue({ ok: true, data: undefined });
const mockUpdateUserModules = vi.fn().mockResolvedValue({ ok: true, data: undefined });
const mockMarkRead = vi.fn();

const moduleRequest: Notification = {
  id: 'req-1',
  type: NotificationType.ModuleRequest,
  moduleId: ModuleId.Budget,
  requestedBy: 'user-1',
  requestedByName: 'Priya',
  createdAt: '2026-04-14T10:00:00Z',
  read: false,
  dismissed: false,
};

vi.mock('@/shared/auth/useAuth', () => ({
  useAuth: () => ({ firebaseUser: { uid: 'admin-uid' } }),
}));

vi.mock('@/shared/errors/useToast', () => ({
  useToast: () => ({ addToast: mockAddToast }),
}));

vi.mock('@/shared/hooks/useNotifications', () => ({
  useNotifications: () => ({
    notifications: [moduleRequest],
    unreadCount: 1,
    ready: true,
    markRead: mockMarkRead,
  }),
}));

vi.mock('@/admin/hooks/useAllUsers', () => ({
  useAllUsers: () => ({
    users: [{
      uid: 'user-1',
      name: 'Priya',
      role: 'user',
      modules: { body: true, budget: false, baby: false },
      requestedModules: ['budget'],
    }],
    loading: false,
  }),
}));

vi.mock('@/admin/hooks/useAdminActions', () => ({
  useAdminActions: () => ({
    updateUserModules: mockUpdateUserModules,
    updateUserRole: vi.fn(),
  }),
}));

vi.mock('@/shared/storage/create-adapter', () => ({
  createAdapter: () => ({
    save: (...args: unknown[]) => mockSave(...args),
    remove: (...args: unknown[]) => mockRemove(...args),
  }),
}));

vi.mock('@/shared/utils/date', () => ({
  nowTime: () => '2026-04-14T10:00:00Z',
}));

describe('useAdminNotifications', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns unread module requests', () => {
    const { result } = renderHook(() => useAdminNotifications());
    expect(result.current.moduleRequests).toHaveLength(1);
    expect(result.current.moduleRequests[0].moduleId).toBe(ModuleId.Budget);
  });

  it('sendAlert writes notification to each target user', async () => {
    const { result } = renderHook(() => useAdminNotifications());
    await act(async () =>
      result.current.sendAlert({
        message: 'Maintenance tonight',
        severity: Severity.Info,
        alertType: AlertType.Notice,
        shownTillDate: '2026-04-15',
        targetUids: ['user-1'],
      }),
    );
    expect(mockSave).toHaveBeenCalledWith(
      'notifications',
      expect.objectContaining({
        type: NotificationType.AdminAlert,
        message: 'Maintenance tonight',
      }),
    );
  });

  it('approveModuleRequest enables module, clears request, marks read', async () => {
    const { result } = renderHook(() => useAdminNotifications());
    await act(async () =>
      result.current.approveModuleRequest(moduleRequest),
    );

    // Module toggled on
    expect(mockUpdateUserModules).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ budget: true }),
    );

    // requestedModules cleared on user's profile
    expect(mockSave).toHaveBeenCalledWith(
      'profile',
      expect.objectContaining({
        id: 'main',
        requestedModules: [],
      }),
    );

    // Notification marked read
    expect(mockMarkRead).toHaveBeenCalledWith('req-1');
  });

  it('deleteAlert removes notification from target user', async () => {
    const { result } = renderHook(() => useAdminNotifications());
    await act(async () =>
      result.current.deleteAlert('user-1', 'alert-1'),
    );
    expect(mockRemove).toHaveBeenCalledWith('notifications', 'alert-1');
  });
});
```

- [x] **Step 2: Run tests**

Run: `bunx vitest run src/admin/hooks/__tests__/useAdminNotifications.test.ts`
Expected: PASS — all 4 tests

- [x] **Step 3: Commit**

```bash
git add src/admin/hooks/__tests__/useAdminNotifications.test.ts
git commit -m "test: add useAdminNotifications hook tests"
```

---

## Task 14: 📢 BroadcastsTab Component

**Files:**
- Create: `src/admin/components/BroadcastsTab.tsx`

- [x] **Step 1: Create the compose form + alert list**

```tsx
import { useState, useCallback } from 'react';

import { useAdminNotifications } from '@/admin/hooks/useAdminNotifications';
import { useAllUsers } from '@/admin/hooks/useAllUsers';
import { AlertType, Severity, UserRole } from '@/shared/types';
import { todayStr } from '@/shared/utils/date';

/** Admin Broadcasts tab: compose alerts and view active/expired list */
export function BroadcastsTab() {
  const { sendAlert } = useAdminNotifications();
  const { users } = useAllUsers();

  const [message, setMessage] = useState('');
  const [alertType, setAlertType] = useState<AlertType>(AlertType.Notice);
  const [severity, setSeverity] = useState<Severity>(Severity.Info);
  const [shownTillDate, setShownTillDate] = useState('');
  const [targetAll, setTargetAll] = useState(true);
  const [targetUid, setTargetUid] = useState('');
  const [sending, setSending] = useState(false);

  const nonAdminUsers = users.filter((u) => u.role !== UserRole.TheAdminNick);

  const handleSend = useCallback(async () => {
    if (!message.trim() || !shownTillDate) return;
    setSending(true);

    const targetUids = targetAll
      ? nonAdminUsers.map((u) => u.uid)
      : targetUid
        ? [targetUid]
        : [];

    if (targetUids.length === 0) {
      setSending(false);
      return;
    }

    await sendAlert({
      message: message.trim(),
      severity,
      alertType,
      shownTillDate,
      targetUids,
    });

    setMessage('');
    setShownTillDate('');
    setSending(false);
  }, [message, shownTillDate, severity, alertType, targetAll, targetUid, nonAdminUsers, sendAlert]);

  return (
    <div className="space-y-4">
      {/* Compose Form */}
      <section className="rounded-lg border border-line bg-surface-card p-4 space-y-3">
        <h2 className="text-sm font-semibold text-fg-muted uppercase tracking-wide">
          📢 New Broadcast
        </h2>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Alert message..."
          rows={2}
          className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-muted/50 focus:border-accent focus:outline-none"
        />

        <div className="flex flex-wrap gap-3">
          {/* Alert Type */}
          <div>
            <label className="block text-xs font-medium text-fg-muted mb-1">Type</label>
            <select
              value={alertType}
              onChange={(e) => setAlertType(e.target.value as AlertType)}
              className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-fg"
            >
              <option value={AlertType.Notice}>📋 Notice (dismissible)</option>
              <option value={AlertType.Alert}>🚨 Alert (persistent)</option>
            </select>
          </div>

          {/* Severity */}
          <div>
            <label className="block text-xs font-medium text-fg-muted mb-1">Severity</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as Severity)}
              className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-fg"
            >
              <option value={Severity.Info}>🔵 Info</option>
              <option value={Severity.Warning}>🟡 Warning</option>
              <option value={Severity.Critical}>🔴 Critical</option>
            </select>
          </div>

          {/* Expiry */}
          <div>
            <label className="block text-xs font-medium text-fg-muted mb-1">Show until</label>
            <input
              type="date"
              value={shownTillDate}
              min={todayStr()}
              onChange={(e) => setShownTillDate(e.target.value)}
              className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-fg"
            />
          </div>
        </div>

        {/* Target */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={targetAll}
              onChange={() => setTargetAll(true)}
              className="accent-accent"
            />
            <span className="text-sm text-fg">All users ({nonAdminUsers.length})</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={!targetAll}
              onChange={() => setTargetAll(false)}
              className="accent-accent"
            />
            <span className="text-sm text-fg">Specific user</span>
          </label>
          {!targetAll && (
            <select
              value={targetUid}
              onChange={(e) => setTargetUid(e.target.value)}
              className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-fg"
            >
              <option value="">Select user...</option>
              {nonAdminUsers.map((u) => (
                <option key={u.uid} value={u.uid}>{u.name}</option>
              ))}
            </select>
          )}
        </div>

        <button
          type="button"
          onClick={handleSend}
          disabled={sending || !message.trim() || !shownTillDate}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-fg-on-accent hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {sending ? 'Sending...' : '📤 Send Broadcast'}
        </button>
      </section>

      {/* Active Alerts — note: admin reads from ALL users' subcollections.
          For MVP, we track sent alerts in component state after send.
          Full solution: query users' notifications where type=admin_alert.
          Deferred to avoid N listeners. Admin can see via individual user expansion. */}
    </div>
  );
}
```

- [x] **Step 2: Run type check**

Run: `bun run lint`
Expected: PASS

- [x] **Step 3: Commit**

```bash
git add src/admin/components/BroadcastsTab.tsx
git commit -m "feat: add BroadcastsTab with compose form and target picker"
```

---

## Task 15: 🧪 BroadcastsTab Tests

**Files:**
- Create: `src/admin/components/__tests__/BroadcastsTab.test.tsx`

- [x] **Step 1: Write tests**

```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BroadcastsTab } from '@/admin/components/BroadcastsTab';

const mockSendAlert = vi.fn();

vi.mock('@/admin/hooks/useAdminNotifications', () => ({
  useAdminNotifications: () => ({
    sendAlert: mockSendAlert,
    moduleRequests: [],
    unreadCount: 0,
    ready: true,
  }),
}));

vi.mock('@/admin/hooks/useAllUsers', () => ({
  useAllUsers: () => ({
    users: [
      { uid: 'admin-1', name: 'Admin', role: 'theAdminNick', modules: {} },
      { uid: 'user-1', name: 'Priya', role: 'user', modules: {} },
      { uid: 'user-2', name: 'Ravi', role: 'user', modules: {} },
    ],
    loading: false,
  }),
}));

vi.mock('@/shared/utils/date', () => ({
  todayStr: () => '2026-04-14',
}));

describe('BroadcastsTab', () => {
  it('renders compose form with all controls', () => {
    render(<BroadcastsTab />);
    expect(screen.getByPlaceholderText('Alert message...')).toBeInTheDocument();
    expect(screen.getByText(/Send Broadcast/)).toBeInTheDocument();
    expect(screen.getByText(/All users/)).toBeInTheDocument();
  });

  it('send button is disabled when message is empty', () => {
    render(<BroadcastsTab />);
    const btn = screen.getByText(/Send Broadcast/);
    expect(btn).toBeDisabled();
  });

  it('shows user picker when "Specific user" selected', async () => {
    render(<BroadcastsTab />);
    await userEvent.click(screen.getByText('Specific user'));
    expect(screen.getByText('Select user...')).toBeInTheDocument();
    expect(screen.getByText('Priya')).toBeInTheDocument();
    expect(screen.getByText('Ravi')).toBeInTheDocument();
  });

  it('excludes admin from user count and picker', () => {
    render(<BroadcastsTab />);
    // "All users (2)" — admin excluded
    expect(screen.getByText(/All users \(2\)/)).toBeInTheDocument();
  });
});
```

- [x] **Step 2: Run tests**

Run: `bunx vitest run src/admin/components/__tests__/BroadcastsTab.test.tsx`
Expected: PASS — all 4 tests

- [x] **Step 3: Commit**

```bash
git add src/admin/components/__tests__/BroadcastsTab.test.tsx
git commit -m "test: add BroadcastsTab component tests"
```

---

## Task 16: 📋 AdminPanel + UsersTab Updates

**Files:**
- Modify: `src/admin/components/AdminPanel.tsx`
- Modify: `src/admin/components/UsersTab.tsx`

- [x] **Step 1: Add Broadcasts tab to AdminPanel**

Replace full `AdminPanel.tsx`:

```tsx
import { useState } from 'react';

import { InvitesTab } from '@/admin/components/InvitesTab';
import { UsersTab } from '@/admin/components/UsersTab';
import { BroadcastsTab } from '@/admin/components/BroadcastsTab';
import { useAdminNotifications } from '@/admin/hooks/useAdminNotifications';

type AdminTab = 'invites' | 'users' | 'broadcasts';

/** Admin dashboard with Invites, Users, and Broadcasts tabs */
export function AdminPanel() {
  const [activeTab, setActiveTab] = useState<AdminTab>('invites');
  const { unreadCount } = useAdminNotifications();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-fg">Admin</h1>

      <div className="flex gap-1 rounded-lg bg-surface-card border border-line p-1">
        <button
          type="button"
          onClick={() => setActiveTab('invites')}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            activeTab === 'invites' ? 'bg-accent text-fg-on-accent' : 'text-fg-muted hover:text-fg'
          }`}
        >
          Invites
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`relative flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            activeTab === 'users' ? 'bg-accent text-fg-on-accent' : 'text-fg-muted hover:text-fg'
          }`}
        >
          Users
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('broadcasts')}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            activeTab === 'broadcasts' ? 'bg-accent text-fg-on-accent' : 'text-fg-muted hover:text-fg'
          }`}
        >
          📢 Broadcasts
        </button>
      </div>

      {activeTab === 'invites' && <InvitesTab />}
      {activeTab === 'users' && <UsersTab />}
      {activeTab === 'broadcasts' && <BroadcastsTab />}
    </div>
  );
}
```

- [x] **Step 2: Add request badges to UsersTab**

In `UsersTab.tsx`, add import:

```typescript
import { useAdminNotifications } from '@/admin/hooks/useAdminNotifications';
```

Add hook call inside `UsersTab`:

```typescript
const { moduleRequests, approveModuleRequest } = useAdminNotifications();
```

Inside the user row mapping (around line 91, before the role chip), add request badges:

```tsx
                  {/* Module request badges */}
                  {moduleRequests
                    .filter((r) => r.requestedBy === u.uid)
                    .map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          approveModuleRequest(r);
                        }}
                        className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 hover:bg-amber-500/20 transition-colors"
                        title={`Approve ${r.moduleId} for ${u.name}`}
                      >
                        📩 {r.moduleId}
                      </button>
                    ))}
```

- [x] **Step 3: Run type check**

Run: `bun run lint`
Expected: PASS

- [x] **Step 4: Visual verification**

Run: `bun run dev`
Verify: AdminPanel shows 3 tabs. Users tab shows request badges (if any). Broadcasts tab shows compose form.

- [x] **Step 5: Commit**

```bash
git add src/admin/components/AdminPanel.tsx src/admin/components/UsersTab.tsx
git commit -m "feat: add Broadcasts tab to AdminPanel and request badges to UsersTab"
```

---

## Task 17: 🧪 AdminPanel + UsersTab Tests

**Files:**
- Create: `src/admin/components/__tests__/AdminPanel.test.tsx`

- [x] **Step 1: Write tests**

```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminPanel } from '@/admin/components/AdminPanel';

vi.mock('@/admin/hooks/useAdminNotifications', () => ({
  useAdminNotifications: () => ({
    unreadCount: 2,
    moduleRequests: [],
    approveModuleRequest: vi.fn(),
    sendAlert: vi.fn(),
    ready: true,
  }),
}));

vi.mock('@/admin/components/InvitesTab', () => ({
  InvitesTab: () => <div data-testid="invites-tab">Invites</div>,
}));

vi.mock('@/admin/components/UsersTab', () => ({
  UsersTab: () => <div data-testid="users-tab">Users</div>,
}));

vi.mock('@/admin/components/BroadcastsTab', () => ({
  BroadcastsTab: () => <div data-testid="broadcasts-tab">Broadcasts</div>,
}));

describe('AdminPanel', () => {
  it('renders three tab buttons', () => {
    render(<AdminPanel />);
    expect(screen.getByText('Invites')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText(/Broadcasts/)).toBeInTheDocument();
  });

  it('defaults to Invites tab', () => {
    render(<AdminPanel />);
    expect(screen.getByTestId('invites-tab')).toBeInTheDocument();
  });

  it('switches to Users tab', async () => {
    render(<AdminPanel />);
    await userEvent.click(screen.getByText('Users'));
    expect(screen.getByTestId('users-tab')).toBeInTheDocument();
  });

  it('switches to Broadcasts tab', async () => {
    render(<AdminPanel />);
    await userEvent.click(screen.getByText(/Broadcasts/));
    expect(screen.getByTestId('broadcasts-tab')).toBeInTheDocument();
  });

  it('shows unread badge on Users tab', () => {
    render(<AdminPanel />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});
```

- [x] **Step 2: Run tests**

Run: `bunx vitest run src/admin/components/__tests__/AdminPanel.test.tsx`
Expected: PASS — all 5 tests

- [x] **Step 3: Commit**

```bash
git add src/admin/components/__tests__/AdminPanel.test.tsx
git commit -m "test: add AdminPanel tab switching and badge tests"
```

---

## Task 18: 🔒 Firestore Rules

**Files:**
- Modify: `firestore.rules`

- [x] **Step 1: Add notification subcollection rules**

Add within the `match /users/{userId}` block:

```
    // ─── Notifications ────────────────────────────────────────────────
    match /notifications/{notifId} {
      // Anyone can read their own notifications
      allow read: if request.auth.uid == userId;

      // Users can update read/dismissed on their own notifications
      allow update: if request.auth.uid == userId
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['read', 'dismissed']);

      // Any authenticated user can create module_request to admin's notifications
      allow create: if request.auth != null
        && request.resource.data.type == 'module_request';

      // Admin has full write to any user's notifications
      allow write: if isHeadminick();
    }
```

- [x] **Step 2: Add `requestedModules` to profile update rules**

Ensure the profile update rule allows users to write `requestedModules`. In the existing profile match block, add `requestedModules` to the allowed update fields list alongside `theme`, `colorMode`, `name`.

- [x] **Step 3: Commit**

```bash
git add firestore.rules
git commit -m "feat: add Firestore rules for notifications subcollection"
```

---

## Task 19: 📝 CLAUDE.md + CHANGELOG

**Files:**
- Modify: `CLAUDE.md`
- Modify: `CHANGELOG.md`

- [x] **Step 1: Add notification architecture to CLAUDE.md**

Add to the Architecture section:

```markdown
- **Notifications**: Per-user subcollection `users/{uid}/notifications/{id}`. User→admin: module requests (writes to admin's subcollection + own `requestedModules`). Admin→user: alerts/notices with severity, type, and `shownTillDate` expiry. `useNotifications` reads own inbox, `useAdminNotifications` adds send/approve actions. `AlertBanner` renders above header in Layout. CSS swipe-to-delete planned (if needed, switch to `@use-gesture/react` library)
```

- [x] **Step 2: Add CHANGELOG entry**

```markdown
## [Unreleased]

### Added
- 🔔 Per-user notification system (subcollection `notifications`)
- 📨 Module request flow: users request from Profile → admin one-click approves in UsersTab
- 📢 Admin Broadcasts tab: compose alerts with severity, type, and expiry targeting all or specific users
- 🚨 AlertBanner component: color-coded top banners (info/warning/critical) with dismiss support
- `requestedModules` field on UserProfile for tracking pending requests
- Firestore rules for notification read/write/create permissions
```

- [x] **Step 3: Commit**

```bash
git add CLAUDE.md CHANGELOG.md
git commit -m "docs: add notification system architecture and changelog entry"
```

---

## ✅ Completion Checklist

| # | Verification | Command |
|---|-------------|---------|
| 1 | 🔧 Type check passes | `bun run lint` |
| 2 | 🧪 All tests pass | `bun run test` |
| 3 | 👁️ Profile shows Request buttons for disabled modules | Visual check at `/profile` |
| 4 | 👁️ Admin panel has 3 tabs (Invites, Users, Broadcasts) | Visual check at `/admin` |
| 5 | 👁️ No banner when no active alerts | Visual check on any page |
| 6 | 👁️ Banner appears when admin sends alert | End-to-end manual test |
| 7 | 👁️ Request badge shows on UsersTab after user requests | End-to-end manual test |

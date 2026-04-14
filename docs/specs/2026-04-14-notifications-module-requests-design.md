# Notifications & Module Requests Design

**Date:** 2026-04-14
**Status:** Draft
**Branch:** `feat/the-plan-thickens`

## Overview

Two features sharing a per-user notification subcollection:

1. **Module Requests (#7)** — users request modules from their Profile page; admin sees requests in their own notifications and one-click approves
2. **Admin Alerts (#9)** — admin posts alerts/notices to target users; users see a color-coded top banner across all pages

No root broadcast collection. Everything is per-user. "Alert all" = loop-write to every user's notifications subcollection. Future broadcasting/WebSocket push remains compatible with this inbox model.

## Data Model

### New Subcollection: `users/{uid}/notifications/{id}`

```typescript
interface Notification {
  id: string;
  type: 'module_request' | 'admin_alert';

  // Module request fields (user → admin's subcollection)
  moduleId?: ModuleId;
  requestedBy?: string;         // uid of requester
  requestedByName?: string;     // display name (avoids extra lookup)

  // Admin alert fields (admin → user's subcollection)
  message?: string;
  severity?: string;            // drives banner color
  alertType?: 'alert' | 'notice'; // notice = dismissible, alert = persistent until expiry/removal
  shownTillDate?: string;       // YYYY-MM-DD auto-expiry

  // Common
  createdAt: string;            // ISO timestamp
  read: boolean;                // recipient has seen it
  dismissed: boolean;           // recipient actively closed it (Firestore, not localStorage)
}
```

### UserProfile Addition

```typescript
// Add to existing UserProfile interface
requestedModules?: string[];    // ModuleId values the user has requested
```

Dual-write on request: user's own `requestedModules` array (for Profile page UI) + notification entry in admin's subcollection (for admin badge/inbox).

On approve: admin toggles module ON in user's `modules` config, clears the `requestedModules` entry, marks the notification as read.

### Firestore Path

```
users/{uid}/notifications/{notificationId}
```

Follows existing odd-segment-count pattern. Added to `DbSubcollection` enum.

## UI — User Side

### Profile Page: Module Requests

Location: existing read-only Modules section on `ProfilePage.tsx`.

- **Enabled modules**: shown as active chips (current behavior)
- **Disabled modules**: shown as greyed-out chips with a "Request" button
- **Requested modules**: shown with a "Requested" chip (disabled) — derived from `requestedModules` field on own profile, no extra query

Clicking "Request":
1. Writes `module_request` notification to admin's `notifications` subcollection
2. Adds `moduleId` to own `requestedModules` array
3. Button changes to "Requested" (disabled)

### Top Banner: Admin Alerts

Location: above the header, across all pages. Rendered in `Layout.tsx`.

- Reads own `notifications` subcollection
- Filters to `type === 'admin_alert'` where `dismissed === false` and `shownTillDate >= today`
- Color-coded by `severity` field
- `notice` alertType: shows dismiss ✕ button → sets `dismissed: true` on Firestore doc
- `alert` alertType: no dismiss button — only expires via `shownTillDate` or admin removal
- Multiple active alerts stack vertically

## UI — Admin Side

### Broadcasts Tab (new, 3rd tab in AdminPanel)

Tab label: "Broadcasts" (alongside Invites | Users).

**Compose form:**
- Message text input
- Alert type: `alert` / `notice` toggle
- Severity: dropdown — `info` (blue), `warning` (amber), `critical` (red). Extensible enum
- `shownTillDate`: date picker
- Target: "All users" or specific user picker (from `useAllUsers`)

**Active alerts list:**
- Current alerts with expiry dates
- Delete button per alert (removes from all target users' subcollections)

**Expired list:**
- Past alerts (greyed out, for reference)

### UsersTab: Request Badge

- User rows with pending `module_request` notifications show a badge icon
- Badge count derived from admin's own `notifications` subcollection filtered by `type === 'module_request'` and `read === false`
- Clicking badge / request chip → one-click approve:
  1. Toggles module ON in user's `modules` config (existing `updateUserModules`)
  2. Clears entry from user's `requestedModules` array
  3. Marks notification as `read: true` in admin's subcollection

### Admin Notification Indicator

- Badge on admin's profile avatar (in header) showing unread count
- Reads from admin's own `notifications` subcollection
- Count = notifications where `read === false`

## Firestore Rules

```
// Notifications subcollection
match /users/{userId}/notifications/{notifId} {
  // Users can read their own notifications
  allow read: if request.auth.uid == userId;

  // Users can update read/dismissed on their own notifications
  allow update: if request.auth.uid == userId
    && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['read', 'dismissed']);

  // Users can write module_request type to admin's notifications
  allow create: if request.auth != null
    && request.resource.data.type == 'module_request';

  // Admin has full write to any user's notifications
  allow write: if isHeadminick();
}
```

Users cannot write `admin_alert` type — only admin can. Users can only create `module_request` entries (in admin's subcollection) and update `read`/`dismissed` on their own entries.

## Dismissal Model

All on Firestore — no localStorage needed.

- `read: true` — seen (clears badge count)
- `dismissed: true` — actively closed banner (stops rendering)
- `shownTillDate < today` — auto-expired (filtered out on read)

## Future Scope (not in this implementation)

- **Broadcasting**: root `broadcasts` collection, write-once-read-everywhere. Current per-user inbox model remains the delivery layer
- **WebSocket/push**: real-time push instead of Firestore listeners. Inbox model still works
- **Feature requests**: users request new features → notification to admin (same `type` enum, new value)
- **Invite requests**: anonymous users request invites → separate flow (different auth context)
- **Modal/card variants**: `alertType` could drive rendering strategy (banner vs modal vs dashboard card) in future
- **Module-specific alerts**: target alerts to users with specific modules enabled

## Enums & Constants

New additions needed:

```typescript
// DbSubcollection enum
Notifications = 'notifications'

// NotificationType enum (new)
ModuleRequest = 'module_request'
AdminAlert = 'admin_alert'

// AlertType enum (new)
Alert = 'alert'
Notice = 'notice'

// Severity enum (new, extensible)
Info = 'info'         // blue/muted banner
Warning = 'warning'   // amber banner
Critical = 'critical' // red banner

// Messages enum additions
NotificationMsg.ModuleRequested = 'Module requested'
NotificationMsg.ModuleApproved = 'Module enabled'
AdminMsg.AlertCreated = 'Alert sent'
AdminMsg.AlertDeleted = 'Alert removed'
```

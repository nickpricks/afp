# Phase 2e: Admin + Viewer Role

> **Master plan:** [Phase 2 Master](2026-04-06-phase2-master.md)
> **Design Spec:** [Phase 2 Design](../specs/2026-04-06-phase2-design.md)

---

### Task 2e.1: Admin Claim Flow

**Files:**
- Modify: `src/shared/auth/the-admin-nick.ts`
- Create: `src/shared/components/AdminClaim.tsx`

- [x] **Step 1: Build admin claim screen**

Shown when `app/config` doesn't exist. "Claim this app as admin" button → sets `headminickUid` in Firestore → creates admin profile.

- [x] **Step 2: Wire into app startup**

In `AuthProvider` or `App.tsx`: if authenticated but no `app/config` → show `<AdminClaim />`.

- [x] **Step 3: Commit**

```bash
git add src/shared/auth/the-admin-nick.ts src/shared/components/AdminClaim.tsx src/App.tsx
git commit -m "feat(admin): add fresh database admin claim flow"
```

### Task 2e.2: Universal Dashboard

**Files:**
- Create: `src/shared/components/Dashboard.tsx`
- Create: `src/shared/components/DashboardCard.tsx`

- [x] **Step 1: Build Dashboard component**

Role-aware:
- User: shows own data summary cards per enabled module
- Viewer: shows target user's data (reads `profile.viewerOf`, fetches that user's data)
- Admin: user selector dropdown at top, then shows selected user's data

DashboardCard: reusable card component showing module summary (today's stats, last entries).

- [x] **Step 2: Build admin user selector**

Dropdown listing all profiled users (from Firestore `users/` collection query). Admin selects → Dashboard re-renders with that user's data.

- [x] **Step 3: Wire as home route**

`/` and `/dashboard` → `<Dashboard />`.

- [x] **Step 4: Commit**

```bash
git add src/shared/components/Dashboard.tsx src/shared/components/DashboardCard.tsx src/App.tsx
git commit -m "feat(admin): universal dashboard with role-aware data scoping"
```

### Task 2e.3: Viewer Invite Flow

**Files:**
- Modify: `src/shared/auth/invite.ts`
- Modify: `src/admin/components/InviteGenerator.tsx`

- [x] **Step 1: Update invite creation to support viewer role**

Add `role` and `viewerOf` fields to invite creation. InviteGenerator gets:
- Role selector: [User | Viewer]
- If Viewer: "View of" dropdown (lists existing users)
- Module checkboxes (scope what viewer can see)

- [x] **Step 2: Update invite redemption**

When redeeming a viewer invite, copy `viewerOf` to the new user's profile.

- [x] **Step 3: Commit**

```bash
git add src/shared/auth/invite.ts src/admin/components/InviteGenerator.tsx
git commit -m "feat(admin): viewer invite creation with viewerOf scoping"
```

### Task 2e.4: Admin Invites Page

**Files:**
- Modify: `src/admin/components/AdminPanel.tsx`
- Create: `src/admin/components/InvitesPage.tsx`

- [x] **Step 1: Build InvitesPage**

Shows: Create Invite form + list of all invites (pending/redeemed). Actions: Revoke, Delete, Re-send (copy link).

- [x] **Step 2: Wire routing**

`/admin/invites` → `<InvitesPage />`.

- [x] **Step 3: Commit**

```bash
git add src/admin/ src/App.tsx
git commit -m "feat(admin): invites management page with revoke/delete/re-send"
```

### Task 2e.5: Admin Users Page

**Files:**
- Create: `src/admin/components/UsersPage.tsx`

- [x] **Step 1: Build UsersPage**

Lists all profiled users from Firestore. Per user: name, role, modules, last active.
Actions: [View Dashboard] [Edit Role] [Toggle Modules].

- [x] **Step 2: Add anonymous users section (future placeholder)**

Show "Anonymous users listing requires Cloud Function — coming soon" message. Add [Purge Anonymous] button that's disabled with tooltip "Requires Cloud Function setup".

- [x] **Step 3: Wire routing**

`/admin/users` → `<UsersPage />`.

- [x] **Step 4: Commit**

```bash
git add src/admin/components/UsersPage.tsx src/App.tsx
git commit -m "feat(admin): users management page with role/module editing"
```

### Task 2e.6: Admin Permissions Sweep

- [x] **Step 1: Audit every Firestore rule**

Walk through each `match` block in `firestore.rules` and verify:
- `isHeadminick()` is on every collection's read AND write
- Viewer read access uses `isViewerOf(userId)` consistently
- Viewer write access is BLOCKED on all module data collections

- [x] **Step 2: Audit every route guard**

Verify:
- `/admin/*` routes wrapped in `AdminGate`
- Module routes wrapped in `ModuleGate`
- Dashboard handles all 3 roles without crashing

- [x] **Step 3: Document audit results**

Add comment in `firestore.rules` header: "Phase 2 security audit: [date]".

### Task 2e.7: Viewer Role Tests

- [x] **Step 1: Unit test — viewer sees correct data scope**

Test that Dashboard with viewer profile fetches `viewerOf` user's data, not own data.

- [x] **Step 2: Unit test — viewer cannot write**

Mock storage adapter, verify viewer's write attempts are blocked.

- [x] **Step 3: Commit**

```bash
git add src/shared/__tests__/ src/admin/__tests__/
git commit -m "test(admin): viewer role data scoping and write restriction tests"
```

### Task 2e.8: Admin Role Tests

- [x] **Step 1: Unit test — admin user selector works**

Test that admin Dashboard loads user list and switching user changes displayed data.

- [x] **Step 2: Unit test — admin can change user roles**

Test UsersPage role editing updates the target user's profile.

- [x] **Step 3: Commit**

```bash
git add src/admin/__tests__/
git commit -m "test(admin): admin user selector and role management tests"
```

### Task 2e.9: Cross-Role Negative Tests

- [x] **Step 1: Viewer cannot access admin routes**

Test: viewer navigating to `/admin`, `/admin/invites`, `/admin/users` → redirected to `/`.

- [x] **Step 2: User cannot access other user's data**

Test: User A navigating to User B's child detail → access denied or empty data.

- [x] **Step 3: Viewer of User A cannot see User B's data**

Test: viewer with `viewerOf: userA` → fetching userB's data returns empty/error.

- [x] **Step 4: Anonymous user (no profile) cannot access anything**

Test: no profile → all module routes redirect, dashboard shows "invite only" wall.

- [x] **Step 5: Commit**

```bash
git add e2e/ src/
git commit -m "test(admin): cross-role negative tests for unauthorized access"
```

### Task 2e.10: Admin + Viewer Doc Sweep

- [x] **Step 1: Update CLAUDE.md**

Add: viewer role architecture, viewerOf scoping, admin claim flow, universal dashboard, admin pages.

- [x] **Step 2: Update CHANGELOG.md**

- [x] **Step 3: Update README.md docs table**

- [x] **Step 4: Commit**

```bash
git add CLAUDE.md CHANGELOG.md README.md
git commit -m "docs: update for Phase 2e admin + viewer role"
```

---

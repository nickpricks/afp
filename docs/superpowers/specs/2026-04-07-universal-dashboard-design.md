# Universal Dashboard — Design Spec

**Date:** 2026-04-07
**Phase:** 2e (Admin + Viewer)
**Status:** Approved

---

## Overview

Role-aware dashboard accessible via `/` (home). Shows module summary cards scoped to the correct user based on role. Header logo replaces "AFP" text, links to dashboard.

## Roles & Data Scoping

| Role | Data source | Writes | Extra UI |
|------|-------------|--------|----------|
| User | Own `firebaseUser.uid` | Allowed (via module pages) | None |
| Viewer | `profile.viewerOf` uid | No-ops (read-only) | "Viewing {name}'s data" banner |
| TheAdminNick | Selected user's uid (default: own) | No-ops when viewing others | User selector dropdown |

## Architecture: `targetUid` Pattern

Existing hooks gain an optional `uid` parameter:

```typescript
// Before
export function useExpenses() {
  const { firebaseUser } = useAuth();
  const adapter = createAdapter(userPath(firebaseUser.uid));
  // ...
}

// After
export function useExpenses(targetUid?: string) {
  const { firebaseUser } = useAuth();
  const uid = targetUid ?? firebaseUser.uid;
  const readOnly = targetUid != null && targetUid !== firebaseUser.uid;
  const adapter = createAdapter(userPath(uid));
  // Write callbacks are no-ops when readOnly
}
```

**Hooks to update:** `useExpenses`, `useIncome`, `useBodyConfig`, `useBodyData`, `useBabyData` (via `useBabyCollection`).

**SyncStatus:** When `readOnly`, hooks pass a no-op to `setSyncStatus` to avoid polluting the user's own sync indicator.

## Components

### `Dashboard.tsx`
- Reads `profile.role` from `useAuth()`
- Computes `targetUid`:
  - `UserRole.User` → `firebaseUser.uid`
  - `UserRole.Viewer` → `profile.viewerOf`
  - `UserRole.TheAdminNick` → selected user from `useAllUsers()`, default own uid
- Passes `targetUid` to summary hooks
- Renders `DashboardCard` for each enabled module

### `DashboardCard.tsx`
- Props: `title`, `icon` (emoji or element), `metric` (string), `subtitle` (string), `to` (route link)
- Styled card linking to the module page
- Only rendered when `profile.modules[moduleId]` is true

### `useAllUsers()` hook (admin only)
- Queries Firestore `users/` collection for all profiles
- Returns `{ users: UserProfile[], loading: boolean }`
- Used to populate admin user selector dropdown

### Header Update (`Layout.tsx`)
- Replace `<h1>AFP</h1>` with `<Link to="/"><img src="/favicon.png" alt="AFP" class="h-6" /></Link>`
- Tapping logo navigates to Dashboard

## Route Changes

| Before | After |
|--------|-------|
| `/ → Navigate to /body` | `/ → <Dashboard />` |
| No `/dashboard` route | `/dashboard → <Dashboard />` (alias) |

`AppPath.Dashboard` already exists in the enum. Wire it to `<Dashboard />`.

## Dashboard Cards Content

| Module | Metric | Subtitle |
|--------|--------|----------|
| Body | Today's score (from `computeBodyScore`) | "Floors: {up}up / {down}down" |
| Budget | "Spent: {currency}{amount}" | "Remaining: {currency}{remaining}" |
| Baby | Last feed type + time | Child name (first child) |

Cards only show for modules enabled in the target user's profile. When `targetUid` differs from own uid, use the target user's profile for module checks.

## Visual Design (from frontend-design + theme analysis review)

### 1. Greeting Header
Time-of-day greeting above cards adds warmth to a family app:
```html
<h2 class="text-xl font-semibold text-fg">Good afternoon, Nick</h2>
<p class="text-sm text-fg-muted mt-0.5">Monday, April 7</p>
```
Helper: `getGreeting()` returns "Good morning" / "Good afternoon" / "Good evening" based on hour.

### 2. DashboardCard Styling
- `rounded-xl` with `hover:border-accent/40 hover:shadow-md hover:-translate-y-0.5` lift effect
- Left accent border: `border-l-2 border-l-accent` for instrument-panel feel
- `group` wrapper with arrow icon that appears on hover (`opacity-0 group-hover:opacity-100`)
- Hero metric: `text-3xl font-bold text-fg`
- Layout: `grid grid-cols-1 sm:grid-cols-2` (full-width stacked on mobile)

### 3. Viewer Banner
Subtle, not alarming — informational with eye icon:
```html
<div class="flex items-center justify-center gap-2 rounded-lg bg-accent/8 px-4 py-2 mb-4">
  <span class="text-xs">👁</span>
  <span class="text-sm text-accent font-medium">Viewing Sarah's data</span>
</div>
```

### 4. Admin User Selector
Pill-style wrapping a native `<select>` for a11y:
```html
<div class="flex items-center gap-2 rounded-full bg-surface-card border border-line px-3 py-1.5">
  <span class="text-xs text-fg-muted">Viewing</span>
  <select class="bg-transparent text-sm font-medium text-fg appearance-none cursor-pointer">
    <option>My Data</option>
    <option>User Name</option>
  </select>
</div>
```

### 5. Empty State
When no modules enabled:
```html
<div class="text-center py-12">
  <p class="text-4xl mb-3">🏠</p>
  <p class="text-fg font-medium">No modules enabled yet</p>
  <p class="text-sm text-fg-muted mt-1">Ask the admin for access</p>
</div>
```

### 6. Card shadow for depth (from theme analysis)
All Dashboard cards use `shadow-sm` — a subtle improvement that works across all 7 themes. Dark themes get a glow effect, light themes get depth. The rest of the app uses flat cards (`border border-line` only); Dashboard cards are the first to add shadow.
```
rounded-xl border border-line bg-surface-card shadow-sm
```

### 7. Accent-muted tinted metric area (from theme analysis)
The hero metric area inside each DashboardCard uses `bg-[var(--accent-muted)]` — every theme already defines `--accent-muted` (15-20% transparent accent). This gives cards a theme-aware tint automatically:
- Family Blue → light blue wash
- Night City Elevator → cyan tint
- Industrial Furnace → warm orange glow
- Summit Instrument → amber highlight

```html
<div class="rounded-lg bg-[var(--accent-muted)] px-3 py-2">
  <p class="text-3xl font-bold text-fg">42.5</p>
</div>
```

## Files to Create

- `src/shared/components/Dashboard.tsx`
- `src/shared/components/DashboardCard.tsx`
- `src/admin/hooks/useAllUsers.ts`
- `src/shared/components/__tests__/Dashboard.test.tsx`
- `src/admin/hooks/__tests__/useAllUsers.test.ts`

## Files to Modify

- `src/shared/components/Layout.tsx` — logo + link
- `src/App.tsx` — Dashboard route
- `src/modules/expenses/hooks/useExpenses.ts` — targetUid param
- `src/modules/expenses/hooks/useIncome.ts` — targetUid param
- `src/modules/body/hooks/useBodyConfig.ts` — targetUid param
- `src/modules/body/hooks/useBodyData.ts` — targetUid param
- `src/modules/baby/hooks/useBabyCollection.ts` — targetUid param
- `src/constants/routes.ts` — add Dashboard route if missing

## Out of Scope

- Viewer invite creation (Task 2e.3)
- Admin users page (Task 2e.5)
- Admin claim flow (Task 2e.1)
- Cross-role negative tests (Task 2e.9)

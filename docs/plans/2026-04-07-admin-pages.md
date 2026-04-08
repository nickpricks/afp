# Admin Pages (Invites + Users) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build proper admin management pages — an Invites page with revoke/delete/copy-link actions and a Users page with role/module editing. Replace the current inline AdminPanel with a tabbed admin layout.

**Architecture:** AdminPanel becomes a tabbed container (Invites | Users). InviteGenerator moves into the Invites tab with a full invites list. Users tab queries all profiles via `useAllUsers()` and allows role/module toggling via Firestore writes.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Firebase, Vitest

---

### Task 1: Admin Layout with Tabs

**Files:**
- Modify: `src/admin/components/AdminPanel.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// src/admin/__tests__/AdminPanel.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminPanel } from '@/admin/components/AdminPanel';

vi.mock('@/shared/auth/useAuth', () => ({
  useAuth: () => ({
    firebaseUser: { uid: 'admin-user' },
    profile: { role: 'theAdminNick', name: 'Admin', modules: { body: true, budget: true, baby: true } },
    isTheAdminNick: true,
    setSyncStatus: vi.fn(),
  }),
}));

vi.mock('@/shared/errors/useToast', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

vi.mock('@/admin/hooks/useAdmin', () => ({
  useAdmin: () => ({ invites: [] }),
}));

vi.mock('@/admin/hooks/useAllUsers', () => ({
  useAllUsers: () => ({ users: [], loading: false }),
}));

vi.mock('@/shared/storage/create-adapter', () => ({
  createAdapter: () => ({
    getAll: vi.fn(), getById: vi.fn(), save: vi.fn(), remove: vi.fn(),
    onSnapshot: (_c: string, cb: (d: unknown[]) => void) => { cb([]); return vi.fn(); },
  }),
}));

describe('AdminPanel', () => {
  it('shows Invites and Users tabs', () => {
    render(<MemoryRouter><AdminPanel /></MemoryRouter>);
    expect(screen.getByRole('button', { name: 'Invites' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Users' })).toBeInTheDocument();
  });

  it('defaults to Invites tab', () => {
    render(<MemoryRouter><AdminPanel /></MemoryRouter>);
    expect(screen.getByText('Create Invite')).toBeInTheDocument();
  });

  it('switches to Users tab on click', () => {
    render(<MemoryRouter><AdminPanel /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'Users' }));
    expect(screen.getByText(/No users/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx vitest run src/admin/__tests__/AdminPanel.test.tsx`

- [ ] **Step 3: Rewrite AdminPanel as tabbed container**

```typescript
// src/admin/components/AdminPanel.tsx
import { useState } from 'react';
import { InvitesTab } from '@/admin/components/InvitesTab';
import { UsersTab } from '@/admin/components/UsersTab';

type AdminTab = 'invites' | 'users';

/** Admin dashboard with Invites and Users tabs */
export function AdminPanel() {
  const [activeTab, setActiveTab] = useState<AdminTab>('invites');

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
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            activeTab === 'users' ? 'bg-accent text-fg-on-accent' : 'text-fg-muted hover:text-fg'
          }`}
        >
          Users
        </button>
      </div>

      {activeTab === 'invites' && <InvitesTab />}
      {activeTab === 'users' && <UsersTab />}
    </div>
  );
}
```

- [ ] **Step 4: Create stub InvitesTab and UsersTab** (to make it compile — fleshed out in Tasks 2-3)

```typescript
// src/admin/components/InvitesTab.tsx
import { InviteGenerator } from '@/admin/components/InviteGenerator';
import { useAdmin } from '@/admin/hooks/useAdmin';

/** Invites management: create + list with actions */
export function InvitesTab() {
  const { invites } = useAdmin();
  return (
    <div className="space-y-4">
      <InviteGenerator />
      {invites.length === 0 && <p className="text-sm text-fg-muted">No invites yet.</p>}
      {invites.length > 0 && (
        <ul className="divide-y divide-line rounded-xl bg-surface-card border border-line">
          {invites.map((inv) => (
            <li key={inv.code} className="flex items-center justify-between px-4 py-3">
              <span className="text-sm font-medium text-fg">{inv.name}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                inv.linkedUid ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
              }`}>
                {inv.linkedUid ? 'Redeemed' : 'Pending'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// src/admin/components/UsersTab.tsx
import { useAllUsers } from '@/admin/hooks/useAllUsers';

/** Users management: list with role/module editing */
export function UsersTab() {
  const { users, loading } = useAllUsers();
  if (loading) return <p className="text-sm text-fg-muted">Loading users...</p>;
  if (users.length === 0) return <p className="text-sm text-fg-muted">No users found.</p>;
  return (
    <ul className="divide-y divide-line rounded-xl bg-surface-card border border-line">
      {users.map((u) => (
        <li key={u.uid} className="px-4 py-3">
          <span className="text-sm font-medium text-fg">{u.name}</span>
          <span className="ml-2 text-xs text-fg-muted">{u.role}</span>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 5: Run test + full suite**

Run: `bunx vitest run src/admin/__tests__/AdminPanel.test.tsx && bun run test && bunx tsc --noEmit`

- [ ] **Step 6: Commit**

```bash
git add src/admin/
git commit -m "feat(admin): tabbed AdminPanel with InvitesTab and UsersTab stubs"
```

---

### Task 2: Invites Tab — Delete + Copy Link Actions

**Files:**
- Modify: `src/admin/components/InvitesTab.tsx`
- Modify: `src/shared/auth/invite.ts` (add `deleteInvite`)
- Create: `src/admin/__tests__/InvitesTab.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// src/admin/__tests__/InvitesTab.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { InvitesTab } from '@/admin/components/InvitesTab';

const mockInvite = {
  code: 'abc123def456',
  name: 'Test User',
  modules: { body: true, budget: false, baby: false },
  createdBy: 'admin-uid',
  linkedUid: null,
  createdAt: '2026-04-07T00:00:00Z',
  usedAt: null,
};

vi.mock('@/admin/hooks/useAdmin', () => ({
  useAdmin: () => ({ invites: [mockInvite] }),
}));

vi.mock('@/shared/auth/useAuth', () => ({
  useAuth: () => ({ firebaseUser: { uid: 'admin-uid' }, setSyncStatus: vi.fn() }),
}));

vi.mock('@/shared/errors/useToast', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

describe('InvitesTab', () => {
  it('shows invite name and pending status', () => {
    render(<MemoryRouter><InvitesTab /></MemoryRouter>);
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('shows Copy and Delete actions on pending invites', () => {
    render(<MemoryRouter><InvitesTab /></MemoryRouter>);
    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

- [ ] **Step 3: Add `deleteInvite` to `invite.ts`**

```typescript
// Add to src/shared/auth/invite.ts
/** Deletes an invite by code */
export async function deleteInvite(code: string): Promise<Result<void>> {
  if (!isFirebaseConfigured) {
    try {
      const stored = JSON.parse(localStorage.getItem(CONFIG.DEV_INVITES_KEY) ?? '[]') as InviteRecord[];
      const filtered = stored.filter((inv) => inv.code !== code);
      localStorage.setItem(CONFIG.DEV_INVITES_KEY, JSON.stringify(filtered));
      return ok(undefined);
    } catch (e) {
      return err(`Failed to delete invite (dev): ${toErrorMessage(e)}`);
    }
  }

  try {
    await deleteDoc(doc(db, DbCollection.Invites, code));
    return ok(undefined);
  } catch (e) {
    return err(`Failed to delete invite: ${toErrorMessage(e)}`);
  }
}
```

Add `deleteDoc` to the firebase import at top.

- [ ] **Step 4: Update InvitesTab with actions**

Add Copy Link and Delete buttons per invite row. Copy uses `navigator.clipboard.writeText()`. Delete calls `deleteInvite(code)` with confirmation toast.

- [ ] **Step 5: Run tests**

Run: `bunx vitest run src/admin/__tests__/InvitesTab.test.tsx && bun run test`

- [ ] **Step 6: Commit**

```bash
git add src/admin/ src/shared/auth/invite.ts
git commit -m "feat(admin): invites tab with delete and copy-link actions"
```

---

### Task 3: Users Tab — Role Display + Module Toggle

**Files:**
- Modify: `src/admin/components/UsersTab.tsx`
- Create: `src/admin/hooks/useAdminActions.ts`
- Create: `src/admin/__tests__/UsersTab.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// src/admin/__tests__/UsersTab.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UsersTab } from '@/admin/components/UsersTab';

vi.mock('@/admin/hooks/useAllUsers', () => ({
  useAllUsers: () => ({
    users: [
      { uid: 'user-1', name: 'Alice', role: 'user', modules: { body: true, budget: false, baby: false } },
      { uid: 'user-2', name: 'Bob', role: 'viewer', modules: { body: true, budget: true, baby: false }, viewerOf: 'user-1' },
    ],
    loading: false,
  }),
}));

vi.mock('@/shared/errors/useToast', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

vi.mock('@/shared/storage/create-adapter', () => ({
  createAdapter: () => ({
    save: vi.fn().mockResolvedValue({ ok: true }),
    onSnapshot: (_c: string, cb: (d: unknown[]) => void) => { cb([]); return vi.fn(); },
  }),
}));

describe('UsersTab', () => {
  it('lists all users with name and role', () => {
    render(<UsersTab />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('user')).toBeInTheDocument();
    expect(screen.getByText('viewer')).toBeInTheDocument();
  });

  it('shows module badges per user', () => {
    render(<UsersTab />);
    // Alice has body enabled
    const badges = screen.getAllByText('body');
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

- [ ] **Step 3: Create `useAdminActions` hook**

```typescript
// src/admin/hooks/useAdminActions.ts
import { useCallback } from 'react';
import { useToast } from '@/shared/errors/useToast';
import { createAdapter } from '@/shared/storage/create-adapter';
import { userPath, DbSubcollection, DbDoc } from '@/constants/db';
import { isOk } from '@/shared/types';
import type { ModuleConfig, UserRole } from '@/shared/types';

/** Admin actions for managing user profiles */
export function useAdminActions() {
  const { addToast } = useToast();

  /** Updates a user's modules config */
  const updateUserModules = useCallback(
    async (uid: string, modules: ModuleConfig) => {
      const adapter = createAdapter(userPath(uid));
      const result = await adapter.save(DbSubcollection.Profile, {
        id: DbDoc.Main,
        modules,
        updatedAt: new Date().toISOString(),
      });
      if (isOk(result)) {
        addToast('Modules updated', 'success');
      } else {
        addToast(result.error, 'error');
      }
    },
    [addToast],
  );

  /** Updates a user's role */
  const updateUserRole = useCallback(
    async (uid: string, role: UserRole) => {
      const adapter = createAdapter(userPath(uid));
      const result = await adapter.save(DbSubcollection.Profile, {
        id: DbDoc.Main,
        role,
        updatedAt: new Date().toISOString(),
      });
      if (isOk(result)) {
        addToast('Role updated', 'success');
      } else {
        addToast(result.error, 'error');
      }
    },
    [addToast],
  );

  return { updateUserModules, updateUserRole };
}
```

- [ ] **Step 4: Build UsersTab with role display and module badges**

Each user row shows: name, role badge, enabled module chips, expand button for editing.

- [ ] **Step 5: Run tests**

Run: `bunx vitest run src/admin/__tests__/UsersTab.test.tsx && bun run test && bunx tsc --noEmit`

- [ ] **Step 6: Commit**

```bash
git add src/admin/
git commit -m "feat(admin): users tab with role display, module badges, and admin actions"
```

---

### Task 4: Update E2E + Docs

**Files:**
- Modify: `e2e/app.spec.ts`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Update E2E tests for new AdminPanel**

The existing admin E2E tests check for "Create Invite" heading and module checkboxes. These should still work since InvitesTab contains InviteGenerator. Verify and fix if needed.

- [ ] **Step 2: Add E2E test for Users tab**

```typescript
test('Users tab shows on admin page', async ({ page }) => {
  await page.goto('/admin');
  await page.getByRole('button', { name: 'Users' }).click();
  // In dev mode there may be no users — check for empty state
  await expect(page.getByText(/No users|Loading/)).toBeVisible();
});
```

- [ ] **Step 3: Update CHANGELOG**

- [ ] **Step 4: Run all tests**

Run: `bun run test && bunx tsc --noEmit && BASE_URL=http://localhost:3005 bunx playwright test --workers=1`

- [ ] **Step 5: Commit**

```bash
git add e2e/app.spec.ts CHANGELOG.md
git commit -m "feat(admin): admin pages complete — invites management + users management"
```

---

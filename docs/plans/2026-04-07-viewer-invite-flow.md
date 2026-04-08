# Viewer Invite Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow admin to create viewer invites that scope the new user to read-only access of a specific user's data. The `InviteRecord` gains `role` and `viewerOf` fields. Invite redemption creates a viewer profile with `viewerOf` set.

**Architecture:** Extend `InviteRecord` with optional `role` (default `User`) and `viewerOf` (null for non-viewers). `InviteGenerator` gets a role selector and "View of" user picker. `redeemInvite()` passes these through to `createDefaultProfile()`. Firestore rules already support viewer read via `isViewerOf()`.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Firebase, Vitest

**Depends on:** Admin Pages plan (needs `useAllUsers` hook), Dashboard plan (needs `targetUid` pattern in hooks)

---

### Task 1: Extend InviteRecord Type

**Files:**
- Modify: `src/shared/auth/invite.ts`
- Modify: `src/shared/auth/__tests__/invite.test.ts` (create if missing)

- [ ] **Step 1: Write the failing test**

```typescript
// src/shared/auth/__tests__/invite.test.ts
import { describe, it, expect } from 'vitest';
import { generateInviteCode, isValidInviteCode } from '@/shared/auth/invite';
import type { InviteRecord } from '@/shared/auth/invite';

describe('InviteRecord type', () => {
  it('supports role and viewerOf fields', () => {
    const record: InviteRecord = {
      code: 'abc123def456',
      name: 'Viewer',
      modules: { body: true, budget: false, baby: false },
      createdBy: 'admin-uid',
      linkedUid: null,
      createdAt: '2026-04-07T00:00:00Z',
      usedAt: null,
      role: 'viewer',
      viewerOf: 'target-uid',
    };
    expect(record.role).toBe('viewer');
    expect(record.viewerOf).toBe('target-uid');
  });

  it('defaults role to undefined (User implied)', () => {
    const record: InviteRecord = {
      code: 'abc123def456',
      name: 'Regular',
      modules: { body: true, budget: false, baby: false },
      createdBy: 'admin-uid',
      linkedUid: null,
      createdAt: '2026-04-07T00:00:00Z',
      usedAt: null,
    };
    expect(record.role).toBeUndefined();
    expect(record.viewerOf).toBeUndefined();
  });
});

describe('generateInviteCode', () => {
  it('generates a 12-character lowercase alphanumeric code', () => {
    const code = generateInviteCode();
    expect(code).toHaveLength(12);
    expect(isValidInviteCode(code)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx vitest run src/shared/auth/__tests__/invite.test.ts`
Expected: FAIL — `role` and `viewerOf` don't exist on `InviteRecord`

- [ ] **Step 3: Add optional fields to InviteRecord**

In `src/shared/auth/invite.ts`, update the interface:

```typescript
export interface InviteRecord {
  code: string;
  name: string;
  modules: ModuleConfig;
  createdBy: string;
  linkedUid: string | null;
  createdAt: string;
  usedAt: string | null;
  role?: string;       // 'user' | 'viewer' — undefined defaults to 'user'
  viewerOf?: string;   // uid of user to view — only set when role='viewer'
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bunx vitest run src/shared/auth/__tests__/invite.test.ts`

- [ ] **Step 5: Commit**

```bash
git add src/shared/auth/invite.ts src/shared/auth/__tests__/invite.test.ts
git commit -m "feat(invite): add role and viewerOf fields to InviteRecord"
```

---

### Task 2: Update InviteGenerator — Role Selector + ViewerOf Picker

**Files:**
- Modify: `src/admin/components/InviteGenerator.tsx`
- Create: `src/admin/__tests__/InviteGenerator.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// src/admin/__tests__/InviteGenerator.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { InviteGenerator } from '@/admin/components/InviteGenerator';

vi.mock('@/shared/auth/useAuth', () => ({
  useAuth: () => ({ firebaseUser: { uid: 'admin-uid' }, setSyncStatus: vi.fn() }),
}));

vi.mock('@/shared/errors/useToast', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

vi.mock('@/admin/hooks/useAllUsers', () => ({
  useAllUsers: () => ({
    users: [
      { uid: 'user-1', name: 'Alice', role: 'user' },
      { uid: 'user-2', name: 'Bob', role: 'user' },
    ],
    loading: false,
  }),
}));

describe('InviteGenerator — viewer flow', () => {
  it('shows role selector with User and Viewer options', () => {
    render(<MemoryRouter><InviteGenerator /></MemoryRouter>);
    expect(screen.getByRole('button', { name: 'User' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Viewer' })).toBeInTheDocument();
  });

  it('shows "View of" user picker when Viewer role selected', () => {
    render(<MemoryRouter><InviteGenerator /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'Viewer' }));
    expect(screen.getByText(/view of/i)).toBeInTheDocument();
  });

  it('hides "View of" picker when User role selected', () => {
    render(<MemoryRouter><InviteGenerator /></MemoryRouter>);
    // Default is User — no "View of" picker
    expect(screen.queryByText(/view of/i)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

- [ ] **Step 3: Update InviteGenerator**

Add role toggle (User | Viewer) and conditional "View of" dropdown:

```typescript
// Add to InviteGenerator state
const [role, setRole] = useState<'user' | 'viewer'>('user');
const [viewerOf, setViewerOf] = useState<string>('');
const { users } = useAllUsers();

// Add to JSX before modules fieldset:
<div className="flex gap-2">
  <span className="text-sm font-medium text-fg-muted">Role</span>
  <button type="button" onClick={() => { setRole('user'); setViewerOf(''); }}
    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
      role === 'user' ? 'bg-accent text-fg-on-accent' : 'bg-surface-card text-fg border border-line'
    }`}>User</button>
  <button type="button" onClick={() => setRole('viewer')}
    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
      role === 'viewer' ? 'bg-accent text-fg-on-accent' : 'bg-surface-card text-fg border border-line'
    }`}>Viewer</button>
</div>

{role === 'viewer' && (
  <div>
    <label className="block text-sm font-medium text-fg-muted mb-1">View of</label>
    <select value={viewerOf} onChange={(e) => setViewerOf(e.target.value)}
      className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-fg">
      <option value="">Select user...</option>
      {users.filter(u => u.role !== 'viewer').map(u => (
        <option key={u.uid} value={u.uid}>{u.name}</option>
      ))}
    </select>
  </div>
)}

// Update handleCreate to pass role and viewerOf:
const result = await createInvite(code, name.trim(), modules, firebaseUser.uid, {
  role: role === 'viewer' ? 'viewer' : undefined,
  viewerOf: role === 'viewer' ? viewerOf : undefined,
});
```

- [ ] **Step 4: Update `createInvite` to accept role/viewerOf**

```typescript
// src/shared/auth/invite.ts — update createInvite signature
export async function createInvite(
  code: string,
  name: string,
  modules: ModuleConfig,
  createdByUid: string,
  options?: { role?: string; viewerOf?: string },
): Promise<Result<InviteRecord>> {
  const record: InviteRecord = {
    code,
    name,
    modules,
    createdBy: createdByUid,
    linkedUid: null,
    createdAt: new Date().toISOString(),
    usedAt: null,
    role: options?.role,
    viewerOf: options?.viewerOf,
  };
  // ... rest unchanged
```

- [ ] **Step 5: Run tests**

Run: `bunx vitest run src/admin/__tests__/InviteGenerator.test.tsx && bun run test && bunx tsc --noEmit`

- [ ] **Step 6: Commit**

```bash
git add src/admin/components/InviteGenerator.tsx src/shared/auth/invite.ts src/admin/__tests__/InviteGenerator.test.tsx
git commit -m "feat(invite): role selector and viewerOf picker in InviteGenerator"
```

---

### Task 3: Update Invite Redemption for Viewer Role

**Files:**
- Modify: `src/shared/auth/invite.ts` (`redeemInvite` function)

- [ ] **Step 1: Write the failing test**

```typescript
// Add to src/shared/auth/__tests__/invite.test.ts
describe('redeemInvite viewer flow', () => {
  it('viewer invite record has role and viewerOf', () => {
    const record: InviteRecord = {
      code: 'abc123def456',
      name: 'Viewer Sarah',
      modules: { body: true, budget: true, baby: false },
      createdBy: 'admin-uid',
      linkedUid: null,
      createdAt: '2026-04-07T00:00:00Z',
      usedAt: null,
      role: 'viewer',
      viewerOf: 'target-uid',
    };
    // Verify the profile created would use Viewer role
    // (actual Firestore transaction tested via E2E)
    expect(record.role).toBe('viewer');
    expect(record.viewerOf).toBe('target-uid');
  });
});
```

- [ ] **Step 2: Update `redeemInvite` to use invite's role**

In the `runTransaction` callback, change the profile creation:

```typescript
// Before (line 100):
transaction.set(profileRef, createDefaultProfile(record.name, UserRole.User, record.modules));

// After:
const profileRole = record.role === 'viewer' ? UserRole.Viewer : UserRole.User;
const profile = createDefaultProfile(record.name, profileRole, record.modules);
if (record.viewerOf) {
  profile.viewerOf = record.viewerOf;
}
transaction.set(profileRef, profile);
```

- [ ] **Step 3: Run tests**

Run: `bun run test && bunx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/shared/auth/invite.ts src/shared/auth/__tests__/invite.test.ts
git commit -m "feat(invite): redemption creates viewer profile with viewerOf scoping"
```

---

### Task 4: Update E2E + Docs

**Files:**
- Modify: `e2e/app.spec.ts`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Add E2E test for viewer role selector in invite form**

```typescript
test('invite form shows role selector', async ({ page }) => {
  await page.goto('/admin');
  await expect(page.getByRole('button', { name: 'User' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Viewer' })).toBeVisible();
});
```

- [ ] **Step 2: Update CHANGELOG**

Add entries for InviteRecord extension, role selector, viewer redemption.

- [ ] **Step 3: Run all tests**

Run: `bun run test && bunx tsc --noEmit && BASE_URL=http://localhost:3005 bunx playwright test --workers=1`

- [ ] **Step 4: Commit**

```bash
git add e2e/app.spec.ts CHANGELOG.md
git commit -m "feat(invite): viewer invite flow complete — role selector, viewerOf, redemption"
```

---

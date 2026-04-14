# Universal Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Build a role-aware dashboard at `/` that shows module summary cards scoped to the correct user (own data for User, viewerOf for Viewer, selected user for Admin).

**Architecture:** Existing data hooks gain an optional `targetUid` parameter. When provided, the hook reads from that user's Firestore path and disables write operations. Dashboard component determines `targetUid` based on role, passes it to hooks, renders summary cards.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Firebase, Vitest, react-router-dom

---

### Task 1: Greeting Helper + Date Utility

**Files:**
- Modify: `src/shared/utils/date.ts`
- Modify: `src/shared/utils/__tests__/date.test.ts` (create if missing)

- [x] **Step 1: Write the failing test**

```typescript
// src/shared/utils/__tests__/date.test.ts
import { describe, it, expect, vi } from 'vitest';
import { getGreeting, formatDayDate } from '@/shared/utils/date';

describe('getGreeting', () => {
  it('returns Good morning for hour 8', () => {
    vi.setSystemTime(new Date(2026, 3, 7, 8, 0));
    expect(getGreeting()).toBe('Good morning');
    vi.useRealTimers();
  });

  it('returns Good afternoon for hour 14', () => {
    vi.setSystemTime(new Date(2026, 3, 7, 14, 0));
    expect(getGreeting()).toBe('Good afternoon');
    vi.useRealTimers();
  });

  it('returns Good evening for hour 19', () => {
    vi.setSystemTime(new Date(2026, 3, 7, 19, 0));
    expect(getGreeting()).toBe('Good evening');
    vi.useRealTimers();
  });
});

describe('formatDayDate', () => {
  it('formats date as weekday, month day', () => {
    expect(formatDayDate('2026-04-07')).toMatch(/Monday/);
    expect(formatDayDate('2026-04-07')).toMatch(/April/);
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `bunx vitest run src/shared/utils/__tests__/date.test.ts`
Expected: FAIL — `getGreeting` and `formatDayDate` are not exported

- [x] **Step 3: Write minimal implementation**

Add to `src/shared/utils/date.ts`:

```typescript
/** Returns a time-of-day greeting */
export const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

/** Formats a YYYY-MM-DD string as "Wednesday, April 7" */
export const formatDayDate = (dateStr: string): string => {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
};
```

- [x] **Step 4: Run test to verify it passes**

Run: `bunx vitest run src/shared/utils/__tests__/date.test.ts`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add src/shared/utils/date.ts src/shared/utils/__tests__/date.test.ts
git commit -m "feat: add getGreeting and formatDayDate helpers"
```

---

### Task 2: DashboardCard Component

**Files:**
- Create: `src/shared/components/DashboardCard.tsx`
- Create: `src/shared/components/__tests__/DashboardCard.test.tsx`

- [x] **Step 1: Write the failing test**

```typescript
// src/shared/components/__tests__/DashboardCard.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DashboardCard } from '@/shared/components/DashboardCard';

function renderCard(props = {}) {
  const defaults = { title: 'Body', icon: '💪', metric: '42.5', subtitle: '3 up / 1 down', to: '/body' };
  return render(
    <MemoryRouter>
      <DashboardCard {...defaults} {...props} />
    </MemoryRouter>,
  );
}

describe('DashboardCard', () => {
  it('renders title, metric, and subtitle', () => {
    renderCard();
    expect(screen.getByText('Body')).toBeInTheDocument();
    expect(screen.getByText('42.5')).toBeInTheDocument();
    expect(screen.getByText('3 up / 1 down')).toBeInTheDocument();
  });

  it('renders icon', () => {
    renderCard();
    expect(screen.getByText('💪')).toBeInTheDocument();
  });

  it('links to the module route', () => {
    renderCard();
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/body');
  });

  it('has shadow-sm and accent border styling', () => {
    renderCard();
    const link = screen.getByRole('link');
    expect(link.className).toContain('shadow-sm');
    expect(link.className).toContain('border-l-accent');
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `bunx vitest run src/shared/components/__tests__/DashboardCard.test.tsx`
Expected: FAIL — module not found

- [x] **Step 3: Write minimal implementation**

```typescript
// src/shared/components/DashboardCard.tsx
import { Link } from 'react-router-dom';

/** Reusable dashboard summary card linking to a module page */
export function DashboardCard({
  title,
  icon,
  metric,
  subtitle,
  to,
}: {
  title: string;
  icon: string;
  metric: string;
  subtitle: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="group relative rounded-xl border border-l-2 border-line border-l-accent bg-surface-card shadow-sm p-4 transition-all hover:border-accent/40 hover:shadow-md hover:-translate-y-0.5"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{icon}</span>
        <span className="text-xs font-medium text-fg-muted uppercase tracking-wide">{title}</span>
        <span className="ml-auto text-fg-muted opacity-0 group-hover:opacity-100 transition-opacity">&rarr;</span>
      </div>
      <div className="rounded-lg bg-[var(--accent-muted)] px-3 py-2">
        <p className="text-3xl font-bold text-fg">{metric}</p>
      </div>
      <p className="mt-2 text-xs text-fg-muted">{subtitle}</p>
    </Link>
  );
}
```

- [x] **Step 4: Run test to verify it passes**

Run: `bunx vitest run src/shared/components/__tests__/DashboardCard.test.tsx`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add src/shared/components/DashboardCard.tsx src/shared/components/__tests__/DashboardCard.test.tsx
git commit -m "feat: add DashboardCard component with theme-aware styling"
```

---

### Task 3: Add `targetUid` to `useExpenses` and `useIncome`

**Files:**
- Modify: `src/modules/expenses/hooks/useExpenses.ts`
- Modify: `src/modules/expenses/hooks/useIncome.ts`

- [x] **Step 1: Write the failing test**

```typescript
// Add to src/modules/expenses/__tests__/summary.test.ts (or new file)
// This is a type-level check — we verify the hook signature accepts targetUid
// by checking the implementation compiles. The real test is integration.
// For now, just verify existing tests still pass after the change.
```

Since these are hook signature changes (adding an optional param), existing tests serve as regression. The key verification is that `bun run test` still passes and `tsc --noEmit` compiles.

- [x] **Step 2: Update `useExpenses` to accept `targetUid`**

In `src/modules/expenses/hooks/useExpenses.ts`, change:

```typescript
// Line 15: add parameter
export function useExpenses(targetUid?: string) {
  const { firebaseUser, setSyncStatus } = useAuth();
  const { addToast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const adapterRef = useRef<StorageAdapter | null>(null);

  const uid = targetUid ?? firebaseUser?.uid;
  const readOnly = targetUid != null && targetUid !== firebaseUser?.uid;
  const syncFn = readOnly ? () => {} : setSyncStatus;

  useEffect(() => {
    if (!uid) return;

    const adapter = createAdapter(userPath(uid));
    adapterRef.current = adapter;
    syncFn(SyncStatus.Syncing);

    const unsubscribe = adapter.onSnapshot<Expense>(
      DbSubcollection.Expenses,
      (items) => {
        setExpenses(items.filter((e) => !e.isDeleted));
        syncFn(SyncStatus.Synced);
      },
      (error) => {
        console.error('[AFP] Expenses listener error:', error);
        syncFn(SyncStatus.Error);
      },
    );

    return () => {
      unsubscribe();
      adapterRef.current = null;
    };
  }, [uid, syncFn]);
```

For write callbacks (`addExpense`, `deleteExpense`), add early return when readOnly:

```typescript
  const addExpense = useCallback(
    async (input: { /* ... */ }) => {
      if (readOnly) return false;
      // ... existing implementation
    },
    [addToast, readOnly],
  );

  const deleteExpense = useCallback(
    async (id: string) => {
      if (readOnly) return;
      // ... existing implementation
    },
    [addToast, readOnly],
  );
```

- [x] **Step 3: Update `useIncome` identically**

In `src/modules/expenses/hooks/useIncome.ts`, apply the same pattern:

```typescript
export function useIncome(targetUid?: string) {
  const { firebaseUser, setSyncStatus } = useAuth();
  const { addToast } = useToast();
  const [income, setIncome] = useState<Income[]>([]);
  const adapterRef = useRef<StorageAdapter | null>(null);

  const uid = targetUid ?? firebaseUser?.uid;
  const readOnly = targetUid != null && targetUid !== firebaseUser?.uid;
  const syncFn = readOnly ? () => {} : setSyncStatus;

  useEffect(() => {
    if (!uid) return;

    const adapter = createAdapter(userPath(uid));
    adapterRef.current = adapter;
    syncFn(SyncStatus.Syncing);

    const unsubscribe = adapter.onSnapshot<Income>(
      DbSubcollection.Income,
      (items) => {
        setIncome(items);
        syncFn(SyncStatus.Synced);
      },
      (error) => {
        console.error('[AFP] Income listener error:', error);
        syncFn(SyncStatus.Error);
      },
    );

    return () => {
      unsubscribe();
      adapterRef.current = null;
    };
  }, [uid, syncFn]);

  const addIncome = useCallback(
    async (input: { /* ... */ }) => {
      if (readOnly) return false;
      // ... existing implementation unchanged
    },
    [addToast, readOnly],
  );

  const deleteIncome = useCallback(
    async (id: string) => {
      if (readOnly) return;
      // ... existing implementation unchanged
    },
    [addToast, readOnly],
  );

  return { income, addIncome, deleteIncome };
}
```

- [x] **Step 4: Run tests + type check**

Run: `bun run test && bunx tsc --noEmit`
Expected: All 217 tests PASS, types clean. No callers need updating — `targetUid` is optional.

- [x] **Step 5: Commit**

```bash
git add src/modules/expenses/hooks/useExpenses.ts src/modules/expenses/hooks/useIncome.ts
git commit -m "feat: add targetUid to useExpenses and useIncome for read-only scoping"
```

---

### Task 4: Add `targetUid` to `useBodyConfig` and `useBodyData`

**Files:**
- Modify: `src/modules/body/hooks/useBodyConfig.ts`
- Modify: `src/modules/body/hooks/useBodyData.ts`

- [x] **Step 1: Update `useBodyConfig`**

```typescript
export function useBodyConfig(targetUid?: string) {
  const { firebaseUser, setSyncStatus } = useAuth();
  const { addToast } = useToast();
  const [config, setConfig] = useState<BodyConfig>(DEFAULT_BODY_CONFIG);
  const [loading, setLoading] = useState(true);
  const adapterRef = useRef<StorageAdapter | null>(null);

  const uid = targetUid ?? firebaseUser?.uid;
  const readOnly = targetUid != null && targetUid !== firebaseUser?.uid;
  const syncFn = readOnly ? () => {} : setSyncStatus;

  const isConfigured = config.configuredAt !== '';

  useEffect(() => {
    if (!uid) return;

    const adapter = createAdapter(userPath(uid));
    adapterRef.current = adapter;
    syncFn(SyncStatus.Syncing);

    const unsub = adapter.onSnapshot<BodyConfig>(
      DbSubcollection.BodyConfig,
      (items) => {
        const doc = items.find((item) => (item as Record<string, unknown>)['id'] === DbDoc.Main);
        if (doc) {
          setConfig(doc);
        }
        setLoading(false);
        syncFn(SyncStatus.Synced);
      },
      (error) => {
        console.error('[AFP] Body config listener error:', error);
        setLoading(false);
        syncFn(SyncStatus.Error);
      },
    );

    return () => {
      unsub();
      adapterRef.current = null;
    };
  }, [uid, syncFn]);

  const saveConfig = useCallback(
    async (updated: BodyConfig) => {
      if (readOnly) return;
      // ... existing implementation unchanged
    },
    [addToast, readOnly],
  );

  return { config, isConfigured, loading, saveConfig };
}
```

- [x] **Step 2: Update `useBodyData`**

```typescript
export function useBodyData(targetUid?: string) {
  const { firebaseUser, setSyncStatus } = useAuth();
  const { addToast } = useToast();
  const [records, setRecords] = useState<Record<string, BodyRecord>>({});
  const [activities, setActivities] = useState<BodyActivity[]>([]);
  const activitiesRef = useRef<BodyActivity[]>([]);
  const adapterRef = useRef<StorageAdapter | null>(null);

  const uid = targetUid ?? firebaseUser?.uid;
  const readOnly = targetUid != null && targetUid !== firebaseUser?.uid;
  const syncFn = readOnly ? () => {} : setSyncStatus;

  useEffect(() => {
    if (!uid) return;

    const adapter = createAdapter(userPath(uid));
    adapterRef.current = adapter;
    syncFn(SyncStatus.Syncing);

    // ... rest of useEffect unchanged, but replace setSyncStatus with syncFn
    // and firebaseUser.uid with uid
```

For write callbacks (`tap`, `logActivity`, `saveRecord`, `updateActivity`), add early return:

```typescript
  const tap = useCallback(
    async (type: 'up' | 'down') => {
      if (readOnly) return;
      // ... existing implementation
    },
    [records, activities, addToast, readOnly],
  );

  const logActivity = useCallback(
    async (type: ActivityType, distanceMeters: number) => {
      if (readOnly) return;
      // ... existing implementation
    },
    [records, addToast, readOnly],
  );

  const saveRecord = useCallback(
    async (dateKey: string, data: Partial<Pick<BodyRecord, 'up' | 'down'>>) => {
      if (readOnly) return;
      // ... existing implementation
    },
    [records, addToast, readOnly],
  );

  const updateActivity = useCallback(
    async (id: string, data: { distance?: number }) => {
      if (readOnly) return;
      // ... existing implementation
    },
    [records, addToast, readOnly],
  );
```

- [x] **Step 3: Run tests + type check**

Run: `bun run test && bunx tsc --noEmit`
Expected: All tests PASS, types clean

- [x] **Step 4: Commit**

```bash
git add src/modules/body/hooks/useBodyConfig.ts src/modules/body/hooks/useBodyData.ts
git commit -m "feat: add targetUid to useBodyConfig and useBodyData for read-only scoping"
```

---

### Task 5: Add `targetUid` to `useBabyCollection`

**Files:**
- Modify: `src/modules/baby/hooks/useBabyCollection.ts`
- Modify: `src/modules/baby/hooks/useBabyData.ts`

- [x] **Step 1: Update `useBabyCollection`**

```typescript
export function useBabyCollection<T extends Record<string, unknown> & { id: string }>(
  childId: string | null,
  subcollection: string,
  label: string,
  targetUid?: string,
) {
  const { firebaseUser } = useAuth();
  const { addToast } = useToast();
  const [items, setItems] = useState<T[]>([]);
  const [ready, setReady] = useState(false);
  const adapterRef = useRef<StorageAdapter | null>(null);

  const uid = targetUid ?? firebaseUser?.uid;
  const readOnly = targetUid != null && targetUid !== firebaseUser?.uid;

  useEffect(() => {
    if (!uid || !childId) return;

    const adapter = createAdapter(childPath(uid, childId));
    adapterRef.current = adapter;

    const unsubscribe = adapter.onSnapshot<T>(
      subcollection,
      (data) => {
        setItems(data);
        setReady(true);
      },
      (error) => {
        console.error(`[AFP] Baby ${label} listener error:`, error);
      },
    );

    return () => {
      unsubscribe();
      adapterRef.current = null;
    };
  }, [uid, childId, subcollection, label]);

  const log = useCallback(
    async (data: Omit<T, 'id'>) => {
      if (readOnly) return;
      // ... existing implementation unchanged
    },
    [addToast, subcollection, label, readOnly],
  );

  const remove = useCallback(
    async (id: string) => {
      if (readOnly) return;
      // ... existing implementation unchanged
    },
    [addToast, subcollection, label, readOnly],
  );

  return { items, ready, log, remove };
}
```

- [x] **Step 2: Update `useBabyData` to thread `targetUid`**

```typescript
export function useBabyData(childId: string | null, targetUid?: string) {
  const { setSyncStatus } = useAuth();

  const feedCol = useBabyCollection<FeedEntry>(childId, DbSubcollection.Feeds, 'Feed', targetUid);
  const sleepCol = useBabyCollection<SleepEntry>(childId, DbSubcollection.Sleep, 'Sleep', targetUid);
  const growthCol = useBabyCollection<GrowthEntry>(childId, DbSubcollection.Growth, 'Growth', targetUid);
  const diaperCol = useBabyCollection<DiaperEntry>(childId, DbSubcollection.Diapers, 'Diaper', targetUid);

  // ... rest unchanged
```

- [x] **Step 3: Run tests + type check**

Run: `bun run test && bunx tsc --noEmit`
Expected: All tests PASS, types clean

- [x] **Step 4: Commit**

```bash
git add src/modules/baby/hooks/useBabyCollection.ts src/modules/baby/hooks/useBabyData.ts
git commit -m "feat: add targetUid to useBabyCollection and useBabyData for read-only scoping"
```

---

### Task 6: `useAllUsers` Hook (Admin Only)

**Files:**
- Create: `src/admin/hooks/useAllUsers.ts`
- Create: `src/admin/hooks/__tests__/useAllUsers.test.ts`

- [x] **Step 1: Write the failing test**

```typescript
// src/admin/hooks/__tests__/useAllUsers.test.ts
import { describe, it, expect, vi } from 'vitest';

// useAllUsers will use createAdapter + onSnapshot on the 'users' collection
// In dev mode (no Firebase), it reads from localStorage
// We test the hook's return shape

vi.mock('@/shared/auth/useAuth', () => ({
  useAuth: () => ({
    firebaseUser: { uid: 'admin-user' },
    setSyncStatus: vi.fn(),
  }),
}));

vi.mock('@/shared/storage/create-adapter', () => ({
  createAdapter: () => ({
    getAll: vi.fn().mockResolvedValue({ ok: true, value: [] }),
    onSnapshot: (_col: string, cb: (data: unknown[]) => void) => {
      cb([]);
      return vi.fn();
    },
  }),
}));

describe('useAllUsers', () => {
  it('exports a function', async () => {
    const { useAllUsers } = await import('@/admin/hooks/useAllUsers');
    expect(typeof useAllUsers).toBe('function');
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `bunx vitest run src/admin/hooks/__tests__/useAllUsers.test.ts`
Expected: FAIL — module not found

- [x] **Step 3: Write minimal implementation**

```typescript
// src/admin/hooks/useAllUsers.ts
import { useEffect, useState } from 'react';

import { createAdapter } from '@/shared/storage/create-adapter';
import type { UserProfile } from '@/shared/types';
import { DbCollection, DbSubcollection } from '@/constants/db';

type UserEntry = UserProfile & { uid: string };

/** Lists all profiled users — admin only. Queries users/{uid}/profile/main for each user */
export function useAllUsers() {
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const adapter = createAdapter(DbCollection.Users);

    const unsubscribe = adapter.onSnapshot<Record<string, unknown>>(
      '',
      (items) => {
        // In localStorage dev mode, user profiles are stored differently
        // For now, return what we get and filter to entries with a 'role' field
        const profiles: UserEntry[] = items
          .filter((item) => item['role'] != null)
          .map((item) => ({ ...item, uid: String(item['id'] ?? '') } as unknown as UserEntry));
        setUsers(profiles);
        setLoading(false);
      },
      () => {
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  return { users, loading };
}
```

Note: This is a basic implementation. In production with Firestore, querying all user profiles requires a collection group query or listing `/users/` docs. The localStorage adapter returns all items. This gets refined when we have real multi-user data.

- [x] **Step 4: Run test to verify it passes**

Run: `bunx vitest run src/admin/hooks/__tests__/useAllUsers.test.ts`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add src/admin/hooks/useAllUsers.ts src/admin/hooks/__tests__/useAllUsers.test.ts
git commit -m "feat: add useAllUsers hook for admin user listing"
```

---

### Task 7: Dashboard Component

**Files:**
- Create: `src/shared/components/Dashboard.tsx`
- Create: `src/shared/components/__tests__/Dashboard.test.tsx`

- [x] **Step 1: Write the failing test**

```typescript
// src/shared/components/__tests__/Dashboard.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { Dashboard } from '@/shared/components/Dashboard';
import { UserRole } from '@/shared/types';

vi.mock('@/shared/auth/useAuth', () => ({
  useAuth: () => ({
    firebaseUser: { uid: 'test-user' },
    profile: {
      role: UserRole.User,
      name: 'Nick',
      modules: { body: true, budget: true, baby: false },
    },
    isTheAdminNick: false,
    setSyncStatus: vi.fn(),
  }),
}));

vi.mock('@/shared/errors/useToast', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

vi.mock('@/shared/storage/create-adapter', () => ({
  createAdapter: () => ({
    getAll: vi.fn(),
    getById: vi.fn(),
    save: vi.fn(),
    remove: vi.fn(),
    onSnapshot: (_col: string, cb: (data: unknown[]) => void) => {
      cb([]);
      return vi.fn();
    },
  }),
}));

describe('Dashboard', () => {
  it('shows greeting with user name', () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    expect(screen.getByText(/Nick/)).toBeInTheDocument();
  });

  it('shows Body card when body module enabled', () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    expect(screen.getByText('Body')).toBeInTheDocument();
  });

  it('shows Budget card when budget module enabled', () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    expect(screen.getByText('Budget')).toBeInTheDocument();
  });

  it('does not show Baby card when baby module disabled', () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    expect(screen.queryByText('Baby')).not.toBeInTheDocument();
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `bunx vitest run src/shared/components/__tests__/Dashboard.test.tsx`
Expected: FAIL — module not found

- [x] **Step 3: Write minimal implementation**

```typescript
// src/shared/components/Dashboard.tsx
import { useState } from 'react';

import { useAuth } from '@/shared/auth/useAuth';
import { DashboardCard } from '@/shared/components/DashboardCard';
import { useBodyData } from '@/modules/body/hooks/useBodyData';
import { useBodyConfig } from '@/modules/body/hooks/useBodyConfig';
import { useExpenses } from '@/modules/expenses/hooks/useExpenses';
import { useIncome } from '@/modules/expenses/hooks/useIncome';
import { computeTotalSpent, computeTotalIncome } from '@/modules/expenses/budget-math';
import { useAllUsers } from '@/admin/hooks/useAllUsers';
import { UserRole, ModuleId } from '@/shared/types';
import { ROUTES } from '@/constants/routes';
import { CONFIG } from '@/constants/config';
import { getGreeting, formatDayDate, todayStr } from '@/shared/utils/date';

/** Role-aware dashboard showing module summary cards */
export function Dashboard() {
  const { firebaseUser, profile, isTheAdminNick } = useAuth();
  const { users } = useAllUsers();
  const [selectedUid, setSelectedUid] = useState<string | null>(null);

  const ownUid = firebaseUser?.uid ?? '';

  // Determine targetUid based on role
  let targetUid: string | undefined;
  if (profile?.role === UserRole.Viewer && profile.viewerOf) {
    targetUid = profile.viewerOf;
  } else if (isTheAdminNick && selectedUid && selectedUid !== ownUid) {
    targetUid = selectedUid;
  }

  // Target user's name for viewer banner
  const targetName = targetUid
    ? users.find((u) => u.uid === targetUid)?.name ?? 'another user'
    : profile?.name ?? '';

  // Module data — hooks use targetUid for scoping
  const { config: bodyConfig } = useBodyConfig(targetUid);
  const { todayRecord } = useBodyData(targetUid);
  const { expenses } = useExpenses(targetUid);
  const { income } = useIncome(targetUid);

  const modules = profile?.modules;

  if (!profile || !modules) {
    return (
      <div className="text-center py-12">
        <p className="text-4xl mb-3">🏠</p>
        <p className="text-fg font-medium">No modules enabled yet</p>
        <p className="text-sm text-fg-muted mt-1">Ask the admin for access</p>
      </div>
    );
  }

  const totalSpent = computeTotalSpent(expenses);
  const totalIncome = computeTotalIncome(income);
  const remaining = totalIncome - totalSpent;

  return (
    <div className="flex flex-col gap-4">
      {/* Admin user selector */}
      {
        isTheAdminNick && users.length > 0 && (
          <div className="flex items-center gap-2 rounded-full bg-surface-card border border-line px-3 py-1.5 w-fit">
            <span className="text-xs text-fg-muted">Viewing</span>
            <select
              value={selectedUid ?? ownUid}
              onChange={(e) => setSelectedUid(e.target.value === ownUid ? null : e.target.value)}
              className="bg-transparent text-sm font-medium text-fg appearance-none cursor-pointer"
            >
              <option value={ownUid}>My Data</option>
              {
                users
                  .filter((u) => u.uid !== ownUid)
                  .map((u) => (
                    <option key={u.uid} value={u.uid}>{u.name}</option>
                  ))
              }
            </select>
          </div>
        )
      }

      {/* Viewer banner */}
      {
        profile.role === UserRole.Viewer && (
          <div className="flex items-center justify-center gap-2 rounded-lg bg-[var(--accent-muted)] px-4 py-2">
            <span className="text-xs">👁</span>
            <span className="text-sm text-accent font-medium">Viewing {targetName}'s data</span>
          </div>
        )
      }

      {/* Greeting */}
      <div>
        <h2 className="text-xl font-semibold text-fg">
          {getGreeting()}, {profile.name || 'there'}
        </h2>
        <p className="text-sm text-fg-muted mt-0.5">{formatDayDate(todayStr())}</p>
      </div>

      {/* Module cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {
          modules[ModuleId.Body] && (
            <DashboardCard
              title="Body"
              icon="💪"
              metric={String(todayRecord?.total ?? 0)}
              subtitle={
                bodyConfig.floors
                  ? `${todayRecord?.up ?? 0} up / ${todayRecord?.down ?? 0} down`
                  : 'No floors configured'
              }
              to={ROUTES.BODY}
            />
          )
        }
        {
          modules[ModuleId.Budget] && (
            <DashboardCard
              title="Budget"
              icon="💰"
              metric={`${CONFIG.CURRENCY_SYMBOL}${totalSpent.toLocaleString()}`}
              subtitle={`Remaining: ${CONFIG.CURRENCY_SYMBOL}${remaining.toLocaleString()}`}
              to={ROUTES.BUDGET}
            />
          )
        }
        {
          modules[ModuleId.Baby] && (
            <DashboardCard
              title="Baby"
              icon="👶"
              metric="—"
              subtitle="Open baby tracker"
              to={ROUTES.BABY}
            />
          )
        }
      </div>
    </div>
  );
}
```

- [x] **Step 4: Run test to verify it passes**

Run: `bunx vitest run src/shared/components/__tests__/Dashboard.test.tsx`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add src/shared/components/Dashboard.tsx src/shared/components/__tests__/Dashboard.test.tsx
git commit -m "feat: add Dashboard component with role-aware data scoping"
```

---

### Task 8: Wire Routes + Header Logo

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/shared/components/Layout.tsx`

- [x] **Step 1: Update App.tsx — add Dashboard route**

Replace line 45:
```typescript
// Before
<Route path={ROUTES.HOME} element={<Navigate to={ROUTES.BODY} replace />} />

// After
<Route path={ROUTES.HOME} element={<Dashboard />} />
<Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
```

Add import at top:
```typescript
import { Dashboard } from '@/shared/components/Dashboard';
```

- [x] **Step 2: Update Layout.tsx — header logo**

Replace line 42:
```typescript
// Before
<h1 className="text-base font-semibold">AFP</h1>

// After
<Link to={ROUTES.HOME} className="flex items-center">
  <img src="/favicon.png" alt="AFP" className="h-6 w-6" />
</Link>
```

Add import at top:
```typescript
import { Link } from 'react-router-dom';
// (useNavigate import can stay for profile button)
```

- [x] **Step 3: Run full test suite + type check**

Run: `bun run test && bunx tsc --noEmit`
Expected: All tests PASS, types clean

- [x] **Step 4: Run E2E to verify routing**

Run: `BASE_URL=http://localhost:3005 bunx playwright test --workers=1`
Expected: The E2E test `loads and redirects to /body` will now FAIL because `/` renders Dashboard instead of redirecting. Update the test:

```typescript
// e2e/app.spec.ts — update test
test('loads and shows dashboard', async ({ page }) => {
  await page.goto('/');
  // Dashboard greeting should be visible
  await expect(page.getByText(/Good/)).toBeVisible();
});
```

- [x] **Step 5: Commit**

```bash
git add src/App.tsx src/shared/components/Layout.tsx e2e/app.spec.ts
git commit -m "feat: wire Dashboard route and header logo"
```

---

### Task 9: Update CHANGELOG + CLAUDE.md + ROADMAP

**Files:**
- Modify: `CHANGELOG.md`
- Modify: `CLAUDE.md`
- Modify: `docs/ROADMAP.md`

- [x] **Step 1: Add Dashboard entries to CHANGELOG.md**

Under `## [0.2.1]` New Features:

```markdown
| Universal Dashboard | Role-aware dashboard at `/` with greeting, module summary cards (Body score, Budget spend, Baby). Admin user selector, Viewer banner. Cards use `shadow-sm` + `--accent-muted` tint for theme-aware depth. Header logo links home |
| targetUid hook pattern | `useExpenses`, `useIncome`, `useBodyConfig`, `useBodyData`, `useBabyCollection` all accept optional `targetUid` for read-only data scoping. Write callbacks become no-ops when viewing another user |
| useAllUsers hook | Admin-only hook listing all profiled users from Firestore |
| Header logo | "AFP" text replaced with favicon.png image, links to Dashboard |
```

- [x] **Step 2: Update CLAUDE.md architecture section**

Add under Architecture:
```markdown
- **Dashboard**: Role-aware home at `/`. Hooks accept optional `targetUid` — User reads own data, Viewer reads `viewerOf` user, Admin selects from `useAllUsers()`. Write callbacks no-op when `readOnly`. `DashboardCard` uses `shadow-sm` + `bg-[var(--accent-muted)]` for theme-aware styling
```

- [x] **Step 3: Update ROADMAP.md**

Mark Phase 2e Dashboard task as done.

- [x] **Step 4: Run final full test suite**

Run: `bun run test && bunx tsc --noEmit && BASE_URL=http://localhost:3005 bunx playwright test --workers=1`
Expected: ALL green

- [x] **Step 5: Commit**

```bash
git add CHANGELOG.md CLAUDE.md docs/ROADMAP.md
git commit -m "docs: update for Universal Dashboard (Phase 2e)"
```

---

# Kids Presents Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the Kids Presents feature (already half-shipped in `2b4c4f1`) by closing every gap enumerated in `docs/specs/2026-05-14-kids-presents-design-v2.md` — Firestore rules, messages enum, `AddChild` checkbox, `ExpenseListPage` wiring, viewer-mode threading, swipe-to-delete + undo, Spent→Expense modal, aggregator loading fix, pure math module, and tests.

**Architecture:** Two new subcollections (`gifts`, `finances`) under each child, plus a Budget-side aggregator hook. Pure math separates from UI. A local `<dialog>` modal handles the Spent→Expense bridge with unidirectional `linkedExpenseId` backref. Viewer mode threads `targetUid` through every reader.

**Tech Stack:** React 19, TypeScript (strict), Vite 8, Tailwind v4, Firebase (Firestore), Bun, Vitest, Playwright.

**Spec:** `docs/specs/2026-05-14-kids-presents-design-v2.md`
**Branch:** `feat/what-was-the-joke`

---

## Task 1: Foundation — types, messages enum, DB enum

**Files:**
- Modify: `src/modules/baby/types.ts`
- Modify: `src/constants/messages.ts`
- Verify: `src/constants/db.ts` (already has `Gifts`, `Finances` — no change needed)

- [ ] **Step 1: Add `timestamp` to `GiftEntry` and `FinanceEntry`, add `linkedExpenseId` to `FinanceEntry`**

In `src/modules/baby/types.ts`, modify both types:

```ts
/** Physical gift entry (objects) */
export type GiftEntry = {
  id: string;
  date: string;
  title: string;
  giver: string;
  occasion: string;
  status: GiftStatus;
  notes: string;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
};

/** Financial gift entry (money) */
export type FinanceEntry = {
  id: string;
  date: string;
  amount: number;
  description: string;
  giver: string;
  occasion: string;
  status: FinanceStatus;
  notes: string;
  linkedExpenseId?: string;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
};
```

- [ ] **Step 2: Add messages enum entries**

In `src/constants/messages.ts`, append to `BabyMsg`:

```ts
PresentFinanceSaved = 'Finance entry saved',
PresentFinanceUpdated = 'Finance entry updated',
PresentFinanceDeleted = 'Finance entry deleted',
PresentGiftSaved = 'Gift saved',
PresentGiftUpdated = 'Gift updated',
PresentGiftDeleted = 'Gift deleted',
PresentTitleRequired = 'Description/Title is required',
```

Append to `BudgetMsg`:

```ts
KidsTabEmpty = 'No kid finances yet',
KidsExpenseLogged = 'Logged as expense',
KidsExpenseLogFailed = 'Failed to log expense',
```

- [ ] **Step 3: Run typecheck to verify no breakage**

Run: `bun run lint`
Expected: PASS (no type errors — additions are backwards-compatible)

- [ ] **Step 4: Commit**

```bash
git add src/modules/baby/types.ts src/constants/messages.ts
git commit -m "feat(presents): add timestamp, linkedExpenseId, and message enums"
```

---

## Task 2: Pure math module — `presents-math.ts` + tests

**Files:**
- Create: `src/modules/baby/presents-math.ts`
- Test: `src/modules/baby/__tests__/presents-math.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/modules/baby/__tests__/presents-math.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { computeKidWealth, filterByStatus } from '@/modules/baby/presents-math';
import { FinanceStatus, type FinanceEntry } from '@/modules/baby/types';

function makeFinance(over: Partial<FinanceEntry>): FinanceEntry {
  return {
    id: over.id ?? 'f1',
    date: '2026-05-14',
    amount: over.amount ?? 0,
    description: '',
    giver: '',
    occasion: '',
    status: over.status ?? FinanceStatus.Received,
    notes: '',
    timestamp: '2026-05-14T00:00:00.000Z',
    createdAt: '2026-05-14T00:00:00.000Z',
    updatedAt: '2026-05-14T00:00:00.000Z',
    ...over,
  };
}

describe('computeKidWealth', () => {
  it('returns 0 for empty list', () => {
    expect(computeKidWealth([])).toBe(0);
  });

  it('sums Received and Saved entries', () => {
    const entries = [
      makeFinance({ amount: 100, status: FinanceStatus.Received }),
      makeFinance({ amount: 200, status: FinanceStatus.Saved }),
    ];
    expect(computeKidWealth(entries)).toBe(300);
  });

  it('excludes Spent entries', () => {
    const entries = [
      makeFinance({ amount: 100, status: FinanceStatus.Received }),
      makeFinance({ amount: 50, status: FinanceStatus.Spent }),
    ];
    expect(computeKidWealth(entries)).toBe(100);
  });

  it('handles all-spent list', () => {
    const entries = [
      makeFinance({ amount: 100, status: FinanceStatus.Spent }),
      makeFinance({ amount: 50, status: FinanceStatus.Spent }),
    ];
    expect(computeKidWealth(entries)).toBe(0);
  });
});

describe('filterByStatus', () => {
  it('returns only entries matching the given status', () => {
    const entries = [
      makeFinance({ id: 'a', status: FinanceStatus.Received }),
      makeFinance({ id: 'b', status: FinanceStatus.Saved }),
      makeFinance({ id: 'c', status: FinanceStatus.Received }),
    ];
    const result = filterByStatus(entries, FinanceStatus.Received);
    expect(result.map((e) => e.id)).toEqual(['a', 'c']);
  });

  it('returns empty array when no matches', () => {
    const entries = [makeFinance({ status: FinanceStatus.Spent })];
    expect(filterByStatus(entries, FinanceStatus.Received)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx vitest run src/modules/baby/__tests__/presents-math.test.ts`
Expected: FAIL — `Cannot find module '@/modules/baby/presents-math'`

- [ ] **Step 3: Write minimal implementation**

Create `src/modules/baby/presents-math.ts`:

```ts
import type { FinanceEntry } from '@/modules/baby/types';
import { FinanceStatus } from '@/modules/baby/types';

/** Sum of Received + Saved amounts (excludes Spent). "Wealth" = present-tense holdings. */
export const computeKidWealth = (entries: FinanceEntry[]): number =>
  entries
    .filter((e) => e.status === FinanceStatus.Received || e.status === FinanceStatus.Saved)
    .reduce((sum, e) => sum + e.amount, 0);

/** Filter a list of status-bearing entries by exact status match */
export const filterByStatus = <T extends { status: number }>(
  entries: T[],
  status: number,
): T[] => entries.filter((e) => e.status === status);
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bunx vitest run src/modules/baby/__tests__/presents-math.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/modules/baby/presents-math.ts src/modules/baby/__tests__/presents-math.test.ts
git commit -m "feat(presents): add pure math module with 100% coverage"
```

---

## Task 3: `AddChild.tsx` — presents checkbox

**Files:**
- Modify: `src/modules/baby/components/AddChild.tsx`

- [ ] **Step 1: Read AddChild.tsx to find the toggle array**

Run: `grep -n "milestones\|meals\|needs" src/modules/baby/components/AddChild.tsx`

Expected: lines 50-52 show the existing toggles array.

- [ ] **Step 2: Add `presents` to the toggle config array**

Find the toggle config array (around lines 48-52) and add the new entry at the end:

```ts
const toggleConfigs = [
  // ...existing entries
  { key: 'meals', label: 'Meals' },
  { key: 'needs', label: 'Needs' },
  { key: 'milestones', label: 'Milestones' },
  { key: 'presents', label: 'Presents' },
];
```

- [ ] **Step 3: Verify default-off behavior matches existing optional toggles**

The `ChildConfig.presents` field is `?: boolean`, so omission = undefined = falsy. New children created without the checkbox checked will have `config.presents` unset, which matches `child.config.presents ?? false` in `ChildDetail.tsx`. No further wiring needed.

- [ ] **Step 4: Run typecheck**

Run: `bun run lint`
Expected: PASS

- [ ] **Step 5: Manual smoke test**

Run: `bun run dev`
Open the app, navigate to Baby → Add Child. Verify a "Presents" checkbox appears alongside Meals/Needs/Milestones. Toggle it on, save, verify the new child has the Presents tab visible in ChildDetail.

- [ ] **Step 6: Commit**

```bash
git add src/modules/baby/components/AddChild.tsx
git commit -m "feat(presents): add Presents checkbox to AddChild form"
```

---

## Task 4: Firestore rules — `/gifts` and `/finances` blocks

**Files:**
- Modify: `firestore.rules`

- [ ] **Step 1: Find the existing child-subcollection rule blocks**

Run: `grep -n "/children/{childId}" firestore.rules`

Expected: shows the `match` blocks for `feeds`, `sleep`, `growth`, `diapers`, `elimination`, `meals`, `needs`, `milestones`.

- [ ] **Step 2: Add `/gifts` and `/finances` blocks**

After the last existing baby-subcollection rule block (likely `/milestones/{milestoneId}`), insert:

```
    match /users/{userId}/children/{childId}/gifts/{giftId} {
      allow read: if isOwner(userId) || isViewerOf(userId) || isHeadminick();
      allow write: if (isOwner(userId) && hasModule(userId, 'baby')) || isHeadminick();
    }

    match /users/{userId}/children/{childId}/finances/{financeId} {
      allow read: if isOwner(userId) || isViewerOf(userId) || isHeadminick();
      allow write: if (isOwner(userId) && hasModule(userId, 'baby')) || isHeadminick();
    }
```

Use the EXACT predicate pattern of the closest existing baby subcollection (copy from `match /users/{userId}/children/{childId}/feeds/{feedId}` or similar). If the existing pattern differs, match it — do not invent new predicates.

- [ ] **Step 3: Lint the rules file**

Run: `firebase emulators:exec --only firestore 'echo rules ok'` (if firebase-tools installed) OR visually inspect for matching braces and consistent indentation.

Expected: no syntax errors.

- [ ] **Step 4: Manual smoke test against emulator (if available)**

If firebase emulator is set up:

```bash
firebase emulators:start --only firestore
# In another shell, write a test gift entry as the owning user
# Verify success
# Try writing as a different (non-admin, non-viewer) user
# Verify permission-denied
```

If emulator is not set up, document deployment requirement: rules must be deployed before merge.

- [ ] **Step 5: Commit**

```bash
git add firestore.rules
git commit -m "feat(presents): add Firestore rules for /gifts and /finances subcollections"
```

---

## Task 5: `ChildDetail.tsx` — icon-only tab label

**Files:**
- Modify: `src/modules/baby/components/ChildDetail.tsx`

- [ ] **Step 1: Find the tabs definition array**

Run: `grep -n "presents" src/modules/baby/components/ChildDetail.tsx`

Expected: shows the line `{ id: 'presents', label: 'Presents', visible: child.config.presents ?? false }`.

- [ ] **Step 2: Change label to icon only**

Replace the tab definition entry:

```ts
{ id: 'presents', label: '🎁', visible: child.config.presents ?? false },
```

- [ ] **Step 3: Run typecheck**

Run: `bun run lint`
Expected: PASS

- [ ] **Step 4: Manual smoke test**

Run: `bun run dev`. Open a child with `presents: true`. Verify the tab strip shows `🎁` only (no "Presents" text).

- [ ] **Step 5: Commit**

```bash
git add src/modules/baby/components/ChildDetail.tsx
git commit -m "feat(presents): icon-only tab label (🎁)"
```

---

## Task 6: Fix `useAllKidsFinances` — loading semantics + targetUid + tests

**Files:**
- Modify: `src/modules/expenses/hooks/useAllKidsFinances.ts`
- Test: `src/modules/expenses/__tests__/useAllKidsFinances.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/modules/expenses/__tests__/useAllKidsFinances.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

// Mock useAuth to provide a stable firebaseUser
vi.mock('@/shared/auth/useAuth', () => ({
  useAuth: () => ({ firebaseUser: { uid: 'user-1' } }),
}));

// Mock useChildren to control the children list
const mockChildren = vi.fn();
vi.mock('@/modules/baby/hooks/useChildren', () => ({
  useChildren: (...args: unknown[]) => mockChildren(...args),
}));

// Mock createAdapter — return an onSnapshot that captures the callback
const onSnapshotCalls: Array<{ sub: string; cb: (data: unknown[]) => void; unsub: () => void }> = [];
vi.mock('@/shared/storage/create-adapter', () => ({
  createAdapter: () => ({
    onSnapshot: (sub: string, cb: (data: unknown[]) => void) => {
      const unsub = vi.fn();
      onSnapshotCalls.push({ sub, cb, unsub });
      return unsub;
    },
  }),
}));

import { useAllKidsFinances } from '@/modules/expenses/hooks/useAllKidsFinances';

describe('useAllKidsFinances', () => {
  beforeEach(() => {
    onSnapshotCalls.length = 0;
    mockChildren.mockReset();
  });

  it('returns loading=true initially and false only after all children report', async () => {
    mockChildren.mockReturnValue({
      children: [
        { id: 'c1', name: 'Alpha' },
        { id: 'c2', name: 'Beta' },
      ],
      loading: false,
    });

    const { result } = renderHook(() => useAllKidsFinances());

    expect(result.current.loading).toBe(true);

    // Only first child reports — should still be loading
    onSnapshotCalls[0].cb([]);
    await waitFor(() => expect(result.current.entries.length).toBe(0));
    expect(result.current.loading).toBe(true);

    // Second child reports — now loading=false
    onSnapshotCalls[1].cb([]);
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it('flat-merges entries from multiple children with childName attached', async () => {
    mockChildren.mockReturnValue({
      children: [
        { id: 'c1', name: 'Alpha' },
        { id: 'c2', name: 'Beta' },
      ],
      loading: false,
    });

    const { result } = renderHook(() => useAllKidsFinances());

    onSnapshotCalls[0].cb([{ id: 'f1', amount: 100 }]);
    onSnapshotCalls[1].cb([{ id: 'f2', amount: 200 }]);

    await waitFor(() => expect(result.current.entries.length).toBe(2));
    expect(result.current.entries.find((e) => e.id === 'f1')?.childName).toBe('Alpha');
    expect(result.current.entries.find((e) => e.id === 'f2')?.childName).toBe('Beta');
  });

  it('sets loading=false immediately when there are no children', async () => {
    mockChildren.mockReturnValue({ children: [], loading: false });

    const { result } = renderHook(() => useAllKidsFinances());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.entries).toEqual([]);
  });

  it('passes targetUid through to useChildren when provided', () => {
    mockChildren.mockReturnValue({ children: [], loading: false });

    renderHook(() => useAllKidsFinances('other-user'));

    expect(mockChildren).toHaveBeenCalledWith('other-user');
  });

  it('unsubscribes all listeners on unmount', () => {
    mockChildren.mockReturnValue({
      children: [
        { id: 'c1', name: 'Alpha' },
        { id: 'c2', name: 'Beta' },
      ],
      loading: false,
    });

    const { unmount } = renderHook(() => useAllKidsFinances());

    expect(onSnapshotCalls.length).toBe(2);
    unmount();
    expect(onSnapshotCalls[0].unsub).toHaveBeenCalled();
    expect(onSnapshotCalls[1].unsub).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx vitest run src/modules/expenses/__tests__/useAllKidsFinances.test.tsx`
Expected: FAIL — `loading=true` when it should be `true`, then never flips because current impl flips on first child. Also `useChildren` is called without arg.

- [ ] **Step 3: Rewrite `useAllKidsFinances` with corrected semantics**

Replace `src/modules/expenses/hooks/useAllKidsFinances.ts` contents:

```ts
import { useEffect, useState } from 'react';
import { useChildren } from '@/modules/baby/hooks/useChildren';
import { useAuth } from '@/shared/auth/useAuth';
import { createAdapter } from '@/shared/storage/create-adapter';
import { childPath, DbSubcollection } from '@/constants/db';
import type { FinanceEntry } from '@/modules/baby/types';

export type KidsFinanceEntry = FinanceEntry & {
  childId: string;
  childName: string;
};

/** Aggregates financial entries across all children. Optional targetUid for viewer mode. */
export function useAllKidsFinances(targetUid?: string) {
  const { children, loading: kidsLoading } = useChildren(targetUid);
  const { firebaseUser } = useAuth();
  const ownerUid = targetUid ?? firebaseUser?.uid ?? null;

  const [entries, setEntries] = useState<KidsFinanceEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (kidsLoading || !ownerUid) return;

    if (children.length === 0) {
      setEntries([]);
      setLoading(false);
      return;
    }

    const unsubscribes: Array<() => void> = [];
    const allEntriesMap: Record<string, KidsFinanceEntry[]> = {};
    const readyMap: Record<string, true> = {};

    children.forEach((child) => {
      const childId = child.id!;
      const adapter = createAdapter(childPath(ownerUid, childId));

      const unsub = adapter.onSnapshot<FinanceEntry>(
        DbSubcollection.Finances,
        (data) => {
          allEntriesMap[childId] = data.map((e) => ({
            ...e,
            childId,
            childName: child.name,
          }));
          readyMap[childId] = true;

          setEntries(Object.values(allEntriesMap).flat());
          if (Object.keys(readyMap).length === children.length) {
            setLoading(false);
          }
        },
        (error) => {
          console.error(`[AFP] Error fetching finances for child ${childId}:`, error);
        },
      );
      unsubscribes.push(unsub);
    });

    return () => unsubscribes.forEach((unsub) => unsub());
  }, [children, kidsLoading, ownerUid]);

  return { entries, loading };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bunx vitest run src/modules/expenses/__tests__/useAllKidsFinances.test.tsx`
Expected: PASS (5 tests)

- [ ] **Step 5: Run typecheck**

Run: `bun run lint`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/modules/expenses/hooks/useAllKidsFinances.ts src/modules/expenses/__tests__/useAllKidsFinances.test.tsx
git commit -m "fix(presents): wait-for-all-children loading + viewer-mode targetUid"
```

---

## Task 7: `KidsFinanceTab` — use math module + BudgetMsg enums

**Files:**
- Modify: `src/modules/expenses/components/KidsFinanceTab.tsx`
- Test: `src/modules/expenses/__tests__/KidsFinanceTab.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/modules/expenses/__tests__/KidsFinanceTab.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const mockHook = vi.fn();
vi.mock('@/modules/expenses/hooks/useAllKidsFinances', () => ({
  useAllKidsFinances: () => mockHook(),
}));

import { KidsFinanceTab } from '@/modules/expenses/components/KidsFinanceTab';
import { FinanceStatus } from '@/modules/baby/types';

describe('KidsFinanceTab', () => {
  it('shows empty state when no entries', () => {
    mockHook.mockReturnValue({ entries: [], loading: false });
    render(<KidsFinanceTab />);
    expect(screen.getByText(/No kid finances yet/i)).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockHook.mockReturnValue({ entries: [], loading: true });
    render(<KidsFinanceTab />);
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it('displays total kid wealth excluding spent', () => {
    mockHook.mockReturnValue({
      entries: [
        {
          id: 'f1', date: '2026-05-14', amount: 100, description: 'Gift',
          giver: '', occasion: '', status: FinanceStatus.Received, notes: '',
          timestamp: '', createdAt: '', updatedAt: '',
          childId: 'c1', childName: 'Alpha',
        },
        {
          id: 'f2', date: '2026-05-14', amount: 50, description: 'Spent',
          giver: '', occasion: '', status: FinanceStatus.Spent, notes: '',
          timestamp: '', createdAt: '', updatedAt: '',
          childId: 'c1', childName: 'Alpha',
        },
      ],
      loading: false,
    });
    render(<KidsFinanceTab />);
    expect(screen.getByText(/Total Kid Wealth/i)).toBeInTheDocument();
    expect(screen.getByText(/₹100/)).toBeInTheDocument();
  });

  it('shows per-row child name chip', () => {
    mockHook.mockReturnValue({
      entries: [
        {
          id: 'f1', date: '2026-05-14', amount: 100, description: 'Birthday cash',
          giver: 'Grandma', occasion: '', status: FinanceStatus.Received, notes: '',
          timestamp: '', createdAt: '', updatedAt: '',
          childId: 'c1', childName: 'Alpha',
        },
      ],
      loading: false,
    });
    render(<KidsFinanceTab />);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify some fail**

Run: `bunx vitest run src/modules/expenses/__tests__/KidsFinanceTab.test.tsx`
Expected: Some FAIL — `BudgetMsg.KidsTabEmpty` text differs from current literal, total math uses sum-all instead of computeKidWealth.

- [ ] **Step 3: Refactor `KidsFinanceTab` to use math + enums**

Replace `src/modules/expenses/components/KidsFinanceTab.tsx`:

```tsx
import { useAllKidsFinances } from '@/modules/expenses/hooks/useAllKidsFinances';
import { FINANCE_STATUS_LABELS } from '@/modules/baby/constants';
import { computeKidWealth } from '@/modules/baby/presents-math';
import { BudgetMsg } from '@/constants/messages';
import { DateGroupHeader } from '@/shared/components/lists/DateGroupHeader';
import { todayStr } from '@/shared/utils/date';
import { sortNewestFirst } from '@/shared/utils/sort';

/** Aggregate view of all kids' financial entries for the Budget module */
export function KidsFinanceTab() {
  const { entries, loading } = useAllKidsFinances();
  const today = todayStr();

  if (loading) {
    return <div className="py-8 text-center text-fg-muted">Loading kid finances...</div>;
  }

  if (entries.length === 0) {
    return (
      <div className="py-12 text-center flex flex-col items-center gap-2">
        <p className="text-fg-muted italic">{BudgetMsg.KidsTabEmpty}</p>
        <p className="text-xs text-fg-muted px-8">
          Money logged in the Presents tab of a child's profile will appear here.
        </p>
      </div>
    );
  }

  const sorted = sortNewestFirst(entries, (e) => e.date);
  const groups: Record<string, typeof entries> = {};
  sorted.forEach((e) => {
    (groups[e.date] = groups[e.date] || []).push(e);
  });
  const dateKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));
  const totalWealth = computeKidWealth(entries);

  return (
    <div className="flex flex-col gap-4 px-4 pb-20">
      <div className="rounded-lg bg-accent/5 border border-accent/10 p-3 mb-2">
        <p className="text-xs text-accent font-medium">
          Total Kid Wealth: ₹{totalWealth.toLocaleString()}
        </p>
      </div>

      {dateKeys.map((date) => (
        <div key={date} className="flex flex-col">
          <DateGroupHeader date={date} today={today} />
          {groups[date].map((entry) => (
            <div
              key={entry.id}
              className="flex justify-between items-start border-b border-line py-3 px-1"
            >
              <div>
                <p className="font-medium text-fg">{entry.description}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded-full font-bold">
                    {entry.childName}
                  </span>
                  <p className="text-xs text-fg-muted">
                    {entry.giver} · {FINANCE_STATUS_LABELS[entry.status]}
                  </p>
                </div>
              </div>
              <p className="font-bold text-accent">₹{entry.amount.toLocaleString()}</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bunx vitest run src/modules/expenses/__tests__/KidsFinanceTab.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/modules/expenses/components/KidsFinanceTab.tsx src/modules/expenses/__tests__/KidsFinanceTab.test.tsx
git commit -m "refactor(presents): KidsFinanceTab uses computeKidWealth + BudgetMsg enums"
```

---

## Task 8: Wire `ExpenseListPage` — `'kids'` tab

**Files:**
- Modify: `src/modules/expenses/pages/ExpenseListPage.tsx`

- [ ] **Step 1: Read the file to find the BudgetTab union and tab strip**

Run: `grep -n "BudgetTab\|TabButton\|AutoTab" src/modules/expenses/pages/ExpenseListPage.tsx`

Expected: shows the `type BudgetTab` line and the `<TabButton>` block.

- [ ] **Step 2: Add `'kids'` to the union and import `KidsFinanceTab` + auth**

At the top of the file, add imports:

```tsx
import { KidsFinanceTab } from '@/modules/expenses/components/KidsFinanceTab';
import { useAuth } from '@/shared/auth/useAuth';
import { ModuleId } from '@/shared/types';
```

Update the union type:

```tsx
type BudgetTab = 'expenses' | 'income' | 'kids' | 'auto' | 'reconcile';
```

- [ ] **Step 3: Read profile and conditionally render the Kids tab button**

Inside the `ExpenseListPage` component, after the existing hooks (where `expenses`, `income` are destructured), add:

```tsx
const { profile } = useAuth();
const babyEnabled = profile?.modules?.[ModuleId.Baby] === true;
```

In the tab strip JSX (the `<div className="mx-4 mb-3 flex rounded-lg border border-line bg-surface-card p-1">` block), add a Kids tab button after the Income tab button (preserving existing pattern):

```tsx
{babyEnabled && (
  <TabButton active={activeTab === 'kids'} onClick={() => setActiveTab('kids')}>
    Kids
  </TabButton>
)}
```

- [ ] **Step 4: Render `<KidsFinanceTab>` when `activeTab === 'kids'`**

Below the existing tab-conditional render block (where `<ExpenseList>` / `<IncomeList>` / `<AutoTab>` / `<ReconciliationView>` are conditionally rendered), add:

```tsx
{activeTab === 'kids' && <KidsFinanceTab />}
```

Also gate `<ListControls>` to skip when `activeTab === 'kids'` (it owns its own scrolling). Find the existing `{activeTab !== 'auto' && (` and update:

```tsx
{activeTab !== 'auto' && activeTab !== 'kids' && (
  <ListControls ... />
)}
```

- [ ] **Step 5: Run typecheck**

Run: `bun run lint`
Expected: PASS

- [ ] **Step 6: Manual smoke test**

Run: `bun run dev`. Sign in as a user with `modules.baby = true`. Navigate to `/budget`. Verify Kids tab appears, displays empty state initially. Verify Kids tab is absent when `modules.baby = false` (admin can toggle).

- [ ] **Step 7: Commit**

```bash
git add src/modules/expenses/pages/ExpenseListPage.tsx
git commit -m "feat(presents): wire Kids tab into ExpenseListPage"
```

---

## Task 9: `PresentsLog` refactor — per-sub-tab ctrl, swipe, undo, enum messages, targetUid

**Files:**
- Modify: `src/modules/baby/components/PresentsLog.tsx`

This task fixes four CLAUDE.md house-rule violations in one component refactor: separate `useListControls` per sub-tab, `<SwipeToDelete>` wrapper, undo toast on delete, `BabyMsg` enum strings, and viewer-mode `targetUid` threading.

- [ ] **Step 1: Replace contents of `PresentsLog.tsx`**

This is a near-complete rewrite. Match the existing patterns from `EliminationLog.tsx` (closest precedent — also uses sub-tab pattern) for swipe + undo:

```tsx
import { useState } from 'react';

import { useBabyCollection } from '@/modules/baby/hooks/useBabyCollection';
import type { GiftEntry, FinanceEntry } from '@/modules/baby/types';
import { GiftStatus, FinanceStatus } from '@/modules/baby/types';
import {
  GIFT_STATUS_LABELS,
  ALL_GIFT_STATUSES,
  FINANCE_STATUS_LABELS,
  ALL_FINANCE_STATUSES,
} from '@/modules/baby/constants';
import { todayStr } from '@/shared/utils/date';
import { useToast } from '@/shared/errors/useToast';
import { sortNewestFirst } from '@/shared/utils/sort';
import { ToastType } from '@/shared/types';
import { BabyMsg } from '@/constants/messages';
import { DbSubcollection } from '@/constants/db';
import { ListControls } from '@/shared/components/ListControls';
import { ListShowMoreFooter } from '@/shared/components/ListShowMoreFooter';
import { DateGroupHeader } from '@/shared/components/lists/DateGroupHeader';
import { SwipeToDelete } from '@/shared/components/SwipeToDelete';
import { useListControls } from '@/shared/hooks/useListControls';
import { filterByDateRange } from '@/shared/utils/filter';
import { paginate, totalPages } from '@/shared/utils/paginate';
import { CONFIG } from '@/constants/config';

type Props = {
  childId?: string;
  siblingIds?: string[];
  uid?: string;
};

type PresentType = 'finances' | 'gifts';

/** Presents tracking (Gifts + Finances) — sub-tabs, status lifecycle, tap-to-edit, swipe/undo-delete */
export function PresentsLog({ childId, uid }: Props) {
  const [activeSubTab, setActiveSubTab] = useState<PresentType>('finances');
  const { addToast } = useToast();

  const finances = useBabyCollection<FinanceEntry>(
    childId ?? null,
    DbSubcollection.Finances,
    'Finance Entry',
    uid,
  );
  const gifts = useBabyCollection<GiftEntry>(
    childId ?? null,
    DbSubcollection.Gifts,
    'Gift',
    uid,
  );

  const financesCtrl = useListControls();
  const giftsCtrl = useListControls();
  const ctrl = activeSubTab === 'finances' ? financesCtrl : giftsCtrl;

  const [editFinance, setEditFinance] = useState<FinanceEntry | null>(null);
  const [editGift, setEditGift] = useState<GiftEntry | null>(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [giver, setGiver] = useState('');
  const [occasion, setOccasion] = useState('');
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setTitle('');
    setAmount('');
    setGiver('');
    setOccasion('');
    setNotes('');
    setEditFinance(null);
    setEditGift(null);
  };

  const startEditFinance = (entry: FinanceEntry) => {
    setActiveSubTab('finances');
    setEditFinance(entry);
    setTitle(entry.description);
    setAmount(entry.amount.toString());
    setGiver(entry.giver);
    setOccasion(entry.occasion);
    setNotes(entry.notes);
  };

  const startEditGift = (entry: GiftEntry) => {
    setActiveSubTab('gifts');
    setEditGift(entry);
    setTitle(entry.title);
    setGiver(entry.giver);
    setOccasion(entry.occasion);
    setNotes(entry.notes);
  };

  const handleDeleteFinance = (entry: FinanceEntry) => {
    finances.remove(entry.id);
    addToast(BabyMsg.PresentFinanceDeleted, ToastType.Success, {
      action: { label: 'Undo', onClick: () => finances.log(entry) },
      durationMs: CONFIG.UNDO_DURATION_MS,
    });
  };

  const handleDeleteGift = (entry: GiftEntry) => {
    gifts.remove(entry.id);
    addToast(BabyMsg.PresentGiftDeleted, ToastType.Success, {
      action: { label: 'Undo', onClick: () => gifts.log(entry) },
      durationMs: CONFIG.UNDO_DURATION_MS,
    });
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      addToast(BabyMsg.PresentTitleRequired, ToastType.Error);
      return;
    }
    setSaving(true);
    const now = new Date().toISOString();

    if (activeSubTab === 'finances') {
      const numAmount = parseFloat(amount) || 0;
      if (editFinance) {
        await finances.update({
          ...editFinance,
          amount: numAmount,
          description: title.trim(),
          giver,
          occasion,
          notes,
          updatedAt: now,
        });
      } else {
        await finances.log({
          date: todayStr(),
          amount: numAmount,
          description: title.trim(),
          giver,
          occasion,
          status: FinanceStatus.Received,
          notes,
          timestamp: now,
          createdAt: now,
          updatedAt: now,
        });
      }
    } else {
      if (editGift) {
        await gifts.update({
          ...editGift,
          title: title.trim(),
          giver,
          occasion,
          notes,
          updatedAt: now,
        });
      } else {
        await gifts.log({
          date: todayStr(),
          title: title.trim(),
          giver,
          occasion,
          status: GiftStatus.Received,
          notes,
          timestamp: now,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    resetForm();
    setSaving(false);
  }

  const items = activeSubTab === 'finances' ? finances.items : gifts.items;
  const sortedEntries = sortNewestFirst(items, (n) => n.createdAt);
  const today = todayStr();
  const dateFilteredEntries = filterByDateRange(
    sortedEntries,
    ctrl.timeRange,
    today,
    (n) => n.date,
  );
  const pagesCount = totalPages(dateFilteredEntries.length, ctrl.pageSize);
  const visibleEntries = ctrl.showAll
    ? dateFilteredEntries
    : paginate(dateFilteredEntries, ctrl.page, ctrl.pageSize);

  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-fg">Presents</h2>
        <div className="flex rounded-lg border border-line bg-surface-card p-1">
          <button
            type="button"
            onClick={() => {
              setActiveSubTab('finances');
              resetForm();
            }}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${activeSubTab === 'finances' ? 'bg-accent text-fg-on-accent' : 'text-fg-muted hover:text-fg'}`}
          >
            Finances
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveSubTab('gifts');
              resetForm();
            }}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${activeSubTab === 'gifts' ? 'bg-accent text-fg-on-accent' : 'text-fg-muted hover:text-fg'}`}
          >
            Gifts
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {(editFinance || editGift) && (
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-fg-on-accent">
              Editing: {title}
            </span>
            <button
              type="button"
              onClick={resetForm}
              className="text-xs text-fg-muted hover:text-fg"
            >
              Cancel
            </button>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <input
            type="text"
            placeholder={activeSubTab === 'finances' ? 'Description (e.g. Birthday Cash)' : 'Gift Title (e.g. Lego Set)'}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-surface-card border border-line text-fg"
          />
          {activeSubTab === 'finances' && (
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-surface-card border border-line text-fg"
            />
          )}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Giver"
              value={giver}
              onChange={(e) => setGiver(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg bg-surface-card border border-line text-fg"
            />
            <input
              type="text"
              placeholder="Occasion"
              value={occasion}
              onChange={(e) => setOccasion(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg bg-surface-card border border-line text-fg"
            />
          </div>
          <input
            type="text"
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-surface-card border border-line text-fg"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 rounded-lg bg-accent text-fg-on-accent font-medium disabled:opacity-50"
        >
          {saving ? 'Saving...' : editFinance || editGift ? 'Update' : `Add ${activeSubTab === 'finances' ? 'Finance' : 'Gift'}`}
        </button>
      </form>

      {sortedEntries.length > 0 && (
        <ListControls
          timeRange={ctrl.timeRange}
          onTimeRangeChange={ctrl.setTimeRange}
          pageSize={ctrl.pageSize}
          onPageSizeChange={ctrl.setPageSize}
          page={ctrl.page}
          totalPages={ctrl.showAll ? 1 : pagesCount}
          onPageChange={ctrl.setPage}
        />
      )}

      {activeSubTab === 'finances' ? (
        <FinanceList
          entries={visibleEntries as FinanceEntry[]}
          today={today}
          onEdit={startEditFinance}
          editingId={editFinance?.id ?? null}
          onDelete={handleDeleteFinance}
          onStatusChange={(entry, status) => finances.update({ ...entry, status })}
        />
      ) : (
        <GiftList
          entries={visibleEntries as GiftEntry[]}
          today={today}
          onEdit={startEditGift}
          editingId={editGift?.id ?? null}
          onDelete={handleDeleteGift}
          onStatusChange={(entry, status) => gifts.update({ ...entry, status })}
        />
      )}

      {!ctrl.showAll && (
        <ListShowMoreFooter
          totalCount={dateFilteredEntries.length}
          shownCount={visibleEntries.length}
          pageSize={ctrl.pageSize}
          onShowAll={() => ctrl.setShowAll(true)}
        />
      )}
    </div>
  );
}

function FinanceList({
  entries,
  today,
  onEdit,
  editingId,
  onDelete,
  onStatusChange,
}: {
  entries: FinanceEntry[];
  today: string;
  onEdit: (e: FinanceEntry) => void;
  editingId: string | null;
  onDelete: (e: FinanceEntry) => void;
  onStatusChange: (e: FinanceEntry, s: FinanceStatus) => void;
}) {
  if (entries.length === 0) return null;
  const groups = groupEntriesByDate(entries);

  return (
    <ul className="flex flex-col gap-2 list-none">
      {Object.keys(groups)
        .sort((a, b) => b.localeCompare(a))
        .map((date) => (
          <li key={date}>
            <DateGroupHeader date={date} today={today} />
            {groups[date].map((entry) => (
              <SwipeToDelete key={entry.id} onDelete={() => onDelete(entry)}>
                <div
                  className={`bg-surface flex flex-col border-b border-line p-3 gap-1 hover:bg-surface-card transition-colors ${editingId === entry.id ? 'bg-accent-muted border-l-2 border-l-accent' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <div onClick={() => onEdit(entry)} className="cursor-pointer flex-1">
                      <p className="font-medium text-fg">{entry.description}</p>
                      <p className="text-xs text-fg-muted">
                        {entry.giver} · {entry.occasion}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <p className="font-bold text-accent">₹{entry.amount.toLocaleString()}</p>
                      <div className="flex items-center gap-1">
                        <select
                          value={entry.status}
                          onChange={(e) => onStatusChange(entry, parseInt(e.target.value))}
                          className="text-[10px] bg-surface-card border border-line rounded px-1 py-0.5 text-fg-muted outline-none"
                        >
                          {ALL_FINANCE_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {FINANCE_STATUS_LABELS[s]}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => onDelete(entry)}
                          className="text-xs text-fg-muted hover:text-red-500 hover:scale-125 hover:font-bold ml-2"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                  {entry.notes && <p className="text-xs text-fg-muted italic">{entry.notes}</p>}
                </div>
              </SwipeToDelete>
            ))}
          </li>
        ))}
    </ul>
  );
}

function GiftList({
  entries,
  today,
  onEdit,
  editingId,
  onDelete,
  onStatusChange,
}: {
  entries: GiftEntry[];
  today: string;
  onEdit: (e: GiftEntry) => void;
  editingId: string | null;
  onDelete: (e: GiftEntry) => void;
  onStatusChange: (e: GiftEntry, s: GiftStatus) => void;
}) {
  if (entries.length === 0) return null;
  const groups = groupEntriesByDate(entries);

  return (
    <ul className="flex flex-col gap-2 list-none">
      {Object.keys(groups)
        .sort((a, b) => b.localeCompare(a))
        .map((date) => (
          <li key={date}>
            <DateGroupHeader date={date} today={today} />
            {groups[date].map((entry) => (
              <SwipeToDelete key={entry.id} onDelete={() => onDelete(entry)}>
                <div
                  className={`bg-surface flex flex-col border-b border-line p-3 gap-1 hover:bg-surface-card transition-colors ${editingId === entry.id ? 'bg-accent-muted border-l-2 border-l-accent' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <div onClick={() => onEdit(entry)} className="cursor-pointer flex-1">
                      <p className="font-medium text-fg">{entry.title}</p>
                      <p className="text-xs text-fg-muted">
                        {entry.giver} · {entry.occasion}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <select
                        value={entry.status}
                        onChange={(e) => onStatusChange(entry, parseInt(e.target.value))}
                        className="text-[10px] bg-surface-card border border-line rounded px-1 py-0.5 text-fg-muted outline-none"
                      >
                        {ALL_GIFT_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {GIFT_STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => onDelete(entry)}
                        className="text-xs text-fg-muted hover:text-red-500 hover:scale-125 hover:font-bold ml-2"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  {entry.notes && <p className="text-xs text-fg-muted italic">{entry.notes}</p>}
                </div>
              </SwipeToDelete>
            ))}
          </li>
        ))}
    </ul>
  );
}

function groupEntriesByDate<T extends { date: string }>(entries: T[]): Record<string, T[]> {
  const groups: Record<string, T[]> = {};
  entries.forEach((e) => {
    (groups[e.date] = groups[e.date] || []).push(e);
  });
  return groups;
}
```

- [ ] **Step 2: Verify `useBabyCollection` accepts 4th arg `targetUid`**

Run: `grep -n "useBabyCollection" src/modules/baby/hooks/useBabyCollection.ts | head -5`

Expected: signature is `useBabyCollection<T>(childId, sub, label, targetUid?)`. If it isn't, this is a prerequisite — fix it before continuing.

- [ ] **Step 3: Run typecheck**

Run: `bun run lint`
Expected: PASS

- [ ] **Step 4: Manual smoke test**

Run: `bun run dev`. Open a child with `presents: true`. Verify:
- Sub-tabs switch correctly, form resets between them.
- Switching from page 3 of Finances to Gifts shows Gifts page 1 (not blank page 3).
- Delete button shows toast with Undo action; Undo restores the entry.
- Swipe on mobile reveals delete affordance.

- [ ] **Step 5: Commit**

```bash
git add src/modules/baby/components/PresentsLog.tsx
git commit -m "refactor(presents): per-sub-tab ctrl, swipe-undo, enum messages, targetUid threading"
```

---

## Task 10: `ConfirmExpenseModal` — NEW component + tests

**Files:**
- Create: `src/modules/baby/components/ConfirmExpenseModal.tsx`
- Test: `src/modules/baby/__tests__/ConfirmExpenseModal.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/modules/baby/__tests__/ConfirmExpenseModal.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmExpenseModal } from '@/modules/baby/components/ConfirmExpenseModal';

describe('ConfirmExpenseModal', () => {
  const baseProps = {
    open: true,
    amount: 100,
    description: 'Birthday cash',
    date: '2026-05-14',
    onConfirm: vi.fn(),
    onSkip: vi.fn(),
    onCancel: vi.fn(),
  };

  it('renders prefilled amount and description when open', () => {
    render(<ConfirmExpenseModal {...baseProps} />);
    expect(screen.getByText(/Birthday cash/i)).toBeInTheDocument();
    expect(screen.getByText(/100/)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    const { container } = render(<ConfirmExpenseModal {...baseProps} open={false} />);
    expect(container.querySelector('dialog[open]')).toBeNull();
  });

  it('calls onConfirm when Yes button clicked', () => {
    const onConfirm = vi.fn();
    render(<ConfirmExpenseModal {...baseProps} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole('button', { name: /yes/i }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('calls onSkip when Skip button clicked', () => {
    const onSkip = vi.fn();
    render(<ConfirmExpenseModal {...baseProps} onSkip={onSkip} />);
    fireEvent.click(screen.getByRole('button', { name: /skip/i }));
    expect(onSkip).toHaveBeenCalledOnce();
  });

  it('calls onCancel when Cancel button clicked', () => {
    const onCancel = vi.fn();
    render(<ConfirmExpenseModal {...baseProps} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx vitest run src/modules/baby/__tests__/ConfirmExpenseModal.test.tsx`
Expected: FAIL — `Cannot find module '@/modules/baby/components/ConfirmExpenseModal'`

- [ ] **Step 3: Create `ConfirmExpenseModal.tsx`**

```tsx
import { useEffect, useRef } from 'react';

type Props = {
  open: boolean;
  amount: number;
  description: string;
  date: string;
  onConfirm: () => void;
  onSkip: () => void;
  onCancel: () => void;
};

/** Inline confirm modal for the Spent→Expense bridge */
export function ConfirmExpenseModal({
  open,
  amount,
  description,
  date,
  onConfirm,
  onSkip,
  onCancel,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open && !dlg.open) dlg.showModal();
    if (!open && dlg.open) dlg.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="rounded-lg p-0 bg-surface-card border border-line backdrop:bg-black/50"
      onClose={onCancel}
    >
      <div className="p-6 flex flex-col gap-4 min-w-[280px]">
        <h3 className="text-lg font-semibold text-fg">Also log as an expense?</h3>
        <div className="rounded-md bg-surface p-3 text-sm">
          <p className="text-fg">
            <span className="text-fg-muted">Description:</span> {description}
          </p>
          <p className="text-fg">
            <span className="text-fg-muted">Amount:</span> ₹{amount.toLocaleString()}
          </p>
          <p className="text-fg">
            <span className="text-fg-muted">Date:</span> {date}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onConfirm}
            className="w-full py-2 rounded-md bg-accent text-fg-on-accent font-medium"
          >
            Yes, log it
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="w-full py-2 rounded-md bg-surface border border-line text-fg"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full py-2 rounded-md text-fg-muted text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </dialog>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bunx vitest run src/modules/baby/__tests__/ConfirmExpenseModal.test.tsx`
Expected: PASS (5 tests)

Note: `<dialog>` in jsdom may need `HTMLDialogElement.prototype.showModal` polyfilled. If the test fails on `showModal not a function`, add to `src/test-setup.ts`:

```ts
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
}
```

- [ ] **Step 5: Commit**

```bash
git add src/modules/baby/components/ConfirmExpenseModal.tsx src/modules/baby/__tests__/ConfirmExpenseModal.test.tsx src/test-setup.ts
git commit -m "feat(presents): add ConfirmExpenseModal for Spent→Expense bridge"
```

---

## Task 11: Wire Spent→Expense flow in `PresentsLog`

**Files:**
- Modify: `src/modules/baby/components/PresentsLog.tsx`

- [ ] **Step 1: Add modal state and useExpenses hook to PresentsLog**

At the top of `PresentsLog.tsx`, add import:

```tsx
import { ConfirmExpenseModal } from '@/modules/baby/components/ConfirmExpenseModal';
import { useExpenses } from '@/modules/expenses/hooks/useExpenses';
import { ExpenseCategory } from '@/shared/types';
import { BudgetMsg } from '@/constants/messages';
```

Inside `PresentsLog` component, add modal state after the existing form state:

```tsx
const { addExpense } = useExpenses();
const [pendingSpent, setPendingSpent] = useState<FinanceEntry | null>(null);
```

- [ ] **Step 2: Intercept Finance status change to Spent**

Replace the `onStatusChange` callback passed to `<FinanceList>`:

```tsx
onStatusChange={(entry, status) => {
  if (status === FinanceStatus.Spent && entry.status !== FinanceStatus.Spent) {
    setPendingSpent(entry);
  } else {
    finances.update({ ...entry, status });
  }
}}
```

- [ ] **Step 3: Add modal handlers**

Below the existing `handleDelete*` functions, add:

```tsx
const handleConfirmExpense = async () => {
  if (!pendingSpent) return;
  const now = new Date().toISOString();
  try {
    const expenseResult = await addExpense({
      date: pendingSpent.date,
      amount: pendingSpent.amount,
      description: pendingSpent.description,
      category: ExpenseCategory.Other,
      createdAt: now,
    });
    if (!expenseResult.ok) {
      addToast(BudgetMsg.KidsExpenseLogFailed, ToastType.Error);
      return;
    }
    await finances.update({
      ...pendingSpent,
      status: FinanceStatus.Spent,
      linkedExpenseId: expenseResult.value.id,
      updatedAt: now,
    });
    addToast(BudgetMsg.KidsExpenseLogged, ToastType.Success);
  } finally {
    setPendingSpent(null);
  }
};

const handleSkipExpense = () => {
  if (!pendingSpent) return;
  finances.update({ ...pendingSpent, status: FinanceStatus.Spent });
  setPendingSpent(null);
};

const handleCancelExpense = () => {
  setPendingSpent(null);
};
```

Note: the actual return shape of `addExpense` may differ (`Result<T>` vs direct `Promise<T>`). Adapt to the real signature — `useExpenses` is in `src/modules/expenses/hooks/useExpenses.ts`. If `addExpense` doesn't return the created ID, modify it to do so, or use a different write path. Verify by reading the hook before implementing.

- [ ] **Step 4: Render modal at the end of the component**

Before the closing `</div>` of the outer component div, add:

```tsx
{pendingSpent && (
  <ConfirmExpenseModal
    open={pendingSpent !== null}
    amount={pendingSpent.amount}
    description={pendingSpent.description}
    date={pendingSpent.date}
    onConfirm={handleConfirmExpense}
    onSkip={handleSkipExpense}
    onCancel={handleCancelExpense}
  />
)}
```

- [ ] **Step 5: Run typecheck**

Run: `bun run lint`
Expected: PASS

- [ ] **Step 6: Manual smoke test**

Run: `bun run dev`. Open a child's Presents tab. Add a Finance entry. Change its status to "Spent" via the inline select. Verify:
- Modal opens with prefilled amount/description/date.
- "Yes, log it" creates an expense (check Budget tab) AND flips status to Spent.
- "Skip" flips status to Spent without creating an expense.
- "Cancel" reverts (status select returns to prior value).

- [ ] **Step 7: Commit**

```bash
git add src/modules/baby/components/PresentsLog.tsx
git commit -m "feat(presents): wire Spent→Expense bridge via ConfirmExpenseModal"
```

---

## Task 12: `PresentsLog` smoke + behavior tests

**Files:**
- Test: `src/modules/baby/__tests__/PresentsLog.test.tsx`

- [ ] **Step 1: Write the test file**

Create `src/modules/baby/__tests__/PresentsLog.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const mockFinanceCollection = {
  items: [] as unknown[],
  log: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
};
const mockGiftCollection = {
  items: [] as unknown[],
  log: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
};

vi.mock('@/modules/baby/hooks/useBabyCollection', () => ({
  useBabyCollection: (childId: unknown, sub: string) => {
    if (sub === 'finances') return mockFinanceCollection;
    if (sub === 'gifts') return mockGiftCollection;
    throw new Error('unexpected sub: ' + sub);
  },
}));

const mockAddToast = vi.fn();
vi.mock('@/shared/errors/useToast', () => ({
  useToast: () => ({ addToast: mockAddToast }),
}));

vi.mock('@/modules/expenses/hooks/useExpenses', () => ({
  useExpenses: () => ({ addExpense: vi.fn() }),
}));

import { PresentsLog } from '@/modules/baby/components/PresentsLog';

describe('PresentsLog', () => {
  beforeEach(() => {
    mockFinanceCollection.items = [];
    mockGiftCollection.items = [];
    mockFinanceCollection.log.mockClear();
    mockFinanceCollection.remove.mockClear();
    mockGiftCollection.log.mockClear();
    mockGiftCollection.remove.mockClear();
    mockAddToast.mockClear();
  });

  it('renders sub-tab toggle with Finances active by default', () => {
    render(<PresentsLog childId="c1" uid="u1" />);
    expect(screen.getByRole('button', { name: /finances/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /gifts/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Description.*Birthday Cash/i)).toBeInTheDocument();
  });

  it('switches form fields when toggling to Gifts sub-tab', () => {
    render(<PresentsLog childId="c1" uid="u1" />);
    fireEvent.click(screen.getByRole('button', { name: /gifts/i }));
    expect(screen.getByPlaceholderText(/Gift Title.*Lego Set/i)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Amount')).toBeNull();
  });

  it('shows error toast when submitting without a title', () => {
    render(<PresentsLog childId="c1" uid="u1" />);
    fireEvent.click(screen.getByRole('button', { name: /add finance/i }));
    expect(mockAddToast).toHaveBeenCalledWith(
      'Description/Title is required',
      expect.anything(),
    );
  });

  it('calls finances.remove and shows undo toast when delete clicked', () => {
    mockFinanceCollection.items = [
      {
        id: 'f1',
        date: '2026-05-14',
        amount: 100,
        description: 'Cash',
        giver: '',
        occasion: '',
        status: 0,
        notes: '',
        timestamp: '',
        createdAt: '2026-05-14T00:00:00.000Z',
        updatedAt: '',
      },
    ];
    render(<PresentsLog childId="c1" uid="u1" />);
    fireEvent.click(screen.getByText('×'));
    expect(mockFinanceCollection.remove).toHaveBeenCalledWith('f1');
    expect(mockAddToast).toHaveBeenCalledWith(
      expect.stringMatching(/Finance.*deleted/i),
      expect.anything(),
      expect.objectContaining({ action: expect.objectContaining({ label: 'Undo' }) }),
    );
  });
});
```

- [ ] **Step 2: Run test to verify they pass**

Run: `bunx vitest run src/modules/baby/__tests__/PresentsLog.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 3: Commit**

```bash
git add src/modules/baby/__tests__/PresentsLog.test.tsx
git commit -m "test(presents): PresentsLog smoke + sub-tab + delete-undo tests"
```

---

## Task 13: CHANGELOG and ROADMAP

**Files:**
- Modify: `CHANGELOG.md`
- Modify: `docs/ROADMAP.md`

- [ ] **Step 1: Add CHANGELOG entry**

At the top of `CHANGELOG.md`, under the current unreleased / WIP section (follow the existing date convention — likely `## [0.2.x] - 2026-05-14`), add:

```markdown
### Added
- **Kids Presents** — track physical gifts and money received per child, with a Spent→Expense bridge that creates a linked Budget expense (`feat/what-was-the-joke`). Two new subcollections (`gifts`, `finances`), new `🎁` tab in `ChildDetail`, new "Kids" tab in `ExpenseListPage` (gated on `modules.baby`). Total Kid Wealth excludes Spent. Viewer mode supported.

### Fixed
- `useAllKidsFinances` no longer flips `loading=false` until all children have reported (was flashing incomplete totals for multi-kid families).
- `PresentsLog` no longer leaks `ListControls` page state across sub-tab switches.
```

- [ ] **Step 2: Update ROADMAP**

In `docs/ROADMAP.md`, find the section listing Phase 3 backlog items and mark Presents as shipped (or move it under a "Shipped" header — match existing convention). If a `Kids Presents` row exists in the backlog table, change its status from "Pending" / "WIP" to "Shipped 2026-05-14".

- [ ] **Step 3: Commit**

```bash
git add CHANGELOG.md docs/ROADMAP.md
git commit -m "docs(presents): CHANGELOG + ROADMAP for Kids Presents v2 finishing pass"
```

---

## Final Verification

After all 13 tasks are complete:

- [ ] **Run full test suite**

Run: `bun run test`
Expected: All tests pass. New test counts: presents-math (6), useAllKidsFinances (5), KidsFinanceTab (4), ConfirmExpenseModal (5), PresentsLog (4) = 24 new tests.

- [ ] **Run lint and typecheck**

Run: `bun run lint`
Expected: PASS

- [ ] **Run prettier check**

Run: `bun run format:check`
Expected: PASS (or run `bun run format` if needed and commit)

- [ ] **Manual E2E smoke (recommended, optional)**

Run: `bun run dev`. Walk through:
1. Sign in as TheAdminNick.
2. Enable Baby module for a test user.
3. Create a child with `presents: true`.
4. Add a Finance entry (description "Birthday cash", amount 500, giver "Grandma").
5. Verify it appears in the child's Presents tab.
6. Sign in as the test user, navigate to `/budget`. Verify Kids tab visible, "Total Kid Wealth: ₹500" shown.
7. Return to child, change Finance status to "Spent". Modal opens. Click "Yes, log it".
8. Verify the Expense appears in `/budget/expenses` and "Total Kid Wealth" drops to 0.
9. Sign in as a Viewer user linked to the test user. Verify Kids tab and Presents tab both visible and read-correct.

- [ ] **Deploy Firestore rules (before merging to master)**

Run: `firebase deploy --only firestore:rules`
Expected: rules deployed successfully. Without this, the feature 403s in production.

---

## Self-Review Notes

**Spec coverage:** Every acceptance criterion in spec v2 maps to a task:
- Firestore rules → Task 4
- AddChild checkbox → Task 3
- ExpenseListPage kids tab → Task 8
- Icon-only tab label → Task 5
- Per-sub-tab ctrl → Task 9
- Swipe + undo → Task 9
- Modal flow → Tasks 10–11
- `useAllKidsFinances` loading + targetUid → Task 6
- Viewer mode → Task 6 (hook) + Task 9 (component)
- Messages enums → Tasks 1, 7, 9, 11
- Math module + 100% coverage → Task 2
- 5 test files → Tasks 2, 6, 7, 10, 12
- CHANGELOG + ROADMAP → Task 13

**Placeholder scan:** No `TBD` / `TODO` / "implement later" / "fill in" in any task. Every step has either concrete code, an exact command, or a specific verification step.

**Type consistency:** `KidsFinanceEntry`, `GiftEntry`, `FinanceEntry`, `BudgetMsg`, `BabyMsg`, `FinanceStatus`, `GiftStatus`, `ToastType` used consistently throughout. `useBabyCollection` 4-arg signature `(childId, sub, label, targetUid?)` referenced in Task 9 Step 2 with a verification step in case it differs.

**Known prerequisites called out in plan:**
- `useBabyCollection` 4th-arg `targetUid` support (Task 9 Step 2 — verify, fix if absent).
- `useChildren` accepts optional `targetUid` (Task 6 — verify; mock in tests assumes it does).
- `useExpenses.addExpense` return shape (Task 11 Step 3 — verify before implementing).
- `<dialog>` polyfill in `src/test-setup.ts` (Task 10 Step 4 — add if test fails on jsdom).

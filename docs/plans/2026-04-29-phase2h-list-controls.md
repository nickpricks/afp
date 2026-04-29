# Phase 2h — Universal List Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every list view in AFP a consistent control strip with time-range filter, configurable per-page size, page jump, and a contextual "Show all / Load N remaining" footer button.

**Architecture:** Promote Budget's existing pill-row pattern into a shared `<ListControls>` component backed by a `useListControls()` session-state hook. Generalize `filterByDateRange` into a shared utility with a key extractor. Add a `paginate()` primitive and a `<ListShowMoreFooter>` component. Wire foundation into 12 list surfaces across Body, Baby, Budget, and Admin modules without changing the storage layer or any persisted user state.

**Tech Stack:** React 19, TypeScript (strict), Vitest, Tailwind CSS v4. No new dependencies.

---

## Design Decisions Locked

| Decision | Choice | Rationale |
|---|---|---|
| Persistence | Per-list, session state via `useState` (no profile field) | Zero schema migration, zero coupling. Cost: preference resets on reload. |
| Page-size options | `[5, 10, 25, 50, 100, 500]` | Default `25` mirrors current `CONFIG.PAGE_SIZE`. `500` is a power-user escape; rarely fires in practice. |
| Bottom button | Contextual `Show all N records` / `Load N remaining` | Floor-Tracker "Show more" pattern, formalized. Threshold: when hidden ≤ pageSize → "Load N remaining", else "Show all N records". |
| Time-range | Match Budget — `Today / Week (rolling 7d) / Month (rolling 30d) / All`, default `All` | Reuses existing `filterByDateRange` math without a rewrite. Page-size cap protects first-paint perf. |

---

## File Structure

**Files to CREATE:**

| File | Responsibility |
|---|---|
| `src/shared/utils/filter.ts` | Promoted, generalized `filterByDateRange<T>` with key extractor |
| `src/shared/utils/__tests__/filter.test.ts` | Tests for the filter primitive |
| `src/shared/utils/paginate.ts` | `paginate<T>(items, page, pageSize)` primitive + total-page calc helper |
| `src/shared/utils/__tests__/paginate.test.ts` | Tests for paginate |
| `src/shared/hooks/useListControls.ts` | Bundled state hook: `timeRange`, `pageSize`, `page`, `showAll` |
| `src/shared/hooks/__tests__/useListControls.test.ts` | Tests for the hook (state, reset-on-filter-change) |
| `src/shared/components/ListControls.tsx` | Pill row + page-size dropdown + page jumper |
| `src/shared/components/__tests__/ListControls.test.tsx` | Component render + interaction tests |
| `src/shared/components/ListShowMoreFooter.tsx` | Bottom escape-hatch button |
| `src/shared/components/__tests__/ListShowMoreFooter.test.tsx` | Component tests |

**Files to MODIFY:**

| File | Reason |
|---|---|
| `src/shared/types.ts` | Rename `BudgetView` → `TimeRange` |
| `src/shared/__tests__/types.test.ts` | Update enum-rename test references |
| `src/modules/expenses/budget-math.ts` | Remove `filterByDateRange` (now in shared) |
| `src/modules/expenses/types.ts` | Update `BudgetView` import to `TimeRange` |
| `src/modules/expenses/pages/ExpenseListPage.tsx` | Replace inline pill-row with `<ListControls>` |
| `src/modules/body/components/FloorsTab.tsx` | Wire `useListControls` |
| `src/modules/body/components/ActivityLog.tsx` | Wire `useListControls` |
| `src/modules/baby/components/FeedLog.tsx` | Wire `useListControls` |
| `src/modules/baby/components/SleepLog.tsx` | Wire `useListControls` |
| `src/modules/baby/components/GrowthLog.tsx` | Wire `useListControls` |
| `src/modules/baby/components/EliminationLog.tsx` | Wire `useListControls` |
| `src/modules/baby/components/MealsLog.tsx` | Wire `useListControls` |
| `src/modules/baby/components/NeedsLog.tsx` | Wire `useListControls` |
| `src/modules/baby/components/MilestonesLog.tsx` | Wire `useListControls` |
| `src/modules/admin/components/InvitesTab.tsx` | Wire (`createdAt` adapter for non-`date` field) |
| `src/modules/admin/components/BroadcastsTab.tsx` | Wire (`createdAt` adapter) |
| `src/constants/config.ts` | Remove `CONFIG.PAGE_SIZE` (replaced by hook default) |
| `docs/ROADMAP.md` | Fix Phase 2h row typos, fill in step count |
| `CHANGELOG.md` | Add 0.2.15 entry |
| `package.json` | Bump version to 0.2.15 |

---

## Phase A — Foundation

### Task 1: Rename `BudgetView` → `TimeRange`

**Files:**
- Modify: `src/shared/types.ts:134-140`
- Modify: `src/shared/__tests__/types.test.ts:11, 119-124`
- Modify: `src/modules/expenses/types.ts:1, 34`
- Modify: `src/modules/expenses/budget-math.ts:2, 17, 20, 23`
- Modify: `src/modules/expenses/pages/ExpenseListPage.tsx:13, 18-23, 30`

- [ ] **Step 1: Rename the enum in shared/types.ts**

In `src/shared/types.ts`, replace lines 134-140:

```typescript
/** List view timeframe — applies to any list with a date field */
export enum TimeRange {
  Today = 'today',
  Week = 'week',
  Month = 'month',
  All = 'all',
}
```

- [ ] **Step 2: Update the enum test**

In `src/shared/__tests__/types.test.ts`:
- Line 11: change `BudgetView,` to `TimeRange,`
- Lines 119-124: change `describe('BudgetView (string enum)'` to `describe('TimeRange (string enum)'`, and update all `BudgetView.X` references to `TimeRange.X`

- [ ] **Step 3: Update all callsite imports**

Run find-and-replace across the listed callsites (`expenses/types.ts`, `expenses/budget-math.ts`, `expenses/pages/ExpenseListPage.tsx`):

```bash
grep -rln "BudgetView" src/
```

In each match, replace `BudgetView` with `TimeRange`. The `BudgetConfig.defaultView` field type stays the same shape — just the enum name changes.

- [ ] **Step 4: Verify type-check passes**

Run: `bunx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Verify all tests still pass**

Run: `bun run test --run`
Expected: All existing tests pass (renaming is non-behavioral)

- [ ] **Step 6: Commit**

```bash
git add src/shared/types.ts src/shared/__tests__/types.test.ts \
        src/modules/expenses/types.ts src/modules/expenses/budget-math.ts \
        src/modules/expenses/pages/ExpenseListPage.tsx
git commit -m "refactor: rename BudgetView enum to TimeRange for cross-module use"
```

---

### Task 2: Move + generalize `filterByDateRange`

**Files:**
- Create: `src/shared/utils/filter.ts`
- Create: `src/shared/utils/__tests__/filter.test.ts`
- Modify: `src/modules/expenses/budget-math.ts` (remove old impl)
- Modify: `src/modules/expenses/pages/ExpenseListPage.tsx` (update import + add extractor)

- [ ] **Step 1: Write the failing test**

Create `src/shared/utils/__tests__/filter.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { filterByDateRange } from '../filter';
import { TimeRange } from '@/shared/types';

describe('filterByDateRange', () => {
  const today = '2026-04-15';
  const items = [
    { id: 'a', date: '2026-04-15' }, // today
    { id: 'b', date: '2026-04-12' }, // 3 days ago (in week)
    { id: 'c', date: '2026-04-08' }, // 7 days ago (just outside week)
    { id: 'd', date: '2026-03-20' }, // 26 days ago (in month)
    { id: 'e', date: '2026-03-15' }, // 31 days ago (just outside month)
  ];

  it('returns only today when range is Today', () => {
    const result = filterByDateRange(items, TimeRange.Today, today, (i) => i.date);
    expect(result.map((i) => i.id)).toEqual(['a']);
  });

  it('returns last 7 days when range is Week', () => {
    const result = filterByDateRange(items, TimeRange.Week, today, (i) => i.date);
    expect(result.map((i) => i.id)).toEqual(['a', 'b']);
  });

  it('returns last 30 days when range is Month', () => {
    const result = filterByDateRange(items, TimeRange.Month, today, (i) => i.date);
    expect(result.map((i) => i.id)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('returns all items when range is All', () => {
    const result = filterByDateRange(items, TimeRange.All, today, (i) => i.date);
    expect(result).toHaveLength(5);
  });

  it('accepts a custom extractor for non-date-keyed items', () => {
    const isoItems = [
      { id: 'x', createdAt: '2026-04-15T10:00:00.000Z' },
      { id: 'y', createdAt: '2026-04-01T10:00:00.000Z' },
    ];
    const result = filterByDateRange(
      isoItems,
      TimeRange.Week,
      today,
      (i) => i.createdAt.slice(0, 10),
    );
    expect(result.map((i) => i.id)).toEqual(['x']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx vitest run src/shared/utils/__tests__/filter.test.ts`
Expected: FAIL — `Cannot find module '../filter'`

- [ ] **Step 3: Write the implementation**

Create `src/shared/utils/filter.ts`:

```typescript
import { TimeRange } from '@/shared/types';

/**
 * Filters items by a time range relative to a reference date (today).
 * The extractor returns a YYYY-MM-DD date string for each item.
 * Range semantics are rolling: Week = last 7 days incl. today, Month = last 30 days.
 */
export const filterByDateRange = <T>(
  items: T[],
  range: TimeRange,
  today: string,
  getDate: (item: T) => string,
): T[] => {
  if (range === TimeRange.All) return items;

  const todayMs = new Date(today).getTime();
  const daysMap = { [TimeRange.Today]: 0, [TimeRange.Week]: 6, [TimeRange.Month]: 29 };
  const days = daysMap[range];
  const cutoffMs = todayMs - days * 86_400_000;

  return items.filter((item) => {
    const itemMs = new Date(getDate(item)).getTime();
    return itemMs >= cutoffMs && itemMs <= todayMs;
  });
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bunx vitest run src/shared/utils/__tests__/filter.test.ts`
Expected: PASS — 5 tests passing

- [ ] **Step 5: Remove old impl from budget-math.ts**

In `src/modules/expenses/budget-math.ts`, delete lines 14-31 (the old `filterByDateRange` function). Leave the `TimeRange` import if it is still referenced elsewhere in this file; otherwise remove it too.

- [ ] **Step 6: Update budget callsites to use new extractor signature**

In `src/modules/expenses/pages/ExpenseListPage.tsx`:
- Change line 11 from `import { filterByDateRange } from '@/modules/expenses/budget-math';` to `import { filterByDateRange } from '@/shared/utils/filter';`
- Update calls on lines 33-34 from `filterByDateRange(expenses, view, today)` to `filterByDateRange(expenses, view, today, (e) => e.date)` (and same for `income`).

- [ ] **Step 7: Verify all existing tests pass**

Run: `bun run test --run`
Expected: All tests pass (Budget tests still pass because the public behavior is unchanged)

- [ ] **Step 8: Commit**

```bash
git add src/shared/utils/filter.ts src/shared/utils/__tests__/filter.test.ts \
        src/modules/expenses/budget-math.ts src/modules/expenses/pages/ExpenseListPage.tsx
git commit -m "refactor: promote filterByDateRange to shared utils with key extractor"
```

---

### Task 3: Write `paginate()` primitive

**Files:**
- Create: `src/shared/utils/paginate.ts`
- Create: `src/shared/utils/__tests__/paginate.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/shared/utils/__tests__/paginate.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { paginate, totalPages } from '../paginate';

describe('paginate', () => {
  const items = Array.from({ length: 87 }, (_, i) => ({ id: i }));

  it('returns first pageSize items on page 1', () => {
    const result = paginate(items, 1, 25);
    expect(result).toHaveLength(25);
    expect(result[0].id).toBe(0);
    expect(result[24].id).toBe(24);
  });

  it('returns next pageSize items on page 2', () => {
    const result = paginate(items, 2, 25);
    expect(result).toHaveLength(25);
    expect(result[0].id).toBe(25);
  });

  it('returns partial last page', () => {
    const result = paginate(items, 4, 25);
    expect(result).toHaveLength(12);
    expect(result[0].id).toBe(75);
  });

  it('returns empty when page exceeds total', () => {
    expect(paginate(items, 10, 25)).toEqual([]);
  });

  it('returns all items when pageSize >= total', () => {
    expect(paginate(items, 1, 100)).toHaveLength(87);
  });
});

describe('totalPages', () => {
  it('rounds up partial pages', () => {
    expect(totalPages(87, 25)).toBe(4);
  });

  it('handles exact multiples', () => {
    expect(totalPages(50, 25)).toBe(2);
  });

  it('returns 1 for empty list (no zero pages)', () => {
    expect(totalPages(0, 25)).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx vitest run src/shared/utils/__tests__/paginate.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

Create `src/shared/utils/paginate.ts`:

```typescript
/** Returns the slice of items for the given 1-indexed page and pageSize */
export const paginate = <T>(items: T[], page: number, pageSize: number): T[] => {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
};

/** Returns the total number of pages, minimum 1 (for empty lists) */
export const totalPages = (totalItems: number, pageSize: number): number => {
  if (totalItems === 0) return 1;
  return Math.ceil(totalItems / pageSize);
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bunx vitest run src/shared/utils/__tests__/paginate.test.ts`
Expected: PASS — 8 tests passing

- [ ] **Step 5: Commit**

```bash
git add src/shared/utils/paginate.ts src/shared/utils/__tests__/paginate.test.ts
git commit -m "feat: add paginate primitive for shared list controls"
```

---

### Task 4: Write `useListControls` hook

**Files:**
- Create: `src/shared/hooks/useListControls.ts`
- Create: `src/shared/hooks/__tests__/useListControls.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/shared/hooks/__tests__/useListControls.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useListControls } from '../useListControls';
import { TimeRange } from '@/shared/types';

describe('useListControls', () => {
  it('initializes with All range, pageSize 25, page 1, showAll false', () => {
    const { result } = renderHook(() => useListControls());
    expect(result.current.timeRange).toBe(TimeRange.All);
    expect(result.current.pageSize).toBe(25);
    expect(result.current.page).toBe(1);
    expect(result.current.showAll).toBe(false);
  });

  it('accepts custom defaults', () => {
    const { result } = renderHook(() =>
      useListControls({ timeRange: TimeRange.Month, pageSize: 50 }),
    );
    expect(result.current.timeRange).toBe(TimeRange.Month);
    expect(result.current.pageSize).toBe(50);
  });

  it('resets page to 1 when timeRange changes', () => {
    const { result } = renderHook(() => useListControls());
    act(() => result.current.setPage(5));
    expect(result.current.page).toBe(5);

    act(() => result.current.setTimeRange(TimeRange.Week));
    expect(result.current.page).toBe(1);
  });

  it('resets page to 1 when pageSize changes', () => {
    const { result } = renderHook(() => useListControls());
    act(() => result.current.setPage(3));

    act(() => result.current.setPageSize(50));
    expect(result.current.page).toBe(1);
  });

  it('resets showAll to false when timeRange changes', () => {
    const { result } = renderHook(() => useListControls());
    act(() => result.current.setShowAll(true));
    expect(result.current.showAll).toBe(true);

    act(() => result.current.setTimeRange(TimeRange.Week));
    expect(result.current.showAll).toBe(false);
  });

  it('keeps showAll when only page changes', () => {
    const { result } = renderHook(() => useListControls());
    act(() => result.current.setShowAll(true));
    act(() => result.current.setPage(2));
    expect(result.current.showAll).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx vitest run src/shared/hooks/__tests__/useListControls.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

Create `src/shared/hooks/useListControls.ts`:

```typescript
import { useEffect, useState } from 'react';
import { TimeRange } from '@/shared/types';

export interface ListControlsState {
  timeRange: TimeRange;
  pageSize: number;
  page: number;
  showAll: boolean;
}

export interface ListControlsHandle extends ListControlsState {
  setTimeRange: (range: TimeRange) => void;
  setPageSize: (size: number) => void;
  setPage: (page: number) => void;
  setShowAll: (showAll: boolean) => void;
}

/** Bundled session state for list controls. Per-list, never persisted. */
export function useListControls(defaults?: Partial<ListControlsState>): ListControlsHandle {
  const [timeRange, setTimeRange] = useState<TimeRange>(defaults?.timeRange ?? TimeRange.All);
  const [pageSize, setPageSize] = useState<number>(defaults?.pageSize ?? 25);
  const [page, setPage] = useState<number>(defaults?.page ?? 1);
  const [showAll, setShowAll] = useState<boolean>(defaults?.showAll ?? false);

  useEffect(() => {
    setPage(1);
    setShowAll(false);
  }, [timeRange]);

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  return { timeRange, pageSize, page, showAll, setTimeRange, setPageSize, setPage, setShowAll };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bunx vitest run src/shared/hooks/__tests__/useListControls.test.ts`
Expected: PASS — 6 tests passing

- [ ] **Step 5: Commit**

```bash
git add src/shared/hooks/useListControls.ts src/shared/hooks/__tests__/useListControls.test.ts
git commit -m "feat: add useListControls hook for session-state list pagination"
```

---

### Task 5: Write `<ListControls>` component

**Files:**
- Create: `src/shared/components/ListControls.tsx`
- Create: `src/shared/components/__tests__/ListControls.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/shared/components/__tests__/ListControls.test.tsx`:

```typescript
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ListControls } from '../ListControls';
import { TimeRange } from '@/shared/types';

const noop = () => {};

describe('ListControls', () => {
  const defaultProps = {
    timeRange: TimeRange.All,
    onTimeRangeChange: noop,
    pageSize: 25,
    onPageSizeChange: noop,
    page: 1,
    totalPages: 4,
    onPageChange: noop,
  };

  it('renders all four time-range pills', () => {
    render(<ListControls {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'Today' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Week' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Month' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
  });

  it('marks the active time-range pill', () => {
    render(<ListControls {...defaultProps} timeRange={TimeRange.Week} />);
    expect(screen.getByRole('button', { name: 'Week' })).toHaveClass('bg-accent');
  });

  it('calls onTimeRangeChange when a pill is clicked', () => {
    const onChange = vi.fn();
    render(<ListControls {...defaultProps} onTimeRangeChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Week' }));
    expect(onChange).toHaveBeenCalledWith(TimeRange.Week);
  });

  it('renders page-size dropdown with 6 options', () => {
    render(<ListControls {...defaultProps} />);
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(select.children).toHaveLength(6);
  });

  it('calls onPageSizeChange with parsed number when select changes', () => {
    const onChange = vi.fn();
    render(<ListControls {...defaultProps} onPageSizeChange={onChange} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '50' } });
    expect(onChange).toHaveBeenCalledWith(50);
  });

  it('shows current page indicator', () => {
    render(<ListControls {...defaultProps} page={3} totalPages={4} />);
    expect(screen.getByText(/3 \/ 4/)).toBeInTheDocument();
  });

  it('disables prev button on page 1', () => {
    render(<ListControls {...defaultProps} page={1} />);
    expect(screen.getByRole('button', { name: /previous page/i })).toBeDisabled();
  });

  it('disables next button on last page', () => {
    render(<ListControls {...defaultProps} page={4} totalPages={4} />);
    expect(screen.getByRole('button', { name: /next page/i })).toBeDisabled();
  });

  it('calls onPageChange when prev clicked', () => {
    const onChange = vi.fn();
    render(<ListControls {...defaultProps} page={3} onPageChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /previous page/i }));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('calls onPageChange when go-to-page input is submitted', () => {
    const onChange = vi.fn();
    render(<ListControls {...defaultProps} page={1} totalPages={10} onPageChange={onChange} />);
    const input = screen.getByLabelText(/go to page/i);
    fireEvent.change(input, { target: { value: '7' } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith(7);
  });

  it('clamps go-to-page input to valid range', () => {
    const onChange = vi.fn();
    render(<ListControls {...defaultProps} page={1} totalPages={10} onPageChange={onChange} />);
    const input = screen.getByLabelText(/go to page/i);
    fireEvent.change(input, { target: { value: '99' } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith(10);
  });

  it('hides pagination row when totalPages is 1', () => {
    render(<ListControls {...defaultProps} totalPages={1} />);
    expect(screen.queryByRole('button', { name: /next page/i })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx vitest run src/shared/components/__tests__/ListControls.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

Create `src/shared/components/ListControls.tsx`:

```typescript
import { ChangeEvent, FocusEvent, useState } from 'react';
import { TimeRange } from '@/shared/types';

const TIME_RANGES: { id: TimeRange; label: string }[] = [
  { id: TimeRange.Today, label: 'Today' },
  { id: TimeRange.Week, label: 'Week' },
  { id: TimeRange.Month, label: 'Month' },
  { id: TimeRange.All, label: 'All' },
];

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100, 500];

interface Props {
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/** Universal list controls: time-range pills + page-size dropdown + page jumper */
export function ListControls(props: Props) {
  const { timeRange, onTimeRangeChange, pageSize, onPageSizeChange, page, totalPages, onPageChange } = props;
  const [jumpValue, setJumpValue] = useState<string>('');

  const handleJumpBlur = (e: FocusEvent<HTMLInputElement>) => {
    const raw = parseInt(e.target.value, 10);
    if (Number.isNaN(raw)) {
      setJumpValue('');
      return;
    }
    const clamped = Math.max(1, Math.min(totalPages, raw));
    onPageChange(clamped);
    setJumpValue('');
  };

  return (
    <div className="mx-4 mb-3 space-y-2">
      <div className="flex gap-1 rounded-lg border border-line bg-surface-card p-1">
        {TIME_RANGES.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onTimeRangeChange(opt.id)}
            className={`flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
              timeRange === opt.id ? 'bg-accent text-fg-on-accent' : 'text-fg-muted hover:text-fg'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-2 text-xs">
          <label className="text-fg-muted">
            <select
              value={pageSize}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => onPageSizeChange(parseInt(e.target.value, 10))}
              className="rounded border border-line bg-surface-card px-1 py-0.5 text-fg"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>{' '}
            per page
          </label>

          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              aria-label="Previous page"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="rounded border border-line px-2 py-0.5 text-fg disabled:opacity-30"
            >
              ‹
            </button>
            <span className="px-1 text-fg">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              aria-label="Next page"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="rounded border border-line px-2 py-0.5 text-fg disabled:opacity-30"
            >
              ›
            </button>
            <input
              type="number"
              aria-label="Go to page"
              placeholder="Go to"
              value={jumpValue}
              onChange={(e) => setJumpValue(e.target.value)}
              onBlur={handleJumpBlur}
              min={1}
              max={totalPages}
              className="w-14 rounded border border-line bg-surface-card px-1 py-0.5 text-fg"
            />
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bunx vitest run src/shared/components/__tests__/ListControls.test.tsx`
Expected: PASS — 12 tests passing

- [ ] **Step 5: Commit**

```bash
git add src/shared/components/ListControls.tsx src/shared/components/__tests__/ListControls.test.tsx
git commit -m "feat: add ListControls component with time-range pills, page-size selector, page jumper"
```

---

### Task 6: Write `<ListShowMoreFooter>` component

**Files:**
- Create: `src/shared/components/ListShowMoreFooter.tsx`
- Create: `src/shared/components/__tests__/ListShowMoreFooter.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/shared/components/__tests__/ListShowMoreFooter.test.tsx`:

```typescript
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ListShowMoreFooter } from '../ListShowMoreFooter';

describe('ListShowMoreFooter', () => {
  it('renders nothing when total <= shown', () => {
    const { container } = render(
      <ListShowMoreFooter totalCount={10} shownCount={10} pageSize={25} onShowAll={() => {}} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders "Show all" label when remaining > pageSize', () => {
    render(
      <ListShowMoreFooter totalCount={87} shownCount={25} pageSize={25} onShowAll={() => {}} />,
    );
    expect(screen.getByRole('button')).toHaveTextContent('Show all 87 records');
  });

  it('renders "Load N remaining" label when remaining <= pageSize', () => {
    render(
      <ListShowMoreFooter totalCount={37} shownCount={25} pageSize={25} onShowAll={() => {}} />,
    );
    expect(screen.getByRole('button')).toHaveTextContent('Load 12 remaining');
  });

  it('calls onShowAll when clicked', () => {
    const onShowAll = vi.fn();
    render(
      <ListShowMoreFooter totalCount={87} shownCount={25} pageSize={25} onShowAll={onShowAll} />,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onShowAll).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx vitest run src/shared/components/__tests__/ListShowMoreFooter.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

Create `src/shared/components/ListShowMoreFooter.tsx`:

```typescript
interface Props {
  totalCount: number;
  shownCount: number;
  pageSize: number;
  onShowAll: () => void;
}

/** Bottom escape-hatch button: contextual "Show all N" or "Load N remaining" */
export function ListShowMoreFooter({ totalCount, shownCount, pageSize, onShowAll }: Props) {
  const remaining = totalCount - shownCount;
  if (remaining <= 0) return null;

  const label = remaining > pageSize ? `Show all ${totalCount} records` : `Load ${remaining} remaining`;

  return (
    <div className="mx-4 mt-3 flex justify-center">
      <button
        type="button"
        onClick={onShowAll}
        className="rounded-lg border border-line bg-surface-card px-4 py-2 text-sm text-fg-muted transition-colors hover:bg-accent-muted hover:text-fg"
      >
        {label}
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bunx vitest run src/shared/components/__tests__/ListShowMoreFooter.test.tsx`
Expected: PASS — 4 tests passing

- [ ] **Step 5: Commit**

```bash
git add src/shared/components/ListShowMoreFooter.tsx src/shared/components/__tests__/ListShowMoreFooter.test.tsx
git commit -m "feat: add ListShowMoreFooter with contextual show-all/load-remaining label"
```

---

## Phase B — Migrate Budget (proves the foundation)

### Task 7: Replace inline Budget pill-row with `<ListControls>`

**Files:**
- Modify: `src/modules/expenses/pages/ExpenseListPage.tsx`

- [ ] **Step 1: Update imports and replace inline pill-row**

In `src/modules/expenses/pages/ExpenseListPage.tsx`:

- Remove the inline `VIEW_OPTIONS` array (lines 18-23)
- Remove the inline pill-row JSX (lines 40-54)
- Replace with `<ListControls>` and `<ListShowMoreFooter>`

Final file after changes:

```typescript
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

import { BudgetSummary } from '@/modules/expenses/components/BudgetSummary';
import { ExpenseList } from '@/modules/expenses/components/ExpenseList';
import { IncomeList } from '@/modules/expenses/components/IncomeList';
import { ReconciliationView } from '@/modules/expenses/components/ReconciliationView';
import { useExpenses } from '@/modules/expenses/hooks/useExpenses';
import { useIncome } from '@/modules/expenses/hooks/useIncome';
import { ListControls } from '@/shared/components/ListControls';
import { ListShowMoreFooter } from '@/shared/components/ListShowMoreFooter';
import { useListControls } from '@/shared/hooks/useListControls';
import { filterByDateRange } from '@/shared/utils/filter';
import { paginate, totalPages } from '@/shared/utils/paginate';
import { ROUTES } from '@/constants/routes';
import { todayStr } from '@/shared/utils/date';

type BudgetTab = 'expenses' | 'income' | 'reconcile';

export function ExpenseListPage() {
  const { expenses, deleteExpense } = useExpenses();
  const { income, deleteIncome } = useIncome();
  const [activeTab, setActiveTab] = useState<BudgetTab>('expenses');
  const ctrl = useListControls();

  const today = todayStr();
  const filteredExpenses = filterByDateRange(expenses, ctrl.timeRange, today, (e) => e.date);
  const filteredIncome = filterByDateRange(income, ctrl.timeRange, today, (i) => i.date);

  const activeFiltered = activeTab === 'income' ? filteredIncome : filteredExpenses;
  const pagesCount = totalPages(activeFiltered.length, ctrl.pageSize);
  const visible = ctrl.showAll ? activeFiltered : paginate(activeFiltered, ctrl.page, ctrl.pageSize);

  return (
    <div className="relative">
      <BudgetSummary expenses={filteredExpenses} income={filteredIncome} />

      <ListControls
        timeRange={ctrl.timeRange}
        onTimeRangeChange={ctrl.setTimeRange}
        pageSize={ctrl.pageSize}
        onPageSizeChange={ctrl.setPageSize}
        page={ctrl.page}
        totalPages={ctrl.showAll ? 1 : pagesCount}
        onPageChange={ctrl.setPage}
      />

      <div className="mx-4 mb-3 flex rounded-lg border border-line bg-surface-card p-1">
        <button
          type="button"
          onClick={() => setActiveTab('expenses')}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            activeTab === 'expenses' ? 'bg-accent text-fg-on-accent' : 'text-fg-muted hover:text-fg'
          }`}
        >
          Expenses
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('income')}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            activeTab === 'income' ? 'bg-accent text-fg-on-accent' : 'text-fg-muted hover:text-fg'
          }`}
        >
          Income
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('reconcile')}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            activeTab === 'reconcile' ? 'bg-accent text-fg-on-accent' : 'text-fg-muted hover:text-fg'
          }`}
        >
          CC
        </button>
      </div>

      {activeTab === 'expenses' && <ExpenseList expenses={visible} onDelete={deleteExpense} />}
      {activeTab === 'income' && <IncomeList income={visible} onDelete={deleteIncome} />}
      {activeTab === 'reconcile' && <ReconciliationView expenses={filteredExpenses} />}

      {activeTab !== 'reconcile' && !ctrl.showAll && (
        <ListShowMoreFooter
          totalCount={activeFiltered.length}
          shownCount={visible.length}
          pageSize={ctrl.pageSize}
          onShowAll={() => ctrl.setShowAll(true)}
        />
      )}

      <Link
        to={ROUTES.BUDGET_ADD}
        className="fixed bottom-20 right-4 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-fg-on-accent shadow-lg"
      >
        <Plus />
      </Link>
    </div>
  );
}
```

- [ ] **Step 2: Verify type-check passes**

Run: `bunx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Verify all tests pass**

Run: `bun run test --run`
Expected: All tests pass (Budget E2E may need updating; verify in next step)

- [ ] **Step 4: Run E2E for Budget flow**

Run: `bun run test:e2e -- --grep budget`
Expected: All Budget E2E tests still pass. If a test references the old inline pill-row markup, update the selector to use the new `<ListControls>` markup (button labels are unchanged).

- [ ] **Step 5: Commit**

```bash
git add src/modules/expenses/pages/ExpenseListPage.tsx
git commit -m "refactor(budget): use shared ListControls component"
```

---

## Phase C — Wire Body lists

### Task 8: Wire FloorsTab and ActivityLog with `useListControls`

**Files:**
- Modify: `src/modules/body/components/FloorsTab.tsx`
- Modify: `src/modules/body/components/ActivityLog.tsx`

- [ ] **Step 1: Read the current FloorsTab implementation**

Run: `cat src/modules/body/components/FloorsTab.tsx`

Identify where the existing 7→30 "Show more" toggle lives and where the floor entries list is rendered.

- [ ] **Step 2: Wire FloorsTab**

In `src/modules/body/components/FloorsTab.tsx`:

- Add imports at the top of the file:

```typescript
import { ListControls } from '@/shared/components/ListControls';
import { ListShowMoreFooter } from '@/shared/components/ListShowMoreFooter';
import { useListControls } from '@/shared/hooks/useListControls';
import { filterByDateRange } from '@/shared/utils/filter';
import { paginate, totalPages } from '@/shared/utils/paginate';
import { todayStr } from '@/shared/utils/date';
```

- Inside the component, remove the existing 7-vs-30 boolean state and replace with:

```typescript
const ctrl = useListControls();
const today = todayStr();
const filtered = filterByDateRange(floors, ctrl.timeRange, today, (f) => f.date);
const pagesCount = totalPages(filtered.length, ctrl.pageSize);
const visible = ctrl.showAll ? filtered : paginate(filtered, ctrl.page, ctrl.pageSize);
```

- Above the floors list, render the controls:

```tsx
<ListControls
  timeRange={ctrl.timeRange}
  onTimeRangeChange={ctrl.setTimeRange}
  pageSize={ctrl.pageSize}
  onPageSizeChange={ctrl.setPageSize}
  page={ctrl.page}
  totalPages={ctrl.showAll ? 1 : pagesCount}
  onPageChange={ctrl.setPage}
/>
```

- Replace the existing floors list source with `visible` (do not iterate over the full `floors` array directly).

- Below the floors list, render the footer:

```tsx
{!ctrl.showAll && (
  <ListShowMoreFooter
    totalCount={filtered.length}
    shownCount={visible.length}
    pageSize={ctrl.pageSize}
    onShowAll={() => ctrl.setShowAll(true)}
  />
)}
```

- Remove the old "Show more (7→30)" button entirely.

- [ ] **Step 3: Wire ActivityLog**

Apply the exact same pattern to `src/modules/body/components/ActivityLog.tsx`. The activity entries have a `date` field — extractor is `(a) => a.date`.

- Add the same imports
- Replace the existing pagination state with `useListControls()`
- Apply `filterByDateRange` + `paginate` to the activities list
- Render `<ListControls>` above the list, `<ListShowMoreFooter>` below
- Remove the old 7→30 toggle button

- [ ] **Step 4: Verify type-check passes**

Run: `bunx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Verify all tests pass**

Run: `bun run test --run`
Expected: All tests pass. If `FloorsTab.test.tsx` or `ActivityLog.test.tsx` references the old "Show more" button text, update the test to verify the new `ListControls` markup is rendered.

- [ ] **Step 6: Smoke test in dev**

Run: `bun run dev` and navigate to `/body`. Verify:
- Time-range pills appear above Floors list
- Page-size dropdown defaults to 25
- Switching range to "Week" filters correctly
- Bottom button appears when total > pageSize, label adapts based on remaining count

- [ ] **Step 7: Commit**

```bash
git add src/modules/body/components/FloorsTab.tsx src/modules/body/components/ActivityLog.tsx
git commit -m "refactor(body): use ListControls in FloorsTab and ActivityLog"
```

---

## Phase D — Wire Baby logs

### Task 9: Wire all 7 baby log components

**Files:**
- Modify: `src/modules/baby/components/FeedLog.tsx`
- Modify: `src/modules/baby/components/SleepLog.tsx`
- Modify: `src/modules/baby/components/GrowthLog.tsx`
- Modify: `src/modules/baby/components/EliminationLog.tsx`
- Modify: `src/modules/baby/components/MealsLog.tsx`
- Modify: `src/modules/baby/components/NeedsLog.tsx`
- Modify: `src/modules/baby/components/MilestonesLog.tsx`

All 7 baby entry types have a `date: string` field (verified via `grep` against `src/modules/baby/types.ts`). The wiring pattern is identical for every log.

- [ ] **Step 1: Wire FeedLog (canonical example)**

In `src/modules/baby/components/FeedLog.tsx`:

- Add imports at the top:

```typescript
import { ListControls } from '@/shared/components/ListControls';
import { ListShowMoreFooter } from '@/shared/components/ListShowMoreFooter';
import { useListControls } from '@/shared/hooks/useListControls';
import { filterByDateRange } from '@/shared/utils/filter';
import { paginate, totalPages } from '@/shared/utils/paginate';
import { todayStr } from '@/shared/utils/date';
```

- Inside the component, after fetching the feeds collection via `useBabyCollection`, add:

```typescript
const ctrl = useListControls();
const today = todayStr();
const filtered = filterByDateRange(feeds, ctrl.timeRange, today, (f) => f.date);
const pagesCount = totalPages(filtered.length, ctrl.pageSize);
const visible = ctrl.showAll ? filtered : paginate(filtered, ctrl.page, ctrl.pageSize);
```

- Above the feeds list rendering, insert:

```tsx
<ListControls
  timeRange={ctrl.timeRange}
  onTimeRangeChange={ctrl.setTimeRange}
  pageSize={ctrl.pageSize}
  onPageSizeChange={ctrl.setPageSize}
  page={ctrl.page}
  totalPages={ctrl.showAll ? 1 : pagesCount}
  onPageChange={ctrl.setPage}
/>
```

- Replace the iteration source from `feeds` to `visible` in the list-render block.

- Below the list, add:

```tsx
{!ctrl.showAll && (
  <ListShowMoreFooter
    totalCount={filtered.length}
    shownCount={visible.length}
    pageSize={ctrl.pageSize}
    onShowAll={() => ctrl.setShowAll(true)}
  />
)}
```

- Remove any existing slice-to-25 (or `CONFIG.PAGE_SIZE`) pagination logic.

- [ ] **Step 2: Apply identical pattern to SleepLog**

In `src/modules/baby/components/SleepLog.tsx`:
- Same imports
- Same hook call: `const ctrl = useListControls();`
- Same filter call against the sleeps collection: `filterByDateRange(sleeps, ctrl.timeRange, today, (s) => s.date)`
- Same `<ListControls>` placement above the list
- Same `<ListShowMoreFooter>` below the list
- Replace iteration source with `visible`

- [ ] **Step 3: Apply identical pattern to GrowthLog**

In `src/modules/baby/components/GrowthLog.tsx`:
- Same wiring as Step 2, against the growth collection: `filterByDateRange(growth, ctrl.timeRange, today, (g) => g.date)`

- [ ] **Step 4: Apply identical pattern to EliminationLog**

In `src/modules/baby/components/EliminationLog.tsx`:
- Same wiring, against the elimination collection: `filterByDateRange(eliminations, ctrl.timeRange, today, (e) => e.date)`

- [ ] **Step 5: Apply identical pattern to MealsLog**

In `src/modules/baby/components/MealsLog.tsx`:
- Same wiring, against the meals collection: `filterByDateRange(meals, ctrl.timeRange, today, (m) => m.date)`

- [ ] **Step 6: Apply identical pattern to NeedsLog**

In `src/modules/baby/components/NeedsLog.tsx`:
- Same wiring, against the needs collection: `filterByDateRange(needs, ctrl.timeRange, today, (n) => n.date)`

> **Note:** NeedsLog has filter chips (`All / Wishlist / Have / Outgrown`). Apply `<ListControls>` AFTER the chip filter — the chip filter narrows by status, then `<ListControls>` narrows by date and paginates the result.

- [ ] **Step 7: Apply identical pattern to MilestonesLog**

In `src/modules/baby/components/MilestonesLog.tsx`:
- Same wiring, against the milestones collection: `filterByDateRange(milestones, ctrl.timeRange, today, (m) => m.date)`

> **Note:** MilestonesLog groups entries by category in the render. Apply `paginate()` to the flat filtered list BEFORE grouping (the grouping happens on `visible`, not `filtered`).

- [ ] **Step 8: Verify type-check passes**

Run: `bunx tsc --noEmit`
Expected: No errors

- [ ] **Step 9: Verify all tests pass**

Run: `bun run test --run`
Expected: All tests pass. If any baby log test references slicing logic that no longer exists, update the test to verify the `<ListControls>` is rendered and the visible count matches the page size.

- [ ] **Step 10: Smoke test all 7 logs in dev**

Run: `bun run dev` and navigate to a child detail page. For each tab (Feeding, Sleep, Growth, Elimination, Meals, Needs, Milestones):
- Verify `<ListControls>` strip renders above the list
- Switch time-range to "Week" — list narrows
- Change page-size to `5` — list shrinks, pagination buttons activate when count > 5
- Click "Show all N records" footer button — pagination disappears, full list renders

- [ ] **Step 11: Commit**

```bash
git add src/modules/baby/components/FeedLog.tsx \
        src/modules/baby/components/SleepLog.tsx \
        src/modules/baby/components/GrowthLog.tsx \
        src/modules/baby/components/EliminationLog.tsx \
        src/modules/baby/components/MealsLog.tsx \
        src/modules/baby/components/NeedsLog.tsx \
        src/modules/baby/components/MilestonesLog.tsx
git commit -m "refactor(baby): use ListControls in all 7 log components"
```

---

## Phase E — Wire Admin lists

### Task 10: Wire InvitesTab and BroadcastsTab

**Files:**
- Modify: `src/modules/admin/components/InvitesTab.tsx`
- Modify: `src/modules/admin/components/BroadcastsTab.tsx`

> **Field difference:** InviteRecord and Notification (broadcasts) use `createdAt: ISO string`, NOT a `date: YYYY-MM-DD` field. The extractor must slice the ISO string to a date: `(item) => item.createdAt.slice(0, 10)`.

- [ ] **Step 1: Wire InvitesTab**

In `src/modules/admin/components/InvitesTab.tsx`:

- Add the same imports as Task 8/9 (`ListControls`, `ListShowMoreFooter`, `useListControls`, `filterByDateRange`, `paginate`, `totalPages`, `todayStr`).
- Inside the component, add:

```typescript
const ctrl = useListControls();
const today = todayStr();
const filtered = filterByDateRange(invites, ctrl.timeRange, today, (inv) => inv.createdAt.slice(0, 10));
const pagesCount = totalPages(filtered.length, ctrl.pageSize);
const visible = ctrl.showAll ? filtered : paginate(filtered, ctrl.page, ctrl.pageSize);
```

- Render `<ListControls>` above the invites list and `<ListShowMoreFooter>` below.
- Replace the iteration source with `visible`.

- [ ] **Step 2: Wire BroadcastsTab**

In `src/modules/admin/components/BroadcastsTab.tsx`:

- Same pattern, against the broadcasts/notifications collection.
- Extractor: `(b) => b.createdAt.slice(0, 10)`

- [ ] **Step 3: Verify type-check passes**

Run: `bunx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Verify all tests pass**

Run: `bun run test --run`
Expected: All tests pass

- [ ] **Step 5: Smoke test in dev**

Run: `bun run dev`, sign in as admin, navigate to `/admin`. Verify Invites tab and Broadcasts tab both render `<ListControls>`. Switch time-range and confirm filtering works against the `createdAt` field.

- [ ] **Step 6: Commit**

```bash
git add src/modules/admin/components/InvitesTab.tsx src/modules/admin/components/BroadcastsTab.tsx
git commit -m "refactor(admin): use ListControls in InvitesTab and BroadcastsTab"
```

---

## Phase F — Cleanup and Docs

### Task 11: Retire `CONFIG.PAGE_SIZE` constant

**Files:**
- Modify: `src/constants/config.ts`
- Modify: any remaining files that import `CONFIG.PAGE_SIZE`
- Modify: `CLAUDE.md` (remove reference)

- [ ] **Step 1: Find all remaining usages**

Run: `grep -rln "CONFIG.PAGE_SIZE" src/`
Expected: After Tasks 8-10 land, the only remaining references should be in `src/constants/config.ts` itself and possibly stale references in tests.

- [ ] **Step 2: Update or remove each remaining usage**

For each file that imports `CONFIG.PAGE_SIZE`:
- If the file is a list component already migrated to `useListControls`, the import is dead — remove it.
- If the file is a test that asserted `CONFIG.PAGE_SIZE === 25`, update it to assert against `useListControls()` default behavior, or delete the test.
- If the file is a non-list utility (rare), evaluate whether it still needs a default page size; if so, define the constant locally rather than re-exporting globally.

- [ ] **Step 3: Remove from config.ts**

In `src/constants/config.ts`, delete the `PAGE_SIZE: 25` line from the `CONFIG` object.

- [ ] **Step 4: Update CLAUDE.md**

In `/Users/nick/Projects/Github/afp/CLAUDE.md`, remove or rewrite the line:

> `CONFIG.PAGE_SIZE` (25) for all paginated lists, `CONFIG.UNDO_DURATION_MS` (10000) for undo delete toasts, `CONFIG.METERS_PER_KM` (1000) for distance conversion — never hardcode these values

Replace with:

> `CONFIG.UNDO_DURATION_MS` (10000) for undo delete toasts, `CONFIG.METERS_PER_KM` (1000) for distance conversion — never hardcode these values. List pagination is per-list session state via `useListControls()` (default page size 25, configurable via `<ListControls>`).

- [ ] **Step 5: Verify type-check passes**

Run: `bunx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Verify all tests pass**

Run: `bun run test --run`
Expected: All tests pass

- [ ] **Step 7: Commit**

```bash
git add src/constants/config.ts CLAUDE.md
git commit -m "chore: retire CONFIG.PAGE_SIZE in favor of useListControls hook default"
```

---

### Task 12: Update ROADMAP.md, CHANGELOG.md, and bump version

**Files:**
- Modify: `docs/ROADMAP.md` — Phase 2h row + "Done" log entry
- Modify: `CHANGELOG.md`
- Modify: `package.json`
- Modify: `.github/workflows/deploy.yml` (if `VITE_APP_VERSION` is hardcoded there per the established pattern)

- [ ] **Step 1: Fix Phase 2h row in ROADMAP.md**

In `/Users/nick/Projects/Github/afp/docs/ROADMAP.md`, find line 21:

```markdown
| Phase 2h (Revist pagination, filteration etc all lists) | [ ] Not statted | 0/0 | No t planned yet |
```

Replace with:

```markdown
| Phase 2h (Universal list controls) | ✅ Done | 12/12 | Time-range filter + per-list page size + page jump + show-all footer across 12 list surfaces |
```

- [ ] **Step 2: Update phase total at line 23**

Bump the totals on line 23 to reflect the 12 added steps:

```markdown
| **Total** | **~99%** | **205/222** | |
```

- [ ] **Step 3: Add Done-log entry**

In the Done section of `docs/ROADMAP.md`, immediately after the `### 2026-04-29 — Session 14` block, add:

```markdown
### 2026-04-29 — Session 15 (Phase 2h Universal List Controls, v0.2.15)

- [x] **TimeRange enum** — Renamed from `BudgetView` for cross-module reuse
- [x] **Shared `filterByDateRange`** — Promoted to `src/shared/utils/filter.ts` with key extractor; works on both `date` and `createdAt`-keyed entries
- [x] **`paginate()` primitive** — `src/shared/utils/paginate.ts` with `totalPages` helper
- [x] **`useListControls()` hook** — Bundled session state for time-range, page-size, page, show-all; auto-resets on filter change
- [x] **`<ListControls>` component** — Pill row + page-size selector `[5, 10, 25, 50, 100, 500]` + page jumper
- [x] **`<ListShowMoreFooter>` component** — Contextual `Show all N` / `Load N remaining` button
- [x] **Wired 12 list surfaces** — Body (Floors, ActivityLog), Baby (Feed, Sleep, Growth, Elimination, Meals, Needs, Milestones), Budget (ExpenseList, IncomeList), Admin (Invites, Broadcasts)
- [x] **Retired `CONFIG.PAGE_SIZE`** — Replaced by hook default (still 25)
- [x] Unit tests added: `filter.test.ts`, `paginate.test.ts`, `useListControls.test.ts`, `ListControls.test.tsx`, `ListShowMoreFooter.test.tsx`
```

- [ ] **Step 4: Update CHANGELOG.md**

In `CHANGELOG.md`, add a new entry for `[0.2.15]`. Mirror the Done-log bullets above. Match the existing CHANGELOG format used by `[0.2.14]`.

- [ ] **Step 5: Bump version in package.json**

In `package.json`, change `"version": "0.2.14"` to `"version": "0.2.15"`.

- [ ] **Step 6: Bump VITE_APP_VERSION if applicable**

If `.github/workflows/deploy.yml` hardcodes `VITE_APP_VERSION`, update it to `0.2.15`. (Skip this step if the version is read from `package.json` automatically.)

- [ ] **Step 7: Verify build passes**

Run: `bun run build`
Expected: Build completes without errors. Bundle size report shows new shared util/component chunks.

- [ ] **Step 8: Final test sweep**

Run: `bun run test --run` and `bun run lint`
Expected: All tests pass, no lint errors.

- [ ] **Step 9: Commit**

```bash
git add docs/ROADMAP.md CHANGELOG.md package.json .github/workflows/deploy.yml
git commit -m "docs: ship Phase 2h universal list controls (v0.2.15)"
```

---

## Self-Review Checklist

Before declaring this plan complete, the executor (or coordinator) should verify:

1. **Spec coverage:** All three locked decisions (per-list session state, `[5, 10, 25, 50, 100, 500]` + show-all button, match-Budget time-range semantics) are implemented.
2. **No placeholders:** No `TODO`, `tbd`, or "implement later" steps remain.
3. **Type consistency:** `TimeRange` enum is the single name across all callsites — no leftover `BudgetView` references.
4. **Test coverage:** Foundation tasks (1-6) all have failing-test-first TDD steps. Wiring tasks (7-10) verify integration via type-check + smoke test.
5. **All 12 list surfaces wired:**
   - Body: FloorsTab, ActivityLog ✓
   - Baby: FeedLog, SleepLog, GrowthLog, EliminationLog, MealsLog, NeedsLog, MilestonesLog ✓
   - Budget: ExpenseList, IncomeList (via ExpenseListPage) ✓
   - Admin: InvitesTab, BroadcastsTab ✓
6. **Doc updates:** ROADMAP.md row fixed, Done log added, CHANGELOG bumped, version bumped.

---

## Phase G — Visual Refactor (Daily Ledger pattern)

Design preview: `SAM/design-samples/list-rows-redesign.html`. The visual refactor lands as part of Phase 2h because every wired list also gets a row redesign. Constraints (per Nick): preserve swipe-to-delete on mobile, preserve the inline `×` delete on desktop, preserve the tap-to-populate-form active-row treatment.

### Task 13: Build shared row primitives — `<DateGroupHeader>`, `<RowTime>`, `<FloorMagnitudeBar>`

**Files:**
- Create: `src/shared/components/lists/DateGroupHeader.tsx`
- Create: `src/shared/components/lists/RowTime.tsx`
- Create: `src/shared/components/lists/FloorMagnitudeBar.tsx`
- Create: `src/shared/components/lists/__tests__/DateGroupHeader.test.tsx`
- Create: `src/shared/components/lists/__tests__/RowTime.test.tsx`
- Create: `src/shared/components/lists/__tests__/FloorMagnitudeBar.test.tsx`
- Create: `src/shared/utils/relative-date.ts`
- Create: `src/shared/utils/__tests__/relative-date.test.ts`

- [ ] **Step 1: Write failing test for `relativeDateLabel`**

Create `src/shared/utils/__tests__/relative-date.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { relativeDateLabel } from '../relative-date';

describe('relativeDateLabel', () => {
  it('returns "Today" for the reference date', () => {
    expect(relativeDateLabel('2026-04-29', '2026-04-29')).toEqual({
      relative: 'Today',
      structural: 'Tue 29 Apr',
      week: null,
    });
  });

  it('returns "Yesterday" for the previous day', () => {
    expect(relativeDateLabel('2026-04-28', '2026-04-29')).toEqual({
      relative: 'Yesterday',
      structural: 'Mon 28 Apr',
      week: null,
    });
  });

  it('returns null relative for older dates and includes week number', () => {
    const result = relativeDateLabel('2026-04-26', '2026-04-29');
    expect(result.relative).toBeNull();
    expect(result.structural).toBe('Sat 26 Apr');
    expect(result.week).toMatch(/Wk \d{1,2}/);
  });

  it('handles year boundary correctly', () => {
    const result = relativeDateLabel('2025-12-31', '2026-01-01');
    expect(result.relative).toBe('Yesterday');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx vitest run src/shared/utils/__tests__/relative-date.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement `relativeDateLabel`**

Create `src/shared/utils/relative-date.ts`:

```typescript
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export interface DateLabel {
  relative: 'Today' | 'Yesterday' | null;
  structural: string;
  week: string | null;
}

const isoWeekNumber = (date: Date): number => {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const diff = target.getTime() - firstThursday.getTime();
  return 1 + Math.round(diff / (7 * 86400000));
};

/** Formats a YYYY-MM-DD as a date label with relative + structural parts */
export const relativeDateLabel = (date: string, today: string): DateLabel => {
  const d = new Date(date);
  const t = new Date(today);
  const dayDiff = Math.round((t.getTime() - d.getTime()) / 86_400_000);

  const structural = `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;

  if (dayDiff === 0) return { relative: 'Today', structural, week: null };
  if (dayDiff === 1) return { relative: 'Yesterday', structural, week: null };

  return { relative: null, structural, week: `Wk ${isoWeekNumber(d)}` };
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bunx vitest run src/shared/utils/__tests__/relative-date.test.ts`
Expected: PASS — 4 tests passing

- [ ] **Step 5: Write failing test for `<DateGroupHeader>`**

Create `src/shared/components/lists/__tests__/DateGroupHeader.test.tsx`:

```typescript
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DateGroupHeader } from '../DateGroupHeader';

describe('DateGroupHeader', () => {
  it('renders "Today" prefix in accent for today', () => {
    render(<DateGroupHeader date="2026-04-29" today="2026-04-29" />);
    expect(screen.getByText('Today')).toHaveClass('text-accent');
    expect(screen.getByText(/Tue 29 Apr/)).toBeInTheDocument();
  });

  it('renders "Yesterday" for previous day', () => {
    render(<DateGroupHeader date="2026-04-28" today="2026-04-29" />);
    expect(screen.getByText('Yesterday')).toBeInTheDocument();
  });

  it('renders structural-only label with week number for older dates', () => {
    render(<DateGroupHeader date="2026-04-22" today="2026-04-29" />);
    expect(screen.queryByText('Today')).not.toBeInTheDocument();
    expect(screen.queryByText('Yesterday')).not.toBeInTheDocument();
    expect(screen.getByText(/Wed 22 Apr/)).toBeInTheDocument();
    expect(screen.getByText(/Wk \d+/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `bunx vitest run src/shared/components/lists/__tests__/DateGroupHeader.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 7: Implement `<DateGroupHeader>`**

Create `src/shared/components/lists/DateGroupHeader.tsx`:

```typescript
import { relativeDateLabel } from '@/shared/utils/relative-date';

interface Props {
  date: string;
  today: string;
}

/** Sticky date header for grouped list views. Two-tier: relative for hot dates, structural for cold. */
export function DateGroupHeader({ date, today }: Props) {
  const label = relativeDateLabel(date, today);

  return (
    <div
      className="sticky top-0 z-10 flex items-baseline gap-2 border-b border-line bg-surface px-4 pb-1.5 pt-3 font-display text-[11px] uppercase tracking-[0.18em] text-fg-muted"
      style={{ fontFamily: 'var(--font-display)' }}
    >
      {label.relative && (
        <span className="font-semibold text-accent">{label.relative}</span>
      )}
      {label.relative && <span>·</span>}
      <span>{label.structural}</span>
      {label.week && (
        <>
          <span>·</span>
          <span>{label.week}</span>
        </>
      )}
      <span className="ml-2 h-px flex-1 bg-line opacity-50" />
    </div>
  );
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `bunx vitest run src/shared/components/lists/__tests__/DateGroupHeader.test.tsx`
Expected: PASS — 3 tests passing

- [ ] **Step 9: Write and pass tests for `<RowTime>`**

Create `src/shared/components/lists/__tests__/RowTime.test.tsx`:

```typescript
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RowTime } from '../RowTime';

describe('RowTime', () => {
  it('renders time portion of ISO timestamp in HH:mm format', () => {
    render(<RowTime timestamp="2026-04-29T14:23:00.000Z" />);
    expect(screen.getByText(/\d{2}:\d{2}/)).toBeInTheDocument();
  });

  it('uses tabular numerals via class', () => {
    render(<RowTime timestamp="2026-04-29T14:23:00.000Z" />);
    expect(screen.getByText(/\d{2}:\d{2}/)).toHaveClass('tabular-nums');
  });

  it('renders dash when timestamp is undefined', () => {
    render(<RowTime timestamp={undefined} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
```

Then create `src/shared/components/lists/RowTime.tsx`:

```typescript
interface Props {
  timestamp: string | undefined;
}

/** Tabular-nums time prefix for list rows. Renders HH:mm in local time. */
export function RowTime({ timestamp }: Props) {
  if (!timestamp) {
    return <span className="font-mono text-xs tabular-nums text-fg-muted">—</span>;
  }

  const d = new Date(timestamp);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');

  return (
    <span className="font-mono text-xs tabular-nums tracking-wider text-fg-muted">
      {hh}:{mm}
    </span>
  );
}
```

Run: `bunx vitest run src/shared/components/lists/__tests__/RowTime.test.tsx`
Expected: PASS — 3 tests passing

- [ ] **Step 10: Write and pass tests for `<FloorMagnitudeBar>`**

Create `src/shared/components/lists/__tests__/FloorMagnitudeBar.test.tsx`:

```typescript
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { FloorMagnitudeBar } from '../FloorMagnitudeBar';

describe('FloorMagnitudeBar', () => {
  it('renders an up segment proportional to up count', () => {
    const { container } = render(<FloorMagnitudeBar up={12} down={3} goal={20} />);
    const upSeg = container.querySelector('[data-segment="up"]') as HTMLElement;
    expect(upSeg).toBeInTheDocument();
    expect(upSeg.style.flex).toContain('12');
  });

  it('renders a down segment proportional to down count', () => {
    const { container } = render(<FloorMagnitudeBar up={12} down={3} goal={20} />);
    const downSeg = container.querySelector('[data-segment="down"]') as HTMLElement;
    expect(downSeg.style.flex).toContain('3');
  });

  it('renders an empty filler segment when sum < goal', () => {
    const { container } = render(<FloorMagnitudeBar up={12} down={3} goal={20} />);
    const filler = container.querySelector('[data-segment="empty"]') as HTMLElement;
    expect(filler).toBeInTheDocument();
    expect(filler.style.flex).toContain('5');
  });

  it('omits filler when sum >= goal', () => {
    const { container } = render(<FloorMagnitudeBar up={18} down={6} goal={20} />);
    expect(container.querySelector('[data-segment="empty"]')).toBeNull();
  });

  it('renders nothing when up + down is 0', () => {
    const { container } = render(<FloorMagnitudeBar up={0} down={0} goal={20} />);
    expect(container.firstChild).toBeNull();
  });
});
```

Then create `src/shared/components/lists/FloorMagnitudeBar.tsx`:

```typescript
interface Props {
  up: number;
  down: number;
  goal: number;
}

/** Inline split bar visualizing floors-up vs floors-down for a day, scaled against the daily goal. */
export function FloorMagnitudeBar({ up, down, goal }: Props) {
  if (up + down === 0) return null;

  const filler = Math.max(0, goal - up - down);

  return (
    <div className="flex h-3 gap-0.5 overflow-hidden rounded-sm bg-line">
      {up > 0 && <div data-segment="up" className="h-full bg-accent" style={{ flex: up }} />}
      {down > 0 && <div data-segment="down" className="h-full bg-accent opacity-40" style={{ flex: down }} />}
      {filler > 0 && <div data-segment="empty" style={{ flex: filler }} />}
    </div>
  );
}
```

Run: `bunx vitest run src/shared/components/lists/__tests__/FloorMagnitudeBar.test.tsx`
Expected: PASS — 5 tests passing

- [ ] **Step 11: Commit**

```bash
git add src/shared/components/lists/ src/shared/utils/relative-date.ts \
        src/shared/utils/__tests__/relative-date.test.ts
git commit -m "feat: add shared list primitives — DateGroupHeader, RowTime, FloorMagnitudeBar"
```

---

### Task 14: Apply Daily Ledger row pattern to FloorsTab

**Files:**
- Modify: `src/modules/body/components/FloorsTab.tsx`

The Floors list is the canonical surface for the redesign because it's the one ROADMAP.md flags as "flat styling" and the magnitude bar gives it a unique visual signature.

- [ ] **Step 1: Group `visible` floors by date**

In `FloorsTab.tsx`, after computing `visible` from `useListControls + paginate`, group by date:

```typescript
const groupedByDate = visible.reduce<Record<string, typeof visible>>((acc, floor) => {
  acc[floor.date] = acc[floor.date] || [];
  acc[floor.date].push(floor);
  return acc;
}, {});
const dateKeys = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));
```

- [ ] **Step 2: Replace flat floors render with grouped Daily Ledger render**

Replace the existing list render with:

```tsx
import { DateGroupHeader } from '@/shared/components/lists/DateGroupHeader';
import { RowTime } from '@/shared/components/lists/RowTime';
import { FloorMagnitudeBar } from '@/shared/components/lists/FloorMagnitudeBar';

// inside the component, in the JSX where the list is rendered:
<div className="bg-surface">
  {dateKeys.map((dateKey) => (
    <div key={dateKey}>
      <DateGroupHeader date={dateKey} today={today} />
      {groupedByDate[dateKey].map((floor) => (
        <div
          key={floor.id}
          onClick={() => populateForm(floor)}
          className={`grid cursor-pointer grid-cols-[56px_1fr_100px_auto_auto] items-center gap-3 border-l-2 border-t border-line border-l-transparent px-4 py-3.5 transition-colors hover:bg-accent-muted ${
            editingId === floor.id ? 'border-l-accent bg-accent-muted' : ''
          }`}
        >
          <RowTime timestamp={floor.timestamp} />
          <span className="text-sm text-fg">Floors</span>
          <FloorMagnitudeBar up={floor.up} down={floor.down} goal={dailyGoal.floorsUp + dailyGoal.floorsDown} />
          <span className="whitespace-nowrap font-mono text-[13px] tabular-nums text-fg">
            <span className="font-semibold text-accent">{floor.up} ↑</span>
            <span className="ml-2 text-fg-muted">{floor.down} ↓</span>
          </span>
          <button
            type="button"
            aria-label="Delete entry"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(floor);
            }}
            className="font-mono text-sm text-fg-muted transition-all hover:scale-125 hover:font-bold hover:text-red-500"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  ))}
</div>
```

> Adjust variable names (`populateForm`, `editingId`, `handleDelete`, `dailyGoal`) to whatever the component already calls them. The grid template `[56px_1fr_100px_auto_auto]` is exact; do not change column widths without updating the magnitude bar's max width.

- [ ] **Step 3: Verify type-check passes**

Run: `bunx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Verify all tests pass**

Run: `bun run test --run`
Expected: All tests pass. If `FloorsTab.test.tsx` queries by old markup, update selectors to match the new grid structure (test by aria-label or text content rather than div class names).

- [ ] **Step 5: Smoke test in dev**

Run: `bun run dev`. Navigate to `/body`. Verify:
- Floors entries are grouped under sticky day headers
- "Today" / "Yesterday" appear in accent color, older dates show structural label + week number
- Magnitude bar reflects up/down ratio per row
- Delete x still works (hover scale + red color)
- Tap-to-populate-form still highlights row in `bg-accent-muted` with left accent border
- Switch theme to Marauder's Map and Industrial Furnace — visuals adapt to theme fonts and palette

- [ ] **Step 6: Commit**

```bash
git add src/modules/body/components/FloorsTab.tsx
git commit -m "feat(body): apply Daily Ledger pattern to FloorsTab with magnitude bar"
```

---

### Task 15: Apply Daily Ledger row pattern to remaining 11 lists

**Files:**
- Modify: `src/modules/body/components/ActivityLog.tsx`
- Modify: `src/modules/baby/components/FeedLog.tsx`
- Modify: `src/modules/baby/components/SleepLog.tsx`
- Modify: `src/modules/baby/components/GrowthLog.tsx`
- Modify: `src/modules/baby/components/EliminationLog.tsx`
- Modify: `src/modules/baby/components/MealsLog.tsx`
- Modify: `src/modules/baby/components/NeedsLog.tsx`
- Modify: `src/modules/baby/components/MilestonesLog.tsx`
- Modify: `src/modules/expenses/components/ExpenseList.tsx`
- Modify: `src/modules/expenses/components/IncomeList.tsx`
- Modify: `src/modules/admin/components/InvitesTab.tsx`
- Modify: `src/modules/admin/components/BroadcastsTab.tsx`

The non-Floors lists use the generic row pattern (no magnitude bar). Grid template: `[56px_1fr_auto_auto]` for `[time, label/meta stack, value, ×]`.

- [ ] **Step 1: Apply generic row pattern to ActivityLog**

In `src/modules/body/components/ActivityLog.tsx`, group `visible` by date (same `reduce` from Task 14, Step 1) and render:

```tsx
<div className="bg-surface">
  {dateKeys.map((dateKey) => (
    <div key={dateKey}>
      <DateGroupHeader date={dateKey} today={today} />
      {groupedByDate[dateKey].map((activity) => (
        <div
          key={activity.id}
          onClick={() => populateForm(activity)}
          className={`grid cursor-pointer grid-cols-[56px_1fr_auto_auto] items-center gap-3 border-l-2 border-t border-line border-l-transparent px-4 py-3.5 transition-colors hover:bg-accent-muted ${
            editingId === activity.id ? 'border-l-accent bg-accent-muted' : ''
          }`}
        >
          <RowTime timestamp={activity.timestamp} />
          <div className="flex flex-col gap-0.5">
            <span className="text-sm text-fg">{activity.label || activity.type}</span>
            <span className="text-xs text-fg-muted">
              {formatDistance(activity.distance)} · {activity.duration} min
            </span>
          </div>
          <span className="whitespace-nowrap text-right font-display text-base font-semibold tabular-nums text-accent">
            {activity.score}
          </span>
          <button
            type="button"
            aria-label="Delete entry"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(activity);
            }}
            className="font-mono text-sm text-fg-muted transition-all hover:scale-125 hover:font-bold hover:text-red-500"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  ))}
</div>
```

- [ ] **Step 2: Apply identical pattern to all 7 baby logs**

For each of `FeedLog.tsx`, `SleepLog.tsx`, `GrowthLog.tsx`, `EliminationLog.tsx`, `MealsLog.tsx`, `NeedsLog.tsx`, `MilestonesLog.tsx`:

- Group `visible` by `entry.date`
- Render `<DateGroupHeader>` per group, `<RowTime>` per row
- Map domain fields into the `[time, label/meta stack, value, ×]` grid:
  - **FeedLog**: label = type ("Bottle" / "Breast"), meta = side/duration, value = volume in ml or `—`
  - **SleepLog**: label = type, meta = duration formatted, value = quality emoji or duration
  - **GrowthLog**: label = "Growth", meta = "weight · height · head", value = weight kg
  - **EliminationLog**: label = mode ("Diaper" / "Potty"), meta = type, value = time-to-next or `—`
  - **MealsLog**: label = meal type ("Breakfast"), meta = description, value = portion enum label
  - **NeedsLog**: label = item name, meta = status chip ("Wishlist" / "Have" / "Outgrown"), value = price or `—`
  - **MilestonesLog**: label = title, meta = category, value = age (months) or `—`

- [ ] **Step 3: Apply pattern to ExpenseList and IncomeList**

For `ExpenseList.tsx`:
- Group `expenses` by date
- Label = description, meta = `${PaymentMethod} · ${ExpenseCategory emoji}`, value = `₹${amount.toLocaleString('en-IN')}`

For `IncomeList.tsx`:
- Group `income` by date
- Label = source, meta = type, value = `₹${amount.toLocaleString('en-IN')}` (rendered in `text-emerald-600` for positive contrast)

- [ ] **Step 4: Apply pattern to InvitesTab and BroadcastsTab**

These use `createdAt` instead of `date`. The grouping extractor is `inv.createdAt.slice(0, 10)`.

For `InvitesTab.tsx`:
- Group invites by `createdAt.slice(0,10)`
- Label = invite code, meta = `${role} · ${redeemed ? 'Redeemed' : 'Pending'}`, value = `Copy` button (not deletion)

For `BroadcastsTab.tsx`:
- Group notifications by `createdAt.slice(0,10)`
- Label = title, meta = `${severity} · ${type}`, value = `${recipientCount} sent`

- [ ] **Step 5: Verify type-check passes**

Run: `bunx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Verify all tests pass**

Run: `bun run test --run`
Expected: All tests pass. Update any selector-based tests that referenced the old card markup.

- [ ] **Step 7: Smoke test all 12 list surfaces in dev**

Run: `bun run dev` and walk through each list: Body Floors → Walking → Running → Cycling → Baby (all 7 logs) → Budget Expenses → Income → Admin Invites → Broadcasts.

For each list confirm:
- Sticky day headers render with correct relative/structural label
- Time prefix uses tabular numerals
- Value column is right-aligned in display font + accent color
- Delete x position and hover behavior unchanged
- Active/edited row gets `bg-accent-muted` + `border-l-accent`

Verify in at least 3 themes: Family Blue, Marauder's Map, Industrial Furnace.

- [ ] **Step 8: Commit**

```bash
git add src/modules/body/components/ActivityLog.tsx \
        src/modules/baby/components/*.tsx \
        src/modules/expenses/components/ExpenseList.tsx \
        src/modules/expenses/components/IncomeList.tsx \
        src/modules/admin/components/InvitesTab.tsx \
        src/modules/admin/components/BroadcastsTab.tsx
git commit -m "feat: apply Daily Ledger row pattern to all 11 remaining list surfaces"
```

---

### Task 16: Update plan totals and documentation

**Files:**
- Modify: `docs/ROADMAP.md`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Update Phase 2h row total in ROADMAP.md**

Bump `12/12` (controls only) to `16/16` to reflect the visual refactor tasks. Update the `**Total**` row accordingly: from `205/222` to `209/226`.

- [ ] **Step 2: Add visual-refactor bullets to the Done log**

Append to the Session 15 entry under `### 2026-04-29 — Session 15`:

```markdown
- [x] **Daily Ledger visual refactor** — Sticky `<DateGroupHeader>` (Today/Yesterday + structural fallback with ISO week number), `<RowTime>` tabular-nums prefix, `<FloorMagnitudeBar>` inline split bar
- [x] **`relativeDateLabel` util** — Two-tier date formatting (relative for hot, structural for cold)
- [x] **All 12 list surfaces redesigned** — Replaced per-row card markup with hairline `border-t` between rows, grid template `[56px_1fr_auto_auto]` (or `[56px_1fr_100px_auto_auto]` for Floors), values right-aligned in display font + accent color
- [x] **Theme-agnostic** — Verified across Family Blue, Marauder's Map, Industrial Furnace; all 10 themes inherit correctly via existing CSS variables
- [x] **Preserved behaviors** — Swipe-to-delete unchanged, inline `×` delete unchanged, tap-to-populate-form active-row treatment unchanged
- [x] Design preview committed: `SAM/design-samples/list-rows-redesign.html`
```

- [ ] **Step 3: Mirror to CHANGELOG.md**

Add the same bullets under the `[0.2.15]` entry.

- [ ] **Step 4: Commit**

```bash
git add docs/ROADMAP.md CHANGELOG.md
git commit -m "docs: log Daily Ledger visual refactor in roadmap and changelog"
```

---

## Out of Scope (defer to future plans)

- **`BabyLogList` shared component refactor.** CLAUDE.md flags Baby logs duplicate list/edit/delete logic. Phase 2h adds controls and the row pattern but does not consolidate the per-log components themselves. A follow-up plan should extract `BabyLogList` once these patterns are in place.
- **Calendar-week / calendar-month time ranges.** Decision 3 chose rolling windows to match Budget. A future enhancement could add `TimeRange.MonthCalendar`, `TimeRange.WeekCalendar` as additional pills.
- **Per-list time-range default tuning.** All lists currently default to `All`. A future enhancement could give long-running lists (Baby feeds) a `Month` default if `All` first-paint becomes slow in practice.
- **Persistence of list-controls state to UserProfile.** Decision 1 explicitly chose session state; persisted preferences are a future enhancement requiring a profile schema change and Firestore rules update.
- **Animated transitions on row insert/delete.** Daily Ledger pattern is static. Adding Framer Motion / Motion library for row-level transitions is a polish-pass concern, not Phase 2h.
- **Custom emoji rendering for budget categories.** ExpenseList currently renders category as emoji + text. Bigger emoji styling, color-coded category chips, or sparkline-per-category are out of scope.

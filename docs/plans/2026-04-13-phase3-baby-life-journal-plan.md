# Phase 3 Baby — Life Journal (Plan 7 of 9)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the narrative Life Journal view — Daily / Weekly / Monthly aggregation across all baby subcollections, with auto-detected counting milestones (cumulative thresholds like "1000 diapers"). Static aggregation only (no AI in v1, no sharing in v1).

**Architecture:** New `LifeJournalView` component renders a date-range picker (D/W/M grain + period stepper) and a stack of summary cards. Each card is fed by aggregation queries against existing subcollections (`feeds`, `sleep`, `growth`, `elimination`, `meals`, `milestones`, `needs`). Counting milestones (`COUNTING_THRESHOLDS`) are computed on-read by comparing total counts before and after the period — no persisted counter rows.

**Tech Stack:** TypeScript, React, Firebase Firestore, Vitest. Pure aggregation functions are testable without Firestore mocking.

**Spec:** [`docs/specs/2026-04-13-phase3-baby-to-kid-design.md`](../specs/2026-04-13-phase3-baby-to-kid-design.md) — read § 9.

**Plan position:** Plan 7 of 9 for Module A. **Depends on:**
- Plan 1 (foundation) — uses `ChildStage`, all entry types
- Plans 3-5 (Elimination, Meals, Needs) — sources data from new subcollections
- Plan 6 (Milestones) — sources milestones data

Strictly speaking, Life Journal can ship empty for any of those subcollections — the view degrades gracefully (cards show "No entries this period"). But its narrative value depends on having data to aggregate.

---

## File Structure

### Created files

| Path | Responsibility |
|---|---|
| `src/modules/baby/journal/constants.ts` | `COUNTING_THRESHOLDS` per data type, `JournalGrain` enum |
| `src/modules/baby/journal/types.ts` | `JournalRange`, `JournalSummary`, `CountingMoment` types |
| `src/modules/baby/journal/range.ts` | `computeRange(grain, anchorDate)` pure function |
| `src/modules/baby/journal/aggregate.ts` | `computeJournalSummary()` and `computeCountingMoments()` pure functions |
| `src/modules/baby/__tests__/journal-range.test.ts` | Unit tests for date-range computation |
| `src/modules/baby/__tests__/journal-aggregate.test.ts` | Unit tests for summary + counting moments |
| `src/modules/baby/hooks/useJournalData.ts` | Hook fetching aggregated data for a child + range |
| `src/modules/baby/components/JournalPicker.tsx` | Grain selector (D/W/M) + period stepper |
| `src/modules/baby/components/JournalCard.tsx` | Generic card wrapper (header + content) |
| `src/modules/baby/components/LifeJournalView.tsx` | Composes picker + cards |
| `src/modules/baby/__tests__/JournalPicker.test.tsx` | Component test |
| `src/modules/baby/__tests__/LifeJournalView.test.tsx` | Component test |

### Modified files

| Path | Change |
|---|---|
| `src/modules/baby/components/ChildDetail.tsx` | Add `<LifeJournalView>` tab — always visible (no `ChildConfig` flag) |
| `afp/CHANGELOG.md` | Add life-journal entry |

### Note: no admin toggle for Life Journal

Life Journal is a **read-only view** over existing data, not a tracking
module. Adding a `ChildConfig` flag to gate it adds noise without value.
Decision: Life Journal tab is always visible inside `ChildDetail`. If
later usage suggests some users want to hide it, a toggle can be added
in a follow-up.

---

## Phase A — Constants and Pure Logic

### Task 1: Journal constants and types

**Files:**
- Create: `src/modules/baby/journal/constants.ts`
- Create: `src/modules/baby/journal/types.ts`

- [ ] **Step 1: Create constants.ts**

Create `src/modules/baby/journal/constants.ts`:

```typescript
/** Cumulative thresholds — when crossed within a journal period, surface as a counting moment */
export const COUNTING_THRESHOLDS = {
  diapers:    [100, 250, 500, 1000, 2500, 5000],
  feeds:      [100, 500, 1000, 2500, 5000],
  meals:      [50, 100, 250, 500, 1000],
  sleepHours: [100, 250, 500, 1000, 2500],
  milestones: [10, 25, 50, 100],
} as const;

/** Time-scale of a journal view */
export enum JournalGrain {
  Day = 0,
  Week = 1,
  Month = 2,
}
```

- [ ] **Step 2: Create types.ts**

Create `src/modules/baby/journal/types.ts`:

```typescript
import { JournalGrain } from './constants';

/** Inclusive date range — both YYYY-MM-DD strings */
export type JournalRange = {
  start: string;
  end: string;
  grain: JournalGrain;
  /** Display label like "Today", "This Week", "Apr 8-14, 2026", "April 2026" */
  label: string;
};

/** A counting threshold crossed within a period */
export type CountingMoment = {
  dataType: 'diapers' | 'feeds' | 'meals' | 'sleepHours' | 'milestones';
  threshold: number;
};

/** Aggregated data for one journal period */
export type JournalSummary = {
  range: JournalRange;
  feedCount: number;
  mealCount: number;
  sleepEntries: number;
  sleepHours: number;
  diaperCount: number;
  pottyCount: number;
  growthLatest: { date: string; weight?: number; height?: number; headCircumference?: number } | null;
  milestonesInRange: { id: string; date: string; title: string; category: number }[];
  needsAdded: number;
  needsAcquired: number;
  needsOutgrown: number;
  countingMoments: CountingMoment[];
};
```

- [ ] **Step 3: Verify typecheck**

Run: `cd /Users/nick/Projects/Github/afp && bun run lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
cd /Users/nick/Projects/Github/afp
git add src/modules/baby/journal/constants.ts src/modules/baby/journal/types.ts
git commit -m "feat(baby): add journal constants and types

- COUNTING_THRESHOLDS for cumulative milestone moments
- JournalGrain enum (Day/Week/Month)
- JournalRange, CountingMoment, JournalSummary types

Plan 7 (life-journal), Task 1"
```

---

### Task 2: Date range helpers

**Files:**
- Create: `src/modules/baby/journal/range.ts`
- Test: `src/modules/baby/__tests__/journal-range.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/modules/baby/__tests__/journal-range.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { computeRange, formatRangeLabel } from '../journal/range';
import { JournalGrain } from '../journal/constants';

describe('computeRange', () => {
  it('Day grain returns single-day range', () => {
    const r = computeRange(JournalGrain.Day, '2026-04-13');
    expect(r.start).toBe('2026-04-13');
    expect(r.end).toBe('2026-04-13');
    expect(r.grain).toBe(JournalGrain.Day);
  });

  it('Week grain returns Mon-Sun containing the date', () => {
    // 2026-04-13 is a Monday
    const r = computeRange(JournalGrain.Week, '2026-04-13');
    expect(r.start).toBe('2026-04-13');
    expect(r.end).toBe('2026-04-19');
  });

  it('Week grain mid-week resolves to containing Mon-Sun', () => {
    // 2026-04-15 is a Wednesday — should still resolve to Apr 13-19
    const r = computeRange(JournalGrain.Week, '2026-04-15');
    expect(r.start).toBe('2026-04-13');
    expect(r.end).toBe('2026-04-19');
  });

  it('Month grain returns first-to-last day of month', () => {
    const r = computeRange(JournalGrain.Month, '2026-04-13');
    expect(r.start).toBe('2026-04-01');
    expect(r.end).toBe('2026-04-30');
  });

  it('Month grain handles February leap year', () => {
    const r = computeRange(JournalGrain.Month, '2024-02-15');
    expect(r.start).toBe('2024-02-01');
    expect(r.end).toBe('2024-02-29');
  });
});

describe('formatRangeLabel', () => {
  it('Day formats as date', () => {
    expect(formatRangeLabel({ start: '2026-04-13', end: '2026-04-13', grain: JournalGrain.Day, label: '' }))
      .toMatch(/Apr.*13.*2026/);
  });

  it('Week formats as range', () => {
    expect(formatRangeLabel({ start: '2026-04-13', end: '2026-04-19', grain: JournalGrain.Week, label: '' }))
      .toMatch(/Apr.*13.*19/);
  });

  it('Month formats as month name', () => {
    expect(formatRangeLabel({ start: '2026-04-01', end: '2026-04-30', grain: JournalGrain.Month, label: '' }))
      .toMatch(/April.*2026/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/nick/Projects/Github/afp && bunx vitest run src/modules/baby/__tests__/journal-range.test.ts`
Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement range.ts**

Create `src/modules/baby/journal/range.ts`:

```typescript
import { JournalGrain } from './constants';
import type { JournalRange } from './types';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function dateToStr(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function strToDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Returns Monday of the week containing the given date */
function startOfWeek(d: Date): Date {
  const result = new Date(d);
  const day = result.getDay(); // 0 = Sunday, 1 = Mon, ..., 6 = Sat
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  result.setDate(result.getDate() + diff);
  return result;
}

/** Returns last day of the month containing the given date */
function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

/** Pure — returns the range for a given grain anchored on a date */
export function computeRange(grain: JournalGrain, anchorDate: string): JournalRange {
  const anchor = strToDate(anchorDate);
  let start: Date;
  let end: Date;
  switch (grain) {
    case JournalGrain.Day:
      start = anchor;
      end = anchor;
      break;
    case JournalGrain.Week:
      start = startOfWeek(anchor);
      end = new Date(start);
      end.setDate(end.getDate() + 6);
      break;
    case JournalGrain.Month:
      start = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
      end = endOfMonth(anchor);
      break;
  }
  const range: JournalRange = {
    start: dateToStr(start),
    end: dateToStr(end),
    grain,
    label: '',
  };
  range.label = formatRangeLabel(range);
  return range;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const SHORT_MONTHS = MONTHS.map(m => m.slice(0, 3));

/** Pure — human-readable label for a range */
export function formatRangeLabel(r: JournalRange): string {
  const startD = strToDate(r.start);
  const endD = strToDate(r.end);
  switch (r.grain) {
    case JournalGrain.Day:
      return `${SHORT_MONTHS[startD.getMonth()]} ${startD.getDate()}, ${startD.getFullYear()}`;
    case JournalGrain.Week:
      return `${SHORT_MONTHS[startD.getMonth()]} ${startD.getDate()}–${endD.getDate()}, ${endD.getFullYear()}`;
    case JournalGrain.Month:
      return `${MONTHS[startD.getMonth()]} ${startD.getFullYear()}`;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/nick/Projects/Github/afp && bunx vitest run src/modules/baby/__tests__/journal-range.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/nick/Projects/Github/afp
git add src/modules/baby/journal/range.ts \
        src/modules/baby/__tests__/journal-range.test.ts
git commit -m "feat(baby): add journal range computation

- computeRange(grain, anchor) → start/end/label
- Week starts Monday; Month covers full calendar month
- formatRangeLabel for human-readable headers

Plan 7 (life-journal), Task 2"
```

---

### Task 3: Aggregation pure functions

**Files:**
- Create: `src/modules/baby/journal/aggregate.ts`
- Test: `src/modules/baby/__tests__/journal-aggregate.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/modules/baby/__tests__/journal-aggregate.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { computeCountingMoments } from '../journal/aggregate';
import { COUNTING_THRESHOLDS } from '../journal/constants';

describe('computeCountingMoments', () => {
  it('returns no moments when no thresholds crossed', () => {
    expect(computeCountingMoments({ totalBefore: 5, totalAfter: 7, dataType: 'diapers' })).toHaveLength(0);
  });

  it('detects single threshold crossed in period', () => {
    const moments = computeCountingMoments({ totalBefore: 95, totalAfter: 102, dataType: 'diapers' });
    expect(moments).toHaveLength(1);
    expect(moments[0].threshold).toBe(100);
    expect(moments[0].dataType).toBe('diapers');
  });

  it('detects multiple thresholds crossed in same period', () => {
    const moments = computeCountingMoments({ totalBefore: 90, totalAfter: 260, dataType: 'diapers' });
    expect(moments).toHaveLength(2);
    expect(moments.map(m => m.threshold)).toEqual([100, 250]);
  });

  it('does not double-count threshold equal to totalBefore', () => {
    // If user already had 100 before period start, the period itself didn't cross it
    expect(computeCountingMoments({ totalBefore: 100, totalAfter: 150, dataType: 'diapers' })).toHaveLength(0);
  });

  it('uses the right threshold list per dataType', () => {
    const moments = computeCountingMoments({ totalBefore: 0, totalAfter: 51, dataType: 'meals' });
    expect(moments).toHaveLength(1);
    expect(moments[0].threshold).toBe(50); // meals starts at 50
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/nick/Projects/Github/afp && bunx vitest run src/modules/baby/__tests__/journal-aggregate.test.ts`
Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement aggregate.ts**

Create `src/modules/baby/journal/aggregate.ts`:

```typescript
import { COUNTING_THRESHOLDS } from './constants';
import type { CountingMoment, JournalSummary, JournalRange } from './types';
import type {
  FeedEntry, SleepEntry, GrowthEntry, EliminationEntry, MealEntry, Milestone, NeedEntry,
} from '../types';
import { EliminationMode, NeedStatus } from '../types';

/** Detect counting thresholds crossed between two cumulative totals */
export function computeCountingMoments(args: {
  totalBefore: number;
  totalAfter: number;
  dataType: keyof typeof COUNTING_THRESHOLDS;
}): CountingMoment[] {
  const { totalBefore, totalAfter, dataType } = args;
  const result: CountingMoment[] = [];
  for (const threshold of COUNTING_THRESHOLDS[dataType]) {
    if (totalBefore < threshold && threshold <= totalAfter) {
      result.push({ dataType, threshold });
    }
  }
  return result;
}

/** Helpful: returns true if entry's date is within the inclusive range */
function inRange(entryDate: string, range: JournalRange): boolean {
  return entryDate >= range.start && entryDate <= range.end;
}

/** Aggregate all subcollection arrays into a JournalSummary for the range */
export function computeJournalSummary(args: {
  range: JournalRange;
  feeds: FeedEntry[];
  sleep: SleepEntry[];
  growth: GrowthEntry[];
  elimination: EliminationEntry[];
  meals: MealEntry[];
  milestones: Milestone[];
  needs: NeedEntry[];
}): JournalSummary {
  const { range, feeds, sleep, growth, elimination, meals, milestones, needs } = args;

  const feedsInRange = feeds.filter(f => inRange(f.date, range));
  const mealsInRange = meals.filter(m => inRange(m.date, range));
  const sleepInRange = sleep.filter(s => inRange(s.date, range));
  const eliminationInRange = elimination.filter(e => inRange(e.date, range));
  const milestonesInRange = milestones.filter(m => inRange(m.date, range));
  const needsInRange = needs.filter(n => inRange(n.date, range));

  // Sleep hours: rough sum of (endTime - startTime) for entries that have both
  const sleepHours = sleepInRange.reduce((acc, s) => {
    if (!s.startTime || !s.endTime) return acc;
    const [sh, sm] = s.startTime.split(':').map(Number);
    const [eh, em] = s.endTime.split(':').map(Number);
    let mins = eh * 60 + em - (sh * 60 + sm);
    if (mins < 0) mins += 24 * 60; // overnight
    return acc + mins / 60;
  }, 0);

  const diaperCount = eliminationInRange.filter(e => e.mode === EliminationMode.Diaper).length;
  const pottyCount = eliminationInRange.filter(e => e.mode === EliminationMode.Potty).length;

  // Growth: latest entry within OR before range (whichever most recent within range)
  const growthInRange = growth.filter(g => inRange(g.date, range));
  const growthLatest = growthInRange.length > 0
    ? growthInRange.reduce((latest, g) => (g.date > latest.date ? g : latest))
    : null;

  // Counting moments — totals before range vs after range
  const totalDiapersBefore = elimination.filter(e => e.mode === EliminationMode.Diaper && e.date < range.start).length;
  const totalDiapersAfter = totalDiapersBefore + diaperCount;
  const totalFeedsBefore = feeds.filter(f => f.date < range.start).length;
  const totalFeedsAfter = totalFeedsBefore + feedsInRange.length;
  const totalMealsBefore = meals.filter(m => m.date < range.start).length;
  const totalMealsAfter = totalMealsBefore + mealsInRange.length;
  const totalMilestonesBefore = milestones.filter(m => m.date < range.start).length;
  const totalMilestonesAfter = totalMilestonesBefore + milestonesInRange.length;

  const countingMoments: CountingMoment[] = [
    ...computeCountingMoments({ totalBefore: totalDiapersBefore, totalAfter: totalDiapersAfter, dataType: 'diapers' }),
    ...computeCountingMoments({ totalBefore: totalFeedsBefore, totalAfter: totalFeedsAfter, dataType: 'feeds' }),
    ...computeCountingMoments({ totalBefore: totalMealsBefore, totalAfter: totalMealsAfter, dataType: 'meals' }),
    ...computeCountingMoments({ totalBefore: totalMilestonesBefore, totalAfter: totalMilestonesAfter, dataType: 'milestones' }),
  ];

  return {
    range,
    feedCount: feedsInRange.length,
    mealCount: mealsInRange.length,
    sleepEntries: sleepInRange.length,
    sleepHours,
    diaperCount,
    pottyCount,
    growthLatest: growthLatest
      ? { date: growthLatest.date, weight: growthLatest.weight ?? undefined, height: growthLatest.height ?? undefined, headCircumference: growthLatest.headCircumference ?? undefined }
      : null,
    milestonesInRange: milestonesInRange.map(m => ({ id: m.id, date: m.date, title: m.title, category: m.category })),
    needsAdded: needsInRange.filter(n => n.status === NeedStatus.Wishlist).length,
    needsAcquired: needsInRange.filter(n => n.status === NeedStatus.Inventory).length,
    needsOutgrown: needsInRange.filter(n => n.status === NeedStatus.Outgrown).length,
    countingMoments,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/nick/Projects/Github/afp && bunx vitest run src/modules/baby/__tests__/journal-aggregate.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/nick/Projects/Github/afp
git add src/modules/baby/journal/aggregate.ts \
        src/modules/baby/__tests__/journal-aggregate.test.ts
git commit -m "feat(baby): add journal aggregation pure functions

- computeCountingMoments — detects thresholds crossed in period
- computeJournalSummary — aggregates all subcollections for a range
- Sleep hours computed from start/end times (handles overnight)
- Growth uses latest entry within range
- Need status counts split (added/acquired/outgrown)

Plan 7 (life-journal), Task 3"
```

---

## Phase B — Hook

### Task 4: useJournalData hook

**Files:**
- Create: `src/modules/baby/hooks/useJournalData.ts`

- [ ] **Step 1: Implement hook**

Create `src/modules/baby/hooks/useJournalData.ts`:

```typescript
import { useMemo } from 'react';
import { useBabyCollection } from './useBabyCollection';
import { computeJournalSummary } from '../journal/aggregate';
import type { JournalRange, JournalSummary } from '../journal/types';
import type {
  FeedEntry, SleepEntry, GrowthEntry, EliminationEntry, MealEntry, Milestone, NeedEntry,
} from '../types';

/** Returns aggregated journal data for one child + one range */
export function useJournalData(childId: string, range: JournalRange): JournalSummary | null {
  const { items: feeds } = useBabyCollection<FeedEntry>(childId, 'feeds', 'Feed');
  const { items: sleep } = useBabyCollection<SleepEntry>(childId, 'sleep', 'Sleep');
  const { items: growth } = useBabyCollection<GrowthEntry>(childId, 'growth', 'Growth');
  const { items: elimination } = useBabyCollection<EliminationEntry>(childId, 'elimination', 'Elimination');
  const { items: meals } = useBabyCollection<MealEntry>(childId, 'meals', 'Meal');
  const { items: milestones } = useBabyCollection<Milestone>(childId, 'milestones', 'Milestone');
  const { items: needs } = useBabyCollection<NeedEntry>(childId, 'needs', 'Need');

  return useMemo(() => {
    if (!childId) return null;
    return computeJournalSummary({ range, feeds, sleep, growth, elimination, meals, milestones, needs });
  }, [childId, range, feeds, sleep, growth, elimination, meals, milestones, needs]);
}
```

- [ ] **Step 2: Verify typecheck**

Run: `cd /Users/nick/Projects/Github/afp && bun run lint`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
cd /Users/nick/Projects/Github/afp
git add src/modules/baby/hooks/useJournalData.ts
git commit -m "feat(baby): add useJournalData hook

Composes 7 useBabyCollection calls + computeJournalSummary

Plan 7 (life-journal), Task 4"
```

---

## Phase C — UI Components

### Task 5: JournalPicker component

**Files:**
- Create: `src/modules/baby/components/JournalPicker.tsx`
- Test: `src/modules/baby/__tests__/JournalPicker.test.tsx`

- [ ] **Step 1: Implement JournalPicker**

Create `src/modules/baby/components/JournalPicker.tsx`:

```typescript
import { JournalGrain } from '../journal/constants';
import type { JournalRange } from '../journal/types';
import { computeRange } from '../journal/range';

type Props = {
  range: JournalRange;
  onChange: (next: JournalRange) => void;
};

/** Grain selector + period stepper */
export function JournalPicker({ range, onChange }: Props): JSX.Element {
  function setGrain(grain: JournalGrain) {
    onChange(computeRange(grain, range.start));
  }

  function step(direction: -1 | 1) {
    const anchor = new Date(range.start);
    if (range.grain === JournalGrain.Day) {
      anchor.setDate(anchor.getDate() + direction);
    } else if (range.grain === JournalGrain.Week) {
      anchor.setDate(anchor.getDate() + 7 * direction);
    } else {
      anchor.setMonth(anchor.getMonth() + direction);
    }
    const nextDate = `${anchor.getFullYear()}-${String(anchor.getMonth() + 1).padStart(2, '0')}-${String(anchor.getDate()).padStart(2, '0')}`;
    onChange(computeRange(range.grain, nextDate));
  }

  return (
    <div className="mb-4 flex items-center justify-between gap-2">
      <div className="flex gap-1">
        {[
          { label: 'Day', value: JournalGrain.Day },
          { label: 'Week', value: JournalGrain.Week },
          { label: 'Month', value: JournalGrain.Month },
        ].map(g => (
          <button
            key={g.label}
            type="button"
            onClick={() => setGrain(g.value)}
            className={`rounded px-3 py-1 text-sm ${range.grain === g.value ? 'bg-accent text-fg-on-accent' : 'border border-line text-fg-muted'}`}
          >
            {g.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 text-sm">
        <button type="button" onClick={() => step(-1)} aria-label="previous period" className="text-fg-muted">‹</button>
        <span className="text-fg">{range.label}</span>
        <button type="button" onClick={() => step(1)} aria-label="next period" className="text-fg-muted">›</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write component test**

Create `src/modules/baby/__tests__/JournalPicker.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { JournalPicker } from '../components/JournalPicker';
import { computeRange } from '../journal/range';
import { JournalGrain } from '../journal/constants';

describe('JournalPicker', () => {
  it('renders all 3 grain buttons', () => {
    const range = computeRange(JournalGrain.Day, '2026-04-13');
    render(<JournalPicker range={range} onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Day' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Week' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Month' })).toBeInTheDocument();
  });

  it('calls onChange with new grain on click', () => {
    const onChange = vi.fn();
    const range = computeRange(JournalGrain.Day, '2026-04-13');
    render(<JournalPicker range={range} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Week' }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ grain: JournalGrain.Week }));
  });

  it('steps to next period on > click', () => {
    const onChange = vi.fn();
    const range = computeRange(JournalGrain.Day, '2026-04-13');
    render(<JournalPicker range={range} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('next period'));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ start: '2026-04-14' }));
  });

  it('steps to previous period on < click', () => {
    const onChange = vi.fn();
    const range = computeRange(JournalGrain.Day, '2026-04-13');
    render(<JournalPicker range={range} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('previous period'));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ start: '2026-04-12' }));
  });
});
```

- [ ] **Step 3: Run tests**

Run: `cd /Users/nick/Projects/Github/afp && bunx vitest run src/modules/baby/__tests__/JournalPicker.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 4: Commit**

```bash
cd /Users/nick/Projects/Github/afp
git add src/modules/baby/components/JournalPicker.tsx \
        src/modules/baby/__tests__/JournalPicker.test.tsx
git commit -m "feat(baby): add JournalPicker component

- Day/Week/Month grain selector
- Period stepper (prev/next arrows)
- Theme-aware styling

Plan 7 (life-journal), Task 5"
```

---

### Task 6: JournalCard wrapper component

**Files:**
- Create: `src/modules/baby/components/JournalCard.tsx`

- [ ] **Step 1: Implement JournalCard**

Create `src/modules/baby/components/JournalCard.tsx`:

```typescript
import type { ReactNode } from 'react';

type Props = {
  title: string;
  children: ReactNode;
  /** Show muted "no entries" if children would render empty */
  empty?: boolean;
  emptyText?: string;
};

/** Generic card wrapper used by Life Journal */
export function JournalCard({ title, children, empty, emptyText = 'No entries this period' }: Props): JSX.Element {
  return (
    <div className="rounded-lg border border-line bg-surface-card p-3">
      <h3 className="mb-2 text-sm font-medium text-fg">{title}</h3>
      {empty ? <p className="text-sm text-fg-muted">{emptyText}</p> : children}
    </div>
  );
}
```

- [ ] **Step 2: Verify typecheck**

Run: `cd /Users/nick/Projects/Github/afp && bun run lint`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
cd /Users/nick/Projects/Github/afp
git add src/modules/baby/components/JournalCard.tsx
git commit -m "feat(baby): add JournalCard wrapper component

Generic card with title + children + empty-state fallback

Plan 7 (life-journal), Task 6"
```

---

### Task 7: LifeJournalView main component

**Files:**
- Create: `src/modules/baby/components/LifeJournalView.tsx`
- Test: `src/modules/baby/__tests__/LifeJournalView.test.tsx`

- [ ] **Step 1: Implement LifeJournalView**

Create `src/modules/baby/components/LifeJournalView.tsx`:

```typescript
import { useState } from 'react';
import { computeStage } from '../stage';
import { ChildStage, MilestoneCategory, type Child } from '../types';
import { computeRange } from '../journal/range';
import { JournalGrain } from '../journal/constants';
import type { JournalRange } from '../journal/types';
import { useJournalData } from '../hooks/useJournalData';
import { JournalPicker } from './JournalPicker';
import { JournalCard } from './JournalCard';
import { todayStr } from '@/shared/utils/date';

type Props = { child: Child };

const STAGE_LABEL: Record<ChildStage, string> = {
  [ChildStage.Infant]: 'Infant',
  [ChildStage.Toddler]: 'Toddler',
  [ChildStage.Kid]: 'Kid',
};

export function LifeJournalView({ child }: Props): JSX.Element {
  const [range, setRange] = useState<JournalRange>(() => computeRange(JournalGrain.Week, todayStr()));
  const summary = useJournalData(child.id ?? '', range);
  const stage = computeStage(child.dob);

  if (!summary) return <p className="text-sm text-fg-muted">Loading journal…</p>;

  return (
    <section>
      <h2 className="mb-1 text-lg font-semibold text-fg">Life Journal</h2>
      <p className="mb-3 text-sm text-fg-muted">
        {child.name}, {STAGE_LABEL[stage]} — {range.label}
      </p>

      <JournalPicker range={range} onChange={setRange} />

      <div className="space-y-3">
        {summary.countingMoments.length > 0 && (
          <JournalCard title="🎉 Counting moments">
            <ul className="list-disc pl-5 text-sm text-fg">
              {summary.countingMoments.map((m, i) => (
                <li key={i}>
                  Crossed {m.threshold} {m.dataType} this period
                </li>
              ))}
            </ul>
          </JournalCard>
        )}

        <JournalCard title="Feeds & Meals" empty={summary.feedCount + summary.mealCount === 0}>
          <p className="text-sm text-fg">
            {summary.feedCount} feed{summary.feedCount === 1 ? '' : 's'}, {summary.mealCount} meal
            {summary.mealCount === 1 ? '' : 's'}
          </p>
        </JournalCard>

        <JournalCard title="Sleep" empty={summary.sleepEntries === 0}>
          <p className="text-sm text-fg">
            {summary.sleepEntries} entries, ~{summary.sleepHours.toFixed(1)} hours total
          </p>
        </JournalCard>

        <JournalCard title="Growth" empty={summary.growthLatest === null}>
          {summary.growthLatest && (
            <p className="text-sm text-fg">
              Last measured {summary.growthLatest.date}
              {summary.growthLatest.weight !== undefined && ` — ${summary.growthLatest.weight}kg`}
              {summary.growthLatest.height !== undefined && `, ${summary.growthLatest.height}cm`}
              {summary.growthLatest.headCircumference !== undefined && `, head ${summary.growthLatest.headCircumference}cm`}
            </p>
          )}
        </JournalCard>

        <JournalCard title="Elimination" empty={summary.diaperCount + summary.pottyCount === 0}>
          <p className="text-sm text-fg">
            {summary.diaperCount} diaper change{summary.diaperCount === 1 ? '' : 's'},{' '}
            {summary.pottyCount} potty event{summary.pottyCount === 1 ? '' : 's'}
          </p>
        </JournalCard>

        <JournalCard title="Milestones" empty={summary.milestonesInRange.length === 0}>
          <ul className="space-y-1 text-sm text-fg">
            {summary.milestonesInRange.map(m => (
              <li key={m.id}>
                <strong>{m.title}</strong> — {MilestoneCategory[m.category]} ({m.date})
              </li>
            ))}
          </ul>
        </JournalCard>

        <JournalCard
          title="Needs activity"
          empty={summary.needsAdded + summary.needsAcquired + summary.needsOutgrown === 0}
        >
          <p className="text-sm text-fg">
            Added: {summary.needsAdded}. Acquired: {summary.needsAcquired}. Outgrown: {summary.needsOutgrown}.
          </p>
        </JournalCard>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Write component test**

Create `src/modules/baby/__tests__/LifeJournalView.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LifeJournalView } from '../components/LifeJournalView';
import { type Child } from '../types';

vi.mock('../hooks/useJournalData', () => ({
  useJournalData: () => ({
    range: { start: '2026-04-13', end: '2026-04-19', grain: 1, label: 'Apr 13–19, 2026' },
    feedCount: 12,
    mealCount: 8,
    sleepEntries: 14,
    sleepHours: 88.5,
    diaperCount: 32,
    pottyCount: 4,
    growthLatest: { date: '2026-04-10', weight: 11.2, height: 78 },
    milestonesInRange: [{ id: 'm1', date: '2026-04-15', title: 'First word', category: 1 }],
    needsAdded: 2,
    needsAcquired: 1,
    needsOutgrown: 1,
    countingMoments: [{ dataType: 'diapers', threshold: 1000 }],
  }),
}));

const child: Child = {
  id: 'c1', name: 'Aanya', dob: '2024-04-13',
  config: { feeding: true, sleep: true, growth: true, diapers: true, meals: true, potty: false, milestones: true, needs: true },
  createdAt: '', updatedAt: '',
};

describe('LifeJournalView', () => {
  it('renders header with child name and stage', () => {
    render(<LifeJournalView child={child} />);
    expect(screen.getByText('Life Journal')).toBeInTheDocument();
    expect(screen.getByText(/Aanya/)).toBeInTheDocument();
    expect(screen.getByText(/Toddler/)).toBeInTheDocument();
  });

  it('renders counting moments card when present', () => {
    render(<LifeJournalView child={child} />);
    expect(screen.getByText(/Counting moments/)).toBeInTheDocument();
    expect(screen.getByText(/Crossed 1000 diapers/)).toBeInTheDocument();
  });

  it('renders feeds & meals counts', () => {
    render(<LifeJournalView child={child} />);
    expect(screen.getByText(/12 feeds, 8 meals/)).toBeInTheDocument();
  });

  it('renders milestones list', () => {
    render(<LifeJournalView child={child} />);
    expect(screen.getByText(/First word/)).toBeInTheDocument();
  });

  it('renders needs activity counts', () => {
    render(<LifeJournalView child={child} />);
    expect(screen.getByText(/Added: 2.*Acquired: 1.*Outgrown: 1/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run tests**

Run: `cd /Users/nick/Projects/Github/afp && bunx vitest run src/modules/baby/__tests__/LifeJournalView.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 4: Commit**

```bash
cd /Users/nick/Projects/Github/afp
git add src/modules/baby/components/LifeJournalView.tsx \
        src/modules/baby/__tests__/LifeJournalView.test.tsx
git commit -m "feat(baby): add LifeJournalView main component

- Header with child name + computed stage label
- JournalPicker for D/W/M grain + period stepping
- 7 cards (counting moments, feeds+meals, sleep, growth, elimination, milestones, needs)
- Empty-state fallbacks per card

Plan 7 (life-journal), Task 7"
```

---

## Phase D — Integration

### Task 8: Wire LifeJournalView into ChildDetail + CHANGELOG

**Files:**
- Modify: `src/modules/baby/components/ChildDetail.tsx`
- Modify: `afp/CHANGELOG.md`

- [ ] **Step 1: Add tab in ChildDetail**

In `src/modules/baby/components/ChildDetail.tsx`, add the import:

```typescript
import { LifeJournalView } from './LifeJournalView';
```

And add the tab unconditionally (no `ChildConfig` flag needed):

```typescript
<LifeJournalView child={child} />
```

Place it as the last tab (or wherever the tab order makes sense — at the end or after Milestones is a natural fit).

- [ ] **Step 2: Verify typecheck**

Run: `cd /Users/nick/Projects/Github/afp && bun run lint`
Expected: PASS.

- [ ] **Step 3: Update CHANGELOG**

In `afp/CHANGELOG.md`, under `[0.4.0] — Unreleased` › `### Added`:

```markdown
- Life Journal view — Daily/Weekly/Monthly aggregation across all baby subcollections (feeds, meals, sleep, growth, elimination, milestones, needs). Auto-detected counting moments (e.g. "Crossed 1000 diapers this period"). Static aggregation in v1; sharing and AI narrative deferred.
```

- [ ] **Step 4: Commit**

```bash
cd /Users/nick/Projects/Github/afp
git add src/modules/baby/components/ChildDetail.tsx CHANGELOG.md
git commit -m "feat(baby): wire LifeJournalView into ChildDetail tabs

Always visible (no ChildConfig flag — read-only view, low cost)

Plan 7 (life-journal), Task 8"
```

---

## Self-Review

| Check | Result |
|---|---|
| Spec coverage | § 9 (Life Journal) — D/W/M views, static aggregation, counting milestones (compute-on-read), card structure all covered. Sharing & AI narrative correctly deferred to § 14. |
| Type consistency | `JournalGrain`, `JournalRange`, `JournalSummary`, `CountingMoment` defined once and used throughout. Entry types from Plan 1 used directly. |
| Placeholder scan | None — all code complete |
| Test coverage | 8 unit tests (range) + 5 unit tests (aggregate) + 4 + 5 component tests = 22 tests added |
| Decision: no admin toggle | Documented in File Structure section. Life Journal is a read-only view; gating it adds noise. Reversible if needed. |
| Cross-plan dependencies | Plans 3 (elimination), 4 (meals), 5 (needs), 6 (milestones) all source data; Life Journal degrades gracefully when subcollections are empty (per-card empty-state fallbacks) |

---

## Execution

**Plan complete. Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between
2. **Inline Execution** — sequential in current session via `executing-plans` skill

8 tasks; subagent-driven works well — each task is independently testable.

# Phase 3 Baby — Foundation (Plan 1 of 9)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lay the type-and-pure-logic skeleton for AFP's Module A (Baby → Kid). After this plan ships, all subsequent baby-module plans (suggestions, elimination, meals, needs, milestones, life-journal) can proceed independently.

**Architecture:** Pure additions — new enums, new entry types, extended `ChildConfig` and `Child` types, plus `stage.ts` with `computeStage()` (DoB → ChildStage) and threshold constants. No UI, no Firestore writes, no migrations. Build + lint + tests stay green on completion.

**Tech Stack:** TypeScript (strict), Vitest. Existing AFP stack — no new deps.

**Spec:** [`docs/specs/2026-04-13-phase3-baby-to-kid-design.md`](../specs/2026-04-13-phase3-baby-to-kid-design.md) — read §§ 2 + 12.

**Plan position:** Plan 1 of 9 for Module A. Foundation — required by Plans 2 (suggestions), 3 (elimination), 4 (meals), 5 (needs), 6 (milestones), 7 (life-journal). No dependencies upstream.

---

## File Structure

### Created files

| Path | Responsibility |
|---|---|
| `src/modules/baby/stage.ts` | `ChildStage` enum, `STAGE_BOUNDARIES`, `SUGGEST_THRESHOLDS`, `SUGGESTION_SNOOZE_DAYS` constants, `computeStage()` and `monthsOldFromDob()` pure functions |
| `src/modules/baby/__tests__/stage.test.ts` | Unit tests for stage derivation and threshold logic |

### Modified files

| Path | Change |
|---|---|
| `src/modules/baby/types.ts` | Add 7 new enums + 4 new entry types (`EliminationEntry`, `MealEntry`, `NeedEntry`, `Milestone`) + `SuggestionSnooze` + extend `ChildConfig` + extend `Child` with `suggestionState?` |

---

## Phase A — Type Foundation

### Task 1: Extend types.ts with new enums and entry types

**Files:**
- Modify: `src/modules/baby/types.ts`

- [ ] **Step 1: Add new enums to types.ts**

Append below the existing `DiaperType` enum:

```typescript
/** Combined elimination tracking — diaper events (infant) or potty events (toddler+) */
export enum EliminationMode {
  Diaper = 0,
  Potty = 1,
}

/** Potty training event — captures both successes (on potty) and accidents (off potty) */
export enum PottyTrainingEvent {
  Pee = 0,
  Poop = 1,
  Both = 2,
  Accident = 3,
  Attempt = 4,
}

/** Meal type categories */
export enum MealType {
  Breakfast = 0,
  Lunch = 1,
  Dinner = 2,
  Snack = 3,
}

/** Portion eaten — qualitative scale (0=refused, 6=seconds) */
export enum MealPortion {
  None = 0,    // 0% — refused
  Bite = 1,    // ~10% — took a single bite/taste
  Little = 2,  // ~25% — took a little
  Some = 3,    // ~50% — about half
  Most = 4,    // ~75%
  All = 5,     // 100%
  Extra = 6,   // >100% — seconds
}

/** Need category */
export enum NeedCategory {
  Apparel = 0,
  Footwear = 1,
  School = 2,
  Toys = 3,
  Books = 4,
  Other = 5,
}

/** Need lifecycle status */
export enum NeedStatus {
  Wishlist = 0,
  Inventory = 1,
  Outgrown = 2,
}

/** Child age stage — derived from DoB, never persisted */
export enum ChildStage {
  Infant = 0,
  Toddler = 1,
  Kid = 2,
}
```

- [ ] **Step 2: Add new entry types, Milestone, and SuggestionSnooze**

Append after the existing entry types:

```typescript
/** Combined elimination entry — discriminated by mode */
export type EliminationEntry = {
  id: string;
  date: string;
  time: string;
  mode: EliminationMode;
  diaperType?: DiaperType;
  pottyEvent?: PottyTrainingEvent;
  timestamp: string;
  createdAt: string;
  notes: string;
};

/** Meal/food entry */
export type MealEntry = {
  id: string;
  date: string;
  time: string;
  type: MealType;
  description: string;
  portion: MealPortion | null;
  timestamp: string;
  createdAt: string;
  notes: string;
};

/** Need entry — wishlist/inventory/outgrown */
export type NeedEntry = {
  id: string;
  date: string;
  title: string;
  category: NeedCategory;
  status: NeedStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

/** Milestone entry — developmental firsts, recurring achievements, custom events */
export type Milestone = {
  id: string;
  date: string;
  category: MilestoneCategory;
  title: string;
  description?: string;
  mediaUrl?: string;
  timestamp: string;
  createdAt: string;
  notes: string;
};

/** Snooze state for one suggestion feature */
export type SuggestionSnooze = {
  snoozedUntil: string; // ISO date YYYY-MM-DD
};
```

- [ ] **Step 3: Extend ChildConfig with new feature flags**

Replace the existing `ChildConfig` type definition with:

```typescript
/** Per-child module toggles controlling which tracking tabs are visible */
export type ChildConfig = {
  feeding: boolean;     // existing — Feed module
  sleep: boolean;       // existing
  growth: boolean;      // existing
  diapers: boolean;     // existing — Diaper mode of elimination subcollection
  meals: boolean;       // NEW — Meals module
  potty: boolean;       // NEW — Potty mode of elimination subcollection
  milestones: boolean;  // NEW — Milestones module (Plan 6)
  needs: boolean;       // NEW — Needs module
};
```

- [ ] **Step 4: Extend Child type with suggestionState**

Replace the existing `Child` type definition with:

```typescript
/** A child profile in the children collection */
export type Child = {
  id?: string;
  name: string;
  dob: string;
  config: ChildConfig;
  createdAt: string;
  updatedAt: string;
  suggestionState?: {
    feeds?: SuggestionSnooze;
    diapers?: SuggestionSnooze;
    meals?: SuggestionSnooze;
    potty?: SuggestionSnooze;
  };
};
```

- [ ] **Step 5: Run typecheck to verify no break**

Run: `cd /Users/nick/Projects/Github/afp && bun run lint`
Expected: PASS (no type errors). Existing children with old `ChildConfig` shape remain compatible because new fields default to `undefined` (treated as `false` in code paths via `?? false`).

- [ ] **Step 6: Commit**

```bash
cd /Users/nick/Projects/Github/afp
git add src/modules/baby/types.ts
git commit -m "feat(baby): extend types for stage-aware modules

- Add EliminationMode, PottyTrainingEvent, MealType, MealPortion, NeedCategory, NeedStatus, MilestoneCategory, ChildStage enums
- Add EliminationEntry, MealEntry, NeedEntry, Milestone, SuggestionSnooze types
- Extend ChildConfig with meals, potty, milestones, needs flags
- Extend Child with optional suggestionState

Plan 1 (foundation), Task 1"
```

---

## Phase B — Stage Model

### Task 2: Create stage.ts with constants and computeStage

**Files:**
- Create: `src/modules/baby/stage.ts`
- Test: `src/modules/baby/__tests__/stage.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/modules/baby/__tests__/stage.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { computeStage, monthsOldFromDob, STAGE_BOUNDARIES } from '../stage';
import { ChildStage } from '../types';

describe('monthsOldFromDob', () => {
  it('returns 0 for today', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(monthsOldFromDob(today)).toBe(0);
  });

  it('returns 12 for one year ago', () => {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    expect(monthsOldFromDob(oneYearAgo.toISOString().split('T')[0])).toBe(12);
  });

  it('returns 36 for three years ago', () => {
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
    expect(monthsOldFromDob(threeYearsAgo.toISOString().split('T')[0])).toBe(36);
  });
});

describe('computeStage', () => {
  function dobMonthsAgo(months: number): string {
    const d = new Date();
    d.setMonth(d.getMonth() - months);
    return d.toISOString().split('T')[0];
  }

  it('returns Infant for newborn', () => {
    expect(computeStage(dobMonthsAgo(0))).toBe(ChildStage.Infant);
  });

  it('returns Infant just under toddler boundary', () => {
    expect(computeStage(dobMonthsAgo(STAGE_BOUNDARIES.toddler - 1))).toBe(ChildStage.Infant);
  });

  it('returns Toddler at toddler boundary', () => {
    expect(computeStage(dobMonthsAgo(STAGE_BOUNDARIES.toddler))).toBe(ChildStage.Toddler);
  });

  it('returns Toddler just under kid boundary', () => {
    expect(computeStage(dobMonthsAgo(STAGE_BOUNDARIES.kid - 1))).toBe(ChildStage.Toddler);
  });

  it('returns Kid at kid boundary', () => {
    expect(computeStage(dobMonthsAgo(STAGE_BOUNDARIES.kid))).toBe(ChildStage.Kid);
  });

  it('returns Kid for older child', () => {
    expect(computeStage(dobMonthsAgo(60))).toBe(ChildStage.Kid);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/nick/Projects/Github/afp && bunx vitest run src/modules/baby/__tests__/stage.test.ts`
Expected: FAIL with module-not-found error for `../stage`.

- [ ] **Step 3: Implement stage.ts**

Create `src/modules/baby/stage.ts`:

```typescript
import { ChildStage } from './types';

/** Stage label cutoffs in months — derived narrative only, not enforcement */
export const STAGE_BOUNDARIES = {
  toddler: 12,
  kid: 36,
} as const;

/** Per-feature suggestion thresholds in months (see spec § 2) */
export const SUGGEST_THRESHOLDS = {
  feeds: { suggestOff: 18 },
  diapers: { suggestOff: 30 },
  meals: { suggestOn: 9 },
  potty: { suggestOn: 24 },
} as const;

/** Days a snoozed suggestion stays hidden before re-surfacing */
export const SUGGESTION_SNOOZE_DAYS = 30;

/** Returns whole months between dob and today */
export function monthsOldFromDob(dob: string): number {
  const dobDate = new Date(dob);
  const today = new Date();
  let months = (today.getFullYear() - dobDate.getFullYear()) * 12;
  months += today.getMonth() - dobDate.getMonth();
  if (today.getDate() < dobDate.getDate()) months -= 1;
  return Math.max(0, months);
}

/** Returns derived stage from DoB. Pure function — never persisted. */
export function computeStage(dob: string): ChildStage {
  const months = monthsOldFromDob(dob);
  if (months < STAGE_BOUNDARIES.toddler) return ChildStage.Infant;
  if (months < STAGE_BOUNDARIES.kid) return ChildStage.Toddler;
  return ChildStage.Kid;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/nick/Projects/Github/afp && bunx vitest run src/modules/baby/__tests__/stage.test.ts`
Expected: PASS (all 9 tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/nick/Projects/Github/afp
git add src/modules/baby/stage.ts src/modules/baby/__tests__/stage.test.ts
git commit -m "feat(baby): add stage model (computeStage + thresholds)

- ChildStage derivation from DoB (pure function, never persisted)
- STAGE_BOUNDARIES constant (toddler=12mo, kid=36mo)
- SUGGEST_THRESHOLDS constant (per-feature age cutoffs)
- SUGGESTION_SNOOZE_DAYS constant (30)
- monthsOldFromDob helper

Plan 1 (foundation), Task 2"
```

---

## Self-Review

| Check | Result |
|---|---|
| Spec coverage | § 2 (Stage Model) and § 12 (Data Model Summary) — all enums, types, and constants present |
| Type consistency | `ChildStage` defined in types.ts, used by stage.ts; `STAGE_BOUNDARIES` and `SUGGEST_THRESHOLDS` exported with literal types via `as const` |
| Placeholder scan | None — all code complete and runnable |
| Test coverage | 9 unit tests covering boundary conditions + helper |
| Build state on completion | Compiles (no UI changes), tests pass, no ESLint errors expected |

This plan ships a **silent foundation** — no user-visible change, but every subsequent Module A plan can now reference the new types, enums, and stage helpers.

---

## Execution

**Plan complete. Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between
2. **Inline Execution** — sequential in current session via `executing-plans` skill

Foundation plan is small (2 tasks). Either works fine.

# Flaw in the Plan — Cleanup Execution Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended for Waves 1, 2, 3) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Address all 44 findings from `the-final-countdown` review of PRs #15–#19, plus Nick's JSDoc total-coverage point, plus the full docs sweep cycle, then re-verify with another agent review pass — all on `feat/the-flaw-in-the-plan` and squash-merged as one PR.

**Architecture:** 5 sequential waves. Foundation primitives (`assertNever`, `ExpenseMetaType`, `VEHICLE_SUBCAT`, `deriveFuelTriple`) land first, then apply-sites get migrated, then targeted bug fixes, then refactors that absorb multiple Med/Low findings, then a parallel subagent-fleet JSDoc sweep, then docs cycle, then the agent re-review exit gate.

**Tech Stack:** React 19 · TypeScript 5 · Vite 8 · Tailwind v4 · Firebase · Vitest · Playwright · Bun · Prettier · ESLint

**Source spec:** `docs/specs/2026-05-15-flaw-in-the-plan-cleanup-design.md`
**Branch:** `feat/the-flaw-in-the-plan` (created from `master @ f31c7a9`)
**Baseline (master):** format ✅ · lint ✅ · 637 unit tests ✅ · 81 e2e tests ✅

---

## Universal Conventions

- **TDD per fix.** Write a failing vitest case first, run to confirm it fails for the right reason, then implement the fix, then run to confirm it passes.
- **One commit per task** (or per logical group of related-finding fixes). Squash to one PR at the end.
- **No `Co-Authored-By` lines** per CLAUDE.md global rule.
- **No `git push --force`, no `git rebase`, no `git reset --hard`** without explicit confirmation per CLAUDE.md.
- **After every fix:** `bun run test` (unit only) to catch regressions. Full e2e suite only at Wave 5.
- **Style:** Prettier-owned. Don't fight the formatter; let it run.

---

## Wave 1 — CRITICAL + HIGH (16 findings, 20 tasks)

Foundation primitives first (Tasks 1–4). Then bulk-apply migrations (Tasks 5–7). Then targeted fixes (Tasks 8–20).

### Task 1: `assertNever` exhaustiveness helper (Decision E1)

**Files:**
- Create: `src/shared/utils/types.ts`
- Test: `src/shared/utils/__tests__/types.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/shared/utils/__tests__/types.test.ts
import { describe, it, expect } from 'vitest';
import { assertNever } from '../types';

describe('assertNever', () => {
  it('throws when called (runtime safety net for compile-time-only paths)', () => {
    expect(() => assertNever('unexpected' as never)).toThrow(/unexpected/i);
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

`bunx vitest run src/shared/utils/__tests__/types.test.ts` → expect FAIL (module not found).

- [ ] **Step 3: Write minimal implementation**

```ts
// src/shared/utils/types.ts
/** Compile-time exhaustiveness check; throws if reached at runtime. */
export function assertNever(x: never): never {
  throw new Error(`Unexpected value reached assertNever: ${JSON.stringify(x)}`);
}
```

- [ ] **Step 4: Run test, verify it passes**

`bunx vitest run src/shared/utils/__tests__/types.test.ts` → expect PASS.

- [ ] **Step 5: Commit**

```bash
git add src/shared/utils/types.ts src/shared/utils/__tests__/types.test.ts
git commit -m "feat(shared): add assertNever exhaustiveness helper (Decision E1)"
```

### Task 2: `ExpenseMetaType` enum (foundation for H5)

**Files:**
- Modify: `src/modules/expenses/types.ts`
- Test: `src/modules/expenses/__tests__/types.test.ts` (new)

- [ ] **Step 1: Write the failing test**

```ts
// src/modules/expenses/__tests__/types.test.ts
import { describe, it, expect } from 'vitest';
import { ExpenseMetaType } from '../types';

describe('ExpenseMetaType', () => {
  it('exposes Fuel, Travel, Maintenance string members', () => {
    expect(ExpenseMetaType.Fuel).toBe('fuel');
    expect(ExpenseMetaType.Travel).toBe('travel');
    expect(ExpenseMetaType.Maintenance).toBe('maintenance');
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

`bunx vitest run src/modules/expenses/__tests__/types.test.ts` → FAIL (ExpenseMetaType not exported).

- [ ] **Step 3: Add enum to types.ts**

In `src/modules/expenses/types.ts`, add at top:

```ts
/** Discriminator tag for Expense.meta variants. */
export enum ExpenseMetaType {
  Fuel = 'fuel',
  Travel = 'travel',
  Maintenance = 'maintenance',
}
```

Keep the existing `type: 'fuel'` literal-typed variants UNCHANGED for now — they're string-compatible with the enum and won't break callers. Migration happens in Task 5.

- [ ] **Step 4: Run test, verify it passes**

`bunx vitest run src/modules/expenses/__tests__/types.test.ts` → PASS. Also: `bun run typecheck` → 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/modules/expenses/types.ts src/modules/expenses/__tests__/types.test.ts
git commit -m "feat(expenses): introduce ExpenseMetaType enum (foundation for H5)"
```

### Task 3: `VEHICLE_SUBCAT` typed constants (foundation for H6)

**Files:**
- Modify: `src/modules/expenses/categories.ts`
- Test: `src/modules/expenses/__tests__/categories.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// add to src/modules/expenses/__tests__/categories.test.ts
import { VEHICLE_SUBCAT } from '../categories';
describe('VEHICLE_SUBCAT', () => {
  it('exposes Fuel, Maintenance, Cab keys with the storage strings the UI uses', () => {
    expect(VEHICLE_SUBCAT.Fuel).toBe('Fuel');
    expect(VEHICLE_SUBCAT.Maintenance).toBe('Maintenance');
    expect(VEHICLE_SUBCAT.Cab).toBe('Cab/Auto');
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

- [ ] **Step 3: Add to categories.ts**

```ts
/** Stable keys for Vehicle subcategories — used for routing meta + storage. Never localize. */
export const VEHICLE_SUBCAT = {
  Fuel: 'Fuel',
  Maintenance: 'Maintenance',
  Cab: 'Cab/Auto',
  Public: 'Public Transport',
  Parking: 'Parking',
  Toll: 'Toll',
} as const;
export type VehicleSubcat = (typeof VEHICLE_SUBCAT)[keyof typeof VEHICLE_SUBCAT];
```

Mirror the actual subcategory strings already in `CATEGORIES[Cat.Vehicle].subs` exactly. Open `categories.ts` and copy the strings verbatim — DO NOT add new subcats or rename existing ones.

- [ ] **Step 4: Test passes**

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(expenses): VEHICLE_SUBCAT typed constants (foundation for H6)"
```

### Task 4: `deriveFuelTriple` pure utility in `fuel-math.ts` (foundation for H13)

**Files:**
- Modify: `src/modules/expenses/fuel-math.ts`
- Modify: `src/modules/expenses/__tests__/fuel-math.test.ts`

- [ ] **Step 1: Write failing tests (all 6 transitions)**

```ts
// add to src/modules/expenses/__tests__/fuel-math.test.ts
import { deriveFuelTriple } from '../fuel-math';

describe('deriveFuelTriple', () => {
  it('liters+price+(no amount) → fills amount', () => {
    expect(deriveFuelTriple({ liters: 40, pricePerLiter: 100, amount: 0, lastEdited: 'liters' }))
      .toEqual({ liters: 40, pricePerLiter: 100, amount: 4000 });
  });
  it('liters+amount+(no price) → fills price', () => {
    expect(deriveFuelTriple({ liters: 40, pricePerLiter: 0, amount: 4000, lastEdited: 'liters' }))
      .toEqual({ liters: 40, pricePerLiter: 100, amount: 4000 });
  });
  it('price+amount+(no liters) → fills liters', () => {
    expect(deriveFuelTriple({ liters: 0, pricePerLiter: 100, amount: 4000, lastEdited: 'price' }))
      .toEqual({ liters: 40, pricePerLiter: 100, amount: 4000 });
  });
  it('does not clobber user-typed amount when lastEdited !== amount and amount > 0', () => {
    // user typed liters=40, price=100, then amount=5000 manually; lastEdited='amount'
    expect(deriveFuelTriple({ liters: 40, pricePerLiter: 100, amount: 5000, lastEdited: 'amount' }))
      .toEqual({ liters: 40, pricePerLiter: 100, amount: 5000 }); // unchanged
  });
  it('skips derivation when any operand is 0 / NaN / Infinity', () => {
    expect(deriveFuelTriple({ liters: 0, pricePerLiter: 0, amount: 0, lastEdited: 'liters' }))
      .toEqual({ liters: 0, pricePerLiter: 0, amount: 0 });
    expect(deriveFuelTriple({ liters: NaN, pricePerLiter: 100, amount: 0, lastEdited: 'liters' }))
      .toEqual({ liters: NaN, pricePerLiter: 100, amount: 0 });
  });
  it('rejects non-finite derived results (e.g. amt/0)', () => {
    // liters cleared to 0, amount=4000 → would derive pricePerLiter = 4000/0 = Infinity
    expect(deriveFuelTriple({ liters: 0, pricePerLiter: 0, amount: 4000, lastEdited: 'amount' }))
      .toEqual({ liters: 0, pricePerLiter: 0, amount: 4000 }); // no clobber
  });
});
```

- [ ] **Step 2: Run tests, verify they fail**

- [ ] **Step 3: Implement `deriveFuelTriple`**

Add to `src/modules/expenses/fuel-math.ts`:

```ts
/** Inputs for the two-of-three fuel input derivation. */
export interface FuelTripleInput {
  liters: number;
  pricePerLiter: number;
  amount: number;
  lastEdited: 'liters' | 'price' | 'amount';
}

/** Two-of-three derivation: given any two valid operands, fill the third. Never clobbers user input. */
export function deriveFuelTriple(input: FuelTripleInput): { liters: number; pricePerLiter: number; amount: number } {
  const { liters, pricePerLiter: price, amount, lastEdited } = input;
  const ok = (n: number) => Number.isFinite(n) && n > 0;
  const out = { liters, pricePerLiter: price, amount };

  // Fill amount only if it's currently 0 AND lastEdited wasn't amount AND both operands valid.
  if (lastEdited !== 'amount' && !ok(amount) && ok(liters) && ok(price)) {
    const derived = liters * price;
    if (Number.isFinite(derived)) out.amount = derived;
  }
  // Fill price only if it's currently 0 AND lastEdited wasn't price AND both operands valid.
  else if (lastEdited !== 'price' && !ok(price) && ok(liters) && ok(amount)) {
    const derived = amount / liters;
    if (Number.isFinite(derived)) out.pricePerLiter = derived;
  }
  // Fill liters only if it's currently 0 AND lastEdited wasn't liters AND both operands valid.
  else if (lastEdited !== 'liters' && !ok(liters) && ok(price) && ok(amount)) {
    const derived = amount / price;
    if (Number.isFinite(derived)) out.liters = derived;
  }
  return out;
}
```

- [ ] **Step 4: Run tests, verify all 6 pass**

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(expenses): extract deriveFuelTriple pure util (foundation for H13)"
```

### Task 5: Apply `ExpenseMetaType` enum to all ~25 sites (H5)

**Files:**
- Modify: `src/modules/expenses/types.ts`, `meta-utils.ts`, `validation.ts`, `fuel-math.ts`, `components/MetaSubForm.tsx`, `components/AutoTab.tsx`, `hooks/useExpenses.ts`
- Modify: all corresponding `__tests__/*.test.ts(x)` files that reference the literals

- [ ] **Step 1: Migrate `FuelMeta`, `TravelMeta`, `MaintenanceMeta` type definitions**

In `src/modules/expenses/types.ts`, change `type: 'fuel'` to `type: ExpenseMetaType.Fuel` on each interface. Same for `'travel'` and `'maintenance'`. The discriminant remains string-compatible.

- [ ] **Step 2: Migrate switches/conditionals in `meta-utils.ts`, `validation.ts`, `fuel-math.ts`**

Replace every `=== 'fuel'`, `=== 'travel'`, `=== 'maintenance'` with `=== ExpenseMetaType.Fuel/.Travel/.Maintenance`. Import `ExpenseMetaType` at the top of each file.

- [ ] **Step 3: Migrate component files (`MetaSubForm.tsx`, `AutoTab.tsx`)**

Same pattern. Use `ExpenseMetaType` everywhere the literal string appeared.

- [ ] **Step 4: Migrate test files**

Test files MUST use the enum too (this is what catches future drift). Update `MetaSubForm.test.tsx`, `AutoTab.test.tsx`, `validation.test.ts`, `fuel-math.test.ts`, etc.

- [ ] **Step 5: Verify**

```bash
bun run lint        # typecheck must pass
bun run test        # all expense module tests must pass
```

Then grep verification (zero results expected):

```bash
git grep -nE "['\"](fuel|travel|maintenance)['\"]" src/modules/expenses/ | grep -v 'ExpenseMetaType' | grep -v '__snapshots__'
```

If grep returns hits, fix them. (Allowed exceptions: actual user-visible category-label strings like "Fuel" the noun in categories.ts.)

- [ ] **Step 6: Commit**

```bash
git commit -am "refactor(expenses): replace meta-type literals with ExpenseMetaType enum (H5)"
```

### Task 6: Apply `VEHICLE_SUBCAT` to all 7 call sites (H6)

**Files:**
- Modify: `meta-utils.ts`, `components/AutoTab.tsx`, `categories.ts` (the subs array references), tests

- [ ] **Step 1: Migrate `metaKindFor` in `meta-utils.ts`**

Replace `subCat === 'Fuel'` → `subCat === VEHICLE_SUBCAT.Fuel` (and Maintenance, Cab).

- [ ] **Step 2: Migrate `subCatFor` in `AutoTab.tsx`**

Replace the literal strings in the switch/mapping with `VEHICLE_SUBCAT.*` references.

- [ ] **Step 3: Update tests** to use the constants.

- [ ] **Step 4: Verify**

```bash
bun run lint && bun run test
git grep -n "'Fuel'\|'Maintenance'\|'Cab/Auto'" src/modules/expenses/ | grep -v categories.ts | grep -v VEHICLE_SUBCAT
```

Zero non-`categories.ts` hits expected.

- [ ] **Step 5: Commit**

```bash
git commit -am "refactor(expenses): use VEHICLE_SUBCAT constants in routing logic (H6, #23)"
```

### Task 7: Apply `assertNever` exhaustiveness guards (H4)

**Files:**
- Modify: `src/modules/expenses/components/MetaSubForm.tsx` (the if-chain over `meta.type`)
- Modify: `src/modules/expenses/components/AutoTab.tsx` (`renderBadge`)
- Modify: `src/modules/expenses/hooks/useExpenses.ts` (`toastForAdd`, `toastForUpdate`)
- Modify: `src/modules/expenses/fuel-math.ts` (`readOdometer`)
- Tests: add a "compile-time exhaustiveness" stress test per site

- [ ] **Step 1: Convert if-chains to `switch (meta.type)` form**

For each of the 4 sites, refactor the if-chain into a switch with a `default: return assertNever(meta);` arm. Example for `readOdometer` in `fuel-math.ts`:

```ts
import { assertNever } from '@/shared/utils/types';
import { ExpenseMetaType } from './types';

function readOdometer(meta: ExpenseMeta): number | null {
  switch (meta.type) {
    case ExpenseMetaType.Fuel:
      return meta.odometer ?? null;
    case ExpenseMetaType.Travel:
      return null;
    case ExpenseMetaType.Maintenance:
      return meta.odometer;
    default:
      return assertNever(meta);
  }
}
```

- [ ] **Step 2: Verify compile**

`bun run typecheck` → 0 errors.

- [ ] **Step 3: Add a stress test**

Create `src/modules/expenses/__tests__/exhaustiveness.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { ExpenseMetaType } from '../types';
import type { ExpenseMeta } from '../types';

// This file's primary purpose is the TS compile-time check.
// The runtime assertions are sanity guards.
describe('meta-type exhaustiveness', () => {
  it('ExpenseMetaType has exactly 3 members today', () => {
    expect(Object.values(ExpenseMetaType).sort()).toEqual(['fuel', 'maintenance', 'travel']);
  });
});
```

- [ ] **Step 4: Run tests**

`bun run test` → all pass.

- [ ] **Step 5: Commit**

```bash
git commit -am "refactor(expenses): apply assertNever exhaustiveness at 4 meta sites (H4)"
```

### Task 8: C1 — Wrong toast on AutoTab amount validation

**Files:**
- Modify: `src/modules/expenses/components/AutoTab.tsx:86-89`
- Modify: `src/modules/expenses/__tests__/AutoTab.test.tsx` (add case)

- [ ] **Step 1: Write failing test**

```tsx
// in AutoTab.test.tsx
it('shows AmountPositive (not CategoryRequired) toast when amount is 0', async () => {
  const addToast = vi.fn();
  // …render AutoTab with addToast spy via ToastContext provider…
  // …click ⛽ Add Fuel quick button, leave amount blank, submit…
  expect(addToast).toHaveBeenCalledWith(
    expect.stringMatching(/positive|amount/i),  // ValidationMsg.AmountPositive
    expect.anything()
  );
  expect(addToast).not.toHaveBeenCalledWith(
    expect.stringMatching(/category/i),
    expect.anything()
  );
});
```

- [ ] **Step 2: Run, expect FAIL**

- [ ] **Step 3: Apply fix**

In `AutoTab.tsx:86-89`, change `BudgetMsg.CategoryRequired` → `ValidationMsg.AmountPositive`. Import `ValidationMsg` from `@/constants/messages`.

- [ ] **Step 4: Run, expect PASS**

- [ ] **Step 5: Commit**

```bash
git commit -am "fix(expenses): AutoTab amount validation shows AmountPositive toast (C1)"
```

### Task 9: C2 — Literal em-dash JSX escape fix

**Files:**
- Modify: `src/modules/expenses/components/ExpenseList.tsx:105`

- [ ] **Step 1: Visual verification (no test needed for a trivial JSX literal fix)**

Find the line:

```tsx
<span ...>— {expense.note}</span>
```

Replace with:

```tsx
<span ...>{'—'} {expense.note}</span>
```

Or simpler — use the actual em-dash character:

```tsx
<span ...>— {expense.note}</span>
```

(Prettier may not love the latter — go with the JS-expression form for safety.)

- [ ] **Step 2: Visually confirm** (run `bun run dev`, open Expenses tab, confirm em-dash renders)

- [ ] **Step 3: Run existing tests**: `bun run test src/modules/expenses/__tests__/ExpenseList`

- [ ] **Step 4: Commit**

```bash
git commit -am "fix(expenses): render em-dash literal correctly in ExpenseList note (C2)"
```

### Task 10: C3 — `Number('')` / `Number('abc')` silent coercion

**Files:**
- Modify: `src/modules/expenses/validation.ts` (`validateMeta`)
- Modify: `src/modules/expenses/components/MetaSubForm.tsx:72,85,224` (the onChange handlers — secondary safety net)
- Modify: `src/constants/messages.ts` (add new `ValidationMsg` entries if needed)
- Test: `src/modules/expenses/__tests__/validation.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { validateMeta } from '../validation';
import { ExpenseMetaType } from '../types';

describe('validateMeta — NaN/Infinity rejection', () => {
  it('rejects NaN liters on fuel meta', () => {
    const result = validateMeta({ type: ExpenseMetaType.Fuel, liters: NaN, pricePerLiter: 100, odometer: null });
    expect(result.ok).toBe(false);
  });
  it('rejects Infinity pricePerLiter on fuel meta', () => {
    const result = validateMeta({ type: ExpenseMetaType.Fuel, liters: 40, pricePerLiter: Infinity, odometer: null });
    expect(result.ok).toBe(false);
  });
  it('rejects NaN odometer on maintenance meta', () => {
    const result = validateMeta({ type: ExpenseMetaType.Maintenance, odometer: NaN, nextService: 50000 });
    expect(result.ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run, expect FAIL**

- [ ] **Step 3: Strengthen `validateMeta`**

Replace `<= 0` checks with `!isValidNumber(x) || x <= 0`. Import `isValidNumber` from `@/shared/utils/validation`. Apply to: `liters`, `pricePerLiter`, `odometer`, `nextService`, `tripOdo`, `displayedMileage`, travel `distance`.

```ts
import { isValidNumber } from '@/shared/utils/validation';

// inside validateMeta, for each numeric field:
if (!isValidNumber(meta.liters) || meta.liters <= 0) {
  return err(ValidationMsg.FuelLitersInvalid);
}
```

Add the new enum entries to `src/constants/messages.ts` `ValidationMsg`:

```ts
FuelLitersInvalid = 'Liters must be a positive number',
FuelPriceInvalid = 'Price per liter must be a positive number',
OdometerInvalid = 'Odometer must be a positive number',
NextServiceInvalid = 'Next-service odometer must be a positive number',
TripOdoInvalid = 'Trip odometer must be a positive number',
DisplayedMileageInvalid = 'Mileage must be a positive number',
TravelDistanceInvalid = 'Travel distance must be a positive number',
```

- [ ] **Step 4: Run tests, expect PASS** (validation tests)

- [ ] **Step 5: Component-level safety net (defense in depth)**

In `MetaSubForm.tsx`, replace `Number(e.target.value)` in the 3 numeric onChange handlers with a small local guard:

```ts
const toFiniteNumber = (s: string): number => {
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};
// usage:
onChange={(e) => onChange({ ...meta, liters: toFiniteNumber(e.target.value) })}
```

This converts `'abc'` to `0` deterministically (and `validateMeta` rejects 0 already).

- [ ] **Step 6: Verify**

`bun run test` → all pass.

- [ ] **Step 7: Commit**

```bash
git commit -am "fix(expenses): reject NaN/Infinity in validateMeta + MetaSubForm coercion (C3)"
```

### Task 11: H7 + H39 — `relativeDateLabel` + `isoWeekNumber` TZ off-by-one fix

**Files:**
- Modify: `src/shared/utils/relative-date.ts:10-17,21-25`
- Modify: `src/shared/utils/__tests__/relative-date.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// In a test that mocks Date.now() / process.env.TZ or use vi.setSystemTime
describe('relativeDateLabel — TZ correctness', () => {
  // The bug: 'YYYY-MM-DD' parses as UTC midnight, then getDay() uses local TZ
  // → west-of-UTC users see Apr 3 for an Apr 4 date.
  it('shows the same calendar date in PST as in UTC for a YYYY-MM-DD input', () => {
    // mock TZ to America/Los_Angeles
    const originalTZ = process.env.TZ;
    process.env.TZ = 'America/Los_Angeles';
    const today = new Date('2026-04-15T12:00:00');
    const label = relativeDateLabel('2026-04-04', today);
    expect(label.structural).toMatch(/Apr 4|Sat/i); // must contain Apr 4 / Saturday, not Apr 3
    process.env.TZ = originalTZ;
  });
});
```

- [ ] **Step 2: Run, expect FAIL on west-of-UTC**

- [ ] **Step 3: Apply B1 fix — `'T12:00:00'` suffix**

In `relative-date.ts`, change the date parsing:

```ts
// Before:
const d = new Date(dateStr);
// After:
const d = new Date(dateStr.length === 10 ? dateStr + 'T12:00:00' : dateStr);
```

Apply to BOTH `relativeDateLabel` (line ~21) AND `isoWeekNumber` (line ~10). Use a small helper:

```ts
/** Parses 'YYYY-MM-DD' as local midday (avoids UTC-vs-local-TZ off-by-one). */
function parseLocalDate(s: string): Date {
  return new Date(s.length === 10 ? s + 'T12:00:00' : s);
}
```

Use `parseLocalDate(...)` in both functions.

- [ ] **Step 4: Run, expect PASS**

- [ ] **Step 5: Commit**

```bash
git commit -am "fix(shared): parse YYYY-MM-DD as local midday in relativeDateLabel + isoWeekNumber (H7, #39)"
```

### Task 12: H8 — `useBabyCollection.{log,update,remove}` → `Promise<boolean>`

**Files:**
- Modify: `src/modules/baby/hooks/useBabyCollection.ts`
- Modify: `src/modules/baby/components/FeedLog.tsx`, `EliminationLog.tsx`, `SleepLog.tsx`, `GrowthLog.tsx`, `MealsLog.tsx`, `NeedsLog.tsx`, `MilestonesLog.tsx`
- Tests: `useBabyCollection.test.ts` + each log component's test

- [ ] **Step 1: Write failing test on the hook contract**

```ts
// useBabyCollection.test.ts
it('log returns false when adapter.save errors', async () => {
  const errAdapter = makeMockAdapter({ saveResult: err('fail') });
  const { result } = renderHook(() => useBabyCollection<FeedEntry>('child1', 'feeds', 'feed'));
  await act(async () => {
    const ok = await result.current.log({ /* ... */ });
    expect(ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run, FAIL (return type is void today)**

- [ ] **Step 3: Migrate hook contract**

In `useBabyCollection.ts`, change the three async fns:

```ts
// Before:
async function log(entry: T): Promise<void> { ... }
// After:
async function log(entry: T): Promise<boolean> {
  const res = await adapter.save(entry.id, entry);
  if (!res.ok) {
    addToast(`Failed to log ${label}`, ToastType.Error);
    return false;
  }
  addToast(`${label} logged`, ToastType.Success);
  return true;
}
```

Same pattern for `update` and `remove`.

- [ ] **Step 4: Update all 7 baby log components to gate state on the boolean**

For each component (FeedLog, EliminationLog, SleepLog, GrowthLog, MealsLog, NeedsLog, MilestonesLog), find every `await logX(...)` / `await updateX(...)` / `await removeX(...)`, change to:

```ts
const ok = await updateFeed({ /* ... */ });
if (ok) {
  setEditEntry(null);
  // (and any other state cleanup that was unconditional before)
}
```

- [ ] **Step 5: Run all baby module tests**

`bun run test src/modules/baby/` → expect all pass.

- [ ] **Step 6: Commit**

```bash
git commit -am "fix(baby): useBabyCollection returns Promise<boolean>; gate state on success (H8)"
```

### Task 13: H9 — `logToSiblings` partial-failure surfacing

**Files:**
- Modify: `src/modules/baby/utils/logToSiblings.ts`
- Modify: `src/modules/baby/components/FeedLog.tsx:90-93` (and any other caller)
- Test: `src/modules/baby/__tests__/logToSiblings.test.ts`

- [ ] **Step 1: Write failing test**

```ts
it('returns { ok, failed } counts when some sibling writes fail', async () => {
  const result = await logToSiblings(/* mock adapters: 2 fail, 1 succeeds */);
  expect(result).toEqual({ ok: 1, failed: 2 });
});
```

- [ ] **Step 2: Run, FAIL**

- [ ] **Step 3: Change return type**

```ts
/** Logs an entry to each sibling child; returns success/failure counts. */
export async function logToSiblings(/* ... */): Promise<{ ok: number; failed: number }> {
  let ok = 0;
  let failed = 0;
  for (const siblingId of siblingIds) {
    const res = await /* adapter call */;
    if (res.ok) ok += 1;
    else { failed += 1; console.error('logToSiblings failed for', siblingId, res.error); }
  }
  return { ok, failed };
}
```

- [ ] **Step 4: Update caller in `FeedLog.tsx:90-93`**

```ts
const { ok, failed } = await logToSiblings(/* ... */);
if (failed > 0) {
  addToast(`${ok} of ${ok + failed} copied — ${failed} failed`, ToastType.Error);
} else if (ok > 0) {
  addToast(`Copied to ${ok} sibling${ok > 1 ? 's' : ''}`, ToastType.Success);
}
```

Add `BabyMsg.CopiedToSiblingsPartial` enum entry if you prefer parameterized messages, but per CLAUDE.md known-issue note, dynamic templates are accepted here.

- [ ] **Step 5: Run tests, all pass**

- [ ] **Step 6: Commit**

```bash
git commit -am "fix(baby): surface partial failures in logToSiblings (H9)"
```

### Task 14: H10 — `useExpenses.{add,update,delete}Expense` adapter-null toasts

**Files:**
- Modify: `src/modules/expenses/hooks/useExpenses.ts:62, 113, 133`
- Modify: `src/constants/messages.ts` — add `BudgetMsg.AdapterNotReady`
- Test: `src/modules/expenses/__tests__/useExpenses.test.ts`

- [ ] **Step 1: Add enum entry**

In `constants/messages.ts`:

```ts
AdapterNotReady = 'Storage not ready — try again in a moment',
```

- [ ] **Step 2: Write failing test**

```ts
it('addExpense shows AdapterNotReady toast when adapter is null', async () => {
  const addToast = vi.fn();
  // mock useAuth to return no firebaseUser so adapter stays null
  const { result } = renderHook(() => useExpenses());
  await act(async () => {
    const ok = await result.current.addExpense(/* ... */);
    expect(ok).toBe(false);
  });
  expect(addToast).toHaveBeenCalledWith(BudgetMsg.AdapterNotReady, ToastType.Error);
});
```

- [ ] **Step 3: Run, FAIL**

- [ ] **Step 4: Apply fix**

In all 3 adapter-null guards:

```ts
// Before:
if (!adapter) return false;
// After:
if (!adapter) {
  addToast(BudgetMsg.AdapterNotReady, ToastType.Error);
  return false;
}
```

For `deleteExpense:133` which returns `void`: also return early but with the toast.

- [ ] **Step 5: Run tests, PASS**

- [ ] **Step 6: Commit**

```bash
git commit -am "fix(expenses): toast on adapter-null in add/update/delete (H10)"
```

### Task 15: H11 — `ServiceDueBanner` defensive guards + 1× walk + memo

**Files:**
- Modify: `src/modules/expenses/components/ServiceDueBanner.tsx`
- Test: `src/modules/expenses/__tests__/ServiceDueBanner.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
it('returns null when dueMaintenance is null (defensive, no crash)', () => {
  // expenses with maintenance entries that have no nextService set
  const expenses = [/* maintenance entry without nextService */];
  const { container } = render(<ServiceDueBanner expenses={expenses} />);
  expect(container.firstChild).toBeNull();
});

it('renders banner when service is due', () => {
  const expenses = [/* maintenance entry with nextService=50000, plus latest fuel odometer >= 50000 */];
  const { getByText } = render(<ServiceDueBanner expenses={expenses} />);
  expect(getByText(/service due/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run, may pass or fail depending on existing test coverage**

- [ ] **Step 3: Refactor component**

```tsx
export function ServiceDueBanner({ expenses }: { expenses: Expense[] }) {
  const [hidden, setHidden] = useState(false);
  const { due, latest } = useMemo(() => ({
    due: dueMaintenance(expenses),
    latest: latestOdometer(expenses),
  }), [expenses]);

  if (hidden || !due?.nextService || latest == null || latest < due.nextService) return null;

  return (
    <div className="...">
      Service due — odometer {latest} ≥ {due.nextService}
      <button onClick={() => setHidden(true)}>Dismiss</button>
    </div>
  );
}
```

This removes all non-null assertions AND walks the array only twice (memoized).

- [ ] **Step 4: Run tests, PASS**

- [ ] **Step 5: Commit**

```bash
git commit -am "fix(expenses): ServiceDueBanner defensive guards + useMemo single-walk (H11, #22)"
```

### Task 16: H12 — `dueMaintenance` sort by odometer

**Files:**
- Modify: `src/modules/expenses/fuel-math.ts:27-30`
- Test: `src/modules/expenses/__tests__/fuel-math.test.ts`

- [ ] **Step 1: Write failing test**

```ts
it('dueMaintenance returns the highest-odometer entry with nextService set, regardless of date order', () => {
  const expenses: Expense[] = [
    // newer date but lower odometer
    { id: 'a', date: '2026-04-01', category: Cat.Vehicle, meta: { type: ExpenseMetaType.Maintenance, odometer: 30000, nextService: 40000 }, /* ... */ },
    // older date but higher odometer (catch-up log)
    { id: 'b', date: '2026-03-01', category: Cat.Vehicle, meta: { type: ExpenseMetaType.Maintenance, odometer: 45000, nextService: 55000 }, /* ... */ },
  ];
  expect(dueMaintenance(expenses)?.odometer).toBe(45000);  // 'b', not 'a'
});
```

- [ ] **Step 2: Run, FAIL (current impl returns 'a', the newer-dated one)**

- [ ] **Step 3: Apply fix**

In `fuel-math.ts:27-30`, change the sort criterion. Find the line that does something like:

```ts
.sort((a, b) => b.date.localeCompare(a.date))
```

Change to:

```ts
.sort((a, b) => (b.meta.odometer ?? 0) - (a.meta.odometer ?? 0))
```

Verify the filter still keeps only maintenance entries with `nextService` set.

- [ ] **Step 4: Run tests, PASS**

- [ ] **Step 5: Commit**

```bash
git commit -am "fix(expenses): dueMaintenance sorts by odometer not date (H12)"
```

### Task 17: H13 — Wire `MetaSubForm` to use the extracted `deriveFuelTriple`

**Files:**
- Modify: `src/modules/expenses/components/MetaSubForm.tsx:43-86`
- Test: `src/modules/expenses/__tests__/MetaSubForm.test.tsx`

- [ ] **Step 1: Component now dispatches to the pure util (already created in Task 4)**

In `MetaSubForm.tsx`, remove the inline `autoDerive` arithmetic. Replace `onBlur` handlers with:

```ts
onBlur={(e) => {
  const next = { ...meta, liters: toFiniteNumber(e.target.value) };
  const derived = deriveFuelTriple({
    liters: next.liters,
    pricePerLiter: next.pricePerLiter,
    amount: toFiniteNumber(amountStr),
    lastEdited: 'liters',
  });
  onChange({ ...next, pricePerLiter: derived.pricePerLiter });
  if (!amountStr && derived.amount !== 0) onAmountChange(String(derived.amount));
}}
```

Apply the same shape to the `pricePerLiter` and `amount` onBlur handlers, with `lastEdited` set accordingly. CRUCIAL: pass the JUST-UPDATED value to `deriveFuelTriple`, not the closed-over `meta` — that's the stale-state bug from finding #13.

- [ ] **Step 2: Update tests** to assert the no-clobber behavior (user-typed amount survives liters edit).

- [ ] **Step 3: Run, PASS**

- [ ] **Step 4: Commit**

```bash
git commit -am "fix(expenses): MetaSubForm dispatches to deriveFuelTriple; no stale state (H13)"
```

### Task 18: H14 — Auto tab `paymentMethod` capture

**Files:**
- Modify: `src/modules/expenses/components/AutoTab.tsx:107-114`
- Test: `src/modules/expenses/__tests__/AutoTab.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
it('Auto tab submits with the user-selected paymentMethod (not silently UPI)', async () => {
  const onAdd = vi.fn().mockResolvedValue(true);
  // render AutoTab with onAdd spy
  // …click ⛽ Add Fuel, fill amount + liters, click Cash bubble, submit
  expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({
    paymentMethod: PaymentMethod.Cash,
  }));
});
```

- [ ] **Step 2: Run, FAIL**

- [ ] **Step 3: Add a `<PaymentMethodBubble>` row to the Auto tab form**

Reuse the existing component already used by `AddExpense`. Add a `useState<PaymentMethod>(PaymentMethod.UpiBankAccount)` and pass through to `onAdd`.

Note: this might feel like a fast extraction-prep for Wave 2's `<ExpenseFormShell>`. That's fine — Wave 2 will lift the shared shell later; right now the goal is correctness.

- [ ] **Step 4: Run, PASS**

- [ ] **Step 5: Commit**

```bash
git commit -am "fix(expenses): Auto tab captures paymentMethod (no silent UPI default) (H14)"
```

### Task 19: H15 — CHANGELOG fuel-math signatures correction

**Files:**
- Modify: `CHANGELOG.md:12`

- [ ] **Step 1: Read current CHANGELOG.md:12**

Find the line documenting fuel-math signatures.

- [ ] **Step 2: Replace with actual signatures**

```md
- `computeMileage(meta: FuelMeta)`, `latestOdometer(expenses: Expense[])`,
  `dueMaintenance(expenses: Expense[])`, `isServiceDue(expenses: Expense[]): boolean`
```

- [ ] **Step 3: Commit**

```bash
git commit -am "docs(changelog): correct fuel-math signatures for 0.2.18 (H15)"
```

### Task 20: H16 — Remove dead `prev*Ref` code + misleading comment

**Files:**
- Modify: `src/modules/expenses/components/AddExpense.tsx:59-82`

- [ ] **Step 1: Delete the refs and the comment**

`prevCategoryRef` and `prevSubCatRef` are written but never read. Delete:
- The comment at L59-61.
- The `useRef` declarations.
- The ref-write lines at L81-82.

Verify `syncMeta` (L73-83) still works — it reads from current `meta` state, not the refs. No behavior change.

- [ ] **Step 2: Run typecheck + tests** — `bun run lint && bun run test src/modules/expenses/`

- [ ] **Step 3: Commit**

```bash
git commit -am "chore(expenses): remove dead prevCategoryRef/prevSubCatRef + misleading comment (H16)"
```

---

**Wave 1 verification gate:**

```bash
bun run typecheck     # 0 errors
bun run test          # 637+ tests pass (new tests added in Wave 1)
git log --oneline master..HEAD  # 20 commits on the branch
```

Move to Wave 2 only when this passes.

---

## Wave 2 — MEDIUM + LOW + 3 refactors (~31 tasks)

Wave 2 has 3 natural refactors (Tasks 21-23) that each absorb multiple findings, plus ~28 standalone smaller items grouped into compact tasks. Each commit is small. TDD discipline lighter where the fix is purely declarative (e.g., add `useMemo`, add `min`/`max` attribute), full TDD where there's logic change.

### Task 21: REFACTOR — Lift `<ExpenseFormShell>` shared by AddExpense + AutoTab (folds #14 partial, #18, #21)

**Files:**
- Create: `src/modules/expenses/hooks/useExpenseForm.ts`
- Create: `src/modules/expenses/components/ExpenseFormShell.tsx`
- Modify: `src/modules/expenses/components/AddExpense.tsx` — consume
- Modify: `src/modules/expenses/components/AutoTab.tsx` — consume
- Test: dedicated test for `useExpenseForm` + smoke tests for AddExpense + AutoTab still pass

- [ ] **Step 1: Write `useExpenseForm` hook test**

```ts
describe('useExpenseForm', () => {
  it('initializes with passed initial values', () => {
    const { result } = renderHook(() => useExpenseForm({ initialDate: '2026-04-01', initialAmount: '500' }));
    expect(result.current.date).toBe('2026-04-01');
    expect(result.current.amount).toBe('500');
  });
  it('populate(expense) sets all fields from an Expense object', () => {
    const { result } = renderHook(() => useExpenseForm({}));
    act(() => result.current.populate({ id: 'x', date: '2026-04-02', amount: 1000, note: 'fuel', meta: { type: ExpenseMetaType.Fuel, /* ... */ }, paymentMethod: PaymentMethod.Cash, /* ... */ } as Expense));
    expect(result.current.date).toBe('2026-04-02');
    expect(result.current.amount).toBe('1000');
    expect(result.current.note).toBe('fuel');
    expect(result.current.paymentMethod).toBe(PaymentMethod.Cash);
  });
  it('reset() clears all fields to initial', () => {
    const { result } = renderHook(() => useExpenseForm({ initialDate: '2026-04-01' }));
    act(() => result.current.setAmount('500'));
    act(() => result.current.reset());
    expect(result.current.amount).toBe('');
    expect(result.current.date).toBe('2026-04-01');
  });
});
```

- [ ] **Step 2: Run, FAIL**

- [ ] **Step 3: Implement `useExpenseForm`**

```ts
// src/modules/expenses/hooks/useExpenseForm.ts
import { useState, useCallback } from 'react';
import type { Expense, ExpenseMeta } from '../types';
import { PaymentMethod } from '@/shared/types';
import { todayStr } from '@/shared/utils/date';

interface UseExpenseFormProps {
  initialDate?: string;
  initialAmount?: string;
  initialNote?: string;
  initialMeta?: ExpenseMeta;
  initialPaymentMethod?: PaymentMethod;
}

/** Single source of truth for an expense form's local state. Shared by AddExpense + AutoTab. */
export function useExpenseForm(props: UseExpenseFormProps = {}) {
  const initDate = props.initialDate ?? todayStr();
  const [date, setDate] = useState(initDate);
  const [amount, setAmount] = useState(props.initialAmount ?? '');
  const [note, setNote] = useState(props.initialNote ?? '');
  const [meta, setMeta] = useState<ExpenseMeta | undefined>(props.initialMeta);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(props.initialPaymentMethod ?? PaymentMethod.UpiBankAccount);

  const reset = useCallback(() => {
    setDate(initDate); setAmount(''); setNote(''); setMeta(props.initialMeta); setPaymentMethod(props.initialPaymentMethod ?? PaymentMethod.UpiBankAccount);
  }, [initDate, props.initialMeta, props.initialPaymentMethod]);

  const populate = useCallback((e: Expense) => {
    setDate(e.date); setAmount(String(e.amount)); setNote(e.note ?? '');
    setMeta(e.meta); setPaymentMethod(e.paymentMethod ?? PaymentMethod.UpiBankAccount);
  }, []);

  return { date, setDate, amount, setAmount, note, setNote, meta, setMeta, paymentMethod, setPaymentMethod, reset, populate };
}
```

- [ ] **Step 4: Migrate `AddExpense.tsx` to consume the hook**

Replace its 5 local `useState` declarations (date, amount, note, meta, paymentMethod) with the hook. Behavior should be identical.

- [ ] **Step 5: Migrate `AutoTab.tsx` to consume the hook**

Replace its 6 local `useState` declarations (editingId stays — it's not form state). Behavior identical.

- [ ] **Step 6: Run all expense tests**

`bun run test src/modules/expenses/` → all pass.

- [ ] **Step 7: Commit**

```bash
git commit -am "refactor(expenses): lift useExpenseForm hook shared by AddExpense + AutoTab (#18, #21)"
```

### Task 22: REFACTOR — Split `AutoTab.tsx` (folds #17)

**Files:**
- Create: `src/modules/expenses/components/AutoTabRow.tsx` — Row component + badge renderers
- Create: `src/modules/expenses/expense-badges.ts` — pure badge string functions
- Modify: `src/modules/expenses/meta-utils.ts` — receive `subCatFor` from AutoTab
- Modify: `src/modules/expenses/components/AutoTab.tsx` — slim down to orchestration only

- [ ] **Step 1: Extract `expense-badges.ts`**

```ts
// src/modules/expenses/expense-badges.ts
import type { ExpenseMeta, FuelMeta, TravelMeta, MaintenanceMeta } from './types';
import { ExpenseMetaType } from './types';
import { assertNever } from '@/shared/utils/types';
import { computeMileage } from './fuel-math';

/** Renders a one-line badge string for a fuel meta record. */
export function renderFuelBadge(meta: FuelMeta): string {
  const mileage = computeMileage(meta);
  return mileage != null ? `${mileage.toFixed(1)} km/L` : '⛽';
}

/** Renders a one-line badge string for a travel meta record. */
export function renderTravelBadge(meta: TravelMeta): string {
  return meta.distance != null ? `${meta.distance} km` : '🚕';
}

/** Renders a one-line badge string for a maintenance meta record. */
export function renderMaintenanceBadge(meta: MaintenanceMeta): string {
  return meta.nextService != null ? `next @ ${meta.nextService}km` : '🔧';
}

/** Dispatches to the per-type badge renderer. */
export function renderBadge(meta: ExpenseMeta | undefined): string {
  if (!meta) return '';
  switch (meta.type) {
    case ExpenseMetaType.Fuel: return renderFuelBadge(meta);
    case ExpenseMetaType.Travel: return renderTravelBadge(meta);
    case ExpenseMetaType.Maintenance: return renderMaintenanceBadge(meta);
    default: return assertNever(meta);
  }
}
```

- [ ] **Step 2: Move `subCatFor` to `meta-utils.ts`** (its inverse `metaKindFor` already lives there)

- [ ] **Step 3: Create `AutoTabRow.tsx`**

Extract the `Row` component currently inline in AutoTab.tsx. Single responsibility: render one row with date, badge, amount, optional active state, tap-to-edit handler.

- [ ] **Step 4: Slim down `AutoTab.tsx`**

Replace inline Row + badge renderers with imports. Goal: AutoTab.tsx < 200 lines, focused on orchestration (filter + form state + tap-to-edit dispatch).

- [ ] **Step 5: Run all expense tests**

- [ ] **Step 6: Commit**

```bash
git commit -am "refactor(expenses): split AutoTab into AutoTabRow + expense-badges (#17)"
```

### Task 23: REFACTOR — Wire `Number.isFinite` guards in `deriveFuelTriple` callers (folds #20, #32 — actually already done in Task 4)

The `deriveFuelTriple` extracted in Task 4 already has `Number.isFinite` guards built in. This task is just verification.

- [ ] **Step 1: Verify `deriveFuelTriple` rejects Infinity / NaN** by reading its tests in Task 4. Confirm test coverage.

- [ ] **Step 2: Add one extra integration test** in `MetaSubForm.test.tsx`:

```tsx
it('clearing liters then typing amount does not save Infinity to price', async () => {
  // (render with initial fuel meta; clear liters; type amount=4000; blur)
  // expect meta.pricePerLiter to remain 0, NOT become Infinity
});
```

- [ ] **Step 3: Run, PASS** (should already pass thanks to Task 4's guards)

- [ ] **Step 4: Commit** (small)

```bash
git commit -am "test(expenses): integration coverage for Infinity-divide-by-zero in fuel form (#20, #32)"
```

### Tasks 24–44: Standalone MED/LOW fixes (compact format)

Each task below is a single small fix. TDD lite — add a vitest case where it makes sense; otherwise just verify + commit.

#### Task 24: #19 — Helper text under invalid AddExpense amount

- Modify `AddExpense.tsx:69` area
- When amount input is non-empty AND `!isValidNumber(parsedAmount)`, render a small `<p className="text-xs text-red-500 mt-1">Enter a positive number</p>` beneath the input.
- Commit: `fix(expenses): inline helper text on invalid amount in AddExpense (#19)`

#### Task 25: #24 — `ServiceDueBanner` dismiss tied to domain event (Decision D1)

The current `setHidden(true)` button stays as session-only dismiss (matches "accepted UX" in spec). Add a comment at the dismiss handler:

```tsx
// Session-only dismiss. Banner naturally clears when user logs a new maintenance
// entry (isServiceDue then returns false). Domain-event-tied per Decision D1.
```

Commit: `chore(expenses): document ServiceDueBanner domain-event dismiss strategy (#24)`

#### Task 26: #25 — `useListControls` per-tab isolation in `ExpenseListPage`

- Move the single `useListControls` call inside `ExpenseListPage` into each tab component that needs it (`ExpenseList`, `IncomeList`). `AutoTab` already doesn't use it (deviation per spec).
- Each tab owns its own time-range / page state — no cross-tab leakage.
- Commit: `refactor(expenses): isolate useListControls per tab (#25)`

#### Task 27: #26 — Auto tab pagination deviation test + comment

- Add a comment at `AutoTab.tsx` where it skips `ListControls`:
  ```tsx
  // Auto tab deviates from the universal-list pattern: small vehicle history
  // doesn't need time-range/page chrome. Revisit if users cross ~500 entries.
  ```
- Add a smoke test `AutoTab.test.tsx`: render with 500 mock vehicle expenses, assert it renders without throwing or exceeding 1s.
- Commit: `test(expenses): AutoTab pagination-deviation stress test + comment (#26)`

#### Task 28: #27 — `firestore.rules` `validMeta()` helper

- Open `firestore.rules`, add:
  ```
  function validMeta(meta) {
    return meta == null
      || (meta.type == 'fuel' && meta.liters is number && meta.liters > 0)
      || (meta.type == 'travel' && meta.distance is number)
      || (meta.type == 'maintenance' && meta.odometer is number && meta.odometer > 0);
  }
  ```
- In the expenses write rule, add `&& validMeta(request.resource.data.get('meta', null))`.
- Test: `firebase emulators:exec` against the rules — write a `meta: { type: 'unknown' }` expense, expect REJECT. Document in commit.
- Commit: `fix(rules): validate Expense.meta shape server-side (#27)`

#### Task 29: #28 — `baby/hooks/README.md` 4 → 5 subcollections

- Open `src/modules/baby/hooks/README.md:8` and L15. Replace "4" with "5". Add `logElimination`/`updateElimination`/`removeElimination` to the exposed-methods list.
- Commit: `docs(baby): hooks README — useBabyData composes 5 subcollections (#28)`

#### Task 30: #29 — `AddExpense.test.tsx:135` comment rephrase

- Change `// first 7 visible categories` to `// If Vehicle is hidden behind View All (BUDGET_VISIBLE_CATEGORIES tuning), reveal it first`.
- Commit: `docs(test): rephrase AddExpense visible-categories comment (#29)`

#### Task 31: #30 — `AmbientEffects.tsx:126` jitter comment fix

- Replace `// tiny ±5% noise on duration only` with `// jitter applies to duration; r7 is also reused for drift-y below`.
- Commit: `docs(shared): clarify AmbientEffects jitter scope (#30)`

#### Task 32: #33 — Keyboard handler on AutoTab row

- In `AutoTabRow.tsx` (created in Task 22), the row root `<div onClick={onTap}>` becomes:
  ```tsx
  <div role="button" tabIndex={0} onClick={onTap} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onTap()}>
  ```
- Spot-check `ExpenseList` rows + `IncomeList` rows in the same pass — confirm they have the same a11y handlers; add if missing.
- Commit: `a11y(expenses): keyboard activation on row tap-to-edit (#33)`

#### Task 33: #34 — `onError` console-only handler TODO comment

- In `useExpenses.ts:49-52` and analogous spots in `useBabyCollection`, body hooks: add a one-line `// TODO(sentry): pipe onError to centralized logError once Sentry lands.` comment. NO behavior change — this is a marker for the deferred Sentry milestone.
- Commit: `chore: mark onSnapshot onError sites for Sentry milestone (#34)`

#### Task 34: #35 — `Number.isFinite` guard in `filterByDateRange`

- In `src/shared/utils/filter.ts:21`, add `if (!Number.isFinite(t)) return false;` after the `getTime()` call to drop items with invalid date strings RATHER THAN passing them silently.
- Add a vitest case: feed an item with `date: 'not-a-date'` and assert it's filtered out + a console warning is emitted (use `vi.spyOn(console, 'warn')`).
- Commit: `fix(shared): guard NaN getTime in filterByDateRange (#35)`

#### Task 35: #36 — `useExpenses.updateExpense` single validation

- In `useExpenses.ts:103-126`, the current code calls `validateExpense({ ...expense })` and then uses the boolean. Refactor to call once, check `isOk(result)`, return early with toast on failure.
- Commit: `refactor(expenses): single validation pass in updateExpense (#36)`

#### Task 36: #37 — AutoTab prop async signatures align

- In `AutoTab.tsx`'s `Props`, change `onDelete: (id: string) => void` to `onDelete: (id: string) => Promise<boolean>`.
- Update `useExpenses.deleteExpense` to return `Promise<boolean>` (currently `Promise<void>`).
- Update callers accordingly.
- Commit: `refactor(expenses): align AutoTab async prop signatures (#37)`

#### Task 37: #38 — Move `meta-utils` tests to dedicated file

- Create `src/modules/expenses/__tests__/meta-utils.test.ts`.
- Move `describe('metaKindFor', ...)` and `describe('defaultMeta', ...)` blocks from `MetaSubForm.test.tsx` into the new file.
- Run `bun run test src/modules/expenses/__tests__/` → all pass.
- Commit: `test(expenses): split meta-utils tests into dedicated file (#38)`

#### Task 38: #40 — Document hook return contract in CLAUDE.md (Decision A1)

- In `CLAUDE.md` "Key Conventions" section, add:
  > **Async contracts:** Pure utilities return `Result<T>` (e.g. `validateExpense`). Data hooks (`useExpenses`, `useBabyCollection`) return `Promise<boolean>` — they own their own toasts and the boolean gates state cleanup in the caller. This is the deliberate split.
- Commit: `docs(claude): codify hooks-return-boolean / utils-return-Result (#40, Decision A1)`

#### Task 39: #41 — `CONFIG.LIST_PAGE_SIZE_OPTIONS` constant

- Move `[5, 10, 25, 50, 100, 500]` from `ListControls.tsx:12` to `src/constants/config.ts` as `LIST_PAGE_SIZE_OPTIONS`.
- Import and use in `ListControls.tsx`.
- Commit: `refactor(shared): CONFIG.LIST_PAGE_SIZE_OPTIONS extraction (#41)`

#### Task 40: #42 — `AmbientEffects` r4 reservation comment

- In `AmbientEffects.tsx:104`, add `// r4 is intentionally skipped (reserved for future seed; renumber if reclaimed)`.
- Commit: `docs(shared): explain r4 skip in AmbientEffects seed enumeration (#42)`

#### Task 41: #43 — `useExpenses` JSDoc mentions `updateExpense`

- In `useExpenses.ts:25`, update the hook JSDoc:
  ```ts
  /** Provides expense CRUD (add/update/soft-delete) with real-time sync. */
  ```
- Commit: `docs(expenses): useExpenses JSDoc mentions full CRUD surface (#43)`

#### Task 42: #44 — WHAT-only inline comment cleanup

For each location, either delete the comment (where the code is self-documenting) or rewrite as WHY:
- `FeedLog.tsx:280` `// Group by date` → DELETE (code is `groupByDate(visible)` — name says it)
- `ActivityLog.tsx:84` `// Group visible by date for sticky day headers` → DELETE
- `ExpenseList.tsx:64` `// Group by date for sticky day headers` → DELETE
- `AmbientEffects.tsx:102` `// Use a stable seed based on theme, effect, and index` → DELETE
- `AmbientEffects.tsx:111` `// Pick content from options` → DELETE
- `AmbientEffects.tsx:98` `// Handle comma-separated content lists (e.g. for Patronus animals)` → KEEP (explains WHY the split)

Commit: `chore: remove WHAT-only inline comments per CLAUDE.md style (#44)`

#### Task 43: #31 — Already covered by Task 25 (same finding, different agent angle). No separate task.

#### Task 44: #22, #39 — Already covered (in Task 15, Task 11 respectively).

---

**Wave 2 verification gate:**

```bash
bun run typecheck && bun run test
git log --oneline master..HEAD  # ~40-45 commits on the branch
```

Move to Wave 3 only when this passes.

---

## Wave 3 — JSDoc Total Coverage (Nick's point)

Scope: every export + every internal function/arrow/enum/type/interface/React component across `src/`. Style: one-line minimum, terse OK. Test files included EXCEPT individual `it(...)` bodies.

### Task 45: Pre-stage shared-files JSDoc (coordinator-owned)

Coordinator (me) handles these BEFORE dispatching subagents, so the JSDoc subagents work on a stable HEAD.

**Files:**
- `src/shared/types.ts`
- `src/shared/utils/*` (every util file)
- `src/constants/*.ts`
- `src/App.tsx`, `src/main.tsx`, `src/routes.tsx`

- [ ] **Step 1: Walk each shared-file symbol and add a one-line JSDoc**

For each exported function/type/enum/component:

```ts
/** Today's date as YYYY-MM-DD. */
export function todayStr(): string { ... }

/** ISO 8601 timestamp of right now. */
export function nowTime(): string { ... }

/** Discriminated union: `ok` or `err`. */
export type Result<T> = { ok: true; value: T } | { ok: false; error: string };
```

For internal helpers:

```ts
/** Pad a 1-digit number with a leading zero. */
function pad2(n: number): string { ... }
```

- [ ] **Step 2: Run `bun run lint`** — 0 errors.

- [ ] **Step 3: Commit shared-files JSDoc**

```bash
git commit -am "docs(shared): JSDoc total coverage on shared/types + utils + constants (Nick's point, part 1)"
```

### Task 46: Dispatch JSDoc subagent fleet (modules + components)

Per CLAUDE.md parallel-subagent-dispatch pattern.

**Subagent assignments (5 worktrees, parallel):**

| Subagent | Directory | Estimate |
|----------|-----------|----------|
| A | `src/modules/baby/` (all `.ts`, `.tsx`) | ~300 symbols |
| B | `src/modules/body/` | ~150 symbols |
| C | `src/modules/expenses/` | ~250 symbols |
| D | `src/shared/components/` + `src/shared/hooks/` (NOT `src/shared/types.ts`, NOT `src/shared/utils/`) | ~250 symbols |
| E | `src/admin/`, `src/auth/`, `src/contexts/`, `src/themes/` | ~150 symbols |

- [ ] **Step 1: Subagent prompt template**

For each subagent, dispatch with `isolation: "worktree"` and this prompt:

```
You are a JSDoc total-coverage subagent in `feat/the-flaw-in-the-plan`.

Your scope: every `.ts` and `.tsx` file under `<DIR>` (recursive). Add a one-line JSDoc comment (`/** ... */`) on every exported AND internal:
- function declaration / arrow function const
- enum / type / interface
- React functional component

Style: one line minimum, terse OK. "Nutcracker-tight" — a few words is fine. Examples:
  /** Active row when editing. */
  /** Today's floors entry. */
  /** Picks a meal type from the current hour. */

Existing JSDocs: KEEP if accurate (don't waste a rewrite). REWRITE only if currently rotten/wrong.

Test files: include all `__tests__/*.test.ts(x)`. Add docs on test-helper functions and `describe(...)` blocks ONLY. DO NOT add docs on individual `it(...)` test bodies.

Constraints — files you must NOT touch:
- `src/shared/types.ts` (coordinator-owned)
- `src/shared/utils/*` (coordinator-owned)
- `src/constants/*` (coordinator-owned)
- `App.tsx`, `main.tsx`, `routes.tsx` (coordinator-owned)
- Any file outside `<DIR>`

Verify before completing:
  bun run typecheck   # 0 errors
  bun run test <DIR>  # all tests pass

Commit on your branch with message: `docs(<module>): JSDoc total coverage (Nick's point, subagent <X>)`

Report when done with: number of files touched, estimated symbols documented.
```

- [ ] **Step 2: Dispatch 5 subagents in parallel** (single message, 5 Agent tool uses with `isolation: "worktree"` flag)

- [ ] **Step 3: Coordinator merges each subagent's branch into `feat/the-flaw-in-the-plan` after they finish**

Fast-forward merge order: A → B → C → D → E. Resolve conflicts only if subagents mistakenly touched coordinator-owned files (shouldn't happen per the constraints).

- [ ] **Step 4: Verify**

```bash
bun run lint && bun run test
# JSDoc coverage spot-check: grep a few random files for /**
git grep -L '/\*\*' src/modules/ | head -20  # expect very few hits (only generated files)
```

- [ ] **Step 5: Final coordinator commit** (if anything had to be touched during merges)

---

**Wave 3 verification gate:**

```bash
bun run typecheck && bun run test
```

Move to Wave 4 only when this passes.

---

## Wave 4 — Docs Sweep

### Task 47: Per-dir README audit + updates

- [ ] **Step 1:** Run `find src -name 'README.md'` to list all per-dir READMEs.
- [ ] **Step 2:** Skim each for staleness against current code. Update.
- [ ] **Step 3:** Identify missing READMEs that would help: likely `src/modules/expenses/`, `src/modules/expenses/components/`. Add tight 5-10-line READMEs explaining the directory's contents.
- [ ] **Step 4:** Commit: `docs: per-dir README audit + targeted additions`

### Task 48: CLAUDE.md known-issues purge

- [ ] **Step 1:** Open `CLAUDE.md`, scan "Known Issues" + "20-Point Audit Violations" sections.
- [ ] **Step 2:** For each item closed by this branch, strike through or remove. Update the "FIXED" markers accordingly.
- [ ] **Step 3:** Add new gotchas surfaced during fixes (e.g., the `'T12:00:00'` suffix idiom for date parsing; the `assertNever` exhaustiveness pattern).
- [ ] **Step 4:** Add new conventions earned: `ExpenseMetaType` enum convention, JSDoc-on-everything rule.
- [ ] **Step 5:** Commit: `docs(claude): known-issues purge + new conventions documented`

### Task 49: ROADMAP bump

- [ ] **Step 1:** Open `ROADMAP.md`. Decide version bump: propose `0.2.19` for the cleanup pass (or `0.2.18.2`).
- [ ] **Step 2:** Add a Phase 2j.1 / 2k section: "Cleanup — flaw-in-the-plan branch." List the major themes (CRITICAL fixes, exhaustiveness, JSDoc total coverage, docs sweep).
- [ ] **Step 3:** Commit: `docs(roadmap): bump 0.2.19 — cleanup pass`

### Task 50: CHANGELOG entry

- [ ] **Step 1:** Open `CHANGELOG.md`. Add a `[0.2.19] - 2026-05-15` entry above the most recent.
- [ ] **Step 2:** Three subsections:
  - **Fixed** — list all 44 review findings + the H15 CHANGELOG self-correction.
  - **Changed** — refactors (`ExpenseFormShell`, `AutoTab` split, `deriveFuelTriple`).
  - **Documentation** — JSDoc total coverage milestone; new conventions.
- [ ] **Step 3:** Commit: `docs(changelog): 0.2.19 entry — flaw-in-the-plan cleanup`

### Task 51: Branch execution log to `docs/plans/`

- [ ] **Step 1:** Update this very file (`docs/plans/2026-05-15-flaw-in-the-plan-execution.md`) at the bottom with an "Execution log" section.
- [ ] **Step 2:** List shipped commits (use `git log master..HEAD --oneline`). Mark each task complete with the commit hash.
- [ ] **Step 3:** Note any items closed-with-rationale or moved-out-of-scope.
- [ ] **Step 4:** Commit: `docs(plans): mark flaw-in-the-plan execution log as shipped`

---

**Wave 4 verification gate:**

```bash
bun run typecheck && bun run test
```

Move to Wave 5 only when this passes.

---

## Wave 5 — Re-review + Exit Gate

### Task 52: Full verification sweep

- [ ] **Step 1: Format check**
  `bun run format:check` → must report all files clean.

- [ ] **Step 2: Lint**
  `bun run lint` → 0 errors.

- [ ] **Step 3: Unit tests**
  `bun run test` → all pass (≥637; new tests added during cleanup count).

- [ ] **Step 4: E2E**
  `bun run test:e2e` → all pass (≥81).

If any of #1–#4 fails, FIX before proceeding. The branch cannot ship with a regression.

### Task 53: Re-run `/the-final-countdown` over the branch

- [ ] **Step 1:** Dispatch `/the-final-countdown extensive review for last <N> commits` where `N = git rev-list --count master..HEAD`.
- [ ] **Step 2:** 6 agents run in parallel against the cumulative branch diff.
- [ ] **Step 3:** Save report to `.final-countdown-reports/` (overwriting the previous baseline).

### Task 54: Triage re-review findings against the exit gate

- [ ] **Step 1:** Open the new `report.html`.
- [ ] **Step 2:** Count CRITICAL + HIGH findings.
- [ ] **Step 3:**
  - If `CRITICAL == 0 && HIGH == 0` → exit gate PASSED. Proceed to Task 55.
  - Else → triage each finding into:
    - **(a) Address in-branch immediately** — go back to a relevant Wave, add a task, fix, re-run Task 53.
    - **(b) Defer with a one-line spec pointer** — add a stub spec in `docs/specs/YYYY-MM-DD-<topic>.md`, link from this plan's "Moved out of scope" section.
    - **(c) Close-with-rationale** — add to this plan's "Moved out of scope" section with reason.
- [ ] **Step 4:** If anything was addressed in (a), re-run Task 53 and Task 54 until exit gate passes.

### Task 55: Squash + open PR

- [ ] **Step 1: Confirm with Nick** (per CLAUDE.md rule on git operations):
  - Show the cumulative diff stats: `git diff --shortstat master..HEAD`
  - Show the commit list: `git log master..HEAD --oneline`
  - Ask: "Ready to squash + open PR? (Recommended yes if Wave 5 gate passed.)"

- [ ] **Step 2: On approval, squash + merge prep:**
  - The squash itself happens on the GitHub PR merge UI per `feedback_squash_commits.md`. Locally we DON'T `git reset --hard` or rebase.
  - Just push the branch: `git push -u origin feat/the-flaw-in-the-plan`.

- [ ] **Step 3: Open PR via `gh pr create`** with title and body summarizing:
  - 44 review findings closed
  - JSDoc total coverage milestone (Nick's point)
  - Docs sweep complete
  - Re-review exit gate: 0 CRITICAL + 0 HIGH
  - Format/lint/test/e2e baseline maintained

- [ ] **Step 4:** Return the PR URL.

---

## Execution Log

### Wave 1 — CRITICAL + HIGH foundations + fixes (20 tasks, 20 commits)

Branch created from `master @ f31c7a9`. Wave 1 landed 2026-05-15.

| SHA | Subject |
|-----|---------|
| `f186e3f` | feat(shared): add assertNever exhaustiveness helper (Decision E1) |
| `f9fc8f9` | feat(expenses): introduce ExpenseMetaType enum (foundation for H5) |
| `966cf68` | feat(expenses): VEHICLE_SUBCAT typed constants (foundation for H6) |
| `e2e944f` | feat(expenses): extract deriveFuelTriple pure util (foundation for H13) |
| `27ec9ab` | fix(expenses): AutoTab amount validation shows AmountPositive toast (C1) |
| `c7bf6cb` | fix(expenses): render em-dash literal correctly in ExpenseList note (C2) |
| `f7be85b` | fix(expenses): reject NaN/Infinity in validateMeta + MetaSubForm coercion (C3) |
| `2a4ab6b` | refactor(expenses): replace meta-type literals with ExpenseMetaType enum (H5) |
| `797c8bb` | refactor(expenses): use VEHICLE_SUBCAT + TRAVEL_SUBCAT constants in routing logic (H6, #23) |
| `7b1e6c4` | refactor(expenses): apply assertNever exhaustiveness at 4 meta sites (H4) |
| `9bbdea1` | fix(shared): parse YYYY-MM-DD as local midday in relativeDateLabel + isoWeekNumber (H7, #39) |
| `8766440` | fix(expenses): dueMaintenance sorts by odometer not date (H12) |
| `40ffb62` | docs(changelog): correct fuel-math signatures for 0.2.18 (H15) |
| `b9089c5` | chore(expenses): remove dead prevCategoryRef/prevSubCatRef + misleading comment (H16) |
| `9923115` | fix(baby): useBabyCollection returns Promise<boolean>; gate state on success (H8) |
| `a3b96f1` | fix(baby): surface partial failures in logToSiblings (H9) |
| `e05c5fd` | fix(expenses): toast on adapter-null in add/update/delete (H10) |
| `936cd67` | fix(expenses): ServiceDueBanner defensive guards + useMemo single-walk (H11, #22, #24) |
| `ff1d4aa` | fix(expenses): MetaSubForm dispatches to deriveFuelTriple; no stale state (H13) |
| `78fc28e` | fix(expenses): Auto tab captures paymentMethod (no silent UPI default) (H14) |

### Wave 2 — Refactors + small fixes (13 commits)

Landed 2026-05-15 to 2026-05-16.

| SHA | Subject |
|-----|---------|
| `547efe5` | refactor(expenses): lift useExpenseForm hook shared by AddExpense + AutoTab (#14, #18, #21) |
| `8bdfdb3` | refactor(expenses): split AutoTab into AutoTabRow + expense-badges (#17) |
| `40a39b8` | chore: Wave 2 small fixes batch A — docs + comments + relocations |
| `5194f32` | fix(expenses): inline helper text on invalid amount in AddExpense (#19) |
| `555adb4` | a11y(expenses,body,baby): keyboard activation on tap-to-edit rows (#33) |
| `bc9f6c1` | fix(shared): guard NaN getTime in filterByDateRange (#35) |
| `2c012ce` | refactor(expenses): single validation pass in updateExpense (#36) — already correct, no change needed |
| `e5594c8` | refactor(expenses): align AutoTab async prop signatures (#37) |
| `9098ff2` | refactor(shared): CONFIG.LIST_PAGE_SIZE_OPTIONS extraction (#41) |
| `6b4be61` | refactor(expenses): isolate useListControls per tab (#25) |
| `638c0a9` | test(expenses): AutoTab pagination-deviation comment + 500-row sanity test (#26) |
| `2964787` | fix(rules): validate Expense.meta shape server-side (#27) |

### Wave 3 — JSDoc total coverage (~290 docstrings, 3 parallel subagent commits)

| SHA | Subject |
|-----|---------|
| `050dbfb` | docs(shared): JSDoc total coverage on shared types/utils/constants/root (Wave 3) |
| `bfd41e3` | docs(modules): JSDoc total coverage on baby/body/expenses (Wave 3 part 2) |
| `43e8ce9` | docs(shared,admin,themes): JSDoc total coverage on UI + cross-cutting (Wave 3 part 3) |

### Wave 4 — Docs sweep (5 commits)

| SHA | Subject |
|-----|---------|
| `50c4b3e` | docs: per-dir README audit + targeted additions (Wave 4 / Task 47) |
| `ff9f207` | docs(claude): known-issues purge + new conventions documented (Wave 4 / Task 48) |
| `68c3f08` | docs(roadmap): bump 0.2.19 — flaw-in-the-plan cleanup pass (Wave 4 / Task 49) |
| `f1d73e1` | docs(changelog): 0.2.19 entry — flaw-in-the-plan cleanup (Wave 4 / Task 50) |
| *(this commit)* | docs(plans): mark flaw-in-the-plan execution log as shipped (Wave 4 / Task 51) |

Total: 36 functional commits + 1 plan-doc commit = 41 commits ahead of master after Wave 4.

---

### Close-with-rationale (absorbed / scope clarifications)

- **Task 23** (deriveFuelTriple guards in `validateMeta`) — absorbed into Task 4 (`deriveFuelTriple` extraction). The pure util already handles invalid inputs; `validateMeta` guards the entry point with `isValidNumber`.
- **Task 38 CLAUDE.md hook codification** — folded into Task 48 (Known Issues purge). The new conventions (assertNever, ExpenseMetaType, T12:00:00 parsing, hook return contract, VEHICLE_SUBCAT) were written directly into CLAUDE.md Key Conventions rather than as a separate hook-codification pass.
- **Task 36 "no change needed" note** — `updateExpense` was already doing a single validation pass on master. The commit confirms this but makes no functional change.

## Moved out of scope

(Filled in during Task 54 if any deferrals happen.)

## Self-review notes

- **Spec coverage:** Each section of the spec maps to a task or task group (Wave 1 → Tasks 1-20; Wave 2 → Tasks 21-44; Wave 3 → Tasks 45-46; Wave 4 → Tasks 47-51; Wave 5 → Tasks 52-55). All 44 findings + Nick's point indexed. All 5 design decisions A1–E1 explicitly wired into tasks. ✓
- **Placeholder scan:** No "TBD"/"TODO"/"fill in" inside the plan body itself. Task 33 introduces a `TODO(sentry):` *into the codebase* — that's a deliberate marker per finding #34, not a plan placeholder. ✓
- **Type consistency:** `ExpenseMetaType.Fuel/.Travel/.Maintenance` used consistently across Tasks 2/5/7/16/22/28. `assertNever` from `@/shared/utils/types` consistent. `VEHICLE_SUBCAT` consistent. `useExpenseForm` API consistent across Tasks 21/22. ✓

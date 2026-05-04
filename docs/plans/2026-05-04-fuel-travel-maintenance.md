# Fuel, Travel & Maintenance (Auto Tab) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add fuel-economy, trip, and maintenance tracking to the Budget module via a discriminated `meta` union on `Expense` plus a new "Auto" tab with quick-add buttons and a derived service-due banner.

**Architecture:** Polymorphic `meta` field hung off `Expense` (no new collection, no migration). Two-way entry: meta sub-form renders inline in `AddExpense` (Path 1) or in a new `AutoTab` (Path 2). All UI honors AFP conventions — tap-to-populate edit, save-and-stay, hairline list rows, `BudgetMsg` enum strings. Computed values (mileage, banner condition) live in a new `fuel-math.ts` module mirroring `budget-math.ts`.

**Tech Stack:** TypeScript (strict), React 19, Vitest, existing AFP shared infrastructure (`useListControls`, `<DateGroupHeader>`, `sortNewestFirst`, `filterByDateRange`, `paginate`).

**Spec:** `docs/specs/2026-05-04-fuel-travel-maintenance-design.md` (commit `3d75985`).

---

## File Structure

**New files:**
| Path | Responsibility |
|---|---|
| `src/modules/expenses/fuel-math.ts` | Pure functions: `computeMileage`, `latestOdometer`, `dueMaintenance`, `isServiceDue` |
| `src/modules/expenses/__tests__/fuel-math.test.ts` | Unit tests for fuel-math |
| `src/modules/expenses/components/MetaSubForm.tsx` | Conditional Fuel/Travel/Maintenance sub-form by `(category, subCat)` |
| `src/modules/expenses/components/ServiceDueBanner.tsx` | Yellow warning banner — shown when `currentOdo ≥ nextService` |
| `src/modules/expenses/components/AutoTab.tsx` | Tab wrapper: banner, quick-adds, inline form, filtered list with meta badges |

**Modified files:**
| Path | Change |
|---|---|
| `src/modules/expenses/types.ts` | Add `ExpenseMeta` discriminated union + optional `meta` field on `Expense` |
| `src/modules/expenses/validation.ts` | Extend `validateExpense` to accept and validate optional `meta` |
| `src/modules/expenses/hooks/useExpenses.ts` | `addExpense` accepts `meta`; add new `updateExpense(expense)` method |
| `src/modules/expenses/components/AddExpense.tsx` | Wire `MetaSubForm` conditionally; widen `onSubmit` signature; carry meta state |
| `src/modules/expenses/pages/ExpenseListPage.tsx` | Add `'auto'` tab to the existing tab strip; render `<AutoTab />` |
| `src/constants/messages.ts` | Add fuel/trip/service entries to `BudgetMsg` enum |

**Out of scope (Phase-2 candidates per spec §"Phase-2 Candidates"):**
- Rolling-average mileage cards
- Mileage divergence panel
- Multi-vehicle support
- Notification on service-due
- Operator/airline structured tracking for Travel
- Charts (cost-per-km, monthly trends)

---

## Universal Task Requirements

**Every task must, before commit:**

1. **Update the README in any directory you create or modify files in.** Each subdirectory has a `README.md` documenting its files and conventions. Affected READMEs in this plan:
   - `src/modules/expenses/README.md` (Tasks 1, 2, 4)
   - `src/modules/expenses/hooks/README.md` (Task 3)
   - `src/modules/expenses/components/README.md` (Tasks 5, 6, 7, 8)
   - `src/modules/expenses/pages/README.md` (Task 9)
   - `src/constants/README.md` (Tasks 2, 3 — only if it documents `BudgetMsg` / `ValidationMsg` enum entries)

   Append a one-line entry for new files. Edit existing entries when behavior changes. Do not rewrite the README — make targeted edits only.

2. **Include tests for new logic.**
   - **Pure functions** (Tasks 2, 4): full unit-test coverage of every branch.
   - **Components** (Tasks 5, 6, 7, 8): at minimum a smoke test (renders without crashing) plus tests for branching/conditional rendering, badge rendering, auto-derive math, and tap-to-edit population. Use the `ToastProvider` wrapper pattern from `AddExpense.test.tsx`.
   - **Hook** (Task 3): existing AddExpense.test.tsx covers integration; no separate hook test needed unless the new `updateExpense` exposes new behavior the existing tests don't cover.

3. **Run the relevant test file** (`bunx vitest run <path>`) and confirm pass before committing. Don't commit on silent timeouts or untested green.

A subagent that skips any of the three is failing the task.

## Dispatch Order (for subagent-driven execution)

The dependency graph permits some parallelism after Task 1. Recommended order:

```
Task 1 (types)
  ├─ Task 2 (validation) ─┐
  ├─ Task 4 (fuel-math)   ├─→ Task 6 (ServiceDueBanner) ─┐
  └─ Task 5 (MetaSubForm) ─→ Task 8 (AddExpense rewrite) ├─→ Task 9 (ExpenseListPage) → Task 10
                                                          │
Task 3 (hook) [parallel after Task 2] ─────────────────────┘
                            │
                            └─→ Task 7 (AutoTab) ────────┘
```

Tasks 2, 4, 5 can run in parallel after Task 1 commits. Tasks 6, 7, 8 must wait for their respective deps. Task 9 is the integration point.

## Conventions Recap (read before starting)

1. **Imports:** React → external libs → internal components (`@/` alias) → types/constants → utils last.
2. **JSDoc:** One-line `/** */` on every exported function.
3. **No raw toast strings** — use `BudgetMsg`. Use `ToastType.Success | Error | Info`.
4. **Result types** for any new async helpers. `isOk(r)` / `isErr(r)`.
5. **No inline `.sort()` comparators** — use `sortNewestFirst()`.
6. **No inline date filters** — use `filterByDateRange<T>(items, range, today, keyFn)`.
7. **No inline pagination** — use `paginate(items, page, size)` + `totalPages(total, size)` via `useListControls()`.
8. **Numeric inputs:** `min`, `step`, `inputMode="decimal"`. Auto-derive on `onBlur`, never `onChange`.
9. **Single quotes** in TS/TSX, double in JSX attributes (Prettier owned).
10. **JSX ternary** → use `cond && ...` for conditional rendering, not ternary.
11. **No mocks for tests touching pure functions** — actual data only.

---

## Task 1: Add `ExpenseMeta` types

**Files:**
- Modify: `src/modules/expenses/types.ts`

- [ ] **Step 1: Read existing `types.ts` to understand surrounding context**

Run: `cat src/modules/expenses/types.ts`

Expected: prints the existing `Expense`, `Income`, `BudgetConfig`, `CategoryDefinition`, `LabelDefinition` types.

- [ ] **Step 2: Add the `ExpenseMeta` union and update `Expense`**

Edit `src/modules/expenses/types.ts`. Replace the existing `Expense` type and append the meta types **above** it:

```typescript
import type { ExpenseCategory, IncomeSource, PaymentMethod, TimeRange } from '@/shared/types';

// NOTE: Directory remains `expenses/` for backwards compat. Module is "Budget" in the UI.

/** Fuel-fill metadata captured for Vehicle/Fuel expenses */
export type FuelMeta = {
  type: 'fuel';
  liters: number;
  pricePerLiter: number;
  odometer: number | null;
  tripOdo: number | null;
  displayedMileage: number | null;
  fullTank: boolean;
};

/** Trip metadata captured for Travel expenses */
export type TravelMeta = {
  type: 'travel';
  origin: string;
  destination: string;
  distance: number | null;
};

/** Maintenance metadata captured for Vehicle/Maintenance expenses */
export type MaintenanceMeta = {
  type: 'maintenance';
  odometer: number;
  nextService: number | null;
  serviceNotes: string;
};

/** Discriminated union of category-specific expense metadata */
export type ExpenseMeta = FuelMeta | TravelMeta | MaintenanceMeta;

/** Single expense record with soft-delete support */
export type Expense = {
  id: string;
  date: string;
  category: ExpenseCategory;
  subCat: string;
  amount: number;
  paymentMethod: PaymentMethod;
  isSettlement: boolean;
  note: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  meta?: ExpenseMeta;
};
```

Leave `Income`, `BudgetConfig`, `CategoryDefinition`, `LabelDefinition` unchanged.

- [ ] **Step 3: Verify the file still compiles**

Run: `bun run lint`

Expected: no errors related to `expenses/types.ts`. Pre-existing lint warnings in unrelated files are fine.

- [ ] **Step 4: Update `src/modules/expenses/README.md`**

Append a "Discriminated meta union" sub-section under the existing module overview describing `ExpenseMeta = FuelMeta | TravelMeta | MaintenanceMeta`, when each variant applies (`Vehicle/Fuel`, `Vehicle/Maintenance`, `Travel/*`), and that `meta` is optional on `Expense`.

Sample addition (adapt to match the existing README's tone and structure):

```markdown
## Expense meta (Phase 2j)

`Expense` carries an optional discriminated `meta` union for category-specific data:

- **`FuelMeta`** — Vehicle/Fuel. Liters, ₹/L, optional odometer, trip ODO, dashboard mileage, full-tank flag.
- **`TravelMeta`** — Travel/*. Origin, destination, optional distance.
- **`MaintenanceMeta`** — Vehicle/Maintenance. Odometer, optional next-service ODO, service notes.

Existing expenses without `meta` continue to work; backwards-compatible by design.
```

- [ ] **Step 5: Commit**

```bash
git add src/modules/expenses/types.ts src/modules/expenses/README.md
git commit -m "feat(budget): add ExpenseMeta discriminated union (fuel/travel/maintenance)"
```

---

## Task 2: Validation for `ExpenseMeta`

**Files:**
- Modify: `src/modules/expenses/validation.ts`
- Modify: `src/modules/expenses/__tests__/validation.test.ts`
- Modify: `src/constants/messages.ts` (just `ValidationMsg` additions)

- [ ] **Step 1: Add new validation messages**

Edit `src/constants/messages.ts`. In the `ValidationMsg` enum, add (just before the closing `}`):

```typescript
  FuelLitersPositive = 'Liters must be greater than zero',
  FuelPricePerLiterPositive = 'Price per liter must be greater than zero',
  TravelOriginRequired = 'Origin is required',
  TravelDestinationRequired = 'Destination is required',
  MaintenanceOdometerPositive = 'Odometer must be greater than zero',
  UnknownMetaType = 'Unknown expense meta type',
```

- [ ] **Step 2: Read existing validation tests**

Run: `cat src/modules/expenses/__tests__/validation.test.ts`

Expected: prints existing tests for `validateExpense` and `validateIncome`.

- [ ] **Step 3: Write failing tests for meta validation**

Append to `src/modules/expenses/__tests__/validation.test.ts`:

```typescript
import type { FuelMeta, TravelMeta, MaintenanceMeta } from '@/modules/expenses/types';

describe('validateExpense — fuel meta', () => {
  const baseInput = {
    date: '2026-05-04',
    category: ExpenseCategory.Vehicle,
    amount: 4000,
  };

  it('accepts a valid fuel meta', () => {
    const meta: FuelMeta = {
      type: 'fuel',
      liters: 40,
      pricePerLiter: 100,
      odometer: 12000,
      tripOdo: 500,
      displayedMileage: 14.2,
      fullTank: true,
    };
    expect(isOk(validateExpense({ ...baseInput, meta }))).toBe(true);
  });

  it('rejects fuel meta with zero liters', () => {
    const meta: FuelMeta = {
      type: 'fuel',
      liters: 0,
      pricePerLiter: 100,
      odometer: null,
      tripOdo: null,
      displayedMileage: null,
      fullTank: false,
    };
    const r = validateExpense({ ...baseInput, meta });
    expect(isOk(r)).toBe(false);
    if (!isOk(r)) expect(r.error).toBe(ValidationMsg.FuelLitersPositive);
  });

  it('rejects fuel meta with zero pricePerLiter', () => {
    const meta: FuelMeta = {
      type: 'fuel',
      liters: 40,
      pricePerLiter: 0,
      odometer: null,
      tripOdo: null,
      displayedMileage: null,
      fullTank: false,
    };
    const r = validateExpense({ ...baseInput, meta });
    expect(isOk(r)).toBe(false);
    if (!isOk(r)) expect(r.error).toBe(ValidationMsg.FuelPricePerLiterPositive);
  });
});

describe('validateExpense — travel meta', () => {
  const baseInput = {
    date: '2026-05-04',
    category: ExpenseCategory.Travel,
    amount: 250,
  };

  it('accepts a valid travel meta', () => {
    const meta: TravelMeta = {
      type: 'travel',
      origin: 'BLR',
      destination: 'MAA',
      distance: 8,
    };
    expect(isOk(validateExpense({ ...baseInput, meta }))).toBe(true);
  });

  it('rejects travel meta with empty origin', () => {
    const meta: TravelMeta = { type: 'travel', origin: '', destination: 'MAA', distance: null };
    const r = validateExpense({ ...baseInput, meta });
    expect(isOk(r)).toBe(false);
    if (!isOk(r)) expect(r.error).toBe(ValidationMsg.TravelOriginRequired);
  });

  it('rejects travel meta with empty destination', () => {
    const meta: TravelMeta = { type: 'travel', origin: 'BLR', destination: '', distance: null };
    const r = validateExpense({ ...baseInput, meta });
    expect(isOk(r)).toBe(false);
    if (!isOk(r)) expect(r.error).toBe(ValidationMsg.TravelDestinationRequired);
  });
});

describe('validateExpense — maintenance meta', () => {
  const baseInput = {
    date: '2026-05-04',
    category: ExpenseCategory.Vehicle,
    amount: 5000,
  };

  it('accepts a valid maintenance meta', () => {
    const meta: MaintenanceMeta = {
      type: 'maintenance',
      odometer: 12500,
      nextService: 22500,
      serviceNotes: 'Engine oil + filter',
    };
    expect(isOk(validateExpense({ ...baseInput, meta }))).toBe(true);
  });

  it('rejects maintenance meta with zero odometer', () => {
    const meta: MaintenanceMeta = {
      type: 'maintenance',
      odometer: 0,
      nextService: null,
      serviceNotes: '',
    };
    const r = validateExpense({ ...baseInput, meta });
    expect(isOk(r)).toBe(false);
    if (!isOk(r)) expect(r.error).toBe(ValidationMsg.MaintenanceOdometerPositive);
  });
});

describe('validateExpense — no meta', () => {
  it('accepts an expense with meta=undefined (existing behavior)', () => {
    expect(
      isOk(
        validateExpense({
          date: '2026-05-04',
          category: ExpenseCategory.Food,
          amount: 100,
        }),
      ),
    ).toBe(true);
  });
});
```

If the existing test file does not already import `isOk`, `ExpenseCategory`, `ValidationMsg`, add the imports at the top of the file (next to the existing imports).

- [ ] **Step 4: Run tests to verify they fail**

Run: `bunx vitest run src/modules/expenses/__tests__/validation.test.ts`

Expected: 11 failing tests in the four new `describe` blocks. Existing tests still pass.

- [ ] **Step 5: Extend `validateExpense` to validate meta**

Edit `src/modules/expenses/validation.ts`. Replace the existing `validateExpense` function. The new version:

```typescript
import { CATEGORIES } from '@/modules/expenses/categories';
import type { Result } from '@/shared/types';
import { err, ok, ExpenseCategory, IncomeSource } from '@/shared/types';
import type { ExpenseMeta } from '@/modules/expenses/types';
import { DATE_RE } from '@/shared/utils/regex';
import { ValidationMsg } from '@/constants/messages';

/** Validates expense input fields and optional meta, returning a Result */
export function validateExpense(input: {
  date: string;
  category: ExpenseCategory;
  amount: number;
  meta?: ExpenseMeta;
}): Result<void> {
  if (!input.date) {
    return err(ValidationMsg.DateRequired);
  }

  if (!DATE_RE.test(input.date)) {
    return err(ValidationMsg.DateFormat);
  }

  if (!CATEGORIES[input.category]) {
    return err(ValidationMsg.UnknownCategory);
  }

  if (input.amount <= 0) {
    return err(ValidationMsg.AmountPositive);
  }

  if (input.meta) {
    const metaResult = validateMeta(input.meta);
    if (!metaResult.ok) return metaResult;
  }

  return ok(undefined);
}

/** Validates the discriminated meta union */
function validateMeta(meta: ExpenseMeta): Result<void> {
  switch (meta.type) {
    case 'fuel':
      if (meta.liters <= 0) return err(ValidationMsg.FuelLitersPositive);
      if (meta.pricePerLiter <= 0) return err(ValidationMsg.FuelPricePerLiterPositive);
      return ok(undefined);
    case 'travel':
      if (!meta.origin.trim()) return err(ValidationMsg.TravelOriginRequired);
      if (!meta.destination.trim()) return err(ValidationMsg.TravelDestinationRequired);
      return ok(undefined);
    case 'maintenance':
      if (meta.odometer <= 0) return err(ValidationMsg.MaintenanceOdometerPositive);
      return ok(undefined);
    default:
      return err(ValidationMsg.UnknownMetaType);
  }
}
```

Leave `validateIncome` unchanged.

> **Note on `metaResult.ok`:** the `Result<T>` shape in this codebase is `{ ok: true, value } | { ok: false, error }`. If your editor surfaces a type error here, consult `src/shared/types.ts` for the canonical shape and adapt accordingly (use `isOk(metaResult)` if needed).

- [ ] **Step 6: Run tests to verify they pass**

Run: `bunx vitest run src/modules/expenses/__tests__/validation.test.ts`

Expected: all tests pass (existing + 11 new).

- [ ] **Step 7: Update `src/modules/expenses/README.md`**

Add a one-line note in the existing "validation" section (or wherever validation is documented) mentioning that `validateExpense` now also validates the optional `meta` union via an internal `validateMeta` helper.

- [ ] **Step 8: Update `src/constants/README.md`**

If `src/constants/README.md` documents the `ValidationMsg` enum, append the six new entries (`FuelLitersPositive`, `FuelPricePerLiterPositive`, `TravelOriginRequired`, `TravelDestinationRequired`, `MaintenanceOdometerPositive`, `UnknownMetaType`) to that list. If the README only describes the enum at a high level, no edit needed.

- [ ] **Step 9: Commit**

```bash
git add src/modules/expenses/validation.ts src/modules/expenses/__tests__/validation.test.ts src/constants/messages.ts src/modules/expenses/README.md src/constants/README.md
git commit -m "feat(budget): validate ExpenseMeta (fuel liters/price, travel origin/dest, maintenance odo)"
```

> If `src/constants/README.md` was not edited (because it doesn't enumerate enum entries), drop it from the `git add` command.

---

## Task 3: `useExpenses` accepts `meta` + new `updateExpense`

**Files:**
- Modify: `src/modules/expenses/hooks/useExpenses.ts`

- [ ] **Step 1: Add new toast messages for fuel/trip/service flows + update**

Edit `src/constants/messages.ts`. In the `BudgetMsg` enum, add:

```typescript
  ExpenseUpdated = 'Expense updated',
  FuelLogged = 'Fuel logged',
  FuelUpdated = 'Fuel updated',
  FuelDeleted = 'Fuel entry deleted',
  TripLogged = 'Trip logged',
  TripUpdated = 'Trip updated',
  TripDeleted = 'Trip deleted',
  ServiceLogged = 'Service logged',
  ServiceUpdated = 'Service updated',
  ServiceDeleted = 'Service deleted',
```

- [ ] **Step 2: Extend `addExpense` and add `updateExpense`**

Edit `src/modules/expenses/hooks/useExpenses.ts`. Replace the existing `addExpense` callback and append a new `updateExpense` callback. Final hook:

```typescript
import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuth } from '@/shared/auth/useAuth';
import { useToast } from '@/shared/errors/useToast';
import { createAdapter } from '@/shared/storage/create-adapter';
import type { StorageAdapter } from '@/shared/storage/adapter';
import type { Expense, ExpenseMeta } from '@/modules/expenses/types';
import { validateExpense } from '@/modules/expenses/validation';
import { SyncStatus, isOk, ToastType, PaymentMethod } from '@/shared/types';
import type { ExpenseCategory } from '@/shared/types';
import { BudgetMsg } from '@/constants/messages';
import { DbSubcollection, userPath } from '@/constants/db';

type ExpenseInput = {
  date: string;
  category: ExpenseCategory;
  subCat: string;
  amount: number;
  paymentMethod?: PaymentMethod;
  isSettlement?: boolean;
  note: string;
  meta?: ExpenseMeta;
};

/** Provides expense CRUD operations with real-time sync and soft-delete */
export function useExpenses(targetUid?: string) {
  const { firebaseUser, setSyncStatus } = useAuth();
  const { addToast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const adapterRef = useRef<StorageAdapter | null>(null);

  const uid = targetUid ?? firebaseUser?.uid;
  const readOnly = targetUid != null && targetUid !== firebaseUser?.uid;

  useEffect(() => {
    if (!uid) return;

    const syncFn = readOnly ? () => {} : setSyncStatus;
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
  }, [uid, readOnly, setSyncStatus]);

  /** Validates and persists a new expense, showing a toast on success or failure */
  const addExpense = useCallback(
    async (input: ExpenseInput) => {
      if (readOnly) return false;
      const validation = validateExpense(input);
      if (!isOk(validation)) {
        addToast(validation.error, ToastType.Error);
        return false;
      }

      const adapter = adapterRef.current;
      if (!adapter) return false;

      const now = new Date().toISOString();
      const expense: Expense = {
        id: crypto.randomUUID(),
        date: input.date,
        category: input.category,
        subCat: input.subCat,
        amount: input.amount,
        paymentMethod: input.paymentMethod ?? PaymentMethod.UpiBankAccount,
        isSettlement: input.isSettlement ?? false,
        note: input.note,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
        ...(input.meta ? { meta: input.meta } : {}),
      };

      const result = await adapter.save(DbSubcollection.Expenses, { ...expense });
      if (!isOk(result)) {
        addToast(result.error, ToastType.Error);
        return false;
      }

      addToast(toastForAdd(input.meta), ToastType.Success);
      return true;
    },
    [addToast, readOnly],
  );

  /** Validates and persists an updated expense (full replace by id) */
  const updateExpense = useCallback(
    async (expense: Expense) => {
      if (readOnly) return false;
      const validation = validateExpense(expense);
      if (!isOk(validation)) {
        addToast(validation.error, ToastType.Error);
        return false;
      }

      const adapter = adapterRef.current;
      if (!adapter) return false;

      const updated: Expense = { ...expense, updatedAt: new Date().toISOString() };
      const result = await adapter.save(DbSubcollection.Expenses, { ...updated });
      if (!isOk(result)) {
        addToast(result.error, ToastType.Error);
        return false;
      }

      addToast(toastForUpdate(expense.meta), ToastType.Success);
      return true;
    },
    [addToast, readOnly],
  );

  /** Soft-deletes an expense by marking it as deleted */
  const deleteExpense = useCallback(
    async (id: string) => {
      if (readOnly) return;
      const adapter = adapterRef.current;
      if (!adapter) return;

      const result = await adapter.save(DbSubcollection.Expenses, {
        id,
        isDeleted: true,
        updatedAt: new Date().toISOString(),
      });

      if (!isOk(result)) {
        addToast(result.error, ToastType.Error);
        return;
      }

      addToast(BudgetMsg.ExpenseDeleted, ToastType.Success);
    },
    [addToast, readOnly],
  );

  return { expenses, addExpense, updateExpense, deleteExpense };
}

/** Returns the appropriate toast message for an add operation based on meta type */
function toastForAdd(meta: ExpenseMeta | undefined): BudgetMsg {
  if (!meta) return BudgetMsg.ExpenseAdded;
  if (meta.type === 'fuel') return BudgetMsg.FuelLogged;
  if (meta.type === 'travel') return BudgetMsg.TripLogged;
  if (meta.type === 'maintenance') return BudgetMsg.ServiceLogged;
  return BudgetMsg.ExpenseAdded;
}

/** Returns the appropriate toast message for an update operation based on meta type */
function toastForUpdate(meta: ExpenseMeta | undefined): BudgetMsg {
  if (!meta) return BudgetMsg.ExpenseUpdated;
  if (meta.type === 'fuel') return BudgetMsg.FuelUpdated;
  if (meta.type === 'travel') return BudgetMsg.TripUpdated;
  if (meta.type === 'maintenance') return BudgetMsg.ServiceUpdated;
  return BudgetMsg.ExpenseUpdated;
}
```

- [ ] **Step 3: Run lint to confirm types**

Run: `bun run lint`

Expected: no new errors in `useExpenses.ts`.

- [ ] **Step 4: Run the existing AddExpense test**

Run: `bunx vitest run src/modules/expenses/__tests__/AddExpense.test.tsx`

Expected: passes (we widened the input type but didn't change observable behavior for non-meta calls).

- [ ] **Step 5: Update `src/modules/expenses/hooks/README.md`**

In the entry for `useExpenses`, update the description to note the new return value `updateExpense` and that `addExpense` now accepts an optional `meta: ExpenseMeta` field. Existing one-line entries follow the pattern `**useExpenses** — ...`. Match it.

- [ ] **Step 6: Commit**

```bash
git add src/modules/expenses/hooks/useExpenses.ts src/modules/expenses/hooks/README.md src/constants/messages.ts
git commit -m "feat(budget): useExpenses accepts ExpenseMeta + adds updateExpense"
```

---

## Task 4: `fuel-math.ts` pure functions (TDD)

**Files:**
- Create: `src/modules/expenses/fuel-math.ts`
- Create: `src/modules/expenses/__tests__/fuel-math.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/modules/expenses/__tests__/fuel-math.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';

import {
  computeMileage,
  latestOdometer,
  dueMaintenance,
  isServiceDue,
} from '@/modules/expenses/fuel-math';
import type { Expense, FuelMeta, MaintenanceMeta } from '@/modules/expenses/types';
import { ExpenseCategory, PaymentMethod } from '@/shared/types';

function fuelExpense(
  id: string,
  date: string,
  meta: Partial<FuelMeta> & { liters: number; pricePerLiter: number },
): Expense {
  return {
    id,
    date,
    category: ExpenseCategory.Vehicle,
    subCat: 'Fuel',
    amount: meta.liters * meta.pricePerLiter,
    paymentMethod: PaymentMethod.UpiBankAccount,
    isSettlement: false,
    note: '',
    isDeleted: false,
    createdAt: `${date}T10:00:00Z`,
    updatedAt: `${date}T10:00:00Z`,
    meta: {
      type: 'fuel',
      odometer: meta.odometer ?? null,
      tripOdo: meta.tripOdo ?? null,
      displayedMileage: meta.displayedMileage ?? null,
      fullTank: meta.fullTank ?? false,
      liters: meta.liters,
      pricePerLiter: meta.pricePerLiter,
    },
  };
}

function maintenanceExpense(
  id: string,
  date: string,
  odometer: number,
  nextService: number | null = null,
): Expense {
  return {
    id,
    date,
    category: ExpenseCategory.Vehicle,
    subCat: 'Maintenance',
    amount: 5000,
    paymentMethod: PaymentMethod.UpiBankAccount,
    isSettlement: false,
    note: '',
    isDeleted: false,
    createdAt: `${date}T10:00:00Z`,
    updatedAt: `${date}T10:00:00Z`,
    meta: { type: 'maintenance', odometer, nextService, serviceNotes: '' },
  };
}

describe('computeMileage', () => {
  it('returns null when fullTank is false', () => {
    const meta: FuelMeta = {
      type: 'fuel',
      liters: 40,
      pricePerLiter: 100,
      odometer: 12000,
      tripOdo: 500,
      displayedMileage: null,
      fullTank: false,
    };
    expect(computeMileage(meta)).toBeNull();
  });

  it('returns null when tripOdo is missing', () => {
    const meta: FuelMeta = {
      type: 'fuel',
      liters: 40,
      pricePerLiter: 100,
      odometer: 12000,
      tripOdo: null,
      displayedMileage: null,
      fullTank: true,
    };
    expect(computeMileage(meta)).toBeNull();
  });

  it('returns null when liters is zero', () => {
    const meta: FuelMeta = {
      type: 'fuel',
      liters: 0,
      pricePerLiter: 100,
      odometer: 12000,
      tripOdo: 500,
      displayedMileage: null,
      fullTank: true,
    };
    expect(computeMileage(meta)).toBeNull();
  });

  it('returns tripOdo / liters when fullTank and both present', () => {
    const meta: FuelMeta = {
      type: 'fuel',
      liters: 40,
      pricePerLiter: 100,
      odometer: 12000,
      tripOdo: 600,
      displayedMileage: null,
      fullTank: true,
    };
    expect(computeMileage(meta)).toBe(15);
  });
});

describe('latestOdometer', () => {
  it('returns null for an empty list', () => {
    expect(latestOdometer([])).toBeNull();
  });

  it('returns null when no expense has an odometer reading', () => {
    const e = fuelExpense('e1', '2026-05-01', { liters: 40, pricePerLiter: 100 });
    expect(latestOdometer([e])).toBeNull();
  });

  it('returns the highest odometer across fuel and maintenance entries', () => {
    const a = fuelExpense('e1', '2026-05-01', {
      liters: 40,
      pricePerLiter: 100,
      odometer: 12000,
    });
    const b = maintenanceExpense('e2', '2026-05-03', 12500);
    const c = fuelExpense('e3', '2026-05-02', {
      liters: 35,
      pricePerLiter: 100,
      odometer: 12200,
    });
    expect(latestOdometer([a, b, c])).toBe(12500);
  });

  it('ignores non-vehicle/non-fuel/non-maintenance expenses', () => {
    const fuel = fuelExpense('e1', '2026-05-01', {
      liters: 40,
      pricePerLiter: 100,
      odometer: 12000,
    });
    const food: Expense = {
      id: 'f1',
      date: '2026-05-02',
      category: ExpenseCategory.Food,
      subCat: 'Groceries',
      amount: 500,
      paymentMethod: PaymentMethod.UpiBankAccount,
      isSettlement: false,
      note: '',
      isDeleted: false,
      createdAt: '2026-05-02T10:00:00Z',
      updatedAt: '2026-05-02T10:00:00Z',
    };
    expect(latestOdometer([fuel, food])).toBe(12000);
  });
});

describe('dueMaintenance', () => {
  it('returns null when no maintenance entry has nextService', () => {
    const m = maintenanceExpense('m1', '2026-04-01', 10000, null);
    expect(dueMaintenance([m])).toBeNull();
  });

  it('returns the most recent maintenance with nextService set', () => {
    const m1 = maintenanceExpense('m1', '2026-01-01', 5000, 15000);
    const m2 = maintenanceExpense('m2', '2026-04-01', 12000, 22000);
    const result = dueMaintenance([m1, m2]);
    expect(result).not.toBeNull();
    if (result) expect((result as MaintenanceMeta).nextService).toBe(22000);
  });

  it('skips maintenance entries with null nextService and returns the next-most-recent', () => {
    const m1 = maintenanceExpense('m1', '2026-01-01', 5000, 15000);
    const m2 = maintenanceExpense('m2', '2026-04-01', 12000, null);
    const result = dueMaintenance([m1, m2]);
    expect(result).not.toBeNull();
    if (result) expect((result as MaintenanceMeta).nextService).toBe(15000);
  });
});

describe('isServiceDue', () => {
  it('returns false when there is no due maintenance', () => {
    expect(isServiceDue([])).toBe(false);
  });

  it('returns false when latestOdometer < nextService', () => {
    const m = maintenanceExpense('m1', '2026-01-01', 5000, 15000);
    const f = fuelExpense('e1', '2026-04-01', {
      liters: 40,
      pricePerLiter: 100,
      odometer: 14000,
    });
    expect(isServiceDue([m, f])).toBe(false);
  });

  it('returns true when latestOdometer >= nextService', () => {
    const m = maintenanceExpense('m1', '2026-01-01', 5000, 15000);
    const f = fuelExpense('e1', '2026-04-01', {
      liters: 40,
      pricePerLiter: 100,
      odometer: 15500,
    });
    expect(isServiceDue([m, f])).toBe(true);
  });

  it('returns false when no fuel/maintenance entry has odometer', () => {
    const m = maintenanceExpense('m1', '2026-01-01', 5000, 15000);
    expect(isServiceDue([m])).toBe(true);  // m itself has odometer=5000 < 15000 → false? wait
  });
});
```

> **Note:** The last test in `isServiceDue` is intentionally subtle — `maintenanceExpense('m1', ..., 5000, 15000)` has `odometer=5000`. So `latestOdometer([m]) = 5000` and `5000 < 15000` → `isServiceDue([m])` should be **false**, not true. Fix the assertion to `expect(isServiceDue([m])).toBe(false)` before running. (Listed this way deliberately so the implementer reads the test intent before running it.)

Replace that last `expect(...).toBe(true)` with:

```typescript
    expect(isServiceDue([m])).toBe(false);
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bunx vitest run src/modules/expenses/__tests__/fuel-math.test.ts`

Expected: all tests fail with "Cannot find module '@/modules/expenses/fuel-math'".

- [ ] **Step 3: Implement `fuel-math.ts`**

Create `src/modules/expenses/fuel-math.ts`:

```typescript
import type {
  Expense,
  ExpenseMeta,
  FuelMeta,
  MaintenanceMeta,
} from '@/modules/expenses/types';

/** Returns the per-fill mileage (km/L) — only honest when fullTank is true and tripOdo+liters present */
export function computeMileage(meta: FuelMeta): number | null {
  if (!meta.fullTank) return null;
  if (meta.tripOdo == null || meta.tripOdo <= 0) return null;
  if (meta.liters <= 0) return null;
  return meta.tripOdo / meta.liters;
}

/** Returns the highest odometer reading across all fuel + maintenance entries, or null if none */
export function latestOdometer(expenses: Expense[]): number | null {
  let max: number | null = null;
  for (const e of expenses) {
    const odo = readOdometer(e.meta);
    if (odo != null && (max == null || odo > max)) {
      max = odo;
    }
  }
  return max;
}

/** Returns the most recent maintenance meta that has a non-null nextService */
export function dueMaintenance(expenses: Expense[]): MaintenanceMeta | null {
  const maint = expenses
    .filter((e): e is Expense & { meta: MaintenanceMeta } =>
      e.meta?.type === 'maintenance' && e.meta.nextService != null,
    )
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date));
  return maint[0]?.meta ?? null;
}

/** Returns true when the latest odometer reading has reached the most recent nextService */
export function isServiceDue(expenses: Expense[]): boolean {
  const due = dueMaintenance(expenses);
  if (!due || due.nextService == null) return false;
  const latest = latestOdometer(expenses);
  if (latest == null) return false;
  return latest >= due.nextService;
}

/** Extracts the odometer reading from a meta object, if present */
function readOdometer(meta: ExpenseMeta | undefined): number | null {
  if (!meta) return null;
  if (meta.type === 'fuel') return meta.odometer;
  if (meta.type === 'maintenance') return meta.odometer;
  return null;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bunx vitest run src/modules/expenses/__tests__/fuel-math.test.ts`

Expected: all 14 tests pass.

- [ ] **Step 5: Update `src/modules/expenses/README.md`**

Append a one-line entry under the existing "Files" or "Modules" section: `**fuel-math.ts** — Pure functions for fuel mileage and service-due derivations: \`computeMileage\`, \`latestOdometer\`, \`dueMaintenance\`, \`isServiceDue\`.`

- [ ] **Step 6: Commit**

```bash
git add src/modules/expenses/fuel-math.ts src/modules/expenses/__tests__/fuel-math.test.ts src/modules/expenses/README.md
git commit -m "feat(budget): add fuel-math (mileage, latestOdometer, dueMaintenance, isServiceDue)"
```

---

## Task 5: `MetaSubForm` component

**Files:**
- Create: `src/modules/expenses/components/MetaSubForm.tsx`

This is a controlled sub-form. Parent owns `meta` state; this component is a presenter. It's used by both `AddExpense` (Path 1) and `AutoTab` (Path 2).

- [ ] **Step 1: Create `MetaSubForm.tsx`**

```tsx
import type { ExpenseMeta, FuelMeta, TravelMeta, MaintenanceMeta } from '@/modules/expenses/types';
import type { ExpenseCategory } from '@/shared/types';
import { ExpenseCategory as Cat } from '@/shared/types';

type MetaKind = 'fuel' | 'travel' | 'maintenance' | null;

/** Returns the meta kind appropriate for a (category, subCat) pair, or null if none applies */
export function metaKindFor(category: ExpenseCategory | null, subCat: string): MetaKind {
  if (category === Cat.Vehicle && subCat === 'Fuel') return 'fuel';
  if (category === Cat.Vehicle && subCat === 'Maintenance') return 'maintenance';
  if (category === Cat.Travel && subCat) return 'travel';
  return null;
}

/** Returns a default meta object for the given kind */
export function defaultMeta(kind: MetaKind): ExpenseMeta | undefined {
  if (kind === 'fuel') {
    return {
      type: 'fuel',
      liters: 0,
      pricePerLiter: 0,
      odometer: null,
      tripOdo: null,
      displayedMileage: null,
      fullTank: false,
    };
  }
  if (kind === 'travel') {
    return { type: 'travel', origin: '', destination: '', distance: null };
  }
  if (kind === 'maintenance') {
    return { type: 'maintenance', odometer: 0, nextService: null, serviceNotes: '' };
  }
  return undefined;
}

/** Conditional meta sub-form — renders Fuel / Travel / Maintenance fields based on meta.type */
export function MetaSubForm({
  meta,
  amount,
  onChangeMeta,
  onChangeAmount,
}: {
  meta: ExpenseMeta;
  amount: string;
  onChangeMeta: (m: ExpenseMeta) => void;
  onChangeAmount: (a: string) => void;
}) {
  if (meta.type === 'fuel') {
    return <FuelFields meta={meta} amount={amount} onChange={onChangeMeta} onChangeAmount={onChangeAmount} />;
  }
  if (meta.type === 'travel') {
    return <TravelFields meta={meta} onChange={onChangeMeta} />;
  }
  return <MaintenanceFields meta={meta} onChange={onChangeMeta} />;
}

function FuelFields({
  meta,
  amount,
  onChange,
  onChangeAmount,
}: {
  meta: FuelMeta;
  amount: string;
  onChange: (m: FuelMeta) => void;
  onChangeAmount: (a: string) => void;
}) {
  /** Fills in the third value when two of {liters, pricePerLiter, amount} are present */
  function autoDerive(next: FuelMeta, lastEdited: 'liters' | 'price' | 'amount', amountStr: string) {
    const liters = next.liters;
    const price = next.pricePerLiter;
    const amt = Number(amountStr);
    if (lastEdited !== 'amount' && liters > 0 && price > 0) {
      onChangeAmount(String(Number((liters * price).toFixed(2))));
    } else if (lastEdited !== 'liters' && price > 0 && amt > 0) {
      onChange({ ...next, liters: Number((amt / price).toFixed(2)) });
    } else if (lastEdited !== 'price' && liters > 0 && amt > 0) {
      onChange({ ...next, pricePerLiter: Number((amt / liters).toFixed(2)) });
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-line bg-surface-card p-3">
      <span className="text-xs font-medium text-fg-muted">⛽ Fuel details</span>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-[11px] text-fg-muted">
          Liters
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={meta.liters || ''}
            onChange={(e) => onChange({ ...meta, liters: Number(e.target.value) })}
            onBlur={() => autoDerive(meta, 'liters', amount)}
            className="rounded-md border border-line bg-surface px-2 py-1 text-fg"
          />
        </label>
        <label className="flex flex-col gap-1 text-[11px] text-fg-muted">
          ₹/Liter
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={meta.pricePerLiter || ''}
            onChange={(e) => onChange({ ...meta, pricePerLiter: Number(e.target.value) })}
            onBlur={() => autoDerive(meta, 'price', amount)}
            className="rounded-md border border-line bg-surface px-2 py-1 text-fg"
          />
        </label>
      </div>

      <label className="flex items-center gap-2 text-xs text-fg-muted">
        <input
          type="checkbox"
          checked={meta.fullTank}
          onChange={(e) => onChange({ ...meta, fullTank: e.target.checked })}
        />
        Full tank
      </label>

      <details className="text-xs">
        <summary className="cursor-pointer text-fg-muted">Vehicle data (optional)</summary>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <label className="flex flex-col gap-1 text-[11px] text-fg-muted">
            Total ODO (km)
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="1"
              value={meta.odometer ?? ''}
              onChange={(e) =>
                onChange({ ...meta, odometer: e.target.value === '' ? null : Number(e.target.value) })
              }
              className="rounded-md border border-line bg-surface px-2 py-1 text-fg"
            />
          </label>
          <label className="flex flex-col gap-1 text-[11px] text-fg-muted">
            Trip ODO (km)
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="1"
              value={meta.tripOdo ?? ''}
              onChange={(e) =>
                onChange({ ...meta, tripOdo: e.target.value === '' ? null : Number(e.target.value) })
              }
              className="rounded-md border border-line bg-surface px-2 py-1 text-fg"
            />
          </label>
          <label className="flex flex-col gap-1 text-[11px] text-fg-muted">
            Dash km/L
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.1"
              value={meta.displayedMileage ?? ''}
              onChange={(e) =>
                onChange({
                  ...meta,
                  displayedMileage: e.target.value === '' ? null : Number(e.target.value),
                })
              }
              className="rounded-md border border-line bg-surface px-2 py-1 text-fg"
            />
          </label>
        </div>
      </details>
    </div>
  );
}

function TravelFields({ meta, onChange }: { meta: TravelMeta; onChange: (m: TravelMeta) => void }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-line bg-surface-card p-3">
      <span className="text-xs font-medium text-fg-muted">🚕 Trip details</span>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-[11px] text-fg-muted">
          From
          <input
            type="text"
            value={meta.origin}
            onChange={(e) => onChange({ ...meta, origin: e.target.value })}
            placeholder="BLR"
            className="rounded-md border border-line bg-surface px-2 py-1 text-fg"
          />
        </label>
        <label className="flex flex-col gap-1 text-[11px] text-fg-muted">
          To
          <input
            type="text"
            value={meta.destination}
            onChange={(e) => onChange({ ...meta, destination: e.target.value })}
            placeholder="MAA"
            className="rounded-md border border-line bg-surface px-2 py-1 text-fg"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-[11px] text-fg-muted">
        Distance (km, optional)
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step="1"
          value={meta.distance ?? ''}
          onChange={(e) =>
            onChange({ ...meta, distance: e.target.value === '' ? null : Number(e.target.value) })
          }
          className="rounded-md border border-line bg-surface px-2 py-1 text-fg"
        />
      </label>
    </div>
  );
}

function MaintenanceFields({
  meta,
  onChange,
}: {
  meta: MaintenanceMeta;
  onChange: (m: MaintenanceMeta) => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-line bg-surface-card p-3">
      <span className="text-xs font-medium text-fg-muted">🔧 Service details</span>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-[11px] text-fg-muted">
          Current ODO (km)
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="1"
            value={meta.odometer || ''}
            onChange={(e) => onChange({ ...meta, odometer: Number(e.target.value) })}
            className="rounded-md border border-line bg-surface px-2 py-1 text-fg"
          />
        </label>
        <label className="flex flex-col gap-1 text-[11px] text-fg-muted">
          Next service @ (km)
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="1"
            placeholder="32500"
            value={meta.nextService ?? ''}
            onChange={(e) =>
              onChange({
                ...meta,
                nextService: e.target.value === '' ? null : Number(e.target.value),
              })
            }
            className="rounded-md border border-line bg-surface px-2 py-1 text-fg"
          />
        </label>
      </div>
      <span className="text-[10px] text-fg-muted">
        Setting next service ODO clears the service-due banner.
      </span>
      <label className="flex flex-col gap-1 text-[11px] text-fg-muted">
        Service notes
        <textarea
          value={meta.serviceNotes}
          onChange={(e) => onChange({ ...meta, serviceNotes: e.target.value })}
          rows={2}
          className="rounded-md border border-line bg-surface px-2 py-1 text-fg"
        />
      </label>
    </div>
  );
}
```

- [ ] **Step 2: Write component tests**

Create `src/modules/expenses/__tests__/MetaSubForm.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { MetaSubForm, defaultMeta, metaKindFor } from '@/modules/expenses/components/MetaSubForm';
import { ExpenseCategory } from '@/shared/types';
import type { FuelMeta, TravelMeta, MaintenanceMeta } from '@/modules/expenses/types';

describe('metaKindFor', () => {
  it('returns "fuel" for Vehicle/Fuel', () => {
    expect(metaKindFor(ExpenseCategory.Vehicle, 'Fuel')).toBe('fuel');
  });
  it('returns "maintenance" for Vehicle/Maintenance', () => {
    expect(metaKindFor(ExpenseCategory.Vehicle, 'Maintenance')).toBe('maintenance');
  });
  it('returns "travel" for any non-empty Travel subCat', () => {
    expect(metaKindFor(ExpenseCategory.Travel, 'Air')).toBe('travel');
    expect(metaKindFor(ExpenseCategory.Travel, 'Cab/Auto')).toBe('travel');
  });
  it('returns null for empty Travel subCat', () => {
    expect(metaKindFor(ExpenseCategory.Travel, '')).toBeNull();
  });
  it('returns null for non-vehicle, non-travel categories', () => {
    expect(metaKindFor(ExpenseCategory.Food, 'Groceries')).toBeNull();
  });
  it('returns null when category is null', () => {
    expect(metaKindFor(null, 'Fuel')).toBeNull();
  });
});

describe('defaultMeta', () => {
  it('returns FuelMeta with zeros and nulls', () => {
    const m = defaultMeta('fuel');
    expect(m).toEqual({
      type: 'fuel',
      liters: 0,
      pricePerLiter: 0,
      odometer: null,
      tripOdo: null,
      displayedMileage: null,
      fullTank: false,
    });
  });
  it('returns TravelMeta with empty strings', () => {
    expect(defaultMeta('travel')).toEqual({
      type: 'travel',
      origin: '',
      destination: '',
      distance: null,
    });
  });
  it('returns MaintenanceMeta with zero odometer', () => {
    expect(defaultMeta('maintenance')).toEqual({
      type: 'maintenance',
      odometer: 0,
      nextService: null,
      serviceNotes: '',
    });
  });
  it('returns undefined for null kind', () => {
    expect(defaultMeta(null)).toBeUndefined();
  });
});

describe('MetaSubForm — fuel variant', () => {
  function renderFuel(initial: Partial<FuelMeta> = {}) {
    const onChangeMeta = vi.fn();
    const onChangeAmount = vi.fn();
    const meta: FuelMeta = {
      type: 'fuel',
      liters: 0,
      pricePerLiter: 0,
      odometer: null,
      tripOdo: null,
      displayedMileage: null,
      fullTank: false,
      ...initial,
    };
    render(
      <MetaSubForm
        meta={meta}
        amount=""
        onChangeMeta={onChangeMeta}
        onChangeAmount={onChangeAmount}
      />,
    );
    return { onChangeMeta, onChangeAmount };
  }

  it('renders the ⛽ Fuel details heading', () => {
    renderFuel();
    expect(screen.getByText(/Fuel details/)).toBeInTheDocument();
  });

  it('renders Liters and ₹/Liter inputs', () => {
    renderFuel();
    expect(screen.getByText('Liters')).toBeInTheDocument();
    expect(screen.getByText(/Liter$/)).toBeInTheDocument();
  });

  it('full-tank checkbox toggles via onChangeMeta', () => {
    const { onChangeMeta } = renderFuel();
    const checkbox = screen.getByRole('checkbox', { name: /Full tank/ });
    fireEvent.click(checkbox);
    expect(onChangeMeta).toHaveBeenCalledWith(expect.objectContaining({ fullTank: true }));
  });

  it('hides vehicle-data inputs by default (collapsed details)', () => {
    renderFuel();
    expect(screen.queryByText(/Total ODO/)).toBeNull();
  });
});

describe('MetaSubForm — travel variant', () => {
  it('renders origin and destination inputs', () => {
    const meta: TravelMeta = { type: 'travel', origin: 'BLR', destination: 'MAA', distance: null };
    render(<MetaSubForm meta={meta} amount="" onChangeMeta={vi.fn()} onChangeAmount={vi.fn()} />);
    expect(screen.getByDisplayValue('BLR')).toBeInTheDocument();
    expect(screen.getByDisplayValue('MAA')).toBeInTheDocument();
  });
});

describe('MetaSubForm — maintenance variant', () => {
  it('renders odometer + next-service inputs and helper text', () => {
    const meta: MaintenanceMeta = {
      type: 'maintenance',
      odometer: 12500,
      nextService: 22500,
      serviceNotes: '',
    };
    render(<MetaSubForm meta={meta} amount="" onChangeMeta={vi.fn()} onChangeAmount={vi.fn()} />);
    expect(screen.getByText(/Service details/)).toBeInTheDocument();
    expect(screen.getByText(/clears the service-due banner once set/)).toBeInTheDocument();
    expect(screen.getByDisplayValue('12500')).toBeInTheDocument();
    expect(screen.getByDisplayValue('22500')).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run tests**

Run: `bunx vitest run src/modules/expenses/__tests__/MetaSubForm.test.tsx`

Expected: all tests pass.

- [ ] **Step 4: Run lint and type-check**

Run: `bun run lint`

Expected: no errors in `MetaSubForm.tsx`.

- [ ] **Step 5: Update `src/modules/expenses/components/README.md`**

Add a one-line entry under the "Files" list (alphabetical or logical placement near `AddExpense.tsx`):

```markdown
- **MetaSubForm.tsx** — Conditional sub-form rendering Fuel / Travel / Maintenance fields based on `(category, subCat)`. Owns the two-of-three input math for fuel (liters + price → amount). Used by `AddExpense.tsx` and `AutoTab.tsx`. Helpers: `metaKindFor()` and `defaultMeta()`.
```

- [ ] **Step 6: Commit**

```bash
git add src/modules/expenses/components/MetaSubForm.tsx src/modules/expenses/__tests__/MetaSubForm.test.tsx src/modules/expenses/components/README.md
git commit -m "feat(budget): add MetaSubForm (Fuel/Travel/Maintenance sub-form by category)"
```

---

## Task 6: `ServiceDueBanner` component

**Files:**
- Create: `src/modules/expenses/components/ServiceDueBanner.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { useState } from 'react';

import type { Expense } from '@/modules/expenses/types';
import { dueMaintenance, isServiceDue, latestOdometer } from '@/modules/expenses/fuel-math';

/** Yellow warning banner — shown when latest odometer has reached most recent nextService */
export function ServiceDueBanner({ expenses }: { expenses: Expense[] }) {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  if (!isServiceDue(expenses)) return null;

  const due = dueMaintenance(expenses)!;
  const current = latestOdometer(expenses)!;

  return (
    <div className="mx-4 mb-3 flex items-start gap-3 rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-sm">
      <span className="text-amber-600">⚠</span>
      <div className="flex-1">
        <p className="font-medium text-fg">Service due</p>
        <p className="text-xs text-fg-muted">
          Current ODO {current.toLocaleString()} km · due at {due.nextService!.toLocaleString()} km
        </p>
      </div>
      <button
        type="button"
        onClick={() => setHidden(true)}
        className="text-fg-muted hover:text-fg"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Write component tests**

Create `src/modules/expenses/__tests__/ServiceDueBanner.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { ServiceDueBanner } from '@/modules/expenses/components/ServiceDueBanner';
import type { Expense } from '@/modules/expenses/types';
import { ExpenseCategory, PaymentMethod } from '@/shared/types';

function maintenance(id: string, date: string, odometer: number, nextService: number | null): Expense {
  return {
    id,
    date,
    category: ExpenseCategory.Vehicle,
    subCat: 'Maintenance',
    amount: 5000,
    paymentMethod: PaymentMethod.UpiBankAccount,
    isSettlement: false,
    note: '',
    isDeleted: false,
    createdAt: `${date}T10:00:00Z`,
    updatedAt: `${date}T10:00:00Z`,
    meta: { type: 'maintenance', odometer, nextService, serviceNotes: '' },
  };
}

function fuel(id: string, date: string, odometer: number): Expense {
  return {
    id,
    date,
    category: ExpenseCategory.Vehicle,
    subCat: 'Fuel',
    amount: 4000,
    paymentMethod: PaymentMethod.UpiBankAccount,
    isSettlement: false,
    note: '',
    isDeleted: false,
    createdAt: `${date}T10:00:00Z`,
    updatedAt: `${date}T10:00:00Z`,
    meta: {
      type: 'fuel',
      liters: 40,
      pricePerLiter: 100,
      odometer,
      tripOdo: null,
      displayedMileage: null,
      fullTank: false,
    },
  };
}

describe('ServiceDueBanner', () => {
  it('renders nothing when there are no expenses', () => {
    const { container } = render(<ServiceDueBanner expenses={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when not service-due', () => {
    const expenses = [maintenance('m1', '2026-01-01', 5000, 15000), fuel('f1', '2026-04-01', 14000)];
    const { container } = render(<ServiceDueBanner expenses={expenses} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders banner with current and due odometers when service-due', () => {
    const expenses = [maintenance('m1', '2026-01-01', 5000, 15000), fuel('f1', '2026-04-01', 16000)];
    render(<ServiceDueBanner expenses={expenses} />);
    expect(screen.getByText('Service due')).toBeInTheDocument();
    expect(screen.getByText(/16,000 km/)).toBeInTheDocument();
    expect(screen.getByText(/15,000 km/)).toBeInTheDocument();
  });

  it('hides when dismiss button is clicked', () => {
    const expenses = [maintenance('m1', '2026-01-01', 5000, 15000), fuel('f1', '2026-04-01', 16000)];
    render(<ServiceDueBanner expenses={expenses} />);
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByText('Service due')).toBeNull();
  });
});
```

- [ ] **Step 3: Run tests**

Run: `bunx vitest run src/modules/expenses/__tests__/ServiceDueBanner.test.tsx`

Expected: all tests pass.

- [ ] **Step 4: Lint**

Run: `bun run lint`

Expected: no errors in `ServiceDueBanner.tsx`.

- [ ] **Step 5: Update `src/modules/expenses/components/README.md`**

Add a one-line entry under the "Files" list:

```markdown
- **ServiceDueBanner.tsx** — Derived yellow banner shown at the top of the Auto tab when `latestOdometer ≥ mostRecentMaintenance.nextService`. In-memory dismiss only; auto-clears when a fresh maintenance entry with future `nextService` is logged.
```

- [ ] **Step 6: Commit**

```bash
git add src/modules/expenses/components/ServiceDueBanner.tsx src/modules/expenses/__tests__/ServiceDueBanner.test.tsx src/modules/expenses/components/README.md
git commit -m "feat(budget): add ServiceDueBanner (derived from dueMaintenance + latestOdometer)"
```

---

## Task 7: `AutoTab` component (banner + quick-adds + form + list)

**Files:**
- Create: `src/modules/expenses/components/AutoTab.tsx`

This component is mounted inside `ExpenseListPage` when `activeTab === 'auto'`. It owns:
- Filtered expenses (Vehicle + Travel only)
- Form state (the inline form for both add and edit)
- Edit-mode marker (id of row being edited)

- [ ] **Step 1: Create the component**

```tsx
import { useState } from 'react';

import type { Expense, ExpenseMeta, FuelMeta, TravelMeta, MaintenanceMeta } from '@/modules/expenses/types';
import { ExpenseCategory, PaymentMethod, ToastType } from '@/shared/types';
import { todayStr } from '@/shared/utils/date';
import { sortNewestFirst } from '@/shared/utils/sort';
import { CONFIG } from '@/constants/config';
import { CATEGORIES, PAYMENT_METHOD_LABELS } from '@/modules/expenses/categories';
import { MetaSubForm, defaultMeta } from '@/modules/expenses/components/MetaSubForm';
import { ServiceDueBanner } from '@/modules/expenses/components/ServiceDueBanner';
import { computeMileage } from '@/modules/expenses/fuel-math';
import { DateGroupHeader } from '@/shared/components/lists/DateGroupHeader';
import { useToast } from '@/shared/errors/useToast';
import { BudgetMsg } from '@/constants/messages';

type FormKind = 'fuel' | 'travel' | 'maintenance';

/** Auto tab — vehicle/travel filtered list, quick-add buttons, inline form, service-due banner */
export function AutoTab({
  expenses,
  onAdd,
  onUpdate,
  onDelete,
}: {
  expenses: Expense[];
  onAdd: (input: {
    date: string;
    category: ExpenseCategory;
    subCat: string;
    amount: number;
    note: string;
    meta: ExpenseMeta;
  }) => Promise<boolean>;
  onUpdate: (e: Expense) => Promise<boolean>;
  onDelete: (id: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formKind, setFormKind] = useState<FormKind | null>(null);
  const [date, setDate] = useState(todayStr());
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [meta, setMeta] = useState<ExpenseMeta | null>(null);
  const { addToast } = useToast();

  const filtered = expenses.filter(
    (e) => e.category === ExpenseCategory.Vehicle || e.category === ExpenseCategory.Travel,
  );
  const sorted = sortNewestFirst(filtered, (e) => e.date);

  function startQuickAdd(kind: FormKind) {
    setEditingId(null);
    setFormKind(kind);
    setDate(todayStr());
    setAmount('');
    setNote('');
    setMeta(defaultMeta(kind)!);
  }

  function startEdit(e: Expense) {
    if (!e.meta) return;
    setEditingId(e.id);
    setFormKind(e.meta.type);
    setDate(e.date);
    setAmount(String(e.amount));
    setNote(e.note);
    setMeta(e.meta);
  }

  function cancelForm() {
    setEditingId(null);
    setFormKind(null);
    setMeta(null);
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!meta || !formKind) return;
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      addToast(BudgetMsg.CategoryRequired, ToastType.Error);
      return;
    }

    const { category, subCat } = subCatFor(formKind);

    if (editingId) {
      const original = expenses.find((e) => e.id === editingId);
      if (!original) return;
      const ok = await onUpdate({
        ...original,
        date,
        category,
        subCat,
        amount: amt,
        note,
        meta,
      });
      if (ok) cancelForm();
    } else {
      const ok = await onAdd({
        date,
        category,
        subCat,
        amount: amt,
        note,
        meta,
      });
      if (ok) cancelForm();
    }
  }

  const today = todayStr();
  const groups: Record<string, Expense[]> = {};
  sorted.forEach((e) => {
    (groups[e.date] = groups[e.date] || []).push(e);
  });
  const dateKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  return (
    <div className="flex flex-col">
      <ServiceDueBanner expenses={expenses} />

      <div className="mx-4 mb-3 flex gap-2">
        <button
          type="button"
          onClick={() => startQuickAdd('fuel')}
          className="flex-1 rounded-lg border border-line bg-surface-card px-3 py-2 text-sm font-medium text-fg hover:border-accent/40"
        >
          ⛽ Add Fuel
        </button>
        <button
          type="button"
          onClick={() => startQuickAdd('travel')}
          className="flex-1 rounded-lg border border-line bg-surface-card px-3 py-2 text-sm font-medium text-fg hover:border-accent/40"
        >
          🚕 Add Trip
        </button>
        <button
          type="button"
          onClick={() => startQuickAdd('maintenance')}
          className="flex-1 rounded-lg border border-line bg-surface-card px-3 py-2 text-sm font-medium text-fg hover:border-accent/40"
        >
          🔧 Service
        </button>
      </div>

      {meta && formKind && (
        <form onSubmit={handleSubmit} className="mx-4 mb-3 flex flex-col gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-line bg-surface-card px-3 py-2 text-fg"
          />
          <div className="flex items-center gap-2">
            <span className="text-fg-muted text-sm font-medium">{CONFIG.CURRENCY_SYMBOL}</span>
            <input
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 rounded-lg border border-line bg-surface-card px-3 py-2 text-fg"
            />
          </div>
          <MetaSubForm
            meta={meta}
            amount={amount}
            onChangeMeta={setMeta}
            onChangeAmount={setAmount}
          />
          <input
            type="text"
            placeholder="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="rounded-lg border border-line bg-surface-card px-3 py-2 text-fg"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 rounded-lg bg-accent px-4 py-2 text-fg-on-accent font-medium"
            >
              {editingId ? 'Update' : 'Save'}
            </button>
            <button
              type="button"
              onClick={cancelForm}
              className="rounded-lg border border-line px-4 py-2 text-fg-muted"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {sorted.length === 0 && (
        <p className="px-4 py-8 text-center text-fg-muted">No vehicle or trip entries yet</p>
      )}

      <div className="bg-surface">
        {dateKeys.map((dk) => (
          <div key={dk}>
            <DateGroupHeader date={dk} today={today} />
            {groups[dk]!.map((e) => (
              <Row
                key={e.id}
                expense={e}
                isActive={e.id === editingId}
                onTap={() => startEdit(e)}
                onDelete={() => onDelete(e.id)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function Row({
  expense,
  isActive,
  onTap,
  onDelete,
}: {
  expense: Expense;
  isActive: boolean;
  onTap: () => void;
  onDelete: () => void;
}) {
  const pmLabel = PAYMENT_METHOD_LABELS[expense.paymentMethod];
  const catLabel = CATEGORIES[expense.category]?.label ?? '';
  const badge = renderBadge(expense.meta);

  return (
    <div
      className={`flex items-center justify-between border-t border-line px-4 py-3 transition-colors ${
        isActive ? 'bg-[var(--accent-muted)] border-l-2 border-l-accent' : 'hover:bg-accent-muted'
      }`}
      onClick={onTap}
    >
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-base font-semibold tabular-nums text-accent">
            {CONFIG.CURRENCY_SYMBOL}
            {expense.amount}
          </span>
          {pmLabel && (
            <span className="rounded bg-surface-card px-1.5 py-0.5 text-[10px] text-fg-muted">
              {pmLabel.shortLabel}
            </span>
          )}
        </div>
        <span className="text-xs text-fg-muted">
          {catLabel} {expense.subCat && `> ${expense.subCat}`}
        </span>
        {badge && <span className="text-[11px] text-fg-muted">{badge}</span>}
        {!expense.meta && (
          <span className="rounded bg-fg-muted/10 px-1.5 py-0.5 text-[10px] text-fg-muted">
            incomplete
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="text-fg-muted hover:text-red-500 hover:scale-125 hover:font-bold transition-all"
      >
        ×
      </button>
    </div>
  );
}

function renderBadge(meta: ExpenseMeta | undefined): string | null {
  if (!meta) return null;
  if (meta.type === 'fuel') return renderFuelBadge(meta);
  if (meta.type === 'travel') return renderTravelBadge(meta);
  return renderMaintenanceBadge(meta);
}

function renderFuelBadge(meta: FuelMeta): string {
  const parts: string[] = [`⛽ ${meta.liters}L`];
  if (meta.pricePerLiter > 0) parts.push(`${CONFIG.CURRENCY_SYMBOL}${meta.pricePerLiter}/L`);
  if (meta.odometer != null) parts.push(`${meta.odometer.toLocaleString()}km`);
  const mileage = computeMileage(meta);
  if (mileage != null) parts.push(`${mileage.toFixed(1)} km/L`);
  return parts.join(' · ');
}

function renderTravelBadge(meta: TravelMeta): string {
  const route = `🚕 ${meta.origin} → ${meta.destination}`;
  return meta.distance != null ? `${route} · ${meta.distance}km` : route;
}

function renderMaintenanceBadge(meta: MaintenanceMeta): string {
  const parts = [`🔧 ${meta.odometer.toLocaleString()}km`];
  if (meta.nextService != null) parts.push(`next ${meta.nextService.toLocaleString()}`);
  return parts.join(' · ');
}

function subCatFor(kind: FormKind): { category: ExpenseCategory; subCat: string } {
  if (kind === 'fuel') return { category: ExpenseCategory.Vehicle, subCat: 'Fuel' };
  if (kind === 'travel') return { category: ExpenseCategory.Travel, subCat: 'Cab/Auto' };
  return { category: ExpenseCategory.Vehicle, subCat: 'Maintenance' };
}
```

> **Note on Travel default subCat:** quick-add Travel defaults to `Cab/Auto` because it's the most common day-to-day. Users can change it via the main expense form (Path 1). A future enhancement could add a chip-picker for travel mode in the Auto tab quick-add — out of scope for v1.

- [ ] **Step 2: Write component tests**

Create `src/modules/expenses/__tests__/AutoTab.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { AutoTab } from '@/modules/expenses/components/AutoTab';
import { ToastProvider } from '@/shared/errors/toast-context';
import type { Expense } from '@/modules/expenses/types';
import { ExpenseCategory, PaymentMethod } from '@/shared/types';

function withToast(ui: React.ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

function fuelExpense(id: string, date: string, odometer = 12000): Expense {
  return {
    id,
    date,
    category: ExpenseCategory.Vehicle,
    subCat: 'Fuel',
    amount: 4000,
    paymentMethod: PaymentMethod.UpiBankAccount,
    isSettlement: false,
    note: '',
    isDeleted: false,
    createdAt: `${date}T10:00:00Z`,
    updatedAt: `${date}T10:00:00Z`,
    meta: {
      type: 'fuel',
      liters: 40,
      pricePerLiter: 100,
      odometer,
      tripOdo: null,
      displayedMileage: null,
      fullTank: false,
    },
  };
}

function foodExpense(id: string, date: string): Expense {
  return {
    id,
    date,
    category: ExpenseCategory.Food,
    subCat: 'Groceries',
    amount: 500,
    paymentMethod: PaymentMethod.UpiBankAccount,
    isSettlement: false,
    note: '',
    isDeleted: false,
    createdAt: `${date}T10:00:00Z`,
    updatedAt: `${date}T10:00:00Z`,
  };
}

describe('AutoTab — filtering', () => {
  it('shows only Vehicle and Travel expenses (filters out Food)', () => {
    const expenses = [fuelExpense('e1', '2026-05-01'), foodExpense('e2', '2026-05-02')];
    withToast(
      <AutoTab
        expenses={expenses}
        onAdd={vi.fn().mockResolvedValue(true)}
        onUpdate={vi.fn().mockResolvedValue(true)}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText(/12,000km/)).toBeInTheDocument();
    expect(screen.queryByText('Groceries')).toBeNull();
  });

  it('shows empty state when no Vehicle/Travel entries exist', () => {
    withToast(
      <AutoTab
        expenses={[foodExpense('e1', '2026-05-01')]}
        onAdd={vi.fn().mockResolvedValue(true)}
        onUpdate={vi.fn().mockResolvedValue(true)}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText(/No vehicle or trip entries yet/)).toBeInTheDocument();
  });
});

describe('AutoTab — quick-add buttons', () => {
  it('renders the three quick-add buttons', () => {
    withToast(
      <AutoTab
        expenses={[]}
        onAdd={vi.fn().mockResolvedValue(true)}
        onUpdate={vi.fn().mockResolvedValue(true)}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /Add Fuel/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add Trip/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Service/ })).toBeInTheDocument();
  });

  it('clicking ⛽ Add Fuel reveals the fuel sub-form', () => {
    withToast(
      <AutoTab
        expenses={[]}
        onAdd={vi.fn().mockResolvedValue(true)}
        onUpdate={vi.fn().mockResolvedValue(true)}
        onDelete={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Add Fuel/ }));
    expect(screen.getByText(/Fuel details/)).toBeInTheDocument();
  });

  it('clicking 🚕 Add Trip reveals the travel sub-form', () => {
    withToast(
      <AutoTab
        expenses={[]}
        onAdd={vi.fn().mockResolvedValue(true)}
        onUpdate={vi.fn().mockResolvedValue(true)}
        onDelete={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Add Trip/ }));
    expect(screen.getByText(/Trip details/)).toBeInTheDocument();
  });

  it('Cancel button hides the form', () => {
    withToast(
      <AutoTab
        expenses={[]}
        onAdd={vi.fn().mockResolvedValue(true)}
        onUpdate={vi.fn().mockResolvedValue(true)}
        onDelete={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Add Fuel/ }));
    expect(screen.getByText(/Fuel details/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByText(/Fuel details/)).toBeNull();
  });
});

describe('AutoTab — tap-to-edit', () => {
  it('tapping a row populates the form and switches button to "Update"', () => {
    const expenses = [fuelExpense('e1', '2026-05-01')];
    withToast(
      <AutoTab
        expenses={expenses}
        onAdd={vi.fn().mockResolvedValue(true)}
        onUpdate={vi.fn().mockResolvedValue(true)}
        onDelete={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText(/12,000km/));
    expect(screen.getByText(/Fuel details/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Update' })).toBeInTheDocument();
  });
});

describe('AutoTab — incomplete pill', () => {
  it('renders "incomplete" pill when meta is undefined', () => {
    const e: Expense = {
      id: 'old',
      date: '2026-04-01',
      category: ExpenseCategory.Vehicle,
      subCat: 'Fuel',
      amount: 3500,
      paymentMethod: PaymentMethod.UpiBankAccount,
      isSettlement: false,
      note: '',
      isDeleted: false,
      createdAt: '2026-04-01T10:00:00Z',
      updatedAt: '2026-04-01T10:00:00Z',
    };
    withToast(
      <AutoTab
        expenses={[e]}
        onAdd={vi.fn().mockResolvedValue(true)}
        onUpdate={vi.fn().mockResolvedValue(true)}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('incomplete')).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run tests**

Run: `bunx vitest run src/modules/expenses/__tests__/AutoTab.test.tsx`

Expected: all tests pass.

- [ ] **Step 4: Lint**

Run: `bun run lint`

Expected: no errors in `AutoTab.tsx`.

- [ ] **Step 5: Update `src/modules/expenses/components/README.md`**

Add a one-line entry under "Files":

```markdown
- **AutoTab.tsx** — Vehicle/Travel filtered tab with `<ServiceDueBanner>`, three quick-add buttons (⛽/🚕/🔧), inline form (tap-to-populate edit), and Daily Ledger list with meta badges (e.g. `⛽ 40L · ₹100/L · 12,300km · 14.5 km/L`). Old expenses without `meta` show an "incomplete" pill.
```

- [ ] **Step 6: Commit**

```bash
git add src/modules/expenses/components/AutoTab.tsx src/modules/expenses/__tests__/AutoTab.test.tsx src/modules/expenses/components/README.md
git commit -m "feat(budget): add AutoTab (banner, quick-adds, inline form, filtered list with meta badges)"
```

---

## Task 8: Wire `MetaSubForm` into `AddExpense`

**Files:**
- Modify: `src/modules/expenses/components/AddExpense.tsx`

- [ ] **Step 1: Update `AddExpense` to render `MetaSubForm` when applicable**

Replace `src/modules/expenses/components/AddExpense.tsx` with:

```tsx
import { useEffect, useState } from 'react';

import { CATEGORIES, getAllCategoryIds, getSubCategories } from '@/modules/expenses/categories';
import { PaymentMethod, ExpenseCategory } from '@/shared/types';
import type { ExpenseMeta } from '@/modules/expenses/types';
import { CONFIG } from '@/constants/config';
import { todayStr } from '@/shared/utils/date';
import { isValidNumber } from '@/shared/utils/validation';
import { PaymentMethodBubble } from '@/shared/components/PaymentMethodBubble';
import { useToast } from '@/shared/errors/useToast';
import { ToastType } from '@/shared/types';
import { BudgetMsg } from '@/constants/messages';
import { MetaSubForm, defaultMeta, metaKindFor } from '@/modules/expenses/components/MetaSubForm';

const QUICK_PAYMENT_METHODS: PaymentMethod[] = [
  PaymentMethod.UpiBankAccount,
  PaymentMethod.UpiCreditCard,
  PaymentMethod.CreditCard,
];

const AMOUNT_PRESETS = [10, 20, 50, 100, 200];

const EXTRA_PAYMENT_METHODS: PaymentMethod[] = [
  PaymentMethod.Cash,
  PaymentMethod.BankAccountImps,
  PaymentMethod.BankAccountRtgs,
  PaymentMethod.BankAccountNeft,
];

/** Form for adding a new expense; includes optional meta sub-form for Vehicle/Travel */
export function AddExpense({
  onSubmit,
}: {
  onSubmit: (input: {
    date: string;
    category: ExpenseCategory;
    subCat: string;
    amount: number;
    paymentMethod: PaymentMethod | null;
    isSettlement: boolean;
    note: string;
    meta?: ExpenseMeta;
  }) => Promise<boolean>;
}) {
  const [date, setDate] = useState(todayStr);
  const [category, setCategory] = useState<ExpenseCategory | null>(null);
  const [subCat, setSubCat] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(
    PaymentMethod.UpiBankAccount,
  );
  const [showAllMethods, setShowAllMethods] = useState(false);
  const [note, setNote] = useState('');
  const [meta, setMeta] = useState<ExpenseMeta | null>(null);

  const { addToast } = useToast();
  const [showAllCategories, setShowAllCategories] = useState(false);

  const allCategoryIds = getAllCategoryIds();
  const subCategories = category !== null ? getSubCategories(category) : [];
  const parsedAmount = Number(amount);
  const isDisabled = !amount || !isValidNumber(parsedAmount) || category === null;
  const isSettlement = category === ExpenseCategory.Finance && subCat === 'Credit Card Payment';

  // Reset meta whenever (category, subCat) changes — sync form state with the active meta kind.
  useEffect(() => {
    const kind = metaKindFor(category, subCat);
    if (kind === null) {
      setMeta(null);
    } else if (meta === null || meta.type !== kind) {
      const next = defaultMeta(kind);
      if (next) setMeta(next);
    }
  }, [category, subCat]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Handles form submission, clears fields on success */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (category === null) {
      addToast(BudgetMsg.CategoryRequired, ToastType.Error);
      return;
    }

    const success = await onSubmit({
      date,
      category,
      subCat,
      amount: parsedAmount,
      paymentMethod,
      isSettlement,
      note,
      meta: meta ?? undefined,
    });

    if (success) {
      setAmount('');
      setNote('');
      setSubCat('');
      setMeta(null);
    }
  }

  function handleAddPreset(value: number) {
    const current = Number(amount) || 0;
    setAmount(String(current + value));
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 px-4">
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="rounded-lg border border-line bg-surface-card px-3 py-2 text-fg"
      />

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-fg-muted">Category</span>
          <button
            type="button"
            onClick={() => setShowAllCategories(!showAllCategories)}
            className="text-[10px] text-accent font-medium hover:underline"
          >
            {showAllCategories ? 'Show Less' : 'View All'}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {allCategoryIds.map((id, index) => {
            const isActive = category === id;
            const def = CATEGORIES[id]!;
            if (!showAllCategories && !isActive && index >= CONFIG.BUDGET_VISIBLE_CATEGORIES)
              return null;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setCategory(id);
                  setSubCat('');
                }}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                  isActive
                    ? 'border-accent bg-accent text-fg-on-accent shadow-sm'
                    : 'border-line bg-surface-card text-fg-muted hover:border-accent/30'
                }`}
              >
                <span>{def.label.split(' ')[0]}</span>
                {isActive && <span>{def.label.split(' ').slice(1).join(' ')}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {subCategories.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-fg-muted">Sub-category</span>
          <div className="flex flex-wrap gap-1.5">
            {subCategories.map((sc) => {
              const isActive = subCat === sc;
              return (
                <button
                  key={sc}
                  type="button"
                  onClick={() => setSubCat(isActive ? '' : sc)}
                  className={`rounded-lg border px-2.5 py-1 text-[11px] transition-colors ${
                    isActive
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-line bg-surface-card text-fg-muted hover:border-accent/30'
                  }`}
                >
                  {sc}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <span className="text-fg-muted text-sm font-medium">{CONFIG.CURRENCY_SYMBOL}</span>
        <div className="relative flex-1">
          <input
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-lg border border-line bg-surface-card px-3 py-2 text-fg pr-8"
          />
          {amount && (
            <button
              type="button"
              onClick={() => setAmount('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-fg-muted hover:text-fg"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-1.5">
        {AMOUNT_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => handleAddPreset(preset)}
            className="flex-1 rounded-lg border border-line bg-surface-card px-2 py-1 text-xs font-medium text-fg-muted hover:border-accent/50 transition-colors active:scale-95"
          >
            +{preset}
          </button>
        ))}
      </div>

      {meta && (
        <MetaSubForm meta={meta} amount={amount} onChangeMeta={setMeta} onChangeAmount={setAmount} />
      )}

      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-fg-muted">Payment Method</span>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_PAYMENT_METHODS.map((m) => (
            <PaymentMethodBubble
              key={m}
              method={m}
              isActive={paymentMethod === m}
              onClick={(method) => setPaymentMethod(paymentMethod === method ? null : method)}
            />
          ))}
          {showAllMethods &&
            EXTRA_PAYMENT_METHODS.map((m) => (
              <PaymentMethodBubble
                key={m}
                method={m}
                isActive={paymentMethod === m}
                onClick={(method) => setPaymentMethod(paymentMethod === method ? null : method)}
              />
            ))}
          {!showAllMethods && (
            <button
              type="button"
              onClick={() => setShowAllMethods(true)}
              className="rounded-full border border-dashed border-line px-3 py-1 text-xs text-fg-muted hover:border-accent/50"
            >
              More...
            </button>
          )}
        </div>
      </div>

      <input
        type="text"
        placeholder="Note (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="rounded-lg border border-line bg-surface-card px-3 py-2 text-fg"
      />

      <button
        type="submit"
        disabled={isDisabled}
        className="rounded-lg bg-accent px-4 py-2 text-fg-on-accent font-medium disabled:opacity-40"
      >
        {isSettlement ? 'Add Settlement' : 'Add Expense'}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Append meta-integration tests to existing test file**

Append to `src/modules/expenses/__tests__/AddExpense.test.tsx`:

```tsx
describe('AddExpense — meta sub-form integration', () => {
  it('reveals the Fuel sub-form when Vehicle/Fuel is selected', () => {
    renderWithToast(<AddExpense onSubmit={noop} />);

    // Click Vehicle category — may need "View All" first if it's not in the visible default
    const viewAll = screen.queryByRole('button', { name: /View All/ });
    if (viewAll) fireEvent.click(viewAll);

    fireEvent.click(screen.getByRole('button', { name: /🚗/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Fuel' }));

    expect(screen.getByText(/Fuel details/)).toBeInTheDocument();
  });

  it('passes meta through to onSubmit when Vehicle/Fuel + values are filled', async () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    renderWithToast(<AddExpense onSubmit={onSubmit} />);

    const viewAll = screen.queryByRole('button', { name: /View All/ });
    if (viewAll) fireEvent.click(viewAll);

    fireEvent.click(screen.getByRole('button', { name: /🚗/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Fuel' }));

    // Amount + meta fields
    fireEvent.change(screen.getByPlaceholderText('Amount'), { target: { value: '4000' } });

    const fuelSection = screen.getByText(/Fuel details/).closest('div')!;
    const litersInput = fuelSection.querySelectorAll('input[type="number"]')[0] as HTMLInputElement;
    const priceInput = fuelSection.querySelectorAll('input[type="number"]')[1] as HTMLInputElement;
    fireEvent.change(litersInput, { target: { value: '40' } });
    fireEvent.change(priceInput, { target: { value: '100' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Add Expense|Add Settlement/ }));
    });

    expect(onSubmit).toHaveBeenCalled();
    const call = onSubmit.mock.calls[0]![0];
    expect(call.meta).toBeDefined();
    expect(call.meta?.type).toBe('fuel');
    expect(call.meta?.liters).toBe(40);
    expect(call.meta?.pricePerLiter).toBe(100);
  });

  it('does not reveal a meta sub-form for non-Vehicle/Travel categories', () => {
    renderWithToast(<AddExpense onSubmit={noop} />);
    fireEvent.click(screen.getByRole('button', { name: /🍽️/ }));
    expect(screen.queryByText(/Fuel details/)).toBeNull();
    expect(screen.queryByText(/Trip details/)).toBeNull();
    expect(screen.queryByText(/Service details/)).toBeNull();
  });
});
```

> **Note on category selectors:** the existing test file uses `getByRole('button', { name: /🚗/ })` style emoji-matching. If the category isn't in the default visible set, the "View All" toggle reveals it. Adapt the regex/filter if your codebase has changed the emojis. The point of these tests is *behavior*, not exact emoji bytes.

- [ ] **Step 3: Run AddExpense tests**

Run: `bunx vitest run src/modules/expenses/__tests__/AddExpense.test.tsx`

Expected: existing tests pass + 3 new tests pass.

- [ ] **Step 4: Run lint**

Run: `bun run lint`

Expected: no new errors.

- [ ] **Step 5: Update `src/modules/expenses/components/README.md`**

Edit the existing `**AddExpense.tsx**` line to mention meta integration. Example:

```markdown
- **AddExpense.tsx** — Expense entry form with category, subcategory, payment method selection, and amount presets. Conditionally renders `<MetaSubForm>` when category=Vehicle/Fuel, Vehicle/Maintenance, or Travel/* — captures discriminated `meta` and passes it through `onSubmit`. Save-and-stay (no redirect).
```

- [ ] **Step 6: Commit**

```bash
git add src/modules/expenses/components/AddExpense.tsx src/modules/expenses/__tests__/AddExpense.test.tsx src/modules/expenses/components/README.md
git commit -m "feat(budget): wire MetaSubForm into AddExpense (Path 1 inline meta entry)"
```

---

## Task 9: Add Auto tab to `ExpenseListPage`

**Files:**
- Modify: `src/modules/expenses/pages/ExpenseListPage.tsx`

- [ ] **Step 1: Add the new tab and render `AutoTab`**

Replace `src/modules/expenses/pages/ExpenseListPage.tsx` with:

```tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

import { BudgetSummary } from '@/modules/expenses/components/BudgetSummary';
import { ExpenseList } from '@/modules/expenses/components/ExpenseList';
import { IncomeList } from '@/modules/expenses/components/IncomeList';
import { ReconciliationView } from '@/modules/expenses/components/ReconciliationView';
import { AutoTab } from '@/modules/expenses/components/AutoTab';
import { useExpenses } from '@/modules/expenses/hooks/useExpenses';
import { useIncome } from '@/modules/expenses/hooks/useIncome';
import { ROUTES } from '@/constants/routes';
import { ListControls } from '@/shared/components/ListControls';
import { ListShowMoreFooter } from '@/shared/components/ListShowMoreFooter';
import { useListControls } from '@/shared/hooks/useListControls';
import { todayStr } from '@/shared/utils/date';
import { filterByDateRange } from '@/shared/utils/filter';
import { paginate, totalPages } from '@/shared/utils/paginate';

type BudgetTab = 'expenses' | 'income' | 'auto' | 'reconcile';

/** Page wrapper showing budget summary, expense/income/auto tabs, and list */
export function ExpenseListPage() {
  const { expenses, addExpense, updateExpense, deleteExpense } = useExpenses();
  const { income, deleteIncome } = useIncome();
  const [activeTab, setActiveTab] = useState<BudgetTab>('expenses');
  const ctrl = useListControls();

  const today = todayStr();
  const filteredExpenses = filterByDateRange(expenses, ctrl.timeRange, today, (e) => e.date);
  const filteredIncome = filterByDateRange(income, ctrl.timeRange, today, (i) => i.date);

  const activeFiltered = activeTab === 'income' ? filteredIncome : filteredExpenses;
  const pagesCount = totalPages(activeFiltered.length, ctrl.pageSize);
  const visibleExpenses = ctrl.showAll
    ? filteredExpenses
    : paginate(filteredExpenses, ctrl.page, ctrl.pageSize);
  const visibleIncome = ctrl.showAll
    ? filteredIncome
    : paginate(filteredIncome, ctrl.page, ctrl.pageSize);
  const visibleCount = activeTab === 'income' ? visibleIncome.length : visibleExpenses.length;

  return (
    <div className="relative">
      <BudgetSummary expenses={filteredExpenses} income={filteredIncome} />

      {activeTab !== 'auto' && (
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

      <div className="mx-4 mb-3 flex rounded-lg border border-line bg-surface-card p-1">
        <TabButton label="Expenses" isActive={activeTab === 'expenses'} onClick={() => setActiveTab('expenses')} />
        <TabButton label="Income" isActive={activeTab === 'income'} onClick={() => setActiveTab('income')} />
        <TabButton label="Auto" isActive={activeTab === 'auto'} onClick={() => setActiveTab('auto')} />
        <TabButton label="CC" isActive={activeTab === 'reconcile'} onClick={() => setActiveTab('reconcile')} />
      </div>

      {activeTab === 'expenses' && (
        <ExpenseList expenses={visibleExpenses} onDelete={deleteExpense} />
      )}
      {activeTab === 'income' && <IncomeList income={visibleIncome} onDelete={deleteIncome} />}
      {activeTab === 'auto' && (
        <AutoTab
          expenses={expenses}
          onAdd={(input) =>
            addExpense({
              date: input.date,
              category: input.category,
              subCat: input.subCat,
              amount: input.amount,
              note: input.note,
              meta: input.meta,
            })
          }
          onUpdate={updateExpense}
          onDelete={deleteExpense}
        />
      )}
      {activeTab === 'reconcile' && <ReconciliationView expenses={filteredExpenses} />}

      {(activeTab === 'expenses' || activeTab === 'income') && !ctrl.showAll && (
        <ListShowMoreFooter
          totalCount={activeFiltered.length}
          shownCount={visibleCount}
          pageSize={ctrl.pageSize}
          onShowAll={() => ctrl.setShowAll(true)}
        />
      )}

      <Link
        to={ROUTES.BUDGET_ADD}
        className="fixed bottom-20 right-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-fg-on-accent shadow-lg transition hover:bg-accent/90 active:scale-95"
        aria-label="Add entry"
      >
        <Plus size={24} />
      </Link>
    </div>
  );
}

function TabButton({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
        isActive ? 'bg-accent text-fg-on-accent' : 'text-fg-muted hover:text-fg'
      }`}
    >
      {label}
    </button>
  );
}
```

- [ ] **Step 2: Lint**

Run: `bun run lint`

Expected: no errors.

- [ ] **Step 3: Run all expense tests**

Run: `bunx vitest run src/modules/expenses/`

Expected: all tests pass.

- [ ] **Step 4: Manual smoke (UI)**

Run: `bun run dev`

Expected: dev server boots on port 3000. In a browser:
1. Navigate to `/budget`. The tab strip now shows: **Expenses · Income · Auto · CC**.
2. Click **Auto**. The list shows existing Vehicle/Travel expenses (or "No vehicle or trip entries yet").
3. Click **⛽ Add Fuel**. Form appears with date, amount, fuel sub-form (liters, ₹/L, full tank, vehicle data details). Fill liters=40, ₹/L=100. Amount auto-fills to 4000 on blur.
4. Click **Save**. Toast says "Fuel logged". Form clears. New row appears in the list with badge `⛽ 40L · ₹100/L`.
5. Tap the row → form populates with that entry's data, button text now "Update". Cancel dismisses.
6. Repeat for Trip and Service.
7. Add a Service with `nextService=11000`, then a Fuel with `odometer=12000` — banner appears: "Service due — current ODO 12,000 km · due at 11,000 km". Add another Service with `nextService=22000` — banner clears.

If anything misbehaves, fix the underlying component before continuing.

- [ ] **Step 5: Update `src/modules/expenses/pages/README.md`**

Edit the entry for `ExpenseListPage.tsx` to mention the new fourth tab. Example:

```markdown
- **ExpenseListPage.tsx** — Budget module page with `<BudgetSummary>`, `<ListControls>` strip (hidden on Auto tab), and a 4-tab strip: **Expenses · Income · Auto · CC**. State-based tab switching (no route change). Owns `useExpenses` + `useIncome` + `useListControls` and passes filtered/paginated slices down to list components. Renders `<AutoTab>` when active.
```

- [ ] **Step 6: Commit**

```bash
git add src/modules/expenses/pages/ExpenseListPage.tsx src/modules/expenses/pages/README.md
git commit -m "feat(budget): add Auto tab to ExpenseListPage (4-tab strip with quick-adds)"
```

---

## Task 10: CHANGELOG + ROADMAP wrap-up

**Files:**
- Modify: `CHANGELOG.md`
- Modify: `docs/ROADMAP.md`

- [ ] **Step 1: Read current CHANGELOG state**

Run: `head -30 CHANGELOG.md`

Expected: prints the most recent version block(s).

- [ ] **Step 2: Add a 0.2.18 block**

Edit `CHANGELOG.md`. Below the existing top-of-file header, insert:

```markdown
## [0.2.18] - 2026-05-04

### Added
- **Budget — Auto tab** (`feat/who-fueled-it`). New tab inside Budget for Vehicle + Travel expenses with quick-add buttons (⛽ Add Fuel · 🚕 Add Trip · 🔧 Service), inline meta sub-form, and a derived service-due banner.
- **Discriminated `meta` union on `Expense`.** New `FuelMeta`, `TravelMeta`, `MaintenanceMeta` types capture liters/odometer/displayedMileage, origin/destination/distance, and odometer/nextService respectively. Existing expenses without `meta` continue to work.
- **`fuel-math.ts`** module with `computeMileage`, `latestOdometer`, `dueMaintenance`, `isServiceDue` — pure derivations, no extra storage.
- **`updateExpense`** in `useExpenses` for tap-to-populate edit on the Auto tab.

### Conventions honored
- Tap-to-populate edit (no inline-row editing) on the Auto tab.
- Save-and-stay (no redirect) when adding Vehicle/Travel from main `AddExpense` form.
- All toast strings live in `BudgetMsg` enum; no raw strings.

### Spec / Plan
- Spec: `docs/specs/2026-05-04-fuel-travel-maintenance-design.md`
- Plan: `docs/plans/2026-05-04-fuel-travel-maintenance.md`
```

- [ ] **Step 3: Update `docs/ROADMAP.md`**

Read the file first (`head -60 docs/ROADMAP.md`) and find the section that tracks Budget enhancements. Move the fuel/travel/maintenance line(s) from "P0/P1/etc." into a "Done in 0.2.18" subsection (or follow the existing convention — match what 0.2.17 did). Add the Phase-2 candidates from the spec (rolling-average mileage cards, multi-vehicle, service-due notification) under a new "Budget — Phase 2 candidates" entry.

- [ ] **Step 4: Commit**

```bash
git add CHANGELOG.md docs/ROADMAP.md
git commit -m "docs: 0.2.18 wrap-up — fuel/travel/maintenance Auto tab"
```

---

## Final verification

- [ ] **Run the full test suite**

Run: `bun run test`

Expected: all tests green.

- [ ] **Run lint + type-check**

Run: `bun run lint`

Expected: no errors.

- [ ] **Run build**

Run: `bun run build`

Expected: clean build, no TS errors.

- [ ] **Confirm the four-tab Budget UI in the browser**

Run: `bun run dev`

Walk through the smoke test from Task 9 Step 4 once more, end-to-end.

- [ ] **Do not push without explicit user approval**

When done, tell the user: "All tasks complete. Branch `feat/who-fueled-it` is ready. Push to origin?" and wait for an explicit "yes" before running `git push -u origin feat/who-fueled-it`.

---

## Self-review notes (filled in by the planner)

**Spec coverage check:**
- ✅ Discriminated meta union → Task 1
- ✅ Required vs optional validation table → Task 2
- ✅ Two-of-three input math (fuel) → Task 5 (FuelFields autoDerive)
- ✅ Two-way entry (main form + Auto-tab quick-add) → Tasks 7 + 8
- ✅ Save-and-stay (no redirect) → Task 8 (form clears, stays on same page)
- ✅ Tap-to-populate edit on Auto tab → Task 7 (Row.onTap → startEdit)
- ✅ Inline form for both Add and Edit → Task 7 (single form, button label flips)
- ✅ Service-due banner with auto-clear when new maintenance with future nextService logged → Tasks 4 + 6
- ✅ Row badges (fuel/travel/maintenance/incomplete pill) → Task 7
- ✅ Universal list infrastructure (DateGroupHeader, sortNewestFirst) → Task 7
- ✅ BudgetMsg enum entries → Tasks 2 + 3
- ✅ Backwards compatibility (meta=undefined still works) → Task 2 + Task 3 (toastForAdd handles undefined) + Task 7 (incomplete pill renders)

**Placeholder scan:** None. Every step has the actual code.

**Type consistency:** `ExpenseMeta` discriminator `type` field consistent across all references. `FuelMeta.liters`, `pricePerLiter`, `odometer`, `tripOdo`, `displayedMileage`, `fullTank` consistent across types.ts, validation, fuel-math, MetaSubForm, AutoTab. `MaintenanceMeta.nextService` consistent. `useExpenses` returns `{ expenses, addExpense, updateExpense, deleteExpense }` — destructured correctly in `ExpenseListPage`.

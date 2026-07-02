# Family Umbrella — Pillar 2: Expense Shared Ledger View (Plan 2 of 4)

**Date:** 2026-07-02
**Spec:** `docs/specs/2026-07-02-family-umbrella-design.md` § 4
**Branch:** `feat/the-original-script`
**Depends on:** Plan 1 (family data model — `useFamily`, `familyId`)

## Context

Read-only "Family" tab on the Budget module aggregating every family
member's expenses (spec D2: "view all family expenses — not much of a
split requirement"). No split/settle, no `paidBy` field — the expense
owner IS the payer. Attribution shown as a member chip per row.
Precedent: `KidsFinanceTab` (conditional read-only aggregate tab).

## Invariants (CLAUDE.md — non-negotiable)

- **Firebase import boundary**: cross-member reads = one
  `createAdapter(userPath(memberUid))` per member uid from
  `useFamily(familyId).memberUids` — no `collectionGroup`, no raw
  Firestore outside `src/shared/storage/`.
- **`Expense` type unchanged** — no new fields; numeric enums
  (`PaymentMethod`, `ExpenseCategory`) untouched (append-only if ever).
- **Decision A1**: `computeFamilyTotals` is a pure util; the view exposes
  **no write callbacks at all** (stronger than `readOnly` no-op).
- Always pass `onError` to `onSnapshot` in the fan-out hook.

## File Structure

```
src/modules/expenses/useFamilyExpenses.ts        # N-member listener fan-out  (NEW)
src/modules/expenses/__tests__/useFamilyExpenses.test.ts
src/modules/expenses/budget-math.ts              # + computeFamilyTotals      (EDIT)
src/modules/expenses/__tests__/budget-math.test.ts
src/modules/expenses/FamilyLedgerTab.tsx         # read-only aggregate list   (NEW)
src/modules/expenses/__tests__/FamilyLedgerTab.test.tsx
src/modules/expenses/ExpenseListPage.tsx         # 5th tab wiring             (EDIT, coordinator)
src/shared/constants/messages.ts                 # BudgetMsg additions        (COORDINATOR)
```

## Tasks (TDD — test first per task)

1. **`computeFamilyTotals`** (pure, `budget-math.ts`) — input: array of
   `{ uid, name, expenses }`; output: per-member totals + family total,
   honoring the active `timeRange` (reuse `filterByDateRange` from
   `utils/filter.ts`). `compute*` naming. Tests: empty family, single
   member, range filtering, mixed categories.
2. **`useFamilyExpenses(familyId)`** — resolves `memberUids` via
   `useFamily`, spins one expenses listener per member (per-member
   `ready` tracked; aggregate `ready` only when all report — mirror
   `useBabyCollection`'s pattern). Returns `{ rows, membersReady }` where
   each row is `{ expense, ownerUid, ownerName }`. **No mutators.**
   Refs for async state per the stale-closure convention.
3. **`FamilyLedgerTab`** — Daily Ledger pattern: `useListControls()`,
   `<ListControls>` strip, `<DateGroupHeader>` sticky headers,
   `sortNewestFirst()`, `<ListShowMoreFooter>`. Member attribution chip
   per row (color-stable per uid). Summary header from
   `computeFamilyTotals` sharing the hoisted `timeRange` (same hoist
   pattern `ExpenseListPage` already uses for `BudgetSummary`). **No
   swipe-to-delete, no `×`, no tap-to-populate** — read-only by
   construction.
4. **Wiring (coordinator)** — fifth state-based tab in `ExpenseListPage`
   (Expenses | Income | CC | Auto | **Family**), rendered only when
   `profile.familyId != null`. No new route.
5. **Tests + E2E** — vitest for hook/math/component; one E2E happy path
   (family user sees other member's expense; non-family user sees no tab).
   E2E button disambiguation: `page.locator('main button', { hasText:
   'Family' }).first()`; never `isVisible()` for waiting — use
   `expect(locator).toBeVisible({ timeout })`.
6. **Docs** — CHANGELOG entry (coordinator).

## Agent Warnings (recurring plan-doc bugs — read before implementing)

1. **No `JSX.Element` return type** — React 19; bare function returns.
2. **Data hooks return `Promise<boolean>`** and own their toasts
   (Decision A1) — don't `await` a `Result` from them. (This view has no
   writes; the warning applies to any incidental hook reuse.)
3. **`update(entry)`** takes the whole entry incl. `id` (optional
   `{ silent: true }`) — not `update(id, data)`.
4. **No hardcoded toast strings** — `constants/messages.ts` enums only.
5. **Match sibling-component Tailwind** — copy `KidsFinanceTab` /
   `AutoTab` idioms, not plain HTML.
6. **Per-child config lives in `AddChild.tsx`**, not admin `UsersTab`
   (relevant if touching Kids tab adjacency).
7. **Log component API is `{ childId, siblingIds, uid }`**, not
   `{ child: Child }`.

**Parallel-dispatch note:** agents must NOT edit `ExpenseListPage.tsx`,
`constants/messages.ts`, `shared/types.ts`, `CHANGELOG.md`, `ROADMAP.md` —
list required additions for the coordinator pass. Numeric-enum
`Object.values()` needs the `typeof v === 'number'` filter. Reserved
trial-ending branch names are off-limits.

## Self-Review

- [ ] `bun run lint` + `bun run test` green
- [ ] Tab absent for `familyId: null` users; zero regression on the four
      existing tabs
- [ ] No mutator reachable from the Family tab (grep for `addExpense` etc.)
- [ ] No `firebase/*` import outside `src/shared/storage|auth`

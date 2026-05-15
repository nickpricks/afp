# Flaw in the Plan — Cleanup Design

**Branch:** `feat/the-flaw-in-the-plan`
**Date:** 2026-05-15
**Source:** `.final-countdown-reports/report.html` (review of `HEAD~5..HEAD`, PRs #15–#19)
**Findings count:** 44 from the 6-agent review + 1 from Nick (JSDoc coverage gap)

## Context

The Final Countdown review of the last 5 PR merges (Phase 2h universal list infrastructure → Phase 2j Auto tab + fuel/maintenance feature) surfaced 44 findings across 6 reviewer perspectives. Convergence was strong: 4 agents independently flagged the same wrong-toast bug in `AutoTab`; 3 agents flagged different angles on `ServiceDueBanner`. Code quality is high overall, but a cleanup pass is warranted before the next feature wave.

In parallel, Nick observed that many functions across the codebase ship without JSDoc — the current CLAUDE.md rule ("One-line `/** */` on every exported function") is enforced inconsistently. He has chosen to escalate JSDoc coverage from a soft convention to a first-class deliverable: total coverage of every function, enum, type, and component, including internal helpers, with a one-line minimum but allowing terse "nutcracker-tight" style.

## Goals

1. Resolve all 3 CRITICAL and 13 HIGH findings from the review.
2. Resolve all 14 MEDIUM and 14 LOW findings, bundled into 3 natural refactors where they cluster.
3. Achieve repo-wide JSDoc coverage: every function, arrow, enum, type alias, interface, and React component carries a JSDoc comment (one line minimum).
4. Run the full doc sweep cycle (per `project_doc_sweep.md`): per-dir READMEs, CLAUDE.md known-issues update, ROADMAP, CHANGELOG, this spec's execution log.
5. Verify completion by re-running `/the-final-countdown` over the branch's full commit range. Exit gate: zero CRITICAL, zero HIGH findings.

## Non-goals

- No new features. This branch is cleanup only.
- No theme or visual changes.
- No baby-list refactor (CLAUDE.md flags it as worth investigating — explicitly deferred to a follow-up branch).
- No multi-baby manual testing (CLAUDE.md known issue — deferred).
- No Sentry / production logging wiring (finding #34 — deferred).
- No firestore.rules expansion beyond the `validMeta` helper (finding #27).

## Architecture — 5 sequential waves on one branch

```
Wave 1 · CRITICAL + HIGH                (16 findings)
        ↓
Wave 2 · MEDIUM + LOW + 3 refactors     (28 findings + 3 natural refactors)
        ↓
Wave 3 · JSDoc total coverage           (Nick's point — ~1500+ symbols)
        ↓
Wave 4 · Docs sweep                     (READMEs · CLAUDE.md · ROADMAP · CHANGELOG · this spec)
        ↓
Wave 5 · Re-run /the-final-countdown    (exit gate: 0 CRITICAL + 0 HIGH)
```

Branch `feat/the-flaw-in-the-plan` is created off `master`. Each wave produces WIP commits during development. At the end, the entire branch is squashed to one PR per Nick's `feedback_squash_commits.md` preference.

### Per-wave execution model

- **Wave 1 + 2:** Coordinator (the assistant) implements solo with TDD. Bugs have design decisions inside them; no subagent parallelism here.
- **Wave 3:** Subagent fleet by directory (`src/modules/baby/`, `src/modules/body/`, `src/modules/expenses/`, `src/shared/`, `src/admin/` + `src/auth/` + `src/contexts/`). Coordinator owns shared roots: `types.ts`, `constants/*`, `App.tsx`. Per CLAUDE.md gotchas — subagent prompts must list the HEAD hash, what's already in place, and the no-touch file list.
- **Wave 4:** Coordinator solo (docs are coupling-heavy).
- **Wave 5:** Coordinator dispatches `/the-final-countdown` over the branch.

## Wave 1 · CRITICAL + HIGH scope (16 items)

| ID | Item | File(s) | Notes |
|----|------|---------|-------|
| C1 | Wrong toast on AutoTab amount validation | `AutoTab.tsx:87` | Use `ValidationMsg.AmountPositive`. Add vitest case. |
| C2 | Literal em-dash JSX escape | `ExpenseList.tsx:105` | Replace `—` literal with `{'—'}` or raw `—`. |
| C3 | `Number('')`/`'abc'` silent coercion | `MetaSubForm.tsx` + `validation.ts` | Use `isValidNumber()` from `@/shared/utils/validation` in `validateMeta`. Reject `NaN` explicitly. |
| H4 | Exhaustiveness on `ExpenseMeta` union | `MetaSubForm`, `AutoTab`, `useExpenses`, `fuel-math` | Apply Decision E (shared `assertNever` helper). |
| H5 | `ExpenseMetaType` enum | `types.ts` + ~25 sites | Members `Fuel = 'fuel'`, `Travel = 'travel'`, `Maintenance = 'maintenance'`. String-valued for serialization compatibility. |
| H6 | `VEHICLE_SUBCAT` typed constants | `categories.ts` + 7 callers | `const VEHICLE_SUBCAT = { Fuel: 'Fuel', Maintenance: 'Maintenance', Cab: 'Cab/Auto', ... } as const`. |
| H7 | `relativeDateLabel` TZ fix | `relative-date.ts:21-25, 10-17` | Apply Decision B (`'T12:00:00'` suffix). Fix both `relativeDateLabel` and `isoWeekNumber`. |
| H8 | `useBabyCollection.{log,update,remove}` → `Promise<boolean>` | hook + 7 baby log components | Match `useExpenses` gold-standard contract. Gate state cleanup on the boolean. |
| H9 | `logToSiblings` partial-failure surface | `logToSiblings.ts` + callers | Return `{ ok, failed }`. Error toast when `failed > 0`. |
| H10 | `useExpenses.{add,update,delete}Expense` adapter-null toasts | `useExpenses.ts:62, 113, 133` | New `BudgetMsg.AdapterNotReady` enum entry. |
| H11 | `ServiceDueBanner` defensive guards + memo | `ServiceDueBanner.tsx` | Remove non-null assertions. Call `dueMaintenance`/`latestOdometer` once each, wrap in `useMemo`. |
| H12 | `dueMaintenance` sort by odometer | `fuel-math.ts:27-30` | New semantic: highest-odometer maintenance entry with `nextService` set. |
| H13 | Fuel `autoDerive` stale-state fix + extract | `MetaSubForm.tsx` → `fuel-math.ts` | New pure `deriveFuelTriple({ liters, price, amount, lastEdited })` in `fuel-math.ts`. 6 vitest cases. Component dispatches only. |
| H14 | Auto tab `paymentMethod` capture | `AutoTab.tsx:107-114` | Mini `<PaymentMethodBubble>` row (or fold into `<ExpenseFormShell>` extraction in Wave 2). |
| H15 | CHANGELOG fuel-math signatures correction | `CHANGELOG.md:12` | Replace incorrect signatures with actual ones. |
| H16 | `prev*Ref` dead code + comment | `AddExpense.tsx:59-82` | Delete refs + comment (they're written never read). |

## Wave 2 · MEDIUM + LOW + refactors (28 + 3)

### Three natural refactors that absorb multiple findings

1. **`<ExpenseFormShell>` extraction** — Shared by `AddExpense` and `AutoTab`. Owns date / amount / payment / note / meta state via a `useExpenseForm` hook. Folds findings #14, #18, #21.
2. **`AutoTab.tsx` split** — `AutoTabRow.tsx` (presentation + tap handler), `expense-badges.ts` (pure badge string generation). Move `subCatFor` into `meta-utils.ts` alongside `metaKindFor`. Folds #17.
3. **`deriveFuelTriple` already lives in `fuel-math.ts` from Wave 1 H13** — finish by adding `Number.isFinite` divide-by-zero guards. Folds #20, #32.

### Standalone Medium / Low items

| ID | Item |
|----|------|
| #19 | Inline helper text for invalid amount input in `AddExpense` |
| #22 | `useMemo` for `ServiceDueBanner` (already done in H11) |
| #23 | Stable subcat keying (covered by H6) |
| #24 | `ServiceDueBanner` dismiss: Decision D (domain-event-tied — clears on new maintenance log) |
| #25 | `useListControls` per-tab isolation in `ExpenseListPage` |
| #26 | `AutoTab` 500-expense render test + call-site comment about pagination deviation |
| #27 | `firestore.rules` `validMeta()` helper |
| #28 | `src/modules/baby/hooks/README.md` 4→5 subcollections |
| #29 | Test comment rephrase `AddExpense.test.tsx:135` |
| #30 | `AmbientEffects.tsx:126` jitter comment fix |
| #31 | (absorbed by D — domain-event dismiss) |
| #33 | `<div onClick>` keyboard handler in `AutoTab` row + audit other list rows |
| #34 | `onError` console.error nit — leave as TODO comment, defer to Sentry milestone |
| #35 | `Number.isFinite` guard in `filterByDateRange` |
| #36 | `useExpenses` validates twice on update — fold the double call into one |
| #37 | `AutoTab` prop bag async signature consistency — all three `Promise<boolean>` |
| #38 | Move meta-utils tests to `__tests__/meta-utils.test.ts` |
| #39 | `isoWeekNumber` TZ fix (already done in H7) |
| #40 | Decision A: update CLAUDE.md to document "hooks return boolean; pure utils return `Result<T>`" |
| #41 | `CONFIG.LIST_PAGE_SIZE_OPTIONS` constant |
| #42 | `AmbientEffects` r4 comment |
| #43 | `useExpenses` JSDoc mention `updateExpense` |
| #44 | WHAT-only inline comment cleanup |

## Wave 3 · JSDoc total coverage (Nick's point)

**Scope:** Every function, arrow function, enum, type alias, interface, and React component across `src/`. Including internal helpers. Including test helpers (not individual `it(...)` bodies).

**Style:** One-line minimum, terse OK. Examples:
```ts
/** Validates an expense object end-to-end. */
export function validateExpense(e: Expense): Result<void> { ... }

/** Today's date as YYYY-MM-DD. */
const today = todayStr();

/** Active row when editing. */
type EditState = { id: string; kind: MetaKind };

/** Floors logged on a given date. */
interface FloorsEntry { dateKey: string; up: number; down: number; }
```

**Existing JSDocs:** Kept if accurate. Rewritten if rotten (Comment Analyzer's lens applied repo-wide as a side effect — addresses findings #28, #43, #44 broadly).

**Subagent dispatch (per CLAUDE.md parallel pattern):**

| Subagent | Directory | Shared files it must NOT touch |
|----------|-----------|--------------------------------|
| A | `src/modules/baby/` | — |
| B | `src/modules/body/` | — |
| C | `src/modules/expenses/` | — |
| D | `src/shared/` | `types.ts`, `constants/*`, `utils/*` (coordinator) |
| E | `src/admin/`, `src/auth/`, `src/contexts/` | — |

Coordinator owns: `src/shared/types.ts`, `src/constants/*.ts`, `src/shared/utils/*`, `App.tsx`, route files. Coordinator pre-commits any cross-cutting enum additions (e.g., `ExpenseMetaType` from Wave 1) before dispatching, so the JSDoc subagents work on a stable HEAD.

## Wave 4 · Docs sweep

Per `project_doc_sweep.md` memory:

1. **Per-dir READMEs**
   - Fix `src/modules/baby/hooks/README.md` (finding #28).
   - Audit other `**/README.md` files for staleness.
   - Add per-dir READMEs where they help (likely `src/modules/expenses/`, `src/modules/expenses/components/`).
2. **CLAUDE.md known-issues update**
   - Strike all items completed by this branch (most of "Known Issues" and "20-Point Audit Violations").
   - Add new gotchas surfaced during fixes.
3. **`docs/plans/2026-05-15-flaw-in-the-plan-execution.md`**
   - Branch execution log: shipped commits, items closed-with-rationale, moved-out items.
4. **ROADMAP.md** — bump version (proposed: `0.2.19` for the cleanup), mark this cleanup as Phase 2k or 2j.1.
5. **CHANGELOG.md** — full entry naming all 45 items + JSDoc coverage milestone.
6. **CLAUDE.md final revision** — new conventions earned:
   - `ExpenseMetaType` enum convention.
   - JSDoc-on-everything rule (replacing the exported-only rule).
   - `assertNever` helper pattern for discriminated unions.
   - `'T12:00:00'` suffix idiom for `YYYY-MM-DD` parsing.

## Wave 5 · Re-review + verification (exit gate)

Run `/the-final-countdown extensive review for last <N> commits` over the branch's full commit range (N depends on how many WIP commits exist pre-squash; for the final PR review N=1 since it's squashed).

### Baseline (2026-05-15, master @ `3820be4`)

All 4 checks green pre-cleanup. The branch must end at the same baseline or better.

| Check | Command | Baseline |
|---|---|---|
| Format | `bun run format:check` | ✅ all files match Prettier |
| Lint (typecheck + ESLint) | `bun run lint` | ✅ 0 errors |
| Unit tests | `bun run test` | ✅ 637 tests / 86 files |
| E2E tests | `bun run test:e2e` | ✅ 81 tests |

### Exit gate criteria (ALL must pass)

1. `bun run format:check` — clean.
2. `bun run lint` — 0 errors.
3. `bun run test` — all unit tests pass (≥637; new tests added during cleanup count).
4. `bun run test:e2e` — all E2E tests pass (≥81).
5. `/the-final-countdown` re-review — **0 CRITICAL + 0 HIGH** findings.

Any new findings from #5 → triage into one of: (a) address in-branch immediately, (b) defer with a one-line pointer to a new spec in `docs/specs/`, (c) close-with-rationale in this spec's "Moved out of scope" section.

If any of #1–#5 fails after one round of fixes, the branch is NOT shipped. Either another fix round or scope-revision happens. The squash-merge to `master` is blocked until all 5 pass.

### Inter-wave verification

Per design decision (2026-05-15): inter-wave verification is **light** — vitest run after each fix to catch regressions, but the full format + lint + e2e suite runs **only at end-of-branch** (Wave 5). Rationale: TDD discipline within each wave catches the bulk; full-suite e2e on every wave is wall-time-expensive for limited additional coverage.

## Design decisions (Nick's calls, locked-in)

- **A1** — Update CLAUDE.md to codify "hooks return boolean (own their toasts); pure utils return `Result<T>`." No hook migration.
- **B1** — TZ fix uses `'T12:00:00'` suffix on `YYYY-MM-DD` parse. Matches existing `formatDayDate` pattern.
- **C1** — Defer `META_REGISTRY` until the 4th meta variant. Add the `assertNever` exhaustiveness guard now so the 4th variant fails the compile until it's wired everywhere.
- **D1** — `ServiceDueBanner` dismiss is domain-event-tied. No `sessionStorage`, no profile field. The act of logging a new maintenance entry naturally clears `isServiceDue`. If user dismisses without logging maintenance, banner returns on next session — accepted UX.
- **E1** — Shared `assertNever(x: never): never` helper in `src/shared/utils/types.ts`. Used as `default: return assertNever(meta)` at every discriminated-union switch site.

## Risks

| Risk | Mitigation |
|------|------------|
| Wave 3 subagent merge conflicts on shared files | Coordinator pre-commits all shared-file changes (enums, helpers, `assertNever`) before dispatching. Subagents told explicitly NOT to touch shared roots. |
| JSDoc on internal helpers feels overkill / churn-heavy | One-line minimum, nutcracker-tight style; no params/returns required. If a private helper truly needs no docstring (e.g., 1-line trivial setter), subagents are allowed to skip with a `/* no doc — trivial */` marker for traceability. |
| Wave 1 + 2 bug fixes introduce regressions | TDD per fix. Each finding's fix gets a failing test first, then the fix. Vitest run after every commit. |
| `ExpenseFormShell` extraction risk (Wave 2 refactor) | Done last in Wave 2, after all isolated MEDs/LOWs are landed. Full vitest + manual smoke before next wave. |
| Exit gate (Wave 5) finds new CRITICAL/HIGH | Acceptable — that's what the gate is for. Triage rules above. |
| Scope creep during JSDoc sweep ("while I'm in here…") | Subagents told explicitly: JSDoc only. Any code change requires a finding ID or a documented exception in the WIP commit. |

## Success criteria

- All 44 review findings + Nick's JSDoc point either closed or explicitly moved-out-of-scope with a pointer.
- Every function/enum/type/component in `src/` has a JSDoc comment.
- Doc sweep complete: READMEs accurate, CLAUDE.md known-issues current, ROADMAP + CHANGELOG entries written.
- `/the-final-countdown` re-review passes the exit gate (0 CRITICAL + 0 HIGH).
- Squash-merged to `master` as one PR.
- Memory updated: `feedback_jsdoc_total_coverage.md` if appropriate.

## Out of scope (deferred, with pointers)

- Baby-list refactor (extract shared `<BabyLogList<T>>`) — defer to its own spec.
- Sentry / centralized error logging — defer.
- Multi-baby flow manual testing — defer.
- Yoga tab implementation — defer (per CLAUDE.md Known Issues).
- Bike or public-transport meta variants — defer (would trigger Decision C re-evaluation).

## Open questions

None at spec-time. Ready for implementation-plan write-up via `writing-plans` skill.

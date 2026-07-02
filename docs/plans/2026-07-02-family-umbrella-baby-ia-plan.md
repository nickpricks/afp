# Family Umbrella — Pillar 3: Baby IA Redesign + Submodule Retirement (Plan 3 of 4)

**Date:** 2026-07-02
**Spec:** `docs/specs/2026-07-02-family-umbrella-design.md` § 5
**Branch:** `feat/the-original-script`
**Depends on:** Plan 1 only for cross-parent child writes (rules); nav +
archive work is independent and can ship first.

## Context

`ChildDetail`'s flat 10-tab top bar becomes a grouped nav (spec D4):
slide-in drawer on mobile, persistent left sidebar ≥ `md`. Groups:
**Overview** (Dashboard, Journal), **Logs** (Meals, Growth, Milestones,
Presents), **Archived** (Feeding, Sleep, Elimination — read-only,
collapsed). Retirement is **per-child** via `ChildConfig.archived`
(spec D5); **archive-in-place** — no data moves, Journal aggregation
untouched (D6). Needs merges into Presents as a section — subcollection
`needs/*` stays, UI-only (D5).

## Invariants (CLAUDE.md — non-negotiable)

- **No migration scripts.** `feeds/*`, `sleep/*`, `elimination/*`,
  `needs/*` stay exactly where they are. Elimination already carries the
  diapers→elimination migration — do not compound it.
- **Numeric enums append-only** (`FeedType`, `SleepType`, `DiaperType`
  etc. untouched).
- **Decision A1**: `useBabyCollection.{log,update,remove}` return
  `Promise<boolean>` and own their toasts.
- State-based section switching — **no new routes**.
- `ChildConfig.archived` is a NEW optional map
  (`{ feeds?, sleep?, elimination?: boolean }`) — absent means nothing
  archived; older children configs need no migration.

## File Structure

```
src/modules/baby/ChildNav.tsx                    # drawer/sidebar + groups    (NEW)
src/modules/baby/__tests__/ChildNav.test.tsx
src/modules/baby/ChildDetail.tsx                 # nav swap + section state   (COORDINATOR)
src/modules/baby/types.ts                        # ChildConfig.archived       (COORDINATOR)
src/modules/baby/AddChild.tsx                    # archived toggles per child (COORDINATOR)
src/modules/baby/FeedingLog.tsx / SleepLog.tsx / EliminationLog.tsx
                                                 # readOnly render path       (EDIT)
src/modules/baby/PresentsLog.tsx                 # + Needs section            (EDIT)
src/shared/constants/messages.ts                 # BabyMsg additions          (COORDINATOR)
```

Opportunistic (flagged, not required): extract shared `BabyLogList`
(CLAUDE.md backlog — 7 duplicated `RecentXxx` list renderers). The
read-only archived path is the natural forcing function; if scope allows,
do the extraction first and archived rendering falls out of it.

## Tasks (TDD — test first per task)

1. **Types (coordinator, pre-staged)** — `ChildConfig.archived?` map +
   JSDoc; `BabyMsg` additions for archived-state copy.
2. **`ChildNav`** — grouped nav component. Props: sections with
   `{ id, label, group, gated }`; active id + `onSelect` callback.
   Mobile: hamburger → slide-in drawer (CSS transform, no gesture lib —
   same posture as `SwipeToDelete`); ≥ `md`: persistent sidebar.
   Archived group collapsed by default, renders only when non-empty.
   `cond && ...` JSX (no ternaries), Tailwind matching sibling components.
3. **Archived read-only rendering** — Feeding/Sleep/Elimination render
   list-only (no form, no delete `×`, no swipe, no tap-to-populate) when
   archived for the active child. Show a quiet "Archived — read only"
   caption. Un-archive = flip config; forms return.
4. **Section visibility logic** — pure helper `computeChildSections(config,
   dataPresence)` returning the grouped nav model (Overview always; Logs
   gated by config; Archived = retired AND has data). Pure util → unit
   tests, `compute*` naming.
5. **Needs → Presents merge** — `PresentsLog` gains a third segment
   (Gifts | Finances | **Needs**) rendering existing Needs content
   (filter chips + lifecycle buttons preserved); Needs leaves the nav.
   `config.needs` gates the segment.
6. **`ChildDetail` wiring (coordinator)** — replace the tab bar with
   `ChildNav`, keep active-section state, pass `{ childId, siblingIds,
   uid }` down unchanged. `AddChild` gains archived toggles (per-child
   config lives HERE — warning 6).
7. **Tests + E2E** — vitest for `ChildNav` + `computeChildSections`;
   E2E: drawer open/select on mobile viewport, archived section is
   read-only, second-child isolation (younger sibling keeps Feeding
   active — multi-baby isolation is an untested known-issue; this adds
   the first coverage). E2E: never bare `isVisible()` for waits; use
   `expect(locator).toBeVisible({ timeout })`; disambiguate buttons via
   `page.locator('main button', { hasText: 'X' }).first()`.
8. **Docs** — CHANGELOG entry; CLAUDE.md baby-module bullet update
   (coordinator).

## Agent Warnings (recurring plan-doc bugs — read before implementing)

1. **No `JSX.Element` return type** — React 19; bare function returns.
2. **`useBabyCollection.log/update/remove` return `Promise<boolean>`**
   (Decision A1) and handle their own toasts — gate state cleanup on the
   boolean; never `await` a `Result` from them.
3. **`update(entry)`** takes the whole entry including `id`; optional
   `{ silent: true }` second arg suppresses the generic toast — NOT
   `update(id, data)`.
4. **No hardcoded toast strings** — `BabyMsg` enum in
   `constants/messages.ts`.
5. **Match sibling-component Tailwind** — copy `MealsLog`/`PresentsLog`
   idioms; no plain unstyled HTML.
6. **Per-child config (incl. new `archived` toggles) lives in
   `AddChild.tsx`** — NOT in admin `UsersTab`.
7. **Log component API is `{ childId, siblingIds, uid }`** — NOT
   `{ child: Child }`.

**Parallel-dispatch note:** `ChildDetail.tsx`, `AddChild.tsx`,
`modules/baby/constants.ts`, `constants/*.ts`, `shared/types.ts`,
`CHANGELOG.md`, `ROADMAP.md` are coordinator-owned — pre-stage shared
additions, hand agents the HEAD hash and the do-not-touch list; agents own
only their new component + test. Fast-forward merges, coordinator wires
`ChildDetail` in one pass (the proven Plans 5+6 pattern). Reserved
trial-ending branch names are off-limits.

## Self-Review

- [ ] `bun run lint` + `bun run test` green
- [ ] Zero writes to `feeds/*`/`sleep/*`/`elimination/*`/`needs/*` paths —
      diff shows UI-only changes
- [ ] Journal aggregates unchanged (existing `useJournalData` tests pass)
- [ ] Child with `archived` absent behaves exactly as today
- [ ] Multi-child: sibling with active Feeding unaffected by other
      child's archive

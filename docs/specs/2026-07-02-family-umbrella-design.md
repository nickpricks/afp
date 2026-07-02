# Family Umbrella Overhaul (Design Spec)

**Date:** 2026-07-02
**Status:** Design — approved via brainstorm 2026-07-02
**Branch:** `feat/the-original-script`
**Process:** Phase 3 brainstorm per `2026-04-13-phase3-vision-design.md` § 7 (spec → per-pillar plans)
**Plans:** 4 files — see § 8

---

## 1. Overview

AFP today is a collection of per-user silos: every module reads and writes `/users/{uid}/...`, and the only cross-user relationship is the Viewer role (`viewerOf` — one-directional, read-only, whole-tree). The Family Umbrella overhaul introduces a lightweight family relationship on top of the existing per-user model, then uses it to unlock three module-level features.

Four pillars:

| # | Pillar | One-liner |
|---|--------|-----------|
| 1 | Family-scoped data model | `families/{familyId}` root doc + `UserProfile.familyId` link. Data stays per-user; family grants cross-member access via rules |
| 2 | Expense shared ledger | Read-only "Family" tab on Budget aggregating every member's expenses. No split/settle |
| 3 | Baby IA redesign + submodule retirement | Top tabs → grouped drawer nav (Overview / Logs / Archived). Feeding, Sleep, Elimination retire per-child (archive-in-place); Needs merges into Presents |
| 4 | Body auto-tracking | Session-based PWA sensor tracking — accelerometer steps always, barometer floors when the sensor exists |

The original brainstorm discussion was never committed; this spec is the surviving record, reconstructed via a fresh brainstorm on 2026-07-02.

## 2. Brainstorm Decisions (record)

| # | Question | Decision |
|---|----------|----------|
| D1 | Family data model shape | **Lightweight link** — add `familyId` (default `null`) to `UserProfile`; new root `families/{familyId}` doc holds a members map. No data moves. ("All three are fine — just add a familyId for each and link by that") |
| D2 | Ledger semantics | **View, not ledger** — "view all family expenses", no split requirement. Read-only aggregate; each expense's owner is its implicit payer |
| D3 | Family member access | **Read-only cross-member, except children** — family members get read on each other's module data and **read + write on `children/*`** (both parents log meals/milestones/growth) |
| D4 | Baby IA nav | **Drawer + grouped sections** — slide-in drawer on mobile, persistent left sidebar ≥ `md`. Groups: Overview / Logs / Archived |
| D5 | Submodule retirement set | Feeding, Sleep, Elimination → Archived (per-child); Needs merges into Presents as a section. Growth, Meals, Milestones, Presents stay active |
| D6 | Retired-data migration | **Archive in place** — no data moves, no deletes, tabs leave the active nav; Journal aggregation keeps reading the old subcollections (no preference stated; lowest-risk option chosen) |
| D7 | Auto-tracking source | **PWA device sensors, session-based** ("Let's try for 3, otherwise we find other options"). User relies on Google Fit but "its stair tracking is lame" — floors are the pain point. Health-API sync and export-import rejected for v1 |
| D8 | Auto-tracking shape | Explicit Start/Stop tracking session; accelerometer step counting always; barometer floor detection only when the sensor exists (budget Androids often have 1–2 sensors); feature-detect and degrade to manual floors |

## 3. Pillar 1 — Family-Scoped Data Model

### 3.1 Data shape

```
/families/{familyId}                       ← NEW root collection
  { id, name, createdBy, createdAt,
    members: { [uid]: FamilyRole } }       ← membership map, rules key on this

/users/{uid}/profile/main
  + familyId: string | null                ← NEW optional field, default null
```

- `FamilyRole` — new **string enum** (`Owner`, `Adult`). String enum by design: no numeric-stability concern, and reverse-mapping trap avoided.
- No existing document moves. Users without a family (`familyId: null`) see zero behavior change.
- Family creation/linking is **admin-managed v1** (fits the TheAdminNick invite-only model): a Families section in the admin panel creates the family doc and stamps `familyId` on member profiles. Self-serve family invites are out of scope.
- New enum members: `DbCollection.Families` (append), `DbField.FamilyId` etc. (append) — **numeric enums are append-only**; these are string enums but the same discipline applies to ordering.

### 3.2 StorageAdapter impact — explicit call-out

**The Firebase import boundary is an invariant**: no file outside `src/shared/storage/` and `src/shared/auth/` may import `firebase/*`, and `StorageAdapter` is per-user by design (`createAdapter(userPath(uid))` — CLAUDE.md notes cross-user reads "need direct Firestore `collectionGroup`"). A family model could easily pressure call sites into raw Firestore. It must not. Design that keeps the boundary intact:

1. **Family doc access** — `createAdapter(familyPath(familyId))` with a new `familyPath()` helper in `constants/db.ts`. The adapter interface already takes an arbitrary base path; `families/{familyId}` is an odd-segment doc path (Firestore gotcha satisfied). No interface change.
2. **Cross-member reads** — NO collection-group queries. The family doc enumerates member uids, so a family view composes **N per-member adapters**: `useFamilyMembers(familyId)` resolves the members map, then data hooks instantiate one `createAdapter(userPath(memberUid))` per member (the `targetUid` pattern the Dashboard already uses). Listener fan-out is bounded by family size (2–4 realistically).
3. **Cross-member child writes** — same mechanism: adapter scoped to the child owner's uid; **authorization lives in Firestore rules**, not in client code paths.
4. **No new adapter methods** are required. If implementation discovers otherwise, extend the `StorageAdapter` interface — never bypass it.

### 3.3 Firestore rules impact

- `families/{familyId}`: read for members (`request.auth.uid in resource.data.members`), write for TheAdminNick only (v1).
- Member module data: add an `isFamilyMember(ownerUid)` helper — `get(/users/{ownerUid}/profile/main).familyId != null && get(/users/{ownerUid}/profile/main).familyId == get(/users/{request.auth.uid}/profile/main).familyId`. Two `get()` calls per evaluation — acceptable at family scale; note the read-cost.
- Grant: family member **read** on the owner's module collections (expenses, income, body, children subtree); family member **write** on `children/{childId}/**` only (D3).
- Profile rules: `familyId` is **locked server-side** like `role` and `modules` — owner cannot self-assign a family.

### 3.4 Relationship to Viewer role

Viewer (`viewerOf`) remains unchanged — it is one-directional and admin-granted. Family is symmetric and coarser. A user can be both. No migration between the two.

## 4. Pillar 2 — Expense Shared Ledger (Family View)

- **New "Family" tab** on the Budget module (fifth tab alongside Expenses / Income / CC / Auto — state-based switching like Auto, no new route). Visible only when `profile.familyId != null`. Precedent: `KidsFinanceTab` (read-only aggregate gated on a condition).
- `useFamilyExpenses(familyId)` — composes per-member expense listeners via the § 3.2 adapter fan-out. **Read-only**: no add/edit/delete from this tab; write callbacks absent by construction (stronger than `readOnly` no-op).
- Each row shows a **member attribution chip** (owner display name = implicit payer). No `paidBy` field is added to `Expense` — the owner IS the payer (D2). If split semantics ever arrive, a `split` field can be appended without migration.
- **Summary math**: pure `computeFamilyTotals(memberTotals[])` in `budget-math.ts` — per-member contribution + family total, honoring the shared `timeRange` filter. Pure utility → follows the `compute*` naming and returns plainly or `Result<T>` where fallible (Decision A1: pure utils `Result<T>`, data hooks `Promise<boolean>`).
- List rendering reuses the universal Daily Ledger stack (`useListControls`, `<ListControls>`, `<DateGroupHeader>`, `sortNewestFirst()`).
- No split/settle module. The existing CC `ReconciliationView` is untouched.

## 5. Pillar 3 — Baby IA Redesign + Submodule Retirement

### 5.1 Navigation: tabs → grouped drawer

`ChildDetail`'s flat top-tab bar (10 possible tabs) is replaced by a grouped nav — slide-in drawer behind a hamburger on mobile, persistent left sidebar at ≥ `md`:

```
Overview   Dashboard · Journal            (always visible, as today)
Logs       Meals · Growth · Milestones · Presents   (gated by ChildConfig)
Archived   Feeding · Sleep · Elimination  (collapsed by default, read-only)
```

- New `ChildNav` component owns the drawer/sidebar; `ChildDetail` keeps the active-section state (state-based switching preserved — no new routes).
- The Archived group renders only when the child has data in the corresponding subcollection AND the section is retired for that child.

### 5.2 Submodule retirement — per-child, archive-in-place

- Retirement is **per-child via `ChildConfig`**, not app-wide: a younger sibling can still have Feeding active while the older kid's is archived. New optional `archived` map on `ChildConfig` (e.g. `{ feeds?: boolean, sleep?: boolean, elimination?: boolean }`).
- Archived sections render the existing log lists **without their forms** (read-only) — no component deletion; `FeedingLog`/`SleepLog`/ `EliminationLog` gain a `readOnly`-style render path or a shared list extraction (natural fit with the pending `BabyLogList` refactor noted in CLAUDE.md).
- **Migration: none.** `feeds/*`, `sleep/*`, `elimination/*` stay where they are. `useJournalData` and Journal aggregates keep reading them — history survives untouched. Zero-risk and reversible (un-archive = flip the config flag). Note: elimination already carries one migration (diapers→elimination); leaving it in place avoids compounding risk.

### 5.3 Needs → Presents merge

- The Needs nav item disappears; `PresentsLog` gains a **Needs section** (segment/filter alongside Gifts and Finances) rendering the existing `NeedsLog` content. Subcollection stays `needs/*` — **no data migration**, UI-only merge.
- `ChildConfig.needs` keeps gating the section's visibility inside Presents.

## 6. Pillar 4 — Body Auto-Tracking (Sensor Sessions)

### 6.1 Shape

- **Explicit tracking session**: Start/Stop button on a new Body surface (Track tab or Stats-tab card). Browsers cannot background-track a PWA — counting happens only while AFP is open and the session is live. This is a stated, accepted constraint (D8).
- **Steps** — `DeviceMotionEvent` accelerometer stream → peak-detection step counter. Pure detection/derivation functions in `src/modules/body/step-math.ts` (`computeSteps`, `computeStrideDistance`) — `compute*` naming, unit-testable with recorded sample fixtures, no Firebase anywhere near them.
- **Floors** — Generic Sensor API barometer (pressure delta → altitude → floor transitions) **only when the sensor exists**. Budget Androids often lack it (D8) and browser support is spotty — feature-detect, degrade to manual floors silently. Google Fit's "lame" stair tracking is the benchmark to beat, not to match.
- **First task is a DevBench sensor probe** — a DevBench panel that shows live sensor availability/readings on the actual device fleet, acting as a decision gate before UI build-out.
- **iOS**: `DeviceMotionEvent.requestPermission()` needed — request only on session start, never on page load.

### 6.2 Persistence

- Raw sensor samples are processed **in-memory only** — never persisted, never sent anywhere. Only derived aggregates are saved on session stop: steps → `walk` distance via configurable stride length (new optional `strideCm` on `BodyConfig`), floors → the daily `body/{dateKey}` aggregate — through the existing hooks (Promise<boolean>, own toasts).
- New optional `source` field on `BodyActivity` with a new **string enum** `TrackingSource` (`Manual`, `Sensor`) — existing records without the field are implicitly manual (backwards-compatible, no migration).
- **Privacy:** no third-party service, no health-API OAuth, no tokens to store. Data path is device sensor → in-memory math → user's own Firestore. Nothing crosses a user boundary; family read rules (§ 3.3) govern visibility like any other body data.

## 7. Data Model Summary

| Path / type | Change | Migration |
|---|---|---|
| `families/{familyId}` | NEW root collection (members map) | — |
| `UserProfile.familyId` | NEW optional field, default `null` | None (absent = null) |
| `FamilyRole`, `TrackingSource` | NEW string enums | — |
| `Expense` | **Unchanged** (owner = payer) | None |
| `ChildConfig.archived` | NEW optional map | None (absent = nothing archived) |
| `feeds/*`, `sleep/*`, `elimination/*`, `needs/*` | **Unchanged** — archive/merge is UI-only | **None** (D6) |
| `BodyActivity.source` | NEW optional field | None (absent = manual) |
| `BodyConfig.strideCm` | NEW optional field | None |
| Numeric enums | **No changes** — if any become necessary: append-only, never insert | — |

## 8. Plans (4 files — one per pillar)

Shipping order = dependency order: Pillar 1 is foundational; 2 and 3 depend on it only where noted; 4 is independent.

| Plan | File | Depends on |
|---|---|---|
| 1. Family data model | `docs/plans/2026-07-02-family-umbrella-family-data-model-plan.md` | — |
| 2. Shared ledger view | `docs/plans/2026-07-02-family-umbrella-shared-ledger-plan.md` | Plan 1 |
| 3. Baby IA redesign | `docs/plans/2026-07-02-family-umbrella-baby-ia-plan.md` | Plan 1 only for cross-parent writes; nav/archive work is independent |
| 4. Body auto-tracking | `docs/plans/2026-07-02-family-umbrella-body-auto-tracking-plan.md` | — |

## 9. Open Questions / Future

- **Family invites (self-serve)** — v1 is admin-managed; a family-invite flow (reuse `InviteRecord` with a `familyId` field) is a natural v2.
- **Family dashboard card** — a home-dashboard "Family" card aggregating member stats; deferred until the ledger view proves the fan-out pattern.
- **Split/settle** — explicitly rejected for v1 (D2); schema leaves room to append.
- **Sensor probe outcome** — if the DevBench probe shows accelerometer step-counting is unusable on the target devices, fall back to the export-import option discussed in the brainstorm ("otherwise we find other options").
- **BabyLogList extraction** — the shared baby list refactor (CLAUDE.md backlog) pairs naturally with Pillar 3's read-only archived rendering; Plan 3 flags it as an opportunistic include.

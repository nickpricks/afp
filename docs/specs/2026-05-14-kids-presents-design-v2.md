# Design Spec: Kids Presents (v2)

**Supersedes:** `docs/specs/2026-05-13-kids-presents-design.md`
**Status:** Approved 2026-05-14
**Branch:** `feat/what-was-the-joke` (Phase 1 + 2 shipped in `2b4c4f1`; this spec drives the finishing pass)
**Story points:** Medium (5) — ~1 full day
**Author:** Nick (re-brainstormed via `superpowers:brainstorming`)

---

## Why v2

The original spec was thin. It defined data and a UI sketch but skipped twelve AFP house rules (Firestore rules, messages enum, undo-on-delete, viewer mode threading, `AddChild` checkbox, `ExpenseListPage` wiring, tests, etc.). The implementation shipped in `2b4c4f1` reflects those gaps — most notably: dormant Budget UI, no rules, no AddChild toggle, raw toast strings, listener loading bug. This v2 enumerates every integration point and pre-resolves the ambiguities v1 left open.

## Goal

Track kids' physical gifts and money received as gifts, with two surfaces:
- **Baby module (per-child):** log gifts and money under a child's profile.
- **Budget module (aggregate):** read-only view of all kids' money across the family, with a Spent→Expense bridge.

## Context & Background

Kids receive both objects (toys, clothes) and money (cash gifts, transfers). Today AFP has no place to record either. Money tracking belongs partially in the Budget module (it's family financial state) but is conceptually rooted in the child (who received it, on what occasion). Gifts are inventory data — they belong with the child.

## Data Shape

Two new subcollections under `users/{uid}/children/{childId}/`:

### `gifts` (physical objects)

```ts
type GiftEntry = {
  id: string;
  date: string;                 // YYYY-MM-DD
  title: string;                // "Lego Technic"
  giver: string;                // "Grandpa"
  occasion: string;             // "5th Birthday"
  status: GiftStatus;           // Wishlist | Received | Used | Outgrown
  notes: string;
  timestamp: string;            // ISO — added in v2 for baby-module consistency
  createdAt: string;            // ISO
  updatedAt: string;            // ISO
};
```

### `finances` (money)

```ts
type FinanceEntry = {
  id: string;
  date: string;                 // YYYY-MM-DD
  amount: number;
  description: string;          // "Cash gift"
  giver: string;
  occasion: string;
  status: FinanceStatus;        // Received | Saved | Spent
  notes: string;
  linkedExpenseId?: string;     // NEW — set when Spent→Expense modal creates a linked expense
  timestamp: string;            // ISO — added in v2
  createdAt: string;
  updatedAt: string;
};
```

### Enums

```ts
enum GiftStatus    { Wishlist = 0, Received = 1, Used = 2, Outgrown = 3 }
enum FinanceStatus { Received = 0, Saved = 1, Spent = 2 }
```

`GiftStatus.Wishlist` is intentionally retained despite conceptual overlap with `NeedStatus.Wishlist` (resolved question — see below).

### `ChildConfig` gate

```ts
type ChildConfig = {
  // ...existing
  presents?: boolean;           // gates the Presents tab and dashboard card
};
```

### `DbSubcollection` additions

```ts
enum DbSubcollection {
  // ...existing
  Gifts = 'gifts',
  Finances = 'finances',
}
```

### Field conventions (v2 additions)

- `timestamp` added to both entry types to match `FeedEntry`/`SleepEntry`/`MealEntry`/etc. — every other baby entry has it, so omitting it costs more in inconsistency than it saves in bytes.
- `time` field intentionally **omitted** — presents are date-grained, like `Growth`/`Needs`/`Milestones`. Logging "received at 3:47 PM" is noise.
- `linkedExpenseId` is unidirectional. The corresponding `Expense` has **no back-pointer**. Deletion of either side does not cascade; orphaned `linkedExpenseId` renders an "(unlinked)" muted badge in the finance list.

### Backwards compatibility

The implementation in `2b4c4f1` already wrote entries without `timestamp` (during dev). Read-time fallback: `entry.timestamp ?? entry.createdAt`. No migration needed.

## UI/UX

### Baby module — `ChildDetail` → Presents tab

- **Tab position:** rightmost in the tab strip, after Milestones.
- **Tab label:** `🎁` icon only, no text. (Deliberate inconsistency with other text-labeled tabs; an icon-ify-all-tabs follow-up is out of scope.)
- **Visibility:** gated by `child.config.presents`.
- **Dashboard card:** `🎁 Presents` with subtitle "Gifts + money" in `DashboardTab` grid, navigates to the tab on click.

#### Layout

- **Sub-tab toggle** at top: `[Finances | Gifts]` — pill style, matches Elimination's Diaper/Potty toggle precedent.
- **Inline form** below the toggle, sharing a shell but with different fields per sub-tab:
  - **Finances:** description, amount (number), giver, occasion, notes.
  - **Gifts:** title, giver, occasion, notes.
- **List below the form**, grouped by date via `<DateGroupHeader>` (sticky `Today` / `Yesterday` / `Wed 14 May` headers).
- **List controls:** `<ListControls>` (time-range pills + page-size + jumper) and `<ListShowMoreFooter>` per sub-tab. Each sub-tab owns its own `useListControls` instance — switching sub-tabs does not leak page state. Fixes the current impl bug.
- **Status select per row:** inline `<select>` shows current status; changing it persists via `update`.
- **Tap row to edit:** populates the form with the row's data; active row highlights with `bg-[var(--accent-muted)] border-l-2 border-l-accent`.
- **Delete:** inline `×` button + `<SwipeToDelete>` wrapper on mobile, with 10s undo toast (`CONFIG.UNDO_DURATION_MS`). Both house rules — fixes the current impl which has only the `×` button and no swipe/undo.
- **Currency:** hardcoded `₹` symbol, matching the rest of the Budget module. No locale formatter for v1.

### Spent→Expense bridge (the new flow)

When the user changes a `FinanceEntry.status` `<select>` to `Spent`:

1. Status save is **paused** (no Firestore write yet).
2. `<ConfirmExpenseModal>` opens — a controlled `<dialog>` element local to `PresentsLog`, not a global modal system. Pre-filled fields:
   - **Amount:** `entry.amount`
   - **Description:** `entry.description`
   - **Category:** last-used category, or `ExpenseCategory.Other` if none.
   - **Date:** `entry.date` (the finance date, not today).
3. Three actions:
   - **[Yes, log it]** — sequential writes: (a) create `Expense` doc, (b) set `FinanceEntry.linkedExpenseId = <newExpenseId>`, (c) save `status = Spent`. Any failure aborts the chain and shows an error toast; status does not flip.
   - **[Skip]** — save `status = Spent` only. No expense, no link.
   - **[Cancel]** — close modal, do not change status. Select reverts to its prior value.
4. On success, toast: `BudgetMsg.KidsExpenseLogged` ("Logged as expense").

### Budget module — `ExpenseListPage` "Kids" tab

- **New tab** in the `BudgetTab` union: `'kids'`.
- **Visibility:** only when `profile.modules.baby === true`.
- **Tab position:** after `cc`, before `auto` (between credit-card and auto).
- **Content:** renders `<KidsFinanceTab>`.
- **Header pill:** `Total Kid Wealth: ₹X,XXX` — sum of `FinanceEntry.amount` where `status ∈ {Received, Saved}`. **Excludes Spent** ("wealth" = present-tense holdings).
- **List:** grouped by date via `<DateGroupHeader>`, each row shows:
  - Description, amount (`₹`), giver, status label.
  - Child-name chip (`bg-accent/10 text-accent`) — disambiguates across kids.
- **Empty state:** `BudgetMsg.KidsTabEmpty` with hint "Money logged in the Presents tab of a child's profile will appear here."
- **Read-only.** No add/edit/delete in this tab — write surface is per-child.

### Viewer mode

- `PresentsLog` accepts `uid` prop → threads to `useBabyCollection<T>(childId, sub, label, uid)` as the optional `targetUid` arg.
- `useAllKidsFinances` accepts optional `targetUid` argument → uses it for `childPath` construction instead of `firebaseUser.uid`.
- `useChildren` already supports `targetUid` (existing).
- Viewer sees **both** Gifts and Finances of the linked user's children. No split-by-sensitivity. (Resolved question.)

## Technical Approach

### Storage

- `useBabyCollection<GiftEntry>` and `useBabyCollection<FinanceEntry>` — standard generic hook, no new abstractions.
- Subcollection paths: `users/{uid}/children/{childId}/gifts`, `.../finances`.

### Aggregation — `useAllKidsFinances`

- Reads `children` from `useChildren(targetUid)`.
- For each child, opens an `onSnapshot` listener on `finances` via `createAdapter(childPath(...))`.
- Merges results into a keyed map `{ [childId]: KidsFinanceEntry[] }` so each child's slice is **replaced** on each snapshot, not appended.
- Output: flat list `KidsFinanceEntry[]` where `KidsFinanceEntry = FinanceEntry & { childId, childName }`.
- **Loading semantics:** `loading=false` only when every child has reported at least once (or `children.length === 0`). Tracked via a `readyMap`. Fixes the current bug where loading flips on first child to report.
- **Teardown:** explicit cleanup on `children` change — unsubscribes all listeners.
- **Memoization prerequisite:** `useChildren` must return a referentially-stable array when contents are unchanged. If it doesn't already, this is a P0 fix.

### Math — `presents-math.ts`

Pure module, no React, no hooks:

```ts
computeKidWealth(entries: FinanceEntry[]): number  // sum where status ∈ {Received, Saved}
filterByStatus<T extends { status: number }>(entries: T[], status: number): T[]
```

100% unit coverage. Consumed by `KidsFinanceTab` and any future surface that needs the totals.

### Firestore rules

Add two rule blocks under `match /users/{uid}/children/{childId}/`:

```
match /gifts/{giftId} {
  allow read, write: if isOwnerWithBaby() || isAdmin();
}
match /finances/{financeId} {
  allow read, write: if isOwnerWithBaby() || isAdmin();
}
```

Viewer-mode reads ride on existing baby-subcollection viewer predicate, if any; otherwise extend the predicate consistently with the rest of the baby subcollections.

### Messages — `constants/messages.ts`

```ts
enum BabyMsg {
  // ...existing
  PresentSaved = '🎁 Saved',
  PresentDeleted = '🎁 Deleted',
  PresentUpdated = '🎁 Updated',
  PresentRequiresTitle = 'Description/Title is required',
}
enum BudgetMsg {
  // ...existing
  KidsTabEmpty = 'No kid finances yet',
  KidsExpenseLogged = 'Logged as expense',
}
```

All toast strings in `PresentsLog`, `KidsFinanceTab`, `ConfirmExpenseModal` use these enums. Zero raw strings (per AFP's #6 audit rule).

### AddChild wiring

Add `presents` checkbox to the toggle group in `AddChild.tsx`, alongside `meals/needs/milestones`. Default off, matching recent additions. Without this, the feature is dormant.

## File Layout

```
src/modules/baby/
  components/
    PresentsLog.tsx                # refactor: SwipeToDelete, undo toast, per-sub-tab ctrl, enum messages
    ConfirmExpenseModal.tsx        # NEW — local <dialog>, used only by PresentsLog
    AddChild.tsx                   # add `presents` checkbox
    ChildDetail.tsx                # tab label → `🎁` (icon only)
  presents-math.ts                 # NEW — pure: computeKidWealth, filterByStatus
  __tests__/
    presents-math.test.ts          # NEW — 100% coverage
    PresentsLog.test.tsx           # NEW — smoke + sub-tab switch + delete-undo

src/modules/expenses/
  hooks/
    useAllKidsFinances.ts          # fix loading semantics + targetUid
  components/
    KidsFinanceTab.tsx             # use presents-math, BudgetMsg enums
  pages/
    ExpenseListPage.tsx            # add 'kids' tab, gated on profile.modules.baby
  __tests__/
    useAllKidsFinances.test.tsx    # NEW — multi-child merge + teardown + targetUid
    KidsFinanceTab.test.tsx        # NEW — empty state + render + total math

src/constants/
  messages.ts                      # add BabyMsg + BudgetMsg entries

firestore.rules                    # add /gifts and /finances rule blocks
```

## Testing

| Surface | Coverage target | What's tested |
|---|---|---|
| `presents-math.ts` | 100% | `computeKidWealth` sums Received+Saved only; `filterByStatus` returns matching subset |
| `useAllKidsFinances` | Behavior | Multi-child merge produces flat list; `loading=false` only after all children report; teardown unsubs all listeners; `targetUid` overrides `firebaseUser.uid` |
| `PresentsLog` | Smoke + key flows | Renders sub-tab toggle; switching sub-tabs resets form + ctrl; tap-to-edit populates form; delete shows undo toast |
| `ConfirmExpenseModal` | Behavior | Yes → creates expense + links + saves status; Skip → saves status only; Cancel → no changes |
| `KidsFinanceTab` | Render | Empty state; total math matches `computeKidWealth`; per-row child chip displays |
| E2E (optional) | Happy path | Add finance entry → mark Spent → confirm modal → expense appears in Budget tab |

## Acceptance Criteria

- [ ] `firestore.rules` updated with `/gifts` and `/finances` blocks; deployed.
- [ ] `AddChild.tsx` has a `presents` checkbox; toggling it creates a child whose `config.presents = true`.
- [ ] `ExpenseListPage.tsx` renders the `kids` tab only when `profile.modules.baby` is enabled.
- [ ] Presents tab in `ChildDetail` shows `🎁` icon only, no text.
- [ ] Switching sub-tabs in `PresentsLog` resets the form **and** the `ListControls` state (no leaked page index).
- [ ] Deleting a present shows a 10s undo toast; swipe-to-delete works on mobile.
- [ ] Toggling a finance entry to `Spent` opens `ConfirmExpenseModal`; Yes creates a linked expense; Skip saves status only; Cancel does nothing.
- [ ] `useAllKidsFinances` does not flip `loading=false` until every child has reported.
- [ ] Viewer-role user (with `viewerOf` set) can read another user's presents.
- [ ] All toast strings reference `BabyMsg.*` or `BudgetMsg.*` enums.
- [ ] `presents-math.test.ts` has 100% coverage; `useAllKidsFinances.test.tsx` covers merge + teardown + targetUid.
- [ ] `CHANGELOG.md` updated with feature entry; `docs/ROADMAP.md` marks Presents as shipped.

## Resolved Questions

| Question | Resolution | Rationale |
|---|---|---|
| Wishlist overlap with Needs | Keep separate | Different user intent (parent-buys vs. gifter-hint). Data shape duplication acceptable. |
| Spent → Expense integration | Inline confirm modal | Manual confirmation preserves user agency; auto-create is too magic, no-bridge loses signal. |
| Modal UX | `<dialog>` local to PresentsLog | One consumer — building a global ModalProvider is YAGNI. |
| Viewer mode coverage | Yes, full visibility (gifts + finances) | Consistency-is-king. No split-by-sensitivity. |
| `timestamp` field | Add | Every other baby entry has it. Inconsistency cost > byte cost. |
| `time` field | Omit | Presents are date-grained, like Growth/Needs/Milestones. |
| Wishlist → Received transition | Status flip on same row | Matches `NeedStatus` precedent (Wishlist→Inventory→Outgrown). |
| Currency | Hardcoded `₹` | Matches rest of Budget module. Locale formatting deferred. |
| Tab position in ChildDetail | After Milestones (rightmost) | Newest module goes last. |
| Tab label | `🎁` icon only | User direction. Deliberate inconsistency with text-labeled siblings. |
| Total Kid Wealth math | Sum Received + Saved (exclude Spent) | "Wealth" = present-tense holdings. Spent money is gone. |
| Aggregator loading | Wait-for-all-children | Correctness — current impl flashes incomplete totals for multi-kid families. |
| `useAllKidsFinances` location | `expenses/hooks/` (not `baby/hooks/`) | Consumer is Budget; types import from Baby. Dependency direction matches consumer. |
| `linkedExpenseId` direction | Unidirectional (Finance → Expense) | Expense stays unaware of the link. No cascading deletes. Orphans show "(unlinked)" badge. |
| Life Journal inclusion | Defer to v2 | Presents are episodic, not daily-rhythm data. |
| Tab icon-ification of siblings | Out of scope | Separate refactor ticket if pursued. |

## Out of Scope

- Life Journal aggregation of presents (deferred).
- Bulk import / spreadsheet entry.
- Photo upload for physical gifts.
- Recurring presents (monthly allowance) — model as a separate concept later.
- Auto-categorizing the Spent expense to a specific category (always "Other" or last-used).
- Auto-icon-ifying other tabs in the ChildDetail strip.
- Bank/transfer integration. All entries manual.
- Investment tracking (deferred to "Budget → Investment" phase).

## Risks

| Risk | Mitigation |
|---|---|
| Firestore rules missing on deploy → 403s in prod | Acceptance criteria gate. Rules deployment is mandatory before merge. |
| `useChildren` returns unstable array reference → listener thrash | Verify memoization; fix as prerequisite. |
| Spent→Expense sequential writes fail mid-flow → partial state | Abort chain on first failure; show error toast; status does not flip. Don't half-link. |
| Orphan `linkedExpenseId` after Expense deletion → broken UI | "(unlinked)" badge handles it gracefully. |
| Many children (>10) → many listeners | Real but acceptable: typical family has 1–3 kids. Same risk as `useBabyData`. |
| Wishlist overlap with Needs confuses users | Live with it for v1; observe whether users actually file the same item in both. Revisit if real. |
| Sub-tab shared `ctrl` leaks page state (current impl bug) | Per-sub-tab `useListControls` — explicit acceptance criterion. |
| Viewer-mode regression — Presents reads owner's data instead of `targetUid`'s | Acceptance criterion + test. |
| Loading flicker for multi-kid families (current impl bug) | Wait-for-all semantics — explicit acceptance criterion + test. |

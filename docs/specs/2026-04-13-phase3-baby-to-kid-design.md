# Phase 3 Module A — Baby → Kid (Design Spec)

**Date:** 2026-04-13
**Status:** Design — pending user approval
**Parent:** [Phase 3 Vision + Portfolio Strategy](./2026-04-13-phase3-vision-design.md) (§§ 4 + 8)
**Plans:** 5 plan files (3 active + 2 deferred — see § 13)
**Source repo strip-mined:** [BabyTracker `docs/ROADMAP.md`](https://github.com/nickpricks/BabyTracker/blob/master/docs/ROADMAP.md)

---

## 1. Overview

Module A evolves AFP's baby module from infant-only tracking (feeds, diapers,
sleep, growth) into a multi-stage child tracker that grows with the child:
new log surfaces (meals, potty, milestones, needs), a stage-aware
suggestion system that nudges (never enforces) the right modules per age,
and a Life Journal that turns logged data into a narrative.

Stage is a **derived UI value** (computed from DoB, never persisted —
see § 2). Stage *narrates* but does not *enforce*. Existing AFP
infrastructure (`useModules`, `ChildConfig` toggles) handles all
visibility; the new suggestion system (§ 3) just nudges those toggles
based on age.

| Inventory item | Section | Plan file | Status |
|---|---|---|---|
| Toddler Modules (Meals + Combined Diaper/Potty) | §§ 5, 6 | `phase3-baby-toddler-modules-plan.md` | Active |
| Milestones | § 7 | `phase3-baby-milestones-plan.md` | Active |
| Life Journal | § 9 | `phase3-baby-life-journal-plan.md` | Active |
| Smart Alerts | § 10 | `phase3-baby-smart-alerts-plan.md` | **Deferred** (depends on cross-cutting scheduled-job infra) |
| Export/Import | § 11 | `phase3-baby-export-import-plan.md` | **Deferred** (likely generalizes to cross-module utility) |
| Needs Module (added in brainstorm; not in vision spec inventory) | § 8 | (folds into toddler-modules plan) | Active |

---

## 2. Stage Model

A child has a **stage** (`infant | toddler | kid`) derived from DoB
on every read. Stage is a *narrative label*, not a *gate*. It surfaces in:

- Greeting copy ("Your toddler Aanya...")
- Life Journal section headers and share-card titles
- Suggestion banner copy ("Aanya is now a toddler — consider enabling Meals")

Stage **does not** drive feature visibility directly. Feature visibility
is controlled by `ChildConfig` toggles (existing). Stage *suggests* what
toggles to flip via the Suggestion System (§ 3). A 12-month-old in
"toddler" stage with `feeding: true` and `meals: false` is fine — the
Feed tab still works; the suggestion to flip the toggles is just nudging.

### Constants (defaults, tweakable in code)

```ts
// src/modules/baby/stage.ts
enum ChildStage {
  Infant = 0,
  Toddler = 1,
  Kid = 2,
}

const STAGE_BOUNDARIES = {
  toddler: 12, // months — child becomes "toddler" at 12mo
  kid: 36,     // months — child becomes "kid" at 36mo
} as const;

/** Per-feature suggestion thresholds (months). Independent of stage label. */
const SUGGEST_THRESHOLDS = {
  feeds:      { suggestOff: 18 }, // bottle/breast feeds fade
  diapers:    { suggestOff: 30 }, // diaper events fade (toward potty)
  meals:      { suggestOn:  9 },  // solid food starts
  potty:      { suggestOn:  24 }, // potty training starts
  milestones: { alwaysOn: true }, // not stage-gated
  needs:      { alwaysOn: true }, // not stage-gated
} as const;

const SUGGESTION_SNOOZE_DAYS = 30;

/** Pure function — returns derived stage from DoB. */
export function computeStage(dob: string): ChildStage { ... }
```

### Why this shape

Stage and per-feature thresholds are **decoupled**. Stage boundaries can
be tweaked for narrative purposes ("call them toddler at 12 vs 14mo")
without functional consequence. Per-feature thresholds reflect real
developmental ranges (feeding extends past 12mo for many kids; potty
training starts later than the stage label flip). Both are constants
in code — adjustable in one place, retroactive across all users, no
schema migration.

| Concept | Type | Persisted? | Drives | Defaults |
|---|---|---|---|---|
| Stage label | `ChildStage` enum | No (computed) | UI vocabulary, journal grouping | infant<12mo, toddler 12-36mo, kid ≥36mo |
| Per-feature threshold | constant | No (in code) | Suggestion firing | feeds-off 18mo, diapers-off 30mo, meals-on 9mo, potty-on 24mo |
| Snooze duration | constant | No (in code) | Re-surface timing | 30 days |
| Module visibility | `ChildConfig` boolean | Yes (existing field) | What tabs render | User-controlled via toggles + admin |

---

## 3. Suggestion System

When a child crosses a per-feature threshold AND the current
`ChildConfig` toggle doesn't match the recommended state AND the
suggestion isn't currently snoozed, the suggestion fires. The user can
**Act** (toggle to match), **Snooze** (push to `today + 30d`), or
**Dismiss** (depends on surface — see table).

### Three rendering surfaces

| Surface | Where | Visibility | Actions | Dismiss behavior |
|---|---|---|---|---|
| **Toast** | App-open, once per session | Auto-dismiss after ~6s, or × to close | Quick "Enable" button + close | Session-only (no persistent snooze) |
| **Dashboard banner** | Dashboard `BabyCard` area | Persistent until snoozed/acted | Enable / Snooze 30d / Dismiss | Dismiss = persistent snooze |
| **Child detail strip** | Above tab content in `ChildDetail` shell — visible across all child tabs | Persistent until snoozed/acted | Click → expands inline, then Enable / Snooze / Dismiss | Dismiss = persistent snooze |

Toast aggregates across children (one toast: "5 suggestions across
your children"). Dashboard banner and child-detail strip are per-child.

### Snooze data shape

Stored on the child profile (low write frequency, child-scoped):

```ts
type SuggestionSnooze = {
  snoozedUntil: string; // ISO date (YYYY-MM-DD)
};

type Child = {
  // ... existing fields (id, name, dob, config, createdAt, updatedAt)
  suggestionState?: {
    feeds?: SuggestionSnooze;
    diapers?: SuggestionSnooze;
    meals?: SuggestionSnooze;
    potty?: SuggestionSnooze;
  };
};
```

Snooze is implicitly cleared when the user toggles the corresponding
`ChildConfig` field to match the recommendation (suggestion goes stale).

### Lifecycle state machine

```
[no suggestion]
     ↓ child crosses threshold
[suggestion active]
     ↓ user choice
     ├─→ Enable/Disable feature → [resolved] (no suggestion until threshold delta again)
     ├─→ Snooze → [snoozed until D] → on date D → [suggestion active]
     └─→ Toast dismiss only → still [suggestion active] (toast won't show again this session)
```

| State | Render in toast? | Render in dashboard banner? | Render in child strip? |
|---|---|---|---|
| Active, not snoozed, not session-dismissed | Yes (once per session) | Yes | Yes |
| Active, not snoozed, session-dismissed | No (this session) | Yes | Yes |
| Snoozed (snoozedUntil > today) | No | No | No |
| Resolved (toggle matches recommendation) | No | No | No |

---

## 4. Existing Modules — Continuation

| Module | Stage relevance | Changes for Module A |
|---|---|---|
| **Feed** (`feeds` subcollection) | Suggestion to disable at 18mo (`SUGGEST_THRESHOLDS.feeds.suggestOff`) | None to data shape; new suggestion firing |
| **Sleep** (`sleep` subcollection) | All stages — sleep tracking remains relevant | None |
| **Growth** (`growth` subcollection) | All stages — weight/height/head circumference works for kids | None |
| **Diaper** (`diapers` subcollection) | **Restructured** into combined Diaper/Potty module — see § 5 | Subcollection rename + entry shape extension |

---

## 5. Combined Diaper/Potty Module

Diaper events (infant) and potty events (toddler+) are the same kind of
data — toilet/elimination tracking — with different framing. Module A
combines them into a single `elimination` subcollection with a discriminated
union on `mode`.

### Subcollection rename + migration

| Before | After | Migration |
|---|---|---|
| `children/{childId}/diapers/{id}` | `children/{childId}/elimination/{id}` | One-time backfill: read all `diapers/*`, write to `elimination/*` with `mode: 'diaper'` set, then mark old subcollection deprecated. Toddler-modules plan owns the migration. |

### Entry shape (discriminated union)

```ts
enum EliminationMode {
  Diaper = 0,
  Potty  = 1,
}

enum DiaperType {
  Wet   = 0,
  Dirty = 1,
  Mixed = 2,
}

enum PottyTrainingEvent {
  Pee      = 0,
  Poop     = 1,
  Both     = 2,
  Accident = 3,  // missed the potty
  Attempt  = 4,  // tried, didn't go
}

type EliminationEntry = {
  id: string;
  date: string;
  time: string;
  mode: EliminationMode;
  diaperType?: DiaperType;           // only when mode === Diaper
  pottyEvent?: PottyTrainingEvent;   // only when mode === Potty
  timestamp: string;
  createdAt: string;
  notes: string;
};
```

### UI behavior

Elimination mode is driven by `ChildConfig.diapers` and `ChildConfig.potty`
flags (both controllable via Admin/user toggles, suggested by the
suggestion system at age thresholds):

| Child config (`diapers`, `potty`) | Default form mode | List rendering |
|---|---|---|
| `diapers: true, potty: false` (infant) | Diaper form (Wet/Dirty/Mixed) | "Diaper Log" header; entries show diaper type icons |
| `diapers: true, potty: true` (transition) | Mode toggle at top of form (Diaper / Potty) | "Elimination Log" header; entries show appropriate icons per mode |
| `diapers: false, potty: true` (toddler+) | Potty form (Pee/Poop/Both/Accident/Attempt) | "Potty Log" header; entries show potty icons |
| `diapers: false, potty: false` | Tab hidden | n/a |

Form switching is purely UI — same `useBabyCollection<EliminationEntry>`
hook, same subcollection. Forms hide irrelevant fields based on mode.

---

## 6. New Module — Meals / Food

For toddler+ stage, solid-food meals replace bottle/breast feeds. New
subcollection `meals` (independent of `feeds`).

### Entry shape

```ts
enum MealType {
  Breakfast = 0,
  Lunch     = 1,
  Dinner    = 2,
  Snack     = 3,
}

enum MealPortion {
  None    = 0,  // 0% — refused
  Bite    = 1,  // ~10% — took a single bite/taste
  Little  = 2,  // ~25% — took a little
  Some    = 3,  // ~50% — about half
  Most    = 4,  // ~75%
  All     = 5,  // 100%
  Extra   = 6,  // >100% — seconds
}

type MealEntry = {
  id: string;
  date: string;
  time: string;
  type: MealType;
  description: string; // free text — what was served, e.g. "rice + dal + carrot"
  portion: MealPortion | null;
  timestamp: string;
  createdAt: string;
  notes: string;
};
```

### Subcollection path

`/users/{uid}/children/{childId}/meals/{id}`

### Form fields

| Field | Required | Default |
|---|---|---|
| Type (Breakfast/Lunch/Dinner/Snack) | Yes | Auto-suggest from current time of day |
| Time | Yes | Now |
| Description | Yes | Empty (free text) |
| Portion | No | None selected (optional) |
| Notes | No | Empty |

Tap-to-edit pattern (existing AFP convention): tapping a row in the meal
log populates the form for editing.

---

## 7. New Module — Milestones

Captures notable life events: developmental firsts, achievements, ongoing
events like "new hobby." Hybrid categorization — predefined enum drives
UI grouping; custom always allowed.

### Entry shape

```ts
enum MilestoneCategory {
  Motor     = 0,  // first walk, first run, climbing
  Language  = 1,  // first word, sentence, song
  Social    = 2,  // first friend, sharing, empathy
  Cognitive = 3,  // problem-solving, counting, recognizing
  Hobby     = 4,  // new hobby, sport, instrument
  Other     = 5,  // anything custom
}

type Milestone = {
  id: string;
  date: string;          // YYYY-MM-DD when achieved
  time?: string;         // optional — some milestones happen at specific times
  category: MilestoneCategory;
  title: string;         // "First word", "Started swim class", "Said 'I love you'"
  description?: string;  // longer free text
  mediaUrl?: string;     // optional URL (Google Photos / direct image link); MVP shows as link, not preview
  timestamp: string;
  createdAt: string;
  notes: string;
};
```

### Predefined templates (quick-add)

A small library of common milestones for one-tap creation:

| Template | Default category |
|---|---|
| First word | Language |
| First steps | Motor |
| First tooth | Other |
| First haircut | Other |
| Slept through the night | Other |
| Started solid food | Other |
| Started crawling | Motor |
| Started potty training | Other |
| First day at daycare/school | Social |
| First friend | Social |

User can also create from scratch (any category, any title).

### Subcollection path

`/users/{uid}/children/{childId}/milestones/{id}`

### UI

- New "Milestones" tab in `ChildDetail` (always visible, no stage gate)
- Tab body: predefined-template chips at top + free-form add form + history list grouped by category
- Tap-to-edit pattern: tap a milestone to load it into the form

---

## 8. New Module — Needs

Wishlist + inventory tracker for kid-scale items: apparel, footwear,
school supplies, toys, books. Entry-style (like AFP's Budget expenses).
Feeds Life Journal ("Aanya outgrew her shoes this month").

### Entry shape

```ts
enum NeedCategory {
  Apparel  = 0,  // clothes, jackets
  Footwear = 1,  // shoes, sandals
  School   = 2,  // uniform, books, crayons, supplies
  Toys     = 3,  // toys, games, building blocks
  Books    = 4,  // story books, learning books
  Other    = 5,
}

enum NeedStatus {
  Wishlist  = 0,  // wants/needs but not yet purchased
  Inventory = 1,  // owned and in use
  Outgrown  = 2,  // no longer fits or used
}

type NeedEntry = {
  id: string;
  date: string;          // YYYY-MM-DD when added/changed
  title: string;         // "new clothes", "winter jacket size 3", "geometry box"
  category: NeedCategory;
  status: NeedStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;     // changes when status transitions
};
```

### Status lifecycle

```
[Wishlist] → user purchases → [Inventory] → user marks → [Outgrown]
```

UI surfaces three filter chips (Wishlist / Inventory / Outgrown) on the
Needs tab; tap a row to edit (incl. status change).

### Subcollection path

`/users/{uid}/children/{childId}/needs/{id}`

### Future cross-link with Budget (deferred)

When status flips from Wishlist → Inventory, a future enhancement could
auto-create a Budget expense (with category and amount). Not in MVP;
flagged in § 14.

| Status | Filter chip | Life Journal contribution |
|---|---|---|
| Wishlist | "Wishlist" | Counted in "needs added this period" |
| Inventory | "Have" | Counted in "items acquired" |
| Outgrown | "Outgrown" | Surfaces as journal moment ("outgrew clothes") |

---

## 9. Life Journal

The narrative view. Three time-scale views (Daily / Weekly / Monthly)
with picker. Static aggregation only — no AI narrative in v1. Plus
auto-detected counting milestones surfaced inline.

### Granularity

| View | Time range | Default landing |
|---|---|---|
| Daily | One date | Today |
| Weekly | 7 days (Mon-Sun by default) | This week |
| Monthly | Calendar month | This month |

Picker at top: `< [Today / This Week / This Month] >` arrows + grain selector.

### Card structure (per period)

Cards stack vertically, each derived from underlying data:

| Card | Source data | Example content |
|---|---|---|
| Header | Stage + child name | "Aanya, Toddler — Week of Apr 8-14" |
| Counting moments | All subcollections + thresholds | "🎉 Crossed 1000 diapers this week!" |
| Feeds/Meals summary | `feeds` + `meals` | "12 feeds, 8 meals this week" |
| Sleep summary | `sleep` | "Avg 11h/night, 2 naps/day" |
| Growth | `growth` (latest) | "Last weighed 11.2kg on Apr 10 (+0.3 since last)" |
| Elimination | `elimination` | "32 diapers, 4 potty attempts" |
| Milestones logged | `milestones` (date in range) | "First word: 'mama' (Apr 11)" |
| Needs activity | `needs` (status changes in range) | "Added: winter jacket. Outgrown: shoes." |

### Counting milestones (compute-on-read)

Cumulative thresholds surfaced when crossed within the period:

```ts
const COUNTING_THRESHOLDS = {
  diapers:    [100, 250, 500, 1000, 2500, 5000],
  feeds:      [100, 500, 1000, 2500, 5000],
  meals:      [50, 100, 250, 500, 1000],
  sleepHours: [100, 250, 500, 1000, 2500],
  milestones: [10, 25, 50, 100],
} as const;
```

Computed on-read by querying counts before period start vs after; if
a threshold lies in between, surface as "🎉 Crossed N <thing> this period."
Not persisted (no ghost milestone entries).

### Sharing

Deferred — see § 14. v1 has no share button.

| Aspect | v1 | Future |
|---|---|---|
| Granularities | Daily, Weekly, Monthly | + Auto "moments" curation |
| Content | Static aggregation + counting moments | + AI narrative (LLM-generated) |
| Sharing | None | Canvas → PNG, URL share |

---

## 10. Smart Alerts (UX deferred — Plan 4 deferred)

Alerts proactively notify when something is due (feeding interval gap,
sleep schedule deviation, milestone-due-by-typical-age). Mechanism
(scheduled job / push / poll) is **deferred** to a cross-cutting AFP
infrastructure decision (vision spec § 8). UX design captured here.

### Alert types

| Alert | Trigger | Surface | Snooze |
|---|---|---|---|
| Feeding interval | Last feed/meal > N hours ago AND child stage in feeding window | Toast + Dashboard banner | 1h, 3h, 6h |
| Sleep schedule | No sleep entry by typical bedtime + 30min | Toast | 30min, 1h |
| Milestone-due | Typical-age milestone not logged after age threshold | Dashboard banner | 1 week |

### Reuses Suggestion System pattern

Same three-surface model as § 3 (Toast / Dashboard banner / Child detail
strip). Same snooze data shape (extended to alerts).

### Mechanism (TBD — blocks plan)

| Option | Pros | Cons | Status |
|---|---|---|---|
| Firebase Cloud Functions + FCM push | Real push notifications, works when app closed | Requires Firebase project plan upgrade for some quotas | Likely |
| Service Worker scheduled wake | Works in PWA standalone | Browser support spotty | Possible |
| In-app polling on app open | Simple, no infra | Only fires when user opens app | MVP fallback |

Plan 4 stays deferred until cross-cutting decision lands.

---

## 11. Export/Import (data shape — Plan 5 deferred)

Versioned JSON envelope for child-data export. Spec captures envelope
shape; plan deferred (likely generalizes to cross-module utility).

### Envelope shape

```jsonc
{
  "version": "1.0",
  "exportedAt": "2026-04-13T12:00:00Z",
  "afpVersion": "0.3.0",
  "scope": "baby",         // future: "all" | "body" | "baby" | "budget"
  "user": { "uid": "..." }, // anonymized on export if shared
  "children": [
    {
      "child": { /* Child object minus id */ },
      "feeds":       [ /* FeedEntry[] minus id */ ],
      "sleep":       [ /* SleepEntry[] */ ],
      "growth":      [ /* GrowthEntry[] */ ],
      "elimination": [ /* EliminationEntry[] */ ],
      "meals":       [ /* MealEntry[] */ ],
      "milestones":  [ /* Milestone[] */ ],
      "needs":       [ /* NeedEntry[] */ ]
    }
  ]
}
```

### Import behavior

| Conflict | Resolution |
|---|---|
| Existing child with same DoB + name | Prompt: merge / skip / rename |
| Entry IDs collide | Always remap (generate new IDs on import) |
| Schema version older than current | Run migration chain (1.0 → 1.1 → ...) |
| Schema version newer than current | Reject import with error message |

### Future: cross-module envelope

If generalized later, top-level becomes:

```jsonc
{
  "version": "1.0",
  "scope": "all",
  "body":   { /* body-module data */ },
  "baby":   { /* children + subcollections */ },
  "budget": { /* expenses + income + recurring + investments */ }
}
```

Plan 5 deferred until generalize-or-baby-only decision is made.

| Aspect | Decision | Status |
|---|---|---|
| Envelope shape (baby) | Defined above | Locked |
| Versioning strategy | Semver, migration chain on import | Locked |
| ID remapping | Always remap on import | Locked |
| Cross-module generalization | TBD | Deferred |
| Plan written? | No | Deferred |

---

## 12. Data Model Summary

All new types, enums, and schema additions consolidated for quick lookup.

### New enums

| Enum | Members | Used by |
|---|---|---|
| `ChildStage` | Infant, Toddler, Kid | Stage label (computed, not stored) |
| `EliminationMode` | Diaper, Potty | Discriminator on `EliminationEntry` |
| `PottyTrainingEvent` | Pee, Poop, Both, Accident, Attempt | Potty mode of EliminationEntry |
| `MealType` | Breakfast, Lunch, Dinner, Snack | MealEntry |
| `MealPortion` | None, Bite, Little, Some, Most, All, Extra | MealEntry (optional field) |
| `MilestoneCategory` | Motor, Language, Social, Cognitive, Hobby, Other | Milestone |
| `NeedCategory` | Apparel, Footwear, School, Toys, Books, Other | NeedEntry |
| `NeedStatus` | Wishlist, Inventory, Outgrown | NeedEntry |

### New entry types

| Type | Subcollection | Key fields |
|---|---|---|
| `EliminationEntry` | `elimination` (renamed from `diapers`) | mode, diaperType?, pottyEvent? |
| `MealEntry` | `meals` (new) | type, description, portion |
| `Milestone` | `milestones` (new) | category, title, mediaUrl? |
| `NeedEntry` | `needs` (new) | category, status, title |

### Existing type extensions

```ts
// Extend ChildConfig with new feature flags
type ChildConfig = {
  feeding: boolean;       // existing
  sleep: boolean;         // existing
  growth: boolean;        // existing
  diapers: boolean;       // existing — controls Diaper mode of elimination subcollection
  // NEW:
  meals: boolean;
  potty: boolean;         // controls Potty mode of elimination subcollection
  milestones: boolean;
  needs: boolean;
};

// Extend Child with optional suggestion snooze state
type Child = {
  // ... existing (id, name, dob, config, createdAt, updatedAt)
  suggestionState?: {
    feeds?: SuggestionSnooze;
    diapers?: SuggestionSnooze;
    meals?: SuggestionSnooze;
    potty?: SuggestionSnooze;
  };
};
```

### Constants (in `src/modules/baby/constants.ts` or stage.ts)

| Constant | Value | Purpose |
|---|---|---|
| `STAGE_BOUNDARIES` | `{ toddler: 12, kid: 36 }` (months) | Stage label cutoffs |
| `SUGGEST_THRESHOLDS` | per-feature `{ suggestOff?, suggestOn? }` | Suggestion firing |
| `SUGGESTION_SNOOZE_DAYS` | `30` | Snooze duration |
| `COUNTING_THRESHOLDS` | per-data-type number arrays | Life Journal moments |

---

## 13. Plans (9 files — split per "one feature per plan" rule)

| # | Plan file | Scope | Status | Dependencies |
|---|---|---|---|---|
| 1 | `2026-04-13-phase3-baby-foundation-plan.md` | Type extensions (all enums + entry types + extended `ChildConfig` + `suggestionState`) + `stage.ts` (`computeStage` + constants). Skeleton only — no UI, no Firestore writes | **Active** | None (foundational) |
| 2 | `2026-04-13-phase3-baby-suggestions-plan.md` | `suggestions.ts` + `useSuggestions` + `useSnooze` + `SuggestionStrip` + `SuggestionBanner` + Layout toast + ChildDetail wiring + BabyCard wiring | **Active** | Plan 1 |
| 3 | `2026-04-13-phase3-baby-elimination-plan.md` | Diaper→Elimination migration + `EliminationLog` component + ChildDetail swap + admin `potty` toggle | **Active** | Plan 1 |
| 4 | `2026-04-13-phase3-baby-meals-plan.md` | `MealsLog` component + ChildDetail wiring + admin `meals` toggle | **Active** | Plan 1 |
| 5 | `2026-04-13-phase3-baby-needs-plan.md` | `NeedsLog` component + ChildDetail wiring + admin `needs` toggle | **Active** | Plan 1 |
| 6 | `2026-04-XX-phase3-baby-milestones-plan.md` | Milestones tab + entry/list/edit + predefined templates + admin `milestones` toggle | **Active — not yet written** | Plan 1 |
| 7 | `2026-04-XX-phase3-baby-life-journal-plan.md` | Daily/Weekly/Monthly views + counting milestones + card layouts | **Active — not yet written** | Plans 1, 6 + new subcollections from plans 3-5 |
| 8 | `2026-04-XX-phase3-baby-smart-alerts-plan.md` | Alert UX impl + mechanism integration | **Deferred** | Cross-cutting scheduled-job infra (vision § 8) |
| 9 | `2026-04-XX-phase3-baby-export-import-plan.md` | Envelope serializer/deserializer + UI + conflict UX | **Deferred** | Decision on baby-only vs generic cross-module utility |

Plan 1 is the foundation — required by all others. Plans 2-5 are
independent (any order after Plan 1). Plan 6 (milestones) is independent
of plans 2-5 but adds richer data for Plan 7. Plan 7 (life-journal)
sources data from all prior subcollections. Plans 8-9 deferred.

Each plan is self-contained: includes its own admin toggle additions
(where applicable), CHANGELOG entry, and component tests. No separate
"docs sweep" or "admin updates" plan needed.

---

## 14. Open Questions / Future

| Item | Notes |
|---|---|
| AI narrative for Life Journal | Out of v1; revisit if static aggregation feels insufficient |
| Sharing (canvas/SVG/URL) | Out of v1; canvas → PNG most likely first, share-sheet via Web Share API |
| Per-child override of stage thresholds | If real-world variability requires it (e.g., a child needs custom feed-off age); add `child.thresholdOverrides?` field |
| Predefined milestone template library | Current list of ~10; could grow with community contributions or curated set |
| Needs ↔ Budget cross-link | When Need flips Wishlist → Inventory, auto-create Budget expense (with category + amount field) |
| Counting threshold tuning | Current values are guesses; tweak after real-world usage |
| Multi-child Life Journal | "Family week" view aggregating all children — not in MVP |
| Stage notification mechanism (CRON/push) | Cross-cutting decision deferred per vision spec § 8 |
| Stage/role/visibility interaction | Viewer of child sees same stage label/suggestions? Likely yes, but not yet specified |

| Future enhancement | Trigger for revisit |
|---|---|
| AI narrative | Static feels lifeless after some months of use |
| Sharing | User asks to send journal to family member |
| CRON infrastructure | Smart Alerts plan unblocks |
| Generic export/import | Body or Budget needs export, or first AFP-data migration request |
| Per-child threshold overrides | Real user has child outside default ranges |

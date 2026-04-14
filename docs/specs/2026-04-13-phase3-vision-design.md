# Phase 3 Vision + Portfolio Strategy

**Date:** 2026-04-13
**Status:** Design — pending user approval
**Supersedes:** Prior workspace-level passforge/ft "independent CLIs" note in `../../../CLAUDE.md`
**Parent of:** Three downstream brainstorms (A, B, C — see § 7) and two optional out-of-repo brainstorms (D, E)

---

## 1. Portfolio Posture

The workspace at `/Users/nick/Projects/Github/` holds ten repos/dirs. After
this spec, the active portfolio splits into **three user-facing tools**, **one
meta-tooling repo**, three archived-and-superseded repos, one development
sandbox, and two legacy utility libs:

| Repo/Dir | Role | Status |
|---|---|---|
| `afp/` | Personal PWA — body, baby, budget tracker with admin/invite/viewer roles | Active, primary focus (user-facing) |
| `ft/` (FeatherTrailMD) | Markdown notes CLI + future web blogger | Active, independent (user-facing) |
| `passforge/` (ssbd) | Password generator/vault CLI + future web vault + browser extension | Active, independent (user-facing) |
| `nick-picks-claude/` | Public release of Nick's Claude Code toolkit (skills, plugins, MCP) + Go CLI (`npc`) | Active, meta-tooling (developer-facing) — has its own `PLAN.md` |
| `BabyTracker/` | Go + Fyne + React baby tracker | **Archive** (superseded by AFP baby module) |
| `Floor-Tracker/` | React floor-climbing tracker | **Archive** (superseded by AFP body module) |
| `Finularity/` | React expense tracker | **Archive** (superseded by AFP budget module) |
| `whats-next-workspace/` | Eval sandbox for the `whats-next` skill (which ships in `nick-picks-claude`) | Scratch/sandbox — not a shipping project |
| `common-array-utils/`, `sting-utils/` | Legacy npm utility libs | Unchanged — not in scope |

### Why these active projects

AFP covers **body/baby/money** — domains that benefit from a shared web UI
(dashboards, cross-data views, role-based access for family members).
ft covers **markdown notes** — a domain where filesystem-first storage and
terminal-native editing are features. passforge covers **passwords** — a
domain where browser-extension isolation is a security boundary. The three
don't overlap; each is the right shape for its purpose.

`nick-picks-claude` is a different category entirely: it's not a tool Nick
uses, it's how Nick's developer toolkit (skills, plugins, MCP servers) gets
packaged and shared with others. Lives by its own `PLAN.md`; out of scope for
Phase 3 brainstorming but named here for portfolio completeness.

### Operational independence (Option 4)

Each project has its own design language suited to its nature. AFP uses its
10-theme system (Family Blue default, 6 light+dark, 4 dark-only, 9 ambient
effects). passforge's future web vault and ft's future blogger will each get
their own visual vocabulary — they'll borrow *patterns* from AFP (e.g.,
semantic CSS tokens, loading screen discipline) by manual copy, but not
share code, themes, or components. No cross-repo dependencies.

### Theme portfolio — closed

AFP's 10-theme roster already absorbed Floor-Tracker's 6 themes as its base
(Family Blue, Summit Instrument → dropped, Night City: Elevator → dropped,
Deep Mariana, Industrial Furnace, Corporate Glass → dropped, plus Night
City: Apartment renamed to Neon Glow) plus 6 new additions (Garden Path,
Lullaby, Rose Quartz, Charcoal, Marauder's Map, Expecto Patronum).
BabyTracker's 3 themes (Lullaby, Nursery OS, Midnight Feed) were considered
and Lullaby was ported. No further theme portfolio work is pending.

### Auth models — each tool's own

| Tool | Auth |
|---|---|
| AFP | Firebase anonymous + Google Sign-In + invite/role model (admin/user/viewer) |
| passforge | Local master password + Argon2id-derived key + encrypted vault (no server auth) — browser extension will inherit this |
| ft | Filesystem-first (no auth for local); future web layer: TBD in its own brainstorm, likely Git OAuth or similar |

These aren't the same kind of authentication — each suits its tool's
trust model. Shared identity across tools is not planned.

---

## 2. Archive Plan

Three source repos are no longer maintained. Each gets a minimal,
reversible archive treatment with no cross-repo references.

| Source repo | Deployment posture |
|---|---|
| `nickpricks/BabyTracker` | Local-storage React PWA — Pages stays live |
| `nickpricks/MAHAAAAAAAAAAAAA-LOG-Floor-Tracker` | Firebase + GH Pages — both stay live (free tier) |
| `nickpricks/kagaz-kalam-hisab` (Finularity) | Local-storage React PWA — Pages stays live |

### Per-repo steps (apply to each of the three)

**1. Add archive banner to top of `README.md`:**

```markdown
> ⚠️ **Archived 2026-04-13 — no longer maintained.**
```

That's the entire banner. No further explanation, no links.

**2. Strike through future-scoped sections** in README and ROADMAP using
markdown `~~strikethrough~~`. Delete only if the section is pure noise.
Targets per repo:

| Repo | Sections to strike |
|---|---|
| BabyTracker | `docs/ROADMAP.md` "🔜 Up Next" and "🔮 Future" tables; README "Roadmap" section |
| Floor-Tracker | README "Roadmap" table rows from "4 — Security (In Progress)" onwards; any `docs/specs/*.md` marked "Planned" |
| Finularity | README "Roadmap" items 3-7 (Phase 1.9 onwards); `docs/plans/implementation_idea_v1.md` unshipped phases |

**3. Optional: GitHub archive flag** (Nick's call per repo):

```bash
gh repo archive nickpricks/BabyTracker
gh repo archive nickpricks/MAHAAAAAAAAAAAAA-LOG-Floor-Tracker
gh repo archive nickpricks/kagaz-kalam-hisab
```

Effect: "Archived" pill on GitHub, repo becomes read-only (no new issues/
PRs/commits), Pages deployment stays accessible, reversible anytime with
`gh repo unarchive`.

**4. Leave deployments running.**
- GH Pages for all three — free tier, no upkeep cost.
- Floor-Tracker's Firebase (Firestore + rules) — free tier. Rules freeze
  as-is (no pushes after archive means no `firebase-rules.yml` runs).

### No migration

No data migration is planned. No import tooling, no migration notes in any
README, no cross-references. Existing data in archived apps stays where it
is and remains readable via the live URLs.

### Timing

Archive executes **after Phase 3 brainstorms A+B+C complete** and feature
inventories are locked in. Rationale: source repos stay editable-if-needed
during the strip-mine scan, in case a deeper investigation into one of
them is triggered by a brainstorm. Archive is the capstone, not the opener.

---

## 3. Phase 3: Three Module Evolutions

Phase 3 evolves AFP's three existing modules:
- **A — Baby → Kid**: stage-aware UI suggestions + new toddler/kid surfaces
- **B — Budget → Investment**: parallel investment/savings surface alongside expense tracking
- **C — Body → Gamification**: additive UI layer (challenges, streaks, sharing) over existing scoring

Each gets its own dedicated brainstorm session (this spec's terminal handoff
in § 9). This § plus §§ 4-6 capture the **starting input** for those
brainstorms — feature inventories from the source-repo strip-mine — not the
final designs.

Naming convention: each module brainstorm produces a spec at
`docs/specs/2026-04-XX-phase3-<module>-design.md` and a plan at
`docs/plans/2026-04-XX-phase3-<module>-plan.md`.

---

## 4. Module A — Baby → Kid

**Stub.** AFP's baby module currently tracks infant data (feeds, diapers,
sleep, growth) per child. As a child ages out of infant patterns, those
log types stop fitting — a 2-year-old has meals, not feeds; potty events,
not diapers; sleep stays but adds nap-vs-night nuance; milestones become
a first-class concept. Module A introduces a **child-age stage** dimension
(infant | toddler | kid) that *suggests* which subcollections and tabs are
relevant per child, and adds toddler/kid-specific log types.

**Inventory (from BabyTracker `docs/ROADMAP.md`):**
- **Toddler Modules** (v0.4.3) — Meals/Nutrition (replaces Feeds in
  toddler+ stage), Potty Training (replaces Diapers in toddler+ stage)
- **Milestones & Firsts** (v0.4.4) — first words, first steps, custom
  milestones, timestamped, media-attachable (photo/video URL)
- **Life Journal** (v0.5) — configurable daily/weekly summary view,
  milestone cards, shareable screenshot cards, history with charts
- **Smart Alerts** (v0.6) — feeding interval reminders, sleep schedule
  suggestions, milestone-due reminders (e.g., "expected first steps soon")
- **Export/Import** (v0.4.2) — versioned JSON envelope, child-aware
  bundles, ID remapping on import

**Explicitly dropped from inheritance:**
- BabyTracker v0.8 ("Adult Mode") — the plan was for BabyTracker to
  generalize using AFP as a base. Archiving BabyTracker makes this moot;
  AFP's body module already IS the adult tracker.

**Shape hint:** child profile schema is **unchanged** — DoB is already
stored. Stage is a derived UI value: `computeStage(child.dob)` returns
`infant | toddler | kid` based on age thresholds in a single constant
(`STAGE_BOUNDARIES`). Stage is purely a *suggestion layer* — it does not
enforce anything. AFP's existing per-user/per-module enable/disable
infrastructure (Admin panel toggles, `useModules`) handles actual
visibility; stage just nudges defaults and (future) emits notifications
when a child crosses a boundary. Stage never persists to Firestore;
never appears in StorageAdapter or rules. New top-level "Milestones" tab
is shared across all stages; "Life Journal" is a new view, not a new
module.

---

## 5. Module B — Budget → Investment

**Stub.** AFP's budget module currently tracks daily expenses, income, and
payment-method reconciliation. It's a complete *expense* tracker but stops
short of *financial planning* — there's no notion of saving toward a goal,
no recurring obligations (rent, subscriptions, utilities) that auto-add at
intervals, no net-worth picture, no spend-trend insights. Module B adds a
parallel **Investment** surface (new page alongside Budget, not a
replacement) for the planning-and-tracking dimension that complements
day-to-day expense logging.

**Inventory (mostly user-generated — Finularity's source backlog focuses on
multi-platform ports, not feature depth):**
- **Savings goals** — target amount + target date, current saved, progress
  ring, projection (at current rate, will hit goal on date X)
- **Recurring expenses** — monthly subscriptions, rent, utilities; auto-add
  at interval with manual override; flag missed/changed
- **Net worth tracking** — assets vs liabilities, periodic snapshot,
  trend over months
- **Financial insights** — spend trends, category breakdown YoY, anomaly
  detection ("you spent 3× normal on dining this week")
- **Budget categories with monthly limits** — soft caps + alerts (vs
  current free-form expense tracking)
- **Income vs expense ratio** — monthly savings rate visualization
- **From Finularity (small)**: FY date filter (Indian Financial Year
  Apr-Mar), if not already in AFP

**Explicitly dropped from inheritance:**
- Finularity Phases 3-5 (Go CLI, Wails desktop, RN Android native) —
  these are multi-platform ports, irrelevant to AFP's PWA-only posture.

**Shape hint:** new "Investment" tab next to Budget; own subcollection
(`investment_goals/{id}`, `recurring/{id}`, `net_worth_snapshots/{id}`);
shares payment-method enum with Budget; introduces the first real "future
date" data in AFP (savings target dates, recurring next-due dates).

---

## 6. Module C — Body → Gamification

**Stub.** AFP's body module currently tracks floors, walking, running,
cycling, with a daily score and goal. It's functional but *flat* — there's
no narrative of progress over time, no celebration of milestones, no
sharing, no intrinsic-motivation loop beyond the daily goal ring. Module C
is a **purely additive UI/UX layer** over the existing scoring data — no
data model changes — that introduces challenges, streaks, badges, and
(optionally) public sharing. Lightest of the three modules.

**Inventory (from Floor-Tracker README + CLAUDE.md):**
- **Challenge Progress** — 30-challenge catalog (Eiffel Tower → Mariana
  Trench), categories (urban/natural/extreme), floor-height presets per
  challenge, cumulative progress against landmark
- **Daily challenges & streaks** — multi-day completion tracking
- **Username identity + dual routing** — `/u/:username` or `/:uuid` access
  (currently AFP just uses uid; would need username-uniqueness check)
- **Shareable profile URLs** — public read-only view of stats at `/u/:name`
- **Milestone badges** — earned for thresholds (1k floors, 100km walked, etc.)
- **Motivational messages** — daily/contextual ("3 more floors to beat
  yesterday")
- **Streak rewards** — visual celebration for N-day streaks

**Already in AFP — no re-porting needed:**
Real-time sync, themes, edit past days, loading screen, score ring,
weekly bar charts, multi-activity tabs.

**Shape hint:** all gamification data is *derived* from existing
`body_activities` + daily floor totals — no new write paths. New
"Challenges" tab in BodyPage; badges row added to Stats tab; streak
counter on score ring. Username/public-profile feature is the one
exception — it's a profile-level addition with its own data
(`usernames/{name}` for uniqueness lookup) and its own route.

---

## 7. Brainstorm Ordering & Rationale

**Brainstorm order: A → B → C** (input-richness order):

| Order | Module | Why this position |
|---|---|---|
| 1st | A — Baby → Kid | Richest source backlog (BabyTracker has v0.4.3/v0.4.4/v0.5 already mapped). Brainstorm is mostly *structuring inherited designs*, not inventing. Best to do while context is hot from this scan. |
| 2nd | B — Budget → Investment | Blank-canvas brainstorm (Finularity gives almost nothing). Hardest design exercise — better second when rhythm is established. |
| 3rd | C — Body → Gamification | Lightest. Mostly cherry-picking discrete features (challenges, usernames, badges) over existing data. Coast at the end. |

**Brainstorm order ≠ shipping order.** Shipping order is decided
separately at implementation time, based on what AFP needs to ship
next. Specs and plans for A, B, C may sit unimplemented for months;
implementation picks the most-needed module when capacity opens up.

### Optional future brainstorms (separate projects)

Two more brainstorms are anticipated but **scoped to other repos**, not
AFP. Listed here for portfolio completeness:

- **D — ft web layer** (in `ft/` repo) — markdown-blogger web frontend
  on top of the Go backbone. Frontend stack TBD (Go templates / Fresh /
  React / Svelte). Triggered when ft's CLI work reaches the web-layer
  milestone in its own roadmap.
- **E — passforge web vault + browser extension** (in `passforge/`
  repo) — web UI for the existing v0.3.0 vault, plus a browser extension
  for password-manager UX (form fill, save, autocomplete). Triggered
  when passforge reaches that milestone in its own roadmap.

Both are out of scope for AFP planning; pointers only.

---

## 8. Open Questions

Cross-cutting decisions deliberately **deferred** to per-module
brainstorms. Naming them here so each downstream brainstorm knows
what it owns:

### Module A (Baby → Kid)
- **Stage boundary values** — `infant`, `toddler`, `kid` cutoffs in
  months. Example to accommodate: "feeding still allowed till 18 months,
  sometimes 24 in edge cases" — boundaries are squishy and may need
  per-feature thresholds rather than a single hard cut.
- **Stage notification mechanism** — when a child crosses a boundary,
  do we surface it as an in-app banner, a toast on next visit, or a
  scheduled notification (CRON / Firebase scheduled function)? The CRON
  path opens a broader infrastructure direction — see Cross-cutting.
- **Milestones data shape** — flat per-child collection vs categorized
  (motor / language / social) with media-attachment URL support.
- **Life Journal** — daily/weekly/monthly granularity? Static or
  AI-summarized? Shareable as image (canvas screenshot) or just URL?

### Module B (Budget → Investment)
- **Recurring expense execution model** — auto-add at interval
  (cron-like, server-side via scheduled function) vs prompt-on-due
  (next visit, "you have N pending recurring expenses, accept all?").
- **Net worth data sources** — manual entry only, or sync hooks for
  bank/brokerage APIs? (Latter is a much bigger scope.)
- **Savings goal projection** — linear ("at $X/mo, hit goal in N months")
  or compound (with assumed return rate)?
- **Settlement/CC reconciliation** already exists in AFP
  (`ReconciliationView`) — does B enhance it, or stay independent?

### Module C (Body → Gamification)
- **Username uniqueness** — separate `usernames/{name}` collection
  (Floor-Tracker pattern) vs Firebase rule-enforced uniqueness on
  profile field. Trade-offs around redirect routing.
- **Public profile scope** — what data is public? Just totals/badges, or
  full activity log? Affects Firestore rules and the viewer-role model.
- **Challenge catalog source** — port Floor-Tracker's 30-challenge list
  as-is, or curate a subset relevant to multi-activity (walk/run/cycle
  in addition to floors)?
- **Badge taxonomy** — shared across activities (10k floors === 100km
  walked === 200km cycled?) or per-activity?

### Cross-cutting
- **Scheduled-job infrastructure** — A's stage notifications, B's
  recurring expenses, and C's streak-reminder pings all want CRON-like
  execution. AFP currently has none. Adding it (Firebase Cloud Functions
  or similar) is *foundational infrastructure* that unlocks all three —
  worth deciding once before any of A/B/C lock their notification design.
- **Stage/role/module visibility interaction** — for Viewers and Admins,
  does Module A stage-suggestion apply (a Viewer of a toddler sees
  toddler defaults), or is that always per-child stage regardless of
  viewer?
- **AFP version bump policy** — does each Phase 3 module ship as a
  minor version (v0.3.0 → v0.4.0 → v0.5.0 → v0.6.0) or all under v0.4.0?

### Nick's Final Words

*Drop your last notes here before writing-plans handoff. This section
exists for catch-all thoughts the brainstorm flow didn't surface — gut
feels, priorities, things to revisit, anything off-grid.*

> *(empty — awaiting Nick's notes)*

---

## 9. Next Session Handoff

Terminal step of this brainstorm: invoke the **writing-plans** skill to
produce an implementation plan. But the implementation plan for *what*?

This vision spec defines three downstream **brainstorms** (A, B, C),
each of which produces its own design spec, which then handoffs to
**writing-plans** for its own implementation plan. So the immediate
next session is:

> **Module A (Baby → Kid) brainstorm** — invoke
> `superpowers:brainstorming` skill, reference this vision spec
> (§ 4 + § 8), produce `docs/specs/2026-04-XX-phase3-baby-to-kid-design.md`,
> then writing-plans for its plan.

After A ships its spec+plan, the next session repeats for B, then C.
Optional D and E (in `ft/` and `passforge/` repos) are unscheduled.

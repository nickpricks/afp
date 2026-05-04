# AFP Roadmap

Last updated: 2026-05-04

---

## Phase Progress

| Phase | Status | Steps | Notes |
|-------|--------|-------|-------|
| Phase 1 (Scaffold) | ✅ Done | — | Shipped as v0.1.0 |
| Phase 2.0 (Foundation) | ✅ Done | 14/14 | Enums, types, Firestore rules, routes |
| Phase 2a (Body) | ✅ Core done | 32/34 | Missing: Firestore rule verification (needs deploy) |
| Phase 2b (Baby) | ✅ Core done | 29/23 | Firestore rules TBD (needs deploy) |
| Phase 2c (Budget) | ✅ Core done | 30/28 | Firestore rules TBD (needs deploy). UI Alignment done (Session 11) |
| Phase 2d (Profile) | ✅ Core done | 9/9 | Module request buttons added, theme save fix done. Remaining: auth provider linking (needs Firebase) |
| Phase 2e (Admin+Viewer) | ✅ Core done | 35/35 | Done: admin pages, view user dashboard, Broadcasts tab, viewer invite flow, role tests, admin claim flow |
| Notifications | ✅ Done | 20/20 | Per-user notifications, module requests, admin alerts, Broadcasts tab |
| Phase 2f (Themes) | ✅ Enhanced | 20/20 | 10 themes, 8 font families, 10 ambient effects, granular intensity (0-100%), loading screen |
| Phase 2g (E2E + Bench) | ✅ Done | 8/8 | Interactive E2E flows + build/bundle/test benchmarks |
| Phase 2h (Universal list controls + Daily Ledger) | ✅ Done | 16/16 | Time-range filter + per-list page size + page jump + show-all footer + sticky day headers + magnitude bar (Floors) across 11 list surfaces (Broadcasts list pending) |
| Phase 2i (Themes 2.0 — Atmosphere & Glyphs) | ✅ Done | 20/20 | Atmosphere ×9 themes (Charcoal silent), 8 shape-primitive glyphs, depth-correlated scaling, tier-button slider, DevBench catch-up + Theme Tour. Phase 2j (Iconography) split as separate future spec. |
| Phase 3 (Baby → Kid) | 🚧 In progress | 7/10 | Brainstorm A (Baby→Kid) done: Plans 1-7 shipped (Foundation, Suggestions, Elimination, Meals, Needs, Milestones, Life Journal). Plans 8-9 deferred. Plan 10 = Yoga = Brainstorm C — see **Pending Brainstorms** block below |
| **Total** | **~99%** | **209/226** | |

---

## P0 — Critical (blocks real usage)

All P0 items completed.

## P1 — Quality & Correctness

| | Item | Phase | Status |
|---|------|-------|--------|
| 🔨 | Firestore runtime validation — replace `as T` casts with parse/validate | — | Not started |
| 🔨 | Firestore rules verification — manual/automated tests for all modules | 2a-2d | Not started |
| 🔨 | Income module E2E regression test | 2c | Not started |
| ~~🔨~~ | ~~Unit test P0 gaps: `date.ts`, `validation.ts`, `profile.ts` (4 functions)~~ | — | DONE (Session 5) |

## P2 — Phase 2 Remaining Work

| | Item | Phase | Status |
|---|------|-------|--------|
| ~~🔨~~ | ~~ReconciliationView — CC charges vs settlements UI~~ | 2c | DONE |
| ~~🔨~~ | ~~BudgetView time-range — Today/Week/Month/All filter~~ | 2c | DONE |
| ~~🔨~~ | ~~Amount presets — [10] [20] [50] [100] [200] bubbles~~ | 2c | DONE |
| ~~🔨~~ | ~~Body module reconfigure — gear icon to re-enter config~~ | 2d | DONE |
| 🔨 | Link/unlink auth providers in profile | 2d | Not started (needs Firebase Auth) |
| 🔨 | Username uniqueness + negative tests | 2d | Not started |
| ~~🔨~~ | ~~Module request buttons in profile~~ | 2d | DONE (Session 9) |
| ~~🔨~~ | ~~Universal Dashboard — role-aware home page~~ | 2e | DONE |
| ~~🔨~~ | ~~Admin user management — list users, toggle modules~~ | 2e | DONE (Session 6) |
| ~~🔨~~ | ~~Viewer role UI — read-only dashboard, invite flow~~ | 2e | DONE (Session 6) |
| ~~🔨~~ | ~~Admin claim flow — fresh database first-user claim~~ | 2e | DONE (existed since Session 3, transaction-safe in Session 8) |
| 🔨 | Firestore rules audit — verify all match blocks | 2e | Not started (needs Firebase deploy) |
| ~~🔨~~ | ~~Theme roster implementation — 10 themes~~ | 2f | DONE (Session 7) |
| ~~🔨~~ | ~~Ambient effects — 9 per-theme effects~~ | 2f | DONE (Session 7) |
| ~~🔨~~ | ~~Font loading — 8 Google Font families~~ | 2f | DONE (Session 7) |
| ~~🔨~~ | ~~Loading screen — 3 SVG stick-figure scenes~~ | 2f | DONE (Session 7) |

## Bugs

| | Bug | Module | Severity |
|---|-----|--------|----------|
| ~~🐛~~ | ~~Dashboard `useAllUsers` permission-denied leak for non-admins~~ | Admin | ~~Medium~~ — DONE (v0.2.13) |
| ~~🐛~~ | ~~Console errors when admin disables a user's active module~~ | Dashboard | ~~Medium~~ — DONE (v0.2.13) |
| ~~🐛~~ | ~~Admin cannot view other users' baby dashboards if their own baby module is disabled~~ | Admin | ~~Medium~~ — DONE (v0.2.13) |
| ~~🐛~~ | ~~Walking/Running list no pagination~~ | Body | ~~Medium~~ — DONE (ActivityLog 7→30) |
| 🐛 | Walking/Running list no date grouping | Body | Medium — delete UX now done (x button on all Body lists) |
| 🐛 | Floors recent list flat styling | Body | Low |
| ~~🐛~~ | ~~Stats score lacks context (no goal)~~ | Body | ~~Low~~ — DONE (SVG score ring, Session 6) |
| ~~🐛~~ | ~~Stats "THIS WEEK" card cramped~~ | Body | ~~Low~~ — DONE (weekly bar chart, Session 6) |
| ~~🐛~~ | ~~ActivityLog edit UX (inline → main-form)~~ | Body | ~~Low~~ — DONE (tap-to-populate pattern) |
| ~~🐛~~ | ~~Payment method bubbles don't deselect~~ | Budget | ~~Low~~ — DONE (toggle deselect) |
| ~~🐛~~ | ~~Negative/zero amounts accepted in inputs~~ | All | ~~Low~~ — DONE (min/step attrs) |
| ~~🐛~~ | ~~Baby tabs need edit (tap-to-populate)~~ | Baby | ~~Medium~~ — DONE (tap-to-populate on all 4 logs) |
| ~~🐛~~ | ~~Baby tabs need delete~~ | Baby | ~~Medium~~ — DONE (x button on all 4 logs) |
| 🐛 | Multi-baby not tested | Baby | Medium |
| 🐛 | Budget list no summary header | Budget | Low |
| 🐛 | Overall contrast low (Family Blue) | Theme | Low — noted in theme showcase |
| 🐛 | credential-already-in-use UID orphan | Auth | Low |

## Feature Ideas

| | Feature | Module | Effort |
|---|---------|--------|--------|
| ~~💡~~ | ~~Cycling tab — clone WalkingTab, swap enum~~ | Body | ~~Small~~ — DONE |
| 💡 | Yoga tab — duration + asana select | Body | Medium |
| 💡 | Daily challenge / streak | Body | Medium |
| 💡 | Configurable scoring weights | Body | Small |
| 💡 | Health API sync (phone steps/distance) | Body | Large |
| 💡 | Growth chart visualization | Baby | Medium |
| 💡 | Expense bulk import | Budget | Medium |
| ~~💡~~ | ~~Notifications + module requests — per-user alerts, admin broadcasts~~ | Admin | ~~Medium~~ — DONE (Session 9) |
| 💡 | Dev mode enhancements — role switcher, time travel | Dev | Medium |
| ~~💡~~ | ~~Climbing stick-figure loading animation~~ | UI | ~~Small~~ — DONE (Session 7, 3 SVG scenes) |

## Phase 2f: Theme Roster (Finalized 2026-04-09)

10 themes. 6 light+dark, 4 dark-only. Showcase: `SAM/design-samples/theme-showcase-all.html`

| # | Theme | Light | Dark | Accent | Family | Status |
|---|-------|-------|------|--------|--------|--------|
| 1 | Family Blue | ✅ | ✅ | `#60a5fa` sky blue | Family | Exists |
| 2 | Garden Path | ✅ | ✅ | `#16a34a` green | Nature | New (replaces Corporate Glass) |
| 3 | Lullaby | ✅ | ✅ | `#e8a44a` warm gold | Nursery | New (port from BabyTracker) |
| 4 | Rose Quartz | ✅ | ✅ | `#f472b6` pink | Soft | New |
| 5 | Charcoal | ✅ | ✅ | `#a1a1aa` silver | Minimal | New |
| 6 | Marauder's Map | ✅ | ✅ | `#c8a96e` parchment gold | Magic | New (HP-inspired) |
| 7 | Neon Glow | — | ✅ | `#ffb803` neon gold | Cyberpunk | Renamed (was Night City: Apartment) |
| 8 | Deep Mariana | — | ✅ | `#00e89a` bio-green + CRT | Deep | Exists (merged Nursery OS effects) |
| 9 | Industrial Furnace | — | ✅ | `#ff6820` molten orange | Industrial | Exists |
| 10 | Expecto Patronum | — | ✅ | `#b8d4e8` ghostly silver | Magic | New (HP-inspired) |

**Dropped:** Summit Instrument (similar to Lullaby), Corporate Glass (similar to Family Blue), Night City: Elevator (similar to Deep Mariana/Nursery OS), Nursery OS (merged into Deep Mariana), Midnight Feed (similar to Industrial Furnace/Neon Glow)

---

## P2 — Phase 2g: E2E Interaction Tests + Benchmarking

| | Item | Phase | Status |
|---|------|-------|--------|
| ~~🔨~~ | ~~E2E: Budget full expense flow (fill form → submit → verify in list)~~ | 2g | DONE |
| ~~🔨~~ | ~~E2E: Body configure → log floors → switch tab → log walk → verify~~ | 2g | DONE |
| ~~🔨~~ | ~~E2E: Payment bubble toggle (select → deselect → verify styling)~~ | 2g | DONE |
| ~~🔨~~ | ~~E2E: Body gear reconfigure (click gear → enable running → save → verify tab)~~ | 2g | DONE |
| ~~🔨~~ | ~~E2E: Baby add child → navigate to child → log feed → verify in recent~~ | 2g | DONE |
| ~~🔨~~ | ~~Bench: build time measurement (vite build with timing)~~ | 2g | DONE |
| ~~🔨~~ | ~~Bench: bundle size report from dist/~~ | 2g | DONE |
| ~~🔨~~ | ~~Bench: test suite duration tracking (unit + E2E)~~ | 2g | DONE |

## P3 — Future

> **Current focus:** Phase 3 Baby → Kid. Plans 1-7 complete (Plan 7 — Life Journal — shipped as actual release v0.2.11, first non-pre- tag since v0.2.6). Counting-moment *celebration surfacing* deferred to Plan 8 (Smart Alerts). Plan 9 (Export/Import) deferred. Two pending AFP-scope brainstorms: **B (Budget → Investment)** and **C (Yoga)**, followed by **D (Body → Gamification)**. Two optional out-of-repo brainstorms park at **E (ft web)** and **F (passforge vault)**.

### Pending Brainstorms

Per `docs/specs/2026-04-13-phase3-vision-design.md` § 7, each brainstorm produces a spec at `docs/specs/2026-04-XX-phase3-<topic>-design.md`, then per-feature plans in `docs/plans/`. Brainstorm order is input-richness order — hardest design work in the middle, easiest at the end.

| # | Brainstorm | Scope | Status | Input richness | Notes |
|---|------------|-------|--------|----------------|-------|
| A | Baby → Kid | AFP | ✅ Done | High (BabyTracker roadmap v0.4–v0.5 pre-mapped) | Spec + 7 plans written, Plans 1–7 shipped as of v0.2.11 |
| B | Budget → Investment | AFP | 🔨 Pending | Low (Finularity mostly port-focused — blank canvas) | Savings goals, recurring expenses, net worth, spend insights. Hardest of the four — placed second while rhythm is fresh |
| C | Yoga | AFP | 🔨 Pending | Medium (plan scaffold exists at `2026-04-15-phase3-body-yoga-plan.md`) | Duration-based scoring, asana list size, breathing exercises. Scaffold plan exists but awaits decisions before expansion |
| D | Body → Gamification | AFP | 🔨 Pending | Medium (Floor-Tracker: 30-challenge catalog, badges, usernames, streaks) | Lightest — mostly cherry-picking features over existing scoring data |
| E | ft web layer | `ft/` repo | 🔮 Optional | — | Markdown-blogger frontend. Triggered by `ft/`'s roadmap, not AFP's |
| F | passforge web vault | `passforge/` repo | 🔮 Optional | — | Web UI + browser extension. Triggered by `passforge/`'s roadmap |

### Module Evolution

| | Item | Module | Notes |
|---|------|--------|-------|
| 🔮 | Toddler/kid tracking — milestones, meals, potty training, vaccinations, activities | Baby | Current logs are infant-focused. Needs age-aware UI that evolves as child grows |
| 🔮 | Investment planning — savings goals, recurring expenses, net worth, financial insights | Budget | Current module is expense-only. Scan Finularity for planned features |
| 🔮 | Motivational messages, challenges, milestones, streaks | Body | Module is already wholesome. Add gamification layer on top of existing scoring |

### Infrastructure

| | Item | Effort |
|---|------|--------|
| 🔮 | Go API gateway — second StorageAdapter impl | Large |
| 🔮 | S3 + CloudFront deployment | Medium |
| 🔮 | E2E visual regression — themes x modules screenshots | Medium |
| 🔮 | Playwright V8 coverage for E2E | Small |
| 🔮 | Proper auth providers — email link, Apple | Medium |
| 🔮 | Offline-first UX — retry, queue | Large |

---

## P3 — Phase 3 Implementation Detail

| | Item | Brainstorm | Status |
|---|------|------------|--------|
| ✅ | **Budget: Auto tab** — fuel, travel, maintenance tracking | Phase 2c | DONE (v0.2.18) |
| 🔨 | **Budget: Rolling-average mileage cards** — 5-fill + lifetime rolling avg (km/L, cost/km) | Phase 2c | Deferred |
| 🔨 | **Budget: Mileage divergence panel** — computed vs displayed mileage reconciliation UI | Phase 2c | Deferred |
| 🔨 | **Budget: Multi-vehicle support** — select active vehicle per entry; profile stores vehicle roster | Phase 2c | Deferred |
| 🔨 | **Budget: Service-due notification** — via existing `useNotifications` module (admin alert or user alert) | Phase 2c | Deferred |
| 🔨 | **Budget: Operator/airline tracking** — structured origin/destination + airline/operator for travel entries | Phase 2c | Deferred |
| 🔨 | **Budget: Charts** — cost-per-km trend, monthly fuel cost, cost-per-trip | Phase 2c | Deferred |
| 🔨 | **Budget: Savings Goals** — target amounts + progress rings | B | Not started |
| 🔨 | **Budget: Recurring** — subscription automation (needs cron) | B | Not started |
| 🔨 | **Budget: Net Worth** — asset/liability snapshots + trends | B | Not started |
| 🔨 | **Budget: Insights** — YoY category analysis + anomalies | B | Not started |
| 🔨 | **Body: Yoga Tab** — duration input + asana selector | C | Scaffolded |
| 🔨 | **Body: Scoring Update** — duration-based formula integration | C | Not started |
| 🔨 | **Body: Challenges** — 30-activity catalog | D | Not started |
| 🔨 | **Body: Gamification** — badges, streaks, and level-ups | D | Not started |
| 🔨 | **Body: Usernames** — public registry for sharing/competition | D | Not started |
| 🔨 | **Baby: Smart Alerts** — active notification for counting moments | Plan 8 | Not started |
| 🔨 | **Baby: Data Portability** — JSON/CSV export/import | Plan 9 | Not started |

---

## Done

### 2026-05-04 — Session 20 (Budget — Auto tab: fuel, travel, maintenance, v0.2.18)

- [x] **Discriminated `meta` union on `Expense`** — `FuelMeta`, `TravelMeta`, `MaintenanceMeta` types capture vehicle/travel/service data; backwards compatible with `meta: undefined`
- [x] **Auto tab in Budget module** — New tab with quick-add buttons (Fuel/Trip/Service), inline meta sub-form, service-due banner (auto-clears on new maintenance entry)
- [x] **`fuel-math.ts` module** — Pure helpers: `computeMileage`, `latestOdometer`, `dueMaintenance`, `isServiceDue`
- [x] **`meta-utils.ts` module** — `metaKindFor` discriminator, `defaultMeta` factory
- [x] **`updateExpense` hook** — Enables tap-to-populate edit on Auto tab
- [x] **Tap-to-populate edit pattern** — Row selection → form pre-population → Update button; matches Body module
- [x] **Save-and-stay UX** — Adding Fuel/Travel from main form clears and stays; no redirect
- [x] **Enum entries in `BudgetMsg`** — All toast strings (logging, validation, service-due alerts) live in enum
- [x] **Backwards compatibility** — Existing expenses parse without `meta` field
- [x] **Version**: 0.2.17.2 → 0.2.18

---

### 2026-05-01 — Session 19 (Phase 2i fine-print: glyph sizing + viewport-aware + size tier picker, v0.2.17.2)

- [x] **Glyph render parity (80% of container)** — SVG/CSS shapes now render at 80% of their wrapper, matching emoji character-cell padding. Fixes "leaves too big on phone" caused by the SVG/emoji rendering disparity.
- [x] **Viewport-aware size multiplier** — `useViewportSizeMultiplier` hook auto-shrinks particles to `0.65×` on mobile (`max-width: 640px`). Desktop unchanged.
- [x] **`<SizeTierPicker>`** — new tier picker in Profile (Small/Medium/Large = 70/100/140 multiplier), persisted as `UserProfile.effectSize`. Compounds with viewport multiplier.
- [x] **`bucketEffectSize()` util** — handles legacy values; default `100` via consumer fallback. No migration.
- [x] **`AmbientEffects` math** — `--fx-size` and `--fx-scale` now `(effectSize / 100) × viewportMultiplier × depthRange`.
- [x] **CLAUDE.md branch-naming convention** — comedy-arc queue + reserved-list documented in repo so future Claude sessions don't burn trial-ending names on routine PRs.
- [x] **Tests**: +24 unit (558 → 582), +4 E2E (77 → 81)
- [x] **Version**: 0.2.17.1 → 0.2.17.2 (sub-patch; leaves 0.2.18 reserved for Phase 2j Iconography)

---

### 2026-05-01 — Session 18 (Phase 2i polish: learning slots filled + E2E regression, v0.2.17.1)

- [x] **Locked 3 TODO(nick) learning-mode slots** with permanent values + reasoning comments — `INTENSITY_TIERS` labels (Off/Subtle/Standard/Lively/Maximum) finalized; depth-scaling constants in `AmbientEffects.tsx` documented (scale 0.5–1.5, opacity 0.25–0.8, size 10–26px, duration 1×–2×); Marauder's Map atmosphere values explained (fold-crease geometry + vignette tuning)
- [x] **30 new E2E regression tests** in `e2e/themes-2.0.spec.ts` codifying Phase 2i invariants — atmosphere per theme, Charcoal silent, glyph dispatch, Patronus preserved, tier picker behavior, reduced-motion respect, Theme Tour. E2E suite grew 47 → 77.
- [x] **Documentation** — `src/themes/README.md` Implementation Notes section (atmosphere CSS contract + depth-scaling math); `e2e/README.md` updated
- [x] **Version**: 0.2.17 → 0.2.17.1
- [x] **Parallel agent dispatch** — Agent A (TODO slots, src/) + Agent B (E2E tests, e2e/) ran in parallel on disjoint file regions; merged via 2 commits + coordinator wrap-up

---

### 2026-04-30 — Session 17 (Phase 2i Themes 2.0 implementation, v0.2.17)

- [x] **Atmosphere ×9 themes** — Family Blue (cloud drift), Garden Path (dappled light), Lullaby (vellum nightlight), Rose Quartz (pearlescent shimmer), Marauder's Map (parchment + vignette), Neon Glow (CRT raster + chromatic aberration), Deep Mariana (caustic ripples), Industrial Furnace (molten glow), Expecto Patronum (silver mist + starlight). Charcoal silent by design.
- [x] **8 shape-primitive glyphs** — Snowflake (SVG), Leaf (SVG), Star/Heart/InkBlot/Bubble/Ember/Wisp (CSS). Patronus emoji animals preserved via filtered render.
- [x] **Depth-correlated particle scaling** — single `depth` value drives scale, opacity, size, duration with small jitter. Parallax illusion, not random confetti.
- [x] **`<IntensityTierPicker>`** — 5-button tier row replaces range slider. `bucketIntensity()` handles legacy values on read (no migration).
- [x] **DevBench Bench A** — `benchMeal`, `benchNeed`, `benchMilestone` generators + buttons. All anchor at `todayStr()`.
- [x] **DevBench Theme Tour** — cycles all 10 themes (3s hold). `DevBenchInner` extraction keeps hooks unconditional.
- [x] **Version**: 0.2.16 → 0.2.17

---

### 2026-04-30 — Session 16 (Theme Polish + Phase 2i Brainstorm, v0.2.16)

- [x] **Polish**: `usePrefersReducedMotion` early-return in `AmbientEffects`, `ThemeSwatch` mini-mockup component (theme bg + accent + "Aa" in display font), deterministic sweep-particle opacity (Neon Glow scanline fix), Charcoal silence-by-design note in `src/themes/README.md`
- [x] **Phase 2i brainstorm**: 7-question design dialogue resolved — atmosphere layers per theme (CSS-only, Charcoal silent), 8 shape-primitive glyphs replacing emoji, Patronus filtered-emoji preserved, depth-correlated particle scaling, 5-button tier slider, DevBench catch-up generators, Theme Tour button
- [x] **Phase 2i spec written**: `docs/specs/2026-04-30-phase2i-themes-2.0-design.md` (Goals, Architecture, Per-Axis Designs, Testing, Phasing, Risks, Learning-Mode slots)
- [x] **Phase 2j carve-out**: Per-row category icons (Iconography) split as separate future phase (`0.2.18`). Floors keep existing Unicode `↑`/`↓` arrows; other modules get themed SVG icons later
- [x] **Version**: 0.2.15 → 0.2.16

---

### 2026-04-29 — Session 15 (Phase 2h Universal List Controls, v0.2.15)

- [x] **TimeRange enum** — Renamed from `BudgetView` for cross-module reuse
- [x] **Shared `filterByDateRange`** — Promoted to `src/shared/utils/filter.ts` with key extractor; works on both `date` and `createdAt`-keyed entries
- [x] **`paginate()` primitive** — `src/shared/utils/paginate.ts` with `totalPages` helper
- [x] **`useListControls()` hook** — Bundled session state for time-range, page-size, page, show-all; auto-resets on filter change
- [x] **`<ListControls>` component** — Pill row + page-size selector `[5, 10, 25, 50, 100, 500]` + page jumper
- [x] **`<ListShowMoreFooter>` component** — Contextual `Show all N` / `Load N remaining` button
- [x] **Wired 11 list surfaces** — Body (Floors, ActivityLog), Baby (Feed, Sleep, Growth, Elimination, Meals, Needs, Milestones), Budget (ExpenseList, IncomeList), Admin (Invites). BroadcastsTab has no list yet — wiring pending future work.
- [x] **Retired `CONFIG.PAGE_SIZE`** — Replaced by hook default (still 25)
- [x] **Daily Ledger visual refactor** — Sticky `<DateGroupHeader>` (Today/Yesterday + structural fallback with ISO week number), `<RowTime>` tabular-nums prefix, `<FloorMagnitudeBar>` inline split bar
- [x] **`relativeDateLabel` util** — Two-tier date formatting (relative for hot dates, structural for cold)
- [x] **All 11 list surfaces redesigned** — Replaced per-row card markup with hairline `border-t` between rows, sticky day headers per date group, day-of-week prepended to every date display
- [x] **Theme-agnostic** — All 10 themes inherit correctly via existing CSS variables. Design preview committed: `SAM/design-samples/list-rows-redesign.html`
- [x] **Preserved behaviors** — Swipe-to-delete unchanged, inline `×` delete unchanged, tap-to-populate-form active-row treatment unchanged
- [x] Unit tests added: `filter.test.ts` (5), `paginate.test.ts` (8), `useListControls.test.ts` (6), `ListControls.test.tsx` (12), `ListShowMoreFooter.test.tsx` (4), `relative-date.test.ts` (4), `DateGroupHeader.test.tsx` (3), `RowTime.test.tsx` (3), `FloorMagnitudeBar.test.tsx` (5) — total +50, plus +1 from updated ActivityLog tests
- [x] Unit tests: 469 → 520 (+51)
- [x] E2E tests: 47 (all passing — pre-existing dev-mode profile regression fixed in `auth-context.tsx`)

### 2026-04-29 — Session 14 (Enhanced Theme System & Refactor, v0.2.14)

- [x] **Enhanced Ambient Theme System** — Implemented granular 0-100% intensity control for all theme effects.
- [x] **AmbientEffects Component** — Created a dynamic React-based particle renderer with pure render logic and seeded randomization.
- [x] **Expecto Patronum Enhancement** — Added silver glow manifestation animations for a pool of 12 spirit animals.
- [x] **Formal Patronus Effect** — Formally integrated `patronus` into the theme effect type system.
- [x] **React 19 Profile Sync** — Optimized `ProfilePage` using the "Adjusting state during render" pattern to replace `useEffect` for property-to-state synchronization.
- [x] **Behavioral CSS Refactor** — Consolidated theme effects into reusable utility classes (`fx-fall`, `fx-rise`, etc.) driven by CSS variables.
- [x] **Reactive Local Dev** — Fixed local development to reactively sync `localStorage` changes with the Auth context.

### 2026-04-19 — Session 13 (Maintenance & Budget UX, v0.2.12)

- [x] **Budget UX Alignment** — Replaced category dropdowns with interactive emoji bubbles; defaults set via `CONFIG.BUDGET_VISIBLE_CATEGORIES`.
- [x] **Additive Presets** — Budget amount buttons now increment the total instead of overwriting.
- [x] **Security Fix** — Firestore rules patched to allow non-admin users to persist `theme` and `colorMode`.
- [x] **Reactive Logs** — Integrated `useVerbose` hook; console overlay pill (`>_`) visibility now toggles instantly.
- [x] **Console Copy** — Added "Copy" button to `ConsoleOverlay` for easy serialization of debug logs.
- [x] **Shared UI** — Extracted `PaymentMethodBubble` component for cross-form consistency.
- [x] **Agent Mandates** — Created `GEMINI.md` at root and established global skills for architectural reviews and exploration.
- [x] **Versioning** — Bumped to `v0.2.12` in `package.json` and `deploy.yml`.

### 2026-04-15 — Session 12 (Phase 3 Plan 7 — Life Journal, v0.2.11 actual release)

- [x] Phase 3 Plan 7 (Life Journal) — D/W/M aggregation view across all 7 baby subcollections (feeds, sleep, growth, elimination, meals, milestones, needs)
- [x] Pure aggregation layer — `src/modules/baby/journal/` subdir (`constants.ts`, `types.ts`, `range.ts`, `aggregate.ts`) — fully testable without Firestore mocks
- [x] `useJournalData` hook composing 7 `useBabyCollection` listeners + memoized summary
- [x] `JournalPicker` (D/W/M grain selector + period stepper), `JournalCard` (generic wrapper), `LifeJournalView` (composite — 7 summary cards)
- [x] Counting moments — compute-on-read threshold detection for diapers/feeds/meals/milestones. No persisted counters.
- [x] Journal tab placed at position 2 in `ChildDetail` (Dashboard → Journal → Feeding → ...)
- [x] `DashboardTab` 9A-minimal enrichment — live today-stat strip above navigation grid, "See full journal →" link
- [x] Version bumps — `package.json` 0.2.6 → 0.2.11 (stale through pre- tags), `deploy.yml` `VITE_APP_VERSION` bumped. **Actual 0.2.11 release, not pre- tag**
- [x] Unit tests: 435 → 469 (+34) — 9 range, 14 aggregate, 4 JournalPicker, 5 LifeJournalView, 2 DashboardTab strip

### 2026-04-15 — Session 10 (Phase 2g E2E, prod fixes, Phase 3 Plans 1-2)

- [x] Phase 2g: 5 E2E interaction flows + build bench script (v0.2.6 tag)
- [x] Prod fix: expense redirect `/expenses` → `/budget`
- [x] Prod fix: `firestore.indexes.json` collectionGroup index for `useAllUsers`
- [x] CI workflow: `firebase-rules.yml` deploys indexes + rules together
- [x] Firebase data structure doc (`docs/firebase-data-structure.md`)
- [x] Phase 3 Plan 1 (Foundation) — 8 enums, 5 types, stage.ts, 9 tests
- [x] Phase 3 Plan 2 (Suggestions) — `computeActiveSuggestions` + 2 hooks + 2 UI components + 3 integration surfaces (Layout toast, Dashboard banner, ChildDetail strip)
- [x] Phase 3 Plan 10 (Yoga) — plan file added, awaiting brainstorm
- [x] Enum improvements: `PottyType` → `PottyTrainingEvent`, `MealPortion` expanded 5→7 values
- [x] Unit tests: 320 → 384 (+64)

### 2026-04-14 — Session 9 (Notifications, module requests, Phase 3 brainstorm)

- [x] Notifications module — per-user notification bell, admin alert broadcasts, Broadcasts tab in AdminPanel
- [x] Module request buttons in Profile — users can request access to Body/Baby/Budget modules
- [x] Admin alerts on incoming module requests
- [x] View user dashboard — admin can navigate directly into any user's module view
- [x] Phase 3 brainstorm — Baby→Kid evolution, budget investments, body gamification (7 plan files, 2 spec files)
- [x] Phase 2d (Profile) and Phase 2e (Admin+Viewer) marked ✅ Core done

### 2026-04-10 — Session 8 (E2E regression, code hygiene, ToastType enum)

- [x] Fixed 10 failing E2E tests — `isVisible()` wait bug, strict mode violations, expandable theme picker
- [x] `initializeAdmin` wrapped in `runTransaction` (atomic app/config + profile creation)
- [x] Admin claim flow confirmed already implemented — marked done in ROADMAP
- [x] `ToastType` enum — replaced 62 raw string literals across 20 files
- [x] Message enum sweep — 18 raw toast strings moved to enums across 8 files
- [x] CLAUDE.md updated with dynamic message template note
- [x] E2E tests: 32 passing → 42 passing (0 failing)

### 2026-04-10 — Session 7 (Loading screen, Phase 2f themes)

- [x] Loading screen — 3 SVG stick-figure scenes (Climber, Athlete, Reader) randomly selected per mount
- [x] Brand text — "IT STARTED ON APRIL FOOLS DAY" with staggered letter reveal animation
- [x] useMinDelay hook — 1s prod, 0 dev (prevents flash on fast loads)
- [x] AnimationViewer — preview page at /animations with pill tab switcher + text toggle
- [x] Code splitting — React.lazy + Suspense for all routes, per-route Vite chunks
- [x] 10 themes implemented — 6 light+dark, 4 dark-only (dropped 3 old, renamed 1, added 6 new)
- [x] 8 Google Font families — distinct pairings per theme via --font-display/--font-body CSS variables
- [x] 9 ambient effects — snowflakes, leaves, stars, hearts, ink, scanline, CRT+bubbles, embers, wisps
- [x] Expandable theme picker in Profile — 2-col showcase grid with font/effect info
- [x] Theme migration — resolveThemeId() maps dropped/renamed theme IDs to current themes
- [x] fx-ambient container + effects.css animations
- [x] 15 theme system tests + circular dependency fix
- [x] Multi-agent README sweep — all 29 per-directory READMEs updated
- [x] Unit tests: 281 → 320 (+39)
- [x] E2E tests: 42 (unchanged)
- [x] Test files: 38 → 42 (+4)

### 2026-04-09 — Session 6 (Admin pages, viewer flow, body stats overhaul, themes design)

- [x] Tabbed AdminPanel — Invites/Users tabs with pill switcher
- [x] InvitesTab — copy-link, delete with undo toast, pending/redeemed badges
- [x] UsersTab — color-coded module chips (indigo/emerald/pink), stat bar, toggle switches, accordion edit
- [x] useAdminActions hook — updateUserModules + updateUserRole
- [x] Viewer invite flow — role/viewerOf on InviteRecord, role selector in InviteGenerator, redemption creates viewer profile
- [x] Body Stats overhaul — SVG score ring, weekly day bars, dynamic stat cards, dynamic quick actions
- [x] Daily goal builder — per-activity sliders in BodyConfigForm, preset chips, live ring preview, zone labels
- [x] Scoring reweight — 1/0.5/10/20/15 (floors up/down, walk/run/cycle per km), CYCLE_PER_KM added
- [x] List hover (+) — per-row duplicate button on ActivityLog + FloorsTab (Option C)
- [x] Reset today — button below stat cards with undo toast
- [x] Role tests — viewer (4), admin (5), cross-role gates (7) = 16 new tests
- [x] Code hygiene #19 — extracted formatDistance + sortNewestFirst to shared/utils, 10 files deduplicated
- [x] Prettier setup — .prettierrc + eslint-config-prettier + format/format:check scripts
- [x] ESLint 57→0 — fixed exhaustive-deps, set-state-in-effect, preserve-manual-memoization
- [x] AdminMsg enum — 8 toast messages moved to constants/messages.ts
- [x] Theme roster finalized — 10 themes designed, showcase approved (SAM/design-samples/theme-showcase-all.html)
- [x] Unit tests: 248 → 281 (+33)
- [x] E2E tests: 38 → 42 (+4)

### 2026-04-08 — Session 5 (Dashboard, consistency sweep, review fixes)

- [x] Universal Dashboard — role-aware home at `/`, greeting, module cards, admin selector, viewer banner
- [x] targetUid pattern — 6 hooks accept optional uid for read-only data scoping
- [x] DashboardCard with shadow-sm + accent-muted tint (theme-aware)
- [x] Header logo replaces AFP text, links to Dashboard
- [x] useAllUsers admin hook
- [x] DevBench expansion — Cycling, Income, Growth, Settlement generators + file split + error handling
- [x] Tap-to-edit on 6 list views (FloorsTab redirect buttons, ActivityLog populate form, 4 baby logs)
- [x] Consistent pagination (CONFIG.PAGE_SIZE = 25) on all 8 lists
- [x] Undo delete with toast action (CONFIG.UNDO_DURATION_MS) on all 6 deletable lists
- [x] m↔km unit conversion fix + CONFIG.METERS_PER_KM constant
- [x] Baby: child creation auto-navigate, dashboard cards tappable, sleep defaults, growth validation
- [x] Toast system extended with action button + custom duration
- [x] P0 coverage gaps: profile.ts, validation.ts, error.ts, date.ts utilities
- [x] Unit tests: 189 → 244 (+55)
- [x] E2E tests: 38 (all passing)
- [x] Specs: Dashboard design, Theme analysis, 3 implementation plans
- [x] Nick's review: docs/revz/nick-review-session5.md (6/7 fixed, #1 add-missed-day deferred)

### 2026-04-07 — Session 4 (Bug fixes, Phase 2c completion, Dashboard planning)

- [x] Bug fix: payment bubble toggle deselect
- [x] Bug fix: number input min/step constraints (all modules)
- [x] Bug fix: ActivityLog pagination 7→30 (Walking/Running/Cycling)
- [x] Bug fix: baby entry delete on all 4 log components
- [x] Feature: CyclingTab + config form enabled
- [x] Feature: body reconfigure via gear button
- [x] Feature: budget time-range filter (Today/Week/Month/All)
- [x] Feature: amount presets [10][20][50][100][200]
- [x] Feature: ReconciliationView (CC charges vs settlements)
- [x] E2E fix: Cycling config label updated
- [x] Specs: Universal Dashboard design + Theme system analysis
- [x] Plan: Universal Dashboard implementation (9 tasks)
- [x] Unit tests: 189 → 217 (+28)
- [x] E2E tests: 38 (all passing)

### 2026-04-07 — Session 3 (Phase 2 sprint)

- [x] Phase 2.0: Shared foundation — all enums, types, Firestore rules, routes
- [x] Phase 2a: Body module redesign — config gate, tabbed UI, stats dashboard, edit/backfill
- [x] Phase 2b: Baby module redesign — multi-child, nested collections, BabyLanding, ChildDetail
- [x] Phase 2c: Budget module — income tracking, payment methods, summary cards, budget-math
- [x] Phase 2d: Profile page — theme picker, color mode, username, changelog viewer
- [x] 7 bug fixes: stats buttons, running tab empty, activity sort/edit, floor pagination, FAB color, income crash, profile nav
- [x] DevBench: dev-only seed panel with ×100/×1k bulk, nuke localStorage
- [x] 3 design samples: warm-instrument, dense-editorial, playful-streak
- [x] E2E rewrite: 38 tests for Phase 2 UI (was 41, 33 failing)
- [x] Coverage analysis: `docs/revz/2026-04-07-coverage-analysis.md`
- [x] Unit tests: 60 → 189 (+129)
- [x] E2E tests: 41 → 38 (rewritten for Phase 2, all passing)

### 2026-04-04 — Session 2 (P0/P1/P2 sprint)

- [x] Hash → BrowserRouter migration
- [x] Body module: walk/run tracking with scoring
- [x] Baby module refactor with generic hooks
- [x] ThemeId → enum
- [x] E2E tests updated for BrowserRouter
- [x] Unit tests: 32 → 60

### 2026-04-04 — Session 1 (Firebase + auth)

- [x] Google Sign-In with anonymous account linking
- [x] Admin bootstrap via Firebase Admin SDK
- [x] Firestore rules deployed
- [x] Debug page, profile photo, no-profile wall
- [x] GitHub secrets + CI/CD

### pre-0.0.5 (initial commit)

- [x] Phase 1 full scaffold — React 19 + Vite 8 + TS + Tailwind v4 + Firebase
- [x] 7 themes, auth, storage adapter, 3 modules, admin, PWA
- [x] 32 unit tests + 35 E2E tests

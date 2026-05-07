# Changelog

All notable changes to AFP ("It Started On April Fools Day") are documented here.

---

## [0.2.19] — 2026-05-07 (The Rehearsal: review-finding response + doc sweep)

`feat/the-rehearsal` — addressed 23 of 24 review-finding tasks from `docs/revz/2026-05-01-the-fine-print-{march-in,nattu-kaka,sharma-ji}.md` plus 1 Chanakya tactical from `docs/revz/2026-05-01-who-planned-it-chanakya.md`. No user-visible feature changes; one user-visible bug fix (mobile particle size).

### Fixed
- **`--fx-scale` × `--fx-size` double-multiplier** (sharma-ji tight-coupling). `sizeMultiplier` was applied to BOTH `--fx-scale` (used in `transform: scale()`) AND `--fx-size` (used as `font-size`). On mobile this compounded: 0.65 × 0.65 = 0.42 of desktop, not the intended 0.65. Fix: `--fx-scale` is now depth-only (parallax illusion, viewport-independent); `--fx-size` carries the multiplier (absolute pixels).
- **Bucket-on-display drift** (sharma-ji data-integrity). For stored values that aren't tier-exact (e.g., legacy `effectSize: 60`), `<SizeTierPicker>` highlighted "Small" but `<AmbientEffects>` rendered the raw 60 (drift up to 14%). Fix: `Layout.tsx` now passes `bucketEffectSize(profile.effectSize)` so render and display align. Storage stays raw.

### Changed — magic-number cleanup (P0 — all 3 reviewers consensus)
- **`EFFECT_SIZE_DEFAULT` exported from `effectSize.ts`** — replaces 3 hardcoded `100` literals in `AmbientEffects.tsx`, `Layout.tsx`, `ProfilePage.tsx`.
- **`bucketEffectSize` boundaries derived from tier midpoints** — `Math.floor((SMALL+MEDIUM)/2)` and `Math.ceil((MEDIUM+LARGE)/2)` instead of hardcoded `<= 84` / `>= 121`. Renaming a tier value updates the buckets automatically. Existing test contract preserved.
- **Viewport multiplier constants extracted** — `MOBILE_PARTICLE_MULTIPLIER`, `DESKTOP_PARTICLE_MULTIPLIER`, `MOBILE_BREAKPOINT_PX` (now in `CONFIG.MOBILE_BREAKPOINT_PX`, matches Tailwind's `sm:`).
- **`||` → `??`** on `existingProfile?.modules` in `ProfilePage.tsx:69`.

### Changed — API hygiene (P1)
- **`saveAppearance` → options-object signature** (march-in / nattu-kaka / sharma-ji SOLID). Was `(uid, theme, colorMode, intensity, size, profile)` — 6 positional params, swap-bug risk on the two `number` types. Now `(uid, settings: AppearanceSettings, existing)` where `AppearanceSettings = Pick<UserProfile, 'theme' | 'colorMode' | 'effectIntensity' | 'effectSize'>`. Future appearance dimensions are a one-line union change instead of a positional fan-out.
- **Silent-fail saves now log via `verr('[AFP:profile:save]', field, err)`** — slider/picker rejections still don't toast (would DoS the UI on drag), but `verr` always logs to `console.error` so a Firestore permission regression isn't invisible.
- **`useMatchMedia(query)` extracted** to `src/shared/hooks/useMatchMedia.ts`. Generic CSS media-query subscriber; `usePrefersReducedMotion` and `useViewportSizeMultiplier` consume it directly.
- **`useViewportSizeMultiplier` promoted** to `src/shared/hooks/useViewportSizeMultiplier.ts`. Single-responsibility hook, viewport→multiplier transform.
- **`GLYPH_INNER_SIZE = '80%'` constant** in `glyph-primitives.tsx` replaces 16 inline `'80%'` / `"80%"` literals.

### Changed — refactors (P2)
- **`GlyphWrapper` simplified to single-percentage layer** — wrapper at 80% of particle container, inner shapes at 100% of wrapper. Was wrapper-100% × inner-80% (double-percent indirection). Visually identical, less mental layering.
- **Glyph styles hoisted to module-level consts** — `STAR_STYLE`, `HEART_LEFT_LOBE_STYLE`, etc. Avoids per-render fresh-object allocation when N=20+ particles are mounted.

### Changed — test hygiene (P3)
- **`stubMatchMedia(mode)` helper** in `AmbientEffects.test.tsx` — single hoisted helper replaces 8 duplicated `vi.stubGlobal('matchMedia', …)` blocks across 5 describe groups.
- **E2E theme/intensity/size labels derived** from `INTENSITY_TIERS` / `EFFECT_SIZE_TIERS` constants. Renaming a tier no longer breaks tests.
- **`waitForTimeout(300)` replaced with `expect.poll(sampleAvgSize)`** in `e2e/the-fine-print.spec.ts`. Deterministic; faster on healthy systems, no flake on slow CI.

### Changed — Chanakya tactical
- **`VITE_APP_VERSION` derived from `package.json`** in `.github/workflows/deploy.yml`. New step exports `VITE_APP_VERSION=v$(node -p "...")` to `$GITHUB_ENV`. Prevents the 3-version literal drift Chanakya flagged.

### Added
- **`useMatchMedia.ts`** — generic CSS media-query subscriber (returns `false` outside browser environments).
- **`useViewportSizeMultiplier.ts`** — `0.65` on mobile, `1.0` on desktop. Built on `useMatchMedia`.
- **`EFFECT_SIZE_DEFAULT`** — exported from `effectSize.ts`, derived from `EFFECT_SIZE_TIERS[1].value` (Medium = 100).
- **`CONFIG.MOBILE_BREAKPOINT_PX`** — 640, matches Tailwind's `sm:` breakpoint.
- **`bucketX + X_TIERS` design idiom documented in CLAUDE.md** — formal pattern for any tier-exposed-but-raw-stored UI dimension. Both `INTENSITY_TIERS`/`bucketIntensity` and `EFFECT_SIZE_TIERS`/`bucketEffectSize` follow it.

### Tests
- **Unit**: 637 → 648 (+11)
  - **`effectSize-roundtrip.test.ts`** (new, 5 tests) — locks `UserProfile.effectSize` persistence: round-trip via localStorage adapter, legacy-absent-field path, idempotent tier round-trip, non-tier value buckets-on-display.
  - **`ProfilePage.silent-fail.test.tsx`** (new, 2 tests) — locks the contract: when `adapter.save` rejects, `verr` is called with the prefix; no user-facing toast fires.
  - **AmbientEffects reduced-motion × effectSize interaction** (4 new parametric tests) — guards against future regressions where size logic runs before reduced-motion check.
- **E2E**: 81 → 82 (+1)
  - **Picker → AmbientEffects pipeline** — clicks `Large`, navigates to dashboard, polls `--fx-size` until larger than Medium baseline. Locks the user-flow path that wasn't covered by the viewport-scaling test.

### Documentation
- **Comprehensive README/docs sweep** — 11 files updated to reflect Phase 2i + the-rehearsal terminology: root `README.md`, `CLAUDE.md`, `docs/firebase-data-structure.md`, 8 per-directory READMEs (`shared/`, `shared/hooks/`, `shared/components/`, `shared/utils/`, `shared/storage/`, `constants/`, `themes/`, `e2e/`).
- **Removed obsolete claim** in `src/themes/README.md`: "Per-effect glyphs are emoji today" (false since Phase 2i shipped 8 shape primitives in v0.2.17).
- **Fixed terminology drift**: `effectCount` → `effectIntensity` and `effectSize` typed as number not string in `docs/firebase-data-structure.md`; "effect sliders" → "intensity + size tier pickers" throughout.

### Implementation notes
- 22 modified + 4 new files (~370 insertions / ~240 deletions).
- All 23 fine-print review-finding tasks done (P0×4, P1×5, P2×9, P3×4 + #25 resolved upstream). Skipped: none.
- One Chanakya tactical (#38) included; structural items #27/#30/#32/#33 etc. deferred to future branches per the comedy-arc queue.
- Branch: `feat/the-rehearsal`. Tag candidate: `v0.2.19`.

### Reviewer reports archived
- `docs/revz/2026-05-01-the-fine-print-march-in.md` (drill sergeant — 4 SOP violations)
- `docs/revz/2026-05-01-the-fine-print-nattu-kaka.md` (TS/React blunt mode — 9 punch-list items)
- `docs/revz/2026-05-01-the-fine-print-sharma-ji.md` (mentor — testing gaps + SOLID + DRY)
- `docs/revz/2026-05-01-who-planned-it-chanakya.md` (whole-repo strategic — Firebase coupling, data export, schema versioning, dependency posture)

---

## [0.2.18] — 2026-05-04 (Budget — Auto tab: fuel, travel, maintenance)

### Added
- **Budget — Auto tab** (`feat/who-planned-it` series). New tab inside Budget module for Vehicle + Travel expenses with quick-add buttons (⛽ Add Fuel · 🚕 Add Trip · 🔧 Service), inline meta sub-form, and a derived service-due banner. Tap-to-populate edit pattern matching Body module. All toast strings live in `BudgetMsg` enum.
- **Discriminated `meta` union on `Expense`** — New type system for optional metadata: `FuelMeta` (liters, pricePerLiter, odometer, tripOdo, displayedMileage, fullTank), `TravelMeta` (origin, destination, distance), `MaintenanceMeta` (odometer, nextService). Existing expenses without `meta` continue to work unchanged.
- **`fuel-math.ts` module** — Pure computation helpers: `computeMileage(legStart, legEnd)`, `latestOdometer(expenses)`, `dueMaintenance(expenses, lastServiceOdo?)`, `isServiceDue(nextService)`. No storage coupling.
- **`updateExpense` hook in `useExpenses`** — Complements existing `addExpense`/`deleteExpense`. Enables tap-to-populate edit on Auto tab (row → form pre-population → Update button).
- **`meta-utils.ts` module** — `metaKindFor(meta)` discriminator, `defaultMeta(kind)` factory. Extracted to avoid react-refresh warnings when meta union types are used inline in component render.

### Conventions honored
- Tap-to-populate edit (no inline-row editing) on the Auto tab — matches Body module UX.
- Save-and-stay (no redirect) when adding Fuel/Travel from main `AddExpense` form — user stays in context.
- All toast strings live in `BudgetMsg` enum; no raw strings.
- Backwards compatibility — existing expenses (with `meta: undefined`) parse and render without error.

### Spec / Plan
- Spec: `docs/specs/2026-05-04-fuel-travel-maintenance-design.md`
- Plan: `docs/plans/2026-05-04-fuel-travel-maintenance.md` (Tasks 1–10)

---

## [0.2.17.2] — 2026-05-01 (Phase 2i fine-print: glyph sizing + viewport-aware + size tier picker)

### Added
- **`<SizeTierPicker>` component** — second tier picker in Profile → Customize, parallel to the intensity picker. Three tiers: `Small (70%) · Medium (100%) · Large (140%)` controlling a multiplier applied to particle size and scale. Atomic clicks, matches AFP's pill-row pattern.
- **`UserProfile.effectSize: number | undefined`** — persists the user's size preference. Default `100` (Medium); legacy users get the default via read-side fallback (`profile?.effectSize ?? 100`). No migration script.
- **`bucketEffectSize()` util + `EFFECT_SIZE_TIERS`** — `src/shared/utils/effectSize.ts`. Maps any value to the nearest tier (≤84→70, 85–120→100, 121+→140).
- **Viewport-aware size multiplier** — `useViewportSizeMultiplier` hook in `AmbientEffects` returns `0.65` on mobile (`max-width: 640px`), `1.0` otherwise. Compounds with the user's `effectSize` tier.

### Changed
- **Glyph render parity** — SVG and CSS shape glyphs (Snowflake, Leaf, Star, Heart, InkBlot, Bubble, Ember, Wisp, Fallback) now render at 80% of their container instead of 100%. Brings their visible glyph cell into line with how emoji content renders (the existing Patronus path was the reference target). Fixes "leaves look too big on phone" — they were filling 100% of the container while emoji animals filled ~70-80%.
- **`AmbientEffects` size + scale calculation** — `--fx-size` and `--fx-scale` are now multiplied by `(effectSize / 100) × viewportMultiplier`. Default behavior on desktop unchanged (Medium tier × 1.0 viewport = identity). Mobile defaults shrink to 0.65× automatically.

### Tests
- **`effectSize.test.ts`** — 10 new tests for `EFFECT_SIZE_TIERS` shape and `bucketEffectSize` boundary behavior
- **`SizeTierPicker.test.tsx`** — 7 new tests mirroring the IntensityTierPicker test set
- **`AmbientEffects.test.tsx`** — extended with viewport-multiplier and `effectSize` prop tests
- **`glyph-primitives.test.tsx`** — extended with 80% sizing assertions
- **`e2e/the-fine-print.spec.ts`** — 4 new Playwright tests verifying mobile vs desktop `--fx-size` scaling and SizeTierPicker presence
- Unit suite grew 558 → 582 (+24); E2E grew 77 → 81 (+4)

---

## [0.2.17.1] — 2026-05-01 (Phase 2i polish: learning slots filled + E2E coverage)

### Changed
- **Locked Phase 2i learning-mode TODO slots** with permanent values + reasoning comments:
  - `INTENSITY_TIERS` labels (`Off · Subtle · Standard · Lively · Maximum`) committed as final
  - Depth-scaling constants in `AmbientEffects.tsx` documented with rationale (scale 0.5–1.5, opacity 0.25–0.8, size 10–26px, duration 1×–2× baseSpeed)
  - Marauder's Map atmosphere values committed with explanation of fold-crease geometry and vignette tuning

### Tests
- **`e2e/themes-2.0.spec.ts`** — 30 new Playwright regression tests codifying Phase 2i invariants: atmosphere CSS per theme, Charcoal silence, glyph dispatch (SVG/CSS not text), Patronus emoji preservation, intensity tier picker behavior, reduced-motion short-circuit, DevBench Theme Tour. E2E suite now 77 tests passing (was 47).

### Documentation
- **`src/themes/README.md`** — added Implementation Notes section covering atmosphere CSS contract and depth-scaling math
- **`e2e/README.md`** — describes new Phase 2i regression file

---

## [0.2.17] — 2026-04-30 (Phase 2i — Themes 2.0: Atmosphere & Glyphs)

### Added
- **Atmosphere layer per theme** — 9 of 10 themes ship with a CSS-only `body.theme-X::before` (and optional `::after`) atmosphere block running behind content. Charcoal stays silent by design. Each theme honors `prefers-reduced-motion` per-theme. Treatments: Family Blue (cloud drift), Garden Path (dappled light), Lullaby (vellum nightlight), Rose Quartz (pearlescent shimmer), Marauder's Map (parchment + vignette), Neon Glow (CRT raster + chromatic aberration), Deep Mariana (caustic ripples), Industrial Furnace (molten glow), Expecto Patronum (silver mist + starlight).
- **`<GlyphPrimitive>` registry** — 8 shape-primitive glyph components (Snowflake, Leaf, Star, Heart, InkBlot, Bubble, Ember, Wisp) replace emoji in particle effects. Pure CSS or inline SVG, theme-tinted via `currentColor`. Patronus animals preserved as filtered emoji.
- **Depth-correlated particle scaling** — `AmbientEffects` refactored: a single random "depth" value drives scale, opacity, size, and duration. Reads as parallax atmosphere instead of independently-random confetti.
- **`<IntensityTierPicker>`** — 5-button tier row replaces the 0–100 slider in Profile. Off · Subtle · Standard · Lively · Maximum. Atomic clicks match AFP's pill-row pattern.
- **`bucketIntensity()` util + `INTENSITY_TIERS`** — `src/shared/utils/intensity.ts`. Legacy values bucket on read; no migration script.
- **DevBench Meals/Needs/Milestones generators** — `benchMeal`, `benchNeed`, `benchMilestone` close the gap with newer baby modules. Anchored at `todayStr()` so sticky day headers (Phase 2h) actually display `Today`/`Yesterday`.
- **DevBench Theme Tour button** — cycles through all 10 themes with a 3-second hold each. Stop button restores the original theme. `DevBenchInner` extraction pattern keeps hooks unconditional while wrapping the dev-only guard.

### Changed
- **`THEME_DEFINITIONS.effects[].content`** — set to `''` for the 8 redesigned effects (snowflakes/leaves/stars/hearts/ink/bubbles/embers/wisps). Patronus animals retain their emoji string.
- **Profile intensity control** — slider replaced by tier-button row.

### Tests
- 5 new test files: `intensity.test.ts`, `IntensityTierPicker.test.tsx`, `glyph-primitives.test.tsx`, `AmbientEffects.test.tsx`, `bench-generators.test.ts`.
- Existing `themes.test.ts` extended with content invariants for Phase 2i.
- Approximately 35+ new test cases covering the foundation primitives, picker, glyph dispatch, depth correlation, content invariants, and bench generators.

### Implementation notes
- 16 task commits + 1 plan-doc commit since `0.2.16`. Squashable to a single `0.2.17` commit at branch finish per Nick's preference.
- Atmosphere CSS visual fidelity verified manually via the Theme Tour button (Task 19).
- Three TODO(nick) learning-mode slots remain in code: `IntensityTier` labels (intensity.ts), depth-scaling constants (AmbientEffects.tsx), Marauder's Map atmosphere CSS values (marauders-map.css).

### Carved out (separate future spec)
- Phase 2j (`0.2.18`) — Iconography: per-row category icons across Body / Baby / Budget. Floors keep existing Unicode `↑`/`↓` arrows; other modules get themed SVG icons later.

---

## [0.2.16] — 2026-04-30 (Theme Polish & Phase 2i Spec)

### Added
- **`usePrefersReducedMotion` hook in `AmbientEffects`** — early-returns when OS-level `prefers-reduced-motion: reduce` is set; particles don't mount for accessibility users.
- **`ThemeSwatch` mini-mockup component** — Profile theme picker now renders each theme as a real preview: theme bg + accent stroke + "Aa" rendered in the theme's display font and text color. Replaces the diagonal-gradient swatch.
- **Phase 2i design spec** — `docs/specs/2026-04-30-phase2i-themes-2.0-design.md` captures Themes 2.0 scope: atmosphere layers per theme, shape-primitive glyphs replacing emoji, depth-correlated particle scaling, tier-button intensity slider, DevBench catch-up, Theme Tour. Phase 2j (Iconography) split into a separate future spec (`0.2.18`).

### Changed
- **Sweep-type particle opacity is now deterministic (0.15)** — Neon Glow scanline no longer randomly renders at 0.8 brightness. Other particle types still use randomized opacity (0.3–0.8).

### Removed
- **Redundant `opacity: 0.1` rule on `.effect-scanline`** — was being overridden by the keyframe's `var(--fx-opacity)` anyway. Documentation contradiction resolved.

### Documentation
- **Charcoal silence-by-design** — explicit note in `src/themes/README.md` that the empty effects array is intentional, not a missing implementation. Also flagged that emoji glyphs are a known tonal mismatch targeted for Phase 2i replacement.

---

## [0.2.15] — 2026-04-29 (Phase 2h — Universal List Controls)

### Added
- **`TimeRange` enum** — Generalized from the legacy `BudgetView` enum for cross-module use (`Today / Week / Month / All`).
- **Shared `filterByDateRange`** — Moved from `expenses/budget-math.ts` to `src/shared/utils/filter.ts` with a key-extractor signature so both `date`-keyed and `createdAt`-keyed entries can use it.
- **`paginate()` + `totalPages()` primitive** — `src/shared/utils/paginate.ts`, fully tested.
- **`useListControls()` hook** — Per-list session state (time-range, page-size, page, show-all) that auto-resets pagination on filter change.
- **`<ListControls>` component** — Pill row (time-range filter) + page-size selector `[5, 10, 25, 50, 100, 500]` + page indicator + prev/next + go-to-page input.
- **`<ListShowMoreFooter>` component** — Bottom escape hatch that switches between `Show all N records` and `Load N remaining` based on remaining count.

### Changed
- **Wired 11 list surfaces to the new controls** — Body (Floors, ActivityLog), Baby (Feed, Sleep, Growth, Elimination, Meals, Needs, Milestones), Budget (ExpenseList, IncomeList), Admin (Invites). BroadcastsTab pending future work.
- **Budget ExpenseListPage** — Inline pill-row replaced by shared `<ListControls>`. ExpenseList and IncomeList no longer self-paginate; pagination is owned upstream.

### Removed
- **`CONFIG.PAGE_SIZE`** — Retired in favor of the `useListControls` hook default (still 25).

### Added (Daily Ledger visual refactor)
- **`<DateGroupHeader>` component** — Sticky day header with two-tier label (relative `Today`/`Yesterday` in accent + structural `Wed 22 Apr · Wk 17` for older).
- **`<RowTime>` component** — Tabular-nums HH:mm prefix for list rows.
- **`<FloorMagnitudeBar>` component** — Inline split bar visualizing floors-up vs floors-down for a day, scaled against the daily goal.
- **`relativeDateLabel` util** — Two-tier date formatting with ISO week number for cold dates.

### Changed (Daily Ledger visual refactor)
- **All 11 list surfaces redesigned** — Replaced per-row card markup with hairline `border-t` between rows. Sticky day headers per date group. Day-of-week prepended to every date display. FloorsTab additionally uses the inline magnitude bar.
- **Theme-agnostic** — All 10 themes inherit correctly via existing CSS variables. Design preview committed: `SAM/design-samples/list-rows-redesign.html`.

### Preserved
- Swipe-to-delete (mobile), inline `×` delete (desktop), tap-to-populate-form active-row treatment — all unchanged per design constraint.

### Tests
- 50 new unit tests total: 35 across foundation primitives + components, 15 across visual primitives.

---

## [0.2.14] — 2026-04-25 (Enhanced Theme System & Refactor)

### Added
- **Enhanced Ambient Theme System** — Granular 0-100% intensity control for all themes.
- **AmbientEffects Component** — Dynamic React-based particle renderer with seeded randomization (pure render).
- **Expecto Patronum Enhancement** — Ghostly spirit animals (spirit animal pool: 🦌, 🐺, 🦅, 🦦, 🐎, 🐈, 🦉, 🐇, 🐕, 🦢, 🦡, 🐉) with silvery glow and manifestation animations.
- **Formal Patronus Effect** — Added `patronus` to the core `ThemeEffect` types and definition schema.
- **Reactive Local Dev** — AuthProvider now reactively syncs with `localStorage` in dev mode using a singleton adapter pattern.
- **GreetingMsg Enum** — Centralized UI greeting strings in `constants/messages.ts`.

### Changed
- **Granular Slider** — Replaced binary theme info with a 0-100% intensity range slider in Profile.
- **React 19 Profile Sync** — Refactored `ProfilePage` to use the "Adjusting state during render" pattern (purer than `useEffect`) for syncing local state with the user profile.
- **Behavioral CSS** — Refactored `effects.css` into generic behavior utilities (`fx-fall`, `fx-rise`, `fx-twinkle`, `fx-float`, `fx-sweep`).
- **Greeting Logic** — Renamed `getGreeting` to `computeGreeting` across the codebase.
- **GEMINI.md Update** — Added strict mandates for sub-agent worktrees and self-verification sweeps.

### Fixed
- **Layout Crash** — Added null-safety to `profile.modules` access to prevent crashes on partial profile loads.
- **Data Loss** — `saveAppearance` now merges with existing profile data to prevent wiping out modules or roles.
- **Windows Scripts** — Refactored `package.json` build/lint scripts to avoid `&&` chaining issues in PowerShell.
- **Theme Tests** — Updated unit tests to support the new structured effects metadata.

---

## [0.2.13] — 2026-04-20 (Permission & Admin Fixes)

### Added
- **BabySuggestionsToast** — Extracted global suggestion toast into a conditional component in `Layout.tsx`.
- **BodySummaryCard** — Encapsulated Body summary card with internal data fetching.
- **BudgetSummaryCard** — Encapsulated Budget summary card with internal data fetching and math.
- **BabySummaryCard** — Encapsulated Baby summary card with internal data fetching.
- **BabyDashboardBanner** — Encapsulated Dashboard suggestion banner with internal data fetching.

### Changed
- **useAllUsers Hook** — Added `enabled` flag to prevent unauthorized collectionGroup reads.
- **Dashboard Refactor** — Extracted monolithic hooks into wrapper components; significantly cleaned up logic.
- **Admin Visibility** — Admin now sees target user's modules on the dashboard even if their own are disabled.

### Fixed
- **Permission Leaks** — Standard users no longer trigger forbidden listeners for `useAllUsers` or disabled modules.
- **Console Errors** — Eliminated `permission-denied` noise in the console for non-admins and disabled modules.

## [0.2.12] — 2026-04-19 (Budget UI & Security Fixes)

### Added
- **PaymentMethodBubble** — Extracted shared UI component for consistent bubble selection.
- **useVerbose Hook** — Reactive management of verbose logging state across components.
- **GEMINI.md** — New project-specific foundational mandates for agentic workers.

### Changed
- **Budget UX Overhaul** — `AddExpense` now uses interactive emoji bubbles for categories (defaults set via `CONFIG.BUDGET_VISIBLE_CATEGORIES`) and additive presets.
- **Required Selection** — Categories are now `null` by default, requiring explicit user selection before submission; added `BudgetMsg.CategoryRequired` toast validation.
- **Console Overlay** — Now only renders when "Verbose logs" is enabled on the Debug page.

### Fixed
- **Theme Persistence** — Corrected Firestore rules to allow non-admin users to update `theme` and `colorMode` in their profiles.
- **Format & Lint** — Project-wide cleanup of code style and linting issues.

## [0.2.11] — 2026-04-15 (Phase 3 Plan 7 — Life Journal)

### Added
- **Life Journal** — Narrative Daily / Weekly / Monthly view aggregating all 7 baby subcollections (feeds, sleep, growth, elimination, meals, milestones, needs). Always-visible tab at position 2 in `ChildDetail` (between Dashboard and Feeding). Grain selector + previous/next period stepper. Seven cards: counting moments (conditional), Feeds & Meals, Sleep, Growth, Elimination, Milestones, Needs activity. Empty-state fallbacks per card.
- **Counting moments** — Cumulative thresholds detected on read: diapers [100/250/500/1000/2500/5000], feeds [100/500/1000/2500/5000], meals [50/100/250/500/1000], milestones [10/25/50/100]. No persisted counters — detected by comparing totals before vs after the period. Compute-on-read design.
- **Pure aggregation layer** — `src/modules/baby/journal/` subdir with `constants.ts` (thresholds + `JournalGrain` enum), `types.ts` (`JournalRange`, `JournalSummary`, `CountingMoment`, `CountingDataType`), `range.ts` (`computeRange`, `formatRangeLabel`), `aggregate.ts` (`computeCountingMoments`, `computeJournalSummary`). Fully pure — no Firestore mocking needed to test.
- **Data hook** — `useJournalData(childId, range)` composes 7 `useBabyCollection` listeners + `computeJournalSummary` via `useMemo`.
- **UI components** — `JournalPicker` (D/W/M + period stepper), `JournalCard` (generic wrapper with title + empty fallback), `LifeJournalView` (composite).

### Changed
- **ChildDetail `DashboardTab`** — Minimal stat strip (9A scope) added above the navigation grid: today's feed count + sleep hours + diaper count + milestone count (only shows if non-zero). "See full journal →" link opens the Journal tab. Dashboard no longer purely navigation — carries live data.
- **Tab order** — Journal is now 2nd (was: Dashboard → Feeding → ...; now: Dashboard → Journal → Feeding → ...).
- **Version bumps** — `package.json` 0.2.6 → 0.2.11 (was stale through pre-0.2.7 → pre-0.2.10). `deploy.yml` `VITE_APP_VERSION` 0.2.6 → 0.2.11.

### Tests
- 23+ new unit tests: 9 range, 14 aggregate, 4 JournalPicker, 5 LifeJournalView, plus DashboardTab strip test.
- Total trajectory: 435 → 458+ unit.

### Decisions
- **Needs semantics (Option A)** — aggregated by `date`-in-range filtered by current `status`. Acknowledged imprecision: a need created March but bought April Week 2 counts as `needsAcquired` in week-view only if still within date-range — otherwise not counted. Reframed as "life event": anything touching the wishlist lifecycle this period is journal-worthy.
- **Actual release, not pre-** — Plans 3-6 shipped as `pre-` tags; `0.2.11` promoted to real release since Phase 3 baby module feature-complete (7/10 plans done).
- **Tab placement = second** — Dashboard teaser + Journal full view is the pattern, per "we show some on stats (dashboard) and rest on its own tab."
- **Counting-moments as notifications** — deferred counting-moment *celebration surfacing* to Plan 8 (Smart Alerts); Journal just displays them passively for now.

---

## [pre-0.2.10] — 2026-04-15 (Phase 3 Plans 5+6 — Needs + Milestones)

### Added
- **Plan 5 (Needs)**: New `needs` subcollection at `users/{uid}/children/{childId}/needs/{id}`. `NeedsLog.tsx` component with filter chips (All / Wishlist / Have / Outgrown) and status lifecycle (Wishlist → Inventory via "Bought" button → Outgrown via "Outgrew" button). Built in an isolated git worktree by a parallel subagent.
- **Plan 6 (Milestones)**: New `milestones` subcollection. `MilestonesLog.tsx` with 10 quick-add template chips (`milestone-templates.ts`), 6 categories (Motor / Language / Social / Cognitive / Hobby / Other), grouped-by-category list, optional media URL field rendered as link.
- **AddChild form**: 7th and 8th checkboxes — Needs and Milestones (both default off).
- **ChildDetail**: Two new tabs (Needs, Milestones) + dashboard SummaryCards (🛍 / 🌟), all gated by their respective `child.config` flags.
- **Constants**: `DbSubcollection.Needs`, `DbSubcollection.Milestones`, `NEED_CATEGORY_LABELS`, `ALL_NEED_CATEGORIES`, `NEED_STATUS_LABELS`, `ALL_NEED_STATUSES`, `MILESTONE_CATEGORY_LABELS`, `ALL_MILESTONE_CATEGORIES`. `BabyMsg` adds 10 entries (`NeedAdded/Deleted/Updated/MovedToInventory/MovedToOutgrown/TitleRequired`, `MilestoneAdded/Deleted/Updated/TitleRequired`).

### Process
- **Parallel subagent dispatch** — Plans 5 and 6 dispatched simultaneously into isolated worktrees branched from a coordinator commit (`742fac2`) that pre-staged all shared-file additions. Plan 5 returned cleanly. Plan 6's subagent rate-limited mid-setup with a stale worktree base; reimplemented inline using the same TDD pattern.
- **Pattern: pre-stage shared files, dispatch isolated worktrees** — avoids merge conflicts on `ChildDetail.tsx` / `constants/*.ts` / `AddChild.tsx`. Subagents only create new files; coordinator wires them up after merge.

### Tests
- 30 new tests (16 NeedsLog, 6 milestone-templates, 8 MilestonesLog) — total 435 unit (was 405 pre-Plans-5+6).

### Docs
- ROADMAP, CHANGELOG, CLAUDE.md updated. Per-directory READMEs updated.

---

## [pre-0.2.9] — 2026-04-15 (Phase 3 Plan 4 — Meals Module)

### Added
- **Plan 4 (Meals)**: New `meals` subcollection at `users/{uid}/children/{childId}/meals/{id}`. `MealsLog.tsx` component with full feature parity to other Baby logs (form-at-top, tap-to-edit, 10s undo-delete, pagination, sibling logging, "All" toggle).
- **Auto-suggest meal type from current hour**: Breakfast (<10), Lunch (<14), Dinner (<19), Snack (>=19). Picks the right tab's pre-selected chip when opened.
- **Optional portion** field (None / Bite / Little / Some / Most / All / Extra) — keyed off the 7-value `MealPortion` enum from Plan 1.
- **AddChild form**: optional Meals checkbox (default off — auto-flipped by suggestion engine at 9 months).
- **ChildDetail**: new Meals tab + dashboard SummaryCard, both gated by `child.config.meals`.
- **Constants**: `DbSubcollection.Meals = 'meals'`, `BabyMsg.MealAdded`/`MealDeleted`/`MealDescriptionRequired`, `MEAL_TYPE_LABELS`, `ALL_MEAL_TYPES`, `MEAL_PORTION_LABELS`, `ALL_MEAL_PORTIONS`.

### Tests
- 6 new tests (rendering + form behavior + meal type chips) — total 405 unit (was 399).

### Docs
- ROADMAP, CHANGELOG, CLAUDE.md updated.

---

## [pre-0.2.8] — 2026-04-15 (Phase 3 Plan 3 — Combined Diaper/Potty)

### Added
- **Plan 3 (Elimination)**: New combined `elimination` subcollection at `users/{uid}/children/{childId}/elimination/{id}` that handles both diaper events (infant) and potty events (toddler+) via a `mode: EliminationMode` discriminator. Replaces standalone `DiaperLog` with `EliminationLog` in `ChildDetail`.
- **`EliminationLog` component** (replaces `DiaperLog` via `git mv` — full refactor in place): preserves all existing UX (quick-log Wet/Dirty buttons, 10s undo-delete toast, pagination, sibling "log to all", edit row highlight) while adding mode toggle (when both flags enabled), potty event chips (Pee/Poop/Both/Accident/Attempt), and dynamic header label (Diaper / Potty / Elimination Log).
- **Admin Migrations tab**: new 4th tab in `AdminPanel` exposing the diaper→elimination backfill. Iterates all users × children, copies legacy `diapers/*` entries into `elimination/*` non-destructively (old entries preserved). Live progress, per-error reporting, summary card.
- **Migration helpers**: `transformDiaperToElimination` (pure) + `migrateChildDiapersToElimination` (Firestore writeBatch) in `src/modules/baby/migration/elimination.ts`. Pure orchestration runner in `src/admin/runEliminationMigration.ts` (testable with injected deps).
- **Constants**: `DbSubcollection.Elimination = 'elimination'`, `POTTY_EVENT_LABELS`, `ALL_POTTY_EVENTS`, `BabyMsg.EliminationAdded`, `BabyMsg.EliminationDeleted`.
- **AddChild form**: optional 5th checkbox for `Potty` (default off — newborn flow unchanged; explicit opt-in for older kids being added). Auto-flipped by suggestion engine at 24mo.

### Changed
- `useBabyData` now exposes a 5th subcollection: `elimination, logElimination, updateElimination, removeElimination`. Sync status only flips to `Synced` when all 5 listeners report ready. Existing `diapers/*` path retained for backward compatibility (read-only after migration).
- `ChildDetail` tabs and `DashboardTab` quick-action grid: the diapers tab now appears when `config.diapers || config.potty` is true, with dynamic label and icon (🧷 / 🚽 / both).

### Tests
- 14 new tests (3 transform, 7 EliminationLog component, 4 migration runner) — total 399 unit (was 384 pre-session).

### Docs
- ROADMAP, CHANGELOG, CLAUDE.md updated.

---

## [pre-0.2.7] — 2026-04-15 (Phase 3 Baby → Kid, Plans 1-2)

### Added
- **Plan 1 (Foundation)**: 8 new enums (`EliminationMode`, `PottyTrainingEvent`, `MealType`, `MealPortion`, `NeedCategory`, `NeedStatus`, `MilestoneCategory`, `ChildStage`). New types: `EliminationEntry`, `MealEntry`, `NeedEntry`, `Milestone`, `SuggestionSnooze`. Extended `ChildConfig` with optional `meals`, `potty`, `milestones`, `needs`. Extended `Child` with optional `suggestionState`. New `src/modules/baby/stage.ts` with `computeStage()`, `monthsOldFromDob()`, `STAGE_BOUNDARIES`, `SUGGEST_THRESHOLDS`, `SUGGESTION_SNOOZE_DAYS`.
- **Plan 2 (Suggestions)**: Age-based suggestion system with three rendering surfaces — session toast in `Layout`, `SuggestionBanner` on Dashboard (when Baby module enabled), `SuggestionStrip` in `ChildDetail`. 30-day snooze persistence via `useSnooze` hook writing to `child.suggestionState`. Suggests enabling meals at 9mo, potty at 24mo, disabling feeds after 18mo, disabling diapers after 30mo.
- **Yoga plan** (`docs/plans/2026-04-15-phase3-body-yoga-plan.md`): Plan 10 — duration-based Body module activity with asana selector (requires brainstorm before implementation).

### Changed
- `MealPortion` expanded from 5 → 7 values: `None, Bite, Little, Some, Most, All, Extra` — finer granularity between None and Most.
- `PottyType` → `PottyTrainingEvent` (more accurate — includes both on-potty successes and off-potty accidents). Field in `EliminationEntry` renamed from `pottyType` to `pottyEvent`.
- `BabyMsg` enum: +3 entries (`SuggestionSnoozed`, `SuggestionEnabled`, `SuggestionDisabled`).

### Docs
- Spec and plan docs updated to match code: `phase3-baby-to-kid-design.md`, `phase3-baby-foundation-plan.md`, `phase3-baby-meals-plan.md`, `phase3-baby-elimination-plan.md`.

### Fixed
- **Firestore deploy unblocked**: `firestore.indexes.json` previously declared a `fieldOverride` on the reserved `__name__` field path, which the Firestore API rejects (HTTP 400 "reserved field path"). The override was both invalid and unnecessary — single-field collection group queries (no `where`/`orderBy`) work without explicit indexes. File now ships with empty `indexes` + `fieldOverrides` arrays so future deploys succeed.
- **Admin user list (root cause)**: `useAllUsers` queries `collectionGroup('profile')`, which is evaluated against `match /{path=**}/profile/{docId}` rules — not the path-based `match /users/{userId}/profile/{document=**}` block. Added a new collection group rule granting admin reads. The earlier index-only attempt was a misdiagnosis (permission-denied is always a rules problem, not an index problem).

---

## [0.2.6] — 2026-04-15

### Added
- Per-user notification system (`users/{uid}/notifications/{id}` subcollection)
- Module request flow: users request from Profile → admin one-click approves in UsersTab
- Admin Broadcasts tab: compose alerts with severity, type, and expiry targeting all or specific users
- AlertBanner component: color-coded top banners (info/warning/critical) with dismiss support
- `requestedModules` field on UserProfile for tracking pending requests
- `adminUid` exposed in auth context from `app/config`
- Firestore rules for notification read/write/create permissions
- **Phase 2g E2E interaction tests** (5 flow tests in `e2e/flows.spec.ts`): Budget full expense, Body configure + log floors + log walk, Payment bubble toggle, Body gear reconfigure, Baby add child + log feed — all with reload persistence checks
- **Shared E2E helpers** (`e2e/helpers.ts`): `ensureBodyConfigured` and `addChild` extracted from `app.spec.ts`
- **Build bench script** (`scripts/bench.ts`, `bun run build:bench`): measures build time, bundle size (total + largest chunk), unit test duration, E2E test duration
- **Firestore collectionGroup index** (`firestore.indexes.json`): enables `useAllUsers()` admin query across all user profiles
- **Firebase data structure documentation** (`docs/firebase-data-structure.md`): full tree view, per-collection field tables, security rules summary, enum reference

### Fixed
- **Expense form redirect**: `AddExpensePage` navigated to `/expenses` (no matching route) after submit — now correctly uses `ROUTES.BUDGET` (`/budget`). Affected both expense and income submissions.

### Changed
- **CI Firebase workflow** (`firebase-rules.yml`): now deploys `firestore:rules,firestore:indexes` together (was rules-only), triggered by changes to either file. Added `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24` env var to silence Node.js 20 deprecation warnings.

### Documentation
- **ROADMAP.md**: Phase 2g marked complete (8/8), total progress 184/198 (~95%)
- **Session 9 verification checklist** (`docs/session9-verify.md`): restructured into Local Dev (15/18 pass), Production (2/8 pass pre-fix), Root Cause Analysis, and Deployment Checklist sections

---

## [0.2.5] — 2026-04-12

Production auth fixes, Firestore rules, debug tools, baby sibling features, touch UX, loading animation polish.

### Auth

| Change | What |
|---|---|
| Google Sign-In robustness | `credential-already-in-use` now uses `signInWithCredential` instead of opening a second popup (blocked by browsers). Added `signInWithRedirect`/`linkWithRedirect` fallback for mobile popup-blocked scenarios |
| Redirect result handling | `auth-context.tsx` calls `getRedirectResult` on load to complete mobile redirect flows and recover from `credential-already-in-use` during redirects |
| Actionable error messages | `auth/unauthorized-domain` and `auth/invalid-api-key` now return specific fix instructions instead of generic "sign-in failed" |

### Firestore Rules

| Change | What |
|---|---|
| Admin claim on fresh DB | `app/config` create allowed when doc doesn't exist (fixes chicken-and-egg: `isHeadminick()` required config to exist but config required `isHeadminick()` to create) |
| Admin profile creation | Profile create allowed with any role when `app/config` doesn't exist (first-time claim), plus existing rules for normal users and admin writes |

### Fixes

| Change | What |
|---|---|
| Logo 404 on GitHub Pages | `Layout.tsx` logo `src` now uses `import.meta.env.BASE_URL` prefix — was resolving to `/favicon.png` instead of `/afp/favicon.png` |
| Theme restore on load | `ThemeInitializer` reads `profile.theme` and `profile.colorMode` from Firestore — previously always reset to Family Blue on refresh |

### Baby Module

| Change | What |
|---|---|
| "All" sibling logging | Toggle button next to Save on all 4 log forms (Feed, Sleep, Growth, Diaper). When active, copies the entry to all sibling children via `logToSiblings` utility |
| Sibling quick-nav | Pills in ChildDetail header to jump to the same tab on another child |
| Tappable child cards | BabyLanding cards are fully clickable — removed separate "View" button, added chevron |

### Debug Tools

| Change | What |
|---|---|
| AuthContext dump | Collapsible JSON view of full auth context on Debug page |
| ToastContext dump | Collapsible JSON view of toast state on Debug page |
| Console overlay | Floating `>_` pill on all pages — captures all 20 console methods, persists toggle in localStorage. Color-coded by level, auto-scroll, clear button |

### Touch UX

| Change | What |
|---|---|
| `btn-row-action` | Row action (+) buttons use corner-notch positioning — separate tap target from row. Desktop: hover reveal. Mobile (`@media (hover: none)`): always visible at 50% opacity. 44px WCAG touch target via `::before` pseudo-element |

### Loading Animations

| Change | What |
|---|---|
| Boxer (SceneAthlete) | Redesigned as side-pose boxer — angled torso, bent-elbow guard, staggered stance, jab with weight shift. Uses faster 0.4s punch toggle with bob-and-weave sway |
| Climber (SceneClimber) | Stick figure scaled up ~30% (bigger head, thicker limbs, larger glow) for better visual presence on staircase |
| Reader (SceneReader) | Papers raised higher toward face (y=30 vs y=36), animation lift doubled to 6px for clearer reading gesture |

### Bugfixes

| Change | What |
|---|---|
| Invite creation `undefined` fields | `InviteRecord.role` and `viewerOf` changed from optional (`undefined`) to nullable (`string \| null`). Firestore rejects `undefined` — was causing silent invite creation failure |

### Verbose Logging

| Change | What |
|---|---|
| `verbose.ts` utility | `vlog`/`vwarn`/`verr` — only output when "Verbose logs" checkbox is enabled on Debug page. Persisted in localStorage (`afp-verbose-logs`) |
| Auth, admin, invite flows | All key operations instrumented with `[AFP:auth]`, `[AFP:admin]`, `[AFP:invite]` prefixed logs. Errors always log, info/warn only when verbose is on |
| Debug page toggle | Checkbox to enable/disable verbose mode — visible in `>_` console overlay on all pages |

---

## [0.2.4] — 2026-04-10

E2E regression fixes, code hygiene sweep, admin claim transaction safety.

### Fixes

| Change | What |
|---|---|
| E2E regression | Fixed all 10 failing E2E tests — `isVisible()` doesn't wait in Playwright 1.59, strict mode violations from UI changes, expandable theme picker |
| `initializeAdmin` atomicity | Wrapped app/config + admin profile writes in `runTransaction` — prevents race conditions and orphan state |

### Code Hygiene

| Change | What |
|---|---|
| `ToastType` enum | Created `ToastType.Success/Error/Info` enum, replaced 62 raw string literals across 20 files |
| Message enum sweep | Moved 18 raw toast strings to `ProfileMsg`, `AdminMsg`, `BodyMsg`, `BabyMsg`, `BudgetMsg` enums across 8 files |
| Zero raw toast strings | All `addToast` calls now use message enums + `ToastType` enum — no string literals in production code |

### Tests

| Metric | Before | After |
|---|---|---|
| Unit tests | 320 | 320 |
| E2E tests | 32 passing (10 failing) | 42 passing (0 failing) |

---

## [0.2.3] — 2026-04-10

Phase 2f themes implementation, loading screen, code splitting.

### Theme System (Phase 2f)

| Change | What |
|---|---|
| 10 themes | 6 light+dark (Family Blue, Garden Path, Lullaby, Rose Quartz, Charcoal, Marauder's Map) + 4 dark-only (Neon Glow, Deep Mariana, Industrial Furnace, Expecto Patronum). Dropped 3 (Summit, Corporate Glass, Night City Elevator), renamed 1 (Night City Apartment -> Neon Glow), added 6 new |
| 8 Google Font families | DM Serif Display (Garden Path), Quicksand/Nunito (Lullaby), Playfair Display (Rose Quartz), Cinzel (Marauder's Map, Expecto Patronum), Orbitron (Neon Glow), Syne (Family Blue, Charcoal), JetBrains Mono (monospace accents). Applied via `--font-display`/`--font-body` CSS variables |
| 9 ambient effects | snowflakes (Family Blue), leaves (Garden Path), stars (Lullaby), hearts (Rose Quartz), ink/footprints (Marauder's Map), scanline (Neon Glow), CRT+bubbles (Deep Mariana), embers (Industrial Furnace), wisps (Expecto Patronum). Charcoal has none (minimal by design) |
| Theme picker | Expandable inline section in Profile -- "Customize Theme" button expands to 2-col mini showcase grid with font family info and effect summary per theme |
| Theme migration | `resolveThemeId()` maps dropped/renamed IDs to current themes. Users with old theme IDs auto-migrate to valid themes |
| fx-ambient container | `<div id="fx-ambient">` in Layout for ambient effect animations. CSS keyframes in `effects.css` |
| Effect profile fields | `effectCount` (0-10) and `effectSize` (small/medium/large) on `UserProfile` for per-user configuration |

### Loading Screen

| Change | What |
|---|---|
| 3 SVG scenes | `SceneClimber` (5-step staircase), `SceneAthlete` (run/box poses), `SceneReader` (spectacles comparing papers). Random selection per mount |
| Brand text | "IT STARTED ON APRIL FOOLS DAY" with staggered letter reveal CSS animation |
| `useMinDelay` hook | Holds loading screen for minimum duration (1s prod, 0 dev). Prevents flash on fast loads. Dev mode returns `false` synchronously to not block E2E |
| `AnimationViewer` | Preview page at `/animations` with pill tab switcher for each scene + text checkbox |

### Code Splitting

| Change | What |
|---|---|
| `React.lazy` + `Suspense` | All route components lazy-loaded. Each route emits its own Vite chunk |
| `LoadingScreen` as fallback | Suspense wrapper in Layout shows loading screen during chunk load |

### Documentation

| Change | What |
|---|---|
| README sweep | All 29 per-directory READMEs updated to reflect current state |
| Themes README | Full roster with fonts, effects, and individual CSS file listing |

### Tests

| Metric | Before | After |
|---|---|---|
| Unit tests | 281 | 320 (+39) |
| E2E tests | 42 | 42 |
| Test files | 38 | 42 (+4) |

---

## [0.2.2] — 2026-04-09

Admin pages, viewer invite flow, body stats overhaul, scoring reweight, code quality.

### New Features

| Change | What |
|---|---|
| Tabbed Admin Panel | `AdminPanel` rewritten with Invites / Users tab switcher. Pill-style tabs with accent active state |
| InvitesTab | Invite list with pending/redeemed badges, copy-link (clipboard) and delete (undo toast) actions on pending invites |
| UsersTab | User list with initials avatar, role badge, color-coded module chips (Body=indigo, Budget=emerald, Baby=pink), summary stat bar (Admin/User/Viewer counts), accordion expand with role dropdown + module toggle switches |
| Viewer invite flow | `InviteRecord` extended with `role` + `viewerOf` fields. `InviteGenerator` gets User/Viewer toggle + "View of" user picker. `redeemInvite` creates Viewer profile with `viewerOf` scoping |
| Score ring | SVG progress ring on Body Stats replacing plain number. Zone labels (Easy Start → Beast Mode) with color transitions. Goal percentage display |
| Weekly day bars | Vertical bar chart showing 7-day scores. Today highlighted with accent glow. Replaces flat 3-column text stats |
| Daily goal builder | Per-activity sliders in `BodyConfigForm` — user builds a typical day, goal auto-calculates. Preset chips (🌿💪🔥⚡). Live ring + zone preview. `dailyGoal` persisted in `BodyConfig` |
| Scoring reweight | New formula: floors_up×1, floors_down×0.5, walk_km×10, run_km×20, cycle_km×15. Default goal: 50 |
| List hover (+) | Per-row (+) button on ActivityLog and FloorsTab rows — appears on hover, duplicates the entry (same type/distance for today) |
| Reset today | Button below stat cards, turns red on hover, resets today's floors to zero with 10s undo toast |
| Dynamic quick actions | Stat page action buttons driven by `STAT_CARDS` array — auto-includes cycling/yoga when configured |
| Stat cards tappable | Whole card navigates to activity tab on tap (replaced hover-only (+) after review) |

### Code Quality

| Change | What |
|---|---|
| Prettier setup | `.prettierrc` (single quotes, semis, trailing commas, 100 char width) + `.prettierignore` + `eslint-config-prettier` integration. `bun run format` / `format:check` scripts |
| ESLint 57→0 | Fixed 37 lint issues: `exhaustive-deps` (added `readOnly` to 14 dep arrays), `set-state-in-effect` (baby logs refactored to event handlers), `preserve-manual-memoization`, removed unused import |
| AdminMsg constants | 8 admin toast messages moved to `constants/messages.ts` enum (code hygiene #6) |
| `deleteInvite` | New function in `invite.ts` — localStorage + Firestore paths, `Result<void>` return |
| `useAdminActions` | New hook — `updateUserModules` + `updateUserRole` with Firestore writes |
| Shared `formatDistance` | Deduplicated from ActivityLog + BodyStats into `shared/utils/format.ts` (code hygiene #19) |
| Shared `sortNewestFirst` | Extracted 8 inline sort comparators into `shared/utils/sort.ts` (code hygiene #19) |
| Role tests (2e.7-2e.9) | Viewer data scoping (4), admin user selector (5), cross-role gate/negative tests (7) |
| Theme roster finalized | 10 themes designed — 5 dropped (color overlap), 5 new added. Showcase: `SAM/design-samples/theme-showcase-all.html` |

### Tests

| Metric | Before | After |
|---|---|---|
| Unit tests | 248 | 281 (+33) |
| E2E tests | 38 | 42 (+4) |
| ESLint problems | 57 | 0 |
| Test files | 32 | 38 (+6) |

---

## [0.2.1] — 2026-04-08

Bug fixes, Dashboard, consistency sweep, doc overhaul.

### Bug Fixes

| Change | What |
|---|---|
| Payment bubble toggle | Clicking an active payment method bubble now deselects it. `paymentMethod` state is `PaymentMethod \| null` — `null` means no method selected. Bubbles across all chip selectors should follow this toggle pattern |
| Number input min/step constraints | All `type="number"` inputs now have `min` and `step` attributes: amounts use `min="0.01" step="0.01"`, floor counts use `min="0" step="1"`. Prevents browser from accepting negative/zero values. Affected: `AddExpense`, `AddIncome`, `AddActivity`, `ActivityLog`, `FloorsTab` (6 inputs total; baby `GrowthLog` already had `min={0}`) |

### New Features

| Change | What |
|---|---|
| Cycling tab | `CyclingTab` component — same pattern as Walking/Running: `AddActivity` with `ActivityType.Cycle` default + `ActivityLog` filtered to cycle activities. Wired into `BodyPage` tab bar via `buildTabs(config)`. `BodyConfigForm` checkbox no longer disabled |
| Body reconfigure | ⚙ gear button in `BodyPage` tab bar opens `BodyConfigForm` pre-filled with current config. Saving returns to tabbed view. Users can now change activity toggles and floor height after initial setup |
| Activity list pagination | `ActivityLog` now shows 7 activities by default with "Show more" to expand to 30. Applies to Walking, Running, and Cycling tabs |
| Baby entry delete | All 4 baby log components (`FeedLog`, `SleepLog`, `GrowthLog`, `DiaperLog`) now have "x" delete buttons on each recent entry. `useBabyCollection` exposes `remove(id)` via the `StorageAdapter.remove` method. `useBabyData` exposes `removeFeed`, `removeSleep`, `removeGrowth`, `removeDiaper` |
| Budget time-range filter | `filterByDateRange()` in `budget-math.ts` — generic filter for Today/Week/Month/All using `BudgetView` enum. `ExpenseListPage` has 4-button toggle bar. Summary cards, expense list, and income list all reflect the selected range |
| Amount presets | Quick-tap [10] [20] [50] [100] [200] buttons below amount input in `AddExpense`. Tapping fills the amount field |
| CC Reconciliation | `ReconciliationView` component — shows CC charges, settlements, and outstanding balance. Accessible via "CC" tab on budget landing page. Respects time-range filter |
| Universal Dashboard | Role-aware dashboard at `/` with greeting, module summary cards (Body score, Budget spend, Baby child count). Admin user selector, Viewer banner. Cards use `shadow-sm` + `--accent-muted` tint for theme-aware depth |
| targetUid hook pattern | `useExpenses`, `useIncome`, `useBodyConfig`, `useBodyData`, `useBabyCollection`, `useChildren` accept optional `targetUid` for read-only data scoping. Write callbacks become no-ops when viewing another user's data |
| Header logo | "AFP" text replaced with `favicon.png` image, links to Dashboard |
| useAllUsers hook | Admin-only hook listing all profiled users from Firestore |
| Tap-to-edit (Body) | FloorsTab: tap row → +/- buttons redirect to that date. ActivityLog: tap row → AddActivity populates, "Update" button. All 3 tabs (Walk/Run/Cycle) wired |
| Tap-to-edit (Baby) | All 4 baby logs (Feed, Sleep, Growth, Diaper): tap entry → form populates, "Update" button, Cancel dismisses |
| Undo delete | Toast system extended with action button + custom duration. All 6 deletable lists show 10s undo toast (`CONFIG.UNDO_DURATION_MS`) |
| Consistent pagination | All 8 lists use `CONFIG.PAGE_SIZE` (25 default), "Show more" adds page, end-of-list message |
| m↔km conversion | Toggling m↔km in AddActivity now converts displayed value. `CONFIG.METERS_PER_KM` constant. `convertDistance()` utility |
| Baby child nav | Child creation auto-navigates to child detail. Dashboard cards tappable with icons → switch tab |
| Baby defaults | SleepLog: default start=now, end=now+15min. GrowthLog: submit disabled without at least one measurement |
| DevBench expansion | 4 new generators (Cycling, Income, Growth, Settlement). File split to bench-generators.ts. Error handling fixes. x1k day-spread (max 10/day) |

### Tests Added

| Test | File |
|---|---|
| Payment bubble deselect on 2nd click | `src/modules/expenses/__tests__/AddExpense.test.tsx` |
| No payment method → submits null | `src/modules/expenses/__tests__/AddExpense.test.tsx` |
| All bubbles deselectable | `src/modules/expenses/__tests__/AddExpense.test.tsx` |
| Amount input has min="0.01" | `src/modules/expenses/__tests__/AddExpense.test.tsx` |
| Amount input has step="0.01" | `src/modules/expenses/__tests__/AddExpense.test.tsx` |
| CyclingTab renders with Cycle default | `src/modules/body/__tests__/CyclingTab.test.tsx` |
| CyclingTab filters to cycle activities only | `src/modules/body/__tests__/CyclingTab.test.tsx` |
| CyclingTab hides log when no cycle activities | `src/modules/body/__tests__/CyclingTab.test.tsx` |
| BodyPage gear button visible when configured | `src/modules/body/__tests__/BodyPage.test.tsx` |
| Gear button opens config form | `src/modules/body/__tests__/BodyPage.test.tsx` |
| Config form pre-filled with current config | `src/modules/body/__tests__/BodyPage.test.tsx` |
| ActivityLog shows at most PAGE_SIZE by default | `src/modules/body/__tests__/ActivityLog.test.tsx` |
| "Show more" appears when >PAGE_SIZE activities | `src/modules/body/__tests__/ActivityLog.test.tsx` |
| No "Show more" when <=PAGE_SIZE activities | `src/modules/body/__tests__/ActivityLog.test.tsx` |
| "Show more" loads next page | `src/modules/body/__tests__/ActivityLog.test.tsx` |
| FeedLog shows delete button on entries | `src/modules/baby/__tests__/BabyLogActions.test.tsx` |
| Delete button calls removeFeed with correct ID | `src/modules/baby/__tests__/BabyLogActions.test.tsx` |
| filterByDateRange: All/Today/Week/Month + empty | `src/modules/expenses/__tests__/summary.test.ts` (5 tests) |
| Amount presets render, fill, replace | `src/modules/expenses/__tests__/AddExpense.test.tsx` (3 tests) |
| ReconciliationView summary + outstanding + empty | `src/modules/expenses/__tests__/ReconciliationView.test.tsx` (3 tests) |
| getGreeting + formatDayDate | `src/shared/utils/__tests__/utils.test.ts` (4 tests) |
| DashboardCard render + link + styling | `src/shared/components/__tests__/DashboardCard.test.tsx` (4 tests) |
| Dashboard greeting + cards + module gating | `src/shared/components/__tests__/Dashboard.test.tsx` (8 tests) |
| useAllUsers export | `src/admin/hooks/__tests__/useAllUsers.test.ts` (1 test) |
| createDefaultProfile, isValidNumber, toErrorMessage | `src/shared/utils/__tests__/utils.test.ts` (10 tests) |
| ActivityLog pagination updated for CONFIG.PAGE_SIZE | `src/modules/body/__tests__/ActivityLog.test.tsx` |
| FeedLog undo toast on delete | `src/modules/baby/__tests__/BabyLogActions.test.tsx` |

---

## [0.2.0] — 2026-04-06

Phase 2 redesign — shared foundation, body module config/tabbed UI, baby multi-child architecture.

### Phase 2.0: Shared Foundation

| Change | What |
|---|---|
| `UserRole.Viewer` | New role for read-only family access, scoped via `viewerOf` field |
| `ModuleId.Budget` | Renamed from `Expenses` — all references updated across codebase |
| String enums | `ActivityType` (Walk, Run, Cycle, Yoga), `BudgetView` (Today, Week, Month, All) |
| Numeric enums | `PaymentMethod` (7), `ExpenseCategory` (15), `IncomeSource` (5), `FeedType` (5), `SleepType` (2), `SleepQuality` (3), `DiaperType` (3) — JSDoc documented, compact Firestore storage |
| `UserProfile` expanded | Added `email`, `username`, `viewerOf`, `updatedAt` fields |
| `DbSubcollection` | Replaced `BabyFeeds`/`BabySleep`/`BabyGrowth`/`BabyDiapers` → `Feeds`/`Sleep`/`Growth`/`Diapers`; added `BodyConfig`, `BudgetConfig`, `Income`, `Children` |
| Routes | Added `Dashboard`, `Budget*`, `BabyChild`, `Profile`, `AdminInvites`/`AdminUsers`; removed old baby sub-routes |
| Messages | `ExpenseMsg` → `BudgetMsg`; added `BodyMsg`, `BabyMsg` with module-specific toasts |
| `childPath()` helper | Builds `users/{uid}/children/{childId}` path |
| Firestore rules | Viewer role (`isViewer`, `isViewerOf`), `exists()` guard on admin check, nested children subcollections, budget module (`'budget'` not `'expenses'`), `usernames` collection for uniqueness |
| Tooling | `.worktrees/**` and `.claude/**` excluded from vitest + eslint (prevents cross-contamination from git worktrees) |

### Phase 2a: Body Module Redesign

| Change | What |
|---|---|
| `BodyConfig` type | Activity toggles (floors, walking, running, cycling, yoga) + `floorHeight` + `configuredAt` |
| `BodyRecord` flattened | `.up`/`.down` instead of `.floors.up`/`.floors.down`; added `updatedAt` |
| `BodyActivity` type | Replaces `ActivityEntry` — nullable `distance`/`duration`, uses shared `ActivityType` enum |
| `useBodyConfig` hook | Listener + save for `body_config/main` document |
| `BodyPage` | Tabbed container with config gate — shows `BodyConfigForm` if unconfigured, tabs if configured |
| `BodyConfigForm` | Activity toggle checkboxes, floor height radio (2.5/3.0/3.5m), Cycling/Yoga as "coming soon" |
| `BodyStats` | Today summary (floors, walk, score) + weekly stats dashboard |
| `FloorsTab` | Floor counting with tap buttons + recent days list + inline edit/backfill |
| `WalkingTab` / `RunningTab` | Activity logging + recent list |
| `saveRecord()` | Added to `useBodyData` — allows saving/editing any date (backfill support) |
| Scoring | Updated `computeBodyScore` for flattened `BodyRecord` shape |

### Phase 2b: Baby Module Redesign

| Change | What |
|---|---|
| `Child` / `ChildConfig` types | Multi-child support — name, dob, per-child module toggles (feeding, sleep, growth, diapers) |
| Entry types updated | `FeedEntry`, `SleepEntry`, `GrowthEntry`, `DiaperEntry` now use numeric enums from shared types, added `timestamp`/`createdAt` |
| `useChildren` hook | CRUD for `users/{uid}/children/{childId}` collection |
| `useBabyCollection` refactored | Accepts `childId` parameter — paths now `users/{uid}/children/{childId}/feeds` (nested, not flat) |
| `useBabyData` refactored | Takes `childId`, composes per-child subcollection hooks |
| `BabyLanding` | All-children card view with age display, config badges, "Add Child" onboarding |
| `AddChild` | Form for name, DOB, module toggles |
| `ChildDetail` | Route-aware (`useParams`), per-child tabbed view: Dashboard + configured module tabs |
| `computeAge()` | Utility: Newborn / X months / X years from DOB |
| Log components | `FeedLog`, `SleepLog`, `GrowthLog`, `DiaperLog` accept `childId` prop |

### Routing

| Route | Component |
|---|---|
| `/body` | `BodyPage` (config gate → tabbed) |
| `/baby` | `BabyLanding` (children list) |
| `/baby/:childId` | `ChildDetail` (per-child tabs) |
| `/budget` | `ExpenseListPage` (was `/expenses`) |
| `/budget/add` | `AddExpensePage` (was `/expenses/add`) |

### Bug Fixes

| Bug | Fix |
|---|---|
| BodyStats buttons hardcoded | Now reads `BodyConfig`, only shows buttons for enabled activities |
| RunningTab empty list | `BodyPage` passes all activities instead of `todayActivities` |
| ActivityLog oldest first | Sorted by `createdAt` descending (newest first) |
| ActivityLog no edit | Added inline tap-to-edit for distance |
| Redundant "Walk"/"Run" label | Shows activity date instead of type on Walking/Running tabs |
| FloorsTab capped at 7 | "Show more" expands to 30 days |
| Expense FAB invisible | `bg-primary` → `bg-accent text-fg-on-accent` |
| Stats missing Run card | Run distance card now shows when `config.running` enabled or has data |

### Dev Tooling

| Change | What |
|---|---|
| DevBench | Dev-only panel on `/debug` — seed random data per module with single or bulk (×100, ×1k) buttons |
| Nuke localStorage | One-click wipe of all `afp:*` keys + reload |
| Baby bench | Auto-creates random child (gibberish name, random DOB) on first press |
| Bulk seed | `console.table` output for bulk runs |
| `.worktrees`/`.claude` excluded | vitest + eslint ignore worktree/agent directories |

### Design Samples

| File | Direction |
|---|---|
| `SAM/design-samples/stats-A-warm-instrument.html` | Warm tones, progress ring, DM Serif, weekly bar chart → Family Blue / Summit |
| `SAM/design-samples/stats-B-dense-editorial.html` | Editorial, data table with mini-bars, Fraunces → Corporate Glass |
| `SAM/design-samples/stats-C-playful-streak.html` | Dark, gamified, streak banner, XP bar, heatmap → Night City / Deep Mariana |

### Tests

| Change | What |
|---|---|
| Phase 2.0 tests | All new enums, constants, routes, messages — 34 new tests |
| Body tests | Config validation, gate logic, tab building, scoring with flattened records — 18 new tests |
| Baby tests | Child type shapes, `computeAge`, `ChildDetail` render (MemoryRouter), validation with enums — 29 new tests |
| Total | 60 → **143** tests (+83) across 17 test files |

### Design Docs (created in brainstorming session)

| File | What |
|---|---|
| `docs/specs/2026-04-06-phase2-design.md` | Full Phase 2 design spec — enums, Firestore schema, JSON examples, all 6 sub-phases |
| `docs/plans/2026-04-06-phase2-master.md` | Master plan with progress table and phase links |
| `docs/plans/2026-04-06-phase2-00-foundation.md` | Phase 0: shared enums, types, Firestore rules |
| `docs/plans/2026-04-06-phase2-2a-body.md` | Phase 2a: body module redesign |
| `docs/plans/2026-04-06-phase2-2b-baby.md` | Phase 2b: baby module redesign |
| `docs/plans/2026-04-06-phase2-2c-budget.md` | Phase 2c: budget module (future) |
| `docs/plans/2026-04-06-phase2-2d-profile.md` | Phase 2d: profile/settings (future) |
| `docs/plans/2026-04-06-phase2-2e-admin-viewer.md` | Phase 2e: admin + viewer (future) |
| `docs/plans/2026-04-06-phase2-2f-themes.md` | Phase 2f: new themes (future) |

---

## [0.1.0] — 2026-04-04

App goes live. Firebase connected, admin bootstrapped, Google auth, body module expanded.

### Firebase & Auth

| Change | What |
|---|---|
| Google Sign-In | Anonymous account linking via popup, compact header button, full button on invite/landing |
| Invite flow | Requires Google sign-in before redeeming — prevents orphaned anonymous profiles |
| Admin bootstrap | `scripts/init-admin.ts` using Firebase Admin SDK (one-time service account script) |
| Profile photo | Google avatar in header when signed in, "Link Google" button when anonymous |
| No-profile wall | Explains invite-only access, Google sign-in for returning users |
| Popup cancel | Handled gracefully — no ugly SDK error, compact mode uses toast |
| InviteRedeem retry | "Try Again" button on redemption failure |
| Debug page | `/#/debug` → `/debug` — shows Firebase config, auth state, email, storage mode |

### BrowserRouter Migration

| Change | What |
|---|---|
| HashRouter → BrowserRouter | `basename={import.meta.env.BASE_URL}`, dynamic dev/prod |
| `public/404.html` | GitHub Pages SPA redirect trick |
| `index.html` | SPA restore script pairs with 404.html |
| E2E tests | All `/#/` paths → `/` |

### Body Module Expansion

| Change | What |
|---|---|
| Walk/Run tracking | `ActivityType` enum, `ActivityEntry` type, `body_activities` subcollection |
| Distance input | `AddActivity` component — bubble selector (Walk/Run), m/km toggle |
| Activity log | `ActivityLog` component — today's entries in reverse chronological order |
| Scoring | `computeBodyScore(record)` — floors + walk (0.5 pt/100m) + run (1 pt/100m) |
| Step approximation | `computeSteps(distance, stride)` — derives from configurable defaults |
| Constants | `BODY_DEFAULTS` (floor height, stride), `SCORING_WEIGHTS`, `ACTIVITY_LABELS` |
| Firestore rules | Added `body_activities` rule |

### Baby Module Refactor

| Change | What |
|---|---|
| Generic hook | `useBabyCollection<T>` — shared listener, state, ready tracking, save |
| Sync race fix | `useBabyData` only sets `Synced` when all 4 listeners report ready |
| Validation | `validateFeedEntry`, `validateSleepEntry`, `validateGrowthEntry`, `validateDiaperEntry` |

### Code Quality

| Change | What |
|---|---|
| ThemeId → enum | String union converted to TypeScript string enum |
| Rename headminick | `headminick.ts` → `the-admin-nick.ts`, `DbField.HeadminickUid` → `DbField.AdminUid` (Firestore value unchanged) |
| DebugPage | `isOk` → `isPassing` (avoids shadowing canonical helper) |
| init-admin.ts | Documented string literal → enum mappings |
| Expense FAB | Floating `+` button on expense list page |
| AddActivity try/finally | `isSaving` always resets even on error |
| logActivity ref | Uses `activitiesRef` to avoid stale closure in summary save |

### Tests

| Change | What |
|---|---|
| Unit tests | 60 tests (was 32) — body scoring/types/constants, baby validation |
| E2E tests | 41 tests (was 35) — body activity flow, BrowserRouter URLs |

### Docs

| Change | What |
|---|---|
| `docs/getting-started.md` | Setup guide — dev mode, prod, Firebase console, auth, modules |
| `docs/ROADMAP.md` | Prioritized backlog (P0-P3) with done items |
| CLAUDE.md | BrowserRouter, auth, body activities, baby hooks, ThemeId enum |
| Subdirectory READMEs | Updated body, baby, auth, themes |

---

## [pre-0.0.5] — 2026-04-03

Nick's 20-point review — remaining 9 items + Final Countdown critical fixes.

### Nick's Review Fixes (9 remaining items)

| # | Point | What |
|---|---|---|
| 3 | Split `&&` scripts | Added `typecheck`, `lint:eslint` as separate commands; `setup:env:all` uses `bun run` composition |
| 5 | Routes as enum | `enum AppPath` created, `ROUTES` const consumes it |
| 6 | Error/message constants | `constants/messages.ts` — `ValidationMsg`, `InviteMsg`, `ExpenseMsg`, `ProviderMsg` enums |
| 10 | DB path constants | `constants/db.ts` — `DbCollection`, `DbSubcollection`, `DbDoc`, `DbField` enums + `userPath()`, `userBabyPath()` helpers |
| 11 | Invite code config | `CODE_LENGTH`, `CHARSET`, `DEV_INVITES_KEY` moved to `CONFIG` |
| 12 | Regex constants | `utils/regex.ts` — `DATE_RE`, `INVITE_CODE_RE` centralized |
| 14 | Explicit arrow returns | All exported arrow functions now have `return` (except tiny type helpers) |
| 16 | JSX curly newlines | Added `eslint-plugin-react` + `react/jsx-curly-newline` rule, autofixed 9 files |
| 17 | No ternary in TSX | Replaced with `cond && ...` / `!cond && ...` pattern in all components |

### Final Countdown Fixes

| Fix | What |
|---|---|
| `UserRole.TheAdminNick` | Renamed from `Headminick`, value `'theAdminNick'`, `isTheAdminNick` everywhere |
| `BodyRecord.id` | Added missing `id: string` field, future fields typed `number \| null` |
| `useAdmin` onSnapshot | Added `onError` callback |
| `App.tsx` routes | All 12 routes now use `ROUTES.*` constants |
| `VERSION` fallback | `\|\|` → `??` |
| `todayStr()` UTC bug | Fixed to use local date |
| `readCollection` bare catch | Added `console.warn` logging |
| Admin heading | "Headminick Admin" → "Admin" |
| Double crown | Tab label "👑 👑 Admin" → "👑 Admin" |
| Vitest config | Excludes `e2e/` directory |

### Initial Commit — File Manifest

| File | Status | Description |
|------|--------|-------------|
| `.env.example` | ✅ | Firebase env template (placeholder values) |
| `.github/workflows/deploy.yml` | ✅ | GitHub Pages deploy — secrets, pinned bun 1.3.11, deploy URL output |
| `.gitignore` | ✅ | AI tools, editor files, build artifacts, env files |
| `CHANGELOG.md` | ✅ | Full changelog pre-0.0.1 → pre-0.0.5 + backlog |
| `CLAUDE.md` | ✅ | Project instructions, conventions, gotchas, security |
| `bun.lock` | ✅ | Bun lockfile |
| `docs/firebase-setup.md` | ✅ | Firebase setup guide (credentials stripped) |
| `docs/revz/audit-verification.md` | ✅ | Source app audit → AFP mapping |
| `docs/revz/nick-review-20-points.md` | ✅ | Nick's 20-point review tracker |
| `e2e/README.md` | ✅ | E2E directory readme |
| `e2e/app.spec.ts` | ✅ | 35 Playwright e2e tests |
| `eslint.config.js` | ✅ | ESLint + react-hooks + react-refresh + jsx-curly-newline |
| `firebase.json` | ✅ | Firebase project config |
| `firestore.rules` | ✅ | Security rules — invite redeem, profile lock, module gates |
| `index.html` | ✅ | HTML entry, title "Vasudev Kukubkum" |
| `package.json` | ✅ | Dependencies + split scripts |
| `playwright.config.ts` | ✅ | Playwright config, port 3005 |
| `public/favicon.png` | ✅ | Vasudeva Kutumbakam logo 64x64 |
| `public/pwa-192x192.png` | ✅ | PWA icon 192px |
| `public/pwa-512x512.png` | ✅ | PWA icon 512px |
| `scripts/generate-icons.mjs` | ✅ | Icon generation script |
| `src/App.tsx` | ✅ | Root component — routing with ROUTES constants + guards |
| `src/main.tsx` | ✅ | React entry point |
| `src/index.css` | ✅ | Tailwind v4 theme config |
| `src/constants/config.ts` | ✅ | APP_NAME, VERSION, DEFAULT_THEME, invite config |
| `src/constants/routes.ts` | ✅ | `AppPath` enum + `ROUTES` const |
| `src/constants/db.ts` | ✅ | Firestore collection/doc/field enums + path helpers |
| `src/constants/messages.ts` | ✅ | Validation, invite, expense, provider error messages |
| `src/shared/types.ts` | ✅ | Result\<T\>, ModuleId, SyncStatus, UserRole enums |
| `src/shared/auth/auth-context.tsx` | ✅ | AuthProvider + dev bypass |
| `src/shared/auth/firebase-config.ts` | ✅ | Firebase init + isFirebaseConfigured |
| `src/shared/auth/headminick.ts` | ✅ | Admin initialization |
| `src/shared/auth/invite.ts` | ✅ | Invite create/redeem (transactional) |
| `src/shared/auth/useAuth.ts` | ✅ | useAuth hook |
| `src/shared/auth/InviteRedeem.tsx` | ✅ | Invite redemption page |
| `src/shared/components/AdminGate.tsx` | ✅ | Admin route guard |
| `src/shared/components/ModuleGate.tsx` | ✅ | Module route guard |
| `src/shared/components/Layout.tsx` | ✅ | App shell layout |
| `src/shared/components/SyncStatus.tsx` | ✅ | SyncStatusIndicator component |
| `src/shared/components/TabBar.tsx` | ✅ | Bottom tab navigation |
| `src/shared/components/UpdatePrompt.tsx` | ✅ | PWA update prompt |
| `src/shared/errors/ErrorBoundary.tsx` | ✅ | React error boundary |
| `src/shared/errors/toast-context.tsx` | ✅ | Toast provider |
| `src/shared/errors/useToast.ts` | ✅ | useToast hook |
| `src/shared/hooks/useModules.ts` | ✅ | Enabled modules hook |
| `src/shared/hooks/useSyncStatus.ts` | ✅ | Sync status hook |
| `src/shared/storage/adapter.ts` | ✅ | StorageAdapter interface |
| `src/shared/storage/create-adapter.ts` | ✅ | Adapter factory (Firebase/localStorage) |
| `src/shared/storage/firebase-adapter.ts` | ✅ | Firebase StorageAdapter impl |
| `src/shared/storage/localStorage-adapter.ts` | ✅ | localStorage StorageAdapter impl |
| `src/shared/utils/date.ts` | ✅ | todayStr (local), nowTime |
| `src/shared/utils/error.ts` | ✅ | toErrorMessage |
| `src/shared/utils/profile.ts` | ✅ | createDefaultProfile factory |
| `src/shared/utils/validation.ts` | ✅ | isValidNumber |
| `src/shared/utils/regex.ts` | ✅ | DATE_RE, INVITE_CODE_RE |
| `src/modules/body/components/BodyTracker.tsx` | ✅ | Body tracker UI |
| `src/modules/body/hooks/useBodyData.ts` | ✅ | Body data hook |
| `src/modules/body/scoring.ts` | ✅ | computeBodyScore |
| `src/modules/body/types.ts` | ✅ | BodyRecord (with id) |
| `src/modules/expenses/components/AddExpense.tsx` | ✅ | Add expense form |
| `src/modules/expenses/components/ExpenseList.tsx` | ✅ | Expense list view |
| `src/modules/expenses/hooks/useExpenses.ts` | ✅ | Expenses CRUD hook |
| `src/modules/expenses/pages/*.tsx` | ✅ | AddExpensePage, ExpenseListPage |
| `src/modules/expenses/categories.ts` | ✅ | Expense categories |
| `src/modules/expenses/types.ts` | ✅ | Expense types |
| `src/modules/expenses/validation.ts` | ✅ | Expense validation |
| `src/modules/baby/components/*.tsx` | ✅ | FeedLog, SleepLog, GrowthLog, DiaperLog |
| `src/modules/baby/hooks/useBabyData.ts` | ✅ | Baby data hook (4 subcollections) |
| `src/modules/baby/constants.ts` | ✅ | Feed/sleep/diaper type constants |
| `src/modules/baby/types.ts` | ✅ | Baby entry types |
| `src/admin/components/AdminPanel.tsx` | ✅ | Admin dashboard |
| `src/admin/components/InviteGenerator.tsx` | ✅ | Invite creation form |
| `src/admin/hooks/useAdmin.ts` | ✅ | Admin invites hook |
| `src/themes/*.css` (8 files) | ✅ | 7 theme CSS files + buttons.css + effects.css |
| `src/themes/themes.ts` | ✅ | Theme definitions + apply/detect |
| `src/**/__tests__/*.ts` (4 files) | ✅ | Unit tests — scoring, validation, types, toast, adapter, invite |
| `src/**/README.md` (12 files) | ✅ | Per-directory documentation |
| `src/test-setup.ts` | ✅ | Vitest jest-dom matchers |
| `src/pwa.d.ts` | ✅ | PWA type declarations |
| `src/vite-env.d.ts` | ✅ | Vite client types |
| `tsconfig.json` | ✅ | TypeScript strict config |
| `vite.config.ts` | ✅ | Vite + Tailwind + PWA + path alias |
| `vitest.config.ts` | ✅ | Vitest config (excludes e2e/) |

---

## [pre-0.0.4] — 2026-04-03

Final Countdown critical fixes + e2e test suite + remaining DRY cleanup.

### DRY Cleanup

| Change | Files | What |
|---|---|---|
| Remove duplicate date utils | `SleepLog.tsx`, `GrowthLog.tsx`, `DiaperLog.tsx` | Removed 3 more local `todayStr`/`nowTime` copies missed in Batch 3, import from `utils/date` |

### E2E Tests (Playwright)

| Change | What |
|---|---|
| `playwright.config.ts` (new) | Chromium headless, port 3005, auto-starts dev server |
| `e2e/app.spec.ts` (new) | 35 tests across all modules — app shell, body, expenses, baby (feed/sleep/growth/diaper), admin, route guards, theme |

### CI/CD & Config

| Change | What |
|---|---|
| `deploy.yml` | Added `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24`, pinned bun `1.3.11`, Firebase env vars from secrets, deploy URL output |
| `.gitignore` | Fixed broken `_.log` glob, added `.copilot/`, `.gemini/`, `.agents/`, `.worktrees/`, `.superpowers/`, editor files, deduplicated `.env` rules |
| `docs/firebase-setup.md` | Stripped real credentials (extracted to `.env.production`) |

### Security Fixes

| Fix | Severity | What |
|---|---|---|
| Invite write rules | Critical | Non-admins can now redeem unclaimed invites — only `linkedUid` + `usedAt` fields writable, all others immutable |
| Profile escalation | Critical | Owner can only update `theme`/`colorMode`/`name` — `role` and `modules` locked server-side |
| Atomic invite redemption | Medium | `redeemInvite` uses `runTransaction` — prevents double-redemption race condition |

### Route Guards

| Change | Severity | What |
|---|---|---|
| `ModuleGate` (new) | High | Wraps module routes — redirects to `/` if module disabled for user |
| `AdminGate` (new) | High | Wraps `/admin` routes — redirects to `/` if not Headminick |
| `App.tsx` routes | — | All module + admin routes wrapped in guards |

### Error Handling

| Change | Severity | What |
|---|---|---|
| `StorageAdapter.onSnapshot` | Medium | Added optional `onError` callback to interface |
| `firebase-adapter.ts` | — | Passes `onError` through to Firestore `onSnapshot` |
| `useBodyData`, `useExpenses`, `useBabyData` | — | All listeners now log errors + set `SyncStatus.Error` on failure |

---

## [pre-0.0.3] — 2026-04-03

Batch 2 (architecture/types) + Batch 3 (code style).

### Batch 2 — Architecture/Types

| Change | Files | What |
|---|---|---|
| String enums | `types.ts` + 7 consumers | `ModuleId`, `SyncStatus`, `UserRole` → TypeScript string enums; all string literals → enum members |
| Firebase config | `firebase-config.ts` | Separate `DEV_FIREBASE_CONFIG` / `PROD_FIREBASE_CONFIG`, removed `\|\|` fallbacks |
| TabBar typing | `TabBar.tsx` | `TabId = ModuleId \| 'admin'` type, removed `'admin' as ModuleId` unsafe cast |
| SyncStatus rename | `SyncStatus.tsx`, `Layout.tsx` | Component → `SyncStatusIndicator` (resolved name collision with enum) |
| Record keys | `SyncStatus.tsx`, `TabBar.tsx`, `InviteGenerator.tsx` | All `Record` keys use enum members (computed property names) |

### Batch 3 — Code Style

| Change | Files | What |
|---|---|---|
| DRY date utils | `FeedLog.tsx`, `AddExpense.tsx`, `useBodyData.ts` | Removed 3 local copies of `todayStr`/`nowTime`/`getTodayKey`, import from `utils/date` |
| Rename scoring | `scoring.ts`, `useBodyData.ts`, `scoring.test.ts` | `calculateTotal` → `computeBodyScore` |
| Validation util | `utils/validation.ts` (new), `AddExpense.tsx` | `isValidNumber()` — replaces inline `isNaN(x) \|\| x <= 0` |
| No dayjs | — | Evaluated and rejected — native `Date` sufficient for all current usage |

---

## [pre-0.0.2] — 2026-04-02 → 2026-04-03

Batch 1 code quality fixes + Batch 4 dev mode adapter.

---

## [pre-0.0.1] — 2026-04-01

Phase 1 scaffold from scratch.

### Phase 1 — Full Scaffold (2026-04-01)

| # | Area | What |
|---|---|---|
| 1 | Project setup | Vite 8 + React 19 + TypeScript strict + Tailwind v4 + Bun |
| 2 | Theme system | 7 themes (Family Blue default + 6 ported from Floor-Tracker), CSS custom properties |
| 3 | Auth | Firebase anonymous auth, AuthProvider, invite-only model |
| 4 | StorageAdapter | Interface + FirebaseAdapter (`getAll`, `getById`, `save`, `remove`, `onSnapshot`) |
| 5 | Types | `Result<T>`, `ok()`, `err()`, `UserProfile`, `ModuleConfig`, `SyncStatus` |
| 6 | Body module | `useBodyData`, `BodyTracker` — floor up/down tap, daily totals, scoring |
| 7 | Expenses module | `useExpenses`, `ExpenseList`, `AddExpense` — CRUD, soft-delete, validation |
| 8 | Baby module | `useBabyData`, `FeedLog`, `SleepLog`, `GrowthLog`, `DiaperLog` — 4 subcollections |
| 9 | Admin | `useAdmin`, `AdminPanel`, `InviteGenerator` — invite creation + list |
| 10 | Invite flow | `InviteRedeem` — code validation, Firestore redeem, profile creation |
| 11 | Layout | `Layout`, `TabBar` (body/expenses/baby/admin), `SyncStatus` indicator |
| 12 | Error handling | `ErrorBoundary`, `ToastProvider`, `useToast` — toast notifications |
| 13 | Routing | HashRouter, all module routes, `/invite/:code` |
| 14 | Icons | Globe-in-hands favicon + PWA icons (192, 512) in Family Blue palette |
| 15 | App identity | Title "Vasudev Kukubkum", favicon.png |
| 16 | Env system | `.env.example`, `setup:env` scripts, `isFirebaseConfigured` flag, dev bypass |
| 17 | Dev bypass | `DEV_PROFILE` (Headminick, all modules), no Firebase calls in dev mode |
| 18 | Tests | 32 tests across types, scoring, validation, toast, adapter, invite |
| 19 | CI/CD | GitHub Actions deploy to GitHub Pages on `master` push |
| 20 | PWA | `vite-plugin-pwa`, service worker, `UpdatePrompt` component |
| 21 | Per-dir READMEs | README.md in each `src/` subdirectory |

### Batch 1 — Code Quality Fixes (2026-04-02)

| Fix | File | What |
|---|---|---|
| ESLint coverage ignore | `eslint.config.js` | Added `coverage`, `dev-dist`, `.final-countdown-reports` to globalIgnores |
| Fast-refresh: auth | `useAuth.ts` (new) | Split `useAuth` hook out of `auth-context.tsx` |
| Fast-refresh: toast | `useToast.ts` (new) | Split `useToast` hook out of `toast-context.tsx` |
| setState-in-effect | `auth-context.tsx` | Moved dev bypass to `useState` initial value (not `useEffect`) |
| setState-in-effect | `InviteRedeem.tsx` | Moved code validation to `useMemo` initial state |
| Firestore path bug | `invite.ts` | Fixed `doc(db, 'app', 'invites', code)` → `doc(db, 'invites', code)` (3-segment path invalid) |
| Firestore rules | `firestore.rules` | Updated invite path to match `/invites/{inviteCode}` |
| Unused vars ESLint | `eslint.config.js` | Added `argsIgnorePattern: '^_'` |
| Shared utils | `utils/date.ts`, `utils/error.ts`, `utils/profile.ts` | Extracted `todayStr`, `nowTime`, `toErrorMessage`, `createDefaultProfile` |
| Deploy branch | `.github/workflows/deploy.yml` | Fixed `main` → `master` |

### Batch 4 — Dev Mode: All Buttons Work (2026-04-03)

| Change | File | What |
|---|---|---|
| localStorage adapter | `storage/localStorage-adapter.ts` (new) | Full `StorageAdapter` backed by localStorage with in-memory listeners |
| Adapter factory | `storage/create-adapter.ts` (new) | `createAdapter(basePath)` — Firebase in prod, localStorage in dev |
| Fake firebaseUser | `auth-context.tsx` | Dev mode: `firebaseUser = { uid: 'dev-user' }` so hooks don't bail |
| Body hook | `useBodyData.ts` | `createFirebaseAdapter` → `createAdapter` |
| Expenses hook | `useExpenses.ts` | `createFirebaseAdapter` → `createAdapter` |
| Baby hook | `useBabyData.ts` | `createFirebaseAdapter` → `createAdapter` |
| Admin hook | `useAdmin.ts` | Dev: reads invites from `localStorage` as lazy initial state |
| Invite create | `invite.ts` | Dev: `createInvite` stores to `DEV_INVITES_KEY` in localStorage |

---

## Backlog

| Item | Priority | What |
|---|---|---|
| JSX curly newlines | Medium | `react/jsx-curly-newline: require` — add `eslint-plugin-react`, autofix all `.tsx` files |
| No ternary in JSX | Medium | Extract ternaries from JSX return blocks to variables/early returns (AdminPanel, FeedLog, etc.) |
| Error message constants | Medium | Centralize inline error strings into a constants file |
| DB path constants | Medium | Centralize Firestore paths (`'invites'`, `'body'`, `'users'`, etc.) into a constants file — no inline strings |
| Hash → BrowserRouter | Low | User said "hash routing NO" — switch to BrowserRouter + 404.html trick |
| Firestore runtime validation | Low | Replace `as T` casts with parse functions at adapter boundary |
| Split `useBabyData` | Low | SRP — split into `useFeedData`, `useSleepData`, `useGrowthData`, `useDiaperData` |
| Baby module validation | Low | Add `validateFeedEntry()` etc. — follow expense module pattern |
| `ThemeId` → enum | Low | Convert string union to enum for consistency with ModuleId/SyncStatus/UserRole |

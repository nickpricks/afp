# components/

App shell components for layout, navigation, route guards, dashboard, profile, dev tools, and loading screens.

## Files

- **Layout.tsx** — Root app shell with header, routed content area, tab bar, auth gate, Suspense wrapper with LoadingScreen, and PWA update prompt
- **TabBar.tsx** — Bottom navigation bar with one tab per enabled module plus admin tab
- **SyncStatus.tsx** — `SyncStatusIndicator` component showing a colored dot and label for sync state
- **UpdatePrompt.tsx** — PWA service worker update notification banner
- **AdminGate.tsx** — Route guard that renders children only if the user is TheAdminNick
- **ModuleGate.tsx** — Route guard that renders children only if the given module is enabled
- **AdminClaim.tsx** — First-run screen letting the first authenticated user claim admin role (Google sign-in + claim flow)
- **Dashboard.tsx** — Role-aware home page at `/` with per-module summary cards (Body, Budget, Baby)
- **DashboardCard.tsx** — Reusable card component linking to a module page with icon, metric, and subtitle
- **ActivityTrackerCard.tsx** — Dashboard CTA to start a live activity session (Walk or Run). Reads `useLiveActivityContext` and hides when a session is already running. Renders only when Body module is enabled
- **ProfilePage.tsx** — User profile page with username, theme picker (expandable inline 2-col grid), color mode, two tier pickers (5-tier intensity for particle count, 3-tier size for scale), sign out, and changelog viewer. Real-time slider/picker saves silent-fail toward the user but log via `verr('[AFP:profile:save]', …)` so a Firestore permission regression isn't invisible
- **GoogleSignInButton.tsx** — Google sign-in button handling account linking and error display
- **AnimationViewer.tsx** — Dedicated page for previewing loading animations with pill tab switcher and text toggle
- **DevBench.tsx** — Dev-only tool for generating test data across all modules with bulk modes
- **bench-generators.ts** — Pure generator functions for DevBench (11 generators with x1/x100/x1k bulk + day-spread)
- **DebugPage.tsx** — Debug info page showing auth state, config, and DevBench
- **AlertBanner.tsx** — Severity-coded top banner (Info / Warning / Critical) for user-facing notifications
- **DatePickerModal.tsx** — Modal for picking a backfill date; validates against a configurable min date
- **SwipeToDelete.tsx** — CSS-only swipe-right-to-delete wrapper for touch devices (80 px threshold)
- **ConsoleViewer.tsx** — In-app console log viewer component; renders captured `ConsoleEntry` items with level-coded colours
- **ListControls.tsx** — Universal list controls strip: time-range pills (Today / Week / Month / All) + page-size dropdown (`[5, 10, 25, 50, 100, 500]`) + page jumper with prev/next/go-to-page input. Used by every list view in AFP. Pure controlled component — props in, callbacks out, no internal state
- **ListShowMoreFooter.tsx** — Bottom escape-hatch button below paginated lists. Label is contextual: `"Show all N records"` when many entries are hidden, `"Load N remaining"` when few are. Renders nothing when nothing is hidden. Click → calls `onShowAll()` to toggle the hook's `showAll` flag
- **AmbientEffects.tsx** — Dynamic particle renderer driven by the active theme. Returns null when intensity is 0 or `prefers-reduced-motion` matches. Reads `useMatchMedia` for reduced-motion and `useViewportSizeMultiplier` for the mobile-shrink factor; multiplies `--fx-size` (depth-only `--fx-scale` stays unmultiplied to avoid double-compounding mobile to 0.42×)
- **IntensityTierPicker.tsx** — 5-button tier row (Off / Subtle / Standard / Lively / Maximum). Atomic clicks. Active-state highlight via `bucketIntensity()` so legacy slider values display correctly
- **SizeTierPicker.tsx** — 3-button tier row (Small / Medium / Large = 70 / 100 / 140 multiplier). Mirror of IntensityTierPicker. Active-state highlight via `bucketEffectSize()`
- **glyph-primitives.tsx** — Shape-primitive glyph registry replacing emoji for 8 effects (Snowflake/Leaf as SVG; Star/Heart/InkBlot/Bubble/Ember/Wisp/Fallback as pure CSS). `GlyphWrapper` sizes at `GLYPH_INNER_SIZE` (80%) of the particle container with flex centering; inner shapes fill 100%. Module-level style consts hoisted to avoid per-render allocation. Patronus emoji stay outside the registry — rendered as filtered text in `AmbientEffects`

## lists/ subdirectory

List-row primitives shared across grouped/paginated list views. See `lists/README.md`.

## loading/ subdirectory

Animated loading screen shown during auth initialization and Suspense fallbacks.

- **constants.ts** — `BRAND_TEXT` constant ("IT STARTED ON APRIL FOOLS DAY")
- **LoadingScreen.tsx** — Randomly selects one of three SVG scene components, displays brand text with staggered letter reveal
- **SceneClimber.tsx** — SVG stick figure climbing a 5-step staircase (ported from Floor-Tracker)
- **SceneAthlete.tsx** — SVG stick figure alternating between running and boxing poses
- **SceneReader.tsx** — SVG head+torso stick figure with spectacles comparing two papers

## Tests

Tests in `__tests__/`: `Dashboard.test.tsx`, `DashboardCard.test.tsx`, `ProfilePage.test.tsx`, `ProfilePage.silent-fail.test.tsx` (locks the silent-toast contract with a rejecting adapter mock), `AlertBanner.test.tsx`, `ProfileModuleRequest.test.tsx`, `AmbientEffects.test.tsx` (depth correlation, viewport multiplier, effectSize prop, reduced-motion × effectSize interaction), `IntensityTierPicker.test.tsx`, `SizeTierPicker.test.tsx`, `glyph-primitives.test.tsx`, `ListControls.test.tsx`, `ListShowMoreFooter.test.tsx`, `bench-generators.test.ts`. Loading screen tests in `loading/__tests__/LoadingScreen.test.tsx`.

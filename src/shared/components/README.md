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
- **ProfilePage.tsx** — User profile page with username, theme picker (expandable inline 2-col grid with effect sliders for particle count and size), color mode, sign out, and changelog viewer
- **GoogleSignInButton.tsx** — Google sign-in button handling account linking and error display
- **AnimationViewer.tsx** — Dedicated page for previewing loading animations with pill tab switcher and text toggle
- **DevBench.tsx** — Dev-only tool for generating test data across all modules with bulk modes
- **bench-generators.ts** — Pure generator functions for DevBench (11 generators with x1/x100/x1k bulk + day-spread)
- **DebugPage.tsx** — Debug info page showing auth state, config, and DevBench

## loading/ subdirectory

Animated loading screen shown during auth initialization and Suspense fallbacks.

- **constants.ts** — `BRAND_TEXT` constant ("IT STARTED ON APRIL FOOLS DAY")
- **LoadingScreen.tsx** — Randomly selects one of three SVG scene components, displays brand text with staggered letter reveal
- **SceneClimber.tsx** — SVG stick figure climbing a 5-step staircase (ported from Floor-Tracker)
- **SceneAthlete.tsx** — SVG stick figure alternating between running and boxing poses
- **SceneReader.tsx** — SVG head+torso stick figure with spectacles comparing two papers

## Tests

Tests in `__tests__/`: `Dashboard.test.tsx`, `DashboardCard.test.tsx`, `ProfilePage.test.tsx`. Loading screen tests in `loading/__tests__/LoadingScreen.test.tsx`.

# Changelog

All notable changes to AFP ("It Started On April Fools Day") are documented here.

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

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

AFP ("It Started On April Fools Day") — unified personal PWA combining body/fitness tracking, expense tracking, and baby tracking. Invite-only access via TheAdminNick admin model.
Design spec: `docs/specs/2026-04-01-aprilfoolsjoke-design.md`
Implementation plan: `docs/plans/2026-04-01-aprilfoolsjoke-phase1.md`
Firebase setup: `docs/firebase-setup.md`

**Docs filename convention:** Both `docs/plans/` and `docs/specs/` use `YYYY-MM-DD-<topic>.md` on AFP — diverges from the global CLAUDE.md (which date-prefixes plans only, topic-names specs). Chronological grouping pairs cleanly with how phases ship and keeps spec↔plan crosswalk grep-friendly.

## Branch Naming

Branches follow a comedic narrative arc around the April Fools origin story — each name is a chapter beat. Pick from the available queue; **don't burn reserved names on routine work** (they announce the saga's ending).

**Used so far** (chronological):
`the-prank` → `no-joke` → `joke-landed` → `last-laugh` → `the-plan-thickens` → `the-foolproof-alibi` → `exhibit-a` → `alibi-has-holes` (fix) → `exhibit-b` → `the-atmosphere-thickens` → `dialing-it-in` → `the-fine-print` → `who-planned-it` → `the-rehearsal` → `what-was-the-joke` → `the-flaw-in-the-plan` → `the-original-script` 🚧 (in flight — Family Umbrella overhaul: family-scoped data model, expense shared ledger, baby IA redesign + submodule remove, body auto-tracking)

**Available next** (comedy-flashback queue, pick from these for upcoming branches):
`where-it-all-began`

**Reserved — DO NOT USE on routine PRs** (trial-ending beats, save for the actual saga wrap):
`cross-examination`, `closing-arguments`, `the-jury-deliberates`, `the-verdict`, `the-sentence`, `sealing-the-record`, `case-closed`

All branches are prefixed `feat/` (or `fix/` for hotfixes). Use `git for-each-ref --sort=creatordate refs/remotes/origin/` to verify the latest used names before picking.

## Commands

- `bun run dev` — dev server (port 3000)
- `bun run build` — tsc + vite build
- `bun run lint` — tsc --noEmit + eslint
- `bun run test` / `bun run test:watch` — vitest
- `bun run test:coverage` — vitest with v8 coverage
- `bun run test:e2e` — playwright
- `bun run setup:env` — creates .env.development from .env.example
- `bun run setup:env:all` — creates both .env.development and .env.production
- `bun run clean` — removes dist, coverage, dev-dist, reports
- Single test: `bunx vitest run src/shared/__tests__/types.test.ts`

- `bun run dev -- --port 3005 --host` — dev server on custom port with network access (for Chrome DevTools MCP)

Package manager: **bun** (not npm/yarn). Cross-platform scripts use **shx** (not bash).

## Dependency Posture — Stabilize (decided 2026-05-07)

**Path B: stabilize.** Pin major versions aggressively; prioritize "runs in 5 years with minimal touching" over "stay on the bleeding edge."

- **Don't proactively upgrade major versions** unless an upstream security issue forces it. Locked majors today: React 19, Firebase 12, react-router 7, Vitest 4, Bun 1.x.
- **Two majors flagged for downgrade** when convenient: Tailwind CSS v4 → v3 LTS (proven plugin ecosystem, mature docs), Vite v8 → v6 (stable plugin compatibility). Tracked but not blocking.
- **Vendor third-party dependencies** that the project's identity depends on. Google Fonts get vendored via `fontsource-cli` (tracked as a pending task) so atmosphere/typography don't break if Google's CDN moves. Same posture for any future CDN-loaded asset.
- **Minor + patch upgrades are fine** — they're contracted as backwards compatible. Only major bumps need a deliberate decision.
- **Chase posture rationale was rejected**: AFP is a personal long-lived PWA, not a learn-the-stack portfolio piece. Upgrade-tax cost compounds; preservation of working state compounds in the other direction.

## Architecture

React 19 + Vite 8 + TypeScript (strict) + Tailwind CSS v4 + Firebase

- **BrowserRouter** via react-router-dom with `basename={import.meta.env.BASE_URL}`. GitHub Pages SPA supported via `public/404.html` redirect trick
- **Default branch**: `master` (not main)
- **Module system**: body, expenses, baby — all disabled by default, TheAdminNick enables per user
- **Family model** (Family Umbrella Pillar 1): root `families/{familyId}` doc (members map uid→`FamilyRole`; `null` = unlink tombstone — adapter merge-saves can't delete keys, filter via `familyMemberUids()`). `UserProfile.familyId` (default null, locked server-side like `role`). Data stays per-user; family grants cross-member READ (profile, body, expenses, income) + READ/WRITE on `children/**` via `isFamilyMember()` rules helper. `useFamily(familyId)` = one-time doc fetch; admin `useFamilies()` = realtime list; create/unlink via `useAdminActions`. Cross-member reads = N per-member adapters from the members map — NO collectionGroup, no raw Firestore at call sites. `createAdapter(ROOT_PATH)` reaches top-level collections
- **Storage abstraction**: `StorageAdapter` interface in `src/shared/storage/`, Firebase impl + localStorage impl (dev mode). Factory: `createAdapter(basePath)` auto-selects
- **Enums**: `ModuleId`, `SyncStatus`, `UserRole`, `AppPath`, `DbCollection`, `DbSubcollection`, `DbDoc`, `DbField`, `ThemeId`, `ActivityType` are TypeScript string enums — use enum members, not string literals
- **Dashboard**: Role-aware home at `/`. Hooks accept optional `targetUid` — User reads own data, Viewer reads `viewerOf` user, Admin selects from `useAllUsers()`. Write callbacks no-op when `readOnly`. `DashboardCard` uses `shadow-sm` + `bg-[var(--accent-muted)]` for theme-aware styling. Baby card shows child count (option B)
- **Auth**: Anonymous auth + Google Sign-In (account linking). `signInWithGoogle()` in `google-auth.ts`. Invite flow requires Google sign-in before redemption
- **Body module**: Config gate (`useBodyConfig` → `BodyConfigForm` if unconfigured, tabbed `BodyPage` if configured). Floors (daily aggregate on `body/{dateKey}`) + walk/run/cycle activities (`body_activities/{id}`). Config in `body_config/main`. Scoring: `floors_up×1 + floors_down×0.5 + walk_km×10 + run_km×20 + cycle_km×15`. `dailyGoal` in `BodyConfig` (configurable via per-activity slider builder in config form). Score ring on Stats tab shows progress toward goal. **Sensor sessions (Pillar 4, 0.2.25)**: `useLiveActivity` (GPS distance, DeviceMotion steps, PressureSensor/GPS-altitude floors) + `ActiveSessionOverlay`; step detection via pure `step-math.ts` (`processMotionSample` rising-edge + refractory — never per-sample counting); `BodyActivity.source?: TrackingSource` (absent = manual), `BodyConfig.strideCm?` steps→distance fallback; DevBench Sensor Probe = device-support decision gate; raw sensor samples are in-memory only, never persisted
- **Budget module**: Directory is `src/modules/expenses/` but `ModuleId` is `Budget`. Income tracking via `useIncome`, payment methods via `PaymentMethod` enum, summary math in `budget-math.ts`. `BudgetSummary` accepts an optional `timeRange` prop and filters totals to match the active list filter — wrappers (`ExpenseListPage`) hoist a shared `timeRange` state to summary + both lists. **Family tab** (Family Umbrella Pillar 2, 0.2.23) — read-only ledger view gated on `profile.familyId`: `useFamilyExpenses` per-member adapter fan-out (no mutators, no collectionGroup), `computeFamilyTotals` summary strip, member attribution chips, Daily Ledger list. Owner = payer; no split/settle. **Auto tab** (Phase 2j, 0.2.18) — fourth tab alongside Expenses/Income/CC. State-based switching, no new route. Renders `<AutoTab>` which filters Vehicle + Travel expenses, shows quick-add buttons (⛽ Add Fuel · 🚕 Add Trip · 🔧 Service), inline form with tap-to-populate edit, and a derived `<ServiceDueBanner>` (yellow when `latestOdometer ≥ mostRecentMaintenance.nextService`). **Discriminated `meta` union on `Expense`**: `FuelMeta | TravelMeta | MaintenanceMeta` (in `types.ts`); validation extends `validateExpense` via internal `validateMeta(meta)` switch (exhaustive via `assertNever`). Pure derivations in `fuel-math.ts` (`computeMileage`, `latestOdometer`, `dueMaintenance`, `isServiceDue`). Form helpers in `meta-utils.ts` (`metaKindFor`, `subCatFor`, `defaultMeta`) — split from `MetaSubForm.tsx` to avoid `react-refresh/only-export-components` warnings. Two-of-three input math for fuel: any two of `{ liters, pricePerLiter, amount }` auto-fills the third on blur. `useExpenses` exposes `addExpense`, `updateExpense`, `deleteExpense` — `addExpense` requires explicit `paymentMethod: PaymentMethod` (no silent UPI default at the hook layer; wrappers default explicitly). Backwards-compatible: existing expenses without `meta` continue to work; show "incomplete" pill in Auto tab list
- **Baby module**: Multi-child via `children/{childId}` collection. `useBabyCollection(childId, subcollection, label, targetUid?)` for nested paths. `useBabyCollection` exposes `log`, `update`, `remove` — all return `Promise<boolean>`. `update` accepts an optional `{ silent: true }` to suppress the generic success toast (caller toasts a more specific message). `useBabyData` exposes `updateFeed/Sleep/Growth/Diaper/Elimination` (5 listeners — does not include Plan 4+ subcollections; new modules use `useBabyCollection<T>` directly). `BabyLanding` → `ChildDetail` routing. **Grouped nav (Family Umbrella Pillar 3, 0.2.24)**: `ChildNav` drawer (mobile) / sidebar (≥md) replaces top tabs — groups Overview (Dashboard, Journal — always) / Logs (config-gated) / Archived (collapsed, read-only). Section model from pure `computeChildSections(config, presence)` in `sections.ts`. `ChildConfig.archived` map retires feeds/sleep/elimination per child (archive-in-place — no data moves, Journal aggregates untouched; `readOnly` prop on the three logs). Needs merged into Presents as a segment (subcollection stays `needs/*`; Presents visible when `presents || needs`). **Elimination** — combined diaper/potty log via `EliminationLog.tsx` (replaces `DiaperLog`). Mode discriminator on `EliminationEntry`. Subcollection `elimination/*`. Tab visibility = `config.diapers || config.potty` with dynamic label (Diaper / Potty / Elimination). One-time migration (`diapers/*` → `elimination/*`) runs via Admin → Migrations tab (non-destructive — old entries preserved). **Meals** — `MealsLog.tsx`, subcollection `meals/*`, gated by `config.meals`. Auto-suggests meal type from current hour (Breakfast/Lunch/Dinner/Snack). Optional 7-value portion enum. **Needs** — `NeedsLog.tsx`, subcollection `needs/*`, gated by `config.needs`. Wishlist/inventory tracker with filter chips (All/Wishlist/Have/Outgrown) and lifecycle transition buttons (Bought → Outgrew). **Milestones** — `MilestonesLog.tsx` + `milestone-templates.ts` (10 quick-add chips), subcollection `milestones/*`, gated by `config.milestones`. 6 categories (Motor/Language/Social/Cognitive/Hobby/Other), grouped-by-category list, optional media URL link. **Presents** (🎁) — `PresentsLog.tsx`, two subcollections per child: `gifts/*` (physical objects) and `finances/*` (money). Gated by `config.presents`. Read-only aggregate on Budget module's "Kids" tab (`KidsFinanceTab`, gated on `profile.modules.baby`). Spent→Expense bridge via `ConfirmExpenseModal`. Math helpers in `presents-math.ts`. **Life Journal** (Plan 7) — `LifeJournalView.tsx` + `journal/` subdir (`constants.ts`, `types.ts`, `range.ts`, `aggregate.ts`) + `useJournalData` hook composing 7 `useBabyCollection` listeners. D/W/M retrospective aggregation — no new storage. Counting moments computed on-read by comparing cumulative totals before/after the period (no persisted counters). Always-visible tab at position 2. `DashboardTab` renders a today-stat strip from `useJournalData(Day grain)` above its navigation grid. **Needs semantics note**: `JournalSummary.needs{Added,Acquired,Outgrown}` filter by `date`-in-range AND current `status` — misses transitions whose creation date is in a different period. Accepted as "life event" scope for v1 (see `CHANGELOG.md [0.2.11]`).
- **DevBench split**: Generators in `src/shared/components/bench-generators.ts` (pure functions), component in `DevBench.tsx`. 11 generators with ×1/×100/×1k bulk modes + day-spread
- **Constants**: `constants/config.ts` (app config), `constants/routes.ts` (AppPath enum + ROUTES), `constants/db.ts` (Firestore paths), `constants/messages.ts` (error/toast messages)
- **Result types**: Every async operation returns `Result<T>`, never void. Use `ok()`, `err()`, `isOk()`, `isErr()` from `@/shared/types`
- **Error handling**: Toast notifications via `useToast()`, `ErrorBoundary` for React crashes, `SyncStatusIndicator` in header. Toast actions: `addToast(message, type, { action?: { label, onClick }, durationMs? })` — undo delete uses 10s toast with "Undo" button
- **Tap-to-edit pattern**: All list views use tap-row-to-populate-form. Body: FloorsTab redirects +/- buttons, ActivityLog populates AddActivity. Baby: all 7 logs (Feed, Sleep, Growth, Elimination, Meals, Needs, Milestones) populate their forms. Budget: AutoTab populates the inline form on tap; ExpensePage edit deferred. Active row: `bg-[var(--accent-muted)] border-l-2 border-l-accent`
- **List controls**: `CONFIG.UNDO_DURATION_MS` (10000) for undo delete toasts, `CONFIG.METERS_PER_KM` (1000) for distance conversion — never hardcode these values. List pagination is per-list session state via `useListControls()` (default page size `CONFIG.LIST_DEFAULT_PAGE_SIZE` = 5) plus the shared `<ListControls>` strip (time-range pills + page-size dropdown + page jumper) and `<ListShowMoreFooter>` (`Show all N records` / `Load N remaining` escape hatch). The legacy `CONFIG.PAGE_SIZE` constant has been retired.
- **Route guards**: `ModuleGate` wraps module routes, `AdminGate` wraps admin routes — redirect to `/` if unauthorized
- **Admin panel**: Tabbed container (Invites | Users | Broadcasts). `InvitesTab` has copy-link + delete actions. `UsersTab` has color-coded module chips (Body=indigo, Budget=emerald, Baby=pink), role stat bar, toggle switches, accordion expand, "View Dashboard" button per user, module request approve badges. `useAdminActions` hook for Firestore profile writes. Admin can view any user's dashboard via `?viewUser=uid` query param on `/`
- **Notifications**: Per-user subcollection `users/{uid}/notifications/{id}`. User→admin: module requests (writes to admin's subcollection + own `requestedModules`). Admin→user: alerts/notices with severity, type, and `shownTillDate` expiry. `useNotifications` reads own inbox, `useAdminNotifications` adds send/approve/delete actions. `AlertBanner` renders above header in Layout. `BroadcastsTab` in admin panel for composing alerts. Spec: `docs/specs/2026-04-14-notifications-module-requests-design.md`
- **Delete pattern**: Inline `x` text on all list rows (Body + Baby), `hover:text-red-500 hover:scale-125 hover:font-bold`. Mobile: `SwipeToDelete` wrapper (CSS-only touch, no gesture library — swap to `@use-gesture/react` if needed). Undo toast with `CONFIG.UNDO_DURATION_MS` (10s)
- **Verbose storage logging**: Both `localStorage-adapter.ts` and `firebase-adapter.ts` log all SAVE/REMOVE/SNAPSHOT operations via `vlog()` when debug verbose toggle is on. Prefixed `[AFP:storage:local]` or `[AFP:storage:fb]`
- **Invite viewer flow**: `InviteRecord` has optional `role` and `viewerOf` fields. `InviteGenerator` shows User/Viewer toggle + "View of" picker. `redeemInvite` creates Viewer profile with `viewerOf` scoping when `role='viewer'`
- **Dev bypass**: When Firebase isn't configured (`isFirebaseConfigured = false`), auth is bypassed — all modules enabled, TheAdminNick role, localStorage adapter used instead of Firebase

## File Organization

- **Hooks in separate files from providers**: `useAuth` is in `useAuth.ts`, not `auth-context.tsx`. Same for `useToast` → `useToast.ts`. Required by react-refresh/fast-refresh.
- **Non-component utilities split from `.tsx` files**: A `.tsx` file containing a React component cannot also export plain functions/constants — `react-refresh/only-export-components` will warn. Move utilities to a sibling `.ts` file next to the component. Examples: `meta-utils.ts` (next to `MetaSubForm.tsx`) holds `metaKindFor`/`defaultMeta`. The reverse is fine — pure-utility files (`fuel-math.ts`, `budget-math.ts`, `categories.ts`) have no components and export freely.
- **Context + Provider** files export the Context object and the Provider component. Hook files import the Context.
- `StorageAdapter.onSnapshot` accepts optional `onError` callback — always provide one in data hooks to surface listener failures
- Firestore paths: invites at root `/invites/{code}`, config at `/app/config`, user profiles at `/users/{uid}/profile/main`, body activities at `/users/{uid}/body_activities/{id}`
- Firestore paths: baby children at `/users/{uid}/children/{childId}`, baby subcollections at `/users/{uid}/children/{childId}/feeds/{id}` (nested, not flat)
- **Baby hooks**: `useBabyCollection<T>` generic hook in `useBabyCollection.ts`, composed by `useBabyData`. Each subcollection tracks `ready` state independently — sync status only shows `Synced` when all subcollection listeners have reported
- **Generic data hooks**: `useBabyCollection<T>` pattern — reusable hook for subcollection listener + state + save. New modules should follow this pattern instead of duplicating listener boilerplate
- **Baby list refactor (worth investigating)**: Baby module has 7 inline `RecentXxx`-style render functions (Feed, Sleep, Growth, Elimination, Meals, Needs, Milestones) each duplicating list/edit/delete/pagination logic. Body module solved this with a shared `ActivityLog` component. Baby should follow the same pattern — extract a shared `BabyLogList` component to reduce duplication and ensure consistent UX (delete hover, swipe, undo) across all baby logs. Pressure has compounded since Plan 5+6 added Meals/Needs/Milestones
- **Universal list infrastructure** (Phase 2h, `feat/exhibit-b`): Shared list primitives live alongside the components that use them. Hook: `src/shared/hooks/useListControls.ts` (per-list session state — time-range pill, page, page-size; default `CONFIG.LIST_DEFAULT_PAGE_SIZE` = 5). Components: `src/shared/components/ListControls.tsx`, `ListShowMoreFooter.tsx`, plus `lists/` subdir with `DateGroupHeader.tsx`, `RowTime.tsx`, `FloorMagnitudeBar.tsx` (Floors-only). Utils: `utils/filter.ts` (`filterByDateRange<T>` generic with key-extractor), `utils/paginate.ts` (`paginate`, `totalPages`), `utils/relative-date.ts` (`relativeDateLabel` → `{ relative, structural, week }`). All 11 list surfaces (Floors, Walk/Run/Cycle, Expenses, Income, Feed, Sleep, Growth, Elimination, Meals, Needs, Milestones) follow the Daily Ledger pattern: sticky day-of-week date headers, hairline rows, time-prefix tabular-nums. Swipe-to-delete, inline `×` delete, and tap-to-populate active row preserved across the refactor. **Auto tab (Phase 2j) deviates**: it owns its own filtered list of Vehicle+Travel expenses with no `<ListControls>` strip and no pagination — vehicle history is small enough that the time-range/page chrome is overhead. Reuses `<DateGroupHeader>` and `sortNewestFirst()` so the visual rhythm matches the other 11

## Theme System

10 themes (6 light+dark, 4 dark-only). CSS custom properties per theme, mapped to Tailwind via `@theme` in `index.css`. Approved showcase: `SAM/design-samples/theme-showcase-all.html` (16 variant cards). Design spec: `docs/specs/2026-04-10-themes-design.md`.

- **Roster (10)**: Family Blue (default), Garden Path, Lullaby, Rose Quartz, Charcoal, Marauder's Map (light+dark) | Neon Glow, Deep Mariana, Industrial Furnace, Expecto Patronum (dark-only)
- **Dropped**: Summit Instrument, Corporate Glass, Night City: Elevator, Nursery OS, Midnight Feed
- **Renamed**: Night City: Apartment → Neon Glow
- **Fonts (8 families)**: Syne, Orbitron, JetBrains Mono, Quicksand, Nunito, DM Serif Display, Playfair Display, Cinzel — loaded via Google Fonts `<link>` in `index.html`
- **Font application**: `applyTheme()` sets `--font-display` and `--font-body` CSS variables on `<html>` from `THEME_DEFINITIONS.fonts`
- **Ambient effects (9 types)**: snowflakes (Family Blue), leaves (Garden Path), stars (Lullaby), hearts (Rose Quartz), ink/footprints (Marauder's Map), scanline (Neon Glow), crt+bubbles (Deep Mariana), embers (Industrial Furnace), wisps (Expecto Patronum). Charcoal has none (minimal by design)
- **Effect configuration**: Per-theme defaults in `THEME_DEFINITIONS.effects`. User can override `effectIntensity` (0–100, bucketed to 5 tiers) and `effectSize` (70/100/140 = Small/Medium/Large) in Profile. Stored on `UserProfile`. Mobile viewport auto-shrinks via `useViewportSizeMultiplier` (0.65× under `CONFIG.MOBILE_BREAKPOINT_PX`); compounds with `effectSize` on `--fx-size` only (`--fx-scale` is depth-only to avoid double-multiplier)
- **Theme picker UX**: Inline expandable section in Profile — "Customize" button expands to 2-col mini showcase grid + intensity tier picker (5 buttons) + size tier picker (3 buttons)
- Theme class derived via `themeClass(id)` — never hardcode `theme-{name}` strings
- `CONFIG.DEFAULT_THEME` is typed as `ThemeId` — compile-time checked
- `applyTheme(themeId, colorMode)` applies to `<html>`, `useActiveThemeId()` reads it
- Adding a theme: (1) new CSS file in `src/themes/`, (2) import in `index.css`, (3) entry in `THEME_DEFINITIONS`
- **Migration**: Users with dropped theme IDs fall back to `family-blue`. `night-city-apartment` auto-migrates to `neon-glow`

## Key Conventions

- **Path alias**: `@/*` → `src/*` (NOT project root)
- **Import order**: React → external libs → internal components → types/constants → utils (always last)
- **JSDoc**: One-line `/** */` on every exported AND internal function/arrow/enum/type/interface/React component — nutcracker-tight style. Tests: docs on `describe` blocks + helpers, NOT individual `it()` bodies. Wave 3 sweep achieved 100% coverage across `src/`.
- **IDs**: `crypto.randomUUID()`
- **Dates**: `YYYY-MM-DD` strings, timestamps as ISO 8601
- **Date helpers**: Import `todayStr()`, `nowTime()` from `@/shared/utils/date` — never define local copies in components
- **Validation helpers**: Import `isValidNumber()` from `@/shared/utils/validation`
- **Regex helpers**: Import `DATE_RE`, `INVITE_CODE_RE` from `@/shared/utils/regex`
- **Distance formatting**: Import `formatDistance()`, `formatDistanceOrDash()` from `@/shared/utils/format` — never define local copies in components
- **List sorting**: Import `sortNewestFirst()` from `@/shared/utils/sort` — never use inline `.sort((a, b) => ...)` comparators
- **Toast types**: Use `ToastType.Success`, `ToastType.Error`, `ToastType.Info` from `@/shared/types` — never raw `'success'`/`'error'`/`'info'` strings
- **Toast messages**: All user-facing toast strings must be in enum classes in `constants/messages.ts` (BodyMsg, BabyMsg, BudgetMsg, ProfileMsg, AdminMsg, InviteMsg, ValidationMsg). Dynamic templates (e.g. `` `${label} logged` ``) are the exception — see Known Issues
- **Naming**: Scoring/calculation functions use `compute*` prefix (e.g., `computeBodyScore`), not `calculate*` or `get*`
- **Arrow functions**: Exported arrow functions always have explicit `return` (except tiny type helpers like `ok`/`err`)
- **JSX ternary**: Use `cond && ...` / `!cond && ...` instead of ternary in JSX (className ternaries are acceptable)
- **JSX curly newlines**: Prettier handles formatting — multiline expressions get `{` and `}` on their own lines automatically
- **Tests**: vitest in `__tests__/` dirs. `src/test-setup.ts` loads jest-dom matchers. Test files excluded from tsconfig. E2E in `e2e/` (excluded from vitest).
- **Refs for async callbacks**: When `useCallback` needs current state in an async flow, use a ref (`fooRef.current`) alongside `useState` — avoids stale closures
- **Prettier**: Formatting owned by Prettier (`.prettierrc`). `bun run format` to format all, `bun run format:check` for CI. ESLint via `eslint-config-prettier` — no formatting rules in ESLint
- **Tier picker idiom — `bucketX(value) + X_TIERS`**: For any user-facing dimension that the UI exposes as discrete tiers but storage holds as raw numeric values (intensity 0–100, particle effect size 70–140, future motion speed, etc.), follow the established pattern in `src/shared/utils/intensity.ts` + `effectSize.ts`:
  1. Export a `readonly` array of `{ value: number; label: string }` tiers (`INTENSITY_TIERS`, `EFFECT_SIZE_TIERS`)
  2. Export a `bucketX(value: number | undefined): number` function that maps any numeric value to the nearest tier value (derive boundaries from tier midpoints — `Math.floor((LOW + MID) / 2)` etc. — so renaming a tier value updates the buckets automatically)
  3. The UI picker (`<IntensityTierPicker>`, `<SizeTierPicker>`) uses `bucketX(stored)` for the active-state highlight — legacy values bucket on read; no migration script needed
  4. The consumer that actually applies the value (e.g. `<AmbientEffects>`) reads either the raw stored value (drift accepted) or the bucketed value (display + render align — see `Layout.tsx` passing `bucketEffectSize(profile.effectSize)`)
  5. Tier labels are derived from the constant in tests/E2E too (`INTENSITY_TIERS[2].label` instead of `'Standard'`) so renames don't break tests
- **Firebase import boundary** (invariant — same severity as "no `||` for env vars"): No file outside `src/shared/storage/` and `src/shared/auth/` may import from `firebase/*`. The `StorageAdapter` interface is the only sanctioned conduit. Today's privileged paths (transactions, collection-group queries, batched writes) leak Firebase straight to call sites; the day Firebase divorce becomes necessary, the search-and-replace surface should be one file, not forty. ESLint enforcement (`no-restricted-imports`) tracked as a future Chanakya task; documenting the rule here unblocks new work from drifting further.
- **Numeric enum stability** (invariant — same severity): `PaymentMethod`, `ExpenseCategory`, `IncomeSource`, `FeedType`, `SleepType`, `SleepQuality`, `DiaperType`, etc. are stored as integers in Firestore. **Never insert a member.** **Always append.** Renaming a member's label is fine; renumbering its value is a migration. Inserting at position 3 silently re-categorizes every historical row that was written when position 3 meant something else. When in doubt, append at the end and accept a non-sequential ordering — data integrity beats source-code aesthetics.
- **ExpenseMetaType enum convention**: Discriminated union discriminators like `Expense.meta` must have a corresponding string enum defined in the module's `types.ts` (e.g. `ExpenseMetaType`). Use `assertNever` from `@/shared/utils/types` as the `default` case in switches over the discriminator — compile-time exhaustiveness, runtime safety net.
- **'T12:00:00' suffix for YYYY-MM-DD parsing**: Always parse `'YYYY-MM-DD'` date strings as `new Date(dateStr + 'T12:00:00')` to avoid UTC-vs-local-TZ off-by-one bugs. Use the `parseLocalDate` helper in `src/shared/utils/relative-date.ts` or mirror its idiom. The `formatDayDate` pattern uses the same approach.
- **Hook return contract (Decision A1)**: Pure utilities return `Result<T>`. Data hooks (`useExpenses`, `useBabyCollection`) return `Promise<boolean>` — they own their toasts; the boolean gates state cleanup in the caller. This split is deliberate.
- **VEHICLE_SUBCAT / TRAVEL_SUBCAT**: Subcategory routing keys for Auto-tab logic live as `as const` objects in `src/modules/expenses/categories.ts`. Never inline `'Fuel'` / `'Cab/Auto'` etc. as routing strings — import `VEHICLE_SUBCAT` or `TRAVEL_SUBCAT`.

## 20-Point Audit Violations (from `docs/revz/nick-review-20-points.md`)

Found via grep sweeps — fix in next code hygiene pass:

- **#4 (constants)**: ~~`PAGE_SIZE` hardcoded in 6 files~~ — FIXED, then retired (Phase 2h). Replaced by `useListControls` hook default. ~~`1000` for m↔km in 6 places~~ — FIXED (`CONFIG.METERS_PER_KM`). ~~`CONFIG.LIST_PAGE_SIZE_OPTIONS` hardcoded array in `ListControls`~~ — FIXED (Phase 2k, `#41`). Watch for new magic numbers.
- ~~**#6 (messages)**: ~15 raw toast strings in components instead of `constants/messages.ts` enums~~ — FIXED: All 18 raw strings moved to enums, `ToastType` enum added for type literals. Only exception: `useBabyCollection` dynamic templates (see Known Issues)
- **#19 (utils)**: ~~Duplicated `formatDist()`/`formatDistance()`~~ — FIXED: shared `formatDistance()` in `utils/format.ts`. ~~8 inline `.sort()` comparators~~ — FIXED: `sortNewestFirst()` in `utils/sort.ts`
- ~~**Meta-type literals** (`'fuel'|'travel'|'maintenance'` inline strings across ~25 sites)~~ — FIXED (Phase 2k): `ExpenseMetaType` enum + `assertNever` exhaustiveness applied. `VEHICLE_SUBCAT` + `TRAVEL_SUBCAT` typed constants replace subcat magic strings.
- ~~**Non-exhaustive switches on `Expense.meta`**~~ — FIXED (Phase 2k + Wave 5b): `assertNever` from `@/shared/utils/types` applied at all 8 meta switch sites — 4 original (`renderBadge`, `readOdometer`, `toastForAdd`, `toastForUpdate`) + 4 added in Wave 5b (`MetaSubForm` JSX switch, `subCatFor`, `defaultMeta`, `validateMeta`).

## Known Issues (fix later)

- ~~**Body recent lists have no pagination**~~ — DONE: FloorsTab has "Show more" (7→30). ActivityLog (shared by Walking/Running/Cycling) now also has "Show more" (7→30).
- **ActivityLog edit UX**: Currently uses inline edit per row. Better approach: tap a row → populate the main form at top (distance pre-filled, button text changes to "Update", Cancel to dismiss). Same pattern for FloorsTab. Inline edit works but main-form edit is better mobile UX.
- ~~**Expense FAB uses `bg-primary`**~~ — DONE: Changed to `bg-accent text-fg-on-accent`.
- ~~**No way to reconfigure Body module**~~ — DONE: ⚙ gear button in tab bar opens `BodyConfigForm` pre-filled with current config.
- ~~**BodyStats quick action buttons are hardcoded**~~ — DONE: Dynamic via `STAT_CARDS` array, includes cycling. Score ring + day bars + reset today added (Session 6).
- ~~**RunningTab shows no activity list**~~ — DONE: BodyPage now passes all activities (not just today's).
- ~~**Cycling tab not implemented**~~ — DONE: `CyclingTab` component added, wired into `BodyPage`, config form checkbox enabled.
- **Yoga tab not implemented (coming soon)**: Duration-based, not distance. UI: duration input (minutes) + select dropdown of known yoga asanas. `BodyActivity` already supports `duration: number | null` with `distance: null`. Config toggle exists in `BodyConfig.yoga`.
- ~~**Negative/zero amounts accepted in inputs but won't save**~~ — DONE: All number inputs now have `min`/`step` attributes. Amounts: `min="0.01" step="0.01"`, floors: `min="0" step="1"`.
- ~~**Payment method bubbles don't deselect on second click**~~ — DONE: Clicking active bubble now deselects (`PaymentMethod | null`). Toggle pattern applied to expense payment selector.
- ~~**Income module throws app error**~~ — DONE: Fixed numeric enum `Object.values()` filter in AddIncome.tsx.
- ~~**Baby tabs need edit and delete**~~ — PARTIAL: Delete buttons added to all 4 baby log components via `useBabyCollection.remove`. Edit (tap-to-populate-form) still TODO. `useBabyCollection.{log,update,remove}` now return `Promise<boolean>` so callers can gate state cleanup on success (Phase 2k, H8).
- **Multi-baby not tested**: Only single child flow tested. Adding a second child, switching between children, and verifying data isolation across children needs manual/automated testing.
- ~~**Profile page has no nav link**~~ — DONE: Header shows "D" button (dev) or avatar (prod) linking to /profile.
- **Dev user mode possibilities**: Dev mode currently gives TheAdminNick role with all modules. Consider: (1) role switcher (test as User/Viewer), (2) module toggle (test with specific modules disabled), (3) simulate multiple users, (4) time travel (test with different "today" dates).

### Design Observations (from 2026-04-06 review)
- ~~**Stats score lacks context**~~ — DONE: Score ring with daily goal percentage + zone labels (Session 6)
- ~~**Stats "THIS WEEK" card cramped**~~ — DONE: Replaced with weekly day bar chart + summary row below (Session 6)
- ~~**Stats missing Run distance card**~~ — DONE: Run card now shows when `config.running` enabled or `runMeters > 0`.
- ~~**Floors recent list is flat**~~ — DONE (Phase 2h): `<FloorMagnitudeBar>` adds inline magnitude visualization; sticky day-of-week date headers via `<DateGroupHeader>` highlight Today/Yesterday.
- ~~**Walking/Running list no date grouping**~~ — DONE (Phase 2h): All 11 list surfaces use `<DateGroupHeader>` (sticky `Today` / `Yesterday` / `Wed 22 Apr` headers) via the universal Daily Ledger pattern.
- ~~**Walking tab shows redundant "Walk" label**~~ — DONE: Shows date instead of type label.
- **Budget list has no summary header**: No daily/weekly total at top of expense list.
- **Overall contrast low**: Family Blue theme (`#60a5fa` accent on white) feels washed out. Needs stronger card shadows or darker text contrast.
- **Dynamic toast message templates**: `useBabyCollection` uses `` `${label} logged/deleted/updated` `` template literals. Consider replacing with a message template system (e.g. `toastMsg(label, action)` or parameterized enum pattern) so all user-facing strings live in `constants/messages.ts`. Static messages and toast types are already enum-based.
- **Read-only delete UX is confusing for Viewers**: Tapping × on any list row (Body + Baby + Budget) shows the optimistic "X deleted (Undo)" toast for 10s, then the hook's readOnly guard fires `CommonMsg.ReadOnlyMode` and the row reappears. Two toasts, 10s apart, contradicting each other. Fix path: thread `readOnly` (from `useAuth().viewerOf`) into the list components and early-return with a single readOnly toast before the optimistic flow starts. Surfaced by Wave 5b's new readOnly toasts (the silent return was less visible before but equally wrong).
- **AutoTab edit silently coerces null `paymentMethod` to UPI on submit**: If a Viewer/User taps a legacy expense whose stored `paymentMethod` is null/missing, the form populates with `null` (via `useExpenseForm.populate`'s `e.paymentMethod ?? initPM`). On submit, AutoTab's `paymentMethod ?? PaymentMethod.UpiBankAccount` fallback at the wrapper layer silently saves it as UPI. The wrapper-layer default is the agreed pattern (Wave 5b moved the silent default OUT of the hook), but a more rigorous fix would require an explicit PM pick on edit (red border + disabled save when `null`).

### Design Samples (SAM/design-samples/)
- **theme-showcase-all.html** — approved 10-theme gallery with mini dashboard mockups (committed to git)
- Other samples (admin, daily-goal, list-hover, stats-hover) — local reference only, gitignored via `SAM/.gitignore`

## Gotchas

- **Agent worktree drift**: `isolation: "worktree"` branches from repo HEAD, which may not match the working branch. Agents may miss recent changes (new enums, renamed routes) and invent members that don't exist. **Fix**: Either (1) merge working branch into master before dispatching, or (2) explicitly tell agents which enums/types/routes already exist in the prompts. **Conflict-prone files**: `App.tsx` (routes), `constants/db.ts`, `constants/messages.ts`, `constants/routes.ts`, `shared/types.ts` — these are shared across modules. When dispatching parallel agents, instruct them to NOT modify these files and instead list what they need added, so the coordinator merges cleanly. Module-internal files (`src/modules/{name}/`) are safe for agents to own
- **Parallel-subagent dispatch pattern (proven in Plans 5+6)**: (a) pre-stage shared-file additions (enums, messages, baby constants, AddChild checkboxes) in a single "coordinator" commit before dispatching, (b) dispatch agents with explicit HEAD hash + list of what's already in place + list of files they must NOT touch (incl. `ChildDetail.tsx`, `AddChild.tsx`, `constants/*.ts`, `modules/baby/constants.ts`, `CHANGELOG.md`, `ROADMAP.md`), (c) after agents return, merge via fast-forward (linear) and wire their new components into `ChildDetail.tsx` in one coordinator pass. Result: zero merge conflicts on shared files, each agent owns only its new component + test.
- **Subagent rate-limit fallback**: If a subagent hits "you've hit your limit", its worktree may still exist but with a stale HEAD (branched before rate limit consumed the setup budget). `git log worktree-agent-XYZ` will show a SHA that predates the coordinator commit. In that case, delete the broken worktree + branch (`git worktree remove --force` + `git branch -D`) and implement inline using the same TDD pattern the other subagent followed. The pre-staged shared-file coordinator commit is still valid.
- **Plan docs in `docs/plans/2026-04-13-phase3-*.md` have recurring bugs that agents must avoid**: (1) `JSX.Element` return type — React 19 doesn't have this globally, use bare function return; (2) `result.error.message` on `useBabyCollection.log/update/remove` — these return `Promise<boolean>` (Decision A1) and handle their own toasts; gate state cleanup on the boolean, don't `await` a `Result`; (3) `update(id, data)` — the hook takes `update(entry)` where entry includes id (optional `{ silent }` second arg suppresses the generic toast); (4) hardcoded toast strings instead of `BabyMsg` enum; (5) plain unstyled HTML instead of matching sibling-component Tailwind; (6) admin toggle "in `UsersTab`" — actual location is `AddChild.tsx` (per-child config lives at creation time, not admin edit); (7) component API `{ child: Child }` — existing logs use `{ childId, siblingIds, uid }`. Always warn agents about these in prompts.
- `import foo from '../path/file.md?raw'` — Vite raw import returns string at build time. Typed by `vite/client` — no `@ts-expect-error` needed
- **Numeric enum `Object.values()` trap**: `Object.values(ExpenseCategory)` returns BOTH numbers AND reverse-mapped strings. Always filter: `.filter(v => typeof v === 'number')`. String enums don't have this issue
- `vitest.config.ts` excludes `.worktrees/**` and `.claude/**` — prevents agent worktrees from contaminating test runs
- `eslint.config.js` ignores `.worktrees` and `.claude` — same reason
- `src/vite-env.d.ts` must exist with `/// <reference types="vite/client" />` or CSS imports fail tsc
- `bun init -y` creates `index.ts`, `README.md`, `CLAUDE.md` that need manual cleanup
- `tsconfig.json` was initialized by bun, then customized — keep the internal comments
- ESLint ignores: `dist`, `coverage`, `dev-dist`, `.final-countdown-reports`
- ESLint allows `_` prefixed unused args (`argsIgnorePattern: '^_'`)
- Context exports (`AuthContext`, `ToastContext`) are allowed in react-refresh config
- Don't use `setState` synchronously inside `useEffect` — move to initial state or `useMemo`
- `.env.development` and `.env.production` are gitignored; `.env.example` is committed
- `firebase-config.ts` has separate `DEV_FIREBASE_CONFIG` / `PROD_FIREBASE_CONFIG` — never use `||` fallbacks for env vars (masks misconfiguration in prod)
- Avoid naming components the same as enums/types — `SyncStatusIndicator` (not `SyncStatus`) to avoid collision with the `SyncStatus` enum
- Dev mode injects `{ uid: 'dev-user' } as User` into `firebaseUser` state — hooks check `if (!firebaseUser) return` so this fake object is required for the localStorage adapter path to activate
- Firestore `collection()` requires odd segment count (1, 3, 5...). Baby subcollections are flat: `baby_feeds`, not `baby/feeds`. New subcollections must follow this pattern
- `react-hooks/set-state-in-effect` — no synchronous `setState` in `useEffect` body. Use refs, derived state via `useMemo`, or move to initial `useState` value
- `scripts/*.ts` run in Bun (not Vite) — no `@/` path aliases. Use relative imports or document enum value mappings in comments
- **StorageAdapter is per-user only**: `createAdapter(userPath(uid))` scopes to one user. Cross-user admin queries (e.g., list all profiles) need direct Firestore `collectionGroup` — the adapter doesn't support collection-wide reads by design
- **Delete + recompute race**: After `adapter.remove()`, the `onSnapshot` listener hasn't fired yet. `activitiesRef.current` still contains the deleted item. Manually filter the deleted ID from the ref before recomputing summaries
- **Dev mode doesn't persist profile reads**: `DEV_PROFILE` is hardcoded in `auth-context.tsx` — theme/colorMode saves go to localStorage correctly but are never read back on reload. Will work on prod with Firebase `onSnapshot`
- **SwipeToDelete pattern**: Red background must be `opacity-0 pointer-events-none` by default, revealed via JS during swipe. Row content needs `bg-surface` class. The wrapper renders `<div>` — must go inside `<li>`, never wrap it (invalid HTML)
- **E2E button disambiguation**: Quick action pills and tab bar buttons share text (e.g., "Floors", "Walking"). Use `page.locator('main button', { hasText: 'X' }).first()` to target tab buttons
- **`@testing-library/user-event` not installed**: Use `fireEvent` from `@testing-library/react` in tests — `userEvent` is not a direct dependency
- **Playwright `isVisible()` returns immediately** — does NOT wait, even with `{ timeout }` parameter. For waiting, use `expect(locator).toBeVisible({ timeout })` or `locator.waitFor()`. This caused 8 false-negative E2E tests when lazy-loaded routes hadn't rendered yet

## Security (Firestore Rules)

- Admin claim: `initializeAdmin` uses `runTransaction` — atomically writes `app/config` + admin profile. Transaction checks `app/config` doesn't already exist (prevents double-claim race)
- Invites: TheAdminNick has full write. Any authenticated user can redeem an unclaimed invite (update `linkedUid` + `usedAt` only, all other fields immutable)
- Profiles: TheAdminNick has full write. Owner can create (non-admin role only) and update (only `theme`, `colorMode`, `name` — `role` and `modules` locked server-side)
- Module data: Owner + module enabled, or TheAdminNick. Enforced per-collection in rules
- Invite redemption uses `runTransaction` for atomicity (prevents double-redemption)

## Remaining Backlog

See `docs/ROADMAP.md` for full prioritized backlog (P0-P3).

### Phase 3 Brainstorm (next session)

Scan source repos (BabyTracker, Floor-Tracker, Finularity) for feature ideas to port into AFP. Key directions:
- **Baby → Toddler/Kid**: milestones, meals (not feeds), potty training, vaccinations, activities. Age-aware UI that evolves
- **Budget → Investment**: savings goals, recurring expenses, net worth tracking, financial insights
- **Body → Gamification**: motivational messages, daily challenges, milestone badges, streaks with rewards

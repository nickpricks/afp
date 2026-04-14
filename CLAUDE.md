# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

AFP ("It Started On April Fools Day") — unified personal PWA combining body/fitness tracking, expense tracking, and baby tracking. Invite-only access via TheAdminNick admin model.
Design spec: `docs/specs/2026-04-01-aprilfoolsjoke-design.md`
Implementation plan: `docs/plans/2026-04-01-aprilfoolsjoke-phase1.md`
Firebase setup: `docs/firebase-setup.md`

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

## Architecture

React 19 + Vite 8 + TypeScript (strict) + Tailwind CSS v4 + Firebase

- **BrowserRouter** via react-router-dom with `basename={import.meta.env.BASE_URL}`. GitHub Pages SPA supported via `public/404.html` redirect trick
- **Default branch**: `master` (not main)
- **Module system**: body, expenses, baby — all disabled by default, TheAdminNick enables per user
- **Storage abstraction**: `StorageAdapter` interface in `src/shared/storage/`, Firebase impl + localStorage impl (dev mode). Factory: `createAdapter(basePath)` auto-selects
- **Enums**: `ModuleId`, `SyncStatus`, `UserRole`, `AppPath`, `DbCollection`, `DbSubcollection`, `DbDoc`, `DbField`, `ThemeId`, `ActivityType` are TypeScript string enums — use enum members, not string literals
- **Dashboard**: Role-aware home at `/`. Hooks accept optional `targetUid` — User reads own data, Viewer reads `viewerOf` user, Admin selects from `useAllUsers()`. Write callbacks no-op when `readOnly`. `DashboardCard` uses `shadow-sm` + `bg-[var(--accent-muted)]` for theme-aware styling. Baby card shows child count (option B)
- **Auth**: Anonymous auth + Google Sign-In (account linking). `signInWithGoogle()` in `google-auth.ts`. Invite flow requires Google sign-in before redemption
- **Body module**: Config gate (`useBodyConfig` → `BodyConfigForm` if unconfigured, tabbed `BodyPage` if configured). Floors (daily aggregate on `body/{dateKey}`) + walk/run/cycle activities (`body_activities/{id}`). Config in `body_config/main`. Scoring: `floors_up×1 + floors_down×0.5 + walk_km×10 + run_km×20 + cycle_km×15`. `dailyGoal` in `BodyConfig` (configurable via per-activity slider builder in config form). Score ring on Stats tab shows progress toward goal
- **Budget module**: Directory is `src/modules/expenses/` but `ModuleId` is `Budget`. Income tracking via `useIncome`, payment methods via `PaymentMethod` enum, summary math in `budget-math.ts`
- **Baby module**: Multi-child via `children/{childId}` collection. `useBabyCollection(childId, subcollection, label, targetUid?)` for nested paths. `useBabyCollection` exposes `log`, `update`, `remove`. `useBabyData` exposes `updateFeed/Sleep/Growth/Diaper`. `BabyLanding` → `ChildDetail` routing
- **DevBench split**: Generators in `src/shared/components/bench-generators.ts` (pure functions), component in `DevBench.tsx`. 11 generators with ×1/×100/×1k bulk modes + day-spread
- **Constants**: `constants/config.ts` (app config), `constants/routes.ts` (AppPath enum + ROUTES), `constants/db.ts` (Firestore paths), `constants/messages.ts` (error/toast messages)
- **Result types**: Every async operation returns `Result<T>`, never void. Use `ok()`, `err()`, `isOk()`, `isErr()` from `@/shared/types`
- **Error handling**: Toast notifications via `useToast()`, `ErrorBoundary` for React crashes, `SyncStatusIndicator` in header. Toast actions: `addToast(message, type, { action?: { label, onClick }, durationMs? })` — undo delete uses 10s toast with "Undo" button
- **Tap-to-edit pattern**: All list views use tap-row-to-populate-form. Body: FloorsTab redirects +/- buttons, ActivityLog populates AddActivity. Baby: all 4 logs populate their forms. Budget: edit deferred (form on separate page). Active row: `bg-[var(--accent-muted)] border-l-2 border-l-accent`
- **List constants**: `CONFIG.PAGE_SIZE` (25) for all paginated lists, `CONFIG.UNDO_DURATION_MS` (10000) for undo delete toasts, `CONFIG.METERS_PER_KM` (1000) for distance conversion — never hardcode these values
- **Route guards**: `ModuleGate` wraps module routes, `AdminGate` wraps admin routes — redirect to `/` if unauthorized
- **Admin panel**: Tabbed container (Invites | Users | Broadcasts). `InvitesTab` has copy-link + delete actions. `UsersTab` has color-coded module chips (Body=indigo, Budget=emerald, Baby=pink), role stat bar, toggle switches, accordion expand, "View Dashboard" button per user, module request approve badges. `useAdminActions` hook for Firestore profile writes. Admin can view any user's dashboard via `?viewUser=uid` query param on `/`
- **Notifications**: Per-user subcollection `users/{uid}/notifications/{id}`. User→admin: module requests (writes to admin's subcollection + own `requestedModules`). Admin→user: alerts/notices with severity, type, and `shownTillDate` expiry. `useNotifications` reads own inbox, `useAdminNotifications` adds send/approve/delete actions. `AlertBanner` renders above header in Layout. `BroadcastsTab` in admin panel for composing alerts. Spec: `docs/specs/2026-04-14-notifications-module-requests-design.md`
- **Delete pattern**: Inline `x` text on all list rows (Body + Baby), `hover:text-red-500 hover:scale-125 hover:font-bold`. Mobile: `SwipeToDelete` wrapper (CSS-only touch, no gesture library — swap to `@use-gesture/react` if needed). Undo toast with `CONFIG.UNDO_DURATION_MS` (10s)
- **Verbose storage logging**: Both `localStorage-adapter.ts` and `firebase-adapter.ts` log all SAVE/REMOVE/SNAPSHOT operations via `vlog()` when debug verbose toggle is on. Prefixed `[AFP:storage:local]` or `[AFP:storage:fb]`
- **Invite viewer flow**: `InviteRecord` has optional `role` and `viewerOf` fields. `InviteGenerator` shows User/Viewer toggle + "View of" picker. `redeemInvite` creates Viewer profile with `viewerOf` scoping when `role='viewer'`
- **Dev bypass**: When Firebase isn't configured (`isFirebaseConfigured = false`), auth is bypassed — all modules enabled, TheAdminNick role, localStorage adapter used instead of Firebase

## File Organization

- **Hooks in separate files from providers**: `useAuth` is in `useAuth.ts`, not `auth-context.tsx`. Same for `useToast` → `useToast.ts`. Required by react-refresh/fast-refresh.
- **Context + Provider** files export the Context object and the Provider component. Hook files import the Context.
- `StorageAdapter.onSnapshot` accepts optional `onError` callback — always provide one in data hooks to surface listener failures
- Firestore paths: invites at root `/invites/{code}`, config at `/app/config`, user profiles at `/users/{uid}/profile/main`, body activities at `/users/{uid}/body_activities/{id}`
- Firestore paths: baby children at `/users/{uid}/children/{childId}`, baby subcollections at `/users/{uid}/children/{childId}/feeds/{id}` (nested, not flat)
- **Baby hooks**: `useBabyCollection<T>` generic hook in `useBabyCollection.ts`, composed by `useBabyData`. Each subcollection tracks `ready` state independently — sync status only shows `Synced` when all 4 listeners have reported
- **Generic data hooks**: `useBabyCollection<T>` pattern — reusable hook for subcollection listener + state + save. New modules should follow this pattern instead of duplicating listener boilerplate
- **Baby list refactor (worth investigating)**: Baby module has 4 inline `RecentXxx` render functions (FeedLog, SleepLog, GrowthLog, DiaperLog) each duplicating list/edit/delete/pagination logic. Body module solved this with a shared `ActivityLog` component. Baby should follow the same pattern — extract a shared `BabyLogList` component to reduce duplication and ensure consistent UX (delete hover, swipe, undo) across all baby logs

## Theme System

10 themes (6 light+dark, 4 dark-only). CSS custom properties per theme, mapped to Tailwind via `@theme` in `index.css`. Approved showcase: `SAM/design-samples/theme-showcase-all.html` (16 variant cards). Design spec: `docs/specs/2026-04-10-themes-design.md`.

- **Roster (10)**: Family Blue (default), Garden Path, Lullaby, Rose Quartz, Charcoal, Marauder's Map (light+dark) | Neon Glow, Deep Mariana, Industrial Furnace, Expecto Patronum (dark-only)
- **Dropped**: Summit Instrument, Corporate Glass, Night City: Elevator, Nursery OS, Midnight Feed
- **Renamed**: Night City: Apartment → Neon Glow
- **Fonts (8 families)**: Syne, Orbitron, JetBrains Mono, Quicksand, Nunito, DM Serif Display, Playfair Display, Cinzel — loaded via Google Fonts `<link>` in `index.html`
- **Font application**: `applyTheme()` sets `--font-display` and `--font-body` CSS variables on `<html>` from `THEME_DEFINITIONS.fonts`
- **Ambient effects (9 types)**: snowflakes (Family Blue), leaves (Garden Path), stars (Lullaby), hearts (Rose Quartz), ink/footprints (Marauder's Map), scanline (Neon Glow), crt+bubbles (Deep Mariana), embers (Industrial Furnace), wisps (Expecto Patronum). Charcoal has none (minimal by design)
- **Effect configuration**: Per-theme defaults in `THEME_DEFINITIONS.effects`. User can override particle count (0-10) and size (small/medium/large) in Profile. Stored in `UserProfile`
- **Theme picker UX**: Inline expandable section in Profile — "Customize Theme" button expands to 2-col mini showcase grid + effect sliders
- Theme class derived via `themeClass(id)` — never hardcode `theme-{name}` strings
- `CONFIG.DEFAULT_THEME` is typed as `ThemeId` — compile-time checked
- `applyTheme(themeId, colorMode)` applies to `<html>`, `useActiveThemeId()` reads it
- Adding a theme: (1) new CSS file in `src/themes/`, (2) import in `index.css`, (3) entry in `THEME_DEFINITIONS`
- **Migration**: Users with dropped theme IDs fall back to `family-blue`. `night-city-apartment` auto-migrates to `neon-glow`

## Key Conventions

- **Path alias**: `@/*` → `src/*` (NOT project root)
- **Import order**: React → external libs → internal components → types/constants → utils (always last)
- **JSDoc**: One-line `/** */` on every exported function — enables doc sweep hook
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

## 20-Point Audit Violations (from `docs/revz/nick-review-20-points.md`)

Found via grep sweeps — fix in next code hygiene pass:

- **#4 (constants)**: ~~`PAGE_SIZE` hardcoded in 6 files~~ — FIXED (`CONFIG.PAGE_SIZE`). ~~`1000` for m↔km in 6 places~~ — FIXED (`CONFIG.METERS_PER_KM`). Watch for new magic numbers.
- ~~**#6 (messages)**: ~15 raw toast strings in components instead of `constants/messages.ts` enums~~ — FIXED: All 18 raw strings moved to enums, `ToastType` enum added for type literals. Only exception: `useBabyCollection` dynamic templates (see Known Issues)
- **#19 (utils)**: ~~Duplicated `formatDist()`/`formatDistance()`~~ — FIXED: shared `formatDistance()` in `utils/format.ts`. ~~8 inline `.sort()` comparators~~ — FIXED: `sortNewestFirst()` in `utils/sort.ts`

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
- ~~**Baby tabs need edit and delete**~~ — PARTIAL: Delete buttons added to all 4 baby log components via `useBabyCollection.remove`. Edit (tap-to-populate-form) still TODO.
- **Multi-baby not tested**: Only single child flow tested. Adding a second child, switching between children, and verifying data isolation across children needs manual/automated testing.
- ~~**Profile page has no nav link**~~ — DONE: Header shows "D" button (dev) or avatar (prod) linking to /profile.
- **Dev user mode possibilities**: Dev mode currently gives TheAdminNick role with all modules. Consider: (1) role switcher (test as User/Viewer), (2) module toggle (test with specific modules disabled), (3) simulate multiple users, (4) time travel (test with different "today" dates).

### Design Observations (from 2026-04-06 review)
- ~~**Stats score lacks context**~~ — DONE: Score ring with daily goal percentage + zone labels (Session 6)
- ~~**Stats "THIS WEEK" card cramped**~~ — DONE: Replaced with weekly day bar chart + summary row below (Session 6)
- ~~**Stats missing Run distance card**~~ — DONE: Run card now shows when `config.running` enabled or `runMeters > 0`.
- **Floors recent list is flat**: All rows identical styling. Highlight today's row, dim older, consider subtle bar visualization.
- **Walking/Running list no date grouping**: Activities dump in flat list. Group by date with sticky headers ("Today", "Yesterday", "Apr 4").
- ~~**Walking tab shows redundant "Walk" label**~~ — DONE: Shows date instead of type label.
- **Budget list has no summary header**: No daily/weekly total at top of expense list.
- **Overall contrast low**: Family Blue theme (`#60a5fa` accent on white) feels washed out. Needs stronger card shadows or darker text contrast.
- **Dynamic toast message templates**: `useBabyCollection` uses `` `${label} logged/deleted/updated` `` template literals. Consider replacing with a message template system (e.g. `toastMsg(label, action)` or parameterized enum pattern) so all user-facing strings live in `constants/messages.ts`. Static messages and toast types are already enum-based.

### Design Samples (SAM/design-samples/)
- **theme-showcase-all.html** — approved 10-theme gallery with mini dashboard mockups (committed to git)
- Other samples (admin, daily-goal, list-hover, stats-hover) — local reference only, gitignored via `SAM/.gitignore`

## Gotchas

- **Agent worktree drift**: `isolation: "worktree"` branches from repo HEAD, which may not match the working branch. Agents may miss recent changes (new enums, renamed routes) and invent members that don't exist. **Fix**: Either (1) merge working branch into master before dispatching, or (2) explicitly tell agents which enums/types/routes already exist in the prompts. **Conflict-prone files**: `App.tsx` (routes), `constants/db.ts`, `constants/messages.ts`, `constants/routes.ts`, `shared/types.ts` — these are shared across modules. When dispatching parallel agents, instruct them to NOT modify these files and instead list what they need added, so the coordinator merges cleanly. Module-internal files (`src/modules/{name}/`) are safe for agents to own
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

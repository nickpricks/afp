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

Package manager: **bun** (not npm/yarn). Cross-platform scripts use **shx** (not bash).

## Architecture

React 19 + Vite 8 + TypeScript (strict) + Tailwind CSS v4 + Firebase

- **BrowserRouter** via react-router-dom with `basename={import.meta.env.BASE_URL}`. GitHub Pages SPA supported via `public/404.html` redirect trick
- **Default branch**: `master` (not main)
- **Module system**: body, expenses, baby — all disabled by default, TheAdminNick enables per user
- **Storage abstraction**: `StorageAdapter` interface in `src/shared/storage/`, Firebase impl + localStorage impl (dev mode). Factory: `createAdapter(basePath)` auto-selects
- **Enums**: `ModuleId`, `SyncStatus`, `UserRole`, `AppPath`, `DbCollection`, `DbSubcollection`, `DbDoc`, `DbField`, `ThemeId`, `ActivityType` are TypeScript string enums — use enum members, not string literals
- **Auth**: Anonymous auth + Google Sign-In (account linking). `signInWithGoogle()` in `google-auth.ts`. Invite flow requires Google sign-in before redemption
- **Body module**: Config gate (`useBodyConfig` → `BodyConfigForm` if unconfigured, tabbed `BodyPage` if configured). Floors (daily aggregate on `body/{dateKey}`) + walk/run activities (`body_activities/{id}`). Config in `body_config/main`. Scoring combines all
- **Budget module**: Directory is `src/modules/expenses/` but `ModuleId` is `Budget`. Income tracking via `useIncome`, payment methods via `PaymentMethod` enum, summary math in `budget-math.ts`
- **Baby module**: Multi-child via `children/{childId}` collection. `useBabyCollection(childId, subcollection)` for nested paths. `BabyLanding` → `ChildDetail` routing
- **Constants**: `constants/config.ts` (app config), `constants/routes.ts` (AppPath enum + ROUTES), `constants/db.ts` (Firestore paths), `constants/messages.ts` (error/toast messages)
- **Result types**: Every async operation returns `Result<T>`, never void. Use `ok()`, `err()`, `isOk()`, `isErr()` from `@/shared/types`
- **Error handling**: Toast notifications via `useToast()`, `ErrorBoundary` for React crashes, `SyncStatusIndicator` in header
- **Route guards**: `ModuleGate` wraps module routes, `AdminGate` wraps admin routes — redirect to `/` if unauthorized
- **Dev bypass**: When Firebase isn't configured (`isFirebaseConfigured = false`), auth is bypassed — all modules enabled, TheAdminNick role, localStorage adapter used instead of Firebase

## File Organization

- **Hooks in separate files from providers**: `useAuth` is in `useAuth.ts`, not `auth-context.tsx`. Same for `useToast` → `useToast.ts`. Required by react-refresh/fast-refresh.
- **Context + Provider** files export the Context object and the Provider component. Hook files import the Context.
- `StorageAdapter.onSnapshot` accepts optional `onError` callback — always provide one in data hooks to surface listener failures
- Firestore paths: invites at root `/invites/{code}`, config at `/app/config`, user profiles at `/users/{uid}/profile/main`, body activities at `/users/{uid}/body_activities/{id}`
- Firestore paths: baby children at `/users/{uid}/children/{childId}`, baby subcollections at `/users/{uid}/children/{childId}/feeds/{id}` (nested, not flat)
- **Baby hooks**: `useBabyCollection<T>` generic hook in `useBabyCollection.ts`, composed by `useBabyData`. Each subcollection tracks `ready` state independently — sync status only shows `Synced` when all 4 listeners have reported
- **Generic data hooks**: `useBabyCollection<T>` pattern — reusable hook for subcollection listener + state + save. New modules should follow this pattern instead of duplicating listener boilerplate

## Theme System

7 themes in `src/themes/`. CSS custom properties per theme, mapped to Tailwind via `@theme` in `index.css`.

- **Default**: Family Blue (light + dark)
- Theme class derived via `themeClass(id)` — never hardcode `theme-{name}` strings
- `CONFIG.DEFAULT_THEME` is typed as `ThemeId` — compile-time checked
- `applyTheme(themeId, colorMode)` applies to `<html>`, `useActiveThemeId()` reads it
- Adding a theme: (1) new CSS file in `src/themes/`, (2) import in `index.css`, (3) entry in `THEME_DEFINITIONS`

## Key Conventions

- **Path alias**: `@/*` → `src/*` (NOT project root)
- **Import order**: React → external libs → internal components → types/constants → utils (always last)
- **JSDoc**: One-line `/** */` on every exported function — enables doc sweep hook
- **IDs**: `crypto.randomUUID()`
- **Dates**: `YYYY-MM-DD` strings, timestamps as ISO 8601
- **Date helpers**: Import `todayStr()`, `nowTime()` from `@/shared/utils/date` — never define local copies in components
- **Validation helpers**: Import `isValidNumber()` from `@/shared/utils/validation`
- **Regex helpers**: Import `DATE_RE`, `INVITE_CODE_RE` from `@/shared/utils/regex`
- **Naming**: Scoring/calculation functions use `compute*` prefix (e.g., `computeBodyScore`), not `calculate*` or `get*`
- **Arrow functions**: Exported arrow functions always have explicit `return` (except tiny type helpers like `ok`/`err`)
- **JSX ternary**: Use `cond && ...` / `!cond && ...` instead of ternary in JSX (className ternaries are acceptable)
- **JSX curly newlines**: `react/jsx-curly-newline: require` enforced via ESLint — multiline expressions get `{` and `}` on their own lines
- **Tests**: vitest in `__tests__/` dirs. `src/test-setup.ts` loads jest-dom matchers. Test files excluded from tsconfig. E2E in `e2e/` (excluded from vitest).
- **Refs for async callbacks**: When `useCallback` needs current state in an async flow, use a ref (`fooRef.current`) alongside `useState` — avoids stale closures
- **ESLint autofix**: `bunx eslint --fix <file>` handles `react/jsx-curly-newline` — don't manually fix these

## Known Issues (fix later)

- ~~**Body recent lists have no pagination**~~ — DONE: FloorsTab has "Show more" (7→30). WalkingTab/RunningTab still render all items — need pagination or virtual scroll for large datasets.
- **ActivityLog edit UX**: Currently uses inline edit per row. Better approach: tap a row → populate the main form at top (distance pre-filled, button text changes to "Update", Cancel to dismiss). Same pattern for FloorsTab. Inline edit works but main-form edit is better mobile UX.
- ~~**Expense FAB uses `bg-primary`**~~ — DONE: Changed to `bg-accent text-fg-on-accent`.
- **No way to reconfigure Body module**: Once `body_config` is saved, there's no UI to change activity toggles or floor height. Nuking localStorage is the only reset. Needs a gear/settings entry point — either on BodyStats dashboard or Profile page (Phase 2d).
- ~~**BodyStats quick action buttons are hardcoded**~~ — DONE: Now reads config, only shows enabled activity buttons.
- ~~**RunningTab shows no activity list**~~ — DONE: BodyPage now passes all activities (not just today's).
- **Cycling tab not implemented**: Same pattern as WalkingTab/RunningTab — distance-based, uses `ActivityType.Cycle`. Clone WalkingTab, swap enum. Config toggle already exists in `BodyConfig.cycling`.
- **Yoga tab not implemented (coming soon)**: Duration-based, not distance. UI: duration input (minutes) + select dropdown of known yoga asanas. `BodyActivity` already supports `duration: number | null` with `distance: null`. Config toggle exists in `BodyConfig.yoga`.
- **Negative/zero amounts accepted in inputs but won't save**: Number inputs allow typing negative and zero values — validation blocks save (correct behavior), but UX should prevent entry or show inline error. Consider `min="0.01"` on number inputs or real-time validation feedback.
- **Payment method bubbles don't deselect on second click**: Bubble selector should toggle — tap selected bubble to deselect (reset to no method). Currently stays selected. Same applies to all bubble/chip selectors across modules.
- ~~**Income module throws app error**~~ — DONE: Fixed numeric enum `Object.values()` filter in AddIncome.tsx.
- **Baby tabs need edit and delete**: Feed/Sleep/Growth/Diaper log entries have no edit or delete actions. Body module has inline edit, Expense has delete. Baby entries need both — tap row to edit (main-form pattern), swipe or icon to delete.
- **Multi-baby not tested**: Only single child flow tested. Adding a second child, switching between children, and verifying data isolation across children needs manual/automated testing.
- ~~**Profile page has no nav link**~~ — DONE: Header shows "D" button (dev) or avatar (prod) linking to /profile.
- **Dev user mode possibilities**: Dev mode currently gives TheAdminNick role with all modules. Consider: (1) role switcher (test as User/Viewer), (2) module toggle (test with specific modules disabled), (3) simulate multiple users, (4) time travel (test with different "today" dates).

### Design Observations (from 2026-04-06 review)
- **Stats score lacks context**: "45.4" has no goal/target reference. Consider progress ring, color gradient (green/amber/red), or daily goal indicator.
- **Stats "THIS WEEK" card cramped**: 3 stats (Avg, Total, Streak) crammed in one row. Consider separate cards like Floors Up/Down.
- ~~**Stats missing Run distance card**~~ — DONE: Run card now shows when `config.running` enabled or `runMeters > 0`.
- **Floors recent list is flat**: All rows identical styling. Highlight today's row, dim older, consider subtle bar visualization.
- **Walking/Running list no date grouping**: Activities dump in flat list. Group by date with sticky headers ("Today", "Yesterday", "Apr 4").
- ~~**Walking tab shows redundant "Walk" label**~~ — DONE: Shows date instead of type label.
- **Budget list has no summary header**: No daily/weekly total at top of expense list.
- **Overall contrast low**: Family Blue theme (`#60a5fa` accent on white) feels washed out. Needs stronger card shadows or darker text contrast.

### Stats Dashboard Design Samples (SAM/design-samples/)
Three HTML mockups for the Body Stats dashboard — each maps to a theme family:
- **stats-A-warm-instrument.html** → Family Blue / Summit Instrument — progress ring, warm terracotta, DM Serif Display, weekly bar chart
- **stats-B-dense-editorial.html** → Corporate Glass — big bold score, data table with mini-bars, Fraunces serif, newspaper hierarchy
- **stats-C-playful-streak.html** → Night City / Deep Mariana (dark) — streak banner with fire, XP progress bar, GitHub heatmap, Bricolage Grotesque
All three to be implemented as theme-aware variants in Phase 2f. Can mix elements across samples.

## Gotchas

- **Agent worktree drift**: `isolation: "worktree"` branches from repo HEAD, which may not match the working branch. Agents may miss recent changes (new enums, renamed routes) and invent members that don't exist. **Fix**: Either (1) merge working branch into master before dispatching, or (2) explicitly tell agents which enums/types/routes already exist in the prompts. **Conflict-prone files**: `App.tsx` (routes), `constants/db.ts`, `constants/messages.ts`, `constants/routes.ts`, `shared/types.ts` — these are shared across modules. When dispatching parallel agents, instruct them to NOT modify these files and instead list what they need added, so the coordinator merges cleanly. Module-internal files (`src/modules/{name}/`) are safe for agents to own
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

## Security (Firestore Rules)

- Invites: TheAdminNick has full write. Any authenticated user can redeem an unclaimed invite (update `linkedUid` + `usedAt` only, all other fields immutable)
- Profiles: TheAdminNick has full write. Owner can create (non-admin role only) and update (only `theme`, `colorMode`, `name` — `role` and `modules` locked server-side)
- Module data: Owner + module enabled, or TheAdminNick. Enforced per-collection in rules
- Invite redemption uses `runTransaction` for atomicity (prevents double-redemption)

## Remaining Backlog

See `docs/ROADMAP.md` for full prioritized backlog (P0-P3).

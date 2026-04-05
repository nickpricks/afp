# Changelog

All notable changes to AFP ("It Started On April Fools Day") are documented here.

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

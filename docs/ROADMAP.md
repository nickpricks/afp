# AFP Roadmap

Last updated: 2026-04-04

---

## P0 — Critical (blocks real usage)

- [ ] **Hash → BrowserRouter** — switch from hash routing to BrowserRouter + 404.html trick for GitHub Pages.
- [ ] **Body module: walk/run tracking** — distance input (meters/km), derives steps from configurable defaults. New `body_activities` subcollection for individual entries, daily summary on `BodyRecord`. Floors unchanged.
- [ ] **Body module: activity input UI** — bubble selector (Walk/Run), distance input, save. Below existing floor taps.

## P1 — Important (quality + correctness)

- [ ] **Firestore runtime validation** — replace `as T` casts in adapters with parse/validate functions at the Firestore boundary.
- [ ] **Baby module validation** — add `validateFeedEntry()`, `validateSleepEntry()`, etc. following the expense module pattern.
- [ ] **`useBabyData` sync status race** — 4 listeners race to `SyncStatus.Synced`. Track listener readiness properly.
- [ ] **`init-admin.ts` uses string literals** — should use enum imports for role/modules/theme.
- [ ] **`DebugPage` local `isOk` shadows canonical helper** — rename to `isPassing`.
- [ ] **Split `useBabyData`** — into `useFeedData`, `useSleepData`, `useGrowthData`, `useDiaperData`.

## P2 — Enhancement (better UX)

- [ ] **`credential-already-in-use` UID orphan** — admin clear or auto-clear policy for orphaned anonymous profiles. Low risk for personal app.
- [ ] **Theme selector in app** — users can pick from 7 themes.
- [ ] **`ThemeId` → enum** — convert string union to TypeScript enum.
- [ ] **Profile/settings page** — theme, color mode, display name.
- [ ] **Admin: user management** — list users, toggle modules, revoke access.
- [ ] **Expense bulk import** — mentioned in design spec.
- [ ] **Expense soft-delete** — type has `isDeleted`, UI hard-deletes.
- [ ] **Body: exercise/yoga tracker** — predefined exercise selector, reps, duration, calorie calc.
- [ ] **Body: daily challenge / streak** — mentioned in design spec.
- [ ] **Baby: growth chart visualization** — component exists as log, no chart.
- [ ] **Body: health API sync** — sync with phone health APIs for actual step/distance data.
- [ ] **Body: configurable scoring** — user-adjustable weights, stride length, pace defaults.

## P3 — Future (design spec, not started)

- [ ] **Go API gateway** — second `StorageAdapter` impl calling Go backend.
- [ ] **S3 + CloudFront deployment** — post-Phase 1.
- [ ] **E2E visual regression** — 7 themes x 3 modules screenshot baselines.
- [ ] **More themes** — Warm Nursery, Nursery_OS.
- [ ] **Proper auth providers** — email link, Apple sign-in.
- [ ] **Offline-first UX** — retry messaging, explicit queue.

---

## Uncommitted (this session, pending review + commit)

| File | Change |
|------|--------|
| `src/shared/components/Layout.tsx` | Profile photo in header, no-profile wall fix |
| `src/shared/auth/google-auth.ts` | Popup cancel returns 'cancelled' |
| `src/shared/components/GoogleSignInButton.tsx` | Ignores cancel, compact errors via toast |
| `src/shared/auth/InviteRedeem.tsx` | "Try Again" button on failure |
| `src/modules/expenses/pages/ExpenseListPage.tsx` | FAB (+) button |
| `src/shared/components/DebugPage.tsx` | Email row |
| `src/shared/auth/the-admin-nick.ts` | Renamed from headminick.ts |
| `src/constants/db.ts` | `DbField.AdminUid` (was HeadminickUid) |
| `scripts/init-admin.ts` | Renamed from init-headminick.ts |
| `src/shared/components/AdminGate.tsx` | Comment updated |
| `e2e/app.spec.ts` | Comments updated |
| `docs/ROADMAP.md` | This file |

---

## Done

### 2026-04-04 (this session)

- [x] Debug page (`/#/debug`) — Firebase config, auth state, storage mode, version, email
- [x] Google Sign-In — anonymous account linking, compact header button, full button on invite/landing
- [x] Admin bootstrap — `scripts/init-admin.ts` via Firebase Admin SDK
- [x] Baby Firestore path fix — flattened to `baby_feeds`/`baby_sleep`/`baby_growth`/`baby_diapers`
- [x] Firestore rules deployed — 4 flat baby subcollection rules
- [x] Invite flow requires Google sign-in before redeeming
- [x] Profile photo in header when signed in with Google
- [x] Expense FAB (+) button on list page
- [x] No-profile wall explains invite-only, Google sign-in for returning users
- [x] Popup cancel handled gracefully, compact mode uses toast
- [x] InviteRedeem "Try Again" on failure
- [x] Rename headminick → TheAdminNick in codebase
- [x] GitHub secrets configured (6 Firebase env vars)
- [x] Google auth provider enabled + authorized domain
- [x] TheAdminNick bootstrapped and Google-linked

### pre-0.0.5 (initial commit session)

- [x] Phase 1 full scaffold — React 19 + Vite 8 + TypeScript + Tailwind v4 + Firebase
- [x] 7 themes with CSS custom properties
- [x] Anonymous auth + invite-only model
- [x] StorageAdapter abstraction (Firebase + localStorage)
- [x] Body module (floor tracking with scoring)
- [x] Expenses module (CRUD, categories, validation)
- [x] Baby module (feed, sleep, growth, diaper)
- [x] Admin panel + invite generator
- [x] Route guards (ModuleGate, AdminGate)
- [x] Error handling (ErrorBoundary, toast, sync status)
- [x] PWA with service worker + update prompt
- [x] 32 unit tests + 35 e2e tests
- [x] GitHub Actions CI/CD → GitHub Pages
- [x] Firestore security rules
- [x] Dev bypass mode
- [x] Code quality: string enums, Result types, DRY utils, ESLint strict

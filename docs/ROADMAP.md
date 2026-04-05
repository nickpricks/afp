# AFP Roadmap

Last updated: 2026-04-04

---

## P0 — Critical (blocks real usage)

All P0 items completed.

## P1 — Important (quality + correctness)

- [ ] **Firestore runtime validation** — replace `as T` casts in adapters with parse/validate functions at the Firestore boundary.

## P2 — Enhancement (better UX)

- [ ] **`credential-already-in-use` UID orphan** — admin clear or auto-clear policy for orphaned anonymous profiles. Low risk for personal app.
- [ ] **Theme selector in app** — users can pick from 7 themes.
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

---

## Done

### 2026-04-04 — Session 2 (P0/P1/P2 sprint)

- [x] **Hash → BrowserRouter** — `BrowserRouter` with `basename={import.meta.env.BASE_URL}`, `public/404.html` for GitHub Pages SPA
- [x] **Body module: walk/run tracking** — `ActivityType` enum, `ActivityEntry` type, `body_activities` subcollection, `BODY_DEFAULTS` constants, `computeBodyScore` updated for floors + walk + run
- [x] **Body module: activity input UI** — `AddActivity` (bubble selector, distance input, m/km toggle), `ActivityLog` (today's entries), integrated into `BodyTracker`
- [x] **Baby module refactor** — generic `useBabyCollection<T>` hook, `useBabyData` now composes 4 hooks with proper sync tracking (all listeners must report before `Synced`)
- [x] **Baby validation** — `validateFeedEntry`, `validateSleepEntry`, `validateGrowthEntry`, `validateDiaperEntry`
- [x] **ThemeId → enum** — string union converted to TypeScript string enum, `CONFIG.DEFAULT_THEME` uses `ThemeId.FamilyBlue`
- [x] **DebugPage `isOk` rename** → `isPassing` to avoid shadowing canonical helper
- [x] **init-admin.ts** — documented string literal → enum mapping
- [x] **Firestore rules** — added `body_activities` rule
- [x] **E2e tests updated** — all `/#/` paths → `/` for BrowserRouter, added 6 body activity tests
- [x] **Unit tests** — 60 tests (was 32): body scoring, types, constants, baby validation
- [x] **Docs updated** — CLAUDE.md, ROADMAP.md, CHANGELOG.md

### 2026-04-04 — Session 1 (Firebase + auth)

- [x] Debug page (`/debug`) — Firebase config, auth state, storage mode, version, email
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

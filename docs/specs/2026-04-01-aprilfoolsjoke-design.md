# AprilFoolsJoke — Design Specification

**Date:** 2026-04-01
**Status:** Draft
**Version:** 0.1.0

## Overview

AprilFoolsJoke is a unified personal PWA that combines floor/body tracking, expense tracking, and baby tracking into one app. It replaces three standalone apps (Floor-Tracker, Finularity, BabyTracker web) with a single installable PWA backed by Firebase.

**Target user:** Nick + family/friends, invite-only access.

## Origin

Built from lessons learned across five personal projects:

| Source App | What It Contributes |
|---|---|
| Floor-Tracker | Theme system (6 themes), Firebase patterns, E2E testing, CI/CD pipeline |
| Finularity | Expense CRUD, category system, validation logic |
| BabyTracker (web) | Baby tracking models (feed, sleep, growth, diaper) |
| passforge | Stays independent — Go CLI, hardened separately |
| ft | Stays independent — Go CLI, hardened separately |

Source repos are archived (not deleted) once their functionality is ported and verified in AprilFoolsJoke.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 19 + TypeScript (strict mode) |
| Build | Vite 8 |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite` plugin) |
| Package manager | Bun |
| Backend | Firebase (Firestore + Anonymous Auth) |
| PWA | vite-plugin-pwa (registerType: 'prompt') |
| Testing | Vitest (unit/component) + Playwright (E2E) |
| Routing | React Router v7 (hash mode) |
| Deployment | GitHub Pages via GitHub Actions (Phase 1), S3 + CloudFront (future) |
| CI/CD | GitHub Actions: lint → test → E2E → build → deploy |

---

## Architecture

### Auth — Headminick Model

- **Headminick (admin):** Full read/write access to all users' data. Can approve/revoke users, enable/disable modules per user, pre-generate invite links.
- **Invited users:** Receive an invite link, get anonymous Firebase auth, UID linked to invite record. Access only their own data, only enabled modules.
- **Random visitors:** Anonymous auth fires but Firestore rules block all reads/writes. Dead end.

**Invite flow:**
1. Headminick creates a user entry in Firestore (name, allowed modules)
2. Generates a unique invite link (`/invite/{code}`)
3. Recipient opens link → anonymous auth → UID linked to invite
4. Firestore rules enforce: UID must match an approved invite

**Firestore rules enforce:**
- `request.auth.uid == {uid}` for user data access (fixes Floor-Tracker's UUID-based gap)
- Headminick UID stored in `app/config` gets override access to all user data
- Disabled modules blocked at the rules level, not just UI

### Module System

Three modules, **all disabled by default**. Headminick enables per user.

| Module | Scope | Source |
|---|---|---|
| **Body** | Floors (Phase 1), steps/running/exercise (Phase 2+) | Floor-Tracker |
| **Expenses** | Categories, soft-delete, bulk import (₹ currency) | Finularity |
| **Baby** | Feed, sleep, growth, diaper sub-trackers | BabyTracker web |

**Disabled = hidden.** No routes, no nav items, no data fetching. Static help text mentioning a module is fine. No dangling navigation links.

### Storage Abstraction

```
StorageAdapter interface:
  getAll(collection) → Result<data[]>
  getById(collection, id) → Result<data>
  save(collection, data) → Result<void>
  delete(collection, id) → Result<void>
  onSnapshot(collection, callback) → unsubscribe
```

Phase 1: Firebase client SDK implements this directly.
Future: A second adapter calls the Go API gateway instead. Frontend code is backend-agnostic.

### Navigation

Bottom tab bar — one icon per enabled module. Tap to switch. Each module owns its own internal routes. If only one module is enabled, the tab bar still shows (consistent UX, room to grow).

---

## Data Structure

### Firestore Schema

```
app/
  config/                     ← Headminick UID, app-wide settings
  invites/
    {inviteCode}/             ← { createdBy, linkedUid, name, modules, createdAt, usedAt }

users/
  {uid}/
    profile/                  ← { name, role: "headminick" | "user", modules: { body, expenses, baby }, theme, createdAt }

    body/
      {dateKey}/              ← YYYY-MM-DD
        floors: { up, down }
        steps: null            ← future (Phase 2)
        running: null          ← future (Phase 2)
        exercise: null         ← future (Phase 2)
        total: number          ← composite score

    expenses/
      {id}/                   ← { amount, category, note, date, isDeleted, createdAt, updatedAt }

    baby/
      feeds/{id}/             ← { type, amount, notes, timestamp }
      sleep/{id}/             ← { start, end, notes, timestamp }
      growth/{id}/            ← { weight, height, headCircumference, date }
      diapers/{id}/           ← { type, notes, timestamp }
```

**Key conventions:**
- IDs via `crypto.randomUUID()`
- Dates stored as `YYYY-MM-DD` strings
- Timestamps as ISO 8601
- Soft delete for expenses (`isDeleted: true`), hard delete for others
- Scoring: `floors.up + floors.down * 0.5` (ported from Floor-Tracker's `calculateTotal`)

---

## Directory Structure (Probable)

```
aprilfoolsjoke/
├── public/
│   ├── icons/                    ← PWA icons (192x192, 512x512)
│   └── favicon.ico
├── src/
│   ├── README.md
│   ├── main.tsx                  ← Entry point
│   ├── App.tsx                   ← Router, auth gate, module loader
│   ├── index.css                 ← Tailwind base + theme imports
│   │
│   ├── modules/
│   │   ├── README.md
│   │   ├── body/
│   │   │   ├── README.md
│   │   │   ├── components/       ← BodyTracker, FloorCounter, DailyChallenge
│   │   │   ├── hooks/            ← useBodyData, useScoring
│   │   │   ├── types.ts
│   │   │   └── __tests__/
│   │   ├── expenses/
│   │   │   ├── README.md
│   │   │   ├── components/       ← AddExpense, ExpenseList, BulkImport
│   │   │   ├── hooks/            ← useExpenses, useCategories
│   │   │   ├── types.ts
│   │   │   └── __tests__/
│   │   └── baby/
│   │       ├── README.md
│   │       ├── components/       ← FeedLog, SleepLog, GrowthChart, DiaperLog
│   │       ├── hooks/            ← useBabyData, useFeedLog
│   │       ├── types.ts
│   │       └── __tests__/
│   │
│   ├── shared/
│   │   ├── README.md
│   │   ├── auth/                 ← Headminick logic, invite flow, auth context
│   │   ├── storage/              ← StorageAdapter interface, FirebaseAdapter, Result type
│   │   ├── errors/               ← Error handling, toast/notification system
│   │   ├── components/           ← Layout, TabBar, SyncStatus, UpdatePrompt, ErrorBoundary
│   │   ├── hooks/                ← useAuth, useSyncStatus, useModules
│   │   └── types.ts              ← Shared types (User, Module, Result)
│   │
│   ├── themes/
│   │   ├── README.md
│   │   ├── themes.ts             ← Theme definitions, applyTheme(), useActiveThemeId()
│   │   ├── family-blue.css       ← DEFAULT
│   │   ├── summit-instrument.css
│   │   ├── corporate-glass.css
│   │   ├── night-city-elevator.css
│   │   ├── night-city-apartment.css
│   │   ├── deep-mariana.css
│   │   ├── industrial-furnace.css
│   │   ├── buttons.css           ← Shared button styles
│   │   └── effects.css           ← Shared visual effects
│   │
│   ├── admin/
│   │   ├── README.md
│   │   ├── components/           ← UserList, InviteGenerator, ModuleToggle
│   │   └── hooks/                ← useAdmin, useInvites
│   │
│   └── constants/
│       ├── README.md
│       ├── config.ts             ← App settings, storage keys, version
│       └── routes.ts             ← Route paths
│
├── e2e/
│   ├── README.md
│   ├── theme-test.spec.ts        ← Visual regression across themes x modules
│   ├── auth-flow.spec.ts         ← Invite → access → module visibility
│   └── screenshots/              ← Generated baseline screenshots
│
├── docs/
│   ├── specs/                    ← This file and future design specs
│   └── plans/                    ← Implementation plans
│
├── .github/
│   └── workflows/
│       └── deploy.yml            ← lint → test → E2E → build → deploy
│
├── index.html
├── vite.config.ts
├── tsconfig.json
├── eslint.config.js
├── package.json
├── bun.lock
├── firestore.rules
├── firebase.json
└── CLAUDE.md
```

Each directory with a `README.md` gets a short (10-20 line) description of its purpose, key files, and conventions. Optional `spec.md` files for genuinely complex logic (e.g., scoring algorithms, merge strategies).

**Self-sweep hook:** After each phase review (The Final Countdown), an agent sweeps all directories and regenerates stale READMEs.

---

## Design System

### Theme Architecture

Ported from Floor-Tracker's CSS custom properties system:
- Each theme is a single CSS file defining `--bg-primary`, `--accent`, `--text-primary`, etc.
- `applyTheme(themeId, colorMode)` adds/removes CSS classes on `<html>`
- `useActiveThemeId()` hook via MutationObserver
- Components use semantic tokens only — never hardcoded colors
- Theme selection in global settings, applies to all modules

### Phase 1 Themes

| Theme | Mode | Default? |
|---|---|---|
| **Family Blue** | Light + Dark | **Yes** |
| Summit Instrument | Light + Dark | No |
| Corporate Glass | Light + Dark | No |
| Night City: Elevator | Dark only | No |
| Night City: Apartment | Dark only | No |
| Deep: Mariana | Dark only | No |
| Industrial Furnace | Dark only | No |

**Family Blue:** Clean sky-blue background, soft card layout, rounded corners, warm accents. Inspired by the Option 2 reference image. Works across all modules without feeling tied to any one.

### Future Themes (Backlog)
- Warm Nursery (Option 1 reference — cream/beige/pastel)
- Nursery_OS (Option 3 reference — cyberpunk baby monitor aesthetic)
- More based on user feedback

---

## Error Handling & Data Safety

**The rule: No silent failures. Ever.**

### Layer 0 — Audit Verification Checkpoint

Before building each module, verify which audit findings from the source app are relevant, which are resolved by the new architecture, and which need explicit fixes. Check them off. No phantom worries.

Example: BabyTracker's "no TLS" and "binds to 0.0.0.0" findings vanish because there's no Go API. Confirm explicitly and move on.

### Layer 1 — Result Types

```typescript
type Result<T> = { ok: true; data: T } | { ok: false; error: string }
```

Every write operation returns success or failure. No void-returning saves. No fire-and-forget.

### Layer 2 — UI Feedback

- **Success:** Brief toast/flash confirmation
- **Failure:** Clear user-facing message ("Couldn't save. Will retry when connected.")
- **Forms never reset until save is confirmed**

### Layer 3 — Offline-First with Sync Feedback

- Firestore offline persistence handles connectivity drops
- Sync status indicator: synced / syncing / error / offline
- Data queues locally and syncs when connection returns
- App is fully functional offline

---

## Testing Strategy

### Tier 1 — Data Layer (Phase 1, 90%+ coverage target)

- Storage adapter: every CRUD operation, error paths, offline behavior
- Business logic: scoring formulas, validation, merge strategies
- Auth: invite flow, Headminick permissions, rejected access

### Tier 2 — Component Tests (Phase 1)

- Key user flows: add expense, log floors, record feed
- Form validation: rejected input shows error, not silent early return
- Module visibility: disabled modules don't render routes or nav items

### Tier 3 — E2E Visual Regression (Phase 1)

- Playwright, running in CI
- Screenshot each module in each theme (7 themes × 3 modules = 21+ baseline captures)
- Catches layout breaks, theme regressions, missing styles
- Auth flow E2E: invite → access → module visibility

### Post-Phase Review

After each phase ships, run **The Final Countdown** skill — comprehensive parallel agent review covering:
- Code quality and architecture adherence
- Test coverage gaps
- Security review
- Audit verification (source app findings resolved?)
- README sweep and update

---

## CI/CD Pipeline

```
Push to main:
  lint (ESLint + tsc --noEmit)
  → test (Vitest)
  → E2E (Playwright)
  → build (Vite)
  → deploy (GitHub Pages)

Pull requests:
  Same pipeline minus deploy
```

- Bun with `--frozen-lockfile` for reproducible builds
- Version injected via `VITE_APP_VERSION` env var
- PWA: `registerType: 'prompt'` — user sees "Update Available" notification

---

## ETA Table

| Phase | Scope | Estimated Effort | Includes |
|---|---|---|---|
| **Phase 1** | Core app — 3 modules, auth, themes, CI/CD, testing | 3-4 weeks | Body (floors), Expenses, Baby, Headminick, Family Blue + 6 themes, full CI, Playwright E2E |
| **Phase 2** | Expansion — Body module, admin dashboard, Go API | 2-3 weeks | Steps/running/exercise, data export/import, Headminick admin UI, Go API gateway, push notifications, new themes |
| **Phase 3** | Family features — profiles, shared data, insights | 2-3 weeks | Per-user preferences, family overview dashboard, charts/trends, baby milestones |
| **Phase 4** | Polish — a11y, performance, infra | 1-2 weeks | WCAG audit, code splitting, S3+CloudFront, gallery/photos |

**Total to Phase 4:** ~8-12 weeks at personal project pace.

These are effort estimates, not calendar time. Actual pace depends on how many evenings/weekends you throw at it.

---

## Roadmap Detail

### Phase 1: "It works on my phone"

- [ ] New repo, Vite + React 19 + TypeScript scaffold
- [ ] Firebase setup (Firestore + Anonymous Auth)
- [ ] Headminick auth model + invite system
- [ ] Module system (disabled by default, admin enables)
- [ ] Storage abstraction layer (FirebaseAdapter)
- [ ] Error handling (Result types, toasts, sync status)
- [ ] Body module — floors only (extensible data model)
- [ ] Expenses module — port from Finularity (with validation fixes)
- [ ] Baby module — port from BabyTracker web
- [ ] Theme system — Family Blue (default) + 6 from Floor-Tracker
- [ ] PWA config (offline-first, update prompt, installable)
- [ ] CI/CD pipeline (lint → test → E2E → build → deploy)
- [ ] Testing: data layer 90%+, component tests, Playwright E2E
- [ ] Per-directory README.md documentation
- [ ] **The Final Countdown review**
- [ ] **Audit verification checkpoint** — confirm source app findings resolved

### Phase 2: "It works well"

- [ ] Body module expansion — steps, running, exercise tracking
- [ ] Warm Nursery theme (Option 1) + Nursery_OS theme (Option 3)
- [ ] Data export/import — JSON backup/restore
- [ ] Headminick admin dashboard — manage users, toggle modules, view activity
- [ ] Go API gateway — thin layer, Heroku/Lambda free tier
- [ ] PWA push notifications (reminders, daily nudges)
- [ ] Additional family themes based on feedback
- [ ] **The Final Countdown review**

### Phase 3: "It works for the family"

- [ ] User profiles & preferences — per-user view customization
- [ ] Shared data — Headminick family overview dashboard
- [ ] Charts & insights — weekly/monthly trends
- [ ] Baby milestones — growth percentiles, milestone checklist
- [ ] Passforge web UI consideration (module or standalone TBD)
- [ ] **The Final Countdown review**

### Phase 4: "It's polished"

- [ ] Accessibility audit — WCAG compliance, screen reader support
- [ ] Performance — code splitting per module, lazy loading
- [ ] S3 + CloudFront deployment (if outgrowing GitHub Pages)
- [ ] Gallery/photos — baby photos module
- [ ] Custom domain
- [ ] **The Final Countdown review**

### Future / Backlog

- More Body sub-trackers (weight, water intake, nutrition)
- Expense analytics (spending trends, budgets, category breakdowns)
- Multi-language support (Hindi/English minimum)
- Desktop app (Electron/Tauri) if PWA isn't enough
- ft integration — notes module (separate design conversation)

---

## Standalone Project Hardening (Separate from AprilFoolsJoke)

### passforge
- Add CI pipeline (GitHub Actions: fmt → vet → test → build)
- GoReleaser + GitHub Releases for binary distribution
- Semantic versioning automation
- Shell completions (bash/zsh/fish)
- Prepare storage abstraction for v0.3.0 vault feature
- v0.4.0: Web UI (could become AprilFoolsJoke module or standalone)

### ft (FeatherTrailMD)
- Fix critical config-layer silent failures (C1-C7 from audit)
- Add config package test suite (currently 0% coverage)
- Add CI pipeline (GitHub Actions: vet → test → build)
- Fix ID prefix collision (cap at 99 or exact-match)
- Consistent error wrapping across all packages
- Web usage: separate future design conversation

---

## Decision Log

| Decision | Rationale |
|---|---|
| Fresh app instead of merging existing | All apps are pre-v1.0; scaffolding, not entrenched code. Clean start avoids Frankenstein risk. |
| Firebase over Go API (Phase 1) | Serverless, free tier, offline sync built-in. No hosting ops for a personal app. |
| Go API deferred to Phase 2 | Storage abstraction makes it a one-adapter swap. Build when there's a real need. |
| Hash routing over BrowserRouter | Avoids GitHub Pages 404 issue that broke Finularity. |
| All modules disabled by default | Headminick controls access. Clean, secure, no accidental data exposure. |
| Family Blue as default theme | Neutral, works across all modules, doesn't pigeonhole the app. Sky-blue Option 2 reference. |
| README per directory, not per file | Directories are stable; files rename often. Optional spec.md for complex logic. |
| The Final Countdown after each phase | Comprehensive review catches regressions before moving forward. |

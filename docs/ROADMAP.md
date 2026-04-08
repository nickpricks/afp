# AFP Roadmap

Last updated: 2026-04-07

---

## Phase Progress

| Phase | Status | Steps | Notes |
|-------|--------|-------|-------|
| Phase 1 (Scaffold) | ✅ Done | — | Shipped as v0.1.0 |
| Phase 2.0 (Foundation) | ✅ Done | 14/14 | Enums, types, Firestore rules, routes |
| Phase 2a (Body) | ✅ Core done | 30/34 | +3: CyclingTab, gear reconfigure, ActivityLog pagination. Missing: Firestore rule verification |
| Phase 2b (Baby) | ✅ Core done | 23/23 | +2: delete on all 4 logs. Firestore rules TBD |
| Phase 2c (Budget) | ✅ Core done | 28/28 | +3: ReconciliationView, time-range filter, amount presets. Firestore rules TBD |
| Phase 2d (Profile) | 🚧 Partial | 6/9 | Missing: tests, negative tests, doc sweep |
| Phase 2e (Admin+Viewer) | 🚧 In progress | 9/35 | Dashboard done. Admin pages + viewer flow planned |
| Phase 2f (Themes) | 📋 Analyzed | 0/18 | Theme analysis spec written, design samples exist |
| Phase 2g (E2E + Bench) | ❌ Not started | 0/8 | Interactive E2E flows, build/bundle/test benchmarks |
| **Total** | **~55%** | **96/178** | |

---

## P0 — Critical (blocks real usage)

All P0 items completed.

## P1 — Quality & Correctness

| | Item | Phase | Status |
|---|------|-------|--------|
| 🔨 | Firestore runtime validation — replace `as T` casts with parse/validate | — | Not started |
| 🔨 | Firestore rules verification — manual/automated tests for all modules | 2a-2d | Not started |
| 🔨 | Income module E2E regression test | 2c | Not started |
| 🔨 | Unit test P0 gaps: `date.ts`, `validation.ts`, `profile.ts` (4 functions) | — | Not started |

## P2 — Phase 2 Remaining Work

| | Item | Phase | Status |
|---|------|-------|--------|
| ~~🔨~~ | ~~ReconciliationView — CC charges vs settlements UI~~ | 2c | DONE |
| ~~🔨~~ | ~~BudgetView time-range — Today/Week/Month/All filter~~ | 2c | DONE |
| ~~🔨~~ | ~~Amount presets — [10] [20] [50] [100] [200] bubbles~~ | 2c | DONE |
| ~~🔨~~ | ~~Body module reconfigure — gear icon to re-enter config~~ | 2d | DONE |
| 🔨 | Link/unlink auth providers in profile | 2d | Not started |
| ~~🔨~~ | ~~Universal Dashboard — role-aware home page~~ | 2e | DONE |
| 🔨 | Admin user management — list users, toggle modules | 2e | Planned |
| 🔨 | Viewer role UI — read-only dashboard, invite flow | 2e | Planned |
| 🔨 | 3 new themes — Lullaby, NurseryOs, MidnightFeed CSS | 2f | Not started |
| 🔨 | Ambient effects — per-theme animations | 2f | Not started |
| 🔨 | Apply design samples to components | 2f | Not started |

## Bugs

| | Bug | Module | Severity |
|---|-----|--------|----------|
| ~~🐛~~ | ~~Walking/Running list no pagination~~ | Body | ~~Medium~~ — DONE (ActivityLog 7→30) |
| 🐛 | Walking/Running list no date grouping | Body | Medium |
| 🐛 | Floors recent list flat styling | Body | Low |
| 🐛 | Stats score lacks context (no goal) | Body | Low |
| 🐛 | Stats "THIS WEEK" card cramped | Body | Low |
| 🐛 | ActivityLog edit UX (inline → main-form) | Body | Low |
| ~~🐛~~ | ~~Payment method bubbles don't deselect~~ | Budget | ~~Low~~ — DONE (toggle deselect) |
| ~~🐛~~ | ~~Negative/zero amounts accepted in inputs~~ | All | ~~Low~~ — DONE (min/step attrs) |
| 🐛 | Baby tabs need edit (tap-to-populate) | Baby | Medium |
| ~~🐛~~ | ~~Baby tabs need delete~~ | Baby | ~~Medium~~ — DONE (x button on all 4 logs) |
| 🐛 | Multi-baby not tested | Baby | Medium |
| 🐛 | Budget list no summary header | Budget | Low |
| 🐛 | Overall contrast low (Family Blue) | Theme | Low |
| 🐛 | credential-already-in-use UID orphan | Auth | Low |

## Feature Ideas

| | Feature | Module | Effort |
|---|---------|--------|--------|
| ~~💡~~ | ~~Cycling tab — clone WalkingTab, swap enum~~ | Body | ~~Small~~ — DONE |
| 💡 | Yoga tab — duration + asana select | Body | Medium |
| 💡 | Daily challenge / streak | Body | Medium |
| 💡 | Configurable scoring weights | Body | Small |
| 💡 | Health API sync (phone steps/distance) | Body | Large |
| 💡 | Growth chart visualization | Baby | Medium |
| 💡 | Expense bulk import | Budget | Medium |
| 💡 | Dev mode enhancements — role switcher, time travel | Dev | Medium |
| 💡 | Climbing stick-figure loading animation — port from Floor-Tracker (`LoadingScreen.tsx`). Inline SVG, CSS-only, theme-aware. Shows during Firestore cache hydration | UI | Small |

## P2 — Phase 2g: E2E Interaction Tests + Benchmarking

| | Item | Phase | Status |
|---|------|-------|--------|
| 🔨 | E2E: Budget full expense flow (fill form → submit → verify in list) | 2g | Not started |
| 🔨 | E2E: Body configure → log floors → switch tab → log walk → verify | 2g | Not started |
| 🔨 | E2E: Payment bubble toggle (select → deselect → verify styling) | 2g | Not started |
| 🔨 | E2E: Body gear reconfigure (click gear → enable running → save → verify tab) | 2g | Not started |
| 🔨 | E2E: Baby add child → navigate to child → log feed → verify in recent | 2g | Not started |
| 🔨 | Bench: build time measurement (vite build with timing) | 2g | Not started |
| 🔨 | Bench: bundle size report from dist/ | 2g | Not started |
| 🔨 | Bench: test suite duration tracking (unit + E2E) | 2g | Not started |

## P3 — Future

| | Item | Effort |
|---|------|--------|
| 🔮 | Go API gateway — second StorageAdapter impl | Large |
| 🔮 | S3 + CloudFront deployment | Medium |
| 🔮 | E2E visual regression — themes x modules screenshots | Medium |
| 🔮 | Playwright V8 coverage for E2E | Small |
| 🔮 | Proper auth providers — email link, Apple | Medium |
| 🔮 | Offline-first UX — retry, queue | Large |

---

## Done

### 2026-04-07 — Session 4 (Bug fixes, Phase 2c completion, Dashboard planning)

- [x] Bug fix: payment bubble toggle deselect
- [x] Bug fix: number input min/step constraints (all modules)
- [x] Bug fix: ActivityLog pagination 7→30 (Walking/Running/Cycling)
- [x] Bug fix: baby entry delete on all 4 log components
- [x] Feature: CyclingTab + config form enabled
- [x] Feature: body reconfigure via gear button
- [x] Feature: budget time-range filter (Today/Week/Month/All)
- [x] Feature: amount presets [10][20][50][100][200]
- [x] Feature: ReconciliationView (CC charges vs settlements)
- [x] E2E fix: Cycling config label updated
- [x] Specs: Universal Dashboard design + Theme system analysis
- [x] Plan: Universal Dashboard implementation (9 tasks)
- [x] Unit tests: 189 → 217 (+28)
- [x] E2E tests: 38 (all passing)

### 2026-04-07 — Session 3 (Phase 2 sprint)

- [x] Phase 2.0: Shared foundation — all enums, types, Firestore rules, routes
- [x] Phase 2a: Body module redesign — config gate, tabbed UI, stats dashboard, edit/backfill
- [x] Phase 2b: Baby module redesign — multi-child, nested collections, BabyLanding, ChildDetail
- [x] Phase 2c: Budget module — income tracking, payment methods, summary cards, budget-math
- [x] Phase 2d: Profile page — theme picker, color mode, username, changelog viewer
- [x] 7 bug fixes: stats buttons, running tab empty, activity sort/edit, floor pagination, FAB color, income crash, profile nav
- [x] DevBench: dev-only seed panel with ×100/×1k bulk, nuke localStorage
- [x] 3 design samples: warm-instrument, dense-editorial, playful-streak
- [x] E2E rewrite: 38 tests for Phase 2 UI (was 41, 33 failing)
- [x] Coverage analysis: `docs/revz/2026-04-07-coverage-analysis.md`
- [x] Unit tests: 60 → 189 (+129)
- [x] E2E tests: 41 → 38 (rewritten for Phase 2, all passing)

### 2026-04-04 — Session 2 (P0/P1/P2 sprint)

- [x] Hash → BrowserRouter migration
- [x] Body module: walk/run tracking with scoring
- [x] Baby module refactor with generic hooks
- [x] ThemeId → enum
- [x] E2E tests updated for BrowserRouter
- [x] Unit tests: 32 → 60

### 2026-04-04 — Session 1 (Firebase + auth)

- [x] Google Sign-In with anonymous account linking
- [x] Admin bootstrap via Firebase Admin SDK
- [x] Firestore rules deployed
- [x] Debug page, profile photo, no-profile wall
- [x] GitHub secrets + CI/CD

### pre-0.0.5 (initial commit)

- [x] Phase 1 full scaffold — React 19 + Vite 8 + TS + Tailwind v4 + Firebase
- [x] 7 themes, auth, storage adapter, 3 modules, admin, PWA
- [x] 32 unit tests + 35 E2E tests

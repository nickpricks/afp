# AFP — It Started On April Fools Day

A unified personal PWA combining body/fitness tracking, expense tracking, and baby tracking. Invite-only access via TheAdminNick admin model.

## Stack

React 19 + Vite 8 + TypeScript (strict) + Tailwind CSS v4 + Firebase + Bun

## Quick Start

```bash
bun install
bun run setup:env        # creates .env.development from .env.example
bun run dev              # dev server on port 3000
```

Dev mode works without Firebase — all modules enabled, TheAdminNick role, localStorage adapter.

## Commands

| Command | What |
|---|---|
| `bun run dev` | Dev server |
| `bun run build` | Production build (tsc + vite) |
| `bun run lint` | Type check + ESLint |
| `bun run typecheck` | tsc --noEmit only |
| `bun run lint:eslint` | ESLint only |
| `bun run test` | Vitest unit tests (469) |
| `bun run test:e2e` | Playwright E2E tests (47) |
| `bun run format` | Prettier format all source files |
| `bun run format:check` | Prettier check (CI-friendly, no writes) |
| `bun run test:coverage` | Unit tests with v8 coverage |
| `bun run preview` | Preview production build |
| `bun run clean` | Remove build artifacts |

## Modules

| Module | What |
|---|---|
| Body | Floors (up/down taps), walking, running, cycling — daily scoring, tabbed UI, config gate |
| Budget | 15 expense categories, income tracking, payment methods, CC reconciliation, time-range filter (Today/Week/Month/All) |
| Baby | Multi-child support. Feed, sleep, growth, diaper logs — nested subcollections per child |

All modules disabled by default. TheAdminNick enables per user via invites.

## Dashboard

Role-aware home page at `/`. Shows module summary cards scoped to the correct user:
- **User** — own data
- **Viewer** — read-only view of another user's data (via `viewerOf`)
- **Admin** — user selector dropdown to view any user

Hooks accept optional `targetUid` for data scoping. Write callbacks are no-ops in read-only mode.

## Architecture

```
src/
  admin/          — Admin panel (tabbed Invites + Users + Broadcasts), invite generator, notifications
  constants/      — config (PAGE_SIZE, UNDO_DURATION_MS, METERS_PER_KM), routes, db paths, messages
  modules/
    body/         — BodyPage (tabbed), FloorsTab, Walking/Running/CyclingTab, BodyStats, scoring
    expenses/     — Budget landing, AddExpense/AddIncome, ExpenseList, IncomeList, ReconciliationView
    baby/         — BabyLanding, ChildDetail (tabbed), FeedLog, SleepLog, GrowthLog, DiaperLog
  shared/
    auth/         — Firebase auth, invite system, TheAdminNick model
    components/   — Dashboard, DashboardCard, Layout, TabBar, ModuleGate, AdminGate, AlertBanner, DatePickerModal, SwipeToDelete, DevBench, PaymentMethodBubble, loading/
    errors/       — ErrorBoundary, toast notifications (with undo action support)
    hooks/        — useModules, useNotifications, useModuleRequest, useSyncStatus, useMinDelay
    storage/      — StorageAdapter interface + Firebase/localStorage impls
    types.ts      — Result<T>, ModuleId, SyncStatus, UserRole, ToastType, NotificationType, Severity, all enums
    utils/        — date, error, profile, validation, regex, format, sort helpers
  themes/         — 10 CSS themes, ambient effects, theme definitions + migration
```

## Themes

10 themes with distinct font pairings and dynamic ambient effects. Family Blue (default), Garden Path, Lullaby, Rose Quartz, Charcoal, Marauder's Map (light+dark). Neon Glow, Deep Mariana, Industrial Furnace, Expecto Patronum (dark-only). 8 Google Font families. Granular 0-100% intensity slider in Profile controls particle density. Expecto Patronum features unique ghostly spirit animal manifestations.

## Key Patterns

- **Ambient Effects v2** — Pure React-based particle system with seeded randomization for stable, performant atmospheric effects.
- **Tap-to-edit** — tap a list entry to populate the form above, button becomes "Update"
- **Undo delete** — 10s toast with "Undo" action on all deletable lists
- **Additive presets** — [10] [20] [50] [100] [200] buttons in Budget increment the total amount
- **Interactive bubbles** — emoji-grid category selection with expandable "View All" logic
- **Pagination** — all lists use `CONFIG.PAGE_SIZE` (25 default), "Show more" button
- **Delete UX** — inline `x` on all lists (hover → red, grows), swipe-to-delete on mobile via `SwipeToDelete` wrapper, 10s undo toast
- **Notifications** — per-user `notifications` subcollection. Module request flow (user → admin), admin alerts/broadcasts with severity banners
- **Score ring** — SVG progress ring with daily goal, zone labels (Easy Start → Beast Mode)
- **Daily goal builder** — per-activity sliders in config form, presets (🌿💪🔥⚡)
- **Loading screen** — 3 SVG stick-figure scenes (Climber, Athlete, Reader), random per mount, with brand text reveal
- **Code splitting** — React.lazy + Suspense on all routes, LoadingScreen as fallback
- **Message enums** — all toast messages in `constants/messages.ts` enums (BodyMsg, BabyMsg, BudgetMsg, ProfileMsg, AdminMsg, GreetingMsg), toast types via `ToastType` enum — zero raw strings
- **DevBench** — dev-only seed panel with 11 generators (Floors, Walk, Run, Cycle, Expense, Income, Settlement, Feed, Sleep, Diaper, Growth) + bulk modes (x100, x1k with day-spread)

## Docs

| Doc | What |
|---|---|
| `CLAUDE.md` | AI assistant instructions, architecture, conventions, known issues |
| `docs/ROADMAP.md` | Phase progress (~95%), prioritized backlog (P0-P3), theme roster |
| `docs/firebase-setup.md` | Firebase setup guide |
| `docs/getting-started.md` | Getting started guide |
| `docs/specs/` | Design specs (Phase 1, Phase 2, Dashboard, Theme analysis, Loading screen, Themes, Notifications, Phase 3 vision, Enhanced Themes) |
| `docs/plans/` | Implementation plans (Phase 1, Phase 2 per-module, Dashboard, Admin, Viewer, Loading screen, Themes, Notifications, Phase 3 baby, Enhanced Themes) |
| `docs/revz/` | Code reviews, coverage analysis, session reviews |

## License

Private — personal use only.

---

[![🚀 Pages](https://github.com/nickpricks/afp/actions/workflows/deploy.yml/badge.svg)](https://github.com/nickpricks/afp/actions/workflows/deploy.yml)
[![🔒 Firestore](https://github.com/nickpricks/afp/actions/workflows/firebase-rules.yml/badge.svg)](https://github.com/nickpricks/afp/actions/workflows/firebase-rules.yml)

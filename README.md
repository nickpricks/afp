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
| `bun run test` | Vitest unit tests (281) |
| `bun run test:e2e` | Playwright E2E tests (42) |
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
  admin/          — Admin panel (tabbed Invites + Users), invite generator
  constants/      — config (PAGE_SIZE, UNDO_DURATION_MS, METERS_PER_KM), routes, db paths, messages
  modules/
    body/         — BodyPage (tabbed), FloorsTab, Walking/Running/CyclingTab, BodyStats, scoring
    expenses/     — Budget landing, AddExpense/AddIncome, ExpenseList, IncomeList, ReconciliationView
    baby/         — BabyLanding, ChildDetail (tabbed), FeedLog, SleepLog, GrowthLog, DiaperLog
  shared/
    auth/         — Firebase auth, invite system, TheAdminNick model
    components/   — Dashboard, DashboardCard, Layout, TabBar, ModuleGate, AdminGate, DevBench
    errors/       — ErrorBoundary, toast notifications (with undo action support)
    hooks/        — useModules, useSyncStatus
    storage/      — StorageAdapter interface + Firebase/localStorage impls
    types.ts      — Result<T>, ModuleId, SyncStatus, UserRole, all enums
    utils/        — date, error, profile, validation, regex, format, sort helpers
  themes/         — 7 themes (10 planned — see ROADMAP Phase 2f)
```

## Themes

7 exist, 10 planned. Family Blue (default), Garden Path, Lullaby, Rose Quartz, Charcoal, Marauder's Map (light+dark). Neon Glow, Deep Mariana, Industrial Furnace, Expecto Patronum (dark-only). See `docs/ROADMAP.md` Phase 2f for full roster.

## Key Patterns

- **Tap-to-edit** — tap a list entry to populate the form above, button becomes "Update"
- **Undo delete** — 10s toast with "Undo" action on all deletable lists
- **Pagination** — all lists use `CONFIG.PAGE_SIZE` (25 default), "Show more" button
- **List hover (+)** — per-row duplicate button on activity/floor lists, appears on hover
- **Score ring** — SVG progress ring with daily goal, zone labels (Easy Start → Beast Mode)
- **Daily goal builder** — per-activity sliders in config form, presets (🌿💪🔥⚡)
- **DevBench** — dev-only seed panel with 11 generators (Floors, Walk, Run, Cycle, Expense, Income, Settlement, Feed, Sleep, Diaper, Growth) + bulk modes (x100, x1k with day-spread)

## Docs

| Doc | What |
|---|---|
| `CLAUDE.md` | AI assistant instructions, architecture, conventions, known issues |
| `docs/ROADMAP.md` | Phase progress (~70%), prioritized backlog (P0-P3), theme roster |
| `docs/firebase-setup.md` | Firebase setup guide |
| `docs/getting-started.md` | Getting started guide |
| `docs/specs/` | Design specs (Phase 1, Phase 2, Dashboard, Theme analysis) |
| `docs/plans/` | Implementation plans (Phase 1, Phase 2 per-module, Dashboard, Admin, Viewer) |
| `docs/revz/` | Code reviews, coverage analysis, session reviews |

## License

Private — personal use only.

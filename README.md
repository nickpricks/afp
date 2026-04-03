# AFP — It Started On April Fools Day

A unified personal PWA combining body/fitness tracking, expense tracking, and baby tracking. Invite-only access.

## Stack

React 19 + Vite 8 + TypeScript (strict) + Tailwind CSS v4 + Firebase + Bun

## Quick Start

```bash
bun install
bun run setup:env        # creates .env.development from .env.example
bun run dev              # dev server on port 3000
```

Dev mode works without Firebase — all modules enabled, localStorage adapter.

## Commands

| Command | What |
|---|---|
| `bun run dev` | Dev server |
| `bun run build` | Production build (tsc + vite) |
| `bun run lint` | Type check + ESLint |
| `bun run typecheck` | tsc --noEmit only |
| `bun run lint:eslint` | ESLint only |
| `bun run test` | Vitest unit tests |
| `bun run test:e2e` | Playwright e2e tests |
| `bun run test:coverage` | Unit tests with v8 coverage |
| `bun run preview` | Preview production build |
| `bun run clean` | Remove build artifacts |

## Modules

| Module | What |
|---|---|
| Body | Floor tracking (up/down taps), daily scoring |
| Expenses | 15 categories with emoji labels, CRUD, soft-delete |
| Baby | Feed, sleep, growth, diaper logs — 4 subcollections |

All modules disabled by default. TheAdminNick enables per user via invites.

## Architecture

```
src/
  admin/          — Admin panel, invite generator
  constants/      — config, routes (AppPath enum), db paths, messages
  modules/
    body/         — Body tracker (BodyTracker, useBodyData, scoring)
    expenses/     — Expense tracker (AddExpense, ExpenseList, categories)
    baby/         — Baby tracker (FeedLog, SleepLog, GrowthLog, DiaperLog)
  shared/
    auth/         — Firebase auth, invite system, TheAdminNick model
    components/   — Layout, TabBar, ModuleGate, AdminGate, SyncStatus
    errors/       — ErrorBoundary, toast notifications
    hooks/        — useModules, useSyncStatus
    storage/      — StorageAdapter interface + Firebase/localStorage impls
    types.ts      — Result<T>, ModuleId, SyncStatus, UserRole enums
    utils/        — date, error, profile, validation, regex helpers
  themes/         — 7 themes (Family Blue default + 6 ported)
```

## Themes

Family Blue (default, light+dark), Summit Instrument, Night City: Elevator, Deep: Mariana, Night City: Apartment, Industrial Furnace, Corporate Glass.

## Firebase Setup

See `docs/firebase-setup.md` for step-by-step guide.

## License

Private — personal use only.

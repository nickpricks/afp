# src/modules/

Self-contained feature modules. Each module owns its types, hooks, components, and tests.

## Modules

- **body/** — Body/fitness tracking: floors (daily aggregate), walk/run/cycle activities, SVG score ring with daily goal, weekly bar chart
- **expenses/** — Budget module (directory is `expenses/`, ModuleId is `Budget`). Expense + income tracking, 15 categories, payment methods, reconciliation
- **baby/** — Baby tracking: multi-child via nested subcollections (feeds, sleep, growth, diapers)

## Conventions

- Modules are independent — they import from `shared/` but never from each other
- Each module follows the same structure: `types.ts`, `hooks/`, `components/`, `__tests__/`
- All hooks use `createAdapter` factory for storage, `DbSubcollection` enum for collection names, and `SyncStatus` enum for sync state
- Hooks accept optional `targetUid` for role-aware data scoping (viewer reads viewerOf user, admin selects from all users)
- All list views use tap-to-edit pattern and `CONFIG.PAGE_SIZE` pagination with "Show more"
- Delete actions use 10s undo toast (`CONFIG.UNDO_DURATION_MS`)

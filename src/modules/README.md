# src/modules/

Self-contained feature modules. Each module owns its types, hooks, components, and tests.

## Modules

- **body/** -- Floor tracking (Phase 1), extensible for steps/running/exercise
- **expenses/** -- Expense tracking with 15 categories, subcategories, and soft-delete
- **baby/** -- Baby tracking across 4 subcollections: feeds, sleep, growth, diapers

## Conventions

- Modules are independent -- they import from `shared/` but never from each other
- Each module follows the same structure: `types.ts`, `hooks/`, `components/`, `__tests__/`
- All hooks use `createAdapter` factory for storage, `DbSubcollection` enum for collection names, and `SyncStatus` enum for sync state
- Module-specific validation and business logic stays inside the module

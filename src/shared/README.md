# shared/

Cross-cutting infrastructure that modules depend on but don't own.

## Files

- **types.ts** — Result type (`ok`, `err`, `isOk`, `isErr`), enums (`ModuleId`, `UserRole`, `SyncStatus`, `ActivityType`, `BudgetView`, `PaymentMethod`, `ExpenseCategory`, `IncomeSource`, `FeedType`, `SleepType`, `SleepQuality`, `DiaperType`), and interfaces (`UserProfile`, `ModuleConfig`). `UserProfile` includes optional `effectCount` and `effectSize` fields for theme ambient effects

## Subdirectories

- **auth/** — Firebase auth, Google Sign-In, TheAdminNick admin model, invite system, username claiming
- **components/** — App shell UI (Layout, TabBar, Dashboard, ProfilePage, DevBench, loading screens, route guards)
- **errors/** — Error boundary and toast notifications
- **hooks/** — Shared hooks (useModules, useSyncStatus, useMinDelay)
- **storage/** — Backend-agnostic storage layer (Firebase + localStorage adapters)
- **utils/** — Pure utility functions (date, error, format, profile, regex, sort, validation)

## Tests

Tests live in `__tests__/` and cover types, admin roles, cross-role gates, viewer role, admin claim, and profile security.

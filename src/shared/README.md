# shared/

Cross-cutting infrastructure that modules depend on but don't own.

## Files

- **types.ts** — Result type (`ok`, `err`, `isOk`, `isErr`), enums (`ModuleId`, `UserRole`, `SyncStatus`, `ActivityType`, `TimeRange`, `PaymentMethod`, `ExpenseCategory`, `IncomeSource`, `FeedType`, `SleepType`, `SleepQuality`, `DiaperType`), and interfaces (`UserProfile`, `ModuleConfig`). `UserProfile` includes optional `effectIntensity` (0–100) and `effectSize` (70/100/140 tier) fields for theme ambient effects

## Subdirectories

- **auth/** — Firebase auth, Google Sign-In, TheAdminNick admin model, invite system, username claiming
- **components/** — App shell UI (Layout, TabBar, Dashboard, ProfilePage, DevBench, AlertBanner, DatePickerModal, SwipeToDelete, loading screens, route guards, AmbientEffects, tier pickers)
- **errors/** — Error boundary and toast notifications
- **hooks/** — Shared hooks (useModules, useSyncStatus, useMinDelay, useNotifications, useModuleRequest, useConsoleCapture, useListControls, useMatchMedia, useViewportSizeMultiplier)
- **storage/** — Backend-agnostic storage layer (Firebase + localStorage adapters, verbose logging)
- **utils/** — Pure utility functions (date, error, format, profile, regex, sort, validation, verbose, filter, paginate, relative-date, intensity, effectSize)

## Tests

Tests live in `__tests__/` and cover types, admin roles, cross-role gates, viewer role, admin claim, and profile security.

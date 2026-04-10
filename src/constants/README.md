# constants/

App-wide configuration, route definitions, Firestore paths, and user-facing messages.

## Files

- **config.ts** — `CONFIG` object with APP_NAME, VERSION, DEFAULT_THEME, CURRENCY_SYMBOL, invite-code settings, METERS_PER_KM, PAGE_SIZE, UNDO_DURATION_MS, and DAILY_SCORE_GOAL
- **routes.ts** — `AppPath` enum (14 paths including `/animations`) and `ROUTES` lookup object for all application route paths
- **db.ts** — `DbCollection`, `DbSubcollection`, `DbDoc`, `DbField` enums and path helpers (`userPath`, `childPath`)
- **messages.ts** — `ValidationMsg`, `InviteMsg`, `BudgetMsg`, `BodyMsg`, `BabyMsg`, `ProfileMsg`, `AdminMsg`, `ProviderMsg` enums for toast and error messages

## Tests

- `__tests__/db.test.ts` — DB path helpers and enum values
- `__tests__/messages.test.ts` — Message enum exports
- `__tests__/routes.test.ts` — Route enum and ROUTES object

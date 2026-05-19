# constants/

App-wide configuration, route definitions, Firestore paths, and user-facing messages.

## Files

- **config.ts** — `CONFIG` object with APP_NAME, VERSION, DEFAULT_THEME, CURRENCY_SYMBOL, invite-code settings, METERS_PER_FLOOR, METERS_PER_KM, UNDO_DURATION_MS, DAILY_SCORE_GOAL, BUDGET_VISIBLE_CATEGORIES, and MOBILE_BREAKPOINT_PX (640, matches Tailwind's `sm:` breakpoint — used by viewport-aware hooks)
- **routes.ts** — `AppPath` enum (14 paths including `/animations`) and `ROUTES` lookup object for all application route paths
- **db.ts** — `DbCollection`, `DbSubcollection`, `DbDoc`, `DbField` enums and path helpers (`userPath`, `childPath`)
- **messages.ts** — `ValidationMsg`, `InviteMsg`, `BudgetMsg`, `BodyMsg`, `BabyMsg`, `ProfileMsg`, `AdminMsg`, `ProviderMsg` enums for toast and error messages

## Tests

- `__tests__/db.test.ts` — DB path helpers and enum values
- `__tests__/messages.test.ts` — Message enum exports
- `__tests__/routes.test.ts` — Route enum and ROUTES object

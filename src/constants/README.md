# constants/

App-wide configuration, route definitions, Firestore paths, and user-facing messages.

## Files

- **config.ts** — `CONFIG` object with APP_NAME, VERSION, default theme, currency symbol, and invite-code settings
- **routes.ts** — `AppPath` enum and `ROUTES` lookup object for all application route paths
- **db.ts** — `DbCollection`, `DbSubcollection`, `DbDoc`, `DbField` enums and path helpers (`userPath`, `userBabyPath`)
- **messages.ts** — `ValidationMsg`, `InviteMsg`, `ExpenseMsg`, `ProviderMsg` enums for toast and error messages

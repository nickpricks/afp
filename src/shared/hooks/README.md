# hooks/

Shared React hooks used across the app shell and multiple modules.

## Files

- **useModules.ts** — Returns the list of `ModuleId` values enabled for the current user
- **useSyncStatus.ts** — Exposes `syncStatus` and `setSyncStatus` from auth context
- **useMinDelay.ts** — Returns `true` for a specified duration after mount, then `false`. Used by Layout to hold the loading screen for a minimum time (1s in prod, 0 in dev)

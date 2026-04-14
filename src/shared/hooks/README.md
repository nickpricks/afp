# hooks/

Shared React hooks used across the app shell and multiple modules.

## Files

- **useModules.ts** — Returns the list of `ModuleId` values enabled for the current user
- **useSyncStatus.ts** — Exposes `syncStatus` and `setSyncStatus` from auth context
- **useMinDelay.ts** — Returns `true` for a specified duration after mount, then `false`. Used by Layout to hold the loading screen for a minimum time (1s in prod, 0 in dev)
- **useNotifications.ts** — Real-time listener on the current user's `notifications` subcollection; returns sorted, deduplicated entries
- **useModuleRequest.ts** — Dual-writes a module access request to both the user's profile and the admin's notifications subcollection
- **useConsoleCapture.ts** — Monkey-patches `console.*` methods to capture log entries into React state; used by ConsoleViewer

## Tests

Tests in `__tests__/`: `useNotifications.test.ts`, `useModuleRequest.test.ts`.

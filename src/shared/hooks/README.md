# hooks/

Shared React hooks used across the app shell and multiple modules.

## Files

- **useModules.ts** — Returns the list of `ModuleId` values enabled for the current user
- **useSyncStatus.ts** — Exposes `syncStatus` and `setSyncStatus` from auth context
- **useMinDelay.ts** — Returns `true` for a specified duration after mount, then `false`. Used by Layout to hold the loading screen for a minimum time (1s in prod, 0 in dev)
- **useNotifications.ts** — Real-time listener on the current user's `notifications` subcollection; returns sorted, deduplicated entries
- **useModuleRequest.ts** — Dual-writes a module access request to both the user's profile and the admin's notifications subcollection
- **useConsoleCapture.ts** — Monkey-patches `console.*` methods to capture log entries into React state; used by ConsoleViewer
- **useListControls.ts** — Bundled session-state hook for list views. Returns `{ timeRange, pageSize, page, showAll }` with corresponding setters. Per-list, never persisted. Defaults: `TimeRange.All`, `pageSize: 25`, `page: 1`, `showAll: false`. Setting `timeRange` resets `page → 1` and `showAll → false`. Setting `pageSize` resets `page → 1`
- **useMatchMedia.ts** — Generic CSS media-query subscriber. `useMatchMedia(query: string): boolean` returns whether the query currently matches and re-renders on change. Returns `false` outside a browser environment so consumers can rely on a stable boolean during SSR / unit tests
- **useViewportSizeMultiplier.ts** — Returns a particle-size multiplier based on viewport width: `0.65` on mobile (`max-width: CONFIG.MOBILE_BREAKPOINT_PX`), `1.0` otherwise. Built on top of `useMatchMedia`. Consumed by `AmbientEffects` to compound with the user's `effectSize` tier

## Tests

Tests in `__tests__/`: `useNotifications.test.ts`, `useModuleRequest.test.ts`. `useMatchMedia` and `useViewportSizeMultiplier` are exercised via integration in `AmbientEffects.test.tsx` (mobile/desktop multiplier branches, reduced-motion).

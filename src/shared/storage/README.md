# storage/

Backend-agnostic storage layer using the adapter pattern.

## Files

- **adapter.ts** — `StorageAdapter` interface (`getAll`, `getById`, `save`, `remove`, `onSnapshot`). `onSnapshot` accepts an optional `onError` callback for surfacing listener failures
- **firebase-adapter.ts** — Firestore-backed `StorageAdapter` implementation; verbose logging gated behind `isVerbose()` from `utils/verbose`
- **localStorage-adapter.ts** — localStorage-backed `StorageAdapter` for dev/offline mode; verbose logging gated behind `isVerbose()`
- **create-adapter.ts** — Factory (`createAdapter(basePath)`) that returns Firebase or localStorage adapter based on `isFirebaseConfigured`

## Tests

Tests in `__tests__/`: `adapter.test.ts`.

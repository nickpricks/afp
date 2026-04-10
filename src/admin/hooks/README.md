# admin/hooks

Data hooks for admin functionality. Real-time Firestore listeners for invite and user management.

## Files

- **useAdmin.ts** — Subscribes to the invites collection, returns all `InviteRecord` entries in real-time. Falls back to localStorage in dev mode
- **useAdminActions.ts** — Provides `updateUserModules` and `updateUserRole` callbacks for Firestore profile writes. Returns `Result<T>`
- **useAllUsers.ts** — Lists all user profiles via `StorageAdapter.onSnapshot`. Exports `UserEntry` type (UserProfile + uid)

## Tests

- `__tests__/useAllUsers.test.ts` — Unit tests for user listing hook

## Conventions

- Hooks return `Result<T>` for async operations
- Firestore listeners use `StorageAdapter.onSnapshot` with `onError` callbacks

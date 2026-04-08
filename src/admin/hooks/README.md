# admin/hooks

Data hooks for admin functionality. Real-time Firestore listeners for invite and user management.

## Key Files

- `useAdmin.ts` -- Listens to the invites collection, provides invite CRUD operations
- `useAllUsers.ts` -- Fetches all user profiles for admin user listing
- `__tests__/` -- Unit tests for admin hooks

## Conventions

- Hooks return `Result<T>` for async operations
- Firestore listeners use `StorageAdapter.onSnapshot` with `onError` callbacks

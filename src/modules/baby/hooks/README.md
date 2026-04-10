# baby/hooks

Data hooks for the Baby module. Generic subcollection pattern for nested baby data.

## Files

- **useChildren.ts** — Listens to `children/{childId}` collection, provides child CRUD
- **useBabyData.ts** — Composes `useBabyCollection` for all 4 subcollections. Exposes `updateFeed`, `updateSleep`, `updateGrowth`, `updateDiaper`. Tracks independent `ready` state per subcollection
- **useBabyCollection.ts** — Generic `useBabyCollection<T>` hook for any subcollection. Returns `{ items, log, update, remove, ready, syncStatus }`

## Conventions

- All hooks accept an optional `targetUid` parameter for admin/viewer data scoping
- `useBabyCollection<T>` is the canonical pattern for subcollection hooks — new modules should follow this instead of duplicating listener boilerplate
- Sync status only shows "Synced" when all 4 subcollection listeners have reported ready
- Firestore paths: `/users/{uid}/children/{childId}/feeds/{id}` (nested, not flat)

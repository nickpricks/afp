# baby/hooks

Data hooks for the Baby module. Generic subcollection pattern for nested baby data.

## Key Files

- `useChildren.ts` -- Listens to `children/{childId}` collection, provides child CRUD
- `useBabyData.ts` -- Composes `useBabyCollection` for all 4 subcollections (feeds, sleep, growth, diapers). Tracks independent `ready` state per subcollection
- `useBabyCollection.ts` -- Generic reusable hook `useBabyCollection<T>` for any baby subcollection listener + state + save + remove

## Conventions

- All hooks accept an optional `targetUid` parameter for admin viewing other users' data
- `useBabyCollection<T>` is the canonical pattern for subcollection hooks -- new modules should follow this instead of duplicating listener boilerplate
- Sync status only shows "Synced" when all 4 subcollection listeners have reported ready
- Firestore paths: `/users/{uid}/children/{childId}/feeds/{id}` (nested, not flat)

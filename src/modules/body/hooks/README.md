# body/hooks

Data hooks for the Body module. Real-time listeners for body config and activity data.

## Key Files

- `useBodyConfig.ts` -- Listens to `body_config/main`, provides config read/write. Returns config state that gates `BodyConfigForm` vs `BodyPage`
- `useBodyData.ts` -- Listens to daily body documents and `body_activities` collection. Provides `logActivity` (accepts optional date param for backfill), `updateActivity`, `deleteActivity`, `deleteRecord`, and floor tap handler; stale closure fixed via `recordsRef`

## Conventions

- Both hooks accept an optional `targetUid` parameter for admin viewing other users' data
- All async operations return `Result<T>`, never void
- Floors stored as daily aggregates on `body/{dateKey}`, activities stored individually in `body_activities/{id}`

# baby/hooks

Data hooks for the Baby module. Generic subcollection pattern for nested baby data.

## Files

- **useChildren.ts** — Listens to `children/{childId}` collection, provides child CRUD (add, update). Sets `SyncStatus.Error` on listener failure
- **useBabyData.ts** — Composes `useBabyCollection` for the legacy 5 subcollections (feeds, sleep, growth, diapers, elimination). Exposes `updateFeed`, `updateSleep`, `updateGrowth`, `updateDiaper`, `logElimination`, `updateElimination`, `removeElimination`. New modules (meals/needs/milestones/presents) use `useBabyCollection<T>` directly instead of going through this composer
- **useBabyCollection.ts** — Generic `useBabyCollection<T>` hook for any subcollection. Returns `{ items, log, update, remove, ready }` — `log`/`update`/`remove` all return `Promise<boolean>` so callers gate state cleanup on success (Decision A1). `update` accepts an optional `{ silent: true }` to suppress the generic success toast (caller toasts a more specific message). Listener `onError` sets `SyncStatus.Error`. ReadOnly (Viewer) callers toast `CommonMsg.ReadOnlyMode` instead of returning `false` silently
- **useJournalData.ts** — Composes 7 subcollection listeners for D/W/M retrospective aggregation. Counting moments computed on-read by diffing cumulative totals before/after the period (no persisted counters)
- **useSnooze.ts** — Per-suggestion snooze state (e.g. 30-day dismissals from `BabySuggestionsToast`)
- **useSuggestions.ts** — Age-based feature suggestions driven by `lifeStageFor(child.dob)`

## Conventions

- All hooks accept an optional `targetUid` parameter for admin/viewer data scoping (read-only when `targetUid !== firebaseUser.uid`)
- `useBabyCollection<T>` is the canonical pattern for new subcollection hooks — don't duplicate listener boilerplate
- Listener `onError` callbacks always set `SyncStatus.Error` so the sync indicator reflects baby/notifications/admin failures consistently with body/expenses
- Firestore paths: `/users/{uid}/children/{childId}/{subcollection}/{id}` (nested, not flat)
- Hook return contract: data hooks return `Promise<boolean>`; pure utilities return `Result<T>`

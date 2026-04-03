# body/

Floor tracking module (Phase 1). Extensible data model for future steps, running, and exercise tracking.

## Files

- **types.ts** -- `BodyRecord` type with `id: string`, `floors`, and future fields (`steps`, `running`, `exercise`) typed `number | null`
- **scoring.ts** -- `computeBodyScore(up, down)` scoring logic (up counts 1 point, down counts 0.5)
- **hooks/useBodyData.ts** -- Real-time sync via `createAdapter`, tap handler for floor logging, uses `DbSubcollection.Body` and `SyncStatus` enum
- **components/BodyTracker.tsx** -- Main UI with score display and up/down floor tap buttons
- **__tests__/scoring.test.ts** -- Unit tests for `computeBodyScore`

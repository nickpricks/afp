# body/

Body/fitness tracking module. Floors (daily aggregate) + walk/run activities (individual entries with distance).

## Files

- **types.ts** — `BodyRecord` (daily summary: floors, walkMeters, runMeters, total), `ActivityEntry` (individual walk/run), `ActivityType` enum
- **constants.ts** — `BODY_DEFAULTS` (floor height, stride lengths), `SCORING_WEIGHTS` (points per floor/100m), `ACTIVITY_LABELS`
- **scoring.ts** — `computeBodyScore(record)` composite scoring (floors + walk + run), `computeSteps(distance, stride)` approximation
- **hooks/useBodyData.ts** — Real-time sync for `body` (daily records) + `body_activities` (individual entries), floor tap handler, `logActivity` for walk/run
- **components/BodyTracker.tsx** — Main UI: score display, floor tap buttons, activity form, today's activity log
- **components/AddActivity.tsx** — Bubble selector (Walk/Run), distance input with m/km toggle, save button
- **components/ActivityLog.tsx** — Today's logged activities in reverse chronological order
- **__tests__/scoring.test.ts** — Unit tests for `computeBodyScore` and `computeSteps`
- **__tests__/types.test.ts** — Tests for `ActivityType` enum and `ALL_ACTIVITY_TYPES`
- **__tests__/constants.test.ts** — Tests for body defaults and scoring weights

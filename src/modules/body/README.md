# body/

Body/fitness tracking module. Floors (daily aggregate) + walk/run/cycle activities (individual entries with distance). SVG score ring with daily goal and weekly bar chart.

## Files

- **types.ts** — `BodyRecord` (daily summary: floors, distances, total), `BodyConfig`, `DEFAULT_BODY_CONFIG`
- **constants.ts** — `BODY_DEFAULTS` (floor height, stride lengths), `SCORING_WEIGHTS` (floors_up x1, floors_down x0.5, walk_km x10, run_km x20, cycle_km x15), `ACTIVITY_LABELS`
- **scoring.ts** — `computeBodyScore(record)` composite scoring, `computeSteps(distance, stride)` approximation

## Directories

- `components/` — 10 UI components (BodyTracker, BodyPage, BodyStats, BodyConfigForm, FloorsTab, WalkingTab, RunningTab, CyclingTab, ActivityLog, AddActivity)
- `hooks/` — Data hooks (useBodyConfig, useBodyData)

## Tests

- `__tests__/scoring.test.ts` — `computeBodyScore` and `computeSteps`
- `__tests__/types.test.ts` — `ActivityType` enum and `ALL_ACTIVITY_TYPES`
- `__tests__/constants.test.ts` — Body defaults and scoring weights
- `__tests__/config.test.ts` — Body config validation
- `__tests__/BodyPage.test.tsx` — Tab rendering and navigation
- `__tests__/CyclingTab.test.tsx` — Cycling tab component
- `__tests__/ActivityLog.test.tsx` — Activity list rendering
- `__tests__/useBodyConfig.test.ts` — Config hook state management

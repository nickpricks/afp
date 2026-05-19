# body/

Body/fitness tracking module. Floors (daily aggregate) + walk/run/cycle activities (individual entries with distance). SVG score ring with daily goal and weekly bar chart. Live-activity tracking POC (Active Session) lives alongside the manual-log surface.

## Files

- **types.ts** — `BodyRecord` (daily summary: floors, distances, total), `BodyConfig`, `DEFAULT_BODY_CONFIG`
- **constants.ts** — `BODY_DEFAULTS` (floor height, stride lengths), `SCORING_WEIGHTS` (floors_up x1, floors_down x0.5, walk_km x10, run_km x20, cycle_km x15), `ACTIVITY_LABELS`
- **scoring.ts** — `computeBodyScore(record)` composite scoring, `computeSteps(distance, stride)` approximation

## Directories

- `components/` — Body UI: `BodyTracker`, `BodyPage`, `BodyStats`, `BodyConfigForm`, four tab components (FloorsTab / WalkingTab / RunningTab / CyclingTab), `ActivityLog`, `AddActivity`, `BodySummaryCard` (dashboard surface), `ActiveSessionOverlay` (live tracking overlay)
- `context/` — `LiveActivityContext` provider that owns live-session state (`prepare`, `start`, `pause`, `stop`, `sessionState`). Read via `useLiveActivityContext`
- `hooks/` — `useBodyConfig`, `useBodyData` (logActivity with optional date, deleteActivity, deleteRecord — stale-closure fix via `recordsRef`), `useLiveActivity` (low-level live-session hook that the context wraps)

## Tests

`__tests__/` contains tests for scoring, types/enums, config validation, defaults, BodyPage tab navigation, CyclingTab, ActivityLog rendering, and `useBodyConfig` state management. Active-session + live tracking covered by integration tests in the parent test dir.

# body/components

UI components for the Body module (floors, walking, running, cycling tracking).

## Key Files

- `BodyTracker.tsx` -- Top-level entry point, config gate (shows `BodyConfigForm` or `BodyPage`)
- `BodyPage.tsx` -- Tabbed container for Stats, Floors, Walking, Running, Cycling tabs
- `BodyConfigForm.tsx` -- Initial config and reconfiguration form (gear button in tab bar)
- `BodyStats.tsx` -- Dashboard with scores, streaks, and weekly summaries
- `FloorsTab.tsx` -- Daily floor tracking with "Show more" (7 to 30 entries)
- `WalkingTab.tsx` -- Walk activity logging, shows date instead of type label
- `RunningTab.tsx` -- Run activity logging
- `CyclingTab.tsx` -- Cycle activity logging
- `ActivityLog.tsx` -- Shared recent activity list used by Walking/Running/Cycling tabs
- `AddActivity.tsx` -- Shared form for adding walk/run/cycle activities

## Conventions

- Config gate pattern: `useBodyConfig` determines if user has configured the module
- Activity tabs share `ActivityLog` and `AddActivity` components, differentiated by `ActivityType` enum
- Scoring functions use `compute*` prefix (e.g., `computeBodyScore`)

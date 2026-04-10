# body/components

UI components for the Body module (floors, walking, running, cycling tracking).

## Key Files

- `BodyTracker.tsx` -- Top-level entry point, config gate (shows `BodyConfigForm` or `BodyPage`)
- `BodyPage.tsx` -- Tabbed container for Stats, Floors, Walking, Running, Cycling tabs
- `BodyConfigForm.tsx` -- Initial config and reconfiguration form (gear button in tab bar) with per-activity slider builder and daily goal presets
- `BodyStats.tsx` -- SVG score ring with daily goal, weekly day bar chart, dynamic stat cards (tappable), quick actions, reset today
- `FloorsTab.tsx` -- Daily floor tracking with "Show more" (7 to 30 entries)
- `WalkingTab.tsx` -- Walk activity logging, shows date instead of type label
- `RunningTab.tsx` -- Run activity logging
- `CyclingTab.tsx` -- Cycle activity logging
- `ActivityLog.tsx` -- Shared recent activity list used by Walking/Running/Cycling tabs
- `AddActivity.tsx` -- Shared form for adding walk/run/cycle activities

## Conventions

- Config gate pattern: `useBodyConfig` determines if user has configured the module
- Activity tabs share `ActivityLog` and `AddActivity` components, differentiated by `ActivityType` enum
- Tap-to-edit: FloorsTab redirects +/- to selected date, ActivityLog populates AddActivity form
- Scoring functions use `compute*` prefix (e.g., `computeBodyScore`)

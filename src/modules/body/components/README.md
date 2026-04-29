# body/components

UI components for the Body module (floors, walking, running, cycling tracking).

## Key Files

- `BodyTracker.tsx` -- Top-level entry point, config gate (shows `BodyConfigForm` or `BodyPage`)
- `BodyPage.tsx` -- Tabbed container for Stats, Floors, Walking, Running, Cycling tabs
- `BodyConfigForm.tsx` -- Initial config and reconfiguration form (gear button in tab bar) with per-activity slider builder and daily goal presets
- `BodyStats.tsx` -- Compact SVG score ring, icon stat cards, pill quick actions
- `FloorsTab.tsx` -- Daily floor tracking with delete, reset today, date picker modal, sortNewestFirst. Phase 2h refactor: rows grouped by `<DateGroupHeader>` (sticky day-of-week + date) and each row renders `<FloorMagnitudeBar>` -- an inline split bar showing the up/down floor ratio scaled against the daily goal. List paging owned by `useListControls()` + `<ListControls>` strip + `<ListShowMoreFooter>`
- `WalkingTab.tsx` -- Walk activity logging with onDelete prop and date picker modal
- `RunningTab.tsx` -- Run activity logging with onDelete prop and date picker modal
- `CyclingTab.tsx` -- Cycle activity logging with onDelete prop and date picker modal
- `ActivityLog.tsx` -- Shared activity list used by Walking/Running/Cycling tabs. Inline delete (x button), undo toast, SwipeToDelete wrapper. Phase 2h refactor: entries grouped by date with `<DateGroupHeader>`, each row prefixed by `<RowTime>` (HH:mm) and laid out on a `[56px_1fr_auto_auto]` grid for `[time, label, value, ×]`. Pagination via `useListControls`
- `AddActivity.tsx` -- Shared form for adding walk/run/cycle activities; supports optional backfill date param

## Conventions

- Config gate pattern: `useBodyConfig` determines if user has configured the module
- Activity tabs share `ActivityLog` and `AddActivity` components, differentiated by `ActivityType` enum
- Tap-to-edit: FloorsTab redirects +/- to selected date, ActivityLog populates AddActivity form
- Scoring functions use `compute*` prefix (e.g., `computeBodyScore`)
- Delete follows undo-toast pattern: 10s window via `CONFIG.UNDO_DURATION_MS`
- All list views (FloorsTab, ActivityLog) use the shared list infrastructure: `useListControls` hook + `<ListControls>` strip (time-range filter, page size, page jump) + `<ListShowMoreFooter>` (show-all escape hatch) + `<DateGroupHeader>` for sticky per-day grouping

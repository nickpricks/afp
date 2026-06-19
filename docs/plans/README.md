# docs/plans

Implementation plans for AFP. One file per phase or feature.

## Key Files

- `2026-04-01-aprilfoolsjoke-phase1.md` -- Phase 1 scaffold and initial implementation plan
- `2026-04-06-phase2-master.md` -- Phase 2 master plan (overview of all sub-phases)
- `2026-04-06-phase2-00-foundation.md` -- Phase 2 shared foundation (enums, types, Firestore rules)
- `2026-04-06-phase2-2a-body.md` -- Body module implementation plan
- `2026-04-06-phase2-2b-baby.md` -- Baby module implementation plan
- `2026-04-06-phase2-2c-budget.md` -- Budget module implementation plan
- `2026-04-06-phase2-2d-profile.md` -- Profile page implementation plan
- `2026-04-06-phase2-2e-admin-viewer.md` -- Admin and viewer role implementation plan
- `2026-04-06-phase2-2f-themes.md` -- Theme system implementation plan
- `2026-04-07-universal-dashboard.md` -- Universal Dashboard implementation plan
- `2026-04-07-admin-pages.md` -- Admin pages implementation plan
- `2026-04-07-viewer-invite-flow.md` -- Viewer invite flow implementation plan
- `2026-04-10-loading-screen.md` -- Loading screen implementation plan (stick-figure SVG animations)
- `2026-04-10-themes.md` -- Theme system overhaul plan (10 themes, fonts, ambient effects)
- `2026-04-13-phase3-baby-foundation-plan.md` -- Phase 3 Baby module foundation (shared types, age-aware infrastructure)
- `2026-04-13-phase3-baby-milestones-plan.md` -- Phase 3 Baby milestones feature plan
- `2026-04-13-phase3-baby-meals-plan.md` -- Phase 3 Baby meals tracking plan (replaces infant feeds)
- `2026-04-13-phase3-baby-needs-plan.md` -- Phase 3 Baby needs tracker plan (potty training, vaccinations)
- `2026-04-13-phase3-baby-life-journal-plan.md` -- Phase 3 Baby life journal plan
- `2026-04-13-phase3-baby-suggestions-plan.md` -- Phase 3 Baby suggestions engine plan
- `2026-04-13-phase3-baby-elimination-plan.md` -- Phase 3 Baby elimination/removal plan for infant-only features
- `2026-04-14-notifications-module-requests-plan.md` -- Notifications and module requests implementation plan
- `2026-04-15-phase2g-e2e-bench.md` -- Phase 2g E2E coverage + DevBench split plan (generators in `bench-generators.ts`, ×1/×100/×1k bulk modes, day-spread)
- `2026-04-15-phase3-body-yoga-plan.md` -- Phase 3 Body module Yoga tab (Plan 10) — duration-based activity with asana selector
- `2026-04-25-enhanced-themes-plan.md` -- Enhanced themes plan (effect intensity + size tier pickers, mobile viewport multiplier, font system polish)
- `2026-04-29-phase2h-list-controls.md` -- Phase 2h universal list infrastructure plan (`useListControls` hook, `ListControls` strip, `ListShowMoreFooter`, sticky `DateGroupHeader`, `RowTime`, `FloorMagnitudeBar` — applied across all 11 list surfaces)
- `2026-04-30-phase2i-themes-2.0-plan.md` -- Phase 2i themes 2.0 plan (theme picker UX, expandable customize panel, intensity + size tier pickers)
- `2026-05-04-fuel-travel-maintenance.md` -- Phase 2j: Auto tab implementation plan (10 TDD tasks — types, validation, hook, fuel-math, MetaSubForm, ServiceDueBanner, AutoTab, AddExpense wiring, ExpenseListPage, CHANGELOG)
- `2026-05-13-kids-presents-plan.md` -- Kids Presents v1 plan (superseded by v2; kept for design-history)
- `2026-05-14-kids-presents.md` -- Kids Presents v2 plan (gifts + finances subcollections per child, Spent→Expense bridge, Kids tab on Budget module)
- `2026-05-15-flaw-in-the-plan-execution.md` -- Phase 2k cleanup execution plan (`ExpenseMetaType` enum, `assertNever` exhaustiveness at 8 meta switch sites, `VEHICLE_SUBCAT`/`TRAVEL_SUBCAT` typed constants, readOnly toasts in expense hooks)

## Conventions

- Filenames prefixed with date of creation (`YYYY-MM-DD-`)
- Phase 2 sub-plans reference the master plan for sequencing and dependencies

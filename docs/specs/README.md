# docs/specs

Design specifications and analysis documents for AFP.

## Key Files

- `2026-04-01-aprilfoolsjoke-design.md` -- Original Phase 1 design spec (app concept, module system, auth, themes)
- `2026-04-06-phase2-design.md` -- Phase 2 design spec (body, baby, budget, admin, themes)
- `2026-04-07-universal-dashboard-design.md` -- Universal Dashboard design spec (stats variants per theme)
- `2026-04-07-theme-system-analysis.md` -- Theme system analysis and improvement proposals
- `2026-04-10-loading-screen-design.md` -- Loading screen design spec (three animated stick-figure SVG scenes)
- `2026-04-10-themes-design.md` -- Theme system overhaul design spec (10 themes, font pairings, ambient effects)
- `2026-04-13-phase3-vision-design.md` -- Phase 3 vision design spec (Baby→Kid, budget investments, body gamification)
- `2026-04-13-phase3-baby-to-kid-design.md` -- Baby-to-kid evolution design spec (milestones, meals, potty training, vaccinations)
- `2026-04-14-notifications-module-requests-design.md` -- Notifications and module requests design spec
- `2026-04-15-phase2g-e2e-bench-design.md` -- Phase 2g E2E coverage + DevBench design (generator split, bulk modes, day-spread)
- `2026-04-25-enhanced-themes-design.md` -- Enhanced themes design spec (effect tiers, viewport scale, font system)
- `2026-04-30-phase2i-themes-2.0-design.md` -- Phase 2i themes 2.0 design (theme picker UX, customize panel, intensity + size tier pickers)
- `2026-05-04-fuel-travel-maintenance-design.md` -- Fuel/Travel/Maintenance Auto tab design spec (discriminated `meta` union, two-way entry, service-due banner)
- `2026-05-13-kids-presents-design.md` -- Kids Presents v1 design (superseded by v2; kept for design-history)
- `2026-05-14-kids-presents-design-v2.md` -- Kids Presents v2 design (gifts + finances subcollections, Spent→Expense bridge, `KidsFinanceTab` read-only aggregate)
- `2026-05-15-flaw-in-the-plan-cleanup-design.md` -- Phase 2k cleanup design (`ExpenseMetaType` + `assertNever` exhaustiveness, `VEHICLE_SUBCAT`/`TRAVEL_SUBCAT`, readOnly toast paths)
- `2026-07-02-family-umbrella-design.md` -- Family Umbrella design spec (Brainstorm G — `families/{familyId}` + `familyId` link, family expense view, baby drawer IA + submodule archive + Needs→Presents merge, session-based sensor auto-tracking)

## Conventions

- Specs are referenced by implementation plans in `docs/plans/`
- Filenames prefixed with date of creation (`YYYY-MM-DD-`)

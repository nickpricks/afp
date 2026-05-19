# baby/

Multi-child tracking that grows from infant → toddler → kid. Per-child nested subcollections under `/users/{uid}/children/{childId}/`:
- `feeds/{id}` — feeding log
- `sleep/{id}` — sleep log
- `growth/{id}` — measurements
- `elimination/{id}` — diapers + potty (mode-discriminated)
- `meals/{id}` — meals (toddler+)
- `needs/{id}` — wishlist/inventory tracker
- `milestones/{id}` — developmental firsts
- `gifts/{id}` — physical present objects (Presents module)
- `finances/{id}` — present money entries (Presents module)

Plus child profiles at `children/{childId}` and journal/aggregate data computed on-read (no separate journal storage).

## Files

- **types.ts** — Entry types (`FeedEntry`, `SleepEntry`, `GrowthEntry`, `EliminationEntry`, `MealEntry`, `NeedEntry`, `MilestoneEntry`, `GiftEntry`, `FinanceEntry`), `Child`, `ChildConfig` (9 module toggles), enums (feed/sleep/diaper/portion/status/category types), `LifeStage`
- **constants.ts** — Typed `as const` arrays for feed/sleep/quality/diaper/potty/portion/status/category options
- **validation.ts** — `validate*Entry` per subcollection — input validation following expense module pattern
- **milestone-templates.ts** — 10 quick-add milestone templates with category preset
- **presents-math.ts** — Pure derivations for present finance aggregation (per-child totals, Total Kid Wealth)
- **utils.ts** — `computeAge` + `lifeStageFor` helpers
- **journal/** — D/W/M aggregation primitives (constants, types, range, aggregate)
- **utils/logToSiblings.ts** — Fan-out write helper returning `{ ok, failed }` counts

## Directories

- `components/` — UI components: `BabyLanding`, `ChildDetail`, `AddChild`, 8 log components (Feed/Sleep/Growth/Elimination/Meals/Needs/Milestones/Presents), `LifeJournalView` + journal helpers, suggestion banners
- `hooks/` — Data hooks: `useChildren`, `useBabyData` (legacy 5-listener composer), `useBabyCollection<T>` (generic per-subcollection), `useJournalData`, `useSnooze`, `useSuggestions`
- `journal/` — Pure journal aggregation primitives
- `utils/` — Cross-subcollection helpers

## Tests

`__tests__/` contains tests for validation, types, utils, components, log CRUD actions, presents math, and journal aggregation. Per-hook + per-journal tests live alongside their sources under `hooks/__tests__/` and `journal/__tests__/`.

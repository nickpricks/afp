# baby/

Baby tracking across 4 nested subcollections: `/users/{uid}/children/{childId}/feeds/{id}`, `.../sleep/{id}`, `.../growth/{id}`, `.../diapers/{id}`.

## Files

- **types.ts** — `FeedEntry`, `SleepEntry`, `GrowthEntry`, `DiaperEntry`, `Child`, `ChildConfig` type definitions, feed/sleep/diaper type enums
- **constants.ts** — Typed `as const` arrays for feed types, sleep types, sleep qualities, diaper types
- **validation.ts** — `validateFeedEntry`, `validateSleepEntry`, `validateGrowthEntry`, `validateDiaperEntry` — input validation following expense module pattern
- **utils.ts** — `computeAge` helper for child age display

## Directories

- `components/` — UI components (BabyLanding, ChildDetail, AddChild, 4 log components)
- `hooks/` — Data hooks (useChildren, useBabyData, useBabyCollection)

## Tests

- `__tests__/validation.test.ts` — Validation function tests
- `__tests__/types.test.ts` — Type and enum tests
- `__tests__/utils.test.ts` — Age computation tests
- `__tests__/components.test.tsx` — Component rendering tests
- `__tests__/BabyLogActions.test.tsx` — Log CRUD action tests

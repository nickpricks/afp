# baby/

Baby tracking across 4 flat subcollections: `baby_feeds`, `baby_sleep`, `baby_growth`, `baby_diapers`.

## Files

- **types.ts** — `FeedEntry`, `SleepEntry`, `GrowthEntry`, `DiaperEntry` type definitions
- **constants.ts** — Typed `as const` arrays for feed types, sleep types, sleep qualities, diaper types
- **validation.ts** — `validateFeedEntry`, `validateSleepEntry`, `validateGrowthEntry`, `validateDiaperEntry` — input validation following expense module pattern
- **hooks/useBabyCollection.ts** — Generic `useBabyCollection<T>` hook — handles listener, state, `ready` tracking, and save for a single subcollection
- **hooks/useBabyData.ts** — Composes 4 `useBabyCollection` hooks, tracks overall sync status (only `Synced` when all 4 listeners report)
- **components/FeedLog.tsx** — Feed tracking form with type-dependent quantity/duration fields
- **components/SleepLog.tsx** — Sleep tracking with type/quality selection
- **components/GrowthLog.tsx** — Growth measurement form (weight, height, head circumference)
- **components/DiaperLog.tsx** — Diaper tracking with quick-log buttons
- **__tests__/validation.test.ts** — Unit tests for all 4 validation functions

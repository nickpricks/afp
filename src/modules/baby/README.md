# baby/

Baby tracking across 4 subcollections: feeds, sleep, growth, and diapers.

## Files

- **types.ts** -- `FeedEntry`, `SleepEntry`, `GrowthEntry`, and `DiaperEntry` type definitions
- **constants.ts** -- Typed `as const` arrays for feed types, sleep types, sleep qualities, and diaper types
- **hooks/useBabyData.ts** -- `useBabyData` hook managing all 4 subcollections via `createAdapter`, uses `DbSubcollection` enum members (`Feeds`, `Sleep`, `Growth`, `Diapers`) and `SyncStatus` enum
- **components/FeedLog.tsx** -- Feed tracking form with type-dependent quantity/duration fields and recent entries list
- **components/SleepLog.tsx** -- Sleep tracking form with type/quality selection and recent entries list
- **components/GrowthLog.tsx** -- Growth measurement form for weight, height, and head circumference with recent entries list
- **components/DiaperLog.tsx** -- Diaper tracking form with quick-log buttons and recent entries list

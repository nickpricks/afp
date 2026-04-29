# utils/

Pure utility functions with no React or Firebase dependencies.

## Files

- **date.ts** — `todayStr()` returns YYYY-MM-DD, `nowTime()` returns HH:MM, `computeGreeting()` returns time-of-day greeting, `formatDayDate()` formats a date string as "Wednesday, April 7"
- **error.ts** — `toErrorMessage()` extracts a string from an unknown error value
- **filter.ts** — `filterByDateRange<T>(items, range, today, getDate)` generic filter primitive over any `T` with a date extractor. Range semantics are rolling: Week = last 7 days, Month = last 30 days, All = no filter. Used everywhere — Body, Baby, Budget, Admin lists
- **format.ts** — `formatDistance(meters)` formats meters as "1.2 km" or "500 m", `formatDistanceOrDash(meters)` returns "--" for null values. Uses `CONFIG.METERS_PER_KM`
- **paginate.ts** — `paginate<T>(items, page, pageSize)` and `totalPages(totalItems, pageSize)`. Both pure functions. `totalPages` returns minimum 1 (never 0 for empty lists)
- **profile.ts** — `createDefaultProfile()` builds a UserProfile with sensible defaults
- **regex.ts** — `DATE_RE` and `INVITE_CODE_RE` regex patterns
- **relative-date.ts** — `relativeDateLabel(date, today)` returning `{ relative: 'Today' | 'Yesterday' | null, structural: 'Wed 22 Apr', week: 'Wk 17' | null }`. Used by `<DateGroupHeader>` for two-tier date labelling
- **sort.ts** — `sortNewestFirst(items, getKey)` sorts by a string field in descending lexicographic order. Replaces inline `.sort()` comparators
- **validation.ts** — `isValidNumber()` checks for finite positive numbers
- **verbose.ts** — `isVerbose()` / `setVerbose()` toggle for debug-level adapter logging; persisted in localStorage

## Tests

Tests in `__tests__/`: `utils.test.ts`.

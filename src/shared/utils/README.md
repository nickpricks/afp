# utils/

Pure utility functions with no React or Firebase dependencies.

## Files

- **date.ts** — `todayStr()` returns YYYY-MM-DD, `nowTime()` returns HH:MM, `getGreeting()` returns time-of-day greeting, `formatDayDate()` formats a date string as "Wednesday, April 7"
- **error.ts** — `toErrorMessage()` extracts a string from an unknown error value
- **format.ts** — `formatDistance(meters)` formats meters as "1.2 km" or "500 m", `formatDistanceOrDash(meters)` returns "--" for null values. Uses `CONFIG.METERS_PER_KM`
- **profile.ts** — `createDefaultProfile()` builds a UserProfile with sensible defaults
- **regex.ts** — `DATE_RE` and `INVITE_CODE_RE` regex patterns
- **sort.ts** — `sortNewestFirst(items, getKey)` sorts by a string field in descending lexicographic order. Replaces inline `.sort()` comparators
- **validation.ts** — `isValidNumber()` checks for finite positive numbers
- **verbose.ts** — `isVerbose()` / `setVerbose()` toggle for debug-level adapter logging; persisted in localStorage

## Tests

Tests in `__tests__/`: `utils.test.ts`.

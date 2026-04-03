# Audit Verification

Maps production-readiness audit findings from the three source apps (BabyTracker, Finularity, Floor-Tracker) to their status in AFP.

## Resolved by Architecture

These findings are eliminated by AFP's design choices. No action needed.

### BabyTracker

| Finding | Why Resolved |
|---|---|
| No TLS | Firebase serves over HTTPS by default |
| Binds to 0.0.0.0 | No Go API server in AFP |
| API error leaks internal paths | No Go API server in AFP |
| Desktop silent errors (fmt.Printf) | No desktop app in AFP |
| PII plaintext logging | No server-side logging |
| JSON file storage race conditions | Using Firestore |
| 1MB body limit middleware | No custom API |

### Finularity

| Finding | Why Resolved |
|---|---|
| BrowserRouter 404 on GitHub Pages | AFP uses HashRouter |
| saveToStorage returns void (silent failures) | All operations return Result<T> |
| Cascading silent failures | Toast notifications + Result types |
| process.env.KEY dangerous injection | Removed entirely |
| No ErrorBoundary | AFP has ErrorBoundary |
| Storage key duplication | Single source via StorageAdapter |
| No component tests | Test infrastructure ready (vitest + testing-library) |

### Floor-Tracker

| Finding | Why Resolved |
|---|---|
| UUID-based Firestore paths | AFP uses request.auth.uid |
| No lint in CI | AFP CI runs lint step |
| Firestore rules don't enforce ownership | AFP rules check uid == userId |

## Addressed in Implementation

These were explicitly fixed during AFP development.

| Finding | How Addressed |
|---|---|
| No silent failures | Result<T> everywhere, toast notifications |
| No structured error handling | Toasts + ErrorBoundary |
| Missing component test infrastructure | vitest + jsdom + testing-library configured |
| Inconsistent error message formatting | toErrorMessage() utility |
| Default profile constructed in multiple places | createDefaultProfile() factory |

## Deferred to Phase 2+

Known and tracked but not in Phase 1 scope.

| Finding | Plan |
|---|---|
| Firebase JS bundle size (~694KB) | Code splitting in Phase 2 |
| Memory management for long-term data | IndexedDB pagination |
| Soft-deleted expenses never purged | Purge job in Phase 2 |

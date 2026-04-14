# auth/

Firebase authentication, Google Sign-In, TheAdminNick admin model, invite system, and username management.

## Files

- **auth-context.tsx** — AuthProvider and AuthContext; wraps Firebase Auth state and user profile with dev-mode bypass; exposes `adminUid` for viewer-scoped writes
- **useAuth.ts** — `useAuth` hook consuming AuthContext (separate file for fast-refresh)
- **firebase-config.ts** — Firebase app/auth/Firestore initialization with dev vs prod config
- **google-auth.ts** — `signInWithGoogle()` -- links anonymous account to Google via popup, handles credential-already-in-use fallback, returns `'cancelled'` for popup dismiss
- **the-admin-nick.ts** — Admin check (`isCurrentUserAdmin`, `isAppClaimed`), initialization (`initializeAdmin`), and user module updates
- **invite.ts** — Invite code generation, validation, creation, and atomic redemption via `runTransaction`
- **InviteRedeem.tsx** — Invite redemption page -- requires Google sign-in before redeeming, includes retry on failure
- **username.ts** — Username validation (`isValidUsername`, `USERNAME_RE`), availability check (`isUsernameAvailable`), atomic claim (`claimUsername`), and release (`releaseUsername`). Uses Firestore transactions with localStorage fallback in dev mode

## Tests

Tests in `__tests__/`: `invite.test.ts`, `username.test.ts`.

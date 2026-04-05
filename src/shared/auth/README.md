# auth/

Firebase authentication, Google Sign-In, TheAdminNick admin model, and invite system.

## Files

- **auth-context.tsx** — AuthProvider and AuthContext; wraps Firebase Auth state and user profile with dev-mode bypass
- **useAuth.ts** — useAuth hook consuming AuthContext (separate file for fast-refresh)
- **firebase-config.ts** — Firebase app/auth/Firestore initialization with dev vs prod config
- **google-auth.ts** — `signInWithGoogle()` — links anonymous account to Google via popup, handles credential-already-in-use fallback, returns `'cancelled'` for popup dismiss
- **the-admin-nick.ts** — Admin check (`isCurrentUserAdmin`), initialization (`initializeAdmin`), and user module updates
- **invite.ts** — Invite code generation, validation, creation, and atomic redemption
- **InviteRedeem.tsx** — Invite redemption page — requires Google sign-in before redeeming, includes retry on failure

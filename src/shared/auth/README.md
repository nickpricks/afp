# auth/

Firebase authentication, TheAdminNick admin model, and invite system.

## Files

- **auth-context.tsx** — AuthProvider and AuthContext; wraps Firebase Auth state and user profile with dev-mode bypass
- **useAuth.ts** — useAuth hook consuming AuthContext (separate file for fast-refresh)
- **firebase-config.ts** — Firebase app/auth/Firestore initialization with dev vs prod config
- **headminick.ts** — Headminick admin check, initialization, and user module updates
- **invite.ts** — Invite code generation, validation, creation, and atomic redemption
- **InviteRedeem.tsx** — Page component that redeems an invite code from the URL

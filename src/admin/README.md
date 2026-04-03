# admin/

TheAdminNick admin panel for managing invites and viewing their status.

## Files

- **components/AdminPanel.tsx** — Admin dashboard displaying invite list with redeemed/pending status badges
- **components/InviteGenerator.tsx** — Form for creating invite links with per-module toggle and link display
- **hooks/useAdmin.ts** — Real-time Firestore subscription to the invites collection (with onError callback); falls back to localStorage in dev mode

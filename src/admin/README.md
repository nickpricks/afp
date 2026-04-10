# admin/

TheAdminNick admin panel for managing invites and users. Tabbed UI with Invites and Users sections.

## Structure

- **components/AdminPanel.tsx** — Tabbed container (Invites | Users)
- **components/InvitesTab.tsx** — Invite list with copy-link + delete actions
- **components/InviteGenerator.tsx** — Form for creating invite codes (module toggles, User/Viewer role, viewer-of picker)
- **components/UsersTab.tsx** — User list with color-coded module chips, role stat bar, toggle switches, accordion expand
- **hooks/useAdmin.ts** — Real-time Firestore listener on the invites collection; localStorage fallback in dev
- **hooks/useAdminActions.ts** — Firestore profile writes (updateUserModules, updateUserRole) with Result<T> returns
- **hooks/useAllUsers.ts** — Fetches all user profiles via StorageAdapter.onSnapshot for admin user listing

## Conventions

- Only rendered when user has TheAdminNick role
- Routes wrapped by `AdminGate` which redirects unauthorized users to `/`
- Hooks return `Result<T>` for async operations
- Module color convention: Body=indigo, Budget=emerald, Baby=pink

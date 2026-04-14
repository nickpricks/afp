# admin/

TheAdminNick admin panel for managing invites, users, and broadcasts. Tabbed UI with Invites, Users, and Broadcasts sections.

## Structure

- **components/AdminPanel.tsx** — Tabbed container (Invites | Users | Broadcasts)
- **components/InvitesTab.tsx** — Invite list with copy-link + delete actions
- **components/InviteGenerator.tsx** — Form for creating invite codes (module toggles, User/Viewer role, viewer-of picker)
- **components/UsersTab.tsx** — User list with color-coded module chips, role stat bar, toggle switches, accordion expand, "View Dashboard" button, and module request badges
- **components/BroadcastsTab.tsx** — Compose form for sending admin alerts to users
- **hooks/useAdmin.ts** — Real-time Firestore listener on the invites collection; localStorage fallback in dev
- **hooks/useAdminActions.ts** — Firestore profile writes (updateUserModules, updateUserRole) with Result<T> returns
- **hooks/useAllUsers.ts** — Fetches all user profiles via StorageAdapter.onSnapshot for admin user listing
- **hooks/useAdminNotifications.ts** — Send admin alerts, approve module requests, and delete alerts

## Conventions

- Only rendered when user has TheAdminNick role
- Routes wrapped by `AdminGate` which redirects unauthorized users to `/`
- Hooks return `Result<T>` for async operations
- Module color convention: Body=indigo, Budget=emerald, Baby=pink

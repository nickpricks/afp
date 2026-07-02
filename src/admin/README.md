# admin/

TheAdminNick admin panel for managing invites, users, broadcasts, migrations, and families. Tabbed UI.

## Structure

- **components/AdminPanel.tsx** — Tabbed container (Invites | Users | Broadcasts | Migrations | Families)
- **components/InvitesTab.tsx** — Invite list with copy-link + delete actions
- **components/InviteGenerator.tsx** — Form for creating invite codes (module toggles, User/Viewer role, viewer-of picker)
- **components/UsersTab.tsx** — User list with color-coded module chips, role stat bar, toggle switches, accordion expand, "View Dashboard" button, and module request badges
- **components/BroadcastsTab.tsx** — Compose form for sending admin alerts to users
- **components/MigrationsTab.tsx** — One-time data migrations (e.g. diapers→elimination), non-destructive
- **components/FamiliesTab.tsx** — Family Umbrella: create-family form (name + unlinked-user pills), family list with member chips + unlink `×`
- **hooks/useAdmin.ts** — Real-time Firestore listener on the invites collection; localStorage fallback in dev
- **hooks/useAdminActions.ts** — Firestore profile writes (updateUserModules, updateUserRole → `Result<T>`) plus family actions (`createFamily`, `unlinkFamilyMember` → `Promise<boolean>`, own their toasts; unlink writes a `null` member tombstone because the adapter merge-saves)
- **hooks/useFamilies.ts** — Realtime listener on the root `families` collection via `createAdapter(ROOT_PATH)` (admin-only per rules)
- **hooks/useAllUsers.ts** — Fetches all user profiles via StorageAdapter.onSnapshot for admin user listing
- **hooks/useAdminNotifications.ts** — Send admin alerts, approve module requests, and delete alerts

## Conventions

- Only rendered when user has TheAdminNick role
- Routes wrapped by `AdminGate` which redirects unauthorized users to `/`
- Hooks return `Result<T>` for async operations
- Module color convention: Body=indigo, Budget=emerald, Baby=pink

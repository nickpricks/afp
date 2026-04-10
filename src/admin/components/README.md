# admin/components

Admin-only UI components gated behind `AdminGate`.

## Files

- **AdminPanel.tsx** — Tabbed panel with Invites and Users tabs. Entry point for the admin section
- **InvitesTab.tsx** — Invite list with copy-link and delete actions, embeds `InviteGenerator` for creating new invites
- **InviteGenerator.tsx** — Form for creating invite codes with per-module toggles, User/Viewer role switch, and viewer-of user picker
- **UsersTab.tsx** — User list with color-coded module chips (Body=indigo, Budget=emerald, Baby=pink), role stat bar, toggle switches, and accordion expand for inline editing

## Conventions

- Only rendered when user has TheAdminNick role
- Routes wrapped by `AdminGate` which redirects unauthorized users to `/`

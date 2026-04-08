# admin/components

Admin-only UI components gated behind `AdminGate`.

## Key Files

- `AdminPanel.tsx` -- Tabbed panel with Invites and Users management tabs
- `InviteGenerator.tsx` -- Form to create invite codes for new users

## Conventions

- Only rendered when user has TheAdminNick role
- Routes wrapped by `AdminGate` which redirects unauthorized users to `/`

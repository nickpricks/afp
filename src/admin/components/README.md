# admin/components

Admin-only UI components gated behind `AdminGate`.

## Files

- **AdminPanel.tsx** — Tabbed panel with Invites, Users, and Broadcasts tabs. Entry point for the admin section
- **InvitesTab.tsx** — Invite list with copy-link and delete actions, embeds `InviteGenerator` for creating new invites. Phase 2h: uses the shared list infrastructure (`useListControls` + `<ListControls>` strip + `<ListShowMoreFooter>` + `<DateGroupHeader>`). Date-grouping uses `inv.createdAt.slice(0, 10)` as the date extractor (invites carry an ISO `createdAt`, not a YYYY-MM-DD `date` field)
- **InviteGenerator.tsx** — Form for creating invite codes with per-module toggles, User/Viewer role switch, and viewer-of user picker
- **UsersTab.tsx** — User list with color-coded module chips (Body=indigo, Budget=emerald, Baby=pink), role stat bar, toggle switches, accordion expand, "View Dashboard" button, and module request badges
- **BroadcastsTab.tsx** — Compose form for admin to send alert notifications to users. Not refactored in Phase 2h — still has no list of past broadcasts (deferred per source comment); admin alerts list is pending future work, so no list controls here yet

## Tests

- **__tests__/AdminPanel.test.tsx** — Unit tests for the tabbed AdminPanel container
- **__tests__/BroadcastsTab.test.tsx** — Unit tests for the broadcast compose form

## Conventions

- Only rendered when user has TheAdminNick role
- Routes wrapped by `AdminGate` which redirects unauthorized users to `/`

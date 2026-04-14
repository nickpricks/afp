# Session 9 — Verification Checklist

## Can verify now (local dev)

| # | Change | How to verify |
|---|--------|--------------|
| 3 | m/km toggle fixed on mobile | Resize browser to 320px, check Walking tab toggle |
| 4 | Delete on all Body lists (x button + swipe) | Hover a row → x appears → click → undo toast. Floors + Walk/Run/Cycle |
| - | Delete hover grow effect on Baby lists | Baby → any child → Feed/Sleep/Growth/Diaper lists → hover x |
| - | Stats page redesign (compact ring, icon stat cards, pill quick actions) | `/body` → Stats tab |
| - | (+) button removed (was creating duplicates) | No more (+) on any Body row |
| - | "Reset today" on Floors tab | Floors tab → add some floors → "Reset today" appears |
| - | "+ Add missing day" date picker (all Body tabs) | Floors/Walking/Running/Cycling → bottom button → date modal → pick date → form targets that date |
| - | Verbose storage logging | Debug page → toggle Verbose → open console → do any action → see `[AFP:storage:local]` logs |
| - | Debug panel: user profile JSON viewer | DevBench → "User Profile" collapsible section → shows UID + JSON |
| - | Sort fix: activities sort by date (not createdAt) | Add a backfill walk for March → it appears at correct date position, not top |
| - | Sort fix: floors use `sortNewestFirst` (no inline sort) | Floors list still newest-first |
| 2 | Body stale closure fix (useBodyData refs) | Add walks rapidly → no duplicates |
| - | Admin "View Dashboard" button in UsersTab | Admin → Users tab → expand a user → "View Dashboard" button |
| - | AdminPanel 3 tabs (Invites / Users / Broadcasts) | Admin page → 3 tab buttons visible |
| - | BroadcastsTab compose form | Admin → Broadcasts tab → message, type, severity, date, target picker |
| - | Module request buttons on Profile page | Profile → Modules section → disabled modules show "Request" button |
| - | AlertBanner renders nothing when no alerts | No banner visible on any page (no active alerts in dev) |
| - | Notification badge on admin avatar | Badge shows when unread notifications exist |

## Needs push/deploy to verify

| # | Change | Why |
|---|--------|-----|
| 1 | Theme restoring after refresh | Dev mode hardcodes `DEV_PROFILE`, skips localStorage read. Firebase `onSnapshot` reads saved theme on prod |
| 5 | Debug user Firestore doc | Dev mode shows localStorage data. Real Firestore doc display needs prod |
| 6 | Admin user list (`collectionGroup`) | Needs Firebase. May need a Firestore composite index (console shows link if needed) |
| 8 | Admin "View Dashboard" with real data | Needs real multi-user data — `?viewUser=uid` on dashboard |
| - | Notification subcollection Firestore rules | Rules written but not deployed — need `firebase deploy --only firestore:rules` |
| - | Module request end-to-end flow | Needs two real users — one requests, admin approves |
| - | Admin alert broadcast delivery | Needs real users to receive alerts |

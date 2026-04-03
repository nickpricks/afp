# components/

App shell components for layout, navigation, and route guards.

## Files

- **Layout.tsx** — Root app shell with header, routed content area, tab bar, and PWA update prompt
- **TabBar.tsx** — Bottom navigation bar with one tab per enabled module plus admin tab
- **SyncStatus.tsx** — SyncStatusIndicator component showing a colored dot and label for sync state
- **UpdatePrompt.tsx** — PWA service worker update notification banner
- **AdminGate.tsx** — Route guard that renders children only if the user is TheAdminNick
- **ModuleGate.tsx** — Route guard that renders children only if the given module is enabled

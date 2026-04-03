# shared/

Cross-cutting infrastructure that modules depend on but don't own.

## Files

- **types.ts** — Result type, module/user/sync enums and interfaces (ModuleId, UserRole, SyncStatus, UserProfile, ModuleConfig)

## Subdirectories

- **auth/** — Firebase auth, TheAdminNick admin model, invite system
- **components/** — App shell UI (Layout, TabBar, AdminGate, ModuleGate, SyncStatusIndicator, UpdatePrompt)
- **errors/** — Error boundary and toast notifications
- **hooks/** — Shared hooks (useModules, useSyncStatus)
- **storage/** — Backend-agnostic storage layer (Firebase + localStorage adapters)
- **utils/** — Pure utility functions (date, error, profile, validation, regex)

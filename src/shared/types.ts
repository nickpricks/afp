// ─── Result Type ─────────────────────────────────────────────────────────────

/** Discriminated union for operation outcomes — success or failure */
export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

/** Creates a success Result containing the given data */
export const ok = <T>(data: T): Result<T> => ({ ok: true, data });

/** Creates a failure Result containing the given error message */
export const err = <T = never>(error: string): Result<T> => ({
  ok: false,
  error,
});

/** Type guard that narrows a Result to its success variant */
export const isOk = <T>(result: Result<T>): result is { ok: true; data: T } =>
  result.ok;

/** Type guard that narrows a Result to its failure variant */
export const isErr = <T>(
  result: Result<T>,
): result is { ok: false; error: string } => !result.ok;

// ─── Module Types ────────────────────────────────────────────────────────────

/** Identifier for each toggleable app module */
export enum ModuleId {
  Body = 'body',
  Expenses = 'expenses',
  Baby = 'baby',
}

/** Per-module enabled/disabled configuration */
export type ModuleConfig = Record<ModuleId, boolean>;

/** All available module identifiers */
export const ALL_MODULES: readonly ModuleId[] = [ModuleId.Body, ModuleId.Expenses, ModuleId.Baby];

/** Default module config with every module disabled */
export const DEFAULT_MODULES: ModuleConfig = {
  [ModuleId.Body]: false,
  [ModuleId.Expenses]: false,
  [ModuleId.Baby]: false,
};

// ─── User Types ──────────────────────────────────────────────────────────────

/** Role determining a user's access level */
export enum UserRole {
  TheAdminNick = 'theAdminNick',
  User = 'user',
}

/** Core user profile stored in the database */
export interface UserProfile {
  name: string;
  role: UserRole;
  modules: ModuleConfig;
  theme: string;
  colorMode: 'light' | 'dark' | 'system';
  createdAt: string;
}

// ─── Sync Types ──────────────────────────────────────────────────────────────

/** Current state of data synchronisation with the backend */
export enum SyncStatus {
  Synced = 'synced',
  Syncing = 'syncing',
  Error = 'error',
  Offline = 'offline',
}

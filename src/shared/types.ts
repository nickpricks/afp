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
  Budget = 'budget',
  Baby = 'baby',
}

/** Per-module enabled/disabled configuration */
export type ModuleConfig = Record<ModuleId, boolean>;

/** All available module identifiers */
export const ALL_MODULES: readonly ModuleId[] = [ModuleId.Body, ModuleId.Budget, ModuleId.Baby];

/** Default module config with every module disabled */
export const DEFAULT_MODULES: ModuleConfig = {
  [ModuleId.Body]: false,
  [ModuleId.Budget]: false,
  [ModuleId.Baby]: false,
};

// ─── User Types ──────────────────────────────────────────────────────────────

/** Role determining a user's access level */
export enum UserRole {
  TheAdminNick = 'theAdminNick',
  User = 'user',
  Viewer = 'viewer',
}

/** Core user profile stored in the database */
export interface UserProfile {
  role: UserRole;
  name: string;
  email: string | null;
  username: string | null;
  viewerOf: string | null;
  theme: string;
  colorMode: 'light' | 'dark' | 'system';
  effectCount?: number;
  effectSize?: 'small' | 'medium' | 'large';
  modules: ModuleConfig;
  createdAt: string;
  updatedAt: string;
  requestedModules?: string[];
}

// ─── Toast Types ────────────────────────────────────────────────────────────

/** Severity level for toast notifications */
export enum ToastType {
  Success = 'success',
  Error = 'error',
  Info = 'info',
}

// ─── Sync Types ──────────────────────────────────────────────────────────────

/** Current state of data synchronisation with the backend */
export enum SyncStatus {
  Synced = 'synced',
  Syncing = 'syncing',
  Error = 'error',
  Offline = 'offline',
}

// ─── Notification Types ─────────────────────────────────────────────────────

/** Type of notification entry */
export enum NotificationType {
  ModuleRequest = 'module_request',
  AdminAlert = 'admin_alert',
}

/** Behavioral type for admin alerts */
export enum AlertType {
  Alert = 'alert',
  Notice = 'notice',
}

/** Visual severity level for alert banners */
export enum Severity {
  Info = 'info',
  Warning = 'warning',
  Critical = 'critical',
}

/** A notification entry stored in users/{uid}/notifications/{id} */
export interface Notification {
  id: string;
  type: NotificationType;
  moduleId?: ModuleId;
  requestedBy?: string;
  requestedByName?: string;
  message?: string;
  severity?: Severity;
  alertType?: AlertType;
  shownTillDate?: string;
  createdAt: string;
  read: boolean;
  dismissed: boolean;
}

// ─── Activity Types ─────────────────────────────────────────────────────────

/** Type of physical activity tracked in the body module */
export enum ActivityType {
  Walk = 'walk',
  Run = 'run',
  Cycle = 'cycle',
  Yoga = 'yoga',
}

/** Budget list view timeframe */
export enum BudgetView {
  Today = 'today',
  Week = 'week',
  Month = 'month',
  All = 'all',
}

// ─── Numeric Enums (high-volume data) ───────────────────────────────────────

/** @description Payment method for transactions. Stored as number in Firestore. */
export enum PaymentMethod {
  /** 💵 Physical cash */
  Cash = 0,
  /** 🏦 Bank transfer — IMPS (instant) */
  BankAccountImps = 1,
  /** 🏦 Bank transfer — RTGS (high value) */
  BankAccountRtgs = 2,
  /** 🏦 Bank transfer — NEFT (batch) */
  BankAccountNeft = 3,
  /** 📲 UPI from bank account */
  UpiBankAccount = 4,
  /** 📲 UPI from credit card (RuPay CC on UPI) */
  UpiCreditCard = 5,
  /** 💳 Credit card (swipe/online) */
  CreditCard = 6,
}

/** @description Expense category. Stored as number in Firestore. */
export enum ExpenseCategory {
  /** 🏠 Housing */
  Housing = 0,
  /** 🍔 Food */
  Food = 1,
  /** 🛒 Shopping */
  Shopping = 2,
  /** ✈️ Travel */
  Travel = 3,
  /** 🚗 Vehicle */
  Vehicle = 4,
  /** 📱 Bills */
  Bills = 5,
  /** 🏥 Medical */
  Medical = 6,
  /** 💆 Care */
  Care = 7,
  /** 🎁 Gifts */
  Gifts = 8,
  /** 📚 Education */
  Education = 9,
  /** 🏡 Household */
  Household = 10,
  /** 💰 Finance */
  Finance = 11,
  /** 🎬 Entertainment */
  Entertainment = 12,
  /** 🔄 Transfer */
  Transfer = 13,
  /** 📦 Misc */
  Misc = 14,
}

/** @description Income source. Stored as number in Firestore. */
export enum IncomeSource {
  /** 💼 Salary */
  Salary = 0,
  /** 🏢 Business */
  Business = 1,
  /** 🏦 Interest */
  Interest = 2,
  /** 🔙 Refund */
  Refund = 3,
  /** 📦 Other */
  Other = 4,
}

/** @description Feed type for baby module. Stored as number in Firestore. */
export enum FeedType {
  /** 🤱 Breast — left */
  BreastLeft = 0,
  /** 🤱 Breast — right */
  BreastRight = 1,
  /** 🤱 Breast — both */
  BreastBoth = 2,
  /** 🍼 Bottle */
  Bottle = 3,
  /** 🥣 Solid food */
  Solid = 4,
}

/** @description Sleep type. Stored as number in Firestore. */
export enum SleepType {
  /** 😴 Daytime nap */
  Nap = 0,
  /** 🌙 Night sleep */
  Night = 1,
}

/** @description Sleep quality. Stored as number in Firestore. */
export enum SleepQuality {
  /** 😊 Good */
  Good = 0,
  /** 😐 Fair */
  Fair = 1,
  /** 😟 Poor */
  Poor = 2,
}

/** @description Diaper type. Stored as number in Firestore. */
export enum DiaperType {
  /** 💧 Wet */
  Wet = 0,
  /** 💩 Dirty */
  Dirty = 1,
  /** 💧💩 Mixed */
  Mixed = 2,
}

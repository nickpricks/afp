/** Validation error messages */
export enum ValidationMsg {
  DateRequired = 'Date is required',
  DateFormat = 'Date must be in YYYY-MM-DD format',
  UnknownCategory = 'Unknown category',
  AmountPositive = 'Amount must be greater than zero',
  UnknownIncomeSource = 'Unknown income source',
  InviteNameRequired = 'Please enter a name for the invitee',
  UsernameRequired = 'Username is required',
  UsernameTooShort = 'Username must be at least 3 characters',
  UsernameTooLong = 'Username must be at most 20 characters',
  UsernameInvalid = 'Username can only contain letters, numbers, and underscores',
}

/** Invite-related messages */
export enum InviteMsg {
  Created = 'Invite created',
  NotFound = 'Invite code not found',
  AlreadyUsed = 'Invite code has already been used',
  DevModeUnsupported = 'Invite redemption not supported in dev mode',
}

/** Budget module messages */
export enum BudgetMsg {
  ExpenseAdded = 'Expense added',
  ExpenseDeleted = 'Expense deleted',
  IncomeAdded = 'Income added',
  IncomeDeleted = 'Income deleted',
}

/** Body module messages */
export enum BodyMsg {
  ActivityAdded = 'Activity logged',
  ActivityDeleted = 'Activity deleted',
  FloorsUpdated = 'Floors updated',
  ConfigSaved = 'Body config saved',
  ConfigFailed = 'Failed to save body config',
  RecordSaved = 'Body record saved',
  RecordFailed = 'Failed to save body record',
  ActivityUpdated = 'Activity updated',
  ActivityDeleteFailed = 'Failed to delete activity',
  ActivityUpdateFailed = 'Failed to update activity',
  AtLeastOneActivity = 'Enable at least one activity',
  RecordDeleted = 'Floor record deleted',
  RecordDeleteFailed = 'Failed to delete floor record',
  TodayReset = 'Today reset',
}

/** Baby module messages */
export enum BabyMsg {
  FeedAdded = 'Feed logged',
  FeedDeleted = 'Feed deleted',
  SleepAdded = 'Sleep logged',
  SleepDeleted = 'Sleep deleted',
  GrowthAdded = 'Growth recorded',
  GrowthDeleted = 'Growth entry deleted',
  DiaperAdded = 'Diaper logged',
  DiaperDeleted = 'Diaper deleted',
  ChildAdded = 'Child added',
  ChildUpdated = 'Child updated',
  SuggestionSnoozed = 'Suggestion snoozed for 30 days',
  SuggestionEnabled = 'Module enabled',
  SuggestionDisabled = 'Module disabled',
}

/** Profile-related messages */
export enum ProfileMsg {
  UsernameClaimed = 'Username claimed',
  UsernameReleased = 'Username released',
  UsernameTaken = 'Username is already taken',
  UsernameClaimFailed = 'Failed to claim username',
  UsernameReleaseFailed = 'Failed to release username',
  ThemeSaved = 'Theme updated',
  ThemeSaveFailed = 'Failed to save theme',
  ColorModeSaveFailed = 'Failed to save color mode',
  ProfileUpdated = 'Profile updated',
  SignedOut = 'Signed out',
  SignOutFailed = 'Sign out failed',
}

/** Admin panel messages */
export enum AdminMsg {
  AdminClaimed = 'Welcome, Admin! You now control this app.',
  InviteDeleted = 'Invite deleted',
  InviteDeleteFailed = 'Failed to delete invite',
  InviteLinkCopied = 'Invite link copied',
  InviteLinkCopyFailed = 'Failed to copy invite link',
  ModulesUpdated = 'Modules updated',
  ModulesUpdateFailed = 'Failed to update modules',
  RoleUpdated = 'Role updated',
  RoleUpdateFailed = 'Failed to update role',
}

/** Notification and module request messages */
export enum NotificationMsg {
  ModuleRequested = 'Module requested',
  ModuleRequestFailed = 'Failed to request module',
  ModuleAlreadyRequested = 'Module already requested',
  ModuleApproved = 'Module enabled',
  ModuleApproveFailed = 'Failed to approve module request',
  AlertCreated = 'Alert sent',
  AlertCreateFailed = 'Failed to send alert',
  AlertDismissed = 'Alert dismissed',
  AlertDismissFailed = 'Failed to dismiss alert',
  AlertDeleted = 'Alert removed',
  AlertDeleteFailed = 'Failed to remove alert',
}

/** Context provider guard messages */
export enum ProviderMsg {
  AuthRequired = 'useAuth must be used within an AuthProvider',
  ToastRequired = 'useToast must be used within a ToastProvider',
}

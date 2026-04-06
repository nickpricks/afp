/** Validation error messages */
export enum ValidationMsg {
  DateRequired = 'Date is required',
  DateFormat = 'Date must be in YYYY-MM-DD format',
  UnknownCategory = 'Unknown category',
  AmountPositive = 'Amount must be greater than zero',
  InviteNameRequired = 'Please enter a name for the invitee',
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
}

/** Baby module messages */
export enum BabyMsg {
  FeedAdded = 'Feed logged',
  SleepAdded = 'Sleep logged',
  GrowthAdded = 'Growth recorded',
  DiaperAdded = 'Diaper logged',
  ChildAdded = 'Child added',
}

/** Context provider guard messages */
export enum ProviderMsg {
  AuthRequired = 'useAuth must be used within an AuthProvider',
  ToastRequired = 'useToast must be used within a ToastProvider',
}

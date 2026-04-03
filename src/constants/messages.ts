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

/** Expense-related messages */
export enum ExpenseMsg {
  Added = 'Expense added',
  Deleted = 'Expense deleted',
}

/** Context provider guard messages */
export enum ProviderMsg {
  AuthRequired = 'useAuth must be used within an AuthProvider',
  ToastRequired = 'useToast must be used within a ToastProvider',
}

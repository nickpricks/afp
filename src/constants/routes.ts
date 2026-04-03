/** All application route path values */
export enum AppPath {
  Home = '/',
  Invite = '/invite/:code',
  Body = '/body',
  Expenses = '/expenses',
  ExpensesAdd = '/expenses/add',
  Baby = '/baby',
  BabyFeed = '/baby/feed',
  BabySleep = '/baby/sleep',
  BabyGrowth = '/baby/growth',
  BabyDiaper = '/baby/diaper',
  Admin = '/admin',
  AdminInvite = '/admin/invite',
}

/** Route lookup object — preserves backwards compat with ROUTES.BODY style access */
export const ROUTES = {
  HOME: AppPath.Home,
  INVITE: AppPath.Invite,
  BODY: AppPath.Body,
  EXPENSES: AppPath.Expenses,
  EXPENSES_ADD: AppPath.ExpensesAdd,
  BABY: AppPath.Baby,
  BABY_FEED: AppPath.BabyFeed,
  BABY_SLEEP: AppPath.BabySleep,
  BABY_GROWTH: AppPath.BabyGrowth,
  BABY_DIAPER: AppPath.BabyDiaper,
  ADMIN: AppPath.Admin,
  ADMIN_INVITE: AppPath.AdminInvite,
} as const;

/** Union type of all route path values */
export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];

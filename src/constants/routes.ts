/** All application route path values */
export enum AppPath {
  Home = '/',
  Dashboard = '/dashboard',
  Body = '/body',
  Budget = '/budget',
  BudgetAdd = '/budget/add',
  Baby = '/baby',
  BabyChild = '/baby/:childId',
  Profile = '/profile',
  Admin = '/admin',
  AdminInvites = '/admin/invites',
  AdminUsers = '/admin/users',
  Invite = '/invite/:code',
  Debug = '/debug',
}

/** Route lookup object for ROUTES.BODY style access */
export const ROUTES = {
  HOME: AppPath.Home,
  DASHBOARD: AppPath.Dashboard,
  BODY: AppPath.Body,
  BUDGET: AppPath.Budget,
  BUDGET_ADD: AppPath.BudgetAdd,
  BABY: AppPath.Baby,
  BABY_CHILD: AppPath.BabyChild,
  PROFILE: AppPath.Profile,
  ADMIN: AppPath.Admin,
  ADMIN_INVITES: AppPath.AdminInvites,
  ADMIN_USERS: AppPath.AdminUsers,
  INVITE: AppPath.Invite,
  DEBUG: AppPath.Debug,
} as const;

/** Union type of all route path values */
export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];

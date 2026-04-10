import { describe, expect, it } from 'vitest';

import { AppPath, ROUTES } from '@/constants/routes';

describe('AppPath', () => {
  it('has all Phase 2 routes', () => {
    expect(AppPath.Home).toBe('/');
    expect(AppPath.Dashboard).toBe('/dashboard');
    expect(AppPath.Body).toBe('/body');
    expect(AppPath.Budget).toBe('/budget');
    expect(AppPath.BudgetAdd).toBe('/budget/add');
    expect(AppPath.Baby).toBe('/baby');
    expect(AppPath.BabyChild).toBe('/baby/:childId');
    expect(AppPath.Profile).toBe('/profile');
    expect(AppPath.Admin).toBe('/admin');
    expect(AppPath.AdminInvites).toBe('/admin/invites');
    expect(AppPath.AdminUsers).toBe('/admin/users');
    expect(AppPath.Invite).toBe('/invite/:code');
    expect(AppPath.Debug).toBe('/debug');
  });

  it('has exactly 14 routes', () => {
    expect(Object.keys(AppPath)).toHaveLength(14);
  });

  it('no longer has old Expenses or baby sub-routes', () => {
    const keys = Object.keys(AppPath);
    expect(keys).not.toContain('Expenses');
    expect(keys).not.toContain('ExpensesAdd');
    expect(keys).not.toContain('BabyFeed');
    expect(keys).not.toContain('BabySleep');
    expect(keys).not.toContain('BabyGrowth');
    expect(keys).not.toContain('BabyDiaper');
  });
});

describe('ROUTES', () => {
  it('maps to AppPath values', () => {
    expect(ROUTES.HOME).toBe(AppPath.Home);
    expect(ROUTES.BUDGET).toBe(AppPath.Budget);
    expect(ROUTES.BUDGET_ADD).toBe(AppPath.BudgetAdd);
    expect(ROUTES.BABY_CHILD).toBe(AppPath.BabyChild);
    expect(ROUTES.PROFILE).toBe(AppPath.Profile);
    expect(ROUTES.ADMIN_INVITES).toBe(AppPath.AdminInvites);
    expect(ROUTES.ADMIN_USERS).toBe(AppPath.AdminUsers);
  });
});

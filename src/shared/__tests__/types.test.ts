import { describe, expect, it } from 'vitest';

import {
  err,
  isErr,
  isOk,
  ok,
  ModuleId,
  UserRole,
  ActivityType,
  BudgetView,
  PaymentMethod,
  ExpenseCategory,
  IncomeSource,
  FeedType,
  SleepType,
  SleepQuality,
  DiaperType,
  ALL_MODULES,
  DEFAULT_MODULES,
} from '@/shared/types';

describe('Result helpers', () => {
  describe('ok()', () => {
    it('creates a success result with the given data', () => {
      const result = ok(42);

      expect(result).toEqual({ ok: true, data: 42 });
    });

    it('works with undefined for void results', () => {
      const result = ok(undefined);

      expect(result).toEqual({ ok: true, data: undefined });
    });
  });

  describe('err()', () => {
    it('creates a failure result with the given error message', () => {
      const result = err('something went wrong');

      expect(result).toEqual({ ok: false, error: 'something went wrong' });
    });
  });

  describe('isOk()', () => {
    it('returns true for success results', () => {
      expect(isOk(ok('hello'))).toBe(true);
    });

    it('returns false for failure results', () => {
      expect(isOk(err('fail'))).toBe(false);
    });
  });

  describe('isErr()', () => {
    it('returns true for failure results', () => {
      expect(isErr(err('fail'))).toBe(true);
    });

    it('returns false for success results', () => {
      expect(isErr(ok('hello'))).toBe(false);
    });
  });
});

describe('UserRole', () => {
  it('has all three roles', () => {
    expect(UserRole.TheAdminNick).toBe('theAdminNick');
    expect(UserRole.User).toBe('user');
    expect(UserRole.Viewer).toBe('viewer');
  });

  it('has exactly 3 members', () => {
    expect(Object.keys(UserRole)).toHaveLength(3);
  });
});

describe('ModuleId', () => {
  it('uses Budget instead of Expenses', () => {
    expect(ModuleId.Budget).toBe('budget');
    expect((ModuleId as Record<string, string>).Expenses).toBeUndefined();
  });

  it('has exactly 3 modules', () => {
    expect(Object.keys(ModuleId)).toHaveLength(3);
  });
});

describe('ALL_MODULES', () => {
  it('contains all three module IDs', () => {
    expect(ALL_MODULES).toEqual([ModuleId.Body, ModuleId.Budget, ModuleId.Baby]);
  });
});

describe('DEFAULT_MODULES', () => {
  it('has all modules disabled', () => {
    expect(DEFAULT_MODULES).toEqual({
      [ModuleId.Body]: false,
      [ModuleId.Budget]: false,
      [ModuleId.Baby]: false,
    });
  });
});

describe('ActivityType (string enum)', () => {
  it('has all four activity types', () => {
    expect(ActivityType.Walk).toBe('walk');
    expect(ActivityType.Run).toBe('run');
    expect(ActivityType.Cycle).toBe('cycle');
    expect(ActivityType.Yoga).toBe('yoga');
  });

  it('has exactly 4 members', () => {
    expect(Object.keys(ActivityType)).toHaveLength(4);
  });
});

describe('BudgetView (string enum)', () => {
  it('has all four view timeframes', () => {
    expect(BudgetView.Today).toBe('today');
    expect(BudgetView.Week).toBe('week');
    expect(BudgetView.Month).toBe('month');
    expect(BudgetView.All).toBe('all');
  });
});

describe('PaymentMethod (numeric enum)', () => {
  it('starts at 0 and has 7 members', () => {
    expect(PaymentMethod.Cash).toBe(0);
    expect(PaymentMethod.CreditCard).toBe(6);
    // Numeric enums have reverse mappings, so filter to number values
    const members = Object.values(PaymentMethod).filter((v) => typeof v === 'number');
    expect(members).toHaveLength(7);
  });

  it('has UPI variants in the middle range', () => {
    expect(PaymentMethod.UpiBankAccount).toBe(4);
    expect(PaymentMethod.UpiCreditCard).toBe(5);
  });
});

describe('ExpenseCategory (numeric enum)', () => {
  it('starts at Housing=0 and ends at Misc=14', () => {
    expect(ExpenseCategory.Housing).toBe(0);
    expect(ExpenseCategory.Misc).toBe(14);
  });

  it('has exactly 15 members', () => {
    const members = Object.values(ExpenseCategory).filter((v) => typeof v === 'number');
    expect(members).toHaveLength(15);
  });
});

describe('IncomeSource (numeric enum)', () => {
  it('has 5 members from Salary=0 to Other=4', () => {
    expect(IncomeSource.Salary).toBe(0);
    expect(IncomeSource.Other).toBe(4);
    const members = Object.values(IncomeSource).filter((v) => typeof v === 'number');
    expect(members).toHaveLength(5);
  });
});

describe('FeedType (numeric enum)', () => {
  it('has 5 members from BreastLeft=0 to Solid=4', () => {
    expect(FeedType.BreastLeft).toBe(0);
    expect(FeedType.Solid).toBe(4);
    const members = Object.values(FeedType).filter((v) => typeof v === 'number');
    expect(members).toHaveLength(5);
  });
});

describe('SleepType (numeric enum)', () => {
  it('has Nap=0 and Night=1', () => {
    expect(SleepType.Nap).toBe(0);
    expect(SleepType.Night).toBe(1);
    const members = Object.values(SleepType).filter((v) => typeof v === 'number');
    expect(members).toHaveLength(2);
  });
});

describe('SleepQuality (numeric enum)', () => {
  it('has Good=0, Fair=1, Poor=2', () => {
    expect(SleepQuality.Good).toBe(0);
    expect(SleepQuality.Fair).toBe(1);
    expect(SleepQuality.Poor).toBe(2);
    const members = Object.values(SleepQuality).filter((v) => typeof v === 'number');
    expect(members).toHaveLength(3);
  });
});

describe('DiaperType (numeric enum)', () => {
  it('has Wet=0, Dirty=1, Mixed=2', () => {
    expect(DiaperType.Wet).toBe(0);
    expect(DiaperType.Dirty).toBe(1);
    expect(DiaperType.Mixed).toBe(2);
    const members = Object.values(DiaperType).filter((v) => typeof v === 'number');
    expect(members).toHaveLength(3);
  });
});

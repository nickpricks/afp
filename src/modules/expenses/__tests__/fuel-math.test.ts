import { describe, it, expect } from 'vitest';

import {
  computeMileage,
  latestOdometer,
  dueMaintenance,
  isServiceDue,
  deriveFuelTriple,
} from '@/modules/expenses/fuel-math';
import type { Expense, FuelMeta, MaintenanceMeta } from '@/modules/expenses/types';
import { ExpenseMetaType } from '@/modules/expenses/types';
import { ExpenseCategory, PaymentMethod } from '@/shared/types';

/** Builds a minimal fuel Expense fixture with the given FuelMeta fields */
function fuelExpense(
  id: string,
  date: string,
  meta: Partial<FuelMeta> & { liters: number; pricePerLiter: number },
): Expense {
  return {
    id,
    date,
    category: ExpenseCategory.Vehicle,
    subCat: 'Fuel',
    amount: meta.liters * meta.pricePerLiter,
    paymentMethod: PaymentMethod.UpiBankAccount,
    isSettlement: false,
    note: '',
    isDeleted: false,
    createdAt: `${date}T10:00:00Z`,
    updatedAt: `${date}T10:00:00Z`,
    meta: {
      type: ExpenseMetaType.Fuel,
      odometer: meta.odometer ?? null,
      tripOdo: meta.tripOdo ?? null,
      displayedMileage: meta.displayedMileage ?? null,
      fullTank: meta.fullTank ?? false,
      liters: meta.liters,
      pricePerLiter: meta.pricePerLiter,
    },
  };
}

/** Builds a minimal maintenance Expense fixture with the given odometer and nextService */
function maintenanceExpense(
  id: string,
  date: string,
  odometer: number,
  nextService: number | null = null,
): Expense {
  return {
    id,
    date,
    category: ExpenseCategory.Vehicle,
    subCat: 'Maintenance',
    amount: 5000,
    paymentMethod: PaymentMethod.UpiBankAccount,
    isSettlement: false,
    note: '',
    isDeleted: false,
    createdAt: `${date}T10:00:00Z`,
    updatedAt: `${date}T10:00:00Z`,
    meta: { type: ExpenseMetaType.Maintenance, odometer, nextService, serviceNotes: '' },
  };
}

/** Validates computeMileage returns tripOdo/liters only when fullTank+tripOdo are set */
describe('computeMileage', () => {
  it('returns null when fullTank is false', () => {
    const meta: FuelMeta = {
      type: ExpenseMetaType.Fuel,
      liters: 40,
      pricePerLiter: 100,
      odometer: 12000,
      tripOdo: 500,
      displayedMileage: null,
      fullTank: false,
    };
    expect(computeMileage(meta)).toBeNull();
  });

  it('returns null when tripOdo is missing', () => {
    const meta: FuelMeta = {
      type: ExpenseMetaType.Fuel,
      liters: 40,
      pricePerLiter: 100,
      odometer: 12000,
      tripOdo: null,
      displayedMileage: null,
      fullTank: true,
    };
    expect(computeMileage(meta)).toBeNull();
  });

  it('returns null when liters is zero', () => {
    const meta: FuelMeta = {
      type: ExpenseMetaType.Fuel,
      liters: 0,
      pricePerLiter: 100,
      odometer: 12000,
      tripOdo: 500,
      displayedMileage: null,
      fullTank: true,
    };
    expect(computeMileage(meta)).toBeNull();
  });

  it('returns tripOdo / liters when fullTank and both present', () => {
    const meta: FuelMeta = {
      type: ExpenseMetaType.Fuel,
      liters: 40,
      pricePerLiter: 100,
      odometer: 12000,
      tripOdo: 600,
      displayedMileage: null,
      fullTank: true,
    };
    expect(computeMileage(meta)).toBe(15);
  });
});

/** Validates latestOdometer picks the highest reading across fuel+maintenance entries */
describe('latestOdometer', () => {
  it('returns null for an empty list', () => {
    expect(latestOdometer([])).toBeNull();
  });

  it('returns null when no expense has an odometer reading', () => {
    const e = fuelExpense('e1', '2026-05-01', { liters: 40, pricePerLiter: 100 });
    expect(latestOdometer([e])).toBeNull();
  });

  it('returns the highest odometer across fuel and maintenance entries', () => {
    const a = fuelExpense('e1', '2026-05-01', {
      liters: 40,
      pricePerLiter: 100,
      odometer: 12000,
    });
    const b = maintenanceExpense('e2', '2026-05-03', 12500);
    const c = fuelExpense('e3', '2026-05-02', {
      liters: 35,
      pricePerLiter: 100,
      odometer: 12200,
    });
    expect(latestOdometer([a, b, c])).toBe(12500);
  });

  it('ignores non-vehicle/non-fuel/non-maintenance expenses', () => {
    const fuel = fuelExpense('e1', '2026-05-01', {
      liters: 40,
      pricePerLiter: 100,
      odometer: 12000,
    });
    const food: Expense = {
      id: 'f1',
      date: '2026-05-02',
      category: ExpenseCategory.Food,
      subCat: 'Groceries',
      amount: 500,
      paymentMethod: PaymentMethod.UpiBankAccount,
      isSettlement: false,
      note: '',
      isDeleted: false,
      createdAt: '2026-05-02T10:00:00Z',
      updatedAt: '2026-05-02T10:00:00Z',
    };
    expect(latestOdometer([fuel, food])).toBe(12000);
  });
});

/** Validates dueMaintenance returns the most-recent maintenance entry with nextService set */
describe('dueMaintenance', () => {
  it('returns null when no maintenance entry has nextService', () => {
    const m = maintenanceExpense('m1', '2026-04-01', 10000, null);
    expect(dueMaintenance([m])).toBeNull();
  });

  it('returns the most recent maintenance with nextService set', () => {
    const m1 = maintenanceExpense('m1', '2026-01-01', 5000, 15000);
    const m2 = maintenanceExpense('m2', '2026-04-01', 12000, 22000);
    const result = dueMaintenance([m1, m2]);
    expect(result).not.toBeNull();
    if (result) expect((result as MaintenanceMeta).nextService).toBe(22000);
  });

  it('skips maintenance entries with null nextService and returns the next-most-recent', () => {
    const m1 = maintenanceExpense('m1', '2026-01-01', 5000, 15000);
    const m2 = maintenanceExpense('m2', '2026-04-01', 12000, null);
    const result = dueMaintenance([m1, m2]);
    expect(result).not.toBeNull();
    if (result) expect((result as MaintenanceMeta).nextService).toBe(15000);
  });
});

/** Validates dueMaintenance sorts by odometer value, not entry date */
describe('dueMaintenance — sort by odometer not date', () => {
  it('returns the highest-odometer maintenance entry regardless of date order', () => {
    // newer date but lower odometer
    const lowOdoNewDate = maintenanceExpense('a', '2026-04-01', 30000, 40000);
    // older date but higher odometer (catch-up log)
    const highOdoOldDate = maintenanceExpense('b', '2026-03-01', 45000, 55000);
    const result = dueMaintenance([lowOdoNewDate, highOdoOldDate]);
    expect(result?.odometer).toBe(45000);
    expect(result?.nextService).toBe(55000);
  });
});

/** Validates isServiceDue returns true iff latestOdometer >= nextService */
describe('isServiceDue', () => {
  it('returns false when there is no due maintenance', () => {
    expect(isServiceDue([])).toBe(false);
  });

  it('returns false when latestOdometer < nextService', () => {
    const m = maintenanceExpense('m1', '2026-01-01', 5000, 15000);
    const f = fuelExpense('e1', '2026-04-01', {
      liters: 40,
      pricePerLiter: 100,
      odometer: 14000,
    });
    expect(isServiceDue([m, f])).toBe(false);
  });

  it('returns true when latestOdometer >= nextService', () => {
    const m = maintenanceExpense('m1', '2026-01-01', 5000, 15000);
    const f = fuelExpense('e1', '2026-04-01', {
      liters: 40,
      pricePerLiter: 100,
      odometer: 15500,
    });
    expect(isServiceDue([m, f])).toBe(true);
  });

  it('returns false when no fuel/maintenance entry has odometer', () => {
    const m = maintenanceExpense('m1', '2026-01-01', 5000, 15000);
    expect(isServiceDue([m])).toBe(false);
  });
});

/** Validates deriveFuelTriple two-of-three auto-fill math for liters/price/amount */
describe('deriveFuelTriple', () => {
  it('liters+price+(no amount) → fills amount', () => {
    expect(
      deriveFuelTriple({ liters: 40, pricePerLiter: 100, amount: 0, lastEdited: 'liters' }),
    ).toEqual({ liters: 40, pricePerLiter: 100, amount: 4000 });
  });
  it('liters+amount+(no price) → fills price', () => {
    expect(
      deriveFuelTriple({ liters: 40, pricePerLiter: 0, amount: 4000, lastEdited: 'liters' }),
    ).toEqual({ liters: 40, pricePerLiter: 100, amount: 4000 });
  });
  it('price+amount+(no liters) → fills liters', () => {
    expect(
      deriveFuelTriple({ liters: 0, pricePerLiter: 100, amount: 4000, lastEdited: 'price' }),
    ).toEqual({ liters: 40, pricePerLiter: 100, amount: 4000 });
  });
  it('does not clobber user-typed amount when lastEdited === amount', () => {
    expect(
      deriveFuelTriple({ liters: 40, pricePerLiter: 100, amount: 5000, lastEdited: 'amount' }),
    ).toEqual({ liters: 40, pricePerLiter: 100, amount: 5000 });
  });
  it('skips derivation when any operand is 0 / NaN', () => {
    expect(
      deriveFuelTriple({ liters: 0, pricePerLiter: 0, amount: 0, lastEdited: 'liters' }),
    ).toEqual({ liters: 0, pricePerLiter: 0, amount: 0 });
    expect(
      deriveFuelTriple({ liters: NaN, pricePerLiter: 100, amount: 0, lastEdited: 'liters' }),
    ).toEqual({ liters: NaN, pricePerLiter: 100, amount: 0 });
  });
  it('rejects non-finite derived results (amount/0 = Infinity)', () => {
    expect(
      deriveFuelTriple({ liters: 0, pricePerLiter: 0, amount: 4000, lastEdited: 'amount' }),
    ).toEqual({ liters: 0, pricePerLiter: 0, amount: 4000 });
  });
});

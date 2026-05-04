import { describe, it, expect } from 'vitest';

import {
  computeMileage,
  latestOdometer,
  dueMaintenance,
  isServiceDue,
} from '@/modules/expenses/fuel-math';
import type { Expense, FuelMeta, MaintenanceMeta } from '@/modules/expenses/types';
import { ExpenseCategory, PaymentMethod } from '@/shared/types';

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
      type: 'fuel',
      odometer: meta.odometer ?? null,
      tripOdo: meta.tripOdo ?? null,
      displayedMileage: meta.displayedMileage ?? null,
      fullTank: meta.fullTank ?? false,
      liters: meta.liters,
      pricePerLiter: meta.pricePerLiter,
    },
  };
}

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
    meta: { type: 'maintenance', odometer, nextService, serviceNotes: '' },
  };
}

describe('computeMileage', () => {
  it('returns null when fullTank is false', () => {
    const meta: FuelMeta = {
      type: 'fuel',
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
      type: 'fuel',
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
      type: 'fuel',
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
      type: 'fuel',
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

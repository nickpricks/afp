import { describe, it, expect } from 'vitest';
import {
  renderFuelBadge,
  renderTravelBadge,
  renderMaintenanceBadge,
  renderBadge,
} from '../expense-badges';
import { ExpenseMetaType } from '../types';
import type { FuelMeta, TravelMeta, MaintenanceMeta } from '../types';

/** Validates renderFuelBadge output format and conditional field inclusion */
describe('renderFuelBadge', () => {
  it('includes liters and price per liter when pricePerLiter > 0', () => {
    const meta: FuelMeta = {
      type: ExpenseMetaType.Fuel,
      liters: 40,
      pricePerLiter: 100,
      odometer: null,
      tripOdo: null,
      displayedMileage: null,
      fullTank: false,
    };
    const out = renderFuelBadge(meta);
    expect(out).toMatch(/40L/);
    expect(out).toMatch(/100\/L/);
  });

  it('includes odometer when set', () => {
    const meta: FuelMeta = {
      type: ExpenseMetaType.Fuel,
      liters: 40,
      pricePerLiter: 100,
      odometer: 12000,
      tripOdo: null,
      displayedMileage: null,
      fullTank: false,
    };
    const out = renderFuelBadge(meta);
    expect(out).toMatch(/12,000km/);
  });

  it('includes mileage when fullTank + tripOdo are set', () => {
    const meta: FuelMeta = {
      type: ExpenseMetaType.Fuel,
      liters: 40,
      pricePerLiter: 100,
      odometer: 12000,
      tripOdo: 600,
      displayedMileage: null,
      fullTank: true,
    };
    const out = renderFuelBadge(meta);
    expect(out).toMatch(/15\.0 km\/L/);
  });

  it('omits mileage when fullTank is false', () => {
    const meta: FuelMeta = {
      type: ExpenseMetaType.Fuel,
      liters: 40,
      pricePerLiter: 100,
      odometer: 12000,
      tripOdo: 600,
      displayedMileage: null,
      fullTank: false,
    };
    const out = renderFuelBadge(meta);
    expect(out).not.toMatch(/km\/L/);
  });
});

/** Validates renderTravelBadge route format and optional distance inclusion */
describe('renderTravelBadge', () => {
  it('returns origin → destination route', () => {
    const meta: TravelMeta = {
      type: ExpenseMetaType.Travel,
      origin: 'Home',
      destination: 'Office',
      distance: null,
    };
    const out = renderTravelBadge(meta);
    expect(out).toMatch(/Home.*→.*Office/);
  });

  it('includes distance when present', () => {
    const meta: TravelMeta = {
      type: ExpenseMetaType.Travel,
      origin: 'Home',
      destination: 'Office',
      distance: 25,
    };
    const out = renderTravelBadge(meta);
    expect(out).toMatch(/25km/);
  });

  it('omits distance marker when distance is null', () => {
    const meta: TravelMeta = {
      type: ExpenseMetaType.Travel,
      origin: 'Home',
      destination: 'Office',
      distance: null,
    };
    const out = renderTravelBadge(meta);
    expect(out).not.toMatch(/·/);
  });
});

/** Validates renderMaintenanceBadge odometer and next-service formatting */
describe('renderMaintenanceBadge', () => {
  it('includes odometer reading', () => {
    const meta: MaintenanceMeta = {
      type: ExpenseMetaType.Maintenance,
      odometer: 50000,
      nextService: null,
      serviceNotes: '',
    };
    const out = renderMaintenanceBadge(meta);
    expect(out).toMatch(/50,000km/);
  });

  it('includes next service when set', () => {
    const meta: MaintenanceMeta = {
      type: ExpenseMetaType.Maintenance,
      odometer: 50000,
      nextService: 55000,
      serviceNotes: '',
    };
    const out = renderMaintenanceBadge(meta);
    expect(out).toMatch(/55,000/);
  });

  it('omits next when nextService is null', () => {
    const meta: MaintenanceMeta = {
      type: ExpenseMetaType.Maintenance,
      odometer: 50000,
      nextService: null,
      serviceNotes: '',
    };
    const out = renderMaintenanceBadge(meta);
    expect(out).not.toMatch(/next/);
  });
});

/** Verifies renderBadge dispatches to the correct renderer by meta.type */
describe('renderBadge — dispatcher', () => {
  it('dispatches to fuel renderer', () => {
    const meta: FuelMeta = {
      type: ExpenseMetaType.Fuel,
      liters: 10,
      pricePerLiter: 0,
      odometer: null,
      tripOdo: null,
      displayedMileage: null,
      fullTank: false,
    };
    const out = renderBadge(meta);
    expect(out).toMatch(/10L/);
  });

  it('dispatches to travel renderer', () => {
    const meta: TravelMeta = {
      type: ExpenseMetaType.Travel,
      origin: 'A',
      destination: 'B',
      distance: null,
    };
    const out = renderBadge(meta);
    expect(out).toMatch(/A.*→.*B/);
  });

  it('dispatches to maintenance renderer', () => {
    const meta: MaintenanceMeta = {
      type: ExpenseMetaType.Maintenance,
      odometer: 10000,
      nextService: null,
      serviceNotes: '',
    };
    const out = renderBadge(meta);
    expect(out).toMatch(/10,000km/);
  });

  it('returns null for undefined meta', () => {
    expect(renderBadge(undefined)).toBeNull();
  });
});

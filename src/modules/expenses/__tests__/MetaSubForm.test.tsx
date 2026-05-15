import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { MetaSubForm } from '@/modules/expenses/components/MetaSubForm';
import { metaKindFor, defaultMeta } from '@/modules/expenses/meta-utils';
import { ExpenseCategory } from '@/shared/types';
import type { FuelMeta, TravelMeta, MaintenanceMeta } from '@/modules/expenses/types';
import { ExpenseMetaType } from '@/modules/expenses/types';

describe('metaKindFor', () => {
  it('returns "fuel" for Vehicle/Fuel', () => {
    expect(metaKindFor(ExpenseCategory.Vehicle, 'Fuel')).toBe(ExpenseMetaType.Fuel);
  });
  it('returns "maintenance" for Vehicle/Maintenance', () => {
    expect(metaKindFor(ExpenseCategory.Vehicle, 'Maintenance')).toBe(ExpenseMetaType.Maintenance);
  });
  it('returns "travel" for any non-empty Travel subCat', () => {
    expect(metaKindFor(ExpenseCategory.Travel, 'Air')).toBe(ExpenseMetaType.Travel);
    expect(metaKindFor(ExpenseCategory.Travel, 'Cab/Auto')).toBe(ExpenseMetaType.Travel);
  });
  it('returns null for empty Travel subCat', () => {
    expect(metaKindFor(ExpenseCategory.Travel, '')).toBeNull();
  });
  it('returns null for non-vehicle, non-travel categories', () => {
    expect(metaKindFor(ExpenseCategory.Food, 'Groceries')).toBeNull();
  });
  it('returns null when category is null', () => {
    expect(metaKindFor(null, 'Fuel')).toBeNull();
  });
});

describe('defaultMeta', () => {
  it('returns FuelMeta with zeros and nulls', () => {
    const m = defaultMeta(ExpenseMetaType.Fuel);
    expect(m).toEqual({
      type: ExpenseMetaType.Fuel,
      liters: 0,
      pricePerLiter: 0,
      odometer: null,
      tripOdo: null,
      displayedMileage: null,
      fullTank: false,
    });
  });
  it('returns TravelMeta with empty strings', () => {
    expect(defaultMeta(ExpenseMetaType.Travel)).toEqual({
      type: ExpenseMetaType.Travel,
      origin: '',
      destination: '',
      distance: null,
    });
  });
  it('returns MaintenanceMeta with zero odometer', () => {
    expect(defaultMeta(ExpenseMetaType.Maintenance)).toEqual({
      type: ExpenseMetaType.Maintenance,
      odometer: 0,
      nextService: null,
      serviceNotes: '',
    });
  });
  it('returns undefined for null kind', () => {
    expect(defaultMeta(null)).toBeUndefined();
  });
});

describe('MetaSubForm — fuel variant', () => {
  function renderFuel(initial: Partial<FuelMeta> = {}) {
    const onChangeMeta = vi.fn();
    const onChangeAmount = vi.fn();
    const meta: FuelMeta = {
      type: ExpenseMetaType.Fuel,
      liters: 0,
      pricePerLiter: 0,
      odometer: null,
      tripOdo: null,
      displayedMileage: null,
      fullTank: false,
      ...initial,
    };
    render(
      <MetaSubForm
        meta={meta}
        amount=""
        onChangeMeta={onChangeMeta}
        onChangeAmount={onChangeAmount}
      />,
    );
    return { onChangeMeta, onChangeAmount };
  }

  it('renders the ⛽ Fuel details heading', () => {
    renderFuel();
    expect(screen.getByText(/Fuel details/)).toBeInTheDocument();
  });

  it('renders Liters and ₹/Liter inputs', () => {
    renderFuel();
    expect(screen.getByText('Liters')).toBeInTheDocument();
    expect(screen.getByText(/Liter$/)).toBeInTheDocument();
  });

  it('full-tank checkbox toggles via onChangeMeta', () => {
    const { onChangeMeta } = renderFuel();
    const checkbox = screen.getByRole('checkbox', { name: /Full tank/ });
    fireEvent.click(checkbox);
    expect(onChangeMeta).toHaveBeenCalledWith(expect.objectContaining({ fullTank: true }));
  });

  it('collapses vehicle-data inputs in a <details> element', () => {
    renderFuel();
    expect(screen.getByText('Vehicle data (optional)')).toBeInTheDocument();
  });

  it('blurring liters field calls onChangeAmount when deriveFuelTriple can compute amount', () => {
    const onChangeMeta = vi.fn();
    const onChangeAmount = vi.fn();
    const meta: FuelMeta = {
      type: ExpenseMetaType.Fuel,
      liters: 0,
      pricePerLiter: 100,
      odometer: null,
      tripOdo: null,
      displayedMileage: null,
      fullTank: false,
    };
    render(
      <MetaSubForm meta={meta} amount="" onChangeMeta={onChangeMeta} onChangeAmount={onChangeAmount} />,
    );
    const litersInput = screen.getByLabelText('Liters');
    fireEvent.change(litersInput, { target: { value: '40' } });
    fireEvent.blur(litersInput, { target: { value: '40' } });
    // liters=40, pricePerLiter=100, amount is empty → should derive 4000
    expect(onChangeAmount).toHaveBeenCalledWith('4000');
  });

  it('user-typed amount is NOT clobbered when liters blurs (stale-state bug fix)', () => {
    const onChangeMeta = vi.fn();
    const onChangeAmount = vi.fn();
    const meta: FuelMeta = {
      type: ExpenseMetaType.Fuel,
      liters: 40,
      pricePerLiter: 100,
      odometer: null,
      tripOdo: null,
      displayedMileage: null,
      fullTank: false,
    };
    // User has already manually typed amount=5000 (overrides implicit 40*100=4000)
    render(
      <MetaSubForm meta={meta} amount="5000" onChangeMeta={onChangeMeta} onChangeAmount={onChangeAmount} />,
    );
    const litersInput = screen.getByLabelText('Liters');
    // User blurs liters without changing it — deriveFuelTriple sees amount=5000 is already set
    // (ok(amount)=true) so it won't derive a new amount
    fireEvent.blur(litersInput, { target: { value: '40' } });
    // onChangeAmount must NOT be called — user's amount is preserved
    expect(onChangeAmount).not.toHaveBeenCalled();
  });
});

describe('MetaSubForm — travel variant', () => {
  it('renders origin and destination inputs', () => {
    const meta: TravelMeta = { type: ExpenseMetaType.Travel, origin: 'BLR', destination: 'MAA', distance: null };
    render(<MetaSubForm meta={meta} amount="" onChangeMeta={vi.fn()} onChangeAmount={vi.fn()} />);
    expect(screen.getByDisplayValue('BLR')).toBeInTheDocument();
    expect(screen.getByDisplayValue('MAA')).toBeInTheDocument();
  });
});

describe('MetaSubForm — maintenance variant', () => {
  it('renders odometer + next-service inputs and helper text', () => {
    const meta: MaintenanceMeta = {
      type: ExpenseMetaType.Maintenance,
      odometer: 12500,
      nextService: 22500,
      serviceNotes: '',
    };
    render(<MetaSubForm meta={meta} amount="" onChangeMeta={vi.fn()} onChangeAmount={vi.fn()} />);
    expect(screen.getByText(/Service details/)).toBeInTheDocument();
    expect(screen.getByText(/clears the service-due banner/)).toBeInTheDocument();
    expect(screen.getByDisplayValue('12500')).toBeInTheDocument();
    expect(screen.getByDisplayValue('22500')).toBeInTheDocument();
  });
});

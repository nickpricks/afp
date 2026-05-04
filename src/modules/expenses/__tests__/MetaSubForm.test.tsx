import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { MetaSubForm, defaultMeta, metaKindFor } from '@/modules/expenses/components/MetaSubForm';
import { ExpenseCategory } from '@/shared/types';
import type { FuelMeta, TravelMeta, MaintenanceMeta } from '@/modules/expenses/types';

describe('metaKindFor', () => {
  it('returns "fuel" for Vehicle/Fuel', () => {
    expect(metaKindFor(ExpenseCategory.Vehicle, 'Fuel')).toBe('fuel');
  });
  it('returns "maintenance" for Vehicle/Maintenance', () => {
    expect(metaKindFor(ExpenseCategory.Vehicle, 'Maintenance')).toBe('maintenance');
  });
  it('returns "travel" for any non-empty Travel subCat', () => {
    expect(metaKindFor(ExpenseCategory.Travel, 'Air')).toBe('travel');
    expect(metaKindFor(ExpenseCategory.Travel, 'Cab/Auto')).toBe('travel');
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
    const m = defaultMeta('fuel');
    expect(m).toEqual({
      type: 'fuel',
      liters: 0,
      pricePerLiter: 0,
      odometer: null,
      tripOdo: null,
      displayedMileage: null,
      fullTank: false,
    });
  });
  it('returns TravelMeta with empty strings', () => {
    expect(defaultMeta('travel')).toEqual({
      type: 'travel',
      origin: '',
      destination: '',
      distance: null,
    });
  });
  it('returns MaintenanceMeta with zero odometer', () => {
    expect(defaultMeta('maintenance')).toEqual({
      type: 'maintenance',
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
      type: 'fuel',
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
});

describe('MetaSubForm — travel variant', () => {
  it('renders origin and destination inputs', () => {
    const meta: TravelMeta = { type: 'travel', origin: 'BLR', destination: 'MAA', distance: null };
    render(<MetaSubForm meta={meta} amount="" onChangeMeta={vi.fn()} onChangeAmount={vi.fn()} />);
    expect(screen.getByDisplayValue('BLR')).toBeInTheDocument();
    expect(screen.getByDisplayValue('MAA')).toBeInTheDocument();
  });
});

describe('MetaSubForm — maintenance variant', () => {
  it('renders odometer + next-service inputs and helper text', () => {
    const meta: MaintenanceMeta = {
      type: 'maintenance',
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

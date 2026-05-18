import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { AutoTabRow } from '@/modules/expenses/components/AutoTabRow';
import type { Expense, FuelMeta } from '@/modules/expenses/types';
import { ExpenseMetaType } from '@/modules/expenses/types';
import { ExpenseCategory, PaymentMethod } from '@/shared/types';
import { VEHICLE_SUBCAT } from '@/modules/expenses/categories';

/** Minimal fuel-expense fixture for AutoTabRow rendering */
function fuelExpense(): Expense {
  const meta: FuelMeta = {
    type: ExpenseMetaType.Fuel,
    liters: 40,
    pricePerLiter: 100,
    odometer: 12000,
    tripOdo: 500,
    fullTank: true,
  };
  return {
    id: 'exp-1',
    date: '2026-05-18',
    category: ExpenseCategory.Vehicle,
    subCat: VEHICLE_SUBCAT.Fuel,
    amount: 4000,
    paymentMethod: PaymentMethod.UpiBankAccount,
    isSettlement: false,
    note: '',
    isDeleted: false,
    createdAt: '2026-05-18T10:00:00Z',
    updatedAt: '2026-05-18T10:00:00Z',
    meta,
  };
}

/** Renders fuel/travel/maintenance + the incomplete pill case, plus the active-row + delete affordances */
describe('AutoTabRow', () => {
  it('renders amount, payment-method short label, and category label', () => {
    render(<AutoTabRow expense={fuelExpense()} isActive={false} onTap={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('4000', { exact: false })).toBeInTheDocument();
    expect(screen.getByText(/Vehicle/i)).toBeInTheDocument();
    expect(screen.getByText(VEHICLE_SUBCAT.Fuel, { exact: false })).toBeInTheDocument();
  });

  it('shows the incomplete pill when meta is missing', () => {
    const expense = { ...fuelExpense(), meta: undefined };
    render(<AutoTabRow expense={expense} isActive={false} onTap={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText(/incomplete/i)).toBeInTheDocument();
  });

  it('hides the incomplete pill when meta is present', () => {
    render(<AutoTabRow expense={fuelExpense()} isActive={false} onTap={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.queryByText(/incomplete/i)).not.toBeInTheDocument();
  });

  it('applies active styling when isActive is true', () => {
    const { container } = render(
      <AutoTabRow expense={fuelExpense()} isActive={true} onTap={vi.fn()} onDelete={vi.fn()} />,
    );
    const row = container.querySelector('[role="button"]');
    expect(row?.className).toContain('accent-muted');
    expect(row?.className).toContain('border-l-accent');
  });

  it('fires onTap when the row is clicked', () => {
    const onTap = vi.fn();
    render(<AutoTabRow expense={fuelExpense()} isActive={false} onTap={onTap} onDelete={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /4000/ }));
    expect(onTap).toHaveBeenCalledOnce();
  });

  it('fires onTap when Enter is pressed on the row', () => {
    const onTap = vi.fn();
    render(<AutoTabRow expense={fuelExpense()} isActive={false} onTap={onTap} onDelete={vi.fn()} />);
    fireEvent.keyDown(screen.getByRole('button', { name: /4000/ }), { key: 'Enter' });
    expect(onTap).toHaveBeenCalledOnce();
  });

  it('fires onDelete (not onTap) when the × button is clicked', () => {
    const onTap = vi.fn();
    const onDelete = vi.fn();
    render(<AutoTabRow expense={fuelExpense()} isActive={false} onTap={onTap} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole('button', { name: '×' }));
    expect(onDelete).toHaveBeenCalledOnce();
    expect(onTap).not.toHaveBeenCalled();
  });
});

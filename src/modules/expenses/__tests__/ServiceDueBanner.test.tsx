import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { ServiceDueBanner } from '@/modules/expenses/components/ServiceDueBanner';
import type { Expense } from '@/modules/expenses/types';
import { ExpenseMetaType } from '@/modules/expenses/types';
import { ExpenseCategory, PaymentMethod } from '@/shared/types';

/** Builds a minimal maintenance Expense fixture for ServiceDueBanner tests */
function maintenance(
  id: string,
  date: string,
  odometer: number,
  nextService: number | null,
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

/** Builds a minimal fuel Expense fixture for ServiceDueBanner tests */
function fuel(id: string, date: string, odometer: number): Expense {
  return {
    id,
    date,
    category: ExpenseCategory.Vehicle,
    subCat: 'Fuel',
    amount: 4000,
    paymentMethod: PaymentMethod.UpiBankAccount,
    isSettlement: false,
    note: '',
    isDeleted: false,
    createdAt: `${date}T10:00:00Z`,
    updatedAt: `${date}T10:00:00Z`,
    meta: {
      type: ExpenseMetaType.Fuel,
      liters: 40,
      pricePerLiter: 100,
      odometer,
      tripOdo: null,
      fullTank: false,
    },
  };
}

/** Validates ServiceDueBanner visibility logic, odometer display, and dismiss action */
describe('ServiceDueBanner', () => {
  it('returns null when expenses array is empty (defensive, no crash)', () => {
    const { container } = render(<ServiceDueBanner expenses={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when there are no expenses', () => {
    const { container } = render(<ServiceDueBanner expenses={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when maintenance has nextService but odometer reading is below threshold', () => {
    // odometer below nextService → not service-due
    const expenses = [maintenance('m1', '2026-01-01', 5000, 15000)];
    const { container } = render(<ServiceDueBanner expenses={expenses} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders banner (defensive no-crash) when service is due: latestOdometer >= nextService', () => {
    // fuel entry pushes odometer above maintenance nextService
    const expenses = [
      maintenance('m1', '2026-01-01', 5000, 51000),
      fuel('f1', '2026-04-01', 51000),
    ];
    render(<ServiceDueBanner expenses={expenses} />);
    expect(screen.getByText(/service due/i)).toBeInTheDocument();
    expect(screen.getByText(/51,000 km/)).toBeInTheDocument();
  });

  it('renders nothing when not service-due', () => {
    const expenses = [
      maintenance('m1', '2026-01-01', 5000, 15000),
      fuel('f1', '2026-04-01', 14000),
    ];
    const { container } = render(<ServiceDueBanner expenses={expenses} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders banner with current and due odometers when service-due', () => {
    const expenses = [
      maintenance('m1', '2026-01-01', 5000, 15000),
      fuel('f1', '2026-04-01', 16000),
    ];
    render(<ServiceDueBanner expenses={expenses} />);
    expect(screen.getByText('Service due')).toBeInTheDocument();
    expect(screen.getByText(/16,000 km/)).toBeInTheDocument();
    expect(screen.getByText(/15,000 km/)).toBeInTheDocument();
  });

  it('hides when dismiss button is clicked', () => {
    const expenses = [
      maintenance('m1', '2026-01-01', 5000, 15000),
      fuel('f1', '2026-04-01', 16000),
    ];
    render(<ServiceDueBanner expenses={expenses} />);
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByText('Service due')).toBeNull();
  });
});

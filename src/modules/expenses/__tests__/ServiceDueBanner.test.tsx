import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { ServiceDueBanner } from '@/modules/expenses/components/ServiceDueBanner';
import type { Expense } from '@/modules/expenses/types';
import { ExpenseCategory, PaymentMethod } from '@/shared/types';

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
    meta: { type: 'maintenance', odometer, nextService, serviceNotes: '' },
  };
}

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
      type: 'fuel',
      liters: 40,
      pricePerLiter: 100,
      odometer,
      tripOdo: null,
      displayedMileage: null,
      fullTank: false,
    },
  };
}

describe('ServiceDueBanner', () => {
  it('renders nothing when there are no expenses', () => {
    const { container } = render(<ServiceDueBanner expenses={[]} />);
    expect(container.firstChild).toBeNull();
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

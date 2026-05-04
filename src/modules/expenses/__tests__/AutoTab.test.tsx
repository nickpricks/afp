import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { AutoTab } from '@/modules/expenses/components/AutoTab';
import { ToastProvider } from '@/shared/errors/toast-context';
import type { Expense } from '@/modules/expenses/types';
import { ExpenseCategory, PaymentMethod } from '@/shared/types';

function withToast(ui: React.ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

function fuelExpense(id: string, date: string, odometer = 12000): Expense {
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

function foodExpense(id: string, date: string): Expense {
  return {
    id,
    date,
    category: ExpenseCategory.Food,
    subCat: 'Groceries',
    amount: 500,
    paymentMethod: PaymentMethod.UpiBankAccount,
    isSettlement: false,
    note: '',
    isDeleted: false,
    createdAt: `${date}T10:00:00Z`,
    updatedAt: `${date}T10:00:00Z`,
  };
}

describe('AutoTab — filtering', () => {
  it('shows only Vehicle and Travel expenses (filters out Food)', () => {
    const expenses = [fuelExpense('e1', '2026-05-01'), foodExpense('e2', '2026-05-02')];
    withToast(
      <AutoTab
        expenses={expenses}
        onAdd={vi.fn().mockResolvedValue(true)}
        onUpdate={vi.fn().mockResolvedValue(true)}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText(/12,000km/)).toBeInTheDocument();
    expect(screen.queryByText('Groceries')).toBeNull();
  });

  it('shows empty state when no Vehicle/Travel entries exist', () => {
    withToast(
      <AutoTab
        expenses={[foodExpense('e1', '2026-05-01')]}
        onAdd={vi.fn().mockResolvedValue(true)}
        onUpdate={vi.fn().mockResolvedValue(true)}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText(/No vehicle or trip entries yet/)).toBeInTheDocument();
  });
});

describe('AutoTab — quick-add buttons', () => {
  it('renders the three quick-add buttons', () => {
    withToast(
      <AutoTab
        expenses={[]}
        onAdd={vi.fn().mockResolvedValue(true)}
        onUpdate={vi.fn().mockResolvedValue(true)}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /Add Fuel/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add Trip/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Service/ })).toBeInTheDocument();
  });

  it('clicking ⛽ Add Fuel reveals the fuel sub-form', () => {
    withToast(
      <AutoTab
        expenses={[]}
        onAdd={vi.fn().mockResolvedValue(true)}
        onUpdate={vi.fn().mockResolvedValue(true)}
        onDelete={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Add Fuel/ }));
    expect(screen.getByText(/Fuel details/)).toBeInTheDocument();
  });

  it('clicking 🚕 Add Trip reveals the travel sub-form', () => {
    withToast(
      <AutoTab
        expenses={[]}
        onAdd={vi.fn().mockResolvedValue(true)}
        onUpdate={vi.fn().mockResolvedValue(true)}
        onDelete={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Add Trip/ }));
    expect(screen.getByText(/Trip details/)).toBeInTheDocument();
  });

  it('Cancel button hides the form', () => {
    withToast(
      <AutoTab
        expenses={[]}
        onAdd={vi.fn().mockResolvedValue(true)}
        onUpdate={vi.fn().mockResolvedValue(true)}
        onDelete={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Add Fuel/ }));
    expect(screen.getByText(/Fuel details/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByText(/Fuel details/)).toBeNull();
  });
});

describe('AutoTab — tap-to-edit', () => {
  it('tapping a row populates the form and switches button to "Update"', () => {
    const expenses = [fuelExpense('e1', '2026-05-01')];
    withToast(
      <AutoTab
        expenses={expenses}
        onAdd={vi.fn().mockResolvedValue(true)}
        onUpdate={vi.fn().mockResolvedValue(true)}
        onDelete={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText(/12,000km/));
    expect(screen.getByText(/Fuel details/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Update' })).toBeInTheDocument();
  });
});

describe('AutoTab — incomplete pill', () => {
  it('renders "incomplete" pill when meta is undefined', () => {
    const e: Expense = {
      id: 'old',
      date: '2026-04-01',
      category: ExpenseCategory.Vehicle,
      subCat: 'Fuel',
      amount: 3500,
      paymentMethod: PaymentMethod.UpiBankAccount,
      isSettlement: false,
      note: '',
      isDeleted: false,
      createdAt: '2026-04-01T10:00:00Z',
      updatedAt: '2026-04-01T10:00:00Z',
    };
    withToast(
      <AutoTab
        expenses={[e]}
        onAdd={vi.fn().mockResolvedValue(true)}
        onUpdate={vi.fn().mockResolvedValue(true)}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('incomplete')).toBeInTheDocument();
  });
});

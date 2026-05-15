import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { AutoTab } from '@/modules/expenses/components/AutoTab';
import { ToastProvider } from '@/shared/errors/toast-context';
import type { Expense } from '@/modules/expenses/types';
import { ExpenseMetaType } from '@/modules/expenses/types';
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
      type: ExpenseMetaType.Fuel,
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

describe('AutoTab — amount validation toast', () => {
  it('shows AmountPositive (not CategoryRequired) toast when amount is blank on submit', async () => {
    const addToastSpy = vi.fn();
    vi.doMock('@/shared/errors/useToast', () => ({ useToast: () => ({ addToast: addToastSpy }) }));

    // Use ToastProvider to capture real toast calls via the spy injected by context
    // We test via the real ToastProvider + listening for the toast text in the DOM.
    withToast(
      <AutoTab
        expenses={[]}
        onAdd={vi.fn().mockResolvedValue(true)}
        onUpdate={vi.fn().mockResolvedValue(true)}
        onDelete={vi.fn()}
      />,
    );
    // Open the fuel form (amount starts blank)
    fireEvent.click(screen.getByRole('button', { name: /Add Fuel/ }));
    // Fill in required fuel fields so meta is valid, but leave amount blank
    const litersInput = screen.getByLabelText(/Liters/i);
    fireEvent.change(litersInput, { target: { value: '40' } });
    // Submit with blank amount — should show AmountPositive, NOT CategoryRequired
    const form = screen.getByRole('button', { name: 'Save' });
    fireEvent.click(form);
    // Toast appears in DOM via ToastProvider
    await screen.findByText(/Amount must be greater than zero/i);
    expect(screen.queryByText(/Please select a category/i)).toBeNull();
  });
});

describe('AutoTab — paymentMethod capture', () => {
  it('Auto tab submits with the user-selected paymentMethod (not silently UPI)', async () => {
    const onAdd = vi.fn().mockResolvedValue(true);
    withToast(
      <AutoTab
        expenses={[]}
        onAdd={onAdd}
        onUpdate={vi.fn().mockResolvedValue(true)}
        onDelete={vi.fn()}
      />,
    );
    // Open fuel form
    fireEvent.click(screen.getByRole('button', { name: /Add Fuel/ }));
    expect(screen.getByText(/Fuel details/)).toBeInTheDocument();

    // Fill in amount
    const amountInput = screen.getByPlaceholderText('Amount');
    fireEvent.change(amountInput, { target: { value: '4000' } });

    // Click the Cash payment method bubble (emoji 💵)
    const cashBtn = screen.getByRole('button', { name: /Cash/i });
    fireEvent.click(cashBtn);

    // Submit
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    // Wait for async submit
    await screen.findByRole('button', { name: /Add Fuel/ });

    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({ paymentMethod: PaymentMethod.Cash }),
    );
  });

  it('tap-to-edit populates paymentMethod from the existing expense', () => {
    const expenses = [fuelExpense('e1', '2026-05-01')];
    // fuelExpense uses PaymentMethod.UpiBankAccount by default
    const onUpdate = vi.fn().mockResolvedValue(true);
    withToast(
      <AutoTab
        expenses={expenses}
        onAdd={vi.fn().mockResolvedValue(true)}
        onUpdate={onUpdate}
        onDelete={vi.fn()}
      />,
    );
    // Tap row to edit
    fireEvent.click(screen.getByText(/12,000km/));
    // The form should now show Update button (edit mode)
    expect(screen.getByRole('button', { name: 'Update' })).toBeInTheDocument();
    // UPI payment method bubble should be active (from expense.paymentMethod = UpiBankAccount)
    // shortLabel for UpiBankAccount is "UPI" — find the active bubble
    const activeBubbles = screen.getAllByRole('button').filter((b) =>
      b.className.includes('bg-accent') && b.textContent?.includes('UPI'),
    );
    expect(activeBubbles.length).toBeGreaterThan(0);
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

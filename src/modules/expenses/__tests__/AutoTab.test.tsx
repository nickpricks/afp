import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { AutoTab } from '@/modules/expenses/components/AutoTab';
import { ToastProvider } from '@/shared/errors/toast-context';
import type { Expense } from '@/modules/expenses/types';
import { ExpenseMetaType } from '@/modules/expenses/types';
import { ExpenseCategory, PaymentMethod } from '@/shared/types';

/** Renders the given element inside a ToastProvider for AutoTab tests */
function withToast(ui: React.ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

/** Builds a minimal fuel Expense fixture for AutoTab tests */
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

/** Builds a minimal food Expense fixture to verify AutoTab filtering excludes non-vehicle/travel */
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

/** Validates AutoTab only renders Vehicle and Travel expenses in the list */
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

/** Validates AutoTab quick-add buttons and their inline form visibility */
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

/** Validates AutoTab tap-to-edit: row tap populates form and switches to Update mode */
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

/** Validates AutoTab shows AmountPositive toast on submit with blank amount */
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

/** Validates AutoTab captures and submits the user-selected payment method */
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
    const activeBubbles = screen
      .getAllByRole('button')
      .filter((b) => b.className.includes('bg-accent') && b.textContent?.includes('UPI'));
    expect(activeBubbles.length).toBeGreaterThan(0);
  });
});

/** Validates AutoTab shows "incomplete" pill for expenses with no meta */
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
        onDelete={vi.fn().mockResolvedValue(true)}
      />,
    );
    expect(screen.getByText('incomplete')).toBeInTheDocument();
  });
});

/** Verifies AutoTab renders without throwing even with 500 expenses (no pagination overhead) */
describe('AutoTab — pagination deviation sanity', () => {
  it('renders without throwing with 500 expenses (pagination-deviation sanity check)', () => {
    const expenses: Expense[] = Array.from({ length: 500 }, (_, i) => ({
      id: `e${i}`,
      date: '2026-04-01',
      category: ExpenseCategory.Vehicle,
      subCat: 'Fuel',
      amount: 100,
      paymentMethod: PaymentMethod.UpiBankAccount,
      isSettlement: false,
      note: '',
      isDeleted: false,
      createdAt: '2026-04-01T10:00:00Z',
      updatedAt: '2026-04-01T10:00:00Z',
      meta: {
        type: ExpenseMetaType.Fuel,
        liters: 40,
        pricePerLiter: 100,
        odometer: null,
        tripOdo: null,
        displayedMileage: null,
        fullTank: false,
      },
    }));
    expect(() =>
      withToast(
        <AutoTab
          expenses={expenses}
          onAdd={vi.fn().mockResolvedValue(true)}
          onUpdate={vi.fn().mockResolvedValue(true)}
          onDelete={vi.fn().mockResolvedValue(true)}
        />,
      ),
    ).not.toThrow();
  });
});

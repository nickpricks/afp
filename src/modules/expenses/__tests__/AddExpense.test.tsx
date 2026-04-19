import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

import { AddExpense } from '@/modules/expenses/components/AddExpense';
import { ToastProvider } from '@/shared/errors/toast-context';

const noop = vi.fn().mockResolvedValue(true);

const renderWithToast = (ui: React.ReactElement) => {
  return render(<ToastProvider>{ui}</ToastProvider>);
};

/** Returns the CC bubble (💳 CC — unique, unambiguous) */
function getCcBubble() {
  return screen.getByRole('button', { name: /💳\s*CC/ });
}

/** Returns all payment method bubbles (excludes "More...", category buttons, and submit) */
function getMethodBubbles() {
  return screen.getAllByRole('button').filter((b) => {
    const text = b.textContent?.trim() || '';
    return (
      b.getAttribute('type') === 'button' &&
      !text.includes('All') &&
      !text.includes('Less') &&
      text !== 'More...' &&
      // Categories have emojis but not these specific payment emojis
      (text.includes('📲') || text.includes('💳') || text.includes('💵') || text.includes('🏦'))
    );
  });
}

describe('AddExpense — amount presets', () => {
  it('renders preset amount buttons', () => {
    renderWithToast(<AddExpense onSubmit={noop} />);
    expect(screen.getByRole('button', { name: '+50' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+100' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+200' })).toBeInTheDocument();
  });

  it('tapping a preset fills the amount input', () => {
    renderWithToast(<AddExpense onSubmit={noop} />);
    const amountInput = screen.getByPlaceholderText('Amount') as HTMLInputElement;
    expect(amountInput.value).toBe('');

    fireEvent.click(screen.getByRole('button', { name: '+100' }));
    expect(amountInput.value).toBe('100');
  });

  it('tapping multiple presets adds them together', () => {
    renderWithToast(<AddExpense onSubmit={noop} />);
    const amountInput = screen.getByPlaceholderText('Amount') as HTMLInputElement;

    fireEvent.click(screen.getByRole('button', { name: '+50' }));
    expect(amountInput.value).toBe('50');

    fireEvent.click(screen.getByRole('button', { name: '+200' }));
    expect(amountInput.value).toBe('250');
  });
});

describe('AddExpense — amount input constraints', () => {
  it('has min attribute preventing zero/negative values', () => {
    renderWithToast(<AddExpense onSubmit={noop} />);
    const amountInput = screen.getByPlaceholderText('Amount');
    expect(amountInput).toHaveAttribute('min', '0.01');
  });

  it('has step attribute for decimal precision', () => {
    renderWithToast(<AddExpense onSubmit={noop} />);
    const amountInput = screen.getByPlaceholderText('Amount');
    expect(amountInput).toHaveAttribute('step', '0.01');
  });
});

describe('AddExpense — payment method bubbles', () => {
  it('deselects active payment method on second click', () => {
    renderWithToast(<AddExpense onSubmit={noop} />);

    const ccBubble = getCcBubble();

    // CC is not selected by default
    expect(ccBubble.className).not.toContain('bg-accent');

    // Click to select
    fireEvent.click(ccBubble);
    expect(ccBubble.className).toContain('bg-accent');

    // Click again to deselect
    fireEvent.click(ccBubble);
    expect(ccBubble.className).not.toContain('bg-accent');
  });

  it('allows no payment method selected (all deselected)', () => {
    renderWithToast(<AddExpense onSubmit={noop} />);

    // Find the default-selected bubble (UPI Bank) and deselect it
    const bubbles = getMethodBubbles();
    const activeBubble = bubbles.find((b) => b.className.includes('bg-accent'));
    expect(activeBubble).toBeDefined();

    fireEvent.click(activeBubble!);

    // Now no bubble should have accent styling
    const afterBubbles = getMethodBubbles();
    const stillActive = afterBubbles.filter((b) => b.className.includes('bg-accent'));
    expect(stillActive).toHaveLength(0);
  });

  it('submits null paymentMethod when none selected', async () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    renderWithToast(<AddExpense onSubmit={onSubmit} />);

    // Deselect the default-selected bubble
    const bubbles = getMethodBubbles();
    const activeBubble = bubbles.find((b) => b.className.includes('bg-accent'));
    fireEvent.click(activeBubble!);

    // Fill required fields and submit
    fireEvent.click(screen.getByRole('button', { name: /🏠/ })); // Select Housing
    fireEvent.change(screen.getByPlaceholderText('Amount'), { target: { value: '100' } });

    await act(async () => {
      fireEvent.submit(screen.getByRole('button', { name: 'Add Expense' }));
    });

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ paymentMethod: null }));
  });
});

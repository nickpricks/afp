import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { AddExpense } from '@/modules/expenses/components/AddExpense';

const noop = vi.fn().mockResolvedValue(true);

/** Returns the CC bubble (💳 CC — unique, unambiguous) */
function getCcBubble() {
  return screen.getByRole('button', { name: /💳\s*CC/ });
}

/** Returns all payment method bubbles (excludes "More..." and submit) */
function getMethodBubbles() {
  return screen.getAllByRole('button').filter(
    (b) => b.textContent !== 'More...' && b.getAttribute('type') === 'button',
  );
}

describe('AddExpense — amount presets', () => {
  it('renders preset amount buttons', () => {
    render(<AddExpense onSubmit={noop} />);
    expect(screen.getByRole('button', { name: '50' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '100' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '200' })).toBeInTheDocument();
  });

  it('tapping a preset fills the amount input', () => {
    render(<AddExpense onSubmit={noop} />);
    const amountInput = screen.getByPlaceholderText('Amount') as HTMLInputElement;
    expect(amountInput.value).toBe('');

    fireEvent.click(screen.getByRole('button', { name: '100' }));
    expect(amountInput.value).toBe('100');
  });

  it('tapping a different preset replaces the amount', () => {
    render(<AddExpense onSubmit={noop} />);
    const amountInput = screen.getByPlaceholderText('Amount') as HTMLInputElement;

    fireEvent.click(screen.getByRole('button', { name: '50' }));
    expect(amountInput.value).toBe('50');

    fireEvent.click(screen.getByRole('button', { name: '200' }));
    expect(amountInput.value).toBe('200');
  });
});

describe('AddExpense — amount input constraints', () => {
  it('has min attribute preventing zero/negative values', () => {
    render(<AddExpense onSubmit={noop} />);
    const amountInput = screen.getByPlaceholderText('Amount');
    expect(amountInput).toHaveAttribute('min', '0.01');
  });

  it('has step attribute for decimal precision', () => {
    render(<AddExpense onSubmit={noop} />);
    const amountInput = screen.getByPlaceholderText('Amount');
    expect(amountInput).toHaveAttribute('step', '0.01');
  });
});

describe('AddExpense — payment method bubbles', () => {
  it('deselects active payment method on second click', () => {
    render(<AddExpense onSubmit={noop} />);

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
    render(<AddExpense onSubmit={noop} />);

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
    render(<AddExpense onSubmit={onSubmit} />);

    // Deselect the default-selected bubble
    const bubbles = getMethodBubbles();
    const activeBubble = bubbles.find((b) => b.className.includes('bg-accent'));
    fireEvent.click(activeBubble!);

    // Fill required fields and submit
    fireEvent.change(screen.getByPlaceholderText('Amount'), { target: { value: '100' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Add Expense' }));

    await vi.waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ paymentMethod: null }),
      );
    });
  });
});

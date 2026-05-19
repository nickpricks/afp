import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmExpenseModal } from '@/modules/baby/components/ConfirmExpenseModal';

describe('ConfirmExpenseModal', () => {
  const baseProps = {
    open: true,
    amount: 100,
    description: 'Birthday cash',
    date: '2026-05-14',
    onConfirm: vi.fn(),
    onSkip: vi.fn(),
    onCancel: vi.fn(),
  };

  it('renders prefilled amount and description when open', () => {
    render(<ConfirmExpenseModal {...baseProps} />);
    expect(screen.getByText(/Birthday cash/i)).toBeInTheDocument();
    expect(screen.getByText(/100/)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    const { container } = render(<ConfirmExpenseModal {...baseProps} open={false} />);
    expect(container.querySelector('dialog[open]')).toBeNull();
  });

  it('calls onConfirm when Yes button clicked', () => {
    const onConfirm = vi.fn();
    render(<ConfirmExpenseModal {...baseProps} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole('button', { name: /yes/i }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('calls onSkip when Skip button clicked', () => {
    const onSkip = vi.fn();
    render(<ConfirmExpenseModal {...baseProps} onSkip={onSkip} />);
    fireEvent.click(screen.getByRole('button', { name: /skip/i }));
    expect(onSkip).toHaveBeenCalledOnce();
  });

  it('calls onCancel when Cancel button clicked', () => {
    const onCancel = vi.fn();
    render(<ConfirmExpenseModal {...baseProps} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});

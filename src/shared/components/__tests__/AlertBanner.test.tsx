import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AlertBanner } from '@/shared/components/AlertBanner';
import { NotificationType, AlertType, Severity } from '@/shared/types';
import type { Notification } from '@/shared/types';

const makeAlert = (overrides: Partial<Notification> = {}): Notification => ({
  id: 'alert-1',
  type: NotificationType.AdminAlert,
  message: 'Test maintenance notice',
  severity: Severity.Info,
  alertType: AlertType.Notice,
  shownTillDate: '2026-04-20',
  createdAt: '2026-04-14T10:00:00Z',
  read: false,
  dismissed: false,
  ...overrides,
});

describe('AlertBanner', () => {
  it('renders nothing when alerts is empty', () => {
    const { container } = render(<AlertBanner alerts={[]} onDismiss={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders alert message text', () => {
    render(<AlertBanner alerts={[makeAlert()]} onDismiss={vi.fn()} />);
    expect(screen.getByText(/Test maintenance notice/)).toBeInTheDocument();
  });

  it('shows dismiss button for notice type', () => {
    render(<AlertBanner alerts={[makeAlert({ alertType: AlertType.Notice })]} onDismiss={vi.fn()} />);
    expect(screen.getByLabelText('Dismiss alert')).toBeInTheDocument();
  });

  it('hides dismiss button for alert type', () => {
    render(<AlertBanner alerts={[makeAlert({ alertType: AlertType.Alert })]} onDismiss={vi.fn()} />);
    expect(screen.queryByLabelText('Dismiss alert')).not.toBeInTheDocument();
  });

  it('shows expiry date for non-dismissible alerts', () => {
    render(<AlertBanner alerts={[makeAlert({ alertType: AlertType.Alert, shownTillDate: '2026-04-20' })]} onDismiss={vi.fn()} />);
    expect(screen.getByText(/Expires 2026-04-20/)).toBeInTheDocument();
  });

  it('calls onDismiss with alert id when dismiss clicked', () => {
    const onDismiss = vi.fn();
    render(<AlertBanner alerts={[makeAlert({ id: 'a99' })]} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByLabelText('Dismiss alert'));
    expect(onDismiss).toHaveBeenCalledWith('a99');
  });

  it('renders multiple alerts stacked', () => {
    const alerts = [
      makeAlert({ id: 'a1', message: 'First notice' }),
      makeAlert({ id: 'a2', message: 'Second notice', severity: Severity.Warning }),
    ];
    render(<AlertBanner alerts={alerts} onDismiss={vi.fn()} />);
    expect(screen.getByText(/First notice/)).toBeInTheDocument();
    expect(screen.getByText(/Second notice/)).toBeInTheDocument();
  });
});

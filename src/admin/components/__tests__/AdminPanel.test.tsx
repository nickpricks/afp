import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AdminPanel } from '@/admin/components/AdminPanel';

vi.mock('@/admin/hooks/useAdminNotifications', () => ({
  useAdminNotifications: () => ({
    unreadCount: 2,
    moduleRequests: [],
    approveModuleRequest: vi.fn(),
    sendAlert: vi.fn(),
    ready: true,
  }),
}));

vi.mock('@/admin/components/InvitesTab', () => ({
  InvitesTab: () => <div data-testid="invites-tab">Invites</div>,
}));

vi.mock('@/admin/components/UsersTab', () => ({
  UsersTab: () => <div data-testid="users-tab">Users</div>,
}));

vi.mock('@/admin/components/BroadcastsTab', () => ({
  BroadcastsTab: () => <div data-testid="broadcasts-tab">Broadcasts</div>,
}));

describe('AdminPanel', () => {
  it('renders three tab buttons', () => {
    render(<AdminPanel />);
    expect(screen.getByRole('button', { name: 'Invites' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Users/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Broadcasts' })).toBeInTheDocument();
  });

  it('defaults to Invites tab', () => {
    render(<AdminPanel />);
    expect(screen.getByTestId('invites-tab')).toBeInTheDocument();
  });

  it('switches to Users tab', () => {
    render(<AdminPanel />);
    fireEvent.click(screen.getByRole('button', { name: /Users/ }));
    expect(screen.getByTestId('users-tab')).toBeInTheDocument();
  });

  it('switches to Broadcasts tab', () => {
    render(<AdminPanel />);
    fireEvent.click(screen.getByRole('button', { name: 'Broadcasts' }));
    expect(screen.getByTestId('broadcasts-tab')).toBeInTheDocument();
  });

  it('shows unread badge on Users tab', () => {
    render(<AdminPanel />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});

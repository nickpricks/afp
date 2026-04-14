import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BroadcastsTab } from '@/admin/components/BroadcastsTab';

const mockSendAlert = vi.fn();

vi.mock('@/admin/hooks/useAdminNotifications', () => ({
  useAdminNotifications: () => ({
    sendAlert: mockSendAlert,
    moduleRequests: [],
    unreadCount: 0,
    ready: true,
  }),
}));

vi.mock('@/admin/hooks/useAllUsers', () => ({
  useAllUsers: () => ({
    users: [
      { uid: 'admin-1', name: 'Admin', role: 'theAdminNick', modules: {} },
      { uid: 'user-1', name: 'Priya', role: 'user', modules: {} },
      { uid: 'user-2', name: 'Ravi', role: 'user', modules: {} },
    ],
    loading: false,
  }),
}));

vi.mock('@/shared/utils/date', () => ({
  todayStr: () => '2026-04-14',
}));

describe('BroadcastsTab', () => {
  it('renders compose form with all controls', () => {
    render(<BroadcastsTab />);
    expect(screen.getByPlaceholderText('Alert message...')).toBeInTheDocument();
    expect(screen.getByText(/Send Broadcast/)).toBeInTheDocument();
    expect(screen.getByText(/All users/)).toBeInTheDocument();
  });

  it('send button is disabled when message is empty', () => {
    render(<BroadcastsTab />);
    const btn = screen.getByText(/Send Broadcast/);
    expect(btn).toBeDisabled();
  });

  it('shows user picker when "Specific user" selected', () => {
    render(<BroadcastsTab />);
    fireEvent.click(screen.getByText('Specific user'));
    expect(screen.getByText('Select user...')).toBeInTheDocument();
    expect(screen.getByText('Priya')).toBeInTheDocument();
    expect(screen.getByText('Ravi')).toBeInTheDocument();
  });

  it('excludes admin from user count and picker', () => {
    render(<BroadcastsTab />);
    // "All users (2)" — admin excluded
    expect(screen.getByText(/All users \(2\)/)).toBeInTheDocument();
  });
});

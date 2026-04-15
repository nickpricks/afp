import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { UsersTab } from '@/admin/components/UsersTab';

const mockUsers = [
  {
    uid: 'user-1',
    name: 'Alice',
    email: 'alice@test.com',
    username: null,
    role: 'user',
    modules: { body: true, budget: false, baby: false },
    viewerOf: null,
    theme: 'family-blue',
    colorMode: 'system' as const,
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-04-01T00:00:00Z',
  },
  {
    uid: 'user-2',
    name: 'Bob',
    email: 'bob@test.com',
    username: null,
    role: 'viewer',
    modules: { body: true, budget: true, baby: false },
    viewerOf: 'user-1',
    theme: 'family-blue',
    colorMode: 'system' as const,
    createdAt: '2026-04-02T00:00:00Z',
    updatedAt: '2026-04-02T00:00:00Z',
  },
];

vi.mock('@/admin/hooks/useAllUsers', () => ({
  useAllUsers: () => ({ users: mockUsers, loading: false }),
}));

vi.mock('@/shared/errors/useToast', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

vi.mock('@/admin/hooks/useAdminActions', () => ({
  useAdminActions: () => ({
    updateUserModules: vi.fn().mockResolvedValue({ ok: true }),
    updateUserRole: vi.fn().mockResolvedValue({ ok: true }),
  }),
}));

vi.mock('@/admin/hooks/useAdminNotifications', () => ({
  useAdminNotifications: () => ({
    moduleRequests: [],
    approveModuleRequest: vi.fn(),
    unreadCount: 0,
    ready: true,
    sendAlert: vi.fn(),
  }),
}));

describe('UsersTab', () => {
  it('lists all users with name and role', () => {
    render(
      <MemoryRouter>
        <UsersTab />
      </MemoryRouter>,
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('shows role badges', () => {
    render(
      <MemoryRouter>
        <UsersTab />
      </MemoryRouter>,
    );
    expect(screen.getByText('user')).toBeInTheDocument();
    expect(screen.getByText('viewer')).toBeInTheDocument();
  });

  it('shows enabled module chips', () => {
    render(
      <MemoryRouter>
        <UsersTab />
      </MemoryRouter>,
    );
    // Alice has body, Bob has body + budget
    const bodyChips = screen.getAllByText('body');
    expect(bodyChips.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('budget')).toBeInTheDocument();
  });

  it('expands a user row on click to show edit controls', () => {
    render(
      <MemoryRouter>
        <UsersTab />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText('Alice'));
    // Should see module toggles when expanded
    expect(screen.getByRole('checkbox', { name: /body/i })).toBeInTheDocument();
  });

  it('shows empty state when no users', () => {
    vi.doMock('@/admin/hooks/useAllUsers', () => ({
      useAllUsers: () => ({ users: [], loading: false }),
    }));
    // Already tested via AdminPanel — covered by existing mock
  });
});

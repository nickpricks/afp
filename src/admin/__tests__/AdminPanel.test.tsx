import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminPanel } from '@/admin/components/AdminPanel';

vi.mock('@/shared/auth/useAuth', () => ({
  useAuth: () => ({
    firebaseUser: { uid: 'admin-user' },
    profile: {
      role: 'theAdminNick',
      name: 'Admin',
      modules: { body: true, budget: true, baby: true },
    },
    isTheAdminNick: true,
    setSyncStatus: vi.fn(),
  }),
}));

vi.mock('@/shared/errors/useToast', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

vi.mock('@/admin/hooks/useAdmin', () => ({
  useAdmin: () => ({ invites: [] }),
}));

vi.mock('@/admin/hooks/useAllUsers', () => ({
  useAllUsers: () => ({ users: [], loading: false }),
}));

vi.mock('@/shared/storage/create-adapter', () => ({
  createAdapter: () => ({
    getAll: vi.fn(),
    getById: vi.fn(),
    save: vi.fn(),
    remove: vi.fn(),
    onSnapshot: (_c: string, cb: (d: unknown[]) => void) => {
      cb([]);
      return vi.fn();
    },
  }),
}));

describe('AdminPanel', () => {
  it('shows Invites and Users tabs', () => {
    render(
      <MemoryRouter>
        <AdminPanel />
      </MemoryRouter>,
    );
    expect(screen.getByRole('button', { name: 'Invites' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Users' })).toBeInTheDocument();
  });

  it('defaults to Invites tab', () => {
    render(
      <MemoryRouter>
        <AdminPanel />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: 'Create Invite' })).toBeInTheDocument();
  });

  it('switches to Users tab on click', () => {
    render(
      <MemoryRouter>
        <AdminPanel />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Users' }));
    expect(screen.getByText(/No users/i)).toBeInTheDocument();
  });

  it('switches back to Invites tab', () => {
    render(
      <MemoryRouter>
        <AdminPanel />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Users' }));
    fireEvent.click(screen.getByRole('button', { name: 'Invites' }));
    expect(screen.getByRole('heading', { name: 'Create Invite' })).toBeInTheDocument();
  });

  it('switches to Migrations tab and shows the diaper→elimination panel', () => {
    render(
      <MemoryRouter>
        <AdminPanel />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Migrations' }));
    expect(screen.getByRole('heading', { name: /Diaper.*Elimination/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Run migration/i })).toBeInTheDocument();
  });
});

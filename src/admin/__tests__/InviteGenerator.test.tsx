import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { InviteGenerator } from '@/admin/components/InviteGenerator';

vi.mock('@/shared/auth/useAuth', () => ({
  useAuth: () => ({ firebaseUser: { uid: 'admin-uid' }, setSyncStatus: vi.fn() }),
}));

vi.mock('@/shared/errors/useToast', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

vi.mock('@/admin/hooks/useAllUsers', () => ({
  useAllUsers: () => ({
    users: [
      {
        uid: 'user-1',
        name: 'Alice',
        role: 'user',
        modules: { body: true, budget: false, baby: false },
      },
      {
        uid: 'user-2',
        name: 'Bob',
        role: 'user',
        modules: { body: true, budget: true, baby: false },
      },
    ],
    loading: false,
  }),
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

describe('InviteGenerator — role selector', () => {
  it('shows role selector with User and Viewer options', () => {
    render(
      <MemoryRouter>
        <InviteGenerator />
      </MemoryRouter>,
    );
    expect(screen.getByRole('button', { name: 'User' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Viewer' })).toBeInTheDocument();
  });

  it('defaults to User role (no "View of" picker)', () => {
    render(
      <MemoryRouter>
        <InviteGenerator />
      </MemoryRouter>,
    );
    expect(screen.queryByText(/view of/i)).not.toBeInTheDocument();
  });

  it('shows "View of" user picker when Viewer role selected', () => {
    render(
      <MemoryRouter>
        <InviteGenerator />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Viewer' }));
    expect(screen.getByText(/view of/i)).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('hides "View of" picker when switching back to User', () => {
    render(
      <MemoryRouter>
        <InviteGenerator />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Viewer' }));
    expect(screen.getByText(/view of/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'User' }));
    expect(screen.queryByText(/view of/i)).not.toBeInTheDocument();
  });
});

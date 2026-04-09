import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminClaim } from '@/shared/components/AdminClaim';

vi.mock('@/shared/auth/useAuth', () => ({
  useAuth: () => ({
    firebaseUser: { uid: 'anon-uid', isAnonymous: true, displayName: null },
    profile: null,
    isTheAdminNick: false,
    isLoading: false,
    syncStatus: 'synced',
    setSyncStatus: vi.fn(),
  }),
}));

vi.mock('@/shared/errors/useToast', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

vi.mock('@/shared/auth/the-admin-nick', () => ({
  initializeAdmin: vi.fn().mockResolvedValue({ ok: true }),
  isAppClaimed: vi.fn().mockResolvedValue(false),
}));

vi.mock('@/shared/auth/google-auth', () => ({
  signInWithGoogle: vi.fn().mockResolvedValue({ ok: true }),
}));

describe('AdminClaim', () => {
  it('shows claim screen with app name', () => {
    render(<MemoryRouter><AdminClaim /></MemoryRouter>);
    expect(screen.getByText(/hasn't been set up yet/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /claim as admin/i })).toBeInTheDocument();
  });

  it('shows Google sign-in prompt when anonymous user clicks claim', async () => {
    render(<MemoryRouter><AdminClaim /></MemoryRouter>);
    screen.getByRole('button', { name: /claim as admin/i }).click();
    // Anonymous user should be prompted to sign in with Google first
    expect(await screen.findByText(/sign in with google first/i)).toBeInTheDocument();
  });

  it('shows ownership warning', () => {
    render(<MemoryRouter><AdminClaim /></MemoryRouter>);
    expect(screen.getByText(/only do this if you own/i)).toBeInTheDocument();
  });
});

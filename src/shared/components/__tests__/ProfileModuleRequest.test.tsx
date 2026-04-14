import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const mockRequestModule = vi.fn();

vi.mock('@/shared/hooks/useModuleRequest', () => ({
  useModuleRequest: () => ({ requestModule: mockRequestModule }),
}));

vi.mock('@/shared/auth/useAuth', () => ({
  useAuth: () => ({
    firebaseUser: { uid: 'user-1', isAnonymous: false, photoURL: null },
    profile: {
      name: 'Test User',
      role: 'user',
      modules: { body: true, budget: false, baby: false },
      requestedModules: ['baby'],
      theme: 'family-blue',
      colorMode: 'dark',
    },
    isLoading: false,
    isTheAdminNick: false,
    adminUid: 'admin-1',
    syncStatus: 'synced',
    setSyncStatus: vi.fn(),
  }),
}));

vi.mock('@/shared/errors/useToast', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

vi.mock('@/shared/auth/firebase-config', () => ({
  isFirebaseConfigured: false,
  auth: {},
  db: {},
}));

vi.mock('firebase/auth', () => ({
  signOut: vi.fn(),
}));

vi.mock('@/shared/storage/create-adapter', () => ({
  createAdapter: () => ({
    save: vi.fn().mockResolvedValue({ ok: true, data: undefined }),
    getAll: vi.fn().mockResolvedValue({ ok: true, data: [] }),
    getById: vi.fn().mockResolvedValue({ ok: false, error: 'not found' }),
    remove: vi.fn().mockResolvedValue({ ok: true, data: undefined }),
    onSnapshot: vi.fn().mockReturnValue(() => {}),
  }),
}));

vi.mock('@/constants/config', () => ({
  CONFIG: {
    APP_NAME: 'It Started On April Fools Day',
    SHORT_NAME: 'AFP',
    VERSION: '0.1.0',
    DEFAULT_THEME: 'family-blue',
    CURRENCY_SYMBOL: '\u20B9',
    METERS_PER_FLOOR: 3,
    INVITE_CODE_LENGTH: 12,
    INVITE_CODE_CHARSET: 'abcdefghijklmnopqrstuvwxyz0123456789',
    DEV_INVITES_KEY: 'afp:dev:invites',
  },
}));

import { ProfilePage } from '@/shared/components/ProfilePage';

/** Wraps a component in MemoryRouter for tests */
function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('ProfilePage module request UI', () => {
  it('shows "Request" button for disabled unrequested modules', () => {
    renderWithRouter(<ProfilePage />);
    const buttons = screen.getAllByRole('button', { name: 'Request' });
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it('shows "Requested" chip for already-requested modules', () => {
    renderWithRouter(<ProfilePage />);
    expect(screen.getByText('Requested')).toBeInTheDocument();
  });

  it('does not show Request button for enabled modules', () => {
    renderWithRouter(<ProfilePage />);
    const bodyRow = screen.getByText('Body & Fitness').closest('li');
    expect(bodyRow?.querySelector('button')).toBeNull();
  });

  it('calls requestModule when Request button is clicked', () => {
    renderWithRouter(<ProfilePage />);
    const requestButton = screen.getAllByRole('button', { name: 'Request' })[0];
    fireEvent.click(requestButton);
    expect(mockRequestModule).toHaveBeenCalledWith('budget');
  });
});

import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { ProfilePage } from '@/shared/components/ProfilePage';
import { ModuleId, UserRole, type UserProfile } from '@/shared/types';
import { THEME_DEFINITIONS } from '@/themes/themes';

// Mock firebase/auth signOut
vi.mock('firebase/auth', () => ({
  signOut: vi.fn(),
}));

// Mock config to break circular dependency with themes
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

// Mock firebase-config to disable Firebase
vi.mock('@/shared/auth/firebase-config', () => ({
  isFirebaseConfigured: false,
  auth: {},
  db: {},
}));

// Mock create-adapter so save calls don't fail
vi.mock('@/shared/storage/create-adapter', () => ({
  createAdapter: () => ({
    save: vi.fn().mockResolvedValue({ ok: true, data: undefined }),
    getAll: vi.fn().mockResolvedValue({ ok: true, data: [] }),
    getById: vi.fn().mockResolvedValue({ ok: false, error: 'not found' }),
    remove: vi.fn().mockResolvedValue({ ok: true, data: undefined }),
    onSnapshot: vi.fn().mockReturnValue(() => {}),
  }),
}));

const mockProfile: UserProfile = {
  name: 'Test User',
  role: UserRole.User,
  modules: {
    [ModuleId.Body]: true,
    [ModuleId.Expenses]: false,
    [ModuleId.Baby]: true,
  },
  theme: 'family-blue',
  colorMode: 'system',
  createdAt: '2026-04-01T00:00:00.000Z',
};

const mockFirebaseUser = {
  uid: 'test-uid',
  displayName: 'Test User',
  email: 'test@example.com',
  photoURL: 'https://example.com/photo.jpg',
  isAnonymous: false,
};

vi.mock('@/shared/auth/useAuth', () => ({
  useAuth: () => ({
    firebaseUser: mockFirebaseUser,
    profile: mockProfile,
    isTheAdminNick: false,
    isLoading: false,
    syncStatus: 'synced',
    setSyncStatus: vi.fn(),
  }),
}));

vi.mock('@/shared/errors/useToast', () => ({
  useToast: () => ({
    addToast: vi.fn(),
  }),
}));

/** Wraps a component in MemoryRouter for tests */
function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('ProfilePage', () => {
  it('renders the user display name', () => {
    renderWithRouter(<ProfilePage />);
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('renders the user email', () => {
    renderWithRouter(<ProfilePage />);
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('renders the user photo', () => {
    const { container } = renderWithRouter(<ProfilePage />);
    const img = container.querySelector('img[src="https://example.com/photo.jpg"]');
    expect(img).toBeInTheDocument();
  });

  it('renders all 7 theme swatches', () => {
    renderWithRouter(<ProfilePage />);
    const themeGrid = screen.getByTestId('theme-grid');
    const buttons = themeGrid.querySelectorAll('button');
    expect(buttons).toHaveLength(Object.keys(THEME_DEFINITIONS).length);
  });

  it('renders color mode picker with three options', () => {
    renderWithRouter(<ProfilePage />);
    const picker = screen.getByTestId('color-mode-picker');
    const buttons = picker.querySelectorAll('button');
    expect(buttons).toHaveLength(3);
    expect(screen.getByText('Light')).toBeInTheDocument();
    expect(screen.getByText('Dark')).toBeInTheDocument();
    expect(screen.getByText('System')).toBeInTheDocument();
  });

  it('renders enabled modules', () => {
    renderWithRouter(<ProfilePage />);
    expect(screen.getByText('Body & Fitness')).toBeInTheDocument();
    expect(screen.getByText('Baby Tracker')).toBeInTheDocument();
    expect(screen.queryByText('Expenses')).not.toBeInTheDocument();
  });

  it('renders app info in about section', () => {
    renderWithRouter(<ProfilePage />);
    expect(screen.getByText('Debug Info')).toBeInTheDocument();
  });

  it('shows Set Username button when no username is set', () => {
    renderWithRouter(<ProfilePage />);
    expect(screen.getByText('Set Username')).toBeInTheDocument();
  });

  it('shows dev mode text when Firebase is not configured', () => {
    renderWithRouter(<ProfilePage />);
    expect(screen.getByText(/Dev Mode/)).toBeInTheDocument();
  });
});

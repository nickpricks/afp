import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProfilePage } from '@/shared/components/ProfilePage';

/**
 * Negative security tests — verify that a regular user's profile page
 * does NOT expose controls for role, modules, or viewerOf.
 * These fields are admin-only (Firestore rules enforce server-side).
 */

vi.mock('@/shared/auth/useAuth', () => ({
  useAuth: () => ({
    firebaseUser: { uid: 'user-uid', isAnonymous: false, displayName: 'Regular User', email: 'user@test.com', photoURL: null },
    profile: {
      role: 'user',
      name: 'Regular User',
      email: 'user@test.com',
      username: null,
      viewerOf: null,
      theme: 'family-blue',
      colorMode: 'system',
      modules: { body: true, budget: false, baby: false },
      createdAt: '2026-04-01T00:00:00Z',
      updatedAt: '2026-04-01T00:00:00Z',
    },
    isTheAdminNick: false,
    isLoading: false,
    syncStatus: 'synced',
    setSyncStatus: vi.fn(),
  }),
}));

vi.mock('@/shared/errors/useToast', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

vi.mock('@/themes/themes', () => ({
  ThemeId: { FamilyBlue: 'family-blue' },
  THEME_DEFINITIONS: {
    'family-blue': { id: 'family-blue', name: 'Family Blue', family: 'Family', darkOnly: false, fonts: { display: 'Syne', body: 'system-ui' }, previewColors: { bg: '#f0f7ff', accent: '#60a5fa', text: '#1e293b' } },
  },
  themeClass: (id: string) => `theme-${id}`,
  applyTheme: vi.fn(),
  useActiveThemeId: () => 'family-blue',
  isValidThemeId: () => true,
}));

vi.mock('@/constants/config', () => ({
  CONFIG: {
    APP_NAME: 'AFP',
    SHORT_NAME: 'AFP',
    VERSION: '0.1.0',
    DEFAULT_THEME: 'family-blue',
    CURRENCY_SYMBOL: '₹',
    METERS_PER_FLOOR: 3,
    INVITE_CODE_LENGTH: 12,
    INVITE_CODE_CHARSET: 'abcdefghijklmnopqrstuvwxyz0123456789',
    DEV_INVITES_KEY: 'afp:dev:invites',
    METERS_PER_KM: 1000,
    PAGE_SIZE: 25,
    UNDO_DURATION_MS: 10000,
    DAILY_SCORE_GOAL: 50,
  },
}));

vi.mock('@/shared/storage/create-adapter', () => ({
  createAdapter: () => ({
    getAll: vi.fn(),
    getById: vi.fn(),
    save: vi.fn().mockResolvedValue({ ok: true }),
    remove: vi.fn(),
    onSnapshot: (_c: string, cb: (d: unknown[]) => void) => { cb([]); return vi.fn(); },
  }),
}));

describe('Profile security — regular user', () => {
  it('does NOT show a role changer', () => {
    render(<MemoryRouter><ProfilePage /></MemoryRouter>);
    // No dropdown or input to change role
    expect(screen.queryByLabelText(/role/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/theAdminNick/i)).not.toBeInTheDocument();
  });

  it('does NOT show module toggles', () => {
    render(<MemoryRouter><ProfilePage /></MemoryRouter>);
    // Module section shows read-only status, no checkboxes to toggle
    const checkboxes = screen.queryAllByRole('checkbox');
    // There may be checkboxes for theme/color, but none labeled body/budget/baby
    const moduleCheckboxes = checkboxes.filter((cb) => {
      const label = cb.getAttribute('aria-label') ?? '';
      return /body|budget|baby/i.test(label);
    });
    expect(moduleCheckboxes).toHaveLength(0);
  });

  it('does NOT show viewerOf editor', () => {
    render(<MemoryRouter><ProfilePage /></MemoryRouter>);
    expect(screen.queryByLabelText(/viewer of/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/viewerOf/)).not.toBeInTheDocument();
  });

  it('shows profile name', () => {
    render(<MemoryRouter><ProfilePage /></MemoryRouter>);
    expect(screen.getByText('Regular User')).toBeInTheDocument();
  });
});

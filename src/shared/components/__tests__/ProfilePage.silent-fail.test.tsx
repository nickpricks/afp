import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { ModuleId, UserRole, type UserProfile } from '@/shared/types';

// vi.hoisted lets us share mock instances between vi.mock factories and per-test setup.
// The shared `mockSave` lets each test control adapter behavior (resolve vs reject), and
// `mockAddToast` lets us assert the user-facing surface (must NOT toast on slider/picker fail).
const mocks = vi.hoisted(() => ({
  mockSave: vi.fn(),
  mockAddToast: vi.fn(),
  consoleErrorSpy: vi.fn(),
}));

vi.mock('firebase/auth', () => ({ signOut: vi.fn() }));

vi.mock('@/constants/config', () => ({
  CONFIG: {
    APP_NAME: 'It Started On April Fools Day',
    SHORT_NAME: 'AFP',
    VERSION: '0.1.0',
    DEFAULT_THEME: 'family-blue',
    CURRENCY_SYMBOL: '₹',
    METERS_PER_FLOOR: 3,
    INVITE_CODE_LENGTH: 12,
    INVITE_CODE_CHARSET: 'abcdefghijklmnopqrstuvwxyz0123456789',
    DEV_INVITES_KEY: 'afp:dev:invites',
  },
}));

vi.mock('@/shared/auth/firebase-config', () => ({
  isFirebaseConfigured: false,
  auth: {},
  db: {},
}));

vi.mock('@/shared/storage/create-adapter', () => ({
  createAdapter: () => ({
    save: mocks.mockSave,
    getAll: vi.fn().mockResolvedValue({ ok: true, data: [] }),
    getById: vi.fn().mockResolvedValue({ ok: false, error: 'not found' }),
    remove: vi.fn().mockResolvedValue({ ok: true, data: undefined }),
    onSnapshot: vi.fn().mockReturnValue(() => {}),
  }),
}));

vi.mock('@/shared/errors/useToast', () => ({
  useToast: () => ({ addToast: mocks.mockAddToast }),
}));

const mockProfile: UserProfile = {
  name: 'Test User',
  role: UserRole.User,
  modules: { [ModuleId.Body]: true, [ModuleId.Budget]: false, [ModuleId.Baby]: true },
  theme: 'family-blue',
  colorMode: 'system',
  effectIntensity: 50,
  effectSize: 100,
  createdAt: '2026-04-01T00:00:00.000Z',
};

vi.mock('@/shared/auth/useAuth', () => ({
  useAuth: () => ({
    firebaseUser: {
      uid: 'test-uid',
      displayName: 'Test User',
      email: 'test@example.com',
      photoURL: null,
      isAnonymous: false,
    },
    profile: mockProfile,
    isTheAdminNick: false,
    isLoading: false,
    syncStatus: 'synced',
    setSyncStatus: vi.fn(),
  }),
}));

// verbose.isVerbose() reads localStorage directly; the verr() always logs via console.error.
// We spy on console.error so we can assert the silent-fail handler logged through verr().

import { ProfilePage } from '@/shared/components/ProfilePage';

describe('ProfilePage silent-fail contract', () => {
  beforeEach(() => {
    mocks.mockSave.mockReset();
    mocks.mockAddToast.mockReset();
    mocks.consoleErrorSpy.mockReset();
    vi.spyOn(console, 'error').mockImplementation(mocks.consoleErrorSpy);
  });

  /** Click "Small" tier on the SizeTierPicker (visible after the user expands "Customize"). */
  const clickSmallTier = (): void => {
    fireEvent.click(screen.getByText('Customize'));
    const picker = screen.getByTestId('size-tier-picker');
    const smallButton = picker.querySelector('button') as HTMLButtonElement;
    fireEvent.click(smallButton);
  };

  it('size picker: when adapter.save rejects, logs to console.error and does NOT toast the user', async () => {
    mocks.mockSave.mockRejectedValue(new Error('Firestore permission-denied'));

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );
    clickSmallTier();

    // Allow the rejected promise's catch handler to run.
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Logged through verr() → console.error with our prefix
    expect(mocks.consoleErrorSpy).toHaveBeenCalled();
    const loggedArgs = mocks.consoleErrorSpy.mock.calls.flat();
    expect(loggedArgs.some((a) => String(a).includes('[AFP:profile:save]'))).toBe(true);
    expect(loggedArgs.some((a) => String(a).includes('effectSize'))).toBe(true);

    // User-facing surface is silent — no toast on slider/picker rejection.
    expect(mocks.mockAddToast).not.toHaveBeenCalled();
  });

  it('size picker: when adapter.save succeeds, neither toast nor error is logged', async () => {
    mocks.mockSave.mockResolvedValue({ ok: true, data: undefined });

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );
    clickSmallTier();

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(mocks.mockSave).toHaveBeenCalled();
    expect(mocks.mockAddToast).not.toHaveBeenCalled();
    // No error logged on the happy path (consoleErrorSpy may catch unrelated React warnings,
    // but it should NOT see our '[AFP:profile:save]' prefix).
    const errorArgs = mocks.consoleErrorSpy.mock.calls.flat();
    expect(errorArgs.some((a) => String(a).includes('[AFP:profile:save]'))).toBe(false);
  });

  it('size picker: when adapter.save returns Result.ok=false, logs the error and stays silent toward user', async () => {
    // The Result-discipline contract: a save that resolves with `{ ok: false }` must be logged
    // through verr() so a permission regression is visible in the console, while the slider
    // path stays silent toward the user (matching the rejection path).
    mocks.mockSave.mockResolvedValue({ ok: false, error: 'permission-denied' });

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );
    clickSmallTier();

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(mocks.consoleErrorSpy).toHaveBeenCalled();
    const loggedArgs = mocks.consoleErrorSpy.mock.calls.flat();
    expect(loggedArgs.some((a) => String(a).includes('[AFP:profile:save]'))).toBe(true);
    expect(loggedArgs.some((a) => String(a).includes('effectSize'))).toBe(true);
    expect(loggedArgs.some((a) => String(a).includes('permission-denied'))).toBe(true);

    // User-facing surface stays silent on slider/picker save failure.
    expect(mocks.mockAddToast).not.toHaveBeenCalled();
  });
});

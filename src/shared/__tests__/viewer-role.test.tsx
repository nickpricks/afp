import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { Dashboard } from '@/shared/components/Dashboard';
import { UserRole } from '@/shared/types';

// ─── Mocks ──────────────────────────────────────────────────────────────────

vi.mock('@/shared/auth/useAuth', () => ({
  useAuth: () => ({
    firebaseUser: { uid: 'viewer-uid' },
    profile: {
      role: UserRole.Viewer,
      name: 'Viewer User',
      viewerOf: 'target-uid',
      modules: { body: true, budget: true, baby: false },
      email: null,
      username: null,
      theme: 'family-blue',
      colorMode: 'system',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
    isTheAdminNick: false,
    isLoading: false,
    syncStatus: 'synced',
    setSyncStatus: vi.fn(),
  }),
}));

vi.mock('@/modules/body/hooks/useBodyConfig', () => ({
  useBodyConfig: () => ({
    config: {
      floors: true,
      walking: true,
      running: false,
      cycling: false,
      yoga: false,
      floorHeight: 3,
      dailyGoal: 50,
      configuredAt: '2026-01-01',
    },
    isConfigured: true,
    loading: false,
    saveConfig: vi.fn(),
  }),
}));

vi.mock('@/modules/body/hooks/useBodyData', () => ({
  useBodyData: () => ({
    records: {},
    todayRecord: {
      dateStr: '2026-04-09',
      up: 0,
      down: 0,
      walkMeters: 0,
      runMeters: 0,
      total: 0,
      updatedAt: '',
    },
    activities: [],
    todayActivities: [],
    tap: vi.fn(),
    logActivity: vi.fn(),
    saveRecord: vi.fn(),
    updateActivity: vi.fn(),
  }),
}));

vi.mock('@/modules/expenses/hooks/useExpenses', () => ({
  useExpenses: () => ({
    expenses: [],
    addExpense: vi.fn(),
    deleteExpense: vi.fn(),
  }),
}));

vi.mock('@/modules/expenses/hooks/useIncome', () => ({
  useIncome: () => ({
    income: [],
    addIncome: vi.fn(),
    deleteIncome: vi.fn(),
  }),
}));

vi.mock('@/modules/baby/hooks/useChildren', () => ({
  useChildren: () => ({
    children: [],
    addChild: vi.fn(),
    updateChild: vi.fn(),
    loading: false,
  }),
}));

vi.mock('@/admin/hooks/useAllUsers', () => ({
  useAllUsers: () => ({
    users: [
      {
        uid: 'target-uid',
        name: 'Target User',
        role: 'user',
        email: null,
        username: null,
        viewerOf: null,
        theme: 'family-blue',
        colorMode: 'system',
        modules: { body: true, budget: true, baby: false },
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ],
    loading: false,
  }),
}));

vi.mock('@/shared/errors/useToast', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

// ─── Helper ─────────────────────────────────────────────────────────────────

function renderDashboard() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Dashboard />
    </MemoryRouter>,
  );
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('Viewer role — Dashboard (2e.7)', () => {
  it('shows the viewer banner with target user name', () => {
    renderDashboard();

    expect(screen.getByText(/Viewing Target User's data/)).toBeInTheDocument();
  });

  it('does not show the admin user selector', () => {
    renderDashboard();

    // The admin selector has a "Viewing" label inside a <select> container
    // but the viewer banner text is different. Verify no <select> element.
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('renders enabled module cards (Body, Budget) but not disabled ones (Baby)', () => {
    renderDashboard();

    expect(screen.getByText('Body')).toBeInTheDocument();
    expect(screen.getByText('Budget')).toBeInTheDocument();
    expect(screen.queryByText('Baby')).not.toBeInTheDocument();
  });

  it('shows the greeting with the viewer profile name', () => {
    renderDashboard();

    // The greeting includes the profile name
    expect(screen.getByText(/Viewer User/)).toBeInTheDocument();
  });
});

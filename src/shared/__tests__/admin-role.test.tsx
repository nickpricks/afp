import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { Dashboard } from '@/shared/components/Dashboard';
import { UserRole } from '@/shared/types';

// ─── Mocks ──────────────────────────────────────────────────────────────────

vi.mock('@/shared/auth/useAuth', () => ({
  useAuth: () => ({
    firebaseUser: { uid: 'admin-uid' },
    profile: {
      role: UserRole.TheAdminNick,
      name: 'Admin',
      viewerOf: null,
      modules: { body: true, budget: true, baby: true },
      email: null,
      username: null,
      theme: 'family-blue',
      colorMode: 'system',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
    isTheAdminNick: true,
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
      running: true,
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
      up: 5,
      down: 3,
      walkMeters: 1200,
      runMeters: 500,
      total: 12,
      updatedAt: '2026-04-09T10:00:00Z',
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
        uid: 'admin-uid',
        name: 'Admin',
        role: 'theAdminNick',
        email: null,
        username: null,
        viewerOf: null,
        theme: 'family-blue',
        colorMode: 'system',
        modules: { body: true, budget: true, baby: true },
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      {
        uid: 'user-1',
        name: 'Regular User',
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

describe('Admin role — Dashboard (2e.8)', () => {
  it('shows the user selector dropdown', () => {
    renderDashboard();

    const selector = screen.getByRole('combobox');
    expect(selector).toBeInTheDocument();
  });

  it('includes "My Data" and other users in the selector', () => {
    renderDashboard();

    expect(screen.getByText('My Data')).toBeInTheDocument();
    expect(screen.getByText('Regular User')).toBeInTheDocument();
  });

  it('renders all three module cards (Body, Budget, Baby)', () => {
    renderDashboard();

    expect(screen.getByText('Body')).toBeInTheDocument();
    expect(screen.getByText('Budget')).toBeInTheDocument();
    expect(screen.getByText('Baby')).toBeInTheDocument();
  });

  it('does NOT show the viewer banner', () => {
    renderDashboard();

    // Viewer banner contains "Viewing <name>'s data" — should not appear for admin
    expect(screen.queryByText(/Viewing.*'s data/)).not.toBeInTheDocument();
  });

  it('shows the greeting with admin profile name', () => {
    renderDashboard();

    expect(screen.getByText(/Admin/)).toBeInTheDocument();
  });
});

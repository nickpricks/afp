import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { AdminGate } from '@/shared/components/AdminGate';
import { ModuleGate } from '@/shared/components/ModuleGate';
import { Dashboard } from '@/shared/components/Dashboard';
import { ModuleId, UserRole } from '@/shared/types';

// ─── Shared mock state ──────────────────────────────────────────────────────

let mockAuth: Record<string, unknown> = {};

vi.mock('@/shared/auth/useAuth', () => ({
  useAuth: () => mockAuth,
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
  useAllUsers: () => ({ users: [], loading: false }),
}));

vi.mock('@/shared/errors/useToast', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeProfile(overrides: Record<string, unknown> = {}) {
  return {
    role: UserRole.User,
    name: 'Test User',
    viewerOf: null,
    modules: { body: true, budget: true, baby: false },
    email: null,
    username: null,
    theme: 'family-blue',
    colorMode: 'system',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    ...overrides,
  };
}

function setAuthAs(role: 'admin' | 'user' | 'viewer' | 'none') {
  if (role === 'admin') {
    mockAuth = {
      firebaseUser: { uid: 'admin-uid' },
      profile: makeProfile({
        role: UserRole.TheAdminNick,
        name: 'Admin',
        modules: { body: true, budget: true, baby: true },
      }),
      isTheAdminNick: true,
      isLoading: false,
      syncStatus: 'synced',
      setSyncStatus: vi.fn(),
    };
  } else if (role === 'user') {
    mockAuth = {
      firebaseUser: { uid: 'user-uid' },
      profile: makeProfile(),
      isTheAdminNick: false,
      isLoading: false,
      syncStatus: 'synced',
      setSyncStatus: vi.fn(),
    };
  } else if (role === 'viewer') {
    mockAuth = {
      firebaseUser: { uid: 'viewer-uid' },
      profile: makeProfile({
        role: UserRole.Viewer,
        name: 'Viewer',
        viewerOf: 'target-uid',
      }),
      isTheAdminNick: false,
      isLoading: false,
      syncStatus: 'synced',
      setSyncStatus: vi.fn(),
    };
  } else {
    mockAuth = {
      firebaseUser: { uid: 'anon-uid' },
      profile: null,
      isTheAdminNick: false,
      isLoading: false,
      syncStatus: 'synced',
      setSyncStatus: vi.fn(),
    };
  }
}

// ─── AdminGate Tests ────────────────────────────────────────────────────────

describe('AdminGate (2e.9)', () => {
  it('redirects non-admin users to /', () => {
    setAuthAs('user');

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={
              <AdminGate>
                <div>admin content</div>
              </AdminGate>
            }
          />
          <Route path="/" element={<div>home page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.queryByText('admin content')).not.toBeInTheDocument();
    expect(screen.getByText('home page')).toBeInTheDocument();
  });

  it('allows admin users through', () => {
    setAuthAs('admin');

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={
              <AdminGate>
                <div>admin content</div>
              </AdminGate>
            }
          />
          <Route path="/" element={<div>home page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('admin content')).toBeInTheDocument();
    expect(screen.queryByText('home page')).not.toBeInTheDocument();
  });

  it('redirects viewers away from admin routes', () => {
    setAuthAs('viewer');

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={
              <AdminGate>
                <div>admin content</div>
              </AdminGate>
            }
          />
          <Route path="/" element={<div>home page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.queryByText('admin content')).not.toBeInTheDocument();
    expect(screen.getByText('home page')).toBeInTheDocument();
  });
});

// ─── ModuleGate Tests ───────────────────────────────────────────────────────

describe('ModuleGate (2e.9)', () => {
  it('redirects when the module is disabled', () => {
    setAuthAs('user'); // baby: false in default profile

    render(
      <MemoryRouter initialEntries={['/baby']}>
        <Routes>
          <Route
            path="/baby"
            element={
              <ModuleGate moduleId={ModuleId.Baby}>
                <div>baby content</div>
              </ModuleGate>
            }
          />
          <Route path="/" element={<div>home page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.queryByText('baby content')).not.toBeInTheDocument();
    expect(screen.getByText('home page')).toBeInTheDocument();
  });

  it('allows through when the module is enabled', () => {
    setAuthAs('user'); // body: true in default profile

    render(
      <MemoryRouter initialEntries={['/body']}>
        <Routes>
          <Route
            path="/body"
            element={
              <ModuleGate moduleId={ModuleId.Body}>
                <div>body content</div>
              </ModuleGate>
            }
          />
          <Route path="/" element={<div>home page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('body content')).toBeInTheDocument();
    expect(screen.queryByText('home page')).not.toBeInTheDocument();
  });

  it('redirects when profile is null (no modules at all)', () => {
    setAuthAs('none');

    render(
      <MemoryRouter initialEntries={['/body']}>
        <Routes>
          <Route
            path="/body"
            element={
              <ModuleGate moduleId={ModuleId.Body}>
                <div>body content</div>
              </ModuleGate>
            }
          />
          <Route path="/" element={<div>home page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.queryByText('body content')).not.toBeInTheDocument();
    expect(screen.getByText('home page')).toBeInTheDocument();
  });
});

// ─── No-Profile Dashboard (invite wall) ─────────────────────────────────────

describe('Dashboard — no profile (2e.9)', () => {
  it('shows the invite wall when profile is null', () => {
    setAuthAs('none');

    render(
      <MemoryRouter initialEntries={['/']}>
        <Dashboard />
      </MemoryRouter>,
    );

    expect(screen.getByText('No modules enabled yet')).toBeInTheDocument();
    expect(screen.getByText('Ask the admin for access')).toBeInTheDocument();
  });
});

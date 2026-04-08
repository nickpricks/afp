import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { UserRole } from '@/shared/types';

// Mock all hooks the Dashboard uses — prevents deep module loading
vi.mock('@/shared/auth/useAuth', () => ({
  useAuth: () => ({
    firebaseUser: { uid: 'test-user' },
    profile: {
      role: UserRole.User,
      name: 'Nick',
      modules: { body: true, budget: true, baby: false },
    },
    isTheAdminNick: false,
    setSyncStatus: vi.fn(),
  }),
}));

vi.mock('@/shared/errors/useToast', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

vi.mock('@/modules/body/hooks/useBodyConfig', () => ({
  useBodyConfig: () => ({ config: { floors: true, walking: true, running: false, cycling: false, yoga: false, floorHeight: 3, configuredAt: '2026-04-07' }, isConfigured: true, loading: false, saveConfig: vi.fn() }),
}));

vi.mock('@/modules/body/hooks/useBodyData', () => ({
  useBodyData: () => ({ records: {}, todayRecord: { dateStr: '2026-04-07', up: 3, down: 1, walkMeters: 1200, runMeters: 0, total: 42, updatedAt: '' }, activities: [], tap: vi.fn(), logActivity: vi.fn(), saveRecord: vi.fn(), updateActivity: vi.fn() }),
}));

vi.mock('@/modules/expenses/hooks/useExpenses', () => ({
  useExpenses: () => ({ expenses: [{ id: '1', date: '2026-04-07', amount: 500, isSettlement: false, paymentMethod: 0, category: 1, subCat: '', note: '', isDeleted: false, createdAt: '', updatedAt: '' }], addExpense: vi.fn(), deleteExpense: vi.fn() }),
}));

vi.mock('@/modules/expenses/hooks/useIncome', () => ({
  useIncome: () => ({ income: [{ id: '1', date: '2026-04-07', amount: 5000, source: 0, paymentMethod: 0, note: '', createdAt: '', updatedAt: '' }], addIncome: vi.fn(), deleteIncome: vi.fn() }),
}));

vi.mock('@/modules/baby/hooks/useChildren', () => ({
  useChildren: () => ({ children: [], loading: false, addChild: vi.fn(), updateChild: vi.fn() }),
}));

vi.mock('@/admin/hooks/useAllUsers', () => ({
  useAllUsers: () => ({ users: [], loading: false }),
}));

// Import after mocks
import { Dashboard } from '@/shared/components/Dashboard';

describe('Dashboard', () => {
  it('shows greeting with user name', () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    expect(screen.getByText(/Nick/)).toBeInTheDocument();
  });

  it('shows time-of-day greeting', () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    expect(screen.getByText(/Good (morning|afternoon|evening)/)).toBeInTheDocument();
  });

  it('shows Body card when body module enabled', () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    expect(screen.getByText('Body')).toBeInTheDocument();
  });

  it('shows Budget card when budget module enabled', () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    expect(screen.getByText('Budget')).toBeInTheDocument();
  });

  it('does not show Baby card when baby module disabled', () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    expect(screen.queryByText('Baby')).not.toBeInTheDocument();
  });

  it('shows date in greeting area', () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    expect(screen.getByText(/Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/)).toBeInTheDocument();
  });

  it('shows body score from todayRecord', () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('shows budget spend', () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    expect(screen.getByText('₹500')).toBeInTheDocument();
  });
});

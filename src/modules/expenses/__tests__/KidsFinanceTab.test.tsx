import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const mockHook = vi.fn();
vi.mock('@/modules/expenses/hooks/useAllKidsFinances', () => ({
  useAllKidsFinances: () => mockHook(),
}));

import { KidsFinanceTab } from '@/modules/expenses/components/KidsFinanceTab';
import { FinanceStatus } from '@/modules/baby/types';

describe('KidsFinanceTab', () => {
  it('shows empty state when no entries', () => {
    mockHook.mockReturnValue({ entries: [], loading: false });
    render(<KidsFinanceTab />);
    expect(screen.getByText(/No kid finances yet/i)).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockHook.mockReturnValue({ entries: [], loading: true });
    render(<KidsFinanceTab />);
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it('displays total kid wealth excluding spent', () => {
    mockHook.mockReturnValue({
      entries: [
        {
          id: 'f1',
          date: '2026-05-14',
          amount: 100,
          description: 'Gift',
          giver: '',
          occasion: '',
          status: FinanceStatus.Received,
          notes: '',
          timestamp: '',
          createdAt: '',
          updatedAt: '',
          childId: 'c1',
          childName: 'Alpha',
        },
        {
          id: 'f2',
          date: '2026-05-14',
          amount: 50,
          description: 'Spent',
          giver: '',
          occasion: '',
          status: FinanceStatus.Spent,
          notes: '',
          timestamp: '',
          createdAt: '',
          updatedAt: '',
          childId: 'c1',
          childName: 'Alpha',
        },
      ],
      loading: false,
    });
    render(<KidsFinanceTab />);
    expect(screen.getByText(/Total Kid Wealth/i)).toBeInTheDocument();
    expect(screen.getAllByText(/₹100/).length).toBeGreaterThanOrEqual(1);
  });

  it('shows per-row child name chip', () => {
    mockHook.mockReturnValue({
      entries: [
        {
          id: 'f1',
          date: '2026-05-14',
          amount: 100,
          description: 'Birthday cash',
          giver: 'Grandma',
          occasion: '',
          status: FinanceStatus.Received,
          notes: '',
          timestamp: '',
          createdAt: '',
          updatedAt: '',
          childId: 'c1',
          childName: 'Alpha',
        },
      ],
      loading: false,
    });
    render(<KidsFinanceTab />);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
  });
});

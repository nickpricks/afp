import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const mockFinanceCollection = {
  items: [] as unknown[],
  log: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
};
const mockGiftCollection = {
  items: [] as unknown[],
  log: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
};

vi.mock('@/modules/baby/hooks/useBabyCollection', () => ({
  useBabyCollection: (_childId: unknown, sub: string) => {
    if (sub === 'finances') return mockFinanceCollection;
    if (sub === 'gifts') return mockGiftCollection;
    throw new Error('unexpected sub: ' + sub);
  },
}));

const mockAddToast = vi.fn();
vi.mock('@/shared/errors/useToast', () => ({
  useToast: () => ({ addToast: mockAddToast }),
}));

vi.mock('@/modules/expenses/hooks/useExpenses', () => ({
  useExpenses: () => ({ addExpense: vi.fn() }),
}));

import { PresentsLog } from '@/modules/baby/components/PresentsLog';

describe('PresentsLog', () => {
  beforeEach(() => {
    mockFinanceCollection.items = [];
    mockGiftCollection.items = [];
    mockFinanceCollection.log.mockClear();
    mockFinanceCollection.remove.mockClear();
    mockGiftCollection.log.mockClear();
    mockGiftCollection.remove.mockClear();
    mockAddToast.mockClear();
  });

  it('renders sub-tab toggle with Finances active by default', () => {
    render(<PresentsLog childId="c1" uid="u1" />);
    expect(screen.getByRole('button', { name: /finances/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /gifts/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Description.*Birthday Cash/i)).toBeInTheDocument();
  });

  it('switches form fields when toggling to Gifts sub-tab', () => {
    render(<PresentsLog childId="c1" uid="u1" />);
    fireEvent.click(screen.getByRole('button', { name: /gifts/i }));
    expect(screen.getByPlaceholderText(/Gift Title.*Lego Set/i)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Amount')).toBeNull();
  });

  it('shows error toast when submitting without a title', () => {
    render(<PresentsLog childId="c1" uid="u1" />);
    fireEvent.click(screen.getByRole('button', { name: /add finance/i }));
    expect(mockAddToast).toHaveBeenCalledWith(
      'Description/Title is required',
      expect.anything(),
    );
  });

  it('calls finances.remove and shows undo toast when delete clicked', () => {
    mockFinanceCollection.items = [
      {
        id: 'f1',
        date: '2026-05-14',
        amount: 100,
        description: 'Cash',
        giver: '',
        occasion: '',
        status: 0,
        notes: '',
        timestamp: '',
        createdAt: '2026-05-14T00:00:00.000Z',
        updatedAt: '',
      },
    ];
    render(<PresentsLog childId="c1" uid="u1" />);
    fireEvent.click(screen.getByText('×'));
    expect(mockFinanceCollection.remove).toHaveBeenCalledWith('f1');
    expect(mockAddToast).toHaveBeenCalledWith(
      expect.stringMatching(/Finance.*deleted/i),
      expect.anything(),
      expect.objectContaining({ action: expect.objectContaining({ label: 'Undo' }) }),
    );
  });
});

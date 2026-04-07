import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { FeedLog } from '@/modules/baby/components/FeedLog';
import { FeedType } from '@/modules/baby/types';
import type { FeedEntry } from '@/modules/baby/types';

const mockRemoveFeed = vi.fn();
const mockLogFeed = vi.fn();

const sampleFeed: FeedEntry = {
  id: 'feed-1',
  date: '2026-04-07',
  time: '10:00',
  type: FeedType.Bottle,
  amount: 120,
  timestamp: '2026-04-07T10:00:00Z',
  createdAt: '2026-04-07T10:00:00Z',
  notes: 'test feed',
};

vi.mock('@/modules/baby/hooks/useBabyData', () => ({
  useBabyData: () => ({
    feeds: [sampleFeed],
    sleeps: [],
    growth: [],
    diapers: [],
    logFeed: mockLogFeed,
    removeFeed: mockRemoveFeed,
    logSleep: vi.fn(),
    removeSleep: vi.fn(),
    logGrowth: vi.fn(),
    removeGrowth: vi.fn(),
    logDiaper: vi.fn(),
    removeDiaper: vi.fn(),
  }),
}));

vi.mock('@/shared/errors/useToast', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

describe('FeedLog — delete action', () => {
  it('shows a delete button on each recent entry', () => {
    render(<FeedLog childId="child-1" />);
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    expect(deleteButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('calls removeFeed when delete is clicked', () => {
    render(<FeedLog childId="child-1" />);
    const deleteBtn = screen.getAllByRole('button', { name: /delete/i })[0];
    fireEvent.click(deleteBtn!);
    expect(mockRemoveFeed).toHaveBeenCalledWith('feed-1');
  });
});

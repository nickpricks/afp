import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { DashboardTab } from '../components/ChildDetail';
import type { Child } from '../types';

vi.mock('../hooks/useJournalData', () => ({
  useJournalData: () => ({
    range: { start: '2026-04-15', end: '2026-04-15', grain: 0, label: 'Apr 15, 2026' },
    feedCount: 4,
    mealCount: 2,
    sleepEntries: 2,
    sleepHours: 11.5,
    diaperCount: 6,
    pottyCount: 0,
    growthLatest: null,
    milestonesInRange: [],
    needsAdded: 0,
    needsAcquired: 0,
    needsOutgrown: 0,
    countingMoments: [],
  }),
}));

const child: Child = {
  id: 'c1',
  name: 'Aanya',
  dob: '2024-04-13',
  config: {
    feeding: true,
    sleep: true,
    growth: true,
    diapers: true,
    meals: true,
    potty: false,
    milestones: true,
    needs: true,
  },
  createdAt: '',
  updatedAt: '',
};

describe('DashboardTab journal strip', () => {
  it('renders today feed / sleep / diaper counts when present', () => {
    render(<DashboardTab child={child} onNavigate={vi.fn()} />);
    expect(screen.getByText(/4 feeds/)).toBeInTheDocument();
    expect(screen.getByText(/11\.5 hrs sleep/)).toBeInTheDocument();
    expect(screen.getByText(/6 diapers/)).toBeInTheDocument();
  });

  it('renders a "See full journal" link that navigates to the journal tab', () => {
    const onNavigate = vi.fn();
    render(<DashboardTab child={child} onNavigate={onNavigate} />);
    fireEvent.click(screen.getByRole('button', { name: /see full journal/i }));
    expect(onNavigate).toHaveBeenCalledWith('journal');
  });
});

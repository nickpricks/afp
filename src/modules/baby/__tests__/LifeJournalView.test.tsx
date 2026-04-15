import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { LifeJournalView } from '../components/LifeJournalView';
import { MilestoneCategory, type Child } from '../types';

vi.mock('../hooks/useJournalData', () => ({
  useJournalData: () => ({
    range: { start: '2026-04-13', end: '2026-04-19', grain: 1, label: 'Apr 13\u201319, 2026' },
    feedCount: 12,
    mealCount: 8,
    sleepEntries: 14,
    sleepHours: 88.5,
    diaperCount: 32,
    pottyCount: 4,
    growthLatest: { date: '2026-04-10', weight: 11.2, height: 78 },
    milestonesInRange: [
      { id: 'm1', date: '2026-04-15', title: 'First word', category: MilestoneCategory.Language },
    ],
    needsAdded: 2,
    needsAcquired: 1,
    needsOutgrown: 1,
    countingMoments: [{ dataType: 'diapers', threshold: 1000 }],
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

describe('LifeJournalView', () => {
  it('renders header with child name and stage label', () => {
    render(<LifeJournalView child={child} />);
    expect(screen.getByText('Life Journal')).toBeInTheDocument();
    expect(screen.getByText(/Aanya/)).toBeInTheDocument();
    expect(screen.getByText(/Toddler/)).toBeInTheDocument();
  });

  it('renders a counting moments card when countingMoments is non-empty', () => {
    render(<LifeJournalView child={child} />);
    expect(screen.getByText(/Counting moments/)).toBeInTheDocument();
    expect(screen.getByText(/1000 diapers/)).toBeInTheDocument();
  });

  it('renders feed + meal counts', () => {
    render(<LifeJournalView child={child} />);
    expect(screen.getByText(/12 feeds, 8 meals/)).toBeInTheDocument();
  });

  it('renders milestones list', () => {
    render(<LifeJournalView child={child} />);
    expect(screen.getByText(/First word/)).toBeInTheDocument();
  });

  it('renders needs activity counts', () => {
    render(<LifeJournalView child={child} />);
    expect(screen.getByText(/Added: 2/)).toBeInTheDocument();
    expect(screen.getByText(/Acquired: 1/)).toBeInTheDocument();
    expect(screen.getByText(/Outgrown: 1/)).toBeInTheDocument();
  });
});

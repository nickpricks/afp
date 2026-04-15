import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { EliminationLog } from '@/modules/baby/components/EliminationLog';
import { EliminationMode, DiaperType, PottyTrainingEvent } from '@/modules/baby/types';
import type { EliminationEntry } from '@/modules/baby/types';

const mockLogElimination = vi.fn();
const mockUpdateElimination = vi.fn();
const mockRemoveElimination = vi.fn();
const mockAddToast = vi.fn();

const sampleDiaperEntry: EliminationEntry = {
  id: 'e-1',
  date: '2026-04-12',
  time: '08:00',
  mode: EliminationMode.Diaper,
  diaperType: DiaperType.Wet,
  timestamp: '2026-04-12T08:00:00Z',
  createdAt: '2026-04-12T08:00:00Z',
  notes: '',
};

const samplePottyEntry: EliminationEntry = {
  id: 'e-2',
  date: '2026-04-13',
  time: '14:30',
  mode: EliminationMode.Potty,
  pottyEvent: PottyTrainingEvent.Pee,
  timestamp: '2026-04-13T14:30:00Z',
  createdAt: '2026-04-13T14:30:00Z',
  notes: '',
};

vi.mock('@/modules/baby/hooks/useBabyData', () => ({
  useBabyData: () => ({
    feeds: [],
    sleeps: [],
    growth: [],
    diapers: [],
    elimination: [sampleDiaperEntry, samplePottyEntry],
    logFeed: vi.fn(),
    updateFeed: vi.fn(),
    removeFeed: vi.fn(),
    logSleep: vi.fn(),
    updateSleep: vi.fn(),
    removeSleep: vi.fn(),
    logGrowth: vi.fn(),
    updateGrowth: vi.fn(),
    removeGrowth: vi.fn(),
    logDiaper: vi.fn(),
    updateDiaper: vi.fn(),
    removeDiaper: vi.fn(),
    logElimination: mockLogElimination,
    updateElimination: mockUpdateElimination,
    removeElimination: mockRemoveElimination,
  }),
}));

vi.mock('@/shared/errors/useToast', () => ({
  useToast: () => ({ addToast: mockAddToast }),
}));

describe('EliminationLog — header behavior', () => {
  it('shows "Diaper Log" header when only diapers enabled', () => {
    render(<EliminationLog childId="c1" diapersEnabled={true} pottyEnabled={false} />);
    expect(screen.getByRole('heading', { name: /Diaper Log/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Potty Log/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Elimination Log/i })).not.toBeInTheDocument();
  });

  it('shows "Potty Log" header when only potty enabled', () => {
    render(<EliminationLog childId="c1" diapersEnabled={false} pottyEnabled={true} />);
    expect(screen.getByRole('heading', { name: /Potty Log/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /^Diaper Log/i })).not.toBeInTheDocument();
  });

  it('shows "Elimination Log" header + mode toggle when both enabled', () => {
    render(<EliminationLog childId="c1" diapersEnabled={true} pottyEnabled={true} />);
    expect(screen.getByRole('heading', { name: /Elimination Log/i })).toBeInTheDocument();
    // Mode toggle present
    expect(screen.getByRole('button', { name: /^Diaper$/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Potty$/ })).toBeInTheDocument();
  });
});

describe('EliminationLog — mode-specific UI', () => {
  it('renders diaper quick-log buttons (Wet/Dirty) when in Diaper mode', () => {
    render(<EliminationLog childId="c1" diapersEnabled={true} pottyEnabled={false} />);
    expect(screen.getByRole('button', { name: /Quick Wet/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Quick Dirty/i })).toBeInTheDocument();
  });

  it('does not render diaper quick-log buttons when only Potty enabled', () => {
    render(<EliminationLog childId="c1" diapersEnabled={false} pottyEnabled={true} />);
    expect(screen.queryByRole('button', { name: /Quick Wet/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Quick Dirty/i })).not.toBeInTheDocument();
  });
});

describe('EliminationLog — recent entries', () => {
  it('renders both diaper and potty entries with mode-specific badges', () => {
    render(<EliminationLog childId="c1" diapersEnabled={true} pottyEnabled={true} />);
    // Diaper entry rendered with diaper badge in Recent list
    expect(screen.getByText(/🧷.*Wet/)).toBeInTheDocument();
    // Potty entry rendered with potty badge in Recent list
    expect(screen.getByText(/🚽.*Pee/)).toBeInTheDocument();
  });

  it('shows a delete (x) on each row', () => {
    render(<EliminationLog childId="c1" diapersEnabled={true} pottyEnabled={true} />);
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    expect(deleteButtons.length).toBeGreaterThanOrEqual(2);
  });
});

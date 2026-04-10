import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { CyclingTab } from '@/modules/body/components/CyclingTab';
import { ActivityType } from '@/shared/types';
import type { BodyActivity } from '@/modules/body/types';

const mockOnLog = vi.fn();
const mockOnSave = vi.fn();

const cycleActivity: BodyActivity = {
  id: 'a1',
  date: '2026-04-07',
  type: ActivityType.Cycle,
  distance: 5000,
  duration: null,
  createdAt: '2026-04-07T10:00:00Z',
  updatedAt: '2026-04-07T10:00:00Z',
};

const walkActivity: BodyActivity = {
  id: 'a2',
  date: '2026-04-07',
  type: ActivityType.Walk,
  distance: 2000,
  duration: null,
  createdAt: '2026-04-07T10:00:00Z',
  updatedAt: '2026-04-07T10:00:00Z',
};

describe('CyclingTab', () => {
  it('renders the add activity form with Cycle as default type', () => {
    render(<CyclingTab activities={[]} onLog={mockOnLog} onSave={mockOnSave} />);
    expect(screen.getByText('Log Cycle')).toBeInTheDocument();
  });

  it('only shows cycling activities in the log', () => {
    render(
      <CyclingTab
        activities={[cycleActivity, walkActivity]}
        onLog={mockOnLog}
        onSave={mockOnSave}
      />,
    );
    // Should show the cycle activity distance (5000m displayed as "5.0 km")
    expect(screen.getByText(/5\.0 km/)).toBeInTheDocument();
    // Walk activity should not appear in the log
    expect(screen.queryByText(/2\.0 km/)).not.toBeInTheDocument();
  });

  it('shows nothing when no cycling activities exist', () => {
    render(
      <CyclingTab
        activities={[walkActivity]}
        onLog={mockOnLog}
        onSave={mockOnSave}
      />,
    );
    // The form is there but no activity log
    expect(screen.getByText('Log Cycle')).toBeInTheDocument();
    expect(screen.queryByText(/2000/)).not.toBeInTheDocument();
  });
});

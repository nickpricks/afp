import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { ActivityLog } from '@/modules/body/components/ActivityLog';
import { ActivityType } from '@/shared/types';
import type { BodyActivity } from '@/modules/body/types';

vi.mock('@/shared/errors/useToast', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

/** Creates N fake activities for testing pagination */
function makeActivities(count: number): BodyActivity[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `a-${i}`,
    type: ActivityType.Walk,
    distance: 1000 + i,
    duration: null,
    date: `2026-04-${String(7 - Math.floor(i / 5)).padStart(2, '0')}`,
    timestamp: `2026-04-07T${String(10 + i).padStart(2, '0')}:00:00Z`,
    createdAt: `2026-04-07T${String(10 + i).padStart(2, '0')}:00:00Z`,
    updatedAt: `2026-04-07T${String(10 + i).padStart(2, '0')}:00:00Z`,
  }));
}

const noop = vi.fn();

describe('ActivityLog — pagination via useListControls', () => {
  it('shows at most pageSize (25) activities by default', () => {
    render(<ActivityLog activities={makeActivities(35)} onEdit={noop} />);
    expect(screen.getAllByTestId('activity-row').length).toBe(25);
  });

  it('renders ListControls time-range pills when paginated', () => {
    render(<ActivityLog activities={makeActivities(35)} onEdit={noop} />);
    expect(screen.getByRole('button', { name: 'Today' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Week' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Month' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
  });

  it('shows footer button when total exceeds pageSize', () => {
    render(<ActivityLog activities={makeActivities(30)} onEdit={noop} />);
    expect(screen.getByRole('button', { name: /Show all|Load \d+ remaining/ })).toBeInTheDocument();
  });

  it('does not show footer when total fits in one page', () => {
    render(<ActivityLog activities={makeActivities(5)} onEdit={noop} />);
    expect(
      screen.queryByRole('button', { name: /Show all|Load \d+ remaining/ }),
    ).not.toBeInTheDocument();
  });

  it('clicking Show all footer renders the entire filtered list', () => {
    const total = 60;
    render(<ActivityLog activities={makeActivities(total)} onEdit={noop} />);
    fireEvent.click(screen.getByRole('button', { name: /Show all \d+ records/ }));
    expect(screen.getAllByTestId('activity-row').length).toBe(total);
  });
});

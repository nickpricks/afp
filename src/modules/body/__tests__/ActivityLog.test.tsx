import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { ActivityLog } from '@/modules/body/components/ActivityLog';
import { ActivityType } from '@/shared/types';
import type { BodyActivity } from '@/modules/body/types';

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

describe('ActivityLog — pagination', () => {
  it('shows at most 7 activities by default', () => {
    render(<ActivityLog activities={makeActivities(15)} onSave={noop} />);
    // Each activity renders as a button with date text
    const rows = screen.getAllByRole('button');
    // Should be 7 activity rows + 1 "Show more" button = 8
    expect(rows.length).toBe(8);
  });

  it('shows "Show more" when more than 7 activities', () => {
    render(<ActivityLog activities={makeActivities(15)} onSave={noop} />);
    expect(screen.getByRole('button', { name: /show more/i })).toBeInTheDocument();
  });

  it('does not show "Show more" when 7 or fewer activities', () => {
    render(<ActivityLog activities={makeActivities(5)} onSave={noop} />);
    expect(screen.queryByRole('button', { name: /show more/i })).not.toBeInTheDocument();
  });

  it('clicking "Show more" reveals up to 30 activities', () => {
    render(<ActivityLog activities={makeActivities(25)} onSave={noop} />);
    fireEvent.click(screen.getByRole('button', { name: /show more/i }));
    const rows = screen.getAllByRole('button');
    // 25 activity rows, no "Show more" since 25 < 30
    expect(rows.length).toBe(25);
  });
});

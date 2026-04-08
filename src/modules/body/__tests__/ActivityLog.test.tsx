import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { ActivityLog } from '@/modules/body/components/ActivityLog';
import { ActivityType } from '@/shared/types';
import { CONFIG } from '@/constants/config';
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
  it('shows at most PAGE_SIZE activities by default', () => {
    const total = CONFIG.PAGE_SIZE + 10;
    render(<ActivityLog activities={makeActivities(total)} onEdit={noop} />);
    const rows = screen.getAllByRole('button');
    // PAGE_SIZE activity rows + 1 "Show more" button
    expect(rows.length).toBe(CONFIG.PAGE_SIZE + 1);
  });

  it('shows "Show more" when more than PAGE_SIZE activities', () => {
    render(<ActivityLog activities={makeActivities(CONFIG.PAGE_SIZE + 5)} onEdit={noop} />);
    expect(screen.getByRole('button', { name: /show more/i })).toBeInTheDocument();
  });

  it('does not show "Show more" when PAGE_SIZE or fewer activities', () => {
    render(<ActivityLog activities={makeActivities(5)} onEdit={noop} />);
    expect(screen.queryByRole('button', { name: /show more/i })).not.toBeInTheDocument();
  });

  it('clicking "Show more" loads next page', () => {
    const total = CONFIG.PAGE_SIZE + 5;
    render(<ActivityLog activities={makeActivities(total)} onEdit={noop} />);
    fireEvent.click(screen.getByRole('button', { name: /show more/i }));
    const rows = screen.getAllByRole('button');
    // All activities visible, no "Show more"
    expect(rows.length).toBe(total);
  });
});

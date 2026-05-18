import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { DateGroupHeader } from '../DateGroupHeader';

/** Tests for DateGroupHeader sticky date grouping behavior. */
describe('DateGroupHeader', () => {
  it('renders "Today" prefix in accent for today', () => {
    render(<DateGroupHeader date="2026-04-29" today="2026-04-29" />);
    expect(screen.getByText('Today')).toHaveClass('text-accent');
    expect(screen.getByText(/Wed 29 Apr/)).toBeInTheDocument();
  });

  it('renders "Yesterday" for previous day', () => {
    render(<DateGroupHeader date="2026-04-28" today="2026-04-29" />);
    expect(screen.getByText('Yesterday')).toBeInTheDocument();
  });

  it('renders structural-only label with week number for older dates', () => {
    render(<DateGroupHeader date="2026-04-22" today="2026-04-29" />);
    expect(screen.queryByText('Today')).not.toBeInTheDocument();
    expect(screen.queryByText('Yesterday')).not.toBeInTheDocument();
    expect(screen.getByText(/Wed 22 Apr/)).toBeInTheDocument();
    expect(screen.getByText(/Wk \d+/)).toBeInTheDocument();
  });
});

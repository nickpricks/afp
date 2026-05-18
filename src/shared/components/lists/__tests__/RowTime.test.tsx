import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { RowTime } from '../RowTime';

/** Tests for RowTime timestamp formatting and dash fallback. */
describe('RowTime', () => {
  it('renders time portion of ISO timestamp in HH:mm format', () => {
    render(<RowTime timestamp="2026-04-29T14:23:00.000Z" />);
    expect(screen.getByText(/\d{2}:\d{2}/)).toBeInTheDocument();
  });

  it('uses tabular numerals via class', () => {
    render(<RowTime timestamp="2026-04-29T14:23:00.000Z" />);
    expect(screen.getByText(/\d{2}:\d{2}/)).toHaveClass('tabular-nums');
  });

  it('renders dash when timestamp is undefined', () => {
    render(<RowTime timestamp={undefined} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});

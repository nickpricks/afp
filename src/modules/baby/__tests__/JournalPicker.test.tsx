import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { JournalPicker } from '../components/JournalPicker';
import { JournalGrain } from '../journal/constants';
import { computeRange } from '../journal/range';

describe('JournalPicker', () => {
  it('renders all 3 grain buttons', () => {
    const range = computeRange(JournalGrain.Day, '2026-04-13');
    render(<JournalPicker range={range} onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Day' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Week' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Month' })).toBeInTheDocument();
  });

  it('calls onChange with new grain on click', () => {
    const onChange = vi.fn();
    const range = computeRange(JournalGrain.Day, '2026-04-13');
    render(<JournalPicker range={range} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Week' }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ grain: JournalGrain.Week }));
  });

  it('steps to next period on > click', () => {
    const onChange = vi.fn();
    const range = computeRange(JournalGrain.Day, '2026-04-13');
    render(<JournalPicker range={range} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('next period'));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ start: '2026-04-14' }));
  });

  it('steps to previous period on < click', () => {
    const onChange = vi.fn();
    const range = computeRange(JournalGrain.Day, '2026-04-13');
    render(<JournalPicker range={range} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('previous period'));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ start: '2026-04-12' }));
  });
});

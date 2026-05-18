import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { ListControls } from '../ListControls';
import { TimeRange } from '@/shared/types';

const noop = () => {};

const baseProps = {
  timeRange: TimeRange.All,
  onTimeRangeChange: noop,
  pageSize: 25,
  onPageSizeChange: noop,
  page: 1,
  totalPages: 4,
  onPageChange: noop,
};

/** Tests for ListControls time-range pills, page size, and page navigation. */
describe('ListControls', () => {
  it('renders all four time-range pills', () => {
    render(<ListControls {...baseProps} />);
    expect(screen.getByRole('button', { name: 'Today' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Week' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Month' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
  });

  it('marks the active time-range pill', () => {
    render(<ListControls {...baseProps} timeRange={TimeRange.Week} />);
    expect(screen.getByRole('button', { name: 'Week' })).toHaveClass('bg-accent');
  });

  it('calls onTimeRangeChange when a pill is clicked', () => {
    const onChange = vi.fn();
    render(<ListControls {...baseProps} onTimeRangeChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Week' }));
    expect(onChange).toHaveBeenCalledWith(TimeRange.Week);
  });

  it('renders page-size dropdown with 6 options', () => {
    render(<ListControls {...baseProps} />);
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(select.children).toHaveLength(6);
  });

  it('calls onPageSizeChange with parsed number when select changes', () => {
    const onChange = vi.fn();
    render(<ListControls {...baseProps} onPageSizeChange={onChange} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '50' } });
    expect(onChange).toHaveBeenCalledWith(50);
  });

  it('shows current page indicator', () => {
    render(<ListControls {...baseProps} page={3} totalPages={4} />);
    expect(screen.getByText(/3 \/ 4/)).toBeInTheDocument();
  });

  it('disables prev button on page 1', () => {
    render(<ListControls {...baseProps} page={1} />);
    expect(screen.getByRole('button', { name: /previous page/i })).toBeDisabled();
  });

  it('disables next button on last page', () => {
    render(<ListControls {...baseProps} page={4} totalPages={4} />);
    expect(screen.getByRole('button', { name: /next page/i })).toBeDisabled();
  });

  it('calls onPageChange when prev clicked', () => {
    const onChange = vi.fn();
    render(<ListControls {...baseProps} page={3} onPageChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /previous page/i }));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('calls onPageChange when go-to-page input is blurred with valid value', () => {
    const onChange = vi.fn();
    render(<ListControls {...baseProps} page={1} totalPages={10} onPageChange={onChange} />);
    const input = screen.getByLabelText(/go to page/i);
    fireEvent.change(input, { target: { value: '7' } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith(7);
  });

  it('clamps go-to-page input to valid range', () => {
    const onChange = vi.fn();
    render(<ListControls {...baseProps} page={1} totalPages={10} onPageChange={onChange} />);
    const input = screen.getByLabelText(/go to page/i);
    fireEvent.change(input, { target: { value: '99' } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith(10);
  });

  it('hides pagination row when totalPages is 1', () => {
    render(<ListControls {...baseProps} totalPages={1} />);
    expect(screen.queryByRole('button', { name: /next page/i })).not.toBeInTheDocument();
  });
});

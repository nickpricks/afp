import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SizeTierPicker } from '../SizeTierPicker';

describe('<SizeTierPicker>', () => {
  it('renders 3 buttons with tier labels', () => {
    render(<SizeTierPicker value={100} onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Small' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Medium' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Large' })).toBeInTheDocument();
  });

  it('marks the matching tier active by aria-pressed', () => {
    render(<SizeTierPicker value={100} onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Medium' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Small' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Large' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('buckets a legacy value to the nearest tier for active state', () => {
    render(<SizeTierPicker value={60} onChange={() => {}} />);
    // 60 buckets to 70 → Small is active
    expect(screen.getByRole('button', { name: 'Small' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('buckets value 130 to Large (nearest tier)', () => {
    render(<SizeTierPicker value={130} onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Large' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('fires onChange with the tier value when clicked', () => {
    const onChange = vi.fn();
    render(<SizeTierPicker value={100} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Large' }));
    expect(onChange).toHaveBeenCalledWith(140);
  });

  it('fires onChange with Small tier value when Small is clicked', () => {
    const onChange = vi.fn();
    render(<SizeTierPicker value={100} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Small' }));
    expect(onChange).toHaveBeenCalledWith(70);
  });

  it('does not fire onChange when clicking the already-active tier', () => {
    const onChange = vi.fn();
    render(<SizeTierPicker value={100} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Medium' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});

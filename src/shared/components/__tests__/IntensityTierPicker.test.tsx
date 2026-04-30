import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IntensityTierPicker } from '../IntensityTierPicker';

describe('<IntensityTierPicker>', () => {
  it('renders 5 buttons with tier labels', () => {
    render(<IntensityTierPicker value={50} onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Off' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Subtle' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Standard' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Lively' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Maximum' })).toBeInTheDocument();
  });

  it('marks the matching tier active by aria-pressed', () => {
    render(<IntensityTierPicker value={50} onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Standard' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Off' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('buckets a legacy value to the nearest tier for active state', () => {
    render(<IntensityTierPicker value={30} onChange={() => {}} />);
    // 30 buckets to 25 → Subtle is active
    expect(screen.getByRole('button', { name: 'Subtle' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('fires onChange with the tier value when clicked', () => {
    const onChange = vi.fn();
    render(<IntensityTierPicker value={0} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Lively' }));
    expect(onChange).toHaveBeenCalledWith(75);
  });

  it('does not fire onChange when clicking the already-active tier', () => {
    const onChange = vi.fn();
    render(<IntensityTierPicker value={50} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Standard' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});

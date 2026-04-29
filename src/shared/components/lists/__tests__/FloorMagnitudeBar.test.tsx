import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';

import { FloorMagnitudeBar } from '../FloorMagnitudeBar';

describe('FloorMagnitudeBar', () => {
  it('renders an up segment proportional to up count', () => {
    const { container } = render(<FloorMagnitudeBar up={12} down={3} goal={20} />);
    const upSeg = container.querySelector('[data-segment="up"]') as HTMLElement;
    expect(upSeg).toBeInTheDocument();
    expect(upSeg.style.flex).toContain('12');
  });

  it('renders a down segment proportional to down count', () => {
    const { container } = render(<FloorMagnitudeBar up={12} down={3} goal={20} />);
    const downSeg = container.querySelector('[data-segment="down"]') as HTMLElement;
    expect(downSeg.style.flex).toContain('3');
  });

  it('renders an empty filler segment when sum < goal', () => {
    const { container } = render(<FloorMagnitudeBar up={12} down={3} goal={20} />);
    const filler = container.querySelector('[data-segment="empty"]') as HTMLElement;
    expect(filler).toBeInTheDocument();
    expect(filler.style.flex).toContain('5');
  });

  it('omits filler when sum >= goal', () => {
    const { container } = render(<FloorMagnitudeBar up={18} down={6} goal={20} />);
    expect(container.querySelector('[data-segment="empty"]')).toBeNull();
  });

  it('renders nothing when up + down is 0', () => {
    const { container } = render(<FloorMagnitudeBar up={0} down={0} goal={20} />);
    expect(container.firstChild).toBeNull();
  });
});

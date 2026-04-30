import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { AmbientEffects } from '../AmbientEffects';
import { ThemeId } from '@/themes/themes';

describe('<AmbientEffects>', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', (q: string) => ({
      matches: false,
      media: q,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
  });

  it('returns null when intensity is 0', () => {
    const { container } = render(<AmbientEffects themeId={ThemeId.FamilyBlue} intensity={0} />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when prefers-reduced-motion matches', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({
      matches: q.includes('reduce'),
      media: q,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    const { container } = render(<AmbientEffects themeId={ThemeId.FamilyBlue} intensity={100} />);
    expect(container.firstChild).toBeNull();
  });

  it('dispatches to GlyphPrimitive for empty-content effects (Family Blue snowflakes)', () => {
    const { container } = render(<AmbientEffects themeId={ThemeId.FamilyBlue} intensity={100} />);
    // Family Blue's snowflake effect now has content === '' → should render an SVG.
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('renders text content for Patronus effects (animal emoji preserved)', () => {
    const { container } = render(
      <AmbientEffects themeId={ThemeId.ExpectoPatronum} intensity={100} />,
    );
    const text = container.textContent ?? '';
    // Spirit animals: 🦌🐺🦅🦦🐎🐈🦉🐇🐕🦢🦡🐉
    expect(/[🦌🐺🦅🦦🐎🐈🦉🐇🐕🦢🦡🐉]/u.test(text)).toBe(true);
  });
});

describe('depth-correlated scaling', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', (q: string) => ({
      matches: false,
      media: q,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
  });

  it('scale and opacity correlate (close particles are bigger AND brighter)', () => {
    const { container } = render(<AmbientEffects themeId={ThemeId.FamilyBlue} intensity={100} />);
    const particles = container.querySelectorAll('.fx-particle');
    expect(particles.length).toBeGreaterThan(0);

    // Sample 5 particles, sort by scale ascending, verify opacity is also non-decreasing.
    const samples = Array.from(particles)
      .slice(0, 5)
      .map((el) => {
        const style = (el as HTMLElement).style;
        return {
          scale: parseFloat(style.getPropertyValue('--fx-scale')),
          opacity: parseFloat(style.getPropertyValue('--fx-opacity')),
        };
      });

    samples.sort((a, b) => a.scale - b.scale);
    for (let i = 1; i < samples.length; i++) {
      // Allow tiny floating-point slack (within 0.01).
      expect(samples[i].opacity).toBeGreaterThanOrEqual(samples[i - 1].opacity - 0.01);
    }
  });
});

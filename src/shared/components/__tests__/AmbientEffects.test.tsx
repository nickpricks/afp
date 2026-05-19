import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { AmbientEffects } from '../AmbientEffects';
import { ThemeId } from '@/themes/themes';

/** Mode for {@link stubMatchMedia}. `desktop` matches nothing; `mobile` matches max-width queries;
 * `reduce-motion` matches prefers-reduced-motion queries. */
type StubMode = 'desktop' | 'mobile' | 'reduce-motion';

/** Hoisted matchMedia stub helper — replaces the same 5-line stub previously duplicated
 * across 5 describe blocks. Keeps each test focused on its assertion, not its setup. */
const stubMatchMedia = (mode: StubMode = 'desktop'): void => {
  vi.stubGlobal('matchMedia', (q: string) => ({
    matches:
      (mode === 'mobile' && q.includes('max-width')) ||
      (mode === 'reduce-motion' && q.includes('reduce')),
    media: q,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
};

/** Tests for AmbientEffects rendering, reduced-motion, and intensity gating. */
describe('<AmbientEffects>', () => {
  beforeEach(() => stubMatchMedia());

  it('returns null when intensity is 0', () => {
    const { container } = render(<AmbientEffects themeId={ThemeId.FamilyBlue} intensity={0} />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when prefers-reduced-motion matches', () => {
    stubMatchMedia('reduce-motion');
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

/** Tests that scale and opacity move together (depth-correlated). */
describe('depth-correlated scaling', () => {
  beforeEach(() => stubMatchMedia());

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

// Fix 2: viewport-aware size multiplier
/** Tests for mobile (0.65x) vs desktop (1.0x) size multiplier. */
describe('viewport-aware size multiplier', () => {
  it('applies 0.65x multiplier on mobile viewport (max-width: 640px)', () => {
    stubMatchMedia('mobile');

    const { container } = render(<AmbientEffects themeId={ThemeId.FamilyBlue} intensity={100} />);
    const particles = container.querySelectorAll('.fx-particle');
    expect(particles.length).toBeGreaterThan(0);

    // All --fx-size values should be scaled by 0.65 (mobile multiplier × effectSize 100/100)
    // Desktop range: 10–26px → mobile range: 6.5–16.9px → all below 17px
    Array.from(particles).forEach((el) => {
      const sizeStr = (el as HTMLElement).style.getPropertyValue('--fx-size');
      const sizeVal = parseFloat(sizeStr);
      expect(sizeVal).toBeLessThan(17);
    });
  });

  it('applies 1.0x multiplier on desktop viewport', () => {
    stubMatchMedia();

    const { container } = render(<AmbientEffects themeId={ThemeId.FamilyBlue} intensity={100} />);
    const particles = container.querySelectorAll('.fx-particle');
    expect(particles.length).toBeGreaterThan(0);

    // Desktop: some particles should be >= 17px (full size range 10–26px)
    const sizes = Array.from(particles).map((el) =>
      parseFloat((el as HTMLElement).style.getPropertyValue('--fx-size')),
    );
    expect(sizes.some((s) => s >= 17)).toBe(true);
  });
});

// Fix 3: effectSize prop
/** Tests that the effectSize prop scales particle sizes proportionally. */
describe('effectSize prop', () => {
  beforeEach(() => stubMatchMedia());

  it('effectSize=70 produces smaller --fx-size than effectSize=100', () => {
    const { container: c100 } = render(
      <AmbientEffects themeId={ThemeId.FamilyBlue} intensity={100} effectSize={100} />,
    );
    const { container: c70 } = render(
      <AmbientEffects themeId={ThemeId.FamilyBlue} intensity={100} effectSize={70} />,
    );

    const sizes100 = Array.from(c100.querySelectorAll('.fx-particle')).map((el) =>
      parseFloat((el as HTMLElement).style.getPropertyValue('--fx-size')),
    );
    const sizes70 = Array.from(c70.querySelectorAll('.fx-particle')).map((el) =>
      parseFloat((el as HTMLElement).style.getPropertyValue('--fx-size')),
    );

    expect(sizes100.length).toBeGreaterThan(0);
    expect(sizes70.length).toBeGreaterThan(0);

    const avg100 = sizes100.reduce((a, b) => a + b, 0) / sizes100.length;
    const avg70 = sizes70.reduce((a, b) => a + b, 0) / sizes70.length;
    expect(avg70).toBeLessThan(avg100);
  });

  it('effectSize=100 (default) produces unchanged behavior vs omitting prop', () => {
    const { container: cDefault } = render(
      <AmbientEffects themeId={ThemeId.FamilyBlue} intensity={100} />,
    );
    const { container: c100 } = render(
      <AmbientEffects themeId={ThemeId.FamilyBlue} intensity={100} effectSize={100} />,
    );

    const firstDefault = Array.from(cDefault.querySelectorAll('.fx-particle')).map((el) =>
      (el as HTMLElement).style.getPropertyValue('--fx-size'),
    );
    const first100 = Array.from(c100.querySelectorAll('.fx-particle')).map((el) =>
      (el as HTMLElement).style.getPropertyValue('--fx-size'),
    );

    expect(firstDefault).toEqual(first100);
  });

  it('effectSize=140 produces larger --fx-size than effectSize=100', () => {
    const { container: c100 } = render(
      <AmbientEffects themeId={ThemeId.FamilyBlue} intensity={100} effectSize={100} />,
    );
    const { container: c140 } = render(
      <AmbientEffects themeId={ThemeId.FamilyBlue} intensity={100} effectSize={140} />,
    );

    const avg100 =
      Array.from(c100.querySelectorAll('.fx-particle'))
        .map((el) => parseFloat((el as HTMLElement).style.getPropertyValue('--fx-size')))
        .reduce((a, b) => a + b, 0) / c100.querySelectorAll('.fx-particle').length;

    const avg140 =
      Array.from(c140.querySelectorAll('.fx-particle'))
        .map((el) => parseFloat((el as HTMLElement).style.getPropertyValue('--fx-size')))
        .reduce((a, b) => a + b, 0) / c140.querySelectorAll('.fx-particle').length;

    expect(avg140).toBeGreaterThan(avg100);
  });
});

// Reduced-motion is the safety override: regardless of effectSize tier (Small/Medium/Large)
// or viewport, OS-level reduce-motion preference must short-circuit to zero particles.
// Guards against future regressions where size logic runs before the reduced-motion check.
describe('reduced-motion × effectSize interaction', () => {
  it.each([70, 100, 140])(
    'reduced-motion suppresses all particles regardless of effectSize=%i',
    (size) => {
      stubMatchMedia('reduce-motion');
      const { container } = render(
        <AmbientEffects themeId={ThemeId.FamilyBlue} intensity={100} effectSize={size} />,
      );
      expect(container.firstChild).toBeNull();
    },
  );

  it('reduced-motion + max intensity + Large tier still produces zero particles', () => {
    stubMatchMedia('reduce-motion');
    const { container } = render(
      <AmbientEffects themeId={ThemeId.FamilyBlue} intensity={100} effectSize={140} />,
    );
    expect(container.querySelectorAll('.fx-particle').length).toBe(0);
  });
});

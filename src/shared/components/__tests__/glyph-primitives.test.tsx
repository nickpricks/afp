import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { GlyphPrimitive } from '../glyph-primitives';

/** Tests for GlyphPrimitive shape registry and fallback behavior. */
describe('<GlyphPrimitive>', () => {
  const knownEffects = [
    'snowflakes',
    'leaves',
    'stars',
    'hearts',
    'ink',
    'bubbles',
    'embers',
    'wisps',
  ];

  it.each(knownEffects)('renders a non-empty element for effect "%s"', (id) => {
    const { container } = render(<GlyphPrimitive effectId={id} />);
    expect(container.firstChild).not.toBeNull();
  });

  it('renders a fallback shape for an unknown effect ID', () => {
    const { container } = render(<GlyphPrimitive effectId="not-a-real-effect" />);
    expect(container.firstChild).not.toBeNull();
  });

  it('snowflake renders an SVG element', () => {
    const { container } = render(<GlyphPrimitive effectId="snowflakes" />);
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('leaf renders an SVG element', () => {
    const { container } = render(<GlyphPrimitive effectId="leaves" />);
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('heart renders pure-CSS shapes (no SVG)', () => {
    const { container } = render(<GlyphPrimitive effectId="hearts" />);
    expect(container.querySelector('svg')).toBeNull();
  });

  // Glyph wrapper occupies 80% of the particle container; inner shapes fill the wrapper.
  // Single-percentage layer (post-#15 refactor): wrapper carries the 80%, inner shapes are 100%.

  it('snowflake wrapper is 80% with SVG filling 100%', () => {
    const { container } = render(<GlyphPrimitive effectId="snowflakes" />);
    const wrapper = container.querySelector('[style*="display: flex"]') as HTMLElement | null;
    expect(wrapper?.style.width).toBe('80%');
    expect(wrapper?.style.height).toBe('80%');
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('width')).toBe('100%');
    expect(svg?.getAttribute('height')).toBe('100%');
  });

  it('leaf wrapper is 80% with SVG filling 100%', () => {
    const { container } = render(<GlyphPrimitive effectId="leaves" />);
    const wrapper = container.querySelector('[style*="display: flex"]') as HTMLElement | null;
    expect(wrapper?.style.width).toBe('80%');
    expect(wrapper?.style.height).toBe('80%');
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('width')).toBe('100%');
    expect(svg?.getAttribute('height')).toBe('100%');
  });

  it('heart wrapper is 80% with relative inner div filling 100%', () => {
    const { container } = render(<GlyphPrimitive effectId="hearts" />);
    const wrapper = container.querySelector('[style*="display: flex"]') as HTMLElement | null;
    expect(wrapper?.style.width).toBe('80%');
    expect(wrapper?.style.height).toBe('80%');
    const inner = wrapper?.querySelector('[style*="position: relative"]') as HTMLElement | null;
    expect(inner).not.toBeNull();
    expect(inner?.style.width).toBe('100%');
    expect(inner?.style.height).toBe('100%');
  });

  it('star wrapper is 80% with inner shape filling 100%', () => {
    const { container } = render(<GlyphPrimitive effectId="stars" />);
    const wrapper = container.querySelector('[style*="display: flex"]') as HTMLElement | null;
    expect(wrapper?.style.width).toBe('80%');
    expect(wrapper?.style.height).toBe('80%');
    const inner = wrapper?.querySelector('div') as HTMLElement | null;
    expect(inner).not.toBeNull();
    expect(inner?.style.width).toBe('100%');
    expect(inner?.style.height).toBe('100%');
  });
});

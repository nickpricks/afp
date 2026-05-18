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

  // Fix 1: SVG glyphs render at 80% of container
  it('snowflake SVG has width="80%"', () => {
    const { container } = render(<GlyphPrimitive effectId="snowflakes" />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('width')).toBe('80%');
    expect(svg?.getAttribute('height')).toBe('80%');
  });

  it('leaf SVG has width="80%"', () => {
    const { container } = render(<GlyphPrimitive effectId="leaves" />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('width')).toBe('80%');
    expect(svg?.getAttribute('height')).toBe('80%');
  });

  // Fix 1: CSS glyphs have a flex centering wrapper and inner 80% element
  it('heart has a flex centering wrapper (outer div full-size, inner div 80%)', () => {
    const { container } = render(<GlyphPrimitive effectId="hearts" />);
    // The outer wrapper is the first child of the GlyphPrimitive root
    const outerWrapper = container.querySelector('[style*="display: flex"]');
    expect(outerWrapper).not.toBeNull();
    // The relative inner div that holds the two lobes should be 80%
    const innerDiv = outerWrapper?.querySelector(
      '[style*="position: relative"]',
    ) as HTMLElement | null;
    expect(innerDiv).not.toBeNull();
    expect(innerDiv?.style.width).toBe('80%');
    expect(innerDiv?.style.height).toBe('80%');
  });

  it('star has a flex centering wrapper and inner 80% element', () => {
    const { container } = render(<GlyphPrimitive effectId="stars" />);
    const outerWrapper = container.querySelector('[style*="display: flex"]');
    expect(outerWrapper).not.toBeNull();
    // The inner shape div should be 80%
    const innerDiv = outerWrapper?.querySelector('div') as HTMLElement | null;
    expect(innerDiv).not.toBeNull();
    expect(innerDiv?.style.width).toBe('80%');
    expect(innerDiv?.style.height).toBe('80%');
  });
});

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { GlyphPrimitive } from '../glyph-primitives';

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

  it('heart renders pure-CSS shapes (no SVG)', () => {
    const { container } = render(<GlyphPrimitive effectId="hearts" />);
    expect(container.querySelector('svg')).toBeNull();
  });
});

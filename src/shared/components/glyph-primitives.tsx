import * as React from 'react';

/**
 * Shape-primitive glyphs that replace emoji in ambient particle effects.
 * Each glyph picks up the theme accent via `currentColor` so themes can
 * re-tint the particle without per-theme rules.
 *
 * Sizing convention: the {@link GlyphWrapper} renders at GLYPH_INNER_SIZE of the
 * particle container (matching emoji cell padding), and inner shapes fill the
 * wrapper. Single percentage layer instead of nested 100% × 80%.
 *
 * Patronus animals are NOT in this registry — they keep their filtered
 * emoji rendering via `effect.content` in THEME_DEFINITIONS.
 */

/** Glyph render size relative to its particle container. Matches emoji cell padding. */
const GLYPH_INNER_SIZE = '80%';

/** Props for GlyphPrimitive — the effect ID selects the rendered shape. */
interface GlyphProps {
  effectId: string;
}

// Module-level style constants — hoisted once, reused across every particle render.
// Avoids per-particle fresh-object allocations when N=20+ particles are mounted.

const WRAPPER_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: GLYPH_INNER_SIZE,
  height: GLYPH_INNER_SIZE,
};

const FILL: React.CSSProperties = { width: '100%', height: '100%' };

const STAR_STYLE: React.CSSProperties = {
  ...FILL,
  borderRadius: '50%',
  background:
    'radial-gradient(circle, rgba(255,255,255,0.95) 0%, currentColor 60%, transparent 100%)',
  boxShadow: '0 0 6px 1px currentColor',
};

const HEART_CONTAINER_STYLE: React.CSSProperties = { ...FILL, position: 'relative' };

const HEART_LEFT_LOBE_STYLE: React.CSSProperties = {
  position: 'absolute',
  left: 0,
  top: 0,
  width: '60%',
  height: '85%',
  background: 'currentColor',
  borderRadius: '50% 50% 0 0',
  transform: 'rotate(-45deg)',
  transformOrigin: '100% 100%',
};

const HEART_RIGHT_LOBE_STYLE: React.CSSProperties = {
  position: 'absolute',
  right: 0,
  top: 0,
  width: '60%',
  height: '85%',
  background: 'currentColor',
  borderRadius: '50% 50% 0 0',
  transform: 'rotate(45deg)',
  transformOrigin: '0 100%',
};

const INK_BLOT_STYLE: React.CSSProperties = {
  ...FILL,
  background:
    'radial-gradient(ellipse at 40% 55%, currentColor 0%, currentColor 35%, transparent 65%), radial-gradient(circle at 70% 40%, currentColor 0%, currentColor 25%, transparent 50%), radial-gradient(circle at 30% 30%, currentColor 0%, transparent 30%)',
  filter: 'blur(0.4px)',
};

const BUBBLE_STYLE: React.CSSProperties = {
  ...FILL,
  borderRadius: '50%',
  background:
    'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.55) 0%, transparent 50%, transparent 100%)',
  border: '1px solid currentColor',
  opacity: 0.6,
};

const EMBER_STYLE: React.CSSProperties = {
  ...FILL,
  borderRadius: '50%',
  background: 'radial-gradient(ellipse at 50% 100%, #ffaa44 0%, currentColor 35%, transparent 80%)',
  filter: 'blur(0.5px)',
};

const WISP_STYLE: React.CSSProperties = {
  ...FILL,
  borderRadius: '50%',
  background: 'radial-gradient(ellipse, currentColor 0%, transparent 80%)',
  filter: 'blur(2px)',
  opacity: 0.6,
};

const FALLBACK_STYLE: React.CSSProperties = {
  ...FILL,
  borderRadius: '50%',
  background: 'currentColor',
  opacity: 0.4,
};

/** Wrapper that sizes the glyph to GLYPH_INNER_SIZE of the particle container with flex centering. */
const GlyphWrapper = ({ children }: { children: React.ReactNode }): React.ReactElement => (
  <div style={WRAPPER_STYLE}>{children}</div>
);

/** SVG snowflake with 8-arm symmetry — used for Family Blue ambient particles. */
const SnowflakeGlyph = (): React.ReactElement => (
  <GlyphWrapper>
    <svg
      viewBox="0 0 20 20"
      width="100%"
      height="100%"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.8"
      strokeLinecap="round"
    >
      <line x1="10" y1="2" x2="10" y2="18" />
      <line x1="2" y1="10" x2="18" y2="10" />
      <line x1="4.5" y1="4.5" x2="15.5" y2="15.5" />
      <line x1="15.5" y1="4.5" x2="4.5" y2="15.5" />
      <path d="M10 4 L8.5 5.5 M10 4 L11.5 5.5 M10 16 L8.5 14.5 M10 16 L11.5 14.5 M4 10 L5.5 8.5 M4 10 L5.5 11.5 M16 10 L14.5 8.5 M16 10 L14.5 11.5" />
    </svg>
  </GlyphWrapper>
);

/** SVG leaf teardrop — used for Garden Path ambient particles. */
const LeafGlyph = (): React.ReactElement => (
  <GlyphWrapper>
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor" opacity="0.7">
      <path d="M12 2 C 16 6, 20 10, 18 18 C 14 22, 8 20, 6 16 C 4 10, 8 6, 12 2 Z" />
    </svg>
  </GlyphWrapper>
);

/** Radial-gradient glow circle — used for Lullaby star particles. */
const StarGlyph = (): React.ReactElement => (
  <GlyphWrapper>
    <div style={STAR_STYLE} />
  </GlyphWrapper>
);

/** CSS two-lobe heart shape — used for Rose Quartz ambient particles. */
const HeartGlyph = (): React.ReactElement => (
  <GlyphWrapper>
    <div style={HEART_CONTAINER_STYLE}>
      <div style={HEART_LEFT_LOBE_STYLE} />
      <div style={HEART_RIGHT_LOBE_STYLE} />
    </div>
  </GlyphWrapper>
);

/** Blurred multi-radial ink blot — used for Marauder's Map ambient particles. */
const InkBlotGlyph = (): React.ReactElement => (
  <GlyphWrapper>
    <div style={INK_BLOT_STYLE} />
  </GlyphWrapper>
);

/** Translucent bubble circle — used for Deep Mariana ambient particles. */
const BubbleGlyph = (): React.ReactElement => (
  <GlyphWrapper>
    <div style={BUBBLE_STYLE} />
  </GlyphWrapper>
);

/** Warm elliptical ember glow — used for Industrial Furnace ambient particles. */
const EmberGlyph = (): React.ReactElement => (
  <GlyphWrapper>
    <div style={EMBER_STYLE} />
  </GlyphWrapper>
);

/** Blurred radial wisp — used for Expecto Patronum ambient particles. */
const WispGlyph = (): React.ReactElement => (
  <GlyphWrapper>
    <div style={WISP_STYLE} />
  </GlyphWrapper>
);

/** Solid circle fallback for unregistered effect IDs. */
const FallbackGlyph = (): React.ReactElement => (
  <GlyphWrapper>
    <div style={FALLBACK_STYLE} />
  </GlyphWrapper>
);

/** Maps effect IDs to their shape-primitive components. */
const REGISTRY: Record<string, () => React.ReactElement> = {
  snowflakes: SnowflakeGlyph,
  leaves: LeafGlyph,
  stars: StarGlyph,
  hearts: HeartGlyph,
  ink: InkBlotGlyph,
  bubbles: BubbleGlyph,
  embers: EmberGlyph,
  wisps: WispGlyph,
};

/** Renders the registered shape primitive for a given effect ID, or a fallback. */
export function GlyphPrimitive({ effectId }: GlyphProps) {
  const Component = REGISTRY[effectId] ?? FallbackGlyph;
  return <Component />;
}

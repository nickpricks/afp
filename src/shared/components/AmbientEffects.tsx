import React, { useMemo } from 'react';
import { THEME_DEFINITIONS, ThemeId } from '@/themes/themes';
import { GlyphPrimitive } from '@/shared/components/glyph-primitives';
import { EFFECT_SIZE_DEFAULT } from '@/shared/utils/effectSize';
import { useMatchMedia } from '@/shared/hooks/useMatchMedia';
import { useViewportSizeMultiplier } from '@/shared/hooks/useViewportSizeMultiplier';

interface AmbientEffectsProps {
  themeId: ThemeId;
  intensity: number;
  effectSize?: number;
}

/** Depth-correlated rendering constants for ambient particles. A single random `depth` value (0–1)
 * per particle drives scale + opacity + size + duration so motion reads as parallax atmosphere
 * instead of independently-random confetti. Hoisted to module scope so a tweak is one-line and
 * named so the relationship between math and visual is self-evident.
 *
 * - **Scale 0.5–1.5×**: 3:1 ratio reads as depth without losing "far" particles.
 * - **Opacity 0.25–0.8**: far particles stay visible (>0.2); close particles never fully saturate.
 * - **Size 10–26 px**: fits typical ambient particle sizing without dominating content.
 * - **Duration 1×–2×** (close→far): ±5% jitter avoids mechanical sync across particles. */
const PARTICLE_DEPTH = {
  SCALE_BASE: 0.5,
  SCALE_SPAN: 1.0, // → 0.5–1.5×
  OPACITY_BASE: 0.25,
  OPACITY_SPAN: 0.55, // → 0.25–0.8
  /** Sweep effects (e.g. scanline) use a deterministic low opacity so the keyframe
   * doesn't randomly produce a glaring bright line. */
  OPACITY_SWEEP: 0.15,
  SIZE_BASE_PX: 10,
  SIZE_SPAN_PX: 16, // → 10–26 px
  /** Negative delay starts animations mid-cycle so opening a page doesn't reveal a sync wave. */
  DELAY_RANGE_S: -12,
  /** ±5% per-particle duration jitter */
  DURATION_JITTER: 0.1,
  ROTATE_DEG: 360,
} as const;

/**
 * A simple seeded pseudo-random number generator to maintain purity in render.
 * Returns a value between 0 and 1.
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/** Converts a string to a numeric seed */
function stringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Renders dynamic ambient particles based on the current theme and user-defined intensity.
 * Particles are randomized for position, speed, and size using a stable seeded random
 * to satisfy React's purity requirements.
 */
export const AmbientEffects: React.FC<AmbientEffectsProps> = ({
  themeId,
  intensity,
  effectSize = EFFECT_SIZE_DEFAULT,
}) => {
  const theme = THEME_DEFINITIONS[themeId];
  const prefersReducedMotion = useMatchMedia('(prefers-reduced-motion: reduce)');
  const viewportMultiplier = useViewportSizeMultiplier();

  const particles = useMemo(() => {
    if (!theme || intensity <= 0 || prefersReducedMotion) return [];

    const allParticles: {
      id: string;
      effectId: string;
      type: string;
      content: string;
      style: React.CSSProperties;
    }[] = [];

    const themeSeed = stringToSeed(themeId);

    theme.effects.forEach((effect) => {
      // Overlays are handled via CSS classes on the root element
      if (effect.type === 'overlay') return;

      const count = Math.floor(effect.maxParticles * (intensity / 100));
      const effectSeed = stringToSeed(effect.id);

      // Handle comma-separated content lists (e.g. for Patronus animals)
      const contentOptions = effect.content.split(',');

      for (let i = 0; i < count; i++) {
        // Use a stable seed based on theme, effect, and index
        const baseSeed = i + effectSeed + themeSeed;
        const r1 = seededRandom(baseSeed + 1);
        const r2 = seededRandom(baseSeed + 2);
        const r3 = seededRandom(baseSeed + 3);
        const r5 = seededRandom(baseSeed + 5);
        const r6 = seededRandom(baseSeed + 6);
        const r7 = seededRandom(baseSeed + 7);

        // Pick content from options
        const contentIndex = Math.floor(r1 * contentOptions.length);
        const content = contentOptions[contentIndex] || '';

        // Depth drives scale + opacity + size + duration together — see PARTICLE_DEPTH at module top.
        const depth = r5;
        const jitter = (r7 - 0.5) * PARTICLE_DEPTH.DURATION_JITTER;
        const sizeMultiplier = (effectSize / 100) * viewportMultiplier;

        allParticles.push({
          id: `${effect.id}-${i}`,
          effectId: effect.id,
          type: effect.type,
          content,
          style: {
            '--fx-left': `${r1 * 100}%`,
            '--fx-top':
              effect.type === 'twinkle' || effect.type === 'float' ? `${r2 * 100}%` : undefined,
            '--fx-delay': `${r3 * PARTICLE_DEPTH.DELAY_RANGE_S}s`,
            '--fx-duration': `${effect.baseSpeed * (2 - depth) * (1 + jitter)}s`,
            '--fx-rotate': `${depth * PARTICLE_DEPTH.ROTATE_DEG}deg`,
            '--fx-drift': `${r6 * 40 - 20}px`,
            '--fx-drift-y': `${r7 * 40 - 20}px`,
            // `--fx-scale` is the depth axis only — viewport-independent, used in `transform: scale()`
            // for parallax illusion. The size multiplier (viewport + user tier) lives on `--fx-size`
            // exclusively to avoid compounding (mobile would otherwise be 0.65 × 0.65 = 0.42 of desktop).
            '--fx-scale': `${PARTICLE_DEPTH.SCALE_BASE + depth * PARTICLE_DEPTH.SCALE_SPAN}`,
            '--fx-opacity':
              effect.type === 'sweep'
                ? `${PARTICLE_DEPTH.OPACITY_SWEEP}`
                : `${PARTICLE_DEPTH.OPACITY_BASE + depth * PARTICLE_DEPTH.OPACITY_SPAN}`,
            '--fx-size': `${(PARTICLE_DEPTH.SIZE_BASE_PX + depth * PARTICLE_DEPTH.SIZE_SPAN_PX) * sizeMultiplier}px`,
          } as React.CSSProperties,
        });
      }
    });

    return allParticles;
  }, [theme, themeId, intensity, prefersReducedMotion, viewportMultiplier, effectSize]);

  if (particles.length === 0) return null;

  return (
    <div
      className="fx-ambient-container pointer-events-none fixed inset-0 overflow-hidden select-none z-0"
      aria-hidden="true"
    >
      {particles.map((p) => (
        <div key={p.id} className={`fx-particle fx-${p.type} effect-${p.effectId}`} style={p.style}>
          {p.content ? p.content : <GlyphPrimitive effectId={p.effectId} />}
        </div>
      ))}
    </div>
  );
};

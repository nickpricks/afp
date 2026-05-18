import React, { useEffect, useMemo, useState } from 'react';
import { THEME_DEFINITIONS, ThemeId } from '@/themes/themes';
import { GlyphPrimitive } from '@/shared/components/glyph-primitives';

/** Props for AmbientEffects. */
interface AmbientEffectsProps {
  themeId: ThemeId;
  intensity: number;
  effectSize?: number;
}

/** Tracks the user's `prefers-reduced-motion` preference reactively */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent): void => {
      setReduced(e.matches);
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);
  return reduced;
}

/**
 * A simple seeded pseudo-random number generator to maintain purity in render.
 * Returns a value between 0 and 1.
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/** Returns a particle-size multiplier based on viewport width: 0.65 on mobile, 1.0 on desktop. */
function useViewportSizeMultiplier(): number {
  const [multiplier, setMultiplier] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches ? 0.65 : 1.0,
  );
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 640px)');
    const handler = (e: MediaQueryListEvent): void => {
      setMultiplier(e.matches ? 0.65 : 1.0);
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);
  return multiplier;
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
  effectSize = 100,
}) => {
  const theme = THEME_DEFINITIONS[themeId];
  const prefersReducedMotion = usePrefersReducedMotion();
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
        const baseSeed = i + effectSeed + themeSeed;
        const r1 = seededRandom(baseSeed + 1);
        const r2 = seededRandom(baseSeed + 2);
        const r3 = seededRandom(baseSeed + 3);
        // r4 reserved (renumber if reclaimed)
        const r5 = seededRandom(baseSeed + 5);
        const r6 = seededRandom(baseSeed + 6);
        const r7 = seededRandom(baseSeed + 7);

        const contentIndex = Math.floor(r1 * contentOptions.length);
        const content = contentOptions[contentIndex] || '';

        // Depth-correlated scaling: a single random "depth" value drives scale, opacity,
        // size, and duration. Bigger = closer = brighter + faster; smaller = farther = dimmer + slower.
        // The result reads as parallax atmosphere instead of independently-random confetti.
        //
        // Constants chosen for: (a) scale 0.5–1.5x covers a 3:1 size ratio — large enough
        // to read as depth, small enough that even "far" particles aren't lost; (b) opacity
        // 0.25–0.8 keeps far particles visible (>0.2) while close particles never fully
        // saturate (<1.0); (c) size 10–26px fits typical ambient particle sizing without
        // dominating content; (d) duration scales 2x for far → 1x for close, with ±5%
        // jitter to avoid mechanical synchronization across particles.
        const depth = r5;
        const jitter = (r7 - 0.5) * 0.1; // jitter applies to duration; r7 is also reused for drift-y below
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
            '--fx-delay': `${r3 * -12}s`, // Negative delay starts animation midway
            '--fx-duration': `${effect.baseSpeed * (2 - depth) * (1 + jitter)}s`,
            '--fx-rotate': `${depth * 360}deg`,
            '--fx-drift': `${r6 * 40 - 20}px`,
            '--fx-drift-y': `${r7 * 40 - 20}px`,
            '--fx-scale': `${(0.5 + depth * 1.0) * sizeMultiplier}`,
            // Sweep effects (e.g. scanline) use a deterministic low opacity so the keyframe
            // doesn't randomly produce a glaring 0.8 line. All others derive opacity from depth.
            '--fx-opacity': effect.type === 'sweep' ? '0.15' : `${0.25 + depth * 0.55}`,
            '--fx-size': `${(10 + depth * 16) * sizeMultiplier}px`,
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

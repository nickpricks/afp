import React, { useMemo } from 'react';
import { THEME_DEFINITIONS, ThemeId } from '@/themes/themes';

interface AmbientEffectsProps {
  themeId: ThemeId;
  intensity: number;
}

/**
 * A simple seeded pseudo-random number generator to maintain purity in render.
 * Returns a value between 0 and 1.
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * Renders dynamic ambient particles based on the current theme and user-defined intensity.
 * Particles are randomized for position, speed, and size using a stable seeded random
 * to satisfy React's purity requirements.
 */
export const AmbientEffects: React.FC<AmbientEffectsProps> = ({ themeId, intensity }) => {
  const theme = THEME_DEFINITIONS[themeId];
  
  const particles = useMemo(() => {
    if (!theme || intensity <= 0) return [];

    const allParticles: {
      id: string;
      effectId: string;
      type: string;
      content: string;
      style: React.CSSProperties;
    }[] = [];

    theme.effects.forEach((effect) => {
      // Overlays are handled via CSS classes on the root element
      if (effect.type === 'overlay') return;

      const count = Math.floor(effect.maxParticles * (intensity / 100));
      
      for (let i = 0; i < count; i++) {
        // Use a stable seed based on theme, effect, and index
        const baseSeed = i + effect.id.length + themeId.length;
        const r1 = seededRandom(baseSeed + 1);
        const r2 = seededRandom(baseSeed + 2);
        const r3 = seededRandom(baseSeed + 3);
        const r4 = seededRandom(baseSeed + 4);
        const r5 = seededRandom(baseSeed + 5);
        const r6 = seededRandom(baseSeed + 6);
        const r7 = seededRandom(baseSeed + 7);
        const r8 = seededRandom(baseSeed + 8);
        const r9 = seededRandom(baseSeed + 9);
        const r10 = seededRandom(baseSeed + 10);

        allParticles.push({
          id: `${effect.id}-${i}`,
          effectId: effect.id,
          type: effect.type,
          content: effect.content,
          style: {
            '--fx-left': `${r1 * 100}%`,
            '--fx-top': effect.type === 'twinkle' || effect.type === 'float' ? `${r2 * 100}%` : undefined,
            '--fx-delay': `${r3 * -12}s`, // Negative delay starts animation midway
            '--fx-duration': `${effect.baseSpeed + (r4 * 4 - 2)}s`,
            '--fx-rotate': `${r5 * 360}deg`,
            '--fx-drift': `${r6 * 40 - 20}px`,
            '--fx-drift-y': `${r7 * 40 - 20}px`,
            '--fx-scale': `${0.8 + r8 * 0.7}`,
            '--fx-opacity': `${0.3 + r9 * 0.5}`,
            '--fx-size': `${14 + r10 * 8}px`,
          } as React.CSSProperties,
        });
      }
    });

    return allParticles;
  }, [theme, themeId, intensity]);

  if (particles.length === 0) return null;

  return (
    <div className="fx-ambient-container pointer-events-none fixed inset-0 overflow-hidden select-none z-0" aria-hidden="true">
      {particles.map((p) => (
        <div
          key={p.id}
          className={`fx-particle fx-${p.type} effect-${p.effectId}`}
          style={p.style}
        >
          {p.content || <div className="fx-shape w-full h-full rounded-full" style={{ background: 'currentColor', opacity: 0.4 }} />}
        </div>
      ))}
    </div>
  );
};

import { useMemo } from 'react';

import { SceneClimber } from '@/shared/components/loading/SceneClimber';
import { SceneAthlete } from '@/shared/components/loading/SceneAthlete';
import { SceneReader } from '@/shared/components/loading/SceneReader';

const SCENES = [SceneClimber, SceneAthlete, SceneReader] as const;

export const BRAND_TEXT = 'IT STARTED ON APRIL FOOLS DAY';

interface LoadingScreenProps {
  showText?: boolean;
}

/** Full-screen loading overlay with a randomly selected stick-figure animation */
export function LoadingScreen({ showText = true }: LoadingScreenProps) {
  const Scene = useMemo(() => SCENES[Math.floor(Math.random() * SCENES.length)], []);

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-8">
      <Scene />

      {showText && (
        <div
          className="font-mono text-[11px] tracking-[0.25em] uppercase flex"
          aria-label="It Started On April Fools Day"
        >
          {BRAND_TEXT.split('').map((char, i) => (
            <span
              key={i}
              className="loading-letter text-fg-subtle"
              style={{ animationDelay: `${0.3 + i * 0.06}s` }}
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

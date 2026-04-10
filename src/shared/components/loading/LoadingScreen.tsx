import { useRef } from 'react';
import type React from 'react';

import { SceneClimber } from '@/shared/components/loading/SceneClimber';
import { SceneAthlete } from '@/shared/components/loading/SceneAthlete';
import { SceneReader } from '@/shared/components/loading/SceneReader';
import { BRAND_TEXT } from '@/shared/components/loading/constants';

type SceneComponent = React.FC;
const SCENES: SceneComponent[] = [SceneClimber, SceneAthlete, SceneReader];

interface LoadingScreenProps {
  showText?: boolean;
}

/** Full-screen loading overlay with a randomly selected stick-figure animation */
export function LoadingScreen({ showText = true }: LoadingScreenProps) {
  const sceneRef = useRef<SceneComponent | null>(null);
  if (!sceneRef.current) {
    // eslint-disable-next-line react-hooks/purity -- intentional: random scene per mount
    sceneRef.current = SCENES[Math.floor(Math.random() * SCENES.length)]!;
  }
  const Scene = sceneRef.current;

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

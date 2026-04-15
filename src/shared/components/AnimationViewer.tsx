import { useState } from 'react';

import { SceneClimber } from '@/shared/components/loading/SceneClimber';
import { SceneAthlete } from '@/shared/components/loading/SceneAthlete';
import { SceneReader } from '@/shared/components/loading/SceneReader';
import { BRAND_TEXT } from '@/shared/components/loading/constants';

const TABS = ['All', 'Climber', 'Athlete', 'Reader'] as const;
type Tab = (typeof TABS)[number];

/** Dedicated page for previewing loading animations with scene and text controls */
export function AnimationViewer() {
  const [activeTab, setActiveTab] = useState<Tab>('All');
  const [showText, setShowText] = useState(true);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-lg font-bold mb-4">Animation Viewer</h1>

      {/* Pill switcher */}
      <div className="flex gap-1 mb-4 bg-surface-card rounded-lg p-1 border border-line w-fit">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab ? 'bg-accent text-fg-on-accent' : 'text-fg-muted hover:text-fg'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Text checkbox */}
      <label className="flex items-center gap-2 mb-6 text-sm text-fg-muted cursor-pointer">
        <input
          type="checkbox"
          checked={showText}
          onChange={(e) => setShowText(e.target.checked)}
          className="accent-[var(--accent)]"
        />
        Show text
      </label>

      {/* Scene display */}
      <div
        className={`grid gap-8 ${activeTab === 'All' ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1'}`}
      >
        {(activeTab === 'All' || activeTab === 'Climber') && (
          <div className="flex flex-col items-center gap-4 p-6 rounded-lg bg-surface border border-line">
            <SceneClimber />
            {showText && <BrandText />}
            <p className="text-xs text-fg-muted">Climber</p>
          </div>
        )}
        {(activeTab === 'All' || activeTab === 'Athlete') && (
          <div className="flex flex-col items-center gap-4 p-6 rounded-lg bg-surface border border-line">
            <SceneAthlete />
            {showText && <BrandText />}
            <p className="text-xs text-fg-muted">Athlete</p>
          </div>
        )}
        {(activeTab === 'All' || activeTab === 'Reader') && (
          <div className="flex flex-col items-center gap-4 p-6 rounded-lg bg-surface border border-line">
            <SceneReader />
            {showText && <BrandText />}
            <p className="text-xs text-fg-muted">Reader</p>
          </div>
        )}
      </div>
    </div>
  );
}

/** Staggered letter reveal for the brand text */
function BrandText() {
  return (
    <div
      className="font-mono text-[9px] tracking-[0.2em] uppercase flex flex-wrap justify-center"
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
  );
}

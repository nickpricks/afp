import { useState, useCallback, useRef } from 'react';

import { isFirebaseConfigured } from '@/shared/auth/firebase-config';
import { useAuth } from '@/shared/auth/useAuth';
import type { BodyConfig } from '@/modules/body/types';
import type { Child } from '@/modules/baby/types';
import {
  BASE,
  read,
  readDoc,
  bulkRun,
  benchFloors,
  benchWalk,
  benchRun,
  benchCycle,
  benchExpense,
  benchSettlement,
  benchIncome,
  benchFeed,
  benchSleep,
  benchDiaper,
  benchGrowth,
  benchMeal,
  benchNeed,
  benchMilestone,
} from '@/shared/components/bench-generators';
import { applyTheme, THEME_DEFINITIONS, useActiveThemeId } from '@/themes/themes';
import type { ThemeId } from '@/themes/themes';
import { CONFIG } from '@/constants/config';

// ─── BenchButton ────────────────────────────────────────────────────────────

/** Button with flash feedback + bulk options */
function BenchButton({ label, onClick }: { label: string; onClick: (date?: string) => string }) {
  const [flash, setFlash] = useState<string | null>(null);

  const fire = useCallback(
    (count: number) => {
      const msg = count === 1 ? onClick() : bulkRun(onClick, count, label);
      setFlash(msg);
      setTimeout(() => setFlash(null), CONFIG.TIMINGS.FLASH_DURATION_MS);
    },
    [onClick, label],
  );

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => fire(1)}
          className="px-3 py-2 rounded-lg bg-accent text-fg-on-accent text-sm font-medium active:scale-95 transition-transform"
        >
          {label}
        </button>
        <button
          type="button"
          onClick={() => fire(100)}
          className="px-2 py-2 rounded-lg bg-accent/70 text-fg-on-accent text-xs font-mono active:scale-95 transition-transform"
        >
          ×100
        </button>
        <button
          type="button"
          onClick={() => fire(1000)}
          className="px-2 py-2 rounded-lg bg-accent/50 text-fg-on-accent text-xs font-mono active:scale-95 transition-transform"
        >
          ×1k
        </button>
      </div>
      {flash && <span className="text-xs text-fg-muted animate-pulse">{flash}</span>}
    </div>
  );
}

// ─── UserProfilePanel ───────────────────────────────────────────────────────

/** Collapsible panel showing the current user's raw Firestore profile as JSON */
function UserProfilePanel() {
  const { firebaseUser, profile } = useAuth();
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const uid = firebaseUser?.uid ?? 'unknown';
  const firestorePath = `users/${uid}/profile/main`;
  const json = JSON.stringify(profile, null, 2);

  const handleCopy = useCallback(() => {
    navigator.clipboard
      .writeText(json)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), CONFIG.TIMINGS.COPY_FEEDBACK_MS);
      })
      .catch((e) => console.error('[AFP] Clipboard copy failed:', e));
  }, [json]);

  return (
    <div className="mb-3">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1 text-xs font-semibold text-fg-muted mb-2 cursor-pointer hover:text-accent transition-colors"
      >
        <span className="text-[10px]">{open ? '▼' : '▶'}</span>
        <span>User Profile</span>
      </button>
      {open && (
        <div className="rounded-lg bg-surface border border-line p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-fg-muted font-mono">UID: {uid}</span>
            <button
              type="button"
              onClick={handleCopy}
              className="px-2 py-0.5 rounded text-[10px] font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
            >
              {copied ? 'Copied!' : 'Copy JSON'}
            </button>
          </div>
          <p className="text-[10px] text-fg-muted font-mono mb-2">{firestorePath}</p>
          <pre className="text-[11px] font-mono text-fg leading-relaxed overflow-auto max-h-64 whitespace-pre-wrap break-words">
            {json}
          </pre>
        </div>
      )}
    </div>
  );
}

// ─── DevBenchInner ──────────────────────────────────────────────────────────

/** Inner component with hooks — rendered only when Firebase is not configured */
function DevBenchInner() {
  const bodyConfig = readDoc<BodyConfig>(`${BASE}:body_config`);
  const children = read<Child>(`${BASE}:children`);
  const hasChild = children.length > 0;

  const activeThemeId = useActiveThemeId();
  const [tourRunning, setTourRunning] = useState(false);
  const tourTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const originalThemeRef = useRef<ThemeId | null>(null);

  /** Cancels the theme tour and restores the original theme. */
  const stopTour = useCallback(() => {
    if (tourTimeoutRef.current) clearTimeout(tourTimeoutRef.current);
    tourTimeoutRef.current = null;
    if (originalThemeRef.current) {
      applyTheme(originalThemeRef.current, 'system');
      originalThemeRef.current = null;
    }
    setTourRunning(false);
  }, []);

  /** Cycles through all themes at 3s intervals, preserving the original on stop. */
  const startTour = useCallback(() => {
    originalThemeRef.current = activeThemeId;
    const themeIds = Object.values(THEME_DEFINITIONS).map((t) => t.id);
    setTourRunning(true);
    let i = 0;
    const tick = () => {
      if (i >= themeIds.length) {
        stopTour();
        return;
      }
      applyTheme(themeIds[i]!, 'system');
      i++;
      tourTimeoutRef.current = setTimeout(tick, CONFIG.TIMINGS.THEME_TOUR_INTERVAL_MS);
    };
    tick();
  }, [activeThemeId, stopTour]);

  /** Clears all afp: localStorage keys and reloads the page. */
  const handleClear = () => {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith('afp:'));
    keys.forEach((k) => localStorage.removeItem(k));
    window.location.reload();
  };

  return (
    <div className="rounded-xl bg-surface-card border-2 border-dashed border-accent/30 p-4 mx-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-accent uppercase tracking-wide">Dev Bench</h3>
        <button
          type="button"
          onClick={handleClear}
          className="px-2 py-1 rounded text-xs font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20"
        >
          Nuke localStorage
        </button>
      </div>

      {/* User profile data */}
      <UserProfilePanel />

      {/* Body section */}
      {bodyConfig && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-fg-muted mb-2">Body</p>
          <div className="flex flex-wrap gap-2">
            {bodyConfig.floors && <BenchButton label="+ Floors" onClick={benchFloors} />}
            {bodyConfig.walking && <BenchButton label="+ Walk" onClick={benchWalk} />}
            {bodyConfig.running && <BenchButton label="+ Run" onClick={benchRun} />}
            {bodyConfig.cycling && <BenchButton label="+ Cycle" onClick={benchCycle} />}
          </div>
        </div>
      )}
      {!bodyConfig && (
        <p className="text-xs text-fg-muted mb-3">Body: configure first to unlock bench buttons</p>
      )}

      {/* Budget section */}
      <div className="mb-3">
        <p className="text-xs font-semibold text-fg-muted mb-2">Budget</p>
        <div className="flex flex-wrap gap-2">
          <BenchButton label="+ Expense" onClick={benchExpense} />
          <BenchButton label="+ Income" onClick={benchIncome} />
          <BenchButton label="+ Settlement" onClick={benchSettlement} />
        </div>
      </div>

      {/* Baby section */}
      <div className="mb-3">
        <p className="text-xs font-semibold text-fg-muted mb-2">
          Baby{hasChild ? ` (${children[0]?.name})` : ''}
        </p>
        <div className="flex flex-wrap gap-2">
          <BenchButton label="+ Feed" onClick={benchFeed} />
          <BenchButton label="+ Sleep" onClick={benchSleep} />
          <BenchButton label="+ Diaper" onClick={benchDiaper} />
          <BenchButton label="+ Growth" onClick={benchGrowth} />
          <BenchButton label="+ Meal" onClick={benchMeal} />
          <BenchButton label="+ Need" onClick={benchNeed} />
          <BenchButton label="+ Milestone" onClick={benchMilestone} />
        </div>
        {!hasChild && (
          <p className="text-xs text-fg-muted mt-1">First press auto-creates a random child</p>
        )}
      </div>

      {/* Theme Tour section */}
      <section className="border-t border-line pt-4 mt-4">
        <h3 className="text-sm font-semibold text-fg-muted uppercase tracking-wide mb-2">
          Theme Tour
        </h3>
        <p className="text-xs text-fg-muted mb-2">
          Cycles through all 10 themes (3s hold each). Press Stop to abort and restore the original
          theme.
        </p>
        {!tourRunning && (
          <button
            type="button"
            onClick={startTour}
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-fg-on-accent"
          >
            Start Tour
          </button>
        )}
        {tourRunning && (
          <button
            type="button"
            onClick={stopTour}
            className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600"
          >
            Stop Tour
          </button>
        )}
      </section>
    </div>
  );
}

// ─── DevBench Component ─────────────────────────────────────────────────────

/** Dev-only bench panel — visible only when Firebase is not configured */
export function DevBench() {
  if (isFirebaseConfigured) return null;
  return <DevBenchInner />;
}

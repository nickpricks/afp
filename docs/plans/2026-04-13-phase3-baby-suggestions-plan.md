# Phase 3 Baby — Suggestion System (Plan 2 of 9)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the complete age-based suggestion system end-to-end — pure logic + hooks + 3 rendering surfaces (toast, dashboard banner, child-detail strip) + snooze persistence.

**Architecture:** `computeActiveSuggestions(child)` is a pure function reading `ChildConfig` toggles, age (from DoB), and snooze state from `child.suggestionState`. Two hooks expose results: `useSuggestions(child)` per-child, `useAllSuggestions(children)` aggregated. Three components render different surfaces: `SuggestionStrip` (collapsed one-liner in `ChildDetail` shell), `SuggestionBanner` (multi-line in dashboard `BabyCard`), and a session-scoped toast wired in `Layout`. Snooze writes to `users/{uid}/children/{childId}.suggestionState.{feature}.snoozedUntil`.

**Tech Stack:** TypeScript, React 19, Tailwind v4 (semantic CSS tokens), Vitest, `@testing-library/react`, Firebase Firestore.

**Spec:** [`docs/specs/2026-04-13-phase3-baby-to-kid-design.md`](../specs/2026-04-13-phase3-baby-to-kid-design.md) — read § 3.

**Plan position:** Plan 2 of 9 for Module A. **Depends on Plan 1 (foundation)** — uses `Suggestion`, `Child`, `SuggestionSnooze` types and `SUGGEST_THRESHOLDS`, `SUGGESTION_SNOOZE_DAYS` constants.

---

## File Structure

### Created files

| Path | Responsibility |
|---|---|
| `src/modules/baby/suggestions.ts` | `Suggestion`, `SuggestionFeature`, `SuggestionAction` + `computeActiveSuggestions()` + `configFieldFor()` |
| `src/modules/baby/__tests__/suggestions.test.ts` | Unit tests for suggestion firing logic |
| `src/modules/baby/hooks/useSuggestions.ts` | `useSuggestions(child)` and `useAllSuggestions(children)` |
| `src/modules/baby/hooks/useSnooze.ts` | `useSnooze()` action hook (writes to Firestore) |
| `src/modules/baby/components/SuggestionStrip.tsx` | One-line strip for `ChildDetail` shell |
| `src/modules/baby/components/SuggestionBanner.tsx` | Multi-line banner for dashboard `BabyCard` |
| `src/modules/baby/__tests__/SuggestionStrip.test.tsx` | Component test |
| `src/modules/baby/__tests__/SuggestionBanner.test.tsx` | Component test |

### Modified files

| Path | Change |
|---|---|
| `src/shared/constants/messages.ts` | Add `BabyMsg.SuggestionSnoozed`, `.SuggestionEnabled`, `.SuggestionDisabled` |
| `src/shared/components/Layout.tsx` | Wire session-scoped suggestion toast on app open |
| `src/modules/baby/components/ChildDetail.tsx` | Render `<SuggestionStrip>` above tab content |
| `src/shared/components/dashboard/BabyCard.tsx` | Render `<SuggestionBanner>` when active suggestions exist |
| `afp/CHANGELOG.md` | Add suggestion-system entry to `[0.4.0]` Unreleased |

---

## Phase A — Pure Logic

### Task 1: Create suggestions.ts with computeActiveSuggestions

**Files:**
- Create: `src/modules/baby/suggestions.ts`
- Test: `src/modules/baby/__tests__/suggestions.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/modules/baby/__tests__/suggestions.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { computeActiveSuggestions, SuggestionAction } from '../suggestions';
import type { Child } from '../types';

function makeChild(monthsOld: number, configOverrides: Partial<Child['config']> = {}, snooze?: Child['suggestionState']): Child {
  const dob = new Date();
  dob.setMonth(dob.getMonth() - monthsOld);
  return {
    id: 'c1',
    name: 'Test',
    dob: dob.toISOString().split('T')[0],
    config: {
      feeding: true, sleep: true, growth: true, diapers: true,
      meals: false, potty: false, milestones: false, needs: false,
      ...configOverrides,
    },
    createdAt: '', updatedAt: '',
    suggestionState: snooze,
  };
}

describe('computeActiveSuggestions', () => {
  it('returns no suggestions for newborn with default config', () => {
    expect(computeActiveSuggestions(makeChild(1))).toHaveLength(0);
  });

  it('suggests enabling meals at 9mo', () => {
    const sug = computeActiveSuggestions(makeChild(10));
    expect(sug.find(s => s.feature === 'meals')?.action).toBe(SuggestionAction.Enable);
  });

  it('does not suggest meals if already enabled', () => {
    const sug = computeActiveSuggestions(makeChild(10, { meals: true }));
    expect(sug.find(s => s.feature === 'meals')).toBeUndefined();
  });

  it('suggests disabling feeds after 18mo', () => {
    const sug = computeActiveSuggestions(makeChild(20));
    expect(sug.find(s => s.feature === 'feeds')?.action).toBe(SuggestionAction.Disable);
  });

  it('suggests enabling potty at 24mo', () => {
    const sug = computeActiveSuggestions(makeChild(25));
    expect(sug.find(s => s.feature === 'potty')?.action).toBe(SuggestionAction.Enable);
  });

  it('suggests disabling diapers after 30mo', () => {
    const sug = computeActiveSuggestions(makeChild(32));
    expect(sug.find(s => s.feature === 'diapers')?.action).toBe(SuggestionAction.Disable);
  });

  it('hides snoozed suggestions', () => {
    const future = new Date();
    future.setDate(future.getDate() + 10);
    const sug = computeActiveSuggestions(
      makeChild(20, {}, { feeds: { snoozedUntil: future.toISOString().split('T')[0] } })
    );
    expect(sug.find(s => s.feature === 'feeds')).toBeUndefined();
  });

  it('shows expired-snooze suggestions', () => {
    const past = new Date();
    past.setDate(past.getDate() - 1);
    const sug = computeActiveSuggestions(
      makeChild(20, {}, { feeds: { snoozedUntil: past.toISOString().split('T')[0] } })
    );
    expect(sug.find(s => s.feature === 'feeds')?.action).toBe(SuggestionAction.Disable);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/nick/Projects/Github/afp && bunx vitest run src/modules/baby/__tests__/suggestions.test.ts`
Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement suggestions.ts**

Create `src/modules/baby/suggestions.ts`:

```typescript
import { monthsOldFromDob, SUGGEST_THRESHOLDS } from './stage';
import type { Child } from './types';

/** Which feature toggle a suggestion targets */
export type SuggestionFeature = 'feeds' | 'diapers' | 'meals' | 'potty';

/** Whether suggestion recommends enabling or disabling */
export enum SuggestionAction {
  Enable = 0,
  Disable = 1,
}

/** Active suggestion ready to render */
export type Suggestion = {
  childId: string;
  childName: string;
  feature: SuggestionFeature;
  action: SuggestionAction;
};

/** Returns the ChildConfig field name for a feature */
export function configFieldFor(feature: SuggestionFeature): keyof Child['config'] {
  if (feature === 'feeds') return 'feeding';
  return feature;
}

/** Pure function — returns active suggestions for a child */
export function computeActiveSuggestions(child: Child): Suggestion[] {
  const months = monthsOldFromDob(child.dob);
  const config = child.config;
  const snoozeState = child.suggestionState ?? {};
  const today = new Date().toISOString().split('T')[0];
  const result: Suggestion[] = [];

  function isSnoozed(feature: SuggestionFeature): boolean {
    const snooze = snoozeState[feature];
    return snooze !== undefined && snooze.snoozedUntil > today;
  }

  function maybeAdd(feature: SuggestionFeature, action: SuggestionAction, currentlyOn: boolean) {
    const recommendOn = action === SuggestionAction.Enable;
    if (currentlyOn === recommendOn) return;
    if (isSnoozed(feature)) return;
    result.push({
      childId: child.id ?? '',
      childName: child.name,
      feature,
      action,
    });
  }

  if (months >= SUGGEST_THRESHOLDS.meals.suggestOn) {
    maybeAdd('meals', SuggestionAction.Enable, config.meals ?? false);
  }
  if (months >= SUGGEST_THRESHOLDS.potty.suggestOn) {
    maybeAdd('potty', SuggestionAction.Enable, config.potty ?? false);
  }
  if (months >= SUGGEST_THRESHOLDS.feeds.suggestOff) {
    maybeAdd('feeds', SuggestionAction.Disable, config.feeding);
  }
  if (months >= SUGGEST_THRESHOLDS.diapers.suggestOff) {
    maybeAdd('diapers', SuggestionAction.Disable, config.diapers);
  }

  return result;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/nick/Projects/Github/afp && bunx vitest run src/modules/baby/__tests__/suggestions.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/nick/Projects/Github/afp
git add src/modules/baby/suggestions.ts src/modules/baby/__tests__/suggestions.test.ts
git commit -m "feat(baby): add computeActiveSuggestions pure function

- Suggestion firing per per-feature thresholds
- Skips when toggle already matches recommendation
- Skips when snoozed
- configFieldFor() maps feature name → ChildConfig field

Plan 2 (suggestions), Task 1"
```

---

## Phase B — Hooks

### Task 2: useSuggestions and useAllSuggestions hooks

**Files:**
- Create: `src/modules/baby/hooks/useSuggestions.ts`

- [ ] **Step 1: Implement hooks**

Create `src/modules/baby/hooks/useSuggestions.ts`:

```typescript
import { useMemo } from 'react';
import { computeActiveSuggestions, type Suggestion } from '../suggestions';
import type { Child } from '../types';

/** Returns active suggestions for a single child */
export function useSuggestions(child: Child | null | undefined): Suggestion[] {
  return useMemo(() => {
    if (!child) return [];
    return computeActiveSuggestions(child);
  }, [child]);
}

/** Returns active suggestions across all children (for dashboard/toast aggregation) */
export function useAllSuggestions(children: Child[] | null | undefined): Suggestion[] {
  return useMemo(() => {
    if (!children || children.length === 0) return [];
    return children.flatMap(c => computeActiveSuggestions(c));
  }, [children]);
}
```

- [ ] **Step 2: Verify typecheck**

Run: `cd /Users/nick/Projects/Github/afp && bun run lint`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
cd /Users/nick/Projects/Github/afp
git add src/modules/baby/hooks/useSuggestions.ts
git commit -m "feat(baby): add useSuggestions and useAllSuggestions hooks

Plan 2 (suggestions), Task 2"
```

---

### Task 3: useSnooze action hook

**Files:**
- Create: `src/modules/baby/hooks/useSnooze.ts`

- [ ] **Step 1: Implement useSnooze**

Create `src/modules/baby/hooks/useSnooze.ts`:

```typescript
import { useCallback } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/shared/auth/firebase-config';
import { useAuth } from '@/shared/auth/useAuth';
import { SUGGESTION_SNOOZE_DAYS } from '../stage';
import { ok, err, type Result } from '@/shared/types';
import type { SuggestionFeature } from '../suggestions';

/** Action to snooze a suggestion for SUGGESTION_SNOOZE_DAYS days */
export function useSnooze() {
  const { firebaseUser } = useAuth();

  const snooze = useCallback(
    async (childId: string, feature: SuggestionFeature): Promise<Result<void>> => {
      if (!firebaseUser) return err(new Error('Not authenticated'));
      const future = new Date();
      future.setDate(future.getDate() + SUGGESTION_SNOOZE_DAYS);
      const snoozedUntil = future.toISOString().split('T')[0];
      try {
        const ref = doc(db, `users/${firebaseUser.uid}/children/${childId}`);
        await updateDoc(ref, {
          [`suggestionState.${feature}.snoozedUntil`]: snoozedUntil,
        });
        return ok(undefined);
      } catch (e) {
        return err(e instanceof Error ? e : new Error(String(e)));
      }
    },
    [firebaseUser]
  );

  return { snooze };
}
```

- [ ] **Step 2: Verify typecheck**

Run: `cd /Users/nick/Projects/Github/afp && bun run lint`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
cd /Users/nick/Projects/Github/afp
git add src/modules/baby/hooks/useSnooze.ts
git commit -m "feat(baby): add useSnooze action hook

Writes child.suggestionState.{feature}.snoozedUntil to Firestore

Plan 2 (suggestions), Task 3"
```

---

## Phase C — UI Components

### Task 4: SuggestionStrip component

**Files:**
- Modify: `src/shared/constants/messages.ts`
- Create: `src/modules/baby/components/SuggestionStrip.tsx`
- Test: `src/modules/baby/__tests__/SuggestionStrip.test.tsx`

- [ ] **Step 1: Add message constants**

In `src/shared/constants/messages.ts`, add to `BabyMsg` enum:

```typescript
export enum BabyMsg {
  // ... existing entries
  SuggestionSnoozed = 'Suggestion snoozed for 30 days',
  SuggestionEnabled = 'Module enabled',
  SuggestionDisabled = 'Module disabled',
}
```

- [ ] **Step 2: Implement SuggestionStrip**

Create `src/modules/baby/components/SuggestionStrip.tsx`:

```typescript
import { useState } from 'react';
import type { Suggestion } from '../suggestions';
import { SuggestionAction } from '../suggestions';
import { useSnooze } from '../hooks/useSnooze';
import { useToast } from '@/shared/errors/useToast';
import { ToastType } from '@/shared/types';
import { BabyMsg } from '@/shared/constants/messages';

type Props = {
  suggestions: Suggestion[];
  onEnable: (childId: string, feature: Suggestion['feature']) => Promise<void>;
};

/** One-line strip in ChildDetail shell — visible across all child tabs */
export function SuggestionStrip({ suggestions, onEnable }: Props): JSX.Element | null {
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const { snooze } = useSnooze();
  const { addToast } = useToast();

  if (dismissed || suggestions.length === 0) return null;

  const first = suggestions[0];
  const verb = first.action === SuggestionAction.Enable ? 'enable' : 'disable';
  const label = first.feature.charAt(0).toUpperCase() + first.feature.slice(1);
  const summary = suggestions.length === 1
    ? `Suggestion: ${verb} ${label} module`
    : `${suggestions.length} suggestions for this child`;

  async function handleAct() {
    await onEnable(first.childId, first.feature);
    addToast(
      first.action === SuggestionAction.Enable ? BabyMsg.SuggestionEnabled : BabyMsg.SuggestionDisabled,
      ToastType.Success
    );
  }

  async function handleSnooze() {
    const result = await snooze(first.childId, first.feature);
    if (result.ok) {
      addToast(BabyMsg.SuggestionSnoozed, ToastType.Info);
      setDismissed(true);
    } else {
      addToast(result.error.message, ToastType.Error);
    }
  }

  return (
    <div className="bg-[var(--accent-muted)] border-l-2 border-l-accent px-3 py-2 text-sm">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between text-left text-fg"
      >
        <span>{summary}</span>
        <span className="text-fg-muted">{expanded ? '▾' : '▸'}</span>
      </button>
      {expanded && (
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={handleAct}
            className="rounded bg-accent px-3 py-1 text-xs text-fg-on-accent"
          >
            {first.action === SuggestionAction.Enable ? 'Enable' : 'Disable'}
          </button>
          <button
            type="button"
            onClick={handleSnooze}
            className="rounded border border-line px-3 py-1 text-xs text-fg-muted"
          >
            Snooze 30d
          </button>
          <button
            type="button"
            onClick={handleSnooze}
            className="rounded px-3 py-1 text-xs text-fg-muted"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Write component test**

Create `src/modules/baby/__tests__/SuggestionStrip.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SuggestionStrip } from '../components/SuggestionStrip';
import { SuggestionAction, type Suggestion } from '../suggestions';

vi.mock('../hooks/useSnooze', () => ({
  useSnooze: () => ({ snooze: vi.fn(async () => ({ ok: true, value: undefined })) }),
}));
vi.mock('@/shared/errors/useToast', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

const suggestion: Suggestion = {
  childId: 'c1', childName: 'Aanya', feature: 'meals', action: SuggestionAction.Enable,
};

describe('SuggestionStrip', () => {
  it('renders nothing when no suggestions', () => {
    const { container } = render(<SuggestionStrip suggestions={[]} onEnable={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows summary line for one suggestion', () => {
    render(<SuggestionStrip suggestions={[suggestion]} onEnable={vi.fn()} />);
    expect(screen.getByText(/enable Meals module/i)).toBeInTheDocument();
  });

  it('expands to show actions on click', () => {
    render(<SuggestionStrip suggestions={[suggestion]} onEnable={vi.fn()} />);
    fireEvent.click(screen.getByText(/enable Meals/i));
    expect(screen.getByRole('button', { name: 'Enable' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Snooze 30d' })).toBeInTheDocument();
  });

  it('calls onEnable when Enable clicked', () => {
    const onEnable = vi.fn();
    render(<SuggestionStrip suggestions={[suggestion]} onEnable={onEnable} />);
    fireEvent.click(screen.getByText(/enable Meals/i));
    fireEvent.click(screen.getByRole('button', { name: 'Enable' }));
    expect(onEnable).toHaveBeenCalledWith('c1', 'meals');
  });

  it('shows aggregate summary for multiple suggestions', () => {
    const second: Suggestion = { ...suggestion, feature: 'feeds', action: SuggestionAction.Disable };
    render(<SuggestionStrip suggestions={[suggestion, second]} onEnable={vi.fn()} />);
    expect(screen.getByText(/2 suggestions/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Run tests**

Run: `cd /Users/nick/Projects/Github/afp && bunx vitest run src/modules/baby/__tests__/SuggestionStrip.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/nick/Projects/Github/afp
git add src/modules/baby/components/SuggestionStrip.tsx \
        src/modules/baby/__tests__/SuggestionStrip.test.tsx \
        src/shared/constants/messages.ts
git commit -m "feat(baby): add SuggestionStrip component

- One-line collapsed banner; expand to Enable/Snooze/Dismiss
- Uses BabyMsg enum constants for toast messages
- Theme-aware (accent-muted background, semantic tokens)

Plan 2 (suggestions), Task 4"
```

---

### Task 5: SuggestionBanner component

**Files:**
- Create: `src/modules/baby/components/SuggestionBanner.tsx`
- Test: `src/modules/baby/__tests__/SuggestionBanner.test.tsx`

- [ ] **Step 1: Implement SuggestionBanner**

Create `src/modules/baby/components/SuggestionBanner.tsx`:

```typescript
import { useState } from 'react';
import type { Suggestion } from '../suggestions';
import { SuggestionAction } from '../suggestions';
import { useSnooze } from '../hooks/useSnooze';
import { useToast } from '@/shared/errors/useToast';
import { ToastType } from '@/shared/types';
import { BabyMsg } from '@/shared/constants/messages';

type Props = {
  suggestions: Suggestion[];
  onAct: (childId: string, feature: Suggestion['feature'], action: SuggestionAction) => Promise<void>;
};

/** Multi-line banner for dashboard BabyCard */
export function SuggestionBanner({ suggestions, onAct }: Props): JSX.Element | null {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const { snooze } = useSnooze();
  const { addToast } = useToast();

  const visible = suggestions.filter(s => !dismissedIds.has(`${s.childId}:${s.feature}`));
  if (visible.length === 0) return null;

  async function handleSnooze(s: Suggestion) {
    const result = await snooze(s.childId, s.feature);
    if (result.ok) {
      addToast(BabyMsg.SuggestionSnoozed, ToastType.Info);
      setDismissedIds(prev => new Set(prev).add(`${s.childId}:${s.feature}`));
    } else {
      addToast(result.error.message, ToastType.Error);
    }
  }

  return (
    <div className="rounded-lg border border-line bg-[var(--accent-muted)] p-3 text-sm">
      <div className="mb-2 font-medium text-fg">Suggestions ({visible.length})</div>
      <ul className="space-y-2">
        {visible.map(s => {
          const verb = s.action === SuggestionAction.Enable ? 'Enable' : 'Disable';
          const label = s.feature.charAt(0).toUpperCase() + s.feature.slice(1);
          return (
            <li key={`${s.childId}:${s.feature}`} className="flex items-center justify-between gap-2">
              <span className="text-fg-muted">
                <strong className="text-fg">{s.childName}</strong>: {verb.toLowerCase()} {label}
              </span>
              <span className="flex gap-1">
                <button
                  type="button"
                  onClick={() => onAct(s.childId, s.feature, s.action)}
                  className="rounded bg-accent px-2 py-1 text-xs text-fg-on-accent"
                >
                  {verb}
                </button>
                <button
                  type="button"
                  onClick={() => handleSnooze(s)}
                  className="rounded border border-line px-2 py-1 text-xs text-fg-muted"
                >
                  Snooze
                </button>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
```

- [ ] **Step 2: Write component test**

Create `src/modules/baby/__tests__/SuggestionBanner.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SuggestionBanner } from '../components/SuggestionBanner';
import { SuggestionAction, type Suggestion } from '../suggestions';

vi.mock('../hooks/useSnooze', () => ({
  useSnooze: () => ({ snooze: vi.fn(async () => ({ ok: true, value: undefined })) }),
}));
vi.mock('@/shared/errors/useToast', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

const suggestion1: Suggestion = {
  childId: 'c1', childName: 'Aanya', feature: 'meals', action: SuggestionAction.Enable,
};
const suggestion2: Suggestion = {
  childId: 'c2', childName: 'Vikas', feature: 'feeds', action: SuggestionAction.Disable,
};

describe('SuggestionBanner', () => {
  it('renders nothing when no suggestions', () => {
    const { container } = render(<SuggestionBanner suggestions={[]} onAct={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows count and entries', () => {
    render(<SuggestionBanner suggestions={[suggestion1, suggestion2]} onAct={vi.fn()} />);
    expect(screen.getByText(/Suggestions \(2\)/)).toBeInTheDocument();
    expect(screen.getByText('Aanya')).toBeInTheDocument();
    expect(screen.getByText('Vikas')).toBeInTheDocument();
  });

  it('calls onAct when Enable clicked', () => {
    const onAct = vi.fn();
    render(<SuggestionBanner suggestions={[suggestion1]} onAct={onAct} />);
    fireEvent.click(screen.getByRole('button', { name: 'Enable' }));
    expect(onAct).toHaveBeenCalledWith('c1', 'meals', SuggestionAction.Enable);
  });
});
```

- [ ] **Step 3: Run tests**

Run: `cd /Users/nick/Projects/Github/afp && bunx vitest run src/modules/baby/__tests__/SuggestionBanner.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 4: Commit**

```bash
cd /Users/nick/Projects/Github/afp
git add src/modules/baby/components/SuggestionBanner.tsx \
        src/modules/baby/__tests__/SuggestionBanner.test.tsx
git commit -m "feat(baby): add SuggestionBanner component

- Multi-line banner with per-suggestion Enable/Snooze actions
- Aggregates across children
- Theme-aware (accent-muted background, semantic tokens)

Plan 2 (suggestions), Task 5"
```

---

## Phase D — Integration

### Task 6: Wire SuggestionStrip into ChildDetail

**Files:**
- Modify: `src/modules/baby/components/ChildDetail.tsx`

- [ ] **Step 1: Add imports and apply-suggestion handler**

In `src/modules/baby/components/ChildDetail.tsx`, add at the top:

```typescript
import { SuggestionStrip } from './SuggestionStrip';
import { useSuggestions } from '../hooks/useSuggestions';
import { configFieldFor } from '../suggestions';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/shared/auth/firebase-config';
import { useAuth } from '@/shared/auth/useAuth';
import { SuggestionAction } from '../suggestions';
```

Inside the `ChildDetail` component (above the JSX return):

```typescript
const suggestions = useSuggestions(child);
const { firebaseUser } = useAuth();

async function applySuggestion(childId: string, feature: 'feeds' | 'diapers' | 'meals' | 'potty') {
  if (!firebaseUser) return;
  const sug = suggestions.find(s => s.feature === feature);
  if (!sug) return;
  const recommendOn = sug.action === SuggestionAction.Enable;
  const field = configFieldFor(feature);
  const ref = doc(db, `users/${firebaseUser.uid}/children/${childId}`);
  await updateDoc(ref, { [`config.${field}`]: recommendOn });
}
```

- [ ] **Step 2: Add the strip to JSX**

In the return JSX, immediately above the tab nav/content rendering, add:

```typescript
<SuggestionStrip suggestions={suggestions} onEnable={applySuggestion} />
```

- [ ] **Step 3: Verify typecheck**

Run: `cd /Users/nick/Projects/Github/afp && bun run lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
cd /Users/nick/Projects/Github/afp
git add src/modules/baby/components/ChildDetail.tsx
git commit -m "feat(baby): wire SuggestionStrip into ChildDetail shell

- Visible above tab content across all child tabs
- Enable action writes ChildConfig flag directly to Firestore

Plan 2 (suggestions), Task 6"
```

---

### Task 7: Wire SuggestionBanner into dashboard BabyCard

**Files:**
- Modify: `src/shared/components/dashboard/BabyCard.tsx` (or wherever the baby summary card lives — confirm path before editing)

- [ ] **Step 1: Add imports and handler**

Add imports:

```typescript
import { SuggestionBanner } from '@/modules/baby/components/SuggestionBanner';
import { useChildren } from '@/modules/baby/hooks/useChildren';
import { useAllSuggestions } from '@/modules/baby/hooks/useSuggestions';
import { configFieldFor, SuggestionAction } from '@/modules/baby/suggestions';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/shared/auth/firebase-config';
import { useAuth } from '@/shared/auth/useAuth';
```

In the component body, after `useChildren()`:

```typescript
const allSuggestions = useAllSuggestions(children);
const { firebaseUser } = useAuth();

async function applySuggestion(
  childId: string,
  feature: 'feeds' | 'diapers' | 'meals' | 'potty',
  action: SuggestionAction
) {
  if (!firebaseUser) return;
  const recommendOn = action === SuggestionAction.Enable;
  const field = configFieldFor(feature);
  const ref = doc(db, `users/${firebaseUser.uid}/children/${childId}`);
  await updateDoc(ref, { [`config.${field}`]: recommendOn });
}
```

- [ ] **Step 2: Render banner inside BabyCard JSX**

```typescript
<SuggestionBanner suggestions={allSuggestions} onAct={applySuggestion} />
```

- [ ] **Step 3: Verify typecheck**

Run: `cd /Users/nick/Projects/Github/afp && bun run lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
cd /Users/nick/Projects/Github/afp
git add src/shared/components/dashboard/BabyCard.tsx
git commit -m "feat(baby): wire SuggestionBanner into dashboard BabyCard

Plan 2 (suggestions), Task 7"
```

---

### Task 8: Session-scoped suggestion toast

**Files:**
- Modify: `src/shared/components/Layout.tsx`

- [ ] **Step 1: Add session-scoped toast trigger**

In `src/shared/components/Layout.tsx`, add imports:

```typescript
import { useEffect, useRef } from 'react';
import { useChildren } from '@/modules/baby/hooks/useChildren';
import { useAllSuggestions } from '@/modules/baby/hooks/useSuggestions';
import { useToast } from '@/shared/errors/useToast';
import { ToastType } from '@/shared/types';
import { useNavigate } from 'react-router-dom';
import { AppPath } from '@/constants/routes';
```

Inside the Layout component:

```typescript
const { children } = useChildren();
const allSuggestions = useAllSuggestions(children);
const { addToast } = useToast();
const navigate = useNavigate();
const toastShownRef = useRef(false);

useEffect(() => {
  if (toastShownRef.current) return;
  if (allSuggestions.length === 0) return;
  toastShownRef.current = true;
  const message = allSuggestions.length === 1
    ? `1 suggestion for ${allSuggestions[0].childName}`
    : `${allSuggestions.length} suggestions across your children`;
  addToast(message, ToastType.Info, {
    action: { label: 'View', onClick: () => navigate(AppPath.Home) },
    durationMs: 6000,
  });
}, [allSuggestions, addToast, navigate]);
```

- [ ] **Step 2: Verify typecheck**

Run: `cd /Users/nick/Projects/Github/afp && bun run lint`
Expected: PASS.

- [ ] **Step 3: Update CHANGELOG**

In `afp/CHANGELOG.md`, ensure a `[0.4.0] — Unreleased` block exists; add under `### Added`:

```markdown
- Suggestion system: per-feature age thresholds, 3 surfaces (toast / dashboard banner / child-detail strip), 30-day snooze
```

- [ ] **Step 4: Commit**

```bash
cd /Users/nick/Projects/Github/afp
git add src/shared/components/Layout.tsx CHANGELOG.md
git commit -m "feat(baby): show session-scoped toast for active suggestions

- Fires once per session when AFP first opens with active suggestions
- Aggregates across all children
- 'View' action navigates to dashboard
- CHANGELOG entry for suggestion system

Plan 2 (suggestions), Task 8"
```

---

## Self-Review

| Check | Result |
|---|---|
| Spec coverage | § 3 (Suggestion System) — all three surfaces + snooze + lifecycle covered |
| Type consistency | `SuggestionFeature` union, `SuggestionAction` enum, `configFieldFor()` helper used consistently across logic, hooks, components, integration |
| Placeholder scan | None — all code complete |
| Test coverage | 8 unit tests (logic) + 5 + 3 component tests = 16 tests added |
| Build state on completion | Compiles, tests pass, suggestion features fully active |

---

## Execution

**Plan complete. Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between
2. **Inline Execution** — sequential in current session via `executing-plans` skill

8 tasks; subagent-driven works well here since tasks are independent.

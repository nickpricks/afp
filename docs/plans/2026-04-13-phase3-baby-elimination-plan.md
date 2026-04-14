# Phase 3 Baby — Combined Diaper/Potty (Plan 3 of 9)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the standalone `Diaper` log with a combined `Elimination` log that handles both diaper events (infant) and potty events (toddler+) via a single subcollection with a `mode` discriminator. Includes one-time backfill migration.

**Architecture:** New `elimination` subcollection at `/users/{uid}/children/{childId}/elimination/{id}`. Entries discriminated by `mode: EliminationMode` (`Diaper | Potty`). UI mode (form labels + entry types) determined by `ChildConfig.diapers` + `ChildConfig.potty` flags. Existing `diapers/*` data preserved (not deleted) — backfill copies to new path.

**Tech Stack:** TypeScript, React, Firebase Firestore (writeBatch for migration), Vitest.

**Spec:** [`docs/specs/2026-04-13-phase3-baby-to-kid-design.md`](../specs/2026-04-13-phase3-baby-to-kid-design.md) — read § 5.

**Plan position:** Plan 3 of 9 for Module A. **Depends on Plan 1 (foundation)** — uses `EliminationMode`, `PottyType`, `EliminationEntry`, extended `ChildConfig`.

---

## File Structure

### Created files

| Path | Responsibility |
|---|---|
| `src/modules/baby/migration/elimination.ts` | `transformDiaperToElimination()` pure function + `migrateChildDiapersToElimination()` Firestore backfill |
| `src/modules/baby/__tests__/migration-elimination.test.ts` | Tests for pure transform |
| `src/modules/baby/components/EliminationLog.tsx` | Combined Diaper/Potty log (new) |
| `src/modules/baby/__tests__/EliminationLog.test.tsx` | Component test |

### Modified files

| Path | Change |
|---|---|
| `src/modules/baby/components/ChildDetail.tsx` | Replace `<DiaperLog>` import with `<EliminationLog>` |
| `src/admin/components/UsersTab.tsx` | Add `potty` toggle to per-child config editor |
| `afp/CHANGELOG.md` | Add elimination-module entry |

### Deleted files

| Path | Action |
|---|---|
| `src/modules/baby/components/DiaperLog.tsx` | Delete (replaced by EliminationLog) |
| `src/modules/baby/__tests__/DiaperLog.test.tsx` | Delete if exists (replaced by EliminationLog.test.tsx) |

---

## Phase A — Migration Helper

### Task 1: transformDiaperToElimination + Firestore backfill

**Files:**
- Create: `src/modules/baby/migration/elimination.ts`
- Test: `src/modules/baby/__tests__/migration-elimination.test.ts`

- [ ] **Step 1: Write failing test**

Create `src/modules/baby/__tests__/migration-elimination.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { transformDiaperToElimination } from '../migration/elimination';
import { DiaperType, EliminationMode, type DiaperEntry, type EliminationEntry } from '../types';

describe('transformDiaperToElimination', () => {
  it('converts a DiaperEntry to an EliminationEntry with mode=Diaper', () => {
    const diaper: DiaperEntry = {
      id: 'd1',
      date: '2026-04-01',
      time: '10:30',
      type: DiaperType.Wet,
      timestamp: '2026-04-01T10:30:00Z',
      createdAt: '2026-04-01T10:30:00Z',
      notes: 'morning change',
    };
    const result: EliminationEntry = transformDiaperToElimination(diaper);
    expect(result.mode).toBe(EliminationMode.Diaper);
    expect(result.diaperType).toBe(DiaperType.Wet);
    expect(result.pottyType).toBeUndefined();
    expect(result.id).toBe('d1');
    expect(result.notes).toBe('morning change');
  });

  it('preserves timestamps', () => {
    const diaper: DiaperEntry = {
      id: 'd2', date: '2026-04-02', time: '14:00',
      type: DiaperType.Mixed,
      timestamp: '2026-04-02T14:00:00Z',
      createdAt: '2026-04-02T14:00:01Z',
      notes: '',
    };
    const result = transformDiaperToElimination(diaper);
    expect(result.timestamp).toBe('2026-04-02T14:00:00Z');
    expect(result.createdAt).toBe('2026-04-02T14:00:01Z');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/nick/Projects/Github/afp && bunx vitest run src/modules/baby/__tests__/migration-elimination.test.ts`
Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement migration helper**

Create `src/modules/baby/migration/elimination.ts`:

```typescript
import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '@/shared/auth/firebase-config';
import { ok, err, type Result } from '@/shared/types';
import { EliminationMode, type DiaperEntry, type EliminationEntry } from '../types';

/** Pure transform — DiaperEntry → EliminationEntry with mode=Diaper */
export function transformDiaperToElimination(diaper: DiaperEntry): EliminationEntry {
  return {
    id: diaper.id,
    date: diaper.date,
    time: diaper.time,
    mode: EliminationMode.Diaper,
    diaperType: diaper.type,
    timestamp: diaper.timestamp,
    createdAt: diaper.createdAt,
    notes: diaper.notes,
  };
}

/** One-time backfill: copies all diapers/* under a child to elimination/* */
export async function migrateChildDiapersToElimination(
  uid: string,
  childId: string
): Promise<Result<{ migrated: number }>> {
  try {
    const diapersRef = collection(db, `users/${uid}/children/${childId}/diapers`);
    const snap = await getDocs(diapersRef);
    if (snap.empty) return ok({ migrated: 0 });

    const batch = writeBatch(db);
    let count = 0;
    snap.forEach(d => {
      const diaper = { id: d.id, ...d.data() } as DiaperEntry;
      const eliminationEntry = transformDiaperToElimination(diaper);
      const targetRef = doc(db, `users/${uid}/children/${childId}/elimination/${d.id}`);
      const { id: _id, ...payload } = eliminationEntry;
      batch.set(targetRef, payload);
      count += 1;
    });
    await batch.commit();
    return ok({ migrated: count });
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/nick/Projects/Github/afp && bunx vitest run src/modules/baby/__tests__/migration-elimination.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/nick/Projects/Github/afp
git add src/modules/baby/migration/elimination.ts \
        src/modules/baby/__tests__/migration-elimination.test.ts
git commit -m "feat(baby): add diaper→elimination migration helper

- transformDiaperToElimination pure function (tested)
- migrateChildDiapersToElimination Firestore backfill via writeBatch
- Old diapers/* not deleted (preserved)

Plan 3 (elimination), Task 1"
```

---

## Phase B — UI Component

### Task 2: EliminationLog component (replaces DiaperLog)

**Files:**
- Create: `src/modules/baby/components/EliminationLog.tsx`
- Modify: `src/modules/baby/components/ChildDetail.tsx`
- Test: `src/modules/baby/__tests__/EliminationLog.test.tsx`
- Delete: `src/modules/baby/components/DiaperLog.tsx`

- [ ] **Step 1: Implement EliminationLog**

Create `src/modules/baby/components/EliminationLog.tsx`:

```typescript
import { useState } from 'react';
import { useBabyCollection } from '../hooks/useBabyCollection';
import {
  EliminationMode,
  DiaperType,
  PottyType,
  type Child,
  type EliminationEntry,
} from '../types';
import { todayStr, nowTime } from '@/shared/utils/date';
import { sortNewestFirst } from '@/shared/utils/sort';
import { useToast } from '@/shared/errors/useToast';
import { ToastType } from '@/shared/types';

type Props = { child: Child };

/** Combined Diaper/Potty log — mode determined by child config */
export function EliminationLog({ child }: Props): JSX.Element {
  const showDiaper = child.config.diapers;
  const showPotty = child.config.potty;
  const defaultMode = showPotty && !showDiaper ? EliminationMode.Potty : EliminationMode.Diaper;

  const [mode, setMode] = useState<EliminationMode>(defaultMode);
  const [date, setDate] = useState(todayStr());
  const [time, setTime] = useState(nowTime());
  const [diaperType, setDiaperType] = useState<DiaperType>(DiaperType.Wet);
  const [pottyType, setPottyType] = useState<PottyType>(PottyType.Pee);
  const [notes, setNotes] = useState('');
  const { addToast } = useToast();

  const { items, log, remove } = useBabyCollection<EliminationEntry>(
    child.id ?? '',
    'elimination',
    'Elimination'
  );

  const headerLabel = showDiaper && showPotty
    ? 'Elimination Log'
    : showPotty
    ? 'Potty Log'
    : 'Diaper Log';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const entry: Omit<EliminationEntry, 'id'> = {
      date, time, mode,
      diaperType: mode === EliminationMode.Diaper ? diaperType : undefined,
      pottyType: mode === EliminationMode.Potty ? pottyType : undefined,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      notes,
    };
    const result = await log(entry);
    if (result.ok) {
      setNotes('');
      addToast('Logged', ToastType.Success);
    } else {
      addToast(result.error.message, ToastType.Error);
    }
  }

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-fg">{headerLabel}</h2>

      {showDiaper && showPotty && (
        <div className="mb-3 flex gap-2">
          <button
            type="button"
            onClick={() => setMode(EliminationMode.Diaper)}
            className={`rounded px-3 py-1 text-sm ${mode === EliminationMode.Diaper ? 'bg-accent text-fg-on-accent' : 'border border-line text-fg-muted'}`}
          >
            Diaper
          </button>
          <button
            type="button"
            onClick={() => setMode(EliminationMode.Potty)}
            className={`rounded px-3 py-1 text-sm ${mode === EliminationMode.Potty ? 'bg-accent text-fg-on-accent' : 'border border-line text-fg-muted'}`}
          >
            Potty
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mb-4 space-y-2">
        <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
        <input type="time" value={time} onChange={e => setTime(e.target.value)} required />

        {mode === EliminationMode.Diaper && (
          <select value={diaperType} onChange={e => setDiaperType(Number(e.target.value) as DiaperType)}>
            <option value={DiaperType.Wet}>Wet</option>
            <option value={DiaperType.Dirty}>Dirty</option>
            <option value={DiaperType.Mixed}>Mixed</option>
          </select>
        )}
        {mode === EliminationMode.Potty && (
          <select value={pottyType} onChange={e => setPottyType(Number(e.target.value) as PottyType)}>
            <option value={PottyType.Pee}>Pee</option>
            <option value={PottyType.Poop}>Poop</option>
            <option value={PottyType.Both}>Both</option>
            <option value={PottyType.Accident}>Accident</option>
            <option value={PottyType.Attempt}>Attempt</option>
          </select>
        )}

        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optional)" />

        <button type="submit" className="rounded bg-accent px-4 py-2 text-fg-on-accent">Log</button>
      </form>

      <ul className="space-y-1">
        {sortNewestFirst(items).map(entry => (
          <li key={entry.id} className="flex justify-between text-sm">
            <span>
              {entry.date} {entry.time} —{' '}
              {entry.mode === EliminationMode.Diaper
                ? `Diaper: ${DiaperType[entry.diaperType ?? DiaperType.Wet]}`
                : `Potty: ${PottyType[entry.pottyType ?? PottyType.Pee]}`}
            </span>
            <button
              type="button"
              onClick={() => remove(entry.id)}
              aria-label="delete"
              className="text-fg-muted"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 2: Update ChildDetail.tsx imports**

In `src/modules/baby/components/ChildDetail.tsx`, replace:

```typescript
import { DiaperLog } from './DiaperLog';
```

with:

```typescript
import { EliminationLog } from './EliminationLog';
```

And in the JSX where `<DiaperLog />` was rendered, replace with:

```typescript
{(child.config.diapers || child.config.potty) && <EliminationLog child={child} />}
```

- [ ] **Step 3: Delete the old DiaperLog file(s)**

```bash
cd /Users/nick/Projects/Github/afp
git rm src/modules/baby/components/DiaperLog.tsx
git rm src/modules/baby/__tests__/DiaperLog.test.tsx 2>/dev/null || true
```

- [ ] **Step 4: Write component test**

Create `src/modules/baby/__tests__/EliminationLog.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EliminationLog } from '../components/EliminationLog';
import { type Child } from '../types';

vi.mock('../hooks/useBabyCollection', () => ({
  useBabyCollection: () => ({
    items: [],
    log: vi.fn(async () => ({ ok: true, value: undefined })),
    remove: vi.fn(),
    update: vi.fn(),
  }),
}));
vi.mock('@/shared/errors/useToast', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

function makeChild(diapers: boolean, potty: boolean): Child {
  return {
    id: 'c1', name: 'Test', dob: '2025-01-01',
    config: { feeding: true, sleep: true, growth: true, diapers, meals: false, potty, milestones: false, needs: false },
    createdAt: '', updatedAt: '',
  };
}

describe('EliminationLog', () => {
  it('shows "Diaper Log" header when only diapers enabled', () => {
    render(<EliminationLog child={makeChild(true, false)} />);
    expect(screen.getByText('Diaper Log')).toBeInTheDocument();
  });

  it('shows "Potty Log" header when only potty enabled', () => {
    render(<EliminationLog child={makeChild(false, true)} />);
    expect(screen.getByText('Potty Log')).toBeInTheDocument();
  });

  it('shows "Elimination Log" + mode toggle when both enabled', () => {
    render(<EliminationLog child={makeChild(true, true)} />);
    expect(screen.getByText('Elimination Log')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Diaper' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Potty' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 5: Run tests**

Run: `cd /Users/nick/Projects/Github/afp && bunx vitest run src/modules/baby/__tests__/EliminationLog.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
cd /Users/nick/Projects/Github/afp
git add src/modules/baby/components/EliminationLog.tsx \
        src/modules/baby/__tests__/EliminationLog.test.tsx \
        src/modules/baby/components/ChildDetail.tsx
git commit -m "feat(baby): replace DiaperLog with EliminationLog (combined mode)

- Single component handles diaper and potty modes
- Mode toggle UI when both ChildConfig.diapers and .potty are true
- Subcollection: elimination (writes new entries; legacy diapers/* preserved)
- Header label adapts: Diaper Log / Potty Log / Elimination Log

Plan 3 (elimination), Task 2"
```

---

## Phase C — Admin Toggle + Documentation

### Task 3: Add `potty` toggle to admin per-child config

**Files:**
- Modify: `src/admin/components/UsersTab.tsx` (or wherever per-child config lives)

- [ ] **Step 1: Add `potty` toggle**

In the existing per-child config editor, find the list of toggles (currently `feeding`, `sleep`, `growth`, `diapers`) and add `potty` to the field list. Example illustrative pattern (adapt to existing JSX):

```typescript
{(['feeding', 'sleep', 'growth', 'diapers', 'potty'] as const).map(field => (
  <label key={field} className="flex items-center gap-2 text-sm">
    <input
      type="checkbox"
      checked={config[field] ?? false}
      onChange={e => updateChildConfig(childId, { ...config, [field]: e.target.checked })}
    />
    <span className="capitalize">{field}</span>
  </label>
))}
```

- [ ] **Step 2: Verify typecheck**

Run: `cd /Users/nick/Projects/Github/afp && bun run lint`
Expected: PASS.

- [ ] **Step 3: Update CHANGELOG**

In `afp/CHANGELOG.md`, ensure a `[0.4.0] — Unreleased` block exists; add under `### Added`:

```markdown
- Combined `elimination` subcollection (replaces standalone `diapers`)
- One-time backfill helper `migrateChildDiapersToElimination`
- `potty` toggle in admin per-child config
```

- [ ] **Step 4: Commit**

```bash
cd /Users/nick/Projects/Github/afp
git add src/admin/components/UsersTab.tsx CHANGELOG.md
git commit -m "feat(admin): add potty toggle + CHANGELOG for elimination

Plan 3 (elimination), Task 3"
```

---

## Self-Review

| Check | Result |
|---|---|
| Spec coverage | § 5 (Combined Diaper/Potty) — discriminated union, migration, UI behavior table, subcollection rename |
| Type consistency | `EliminationMode`, `DiaperType`, `PottyType` used consistently; `EliminationEntry` shape matches spec § 12 |
| Placeholder scan | None — all code complete; admin task has illustrative pattern noted |
| Test coverage | 2 unit tests (migration transform) + 3 component tests = 5 tests added |
| Migration safety | Old `diapers/*` not deleted — fully reversible if backfill issues arise |

---

## Execution

**Plan complete. Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between
2. **Inline Execution** — sequential in current session via `executing-plans` skill

3 tasks; either works.

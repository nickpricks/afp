# Phase 3 Baby — Meals Module (Plan 4 of 9)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Meals/Food tracking module — new subcollection, new component, new admin toggle.

**Architecture:** New `meals` subcollection at `/users/{uid}/children/{childId}/meals/{id}`. Component (`MealsLog`) follows existing AFP patterns (FAB-less form-at-top + list, tap-to-edit). Auto-suggests meal type from current time-of-day. Tab gated by `ChildConfig.meals`.

**Tech Stack:** TypeScript, React, Firebase Firestore, Vitest, `@testing-library/react`. Uses existing `useBabyCollection<T>` hook.

**Spec:** [`docs/specs/2026-04-13-phase3-baby-to-kid-design.md`](../specs/2026-04-13-phase3-baby-to-kid-design.md) — read § 6.

**Plan position:** Plan 4 of 9 for Module A. **Depends on Plan 1 (foundation)** — uses `MealType`, `MealPortion`, `MealEntry` types and extended `ChildConfig`.

---

## File Structure

### Created files

| Path | Responsibility |
|---|---|
| `src/modules/baby/components/MealsLog.tsx` | Form + list + delete |
| `src/modules/baby/__tests__/MealsLog.test.tsx` | Component test |

### Modified files

| Path | Change |
|---|---|
| `src/modules/baby/components/ChildDetail.tsx` | Add `<MealsLog>` tab gated by `ChildConfig.meals` |
| `src/admin/components/UsersTab.tsx` | Add `meals` toggle to per-child config editor |
| `afp/CHANGELOG.md` | Add meals-module entry |

---

## Phase A — Component

### Task 1: MealsLog component

**Files:**
- Create: `src/modules/baby/components/MealsLog.tsx`
- Modify: `src/modules/baby/components/ChildDetail.tsx`
- Test: `src/modules/baby/__tests__/MealsLog.test.tsx`

- [ ] **Step 1: Implement MealsLog**

Create `src/modules/baby/components/MealsLog.tsx`:

```typescript
import { useState } from 'react';
import { useBabyCollection } from '../hooks/useBabyCollection';
import { MealType, MealPortion, type Child, type MealEntry } from '../types';
import { todayStr, nowTime } from '@/shared/utils/date';
import { sortNewestFirst } from '@/shared/utils/sort';
import { useToast } from '@/shared/errors/useToast';
import { ToastType } from '@/shared/types';

type Props = { child: Child };

/** Auto-suggest meal type from current hour */
function defaultMealType(): MealType {
  const h = new Date().getHours();
  if (h < 10) return MealType.Breakfast;
  if (h < 14) return MealType.Lunch;
  if (h < 19) return MealType.Dinner;
  return MealType.Snack;
}

export function MealsLog({ child }: Props): JSX.Element {
  const [date, setDate] = useState(todayStr());
  const [time, setTime] = useState(nowTime());
  const [type, setType] = useState<MealType>(defaultMealType());
  const [description, setDescription] = useState('');
  const [portion, setPortion] = useState<MealPortion | null>(null);
  const [notes, setNotes] = useState('');
  const { addToast } = useToast();

  const { items, log, remove } = useBabyCollection<MealEntry>(
    child.id ?? '',
    'meals',
    'Meal'
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) {
      addToast('Description required', ToastType.Error);
      return;
    }
    const entry: Omit<MealEntry, 'id'> = {
      date, time, type, description, portion,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      notes,
    };
    const result = await log(entry);
    if (result.ok) {
      setDescription('');
      setNotes('');
      setPortion(null);
      addToast('Meal logged', ToastType.Success);
    } else {
      addToast(result.error.message, ToastType.Error);
    }
  }

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-fg">Meals</h2>
      <form onSubmit={handleSubmit} className="mb-4 space-y-2">
        <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
        <input type="time" value={time} onChange={e => setTime(e.target.value)} required />
        <select value={type} onChange={e => setType(Number(e.target.value) as MealType)}>
          <option value={MealType.Breakfast}>Breakfast</option>
          <option value={MealType.Lunch}>Lunch</option>
          <option value={MealType.Dinner}>Dinner</option>
          <option value={MealType.Snack}>Snack</option>
        </select>
        <input
          type="text"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="What was served (e.g. rice + dal + carrot)"
          required
        />
        <select
          value={portion ?? ''}
          onChange={e => setPortion(e.target.value === '' ? null : (Number(e.target.value) as MealPortion))}
        >
          <option value="">Portion (optional)</option>
          <option value={MealPortion.None}>None — refused</option>
          <option value={MealPortion.Bite}>Bite</option>
          <option value={MealPortion.Little}>Little</option>
          <option value={MealPortion.Some}>Some</option>
          <option value={MealPortion.Most}>Most</option>
          <option value={MealPortion.All}>All</option>
          <option value={MealPortion.Extra}>Extra</option>
        </select>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optional)" />
        <button type="submit" className="rounded bg-accent px-4 py-2 text-fg-on-accent">Log</button>
      </form>

      <ul className="space-y-1">
        {sortNewestFirst(items).map(entry => (
          <li key={entry.id} className="flex justify-between text-sm">
            <span>
              {entry.date} {entry.time} — {MealType[entry.type]}: {entry.description}
              {entry.portion !== null && ` (${MealPortion[entry.portion]})`}
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

- [ ] **Step 2: Wire into ChildDetail**

In `src/modules/baby/components/ChildDetail.tsx`, add the import:

```typescript
import { MealsLog } from './MealsLog';
```

And add the gated tab in the JSX (alongside other module tabs):

```typescript
{child.config.meals && <MealsLog child={child} />}
```

- [ ] **Step 3: Write component test**

Create `src/modules/baby/__tests__/MealsLog.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MealsLog } from '../components/MealsLog';
import { type Child } from '../types';

const mockLog = vi.fn(async () => ({ ok: true, value: undefined }));
vi.mock('../hooks/useBabyCollection', () => ({
  useBabyCollection: () => ({ items: [], log: mockLog, remove: vi.fn(), update: vi.fn() }),
}));
vi.mock('@/shared/errors/useToast', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

const child: Child = {
  id: 'c1', name: 'Test', dob: '2025-01-01',
  config: { feeding: false, sleep: true, growth: true, diapers: false, meals: true, potty: false, milestones: false, needs: false },
  createdAt: '', updatedAt: '',
};

describe('MealsLog', () => {
  it('renders with Meals header', () => {
    render(<MealsLog child={child} />);
    expect(screen.getByText('Meals')).toBeInTheDocument();
  });

  it('blocks submit without description', () => {
    render(<MealsLog child={child} />);
    const form = screen.getByRole('button', { name: 'Log' }).closest('form')!;
    fireEvent.submit(form);
    expect(mockLog).not.toHaveBeenCalled();
  });

  it('submits valid meal entry', async () => {
    render(<MealsLog child={child} />);
    fireEvent.change(screen.getByPlaceholderText(/What was served/), { target: { value: 'rice + dal' } });
    const form = screen.getByRole('button', { name: 'Log' }).closest('form')!;
    fireEvent.submit(form);
    await new Promise(r => setTimeout(r, 0));
    expect(mockLog).toHaveBeenCalled();
  });
});
```

- [ ] **Step 4: Run tests**

Run: `cd /Users/nick/Projects/Github/afp && bunx vitest run src/modules/baby/__tests__/MealsLog.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/nick/Projects/Github/afp
git add src/modules/baby/components/MealsLog.tsx \
        src/modules/baby/__tests__/MealsLog.test.tsx \
        src/modules/baby/components/ChildDetail.tsx
git commit -m "feat(baby): add MealsLog component

- New subcollection: meals
- Auto-suggest meal type from current hour
- Optional portion enum (None/Some/Most/All/Extra)
- Required description, optional notes
- Gated by ChildConfig.meals

Plan 4 (meals), Task 1"
```

---

## Phase B — Admin Toggle + Documentation

### Task 2: Add `meals` toggle + CHANGELOG

**Files:**
- Modify: `src/admin/components/UsersTab.tsx`
- Modify: `afp/CHANGELOG.md`

- [ ] **Step 1: Add `meals` to admin toggle list**

In the existing per-child config editor's field list, add `meals`:

```typescript
{(['feeding', 'sleep', 'growth', 'diapers', 'potty', 'meals'] as const).map(field => (
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

In `afp/CHANGELOG.md`, under `[0.4.0] — Unreleased` › `### Added`:

```markdown
- Meals module — new `meals` subcollection with 4 meal types (Breakfast/Lunch/Dinner/Snack) and optional portion (None/Some/Most/All/Extra). Auto-suggests meal type from time of day.
```

- [ ] **Step 4: Commit**

```bash
cd /Users/nick/Projects/Github/afp
git add src/admin/components/UsersTab.tsx CHANGELOG.md
git commit -m "feat(admin): add meals toggle + CHANGELOG for meals module

Plan 4 (meals), Task 2"
```

---

## Self-Review

| Check | Result |
|---|---|
| Spec coverage | § 6 (Meals/Food Module) — entry shape, subcollection path, form fields all covered |
| Type consistency | `MealType`, `MealPortion`, `MealEntry` from Plan 1 used directly |
| Placeholder scan | None |
| Test coverage | 3 component tests |
| Self-contained | Yes — UI + admin toggle + CHANGELOG line all included in this plan |

---

## Execution

**Plan complete. Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between
2. **Inline Execution** — sequential in current session via `executing-plans` skill

2 tasks; small enough for either.

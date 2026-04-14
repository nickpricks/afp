# Phase 3 Baby — Milestones Module (Plan 6 of 9)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Milestones tracking module — captures developmental firsts ("first walk", "first word"), recurring achievements ("new hobby"), and custom life events. Hybrid categorization (6 predefined categories + custom always allowed). Predefined-template chips for one-tap quick-add of common milestones.

**Architecture:** New `milestones` subcollection at `/users/{uid}/children/{childId}/milestones/{id}`. Component (`MilestonesLog`) renders predefined-template chips at top, free-form add form, and a history list grouped by category. Tap-to-edit pattern. Optional media URL field (rendered as link in MVP — no inline preview). Tab is visible regardless of stage (milestones matter at all ages); gated only by `ChildConfig.milestones` toggle.

**Tech Stack:** TypeScript, React, Firebase Firestore, Vitest, `@testing-library/react`. Uses existing `useBabyCollection<T>` hook.

**Spec:** [`docs/specs/2026-04-13-phase3-baby-to-kid-design.md`](../specs/2026-04-13-phase3-baby-to-kid-design.md) — read § 7.

**Plan position:** Plan 6 of 9 for Module A. **Depends on Plan 1 (foundation)** — uses `MilestoneCategory`, `Milestone` types and extended `ChildConfig`. Independent of plans 2-5; produces the data Plan 7 (Life Journal) sources.

---

## File Structure

### Created files

| Path | Responsibility |
|---|---|
| `src/modules/baby/milestone-templates.ts` | `MILESTONE_TEMPLATES` constant — array of `{ title, category }` for quick-add chips |
| `src/modules/baby/__tests__/milestone-templates.test.ts` | Sanity test for templates shape |
| `src/modules/baby/components/MilestonesLog.tsx` | Predefined-template chips + form + grouped-by-category list + tap-to-edit |
| `src/modules/baby/__tests__/MilestonesLog.test.tsx` | Component test |

### Modified files

| Path | Change |
|---|---|
| `src/modules/baby/components/ChildDetail.tsx` | Add `<MilestonesLog>` tab gated by `ChildConfig.milestones` |
| `src/admin/components/UsersTab.tsx` | Add `milestones` toggle to per-child config editor |
| `afp/CHANGELOG.md` | Add milestones-module entry |

---

## Phase A — Predefined Templates

### Task 1: milestone-templates.ts constant

**Files:**
- Create: `src/modules/baby/milestone-templates.ts`
- Test: `src/modules/baby/__tests__/milestone-templates.test.ts`

- [ ] **Step 1: Write failing test**

Create `src/modules/baby/__tests__/milestone-templates.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { MILESTONE_TEMPLATES } from '../milestone-templates';
import { MilestoneCategory } from '../types';

describe('MILESTONE_TEMPLATES', () => {
  it('contains at least 8 templates', () => {
    expect(MILESTONE_TEMPLATES.length).toBeGreaterThanOrEqual(8);
  });

  it('every template has a non-empty title', () => {
    for (const t of MILESTONE_TEMPLATES) {
      expect(t.title.length).toBeGreaterThan(0);
    }
  });

  it('every template has a valid category enum value', () => {
    const validValues = Object.values(MilestoneCategory).filter(v => typeof v === 'number');
    for (const t of MILESTONE_TEMPLATES) {
      expect(validValues).toContain(t.category);
    }
  });

  it('includes "First word" with Language category', () => {
    const t = MILESTONE_TEMPLATES.find(x => x.title === 'First word');
    expect(t).toBeDefined();
    expect(t?.category).toBe(MilestoneCategory.Language);
  });

  it('includes "First steps" with Motor category', () => {
    const t = MILESTONE_TEMPLATES.find(x => x.title === 'First steps');
    expect(t).toBeDefined();
    expect(t?.category).toBe(MilestoneCategory.Motor);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/nick/Projects/Github/afp && bunx vitest run src/modules/baby/__tests__/milestone-templates.test.ts`
Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement milestone-templates.ts**

Create `src/modules/baby/milestone-templates.ts`:

```typescript
import { MilestoneCategory } from './types';

/** Predefined milestone templates for quick-add chips. Title + default category. */
export const MILESTONE_TEMPLATES: readonly { title: string; category: MilestoneCategory }[] = [
  { title: 'First word', category: MilestoneCategory.Language },
  { title: 'First steps', category: MilestoneCategory.Motor },
  { title: 'First tooth', category: MilestoneCategory.Other },
  { title: 'First haircut', category: MilestoneCategory.Other },
  { title: 'Slept through the night', category: MilestoneCategory.Other },
  { title: 'Started solid food', category: MilestoneCategory.Other },
  { title: 'Started crawling', category: MilestoneCategory.Motor },
  { title: 'Started potty training', category: MilestoneCategory.Other },
  { title: 'First day at daycare/school', category: MilestoneCategory.Social },
  { title: 'First friend', category: MilestoneCategory.Social },
] as const;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/nick/Projects/Github/afp && bunx vitest run src/modules/baby/__tests__/milestone-templates.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/nick/Projects/Github/afp
git add src/modules/baby/milestone-templates.ts \
        src/modules/baby/__tests__/milestone-templates.test.ts
git commit -m "feat(baby): add MILESTONE_TEMPLATES constant for quick-add

10 predefined templates with default categories (Language/Motor/Social/Other)

Plan 6 (milestones), Task 1"
```

---

## Phase B — Component

### Task 2: MilestonesLog component

**Files:**
- Create: `src/modules/baby/components/MilestonesLog.tsx`
- Modify: `src/modules/baby/components/ChildDetail.tsx`
- Test: `src/modules/baby/__tests__/MilestonesLog.test.tsx`

- [ ] **Step 1: Implement MilestonesLog**

Create `src/modules/baby/components/MilestonesLog.tsx`:

```typescript
import { useState } from 'react';
import { useBabyCollection } from '../hooks/useBabyCollection';
import { MilestoneCategory, type Child, type Milestone } from '../types';
import { MILESTONE_TEMPLATES } from '../milestone-templates';
import { todayStr } from '@/shared/utils/date';
import { sortNewestFirst } from '@/shared/utils/sort';
import { useToast } from '@/shared/errors/useToast';
import { ToastType } from '@/shared/types';

type Props = { child: Child };

export function MilestonesLog({ child }: Props): JSX.Element {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [date, setDate] = useState(todayStr());
  const [category, setCategory] = useState<MilestoneCategory>(MilestoneCategory.Other);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [notes, setNotes] = useState('');
  const { addToast } = useToast();

  const { items, log, update, remove } = useBabyCollection<Milestone>(
    child.id ?? '',
    'milestones',
    'Milestone'
  );

  function applyTemplate(template: typeof MILESTONE_TEMPLATES[number]) {
    setTitle(template.title);
    setCategory(template.category);
    setEditingId(null);
  }

  function loadForEdit(m: Milestone) {
    setEditingId(m.id);
    setDate(m.date);
    setCategory(m.category);
    setTitle(m.title);
    setDescription(m.description ?? '');
    setMediaUrl(m.mediaUrl ?? '');
    setNotes(m.notes);
  }

  function clearForm() {
    setEditingId(null);
    setDate(todayStr());
    setCategory(MilestoneCategory.Other);
    setTitle('');
    setDescription('');
    setMediaUrl('');
    setNotes('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      addToast('Title required', ToastType.Error);
      return;
    }
    const payload: Omit<Milestone, 'id'> = {
      date,
      category,
      title,
      description: description.trim() || undefined,
      mediaUrl: mediaUrl.trim() || undefined,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      notes,
    };
    const result = editingId
      ? await update(editingId, { id: editingId, ...payload } as Milestone)
      : await log(payload);
    if (result.ok) {
      clearForm();
      addToast(editingId ? 'Milestone updated' : 'Milestone logged', ToastType.Success);
    } else {
      addToast(result.error.message, ToastType.Error);
    }
  }

  // Group items by category for display
  const grouped: Record<number, Milestone[]> = {};
  for (const m of sortNewestFirst(items)) {
    if (!grouped[m.category]) grouped[m.category] = [];
    grouped[m.category].push(m);
  }

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-fg">Milestones</h2>

      <div className="mb-3">
        <div className="mb-1 text-xs uppercase text-fg-muted">Quick-add</div>
        <div className="flex flex-wrap gap-1">
          {MILESTONE_TEMPLATES.map(t => (
            <button
              key={t.title}
              type="button"
              onClick={() => applyTemplate(t)}
              className="rounded-full border border-line bg-surface-card px-2 py-1 text-xs text-fg-muted hover:bg-[var(--accent-muted)]"
            >
              {t.title}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mb-4 space-y-2">
        <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
        <select value={category} onChange={e => setCategory(Number(e.target.value) as MilestoneCategory)}>
          <option value={MilestoneCategory.Motor}>Motor</option>
          <option value={MilestoneCategory.Language}>Language</option>
          <option value={MilestoneCategory.Social}>Social</option>
          <option value={MilestoneCategory.Cognitive}>Cognitive</option>
          <option value={MilestoneCategory.Hobby}>Hobby</option>
          <option value={MilestoneCategory.Other}>Other</option>
        </select>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Milestone title (e.g. First word, New hobby: piano)"
          required
        />
        <input
          type="text"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Description (optional, longer text)"
        />
        <input
          type="url"
          value={mediaUrl}
          onChange={e => setMediaUrl(e.target.value)}
          placeholder="Media URL (optional)"
        />
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optional)" />
        <div className="flex gap-2">
          <button type="submit" className="rounded bg-accent px-4 py-2 text-fg-on-accent">
            {editingId ? 'Update' : 'Log'}
          </button>
          {editingId && (
            <button type="button" onClick={clearForm} className="rounded border border-line px-4 py-2 text-fg-muted">
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="space-y-3">
        {Object.entries(grouped).map(([catKey, milestones]) => (
          <div key={catKey}>
            <div className="mb-1 text-xs uppercase text-fg-muted">{MilestoneCategory[Number(catKey)]}</div>
            <ul className="space-y-1">
              {milestones.map(m => {
                const isActive = m.id === editingId;
                return (
                  <li
                    key={m.id}
                    onClick={() => loadForEdit(m)}
                    className={`flex cursor-pointer items-center justify-between text-sm ${isActive ? 'bg-[var(--accent-muted)] border-l-2 border-l-accent pl-2' : ''}`}
                  >
                    <span>
                      <strong>{m.title}</strong> — {m.date}
                      {m.mediaUrl && (
                        <a
                          href={m.mediaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="ml-2 text-accent underline"
                        >
                          [media]
                        </a>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        remove(m.id);
                      }}
                      aria-label="delete"
                      className="text-fg-muted"
                    >
                      ×
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Wire into ChildDetail**

In `src/modules/baby/components/ChildDetail.tsx`, add the import:

```typescript
import { MilestonesLog } from './MilestonesLog';
```

And add the gated tab in the JSX (alongside other module tabs):

```typescript
{child.config.milestones && <MilestonesLog child={child} />}
```

- [ ] **Step 3: Write component test**

Create `src/modules/baby/__tests__/MilestonesLog.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MilestonesLog } from '../components/MilestonesLog';
import { type Child } from '../types';

const mockLog = vi.fn(async () => ({ ok: true, value: undefined }));
const mockUpdate = vi.fn(async () => ({ ok: true, value: undefined }));
const mockRemove = vi.fn();

vi.mock('../hooks/useBabyCollection', () => ({
  useBabyCollection: () => ({ items: [], log: mockLog, update: mockUpdate, remove: mockRemove }),
}));
vi.mock('@/shared/errors/useToast', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

const child: Child = {
  id: 'c1', name: 'Test', dob: '2024-01-01',
  config: { feeding: false, sleep: true, growth: true, diapers: false, meals: false, potty: false, milestones: true, needs: false },
  createdAt: '', updatedAt: '',
};

describe('MilestonesLog', () => {
  it('renders Milestones header and template chips', () => {
    render(<MilestonesLog child={child} />);
    expect(screen.getByText('Milestones')).toBeInTheDocument();
    expect(screen.getByText('Quick-add')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'First word' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'First steps' })).toBeInTheDocument();
  });

  it('blocks submit without title', () => {
    render(<MilestonesLog child={child} />);
    const form = screen.getByRole('button', { name: 'Log' }).closest('form')!;
    fireEvent.submit(form);
    expect(mockLog).not.toHaveBeenCalled();
  });

  it('applies template — fills title and category', () => {
    render(<MilestonesLog child={child} />);
    fireEvent.click(screen.getByRole('button', { name: 'First word' }));
    const titleInput = screen.getByPlaceholderText(/Milestone title/) as HTMLInputElement;
    expect(titleInput.value).toBe('First word');
  });

  it('submits valid milestone entry', async () => {
    render(<MilestonesLog child={child} />);
    fireEvent.change(screen.getByPlaceholderText(/Milestone title/), { target: { value: 'Started piano' } });
    const form = screen.getByRole('button', { name: 'Log' }).closest('form')!;
    fireEvent.submit(form);
    await new Promise(r => setTimeout(r, 0));
    expect(mockLog).toHaveBeenCalled();
  });
});
```

- [ ] **Step 4: Run tests**

Run: `cd /Users/nick/Projects/Github/afp && bunx vitest run src/modules/baby/__tests__/MilestonesLog.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/nick/Projects/Github/afp
git add src/modules/baby/components/MilestonesLog.tsx \
        src/modules/baby/__tests__/MilestonesLog.test.tsx \
        src/modules/baby/components/ChildDetail.tsx
git commit -m "feat(baby): add MilestonesLog component

- Predefined-template chips at top (10 common milestones)
- Hybrid categorization (6 categories + custom titles)
- Optional media URL field (rendered as link)
- Tap-to-edit pattern (loads entry into form)
- Grouped-by-category history list
- Gated by ChildConfig.milestones

Plan 6 (milestones), Task 2"
```

---

## Phase C — Admin Toggle + Documentation

### Task 3: Add `milestones` toggle + CHANGELOG

**Files:**
- Modify: `src/admin/components/UsersTab.tsx`
- Modify: `afp/CHANGELOG.md`

- [ ] **Step 1: Add `milestones` to admin toggle list**

In the existing per-child config editor's field list, add `milestones`:

```typescript
{(['feeding', 'sleep', 'growth', 'diapers', 'potty', 'meals', 'needs', 'milestones'] as const).map(field => (
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
- Milestones module — captures developmental firsts, recurring achievements, and custom life events. Hybrid categorization (Motor/Language/Social/Cognitive/Hobby/Other) with 10 predefined-template quick-add chips. Optional media URL.
```

- [ ] **Step 4: Commit**

```bash
cd /Users/nick/Projects/Github/afp
git add src/admin/components/UsersTab.tsx CHANGELOG.md
git commit -m "feat(admin): add milestones toggle + CHANGELOG for milestones module

Plan 6 (milestones), Task 3"
```

---

## Self-Review

| Check | Result |
|---|---|
| Spec coverage | § 7 (Milestones Module) — categorization, predefined templates, optional media URL, subcollection path, UI structure |
| Type consistency | `MilestoneCategory` enum and `Milestone` type both come from Plan 1 (foundation) |
| Placeholder scan | None — all code complete |
| Test coverage | 5 unit tests (templates) + 4 component tests = 9 tests added |
| Self-contained | Yes — UI + admin toggle + CHANGELOG line all included |

---

## Execution

**Plan complete. Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between
2. **Inline Execution** — sequential in current session via `executing-plans` skill

3 tasks; either works.

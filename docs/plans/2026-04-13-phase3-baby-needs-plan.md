# Phase 3 Baby — Needs Module (Plan 5 of 9)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Needs (wishlist + inventory) tracking module — new subcollection, new component with status filter chips, new admin toggle.

**Architecture:** New `needs` subcollection at `/users/{uid}/children/{childId}/needs/{id}`. Each entry has a `status` (`Wishlist | Inventory | Outgrown`) that transitions via tap actions. Filter chips at top let user view by status. Tab gated by `ChildConfig.needs`.

**Tech Stack:** TypeScript, React, Firebase Firestore, Vitest, `@testing-library/react`.

**Spec:** [`docs/specs/2026-04-13-phase3-baby-to-kid-design.md`](../specs/2026-04-13-phase3-baby-to-kid-design.md) — read § 8.

**Plan position:** Plan 5 of 9 for Module A. **Depends on Plan 1 (foundation)** — uses `NeedCategory`, `NeedStatus`, `NeedEntry` types and extended `ChildConfig`.

---

## File Structure

### Created files

| Path | Responsibility |
|---|---|
| `src/modules/baby/components/NeedsLog.tsx` | Filter chips + form + list + status transitions |
| `src/modules/baby/__tests__/NeedsLog.test.tsx` | Component test |

### Modified files

| Path | Change |
|---|---|
| `src/modules/baby/components/ChildDetail.tsx` | Add `<NeedsLog>` tab gated by `ChildConfig.needs` |
| `src/admin/components/UsersTab.tsx` | Add `needs` toggle to per-child config editor |
| `afp/CHANGELOG.md` | Add needs-module entry |

---

## Phase A — Component

### Task 1: NeedsLog component with filter chips

**Files:**
- Create: `src/modules/baby/components/NeedsLog.tsx`
- Modify: `src/modules/baby/components/ChildDetail.tsx`
- Test: `src/modules/baby/__tests__/NeedsLog.test.tsx`

- [ ] **Step 1: Implement NeedsLog**

Create `src/modules/baby/components/NeedsLog.tsx`:

```typescript
import { useState } from 'react';
import { useBabyCollection } from '../hooks/useBabyCollection';
import { NeedCategory, NeedStatus, type Child, type NeedEntry } from '../types';
import { todayStr } from '@/shared/utils/date';
import { sortNewestFirst } from '@/shared/utils/sort';
import { useToast } from '@/shared/errors/useToast';
import { ToastType } from '@/shared/types';

type Props = { child: Child };

export function NeedsLog({ child }: Props): JSX.Element {
  const [filter, setFilter] = useState<NeedStatus | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<NeedCategory>(NeedCategory.Apparel);
  const [notes, setNotes] = useState('');
  const { addToast } = useToast();

  const { items, log, update, remove } = useBabyCollection<NeedEntry>(
    child.id ?? '',
    'needs',
    'Need'
  );

  const visible = filter === null ? items : items.filter(n => n.status === filter);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      addToast('Title required', ToastType.Error);
      return;
    }
    const entry: Omit<NeedEntry, 'id'> = {
      date: todayStr(),
      title,
      category,
      status: NeedStatus.Wishlist,
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const result = await log(entry);
    if (result.ok) {
      setTitle('');
      setNotes('');
      addToast('Need added', ToastType.Success);
    } else {
      addToast(result.error.message, ToastType.Error);
    }
  }

  async function changeStatus(need: NeedEntry, newStatus: NeedStatus) {
    await update(need.id, { ...need, status: newStatus, updatedAt: new Date().toISOString() });
  }

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-fg">Needs</h2>

      <div className="mb-3 flex gap-2">
        {[
          { label: 'All', value: null },
          { label: 'Wishlist', value: NeedStatus.Wishlist },
          { label: 'Have', value: NeedStatus.Inventory },
          { label: 'Outgrown', value: NeedStatus.Outgrown },
        ].map(chip => (
          <button
            key={chip.label}
            type="button"
            onClick={() => setFilter(chip.value)}
            className={`rounded px-3 py-1 text-sm ${filter === chip.value ? 'bg-accent text-fg-on-accent' : 'border border-line text-fg-muted'}`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mb-4 space-y-2">
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="What's needed (e.g. winter jacket size 3)"
          required
        />
        <select value={category} onChange={e => setCategory(Number(e.target.value) as NeedCategory)}>
          <option value={NeedCategory.Apparel}>Apparel</option>
          <option value={NeedCategory.Footwear}>Footwear</option>
          <option value={NeedCategory.School}>School</option>
          <option value={NeedCategory.Toys}>Toys</option>
          <option value={NeedCategory.Books}>Books</option>
          <option value={NeedCategory.Other}>Other</option>
        </select>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optional)" />
        <button type="submit" className="rounded bg-accent px-4 py-2 text-fg-on-accent">Add to Wishlist</button>
      </form>

      <ul className="space-y-1">
        {sortNewestFirst(visible).map(need => (
          <li key={need.id} className="flex items-center justify-between text-sm">
            <span>
              <strong>{need.title}</strong> — {NeedCategory[need.category]} ({NeedStatus[need.status]})
            </span>
            <span className="flex gap-1">
              {need.status === NeedStatus.Wishlist && (
                <button
                  type="button"
                  onClick={() => changeStatus(need, NeedStatus.Inventory)}
                  className="rounded border border-line px-2 py-1 text-xs"
                >
                  Bought
                </button>
              )}
              {need.status === NeedStatus.Inventory && (
                <button
                  type="button"
                  onClick={() => changeStatus(need, NeedStatus.Outgrown)}
                  className="rounded border border-line px-2 py-1 text-xs"
                >
                  Outgrew
                </button>
              )}
              <button type="button" onClick={() => remove(need.id)} aria-label="delete" className="text-fg-muted">×</button>
            </span>
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
import { NeedsLog } from './NeedsLog';
```

And add to the JSX (alongside other tabs):

```typescript
{child.config.needs && <NeedsLog child={child} />}
```

- [ ] **Step 3: Write component test**

Create `src/modules/baby/__tests__/NeedsLog.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NeedsLog } from '../components/NeedsLog';
import { type Child } from '../types';

const mockLog = vi.fn(async () => ({ ok: true, value: undefined }));
vi.mock('../hooks/useBabyCollection', () => ({
  useBabyCollection: () => ({ items: [], log: mockLog, remove: vi.fn(), update: vi.fn() }),
}));
vi.mock('@/shared/errors/useToast', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

const child: Child = {
  id: 'c1', name: 'Test', dob: '2024-01-01',
  config: { feeding: false, sleep: true, growth: true, diapers: false, meals: false, potty: false, milestones: false, needs: true },
  createdAt: '', updatedAt: '',
};

describe('NeedsLog', () => {
  it('renders Needs header and filter chips', () => {
    render(<NeedsLog child={child} />);
    expect(screen.getByText('Needs')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Wishlist' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Have' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Outgrown' })).toBeInTheDocument();
  });

  it('blocks submit without title', () => {
    render(<NeedsLog child={child} />);
    const form = screen.getByRole('button', { name: 'Add to Wishlist' }).closest('form')!;
    fireEvent.submit(form);
    expect(mockLog).not.toHaveBeenCalled();
  });

  it('submits new need to wishlist by default', async () => {
    render(<NeedsLog child={child} />);
    fireEvent.change(screen.getByPlaceholderText(/What's needed/), { target: { value: 'winter jacket' } });
    const form = screen.getByRole('button', { name: 'Add to Wishlist' }).closest('form')!;
    fireEvent.submit(form);
    await new Promise(r => setTimeout(r, 0));
    expect(mockLog).toHaveBeenCalled();
  });
});
```

- [ ] **Step 4: Run tests**

Run: `cd /Users/nick/Projects/Github/afp && bunx vitest run src/modules/baby/__tests__/NeedsLog.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/nick/Projects/Github/afp
git add src/modules/baby/components/NeedsLog.tsx \
        src/modules/baby/__tests__/NeedsLog.test.tsx \
        src/modules/baby/components/ChildDetail.tsx
git commit -m "feat(baby): add NeedsLog component (wishlist + inventory)

- New subcollection: needs
- Filter chips: All / Wishlist / Have / Outgrown
- Status lifecycle: Wishlist → Inventory (Bought) → Outgrown (Outgrew)
- Gated by ChildConfig.needs

Plan 5 (needs), Task 1"
```

---

## Phase B — Admin Toggle + Documentation

### Task 2: Add `needs` toggle + CHANGELOG

**Files:**
- Modify: `src/admin/components/UsersTab.tsx`
- Modify: `afp/CHANGELOG.md`

- [ ] **Step 1: Add `needs` to admin toggle list**

In the existing per-child config editor's field list, add `needs`:

```typescript
{(['feeding', 'sleep', 'growth', 'diapers', 'potty', 'meals', 'needs'] as const).map(field => (
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
- Needs module — wishlist + inventory tracker for kid-scale items (apparel/footwear/school/toys/books/other) with status lifecycle (Wishlist → Inventory → Outgrown)
```

- [ ] **Step 4: Commit**

```bash
cd /Users/nick/Projects/Github/afp
git add src/admin/components/UsersTab.tsx CHANGELOG.md
git commit -m "feat(admin): add needs toggle + CHANGELOG for needs module

Plan 5 (needs), Task 2"
```

---

## Self-Review

| Check | Result |
|---|---|
| Spec coverage | § 8 (Needs Module) — entry shape, status lifecycle, filter chips, subcollection path |
| Type consistency | `NeedCategory`, `NeedStatus`, `NeedEntry` from Plan 1 used directly |
| Placeholder scan | None |
| Test coverage | 3 component tests |
| Self-contained | Yes — UI + admin toggle + CHANGELOG line all included |

---

## Execution

**Plan complete. Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between
2. **Inline Execution** — sequential in current session via `executing-plans` skill

2 tasks; small enough for either.

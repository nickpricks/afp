# Phase 2f: Themes & Effects

> **Master plan:** [Phase 2 Master](2026-04-06-phase2-master.md)
> **Design Spec:** [Phase 2 Design](../specs/2026-04-06-phase2-design.md)

---

### Task 2f.1: Port BabyTracker Themes

**Files:**
- Create: `src/themes/lullaby.css`
- Create: `src/themes/nursery-os.css`
- Create: `src/themes/midnight-feed.css`
- Modify: `src/themes/themes.ts`
- Modify: `src/index.css`

- [x] **Step 1: Copy and adapt Lullaby theme**

Source: `/Users/nick/Projects/Github/BabyTracker/web/src/themes/lullaby.css`
Adapt CSS custom properties to match AFP's semantic token naming (`--bg-primary`, `--text-primary`, `--accent`, etc.).

- [x] **Step 2: Copy and adapt Nursery OS theme**

Source: `/Users/nick/Projects/Github/BabyTracker/web/src/themes/nursery-os.css`

- [x] **Step 3: Copy and adapt Midnight Feed theme**

Source: `/Users/nick/Projects/Github/BabyTracker/web/src/themes/midnight-feed.css`

- [x] **Step 4: Add theme definitions to themes.ts**

```typescript
// src/themes/themes.ts — add to THEME_DEFINITIONS
[ThemeId.Lullaby]: {
  id: ThemeId.Lullaby,
  name: 'Lullaby',
  family: 'Nursery',
  darkOnly: false,
  fonts: { display: 'Syne', body: 'system-ui' },
  cssClass: 'theme-lullaby',
  previewColors: { bg: '#faf7f2', accent: '#6b8cae', text: '#1a1613' },
},
// ... NurseryOs and MidnightFeed similarly
```

- [x] **Step 5: Import new CSS files in index.css**

```css
/* src/index.css — add imports */
@import './themes/lullaby.css';
@import './themes/nursery-os.css';
@import './themes/midnight-feed.css';
```

- [x] **Step 6: Commit**

```bash
git add src/themes/ src/index.css
git commit -m "feat(themes): port Lullaby, Nursery OS, Midnight Feed from BabyTracker"
```

### Task 2f.2: Port Ambient Effects

**Files:**
- Modify: `src/themes/effects.css`
- Modify: `src/themes/deep-mariana.css`
- Modify: `src/themes/industrial-furnace.css`
- Modify: `src/themes/night-city-apartment.css`
- Modify: `src/themes/night-city-elevator.css`

- [x] **Step 1: Add ambient effect animations to effects.css**

Source: `/Users/nick/Projects/Github/Floor-Tracker/src/themes/effects.css`

Port:
- Rising bubbles (Deep Mariana) — `.fx-ambient::before`, `::after` with bubble animation
- Rising embers (Industrial Furnace) — ember particle animation
- Scanline sweep (Night City Apartment) — horizontal line animation
- Elevator seam (Night City Elevator) — vertical cyan glow

- [x] **Step 2: Add .fx-ambient div to Layout.tsx**

```tsx
// src/shared/components/Layout.tsx — add inside the layout wrapper
<div className="fx-ambient" aria-hidden="true" />
```

- [x] **Step 3: Add theme-specific ambient rules to each theme CSS**

Each theme file activates its ambient effect via its class selector:
```css
.theme-deep-mariana .fx-ambient::before { /* bubble animation */ }
.theme-industrial-furnace .fx-ambient::before { /* ember animation */ }
```

- [x] **Step 4: Load Google Fonts for new themes**

Add font links in `index.html` if not already present (check for Syne, Orbitron, JetBrains Mono).

- [x] **Step 5: Commit**

```bash
git add src/themes/ src/shared/components/Layout.tsx index.html
git commit -m "feat(themes): port ambient effects (bubbles, embers, scanlines, elevator seam)"
```

### Task 2f.3: Theme Tests

**Files:**
- Create: `src/themes/__tests__/themes.test.ts`

- [x] **Step 1: Test all 10 themes are defined**

```typescript
import { describe, it, expect } from 'vitest';
import { ThemeId } from '@/shared/types';
import { THEME_DEFINITIONS, THEME_LIST } from '../themes';

describe('Theme definitions', () => {
  it('has exactly 10 themes', () => {
    expect(THEME_LIST).toHaveLength(10);
  });

  it('every ThemeId has a definition', () => {
    for (const id of Object.values(ThemeId)) {
      expect(THEME_DEFINITIONS[id]).toBeDefined();
      expect(THEME_DEFINITIONS[id].cssClass).toBe(`theme-${id}`);
    }
  });
});
```

- [x] **Step 2: Run tests, commit**

```bash
git add src/themes/__tests__/
git commit -m "test(themes): verify all 10 themes defined and consistent"
```

### Task 2f.4: Theme Visual Verification

- [x] **Step 1: Manual visual check**

Start dev server (`bun run dev`), switch through all 10 themes in the Profile page theme picker. Verify:
- Colors render correctly (no missing CSS variables)
- Light/dark modes work for themes that support both
- Ambient effects animate on correct themes
- No theme breaks the layout

- [x] **Step 2: E2E theme screenshot tests (optional)**

If time permits, add Playwright tests that screenshot each theme and compare.

### Task 2f.5: Themes Doc Sweep

- [x] **Step 1: Update CLAUDE.md theme section**

Update total count to 10, list new themes, note ambient effects.

- [x] **Step 2: Update CHANGELOG.md**

- [x] **Step 3: Commit**

```bash
git add CLAUDE.md CHANGELOG.md
git commit -m "docs: update for Phase 2f themes and ambient effects"
```

---

# AprilFoolsJoke Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Build a unified PWA combining floor tracking, expense tracking, and baby tracking — one installable app backed by Firebase with invite-only access.

**Architecture:** React 19 + Vite 8 + TypeScript SPA with Firebase (Firestore + Anonymous Auth). Module system where Headminick (admin) enables/disables modules per user. Storage abstraction layer for future Go API swap. 7 themes (Family Blue default + 6 ported from Floor-Tracker).

**Tech Stack:** React 19, TypeScript (strict), Vite 8, Tailwind CSS v4, Bun, Firebase, vite-plugin-pwa, Vitest, Playwright, React Router v7 (hash mode), GitHub Actions

**Spec:** `docs/specs/2026-04-01-aprilfoolsjoke-design.md`

---

## File Map

### New files (created in this plan)

```
aprilfoolsjoke/
├── public/
│   └── favicon.ico
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── shared/
│   │   ├── types.ts                    ← Result, User, Module, shared types
│   │   ├── storage/
│   │   │   ├── adapter.ts              ← StorageAdapter interface
│   │   │   └── firebase-adapter.ts     ← Firebase implementation
│   │   ├── auth/
│   │   │   ├── firebase-config.ts      ← Firebase init
│   │   │   ├── auth-context.tsx        ← AuthProvider, useAuth hook
│   │   │   ├── invite.ts              ← Invite logic (create, redeem)
│   │   │   └── headminick.ts          ← Admin helpers
│   │   ├── errors/
│   │   │   ├── toast-context.tsx       ← Toast provider + useToast
│   │   │   └── ErrorBoundary.tsx
│   │   ├── components/
│   │   │   ├── Layout.tsx              ← Shell: auth gate + tab bar + module router
│   │   │   ├── TabBar.tsx
│   │   │   ├── SyncStatus.tsx
│   │   │   └── UpdatePrompt.tsx        ← PWA update notification
│   │   └── hooks/
│   │       ├── useSyncStatus.ts
│   │       └── useModules.ts
│   ├── themes/
│   │   ├── themes.ts
│   │   ├── family-blue.css
│   │   ├── summit-instrument.css
│   │   ├── corporate-glass.css
│   │   ├── night-city-elevator.css
│   │   ├── night-city-apartment.css
│   │   ├── deep-mariana.css
│   │   ├── industrial-furnace.css
│   │   ├── buttons.css
│   │   └── effects.css
│   ├── modules/
│   │   ├── body/
│   │   │   ├── types.ts
│   │   │   ├── scoring.ts
│   │   │   ├── components/
│   │   │   │   └── BodyTracker.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useBodyData.ts
│   │   │   └── __tests__/
│   │   │       ├── scoring.test.ts
│   │   │       └── useBodyData.test.ts
│   │   ├── expenses/
│   │   │   ├── types.ts
│   │   │   ├── categories.ts
│   │   │   ├── validation.ts
│   │   │   ├── components/
│   │   │   │   ├── AddExpense.tsx
│   │   │   │   └── ExpenseList.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useExpenses.ts
│   │   │   └── __tests__/
│   │   │       ├── validation.test.ts
│   │   │       └── useExpenses.test.ts
│   │   └── baby/
│   │       ├── types.ts
│   │       ├── constants.ts
│   │       ├── components/
│   │       │   ├── FeedLog.tsx
│   │       │   ├── SleepLog.tsx
│   │       │   ├── GrowthLog.tsx
│   │       │   └── DiaperLog.tsx
│   │       ├── hooks/
│   │       │   └── useBabyData.ts
│   │       └── __tests__/
│   │           └── useBabyData.test.ts
│   ├── admin/
│   │   ├── components/
│   │   │   ├── AdminPanel.tsx
│   │   │   └── InviteGenerator.tsx
│   │   └── hooks/
│   │       └── useAdmin.ts
│   └── constants/
│       ├── config.ts
│       └── routes.ts
├── e2e/
│   └── auth-flow.spec.ts
├── .github/
│   └── workflows/
│       └── deploy.yml
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── eslint.config.js
├── package.json
├── firestore.rules
├── firebase.json
└── CLAUDE.md
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `index.html`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `eslint.config.js`, `src/main.tsx`, `src/App.tsx`, `src/index.css`

- [x] **Step 1: Create new repo directory**

```bash
cd /Users/nick/Projects/Github
mkdir aprilfoolsjoke && cd aprilfoolsjoke
git init
```

- [x] **Step 2: Initialize with bun**

```bash
bun init -y
```

- [x] **Step 3: Install dependencies**

```bash
bun add react react-dom react-router-dom firebase lucide-react
bun add -d @vitejs/plugin-react @tailwindcss/vite tailwindcss typescript vite vite-plugin-pwa vitest @types/react @types/react-dom @types/node @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom jsdom @playwright/test eslint @eslint/js typescript-eslint eslint-plugin-react-hooks eslint-plugin-react-refresh globals
```

- [x] **Step 4: Write package.json scripts**

Replace the scripts section of `package.json`:

```json
{
  "name": "aprilfoolsjoke",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "dev:host": "vite --host",
    "build": "tsc -b && vite build",
    "lint": "tsc --noEmit && eslint .",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:debug": "PWDEBUG=1 playwright test --headed"
  }
}
```

- [x] **Step 5: Write tsconfig.json**

Create `tsconfig.json`:

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

Create `tsconfig.app.json`:

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "useDefineForClassFields": true,
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true,
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["src"]
}
```

Create `tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

- [x] **Step 6: Write vite.config.ts**

Create `vite.config.ts`:

```typescript
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: mode === 'production' ? '/aprilfoolsjoke/' : '/',
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'prompt',
        devOptions: { enabled: false },
        manifest: {
          name: 'AprilFoolsJoke',
          short_name: 'AFJ',
          description: 'Personal family tracker',
          theme_color: '#60a5fa',
          background_color: '#f0f7ff',
          display: 'standalone',
          icons: [
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: { port: 3000 },
    preview: { port: 3000 },
  };
});
```

- [x] **Step 7: Write eslint.config.js**

Create `eslint.config.js`:

```javascript
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
]);
```

- [x] **Step 8: Write index.html**

Create `index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#60a5fa" />
    <title>AprilFoolsJoke</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [x] **Step 9: Write entry point and placeholder App**

Create `src/main.tsx`:

```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

Create `src/App.tsx`:

```typescript
export function App() {
  return <div className="min-h-screen bg-surface text-fg p-4">AprilFoolsJoke</div>;
}
```

Create `src/index.css`:

```css
@import 'tailwindcss';
```

- [x] **Step 10: Create .gitignore**

Create `.gitignore`:

```
node_modules/
dist/
dev-dist/
coverage/
test-results/
playwright-report/
e2e/screenshots/
e2e/results/
*.local
.DS_Store
```

- [x] **Step 11: Verify scaffold builds**

```bash
bun run build
```

Expected: Build succeeds, `dist/` created.

- [x] **Step 12: Commit**

```bash
git add -A
git commit -m "feat: scaffold AprilFoolsJoke — Vite + React 19 + TypeScript + Tailwind v4"
```

---

## Task 2: Shared Types & Result Type

**Files:**
- Create: `src/shared/types.ts`
- Test: `src/shared/__tests__/types.test.ts`

- [x] **Step 1: Write the failing test**

Create `src/shared/__tests__/types.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { ok, err, isOk, isErr } from '../types';

describe('Result type helpers', () => {
  it('ok() creates a success result', () => {
    const result = ok(42);
    expect(result).toEqual({ ok: true, data: 42 });
    expect(isOk(result)).toBe(true);
    expect(isErr(result)).toBe(false);
  });

  it('err() creates a failure result', () => {
    const result = err('something broke');
    expect(result).toEqual({ ok: false, error: 'something broke' });
    expect(isErr(result)).toBe(true);
    expect(isOk(result)).toBe(false);
  });

  it('ok() works with void data', () => {
    const result = ok(undefined);
    expect(result).toEqual({ ok: true, data: undefined });
  });
});
```

- [x] **Step 2: Run test to verify it fails**

```bash
bunx vitest run src/shared/__tests__/types.test.ts
```

Expected: FAIL — cannot find module `../types`

- [x] **Step 3: Write shared types**

Create `src/shared/types.ts`:

```typescript
// --- Result type: every storage/auth operation returns this ---

export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function err<T = never>(error: string): Result<T> {
  return { ok: false, error };
}

export function isOk<T>(result: Result<T>): result is { ok: true; data: T } {
  return result.ok === true;
}

export function isErr<T>(result: Result<T>): result is { ok: false; error: string } {
  return result.ok === false;
}

// --- Module system ---

export type ModuleId = 'body' | 'expenses' | 'baby';

export type ModuleConfig = Record<ModuleId, boolean>;

export const ALL_MODULES: ModuleId[] = ['body', 'expenses', 'baby'];

export const DEFAULT_MODULES: ModuleConfig = {
  body: false,
  expenses: false,
  baby: false,
};

// --- User ---

export type UserRole = 'headminick' | 'user';

export type UserProfile = {
  name: string;
  role: UserRole;
  modules: ModuleConfig;
  theme: string;
  createdAt: string;
};

// --- Sync ---

export type SyncStatus = 'synced' | 'syncing' | 'error' | 'offline';
```

- [x] **Step 4: Run test to verify it passes**

```bash
bunx vitest run src/shared/__tests__/types.test.ts
```

Expected: PASS (3 tests)

- [x] **Step 5: Commit**

```bash
git add src/shared/types.ts src/shared/__tests__/types.test.ts
git commit -m "feat: add Result type and shared types (User, Module, SyncStatus)"
```

---

## Task 3: Constants & Route Config

**Files:**
- Create: `src/constants/config.ts`, `src/constants/routes.ts`

- [x] **Step 1: Write config.ts**

Create `src/constants/config.ts`:

```typescript
export const CONFIG = {
  APP_NAME: 'AprilFoolsJoke',
  VERSION: import.meta.env.VITE_APP_VERSION || '0.1.0',
  DEFAULT_THEME: 'family-blue',
  CURRENCY_SYMBOL: '₹',
  METERS_PER_FLOOR: 3,
} as const;
```

- [x] **Step 2: Write routes.ts**

Create `src/constants/routes.ts`:

```typescript
export const ROUTES = {
  HOME: '/',
  INVITE: '/invite/:code',
  BODY: '/body',
  EXPENSES: '/expenses',
  EXPENSES_ADD: '/expenses/add',
  BABY: '/baby',
  BABY_FEED: '/baby/feed',
  BABY_SLEEP: '/baby/sleep',
  BABY_GROWTH: '/baby/growth',
  BABY_DIAPER: '/baby/diaper',
  ADMIN: '/admin',
  ADMIN_INVITE: '/admin/invite',
} as const;
```

- [x] **Step 3: Commit**

```bash
git add src/constants/
git commit -m "feat: add app constants and route definitions"
```

---

## Task 4: Theme System

**Files:**
- Create: `src/themes/themes.ts`, `src/themes/family-blue.css`, `src/themes/summit-instrument.css`, `src/themes/corporate-glass.css`, `src/themes/night-city-elevator.css`, `src/themes/night-city-apartment.css`, `src/themes/deep-mariana.css`, `src/themes/industrial-furnace.css`, `src/themes/buttons.css`, `src/themes/effects.css`
- Modify: `src/index.css`

- [x] **Step 1: Write themes.ts**

Create `src/themes/themes.ts` — ported from Floor-Tracker with Family Blue added:

```typescript
import { useState, useEffect } from 'react';

export type ThemeId =
  | 'family-blue'
  | 'summit-instrument'
  | 'night-city-elevator'
  | 'deep-mariana'
  | 'night-city-apartment'
  | 'industrial-furnace'
  | 'corporate-glass';

export type ColorMode = 'light' | 'dark' | 'system';

export type ThemeDefinition = {
  id: ThemeId;
  name: string;
  family: string;
  darkOnly: boolean;
  fonts: { display: string; body: string };
  cssClass: string;
  previewColors: { bg: string; accent: string; text: string };
};

export const THEME_DEFINITIONS: Record<ThemeId, ThemeDefinition> = {
  'family-blue': {
    id: 'family-blue',
    name: 'Family Blue',
    family: 'Family',
    darkOnly: false,
    fonts: { display: 'Syne', body: 'system-ui' },
    cssClass: 'theme-family-blue',
    previewColors: { bg: '#f0f7ff', accent: '#60a5fa', text: '#1e293b' },
  },
  'summit-instrument': {
    id: 'summit-instrument',
    name: 'Summit Instrument',
    family: 'Summit',
    darkOnly: false,
    fonts: { display: 'Syne', body: 'system-ui' },
    cssClass: 'theme-summit-instrument',
    previewColors: { bg: '#faf7f2', accent: '#f59e0b', text: '#1a1613' },
  },
  'night-city-elevator': {
    id: 'night-city-elevator',
    name: 'Night City: Elevator',
    family: 'Cyberpunk',
    darkOnly: true,
    fonts: { display: 'Orbitron', body: 'JetBrains Mono' },
    cssClass: 'theme-night-city-elevator',
    previewColors: { bg: '#0a0a0f', accent: '#00f0ff', text: '#c0c0c8' },
  },
  'deep-mariana': {
    id: 'deep-mariana',
    name: 'Deep: Mariana',
    family: 'Deep',
    darkOnly: true,
    fonts: { display: 'Syne', body: 'JetBrains Mono' },
    cssClass: 'theme-deep-mariana',
    previewColors: { bg: '#030b12', accent: '#00e89a', text: '#8cb4c8' },
  },
  'night-city-apartment': {
    id: 'night-city-apartment',
    name: 'Night City: Apartment',
    family: 'Cyberpunk',
    darkOnly: true,
    fonts: { display: 'Orbitron', body: 'JetBrains Mono' },
    cssClass: 'theme-night-city-apartment',
    previewColors: { bg: '#0d0505', accent: '#ffb803', text: '#d0d0d0' },
  },
  'industrial-furnace': {
    id: 'industrial-furnace',
    name: 'Industrial Furnace',
    family: 'Industrial',
    darkOnly: true,
    fonts: { display: 'Syne', body: 'JetBrains Mono' },
    cssClass: 'theme-industrial-furnace',
    previewColors: { bg: '#100804', accent: '#ff6820', text: '#c8a888' },
  },
  'corporate-glass': {
    id: 'corporate-glass',
    name: 'Corporate Glass',
    family: 'Corporate',
    darkOnly: false,
    fonts: { display: 'Syne', body: 'system-ui' },
    cssClass: 'theme-corporate-glass',
    previewColors: { bg: '#f0f4f8', accent: '#0070c0', text: '#1a2836' },
  },
};

export function isValidThemeId(value: string): value is ThemeId {
  return value in THEME_DEFINITIONS;
}

export function applyTheme(themeId: ThemeId, colorMode: ColorMode) {
  const theme = THEME_DEFINITIONS[themeId];
  const root = document.documentElement;

  Object.values(THEME_DEFINITIONS).forEach((t) => root.classList.remove(t.cssClass));
  root.classList.add(theme.cssClass);

  if (theme.darkOnly) {
    root.classList.add('dark');
  } else if (colorMode === 'dark') {
    root.classList.add('dark');
  } else if (colorMode === 'light') {
    root.classList.remove('dark');
  } else {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', isDark);
  }
}

export function useActiveThemeId(): ThemeId {
  const [themeId, setThemeId] = useState<ThemeId>(() => {
    const root = document.documentElement;
    for (const theme of Object.values(THEME_DEFINITIONS)) {
      if (root.classList.contains(theme.cssClass)) return theme.id;
    }
    return 'family-blue';
  });

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const root = document.documentElement;
      for (const theme of Object.values(THEME_DEFINITIONS)) {
        if (root.classList.contains(theme.cssClass)) {
          setThemeId(theme.id);
          return;
        }
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return themeId;
}
```

- [x] **Step 2: Write Family Blue CSS (default theme)**

Create `src/themes/family-blue.css`:

```css
/* Family Blue — clean sky-blue, inspired by Option 2 reference */
.theme-family-blue {
  --bg-primary: #f0f7ff;
  --bg-secondary: #e0efff;
  --bg-card: #ffffff;
  --bg-card-hover: #f8fbff;
  --accent: #60a5fa;
  --accent-hover: #3b82f6;
  --accent-muted: #93c5fd;
  --text-primary: #1e293b;
  --text-secondary: #475569;
  --text-muted: #94a3b8;
  --text-on-accent: #ffffff;
  --border: #cbd5e1;
  --border-light: #e2e8f0;
  --success: #22c55e;
  --error: #ef4444;
  --warning: #f59e0b;
}

.theme-family-blue.dark {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --bg-card: #1e293b;
  --bg-card-hover: #334155;
  --accent: #60a5fa;
  --accent-hover: #93c5fd;
  --accent-muted: #3b82f6;
  --text-primary: #e2e8f0;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  --text-on-accent: #0f172a;
  --border: #334155;
  --border-light: #1e293b;
  --success: #4ade80;
  --error: #f87171;
  --warning: #fbbf24;
}
```

- [x] **Step 3: Port remaining 6 theme CSS files from Floor-Tracker**

Create each theme CSS file following the same custom property pattern. Each file defines the same set of variables (`--bg-primary`, `--bg-secondary`, `--bg-card`, `--accent`, `--text-primary`, etc.) with theme-specific colors.

Port from Floor-Tracker's `src/themes/` directory:
- `src/themes/summit-instrument.css`
- `src/themes/corporate-glass.css`
- `src/themes/night-city-elevator.css`
- `src/themes/night-city-apartment.css`
- `src/themes/deep-mariana.css`
- `src/themes/industrial-furnace.css`

Each dark-only theme only needs the base selector (e.g., `.theme-deep-mariana { ... }`). Light+dark themes need both `.theme-name { ... }` and `.theme-name.dark { ... }`.

Also port `src/themes/buttons.css` and `src/themes/effects.css` from Floor-Tracker.

- [x] **Step 4: Update index.css with theme imports and semantic tokens**

Replace `src/index.css`:

```css
@import 'tailwindcss';

/* Theme CSS files */
@import './themes/family-blue.css';
@import './themes/summit-instrument.css';
@import './themes/corporate-glass.css';
@import './themes/night-city-elevator.css';
@import './themes/night-city-apartment.css';
@import './themes/deep-mariana.css';
@import './themes/industrial-furnace.css';
@import './themes/buttons.css';
@import './themes/effects.css';

/* Map CSS custom properties to Tailwind semantic tokens */
@theme {
  --color-surface: var(--bg-primary);
  --color-surface-secondary: var(--bg-secondary);
  --color-surface-card: var(--bg-card);
  --color-surface-card-hover: var(--bg-card-hover);
  --color-accent: var(--accent);
  --color-accent-hover: var(--accent-hover);
  --color-accent-muted: var(--accent-muted);
  --color-fg: var(--text-primary);
  --color-fg-secondary: var(--text-secondary);
  --color-fg-muted: var(--text-muted);
  --color-fg-on-accent: var(--text-on-accent);
  --color-line: var(--border);
  --color-line-light: var(--border-light);
  --color-success: var(--success);
  --color-error: var(--error);
  --color-warning: var(--warning);
}

/* Base styles */
body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  transition: background-color 0.2s, color 0.2s;
}
```

- [x] **Step 5: Verify themes compile**

```bash
bun run build
```

Expected: Build succeeds without CSS errors.

- [x] **Step 6: Commit**

```bash
git add src/themes/ src/index.css
git commit -m "feat: add theme system — Family Blue default + 6 ported from Floor-Tracker"
```

---

## Task 5: Firebase Setup & Auth Context

**Files:**
- Create: `src/shared/auth/firebase-config.ts`, `src/shared/auth/auth-context.tsx`
- Create: `firestore.rules`, `firebase.json`

- [x] **Step 1: Write Firebase config**

Create `src/shared/auth/firebase-config.ts`:

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'PLACEHOLDER_API_KEY',
  authDomain: 'aprilfoolsjoke.firebaseapp.com',
  projectId: 'aprilfoolsjoke',
  storageBucket: 'aprilfoolsjoke.firebasestorage.app',
  messagingSenderId: 'PLACEHOLDER',
  appId: 'PLACEHOLDER',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});
```

Note: Replace `PLACEHOLDER` values after creating the Firebase project. These are public identifiers, not secrets.

- [x] **Step 2: Write Firestore rules**

Create `firestore.rules`:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // App config: only Headminick can write
    function isHeadminick() {
      return get(/databases/$(database)/documents/app/config).data.headminickUid == request.auth.uid;
    }

    match /app/config {
      allow read: if request.auth != null;
      allow write: if isHeadminick();
    }

    // Invites: Headminick creates, anyone authenticated can read (to redeem)
    match /app/invites/{inviteCode} {
      allow read: if request.auth != null;
      allow create, update, delete: if isHeadminick();
    }

    // User profiles: own profile read/write, Headminick can read/write all
    match /users/{userId}/profile {
      allow read, write: if request.auth.uid == userId || isHeadminick();
    }

    // User module data: only if module is enabled in profile, or Headminick
    match /users/{userId}/body/{docId} {
      allow read, write: if (request.auth.uid == userId && get(/databases/$(database)/documents/users/$(userId)/profile).data.modules.body == true) || isHeadminick();
    }

    match /users/{userId}/expenses/{docId} {
      allow read, write: if (request.auth.uid == userId && get(/databases/$(database)/documents/users/$(userId)/profile).data.modules.expenses == true) || isHeadminick();
    }

    match /users/{userId}/baby/{subCollection}/{docId} {
      allow read, write: if (request.auth.uid == userId && get(/databases/$(database)/documents/users/$(userId)/profile).data.modules.baby == true) || isHeadminick();
    }

    // Deny everything else
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

- [x] **Step 3: Write firebase.json**

Create `firebase.json`:

```json
{
  "firestore": {
    "rules": "firestore.rules"
  }
}
```

- [x] **Step 4: Write AuthContext**

Create `src/shared/auth/auth-context.tsx`:

```typescript
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { signInAnonymously, onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase-config';
import type { UserProfile, SyncStatus } from '../types';

type AuthState = {
  firebaseUser: User | null;
  profile: UserProfile | null;
  isHeadminick: boolean;
  isLoading: boolean;
  syncStatus: SyncStatus;
  setSyncStatus: (status: SyncStatus) => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isHeadminick, setIsHeadminick] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('offline');

  // Listen to Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (!user) {
        // Auto sign-in anonymously
        try {
          await signInAnonymously(auth);
        } catch (error) {
          console.error('Auth error:', error);
          setSyncStatus('error');
          setIsLoading(false);
        }
        return;
      }
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  // Listen to user profile once authenticated
  useEffect(() => {
    if (!firebaseUser) return;

    const profileRef = doc(db, `users/${firebaseUser.uid}/profile`);
    const unsubscribe = onSnapshot(profileRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        setProfile(data);
        setIsHeadminick(data.role === 'headminick');
        setSyncStatus('synced');
      } else {
        setProfile(null);
        setIsHeadminick(false);
      }
    });
    return unsubscribe;
  }, [firebaseUser]);

  return (
    <AuthContext.Provider value={{ firebaseUser, profile, isHeadminick, isLoading, syncStatus, setSyncStatus }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
```

- [x] **Step 5: Commit**

```bash
git add src/shared/auth/ firestore.rules firebase.json
git commit -m "feat: add Firebase config, Firestore rules with Headminick model, AuthContext"
```

---

## Task 6: Storage Abstraction Layer

**Files:**
- Create: `src/shared/storage/adapter.ts`, `src/shared/storage/firebase-adapter.ts`
- Test: `src/shared/storage/__tests__/adapter.test.ts`

- [x] **Step 1: Write the failing test**

Create `src/shared/storage/__tests__/adapter.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import type { StorageAdapter } from '../adapter';
import { ok, err, isOk, isErr } from '../../types';

// Test with a mock adapter to verify the interface contract
function createMockAdapter(): StorageAdapter {
  const store = new Map<string, Map<string, unknown>>();

  return {
    async getAll<T>(collection: string): Promise<typeof ok<T[]> | typeof err> {
      const coll = store.get(collection);
      if (!coll) return ok([] as T[]);
      return ok(Array.from(coll.values()) as T[]);
    },
    async getById<T>(collection: string, id: string) {
      const coll = store.get(collection);
      const item = coll?.get(id);
      if (!item) return err(`Not found: ${id}`);
      return ok(item as T);
    },
    async save<T extends { id?: string }>(collection: string, data: T) {
      if (!store.has(collection)) store.set(collection, new Map());
      const id = data.id || crypto.randomUUID();
      store.get(collection)!.set(id, { ...data, id });
      return ok(undefined);
    },
    async remove(collection: string, id: string) {
      store.get(collection)?.delete(id);
      return ok(undefined);
    },
    onSnapshot: vi.fn(() => () => {}),
  };
}

describe('StorageAdapter contract', () => {
  it('save and getAll round-trips data', async () => {
    const adapter = createMockAdapter();
    await adapter.save('items', { id: '1', name: 'test' });
    const result = await adapter.getAll<{ id: string; name: string }>('items');
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('test');
    }
  });

  it('getById returns err for missing items', async () => {
    const adapter = createMockAdapter();
    const result = await adapter.getById('items', 'nonexistent');
    expect(isErr(result)).toBe(true);
  });

  it('remove deletes an item', async () => {
    const adapter = createMockAdapter();
    await adapter.save('items', { id: '1', name: 'test' });
    await adapter.remove('items', '1');
    const result = await adapter.getAll('items');
    if (isOk(result)) {
      expect(result.data).toHaveLength(0);
    }
  });
});
```

- [x] **Step 2: Run test to verify it fails**

```bash
bunx vitest run src/shared/storage/__tests__/adapter.test.ts
```

Expected: FAIL — cannot find module `../adapter`

- [x] **Step 3: Write the adapter interface**

Create `src/shared/storage/adapter.ts`:

```typescript
import type { Result } from '../types';

export interface StorageAdapter {
  getAll<T>(collection: string): Promise<Result<T[]>>;
  getById<T>(collection: string, id: string): Promise<Result<T>>;
  save<T>(collection: string, data: T): Promise<Result<void>>;
  remove(collection: string, id: string): Promise<Result<void>>;
  onSnapshot<T>(collection: string, callback: (data: T[]) => void): () => void;
}
```

- [x] **Step 4: Write the Firebase adapter**

Create `src/shared/storage/firebase-adapter.ts`:

```typescript
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot as firestoreOnSnapshot,
  query,
} from 'firebase/firestore';
import { db } from '../auth/firebase-config';
import { ok, err } from '../types';
import type { StorageAdapter } from './adapter';

export function createFirebaseAdapter(basePath: string): StorageAdapter {
  return {
    async getAll<T>(collectionName: string) {
      try {
        const q = query(collection(db, `${basePath}/${collectionName}`));
        const snapshot = await getDocs(q);
        const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
        return ok(items);
      } catch (error) {
        return err(`Failed to fetch ${collectionName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    async getById<T>(collectionName: string, id: string) {
      try {
        const docRef = doc(db, `${basePath}/${collectionName}`, id);
        const snap = await getDoc(docRef);
        if (!snap.exists()) return err(`Not found: ${id}`);
        return ok({ id: snap.id, ...snap.data() } as T);
      } catch (error) {
        return err(`Failed to fetch ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    async save<T extends Record<string, unknown>>(collectionName: string, data: T) {
      try {
        const id = (data.id as string) || crypto.randomUUID();
        const docRef = doc(db, `${basePath}/${collectionName}`, id);
        await setDoc(docRef, { ...data, id }, { merge: true });
        return ok(undefined);
      } catch (error) {
        return err(`Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    async remove(collectionName: string, id: string) {
      try {
        const docRef = doc(db, `${basePath}/${collectionName}`, id);
        await deleteDoc(docRef);
        return ok(undefined);
      } catch (error) {
        return err(`Failed to delete ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    onSnapshot<T>(collectionName: string, callback: (data: T[]) => void) {
      const q = query(collection(db, `${basePath}/${collectionName}`));
      return firestoreOnSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
        callback(items);
      });
    },
  };
}
```

- [x] **Step 5: Run test to verify it passes**

```bash
bunx vitest run src/shared/storage/__tests__/adapter.test.ts
```

Expected: PASS (3 tests)

- [x] **Step 6: Commit**

```bash
git add src/shared/storage/
git commit -m "feat: add StorageAdapter interface + Firebase implementation"
```

---

## Task 7: Error Handling — Toast System & ErrorBoundary

**Files:**
- Create: `src/shared/errors/toast-context.tsx`, `src/shared/errors/ErrorBoundary.tsx`

- [x] **Step 1: Write ToastContext**

Create `src/shared/errors/toast-context.tsx`:

```typescript
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

type Toast = {
  id: string;
  message: string;
  type: ToastType;
};

type ToastContextType = {
  toasts: Toast[];
  addToast: (message: string, type: ToastType) => void;
  removeToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-80">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="alert"
            onClick={() => removeToast(toast.id)}
            className={`px-4 py-3 rounded-lg shadow-lg text-sm cursor-pointer transition-opacity ${
              toast.type === 'success'
                ? 'bg-success text-white'
                : toast.type === 'error'
                  ? 'bg-error text-white'
                  : 'bg-surface-card text-fg border border-line'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
```

- [x] **Step 2: Write ErrorBoundary**

Create `src/shared/errors/ErrorBoundary.tsx`:

```typescript
import { Component, type ReactNode, type ErrorInfo } from 'react';

type Props = { children: ReactNode };
type State = { hasError: boolean; error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-surface p-4">
          <div className="bg-surface-card rounded-xl p-6 max-w-md shadow-lg border border-line">
            <h1 className="text-lg font-bold text-fg mb-2">Something went wrong</h1>
            <p className="text-fg-secondary text-sm mb-4">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-accent text-fg-on-accent text-sm font-medium"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
```

- [x] **Step 3: Commit**

```bash
git add src/shared/errors/
git commit -m "feat: add toast notification system and ErrorBoundary"
```

---

## Task 8: Invite System

**Files:**
- Create: `src/shared/auth/invite.ts`, `src/shared/auth/headminick.ts`
- Test: `src/shared/auth/__tests__/invite.test.ts`

- [x] **Step 1: Write the failing test**

Create `src/shared/auth/__tests__/invite.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { generateInviteCode, isValidInviteCode } from '../invite';

describe('invite helpers', () => {
  it('generateInviteCode returns a 12-char alphanumeric string', () => {
    const code = generateInviteCode();
    expect(code).toMatch(/^[a-z0-9]{12}$/);
    expect(code).toHaveLength(12);
  });

  it('generates unique codes', () => {
    const codes = new Set(Array.from({ length: 100 }, () => generateInviteCode()));
    expect(codes.size).toBe(100);
  });

  it('isValidInviteCode validates correctly', () => {
    expect(isValidInviteCode('abc123def456')).toBe(true);
    expect(isValidInviteCode('')).toBe(false);
    expect(isValidInviteCode('short')).toBe(false);
    expect(isValidInviteCode('ABC123DEF456')).toBe(false); // uppercase not allowed
    expect(isValidInviteCode('abc-123-def!')).toBe(false); // special chars
  });
});
```

- [x] **Step 2: Run test to verify it fails**

```bash
bunx vitest run src/shared/auth/__tests__/invite.test.ts
```

Expected: FAIL

- [x] **Step 3: Write invite helpers**

Create `src/shared/auth/invite.ts`:

```typescript
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase-config';
import { ok, err, type Result } from '../types';
import type { ModuleConfig, UserProfile } from '../types';

export function generateInviteCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(12);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join('');
}

export function isValidInviteCode(code: string): boolean {
  return /^[a-z0-9]{12}$/.test(code);
}

export type InviteRecord = {
  code: string;
  name: string;
  modules: ModuleConfig;
  createdBy: string;
  linkedUid: string | null;
  createdAt: string;
  usedAt: string | null;
};

export async function createInvite(
  code: string,
  name: string,
  modules: ModuleConfig,
  createdByUid: string,
): Promise<Result<InviteRecord>> {
  try {
    const invite: InviteRecord = {
      code,
      name,
      modules,
      createdBy: createdByUid,
      linkedUid: null,
      createdAt: new Date().toISOString(),
      usedAt: null,
    };
    await setDoc(doc(db, 'app/invites', code), invite);
    return ok(invite);
  } catch (error) {
    return err(`Failed to create invite: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function redeemInvite(code: string, uid: string): Promise<Result<InviteRecord>> {
  try {
    const inviteRef = doc(db, 'app/invites', code);
    const snap = await getDoc(inviteRef);

    if (!snap.exists()) return err('Invite not found');

    const invite = snap.data() as InviteRecord;
    if (invite.linkedUid) return err('Invite already used');

    // Link the UID to this invite
    await updateDoc(inviteRef, { linkedUid: uid, usedAt: new Date().toISOString() });

    // Create user profile
    const profile: UserProfile = {
      name: invite.name,
      role: 'user',
      modules: invite.modules,
      theme: 'family-blue',
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, `users/${uid}/profile`), profile);

    return ok({ ...invite, linkedUid: uid });
  } catch (error) {
    return err(`Failed to redeem invite: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
```

- [x] **Step 4: Write Headminick helpers**

Create `src/shared/auth/headminick.ts`:

```typescript
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase-config';
import { ok, err, type Result } from '../types';
import type { ModuleConfig } from '../types';

export async function isCurrentUserHeadminick(uid: string): Promise<boolean> {
  try {
    const configRef = doc(db, 'app/config');
    const snap = await getDoc(configRef);
    if (!snap.exists()) return false;
    return snap.data().headminickUid === uid;
  } catch {
    return false;
  }
}

export async function initializeHeadminick(uid: string, name: string): Promise<Result<void>> {
  try {
    // Set app config
    await setDoc(doc(db, 'app/config'), { headminickUid: uid, createdAt: new Date().toISOString() });

    // Create Headminick profile with all modules enabled
    await setDoc(doc(db, `users/${uid}/profile`), {
      name,
      role: 'headminick',
      modules: { body: true, expenses: true, baby: true },
      theme: 'family-blue',
      createdAt: new Date().toISOString(),
    });

    return ok(undefined);
  } catch (error) {
    return err(`Failed to initialize Headminick: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function updateUserModules(uid: string, modules: ModuleConfig): Promise<Result<void>> {
  try {
    const profileRef = doc(db, `users/${uid}/profile`);
    await updateDoc(profileRef, { modules });
    return ok(undefined);
  } catch (error) {
    return err(`Failed to update modules: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
```

- [x] **Step 5: Run test to verify it passes**

```bash
bunx vitest run src/shared/auth/__tests__/invite.test.ts
```

Expected: PASS (3 tests)

- [x] **Step 6: Commit**

```bash
git add src/shared/auth/
git commit -m "feat: add invite system and Headminick admin helpers"
```

---

## Task 9: Shared Components — Layout, TabBar, SyncStatus

**Files:**
- Create: `src/shared/components/Layout.tsx`, `src/shared/components/TabBar.tsx`, `src/shared/components/SyncStatus.tsx`, `src/shared/components/UpdatePrompt.tsx`
- Create: `src/shared/hooks/useSyncStatus.ts`, `src/shared/hooks/useModules.ts`

- [x] **Step 1: Write useModules hook**

Create `src/shared/hooks/useModules.ts`:

```typescript
import { useMemo } from 'react';
import { useAuth } from '../auth/auth-context';
import type { ModuleId } from '../types';

export function useModules(): ModuleId[] {
  const { profile } = useAuth();

  return useMemo(() => {
    if (!profile) return [];
    return (Object.entries(profile.modules) as [ModuleId, boolean][])
      .filter(([, enabled]) => enabled)
      .map(([id]) => id);
  }, [profile]);
}
```

- [x] **Step 2: Write useSyncStatus hook**

Create `src/shared/hooks/useSyncStatus.ts`:

```typescript
import { useAuth } from '../auth/auth-context';

export function useSyncStatus() {
  const { syncStatus, setSyncStatus } = useAuth();
  return { syncStatus, setSyncStatus };
}
```

- [x] **Step 3: Write SyncStatus component**

Create `src/shared/components/SyncStatus.tsx`:

```typescript
import { useSyncStatus } from '../hooks/useSyncStatus';
import type { SyncStatus as SyncStatusType } from '../types';

const STATUS_CONFIG: Record<SyncStatusType, { color: string; label: string }> = {
  synced: { color: 'bg-success', label: 'Synced' },
  syncing: { color: 'bg-warning animate-pulse', label: 'Syncing...' },
  error: { color: 'bg-error', label: 'Sync error' },
  offline: { color: 'bg-fg-muted', label: 'Offline' },
};

export function SyncStatus() {
  const { syncStatus } = useSyncStatus();
  const config = STATUS_CONFIG[syncStatus];

  return (
    <div className="flex items-center gap-1.5 text-xs text-fg-muted" title={config.label}>
      <div className={`w-2 h-2 rounded-full ${config.color}`} />
      <span>{config.label}</span>
    </div>
  );
}
```

- [x] **Step 4: Write TabBar component**

Create `src/shared/components/TabBar.tsx`:

```typescript
import { useLocation, useNavigate } from 'react-router-dom';
import { Activity, Receipt, Baby } from 'lucide-react';
import { useModules } from '../hooks/useModules';
import { useAuth } from '../auth/auth-context';
import type { ModuleId } from '../types';
import { ROUTES } from '@/src/constants/routes';

const MODULE_TABS: Record<ModuleId, { icon: typeof Activity; label: string; route: string }> = {
  body: { icon: Activity, label: 'Body', route: ROUTES.BODY },
  expenses: { icon: Receipt, label: 'Expenses', route: ROUTES.EXPENSES },
  baby: { icon: Baby, label: 'Baby', route: ROUTES.BABY },
};

export function TabBar() {
  const modules = useModules();
  const { isHeadminick } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface-card border-t border-line flex justify-around py-2 px-4 z-40">
      {modules.map((moduleId) => {
        const tab = MODULE_TABS[moduleId];
        const isActive = location.pathname.startsWith(tab.route);
        const Icon = tab.icon;

        return (
          <button
            key={moduleId}
            onClick={() => navigate(tab.route)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
              isActive ? 'text-accent' : 'text-fg-muted hover:text-fg-secondary'
            }`}
          >
            <Icon size={20} />
            <span className="text-xs">{tab.label}</span>
          </button>
        );
      })}
      {isHeadminick && (
        <button
          onClick={() => navigate(ROUTES.ADMIN)}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
            location.pathname.startsWith(ROUTES.ADMIN) ? 'text-accent' : 'text-fg-muted hover:text-fg-secondary'
          }`}
        >
          <span className="text-lg">👑</span>
          <span className="text-xs">Admin</span>
        </button>
      )}
    </nav>
  );
}
```

- [x] **Step 5: Write UpdatePrompt component**

Create `src/shared/components/UpdatePrompt.tsx`:

```typescript
import { useRegisterSW } from 'virtual:pwa-register/react';

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-surface-card border border-accent rounded-lg shadow-lg px-4 py-3 flex items-center gap-3">
      <span className="text-sm text-fg">Update available</span>
      <button
        onClick={() => updateServiceWorker(true)}
        className="px-3 py-1 rounded bg-accent text-fg-on-accent text-sm font-medium"
      >
        Update
      </button>
    </div>
  );
}
```

- [x] **Step 6: Write Layout shell**

Create `src/shared/components/Layout.tsx`:

```typescript
import { Outlet } from 'react-router-dom';
import { useAuth } from '../auth/auth-context';
import { TabBar } from './TabBar';
import { SyncStatus } from './SyncStatus';
import { UpdatePrompt } from './UpdatePrompt';

export function Layout() {
  const { isLoading, profile } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-fg-muted">Loading...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface p-4">
        <div className="bg-surface-card rounded-xl p-6 max-w-md shadow-lg border border-line text-center">
          <h1 className="text-lg font-bold text-fg mb-2">Waiting for Access</h1>
          <p className="text-fg-secondary text-sm">
            You need an invite link to use this app. Ask the admin for access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface pb-16">
      <header className="flex items-center justify-between px-4 py-3 bg-surface-card border-b border-line">
        <h1 className="text-fg font-bold">AprilFoolsJoke</h1>
        <SyncStatus />
      </header>
      <main className="p-4">
        <Outlet />
      </main>
      <TabBar />
      <UpdatePrompt />
    </div>
  );
}
```

- [x] **Step 7: Commit**

```bash
git add src/shared/components/ src/shared/hooks/
git commit -m "feat: add Layout shell, TabBar, SyncStatus, UpdatePrompt, module hooks"
```

---

## Task 10: Body Module — Floors

**Files:**
- Create: `src/modules/body/types.ts`, `src/modules/body/scoring.ts`, `src/modules/body/hooks/useBodyData.ts`, `src/modules/body/components/BodyTracker.tsx`
- Test: `src/modules/body/__tests__/scoring.test.ts`

- [x] **Step 1: Write the failing scoring test**

Create `src/modules/body/__tests__/scoring.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { calculateTotal } from '../scoring';

describe('calculateTotal', () => {
  it('scores up=1, down=0.5', () => {
    expect(calculateTotal(10, 5)).toBe(12.5);
  });

  it('handles zero', () => {
    expect(calculateTotal(0, 0)).toBe(0);
  });

  it('handles up-only', () => {
    expect(calculateTotal(5, 0)).toBe(5);
  });

  it('handles down-only', () => {
    expect(calculateTotal(0, 10)).toBe(5);
  });
});
```

- [x] **Step 2: Run test to verify it fails**

```bash
bunx vitest run src/modules/body/__tests__/scoring.test.ts
```

Expected: FAIL

- [x] **Step 3: Write types and scoring**

Create `src/modules/body/types.ts`:

```typescript
export type BodyRecord = {
  dateStr: string;
  floors: { up: number; down: number };
  steps: null;
  running: null;
  exercise: null;
  total: number;
};
```

Create `src/modules/body/scoring.ts`:

```typescript
export function calculateTotal(up: number, down: number): number {
  return up + down * 0.5;
}
```

- [x] **Step 4: Run test to verify it passes**

```bash
bunx vitest run src/modules/body/__tests__/scoring.test.ts
```

Expected: PASS (4 tests)

- [x] **Step 5: Write useBodyData hook**

Create `src/modules/body/hooks/useBodyData.ts`:

```typescript
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/src/shared/auth/auth-context';
import { useToast } from '@/src/shared/errors/toast-context';
import { createFirebaseAdapter } from '@/src/shared/storage/firebase-adapter';
import { isOk } from '@/src/shared/types';
import { calculateTotal } from '../scoring';
import type { BodyRecord } from '../types';

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

export function useBodyData() {
  const { firebaseUser, setSyncStatus } = useAuth();
  const { addToast } = useToast();
  const [records, setRecords] = useState<Record<string, BodyRecord>>({});

  const adapter = firebaseUser
    ? createFirebaseAdapter(`users/${firebaseUser.uid}`)
    : null;

  // Subscribe to real-time updates
  useEffect(() => {
    if (!adapter) return;
    const unsubscribe = adapter.onSnapshot<BodyRecord>('body', (data) => {
      const map: Record<string, BodyRecord> = {};
      data.forEach((r) => { map[r.dateStr] = r; });
      setRecords(map);
      setSyncStatus('synced');
    });
    return unsubscribe;
  }, [adapter, setSyncStatus]);

  const tap = useCallback(async (type: 'up' | 'down') => {
    if (!adapter) return;
    const today = getTodayKey();
    const current = records[today] || { dateStr: today, floors: { up: 0, down: 0 }, steps: null, running: null, exercise: null, total: 0 };

    const newUp = type === 'up' ? current.floors.up + 1 : current.floors.up;
    const newDown = type === 'down' ? current.floors.down + 1 : current.floors.down;
    const newTotal = calculateTotal(newUp, newDown);

    const updated: BodyRecord = {
      ...current,
      floors: { up: newUp, down: newDown },
      total: newTotal,
    };

    // Optimistic update
    setRecords((prev) => ({ ...prev, [today]: updated }));
    setSyncStatus('syncing');

    const result = await adapter.save('body', { ...updated, id: today });
    if (!isOk(result)) {
      addToast('Failed to save — will retry when connected', 'error');
      setSyncStatus('error');
    }
  }, [adapter, records, setSyncStatus, addToast]);

  const todayRecord = records[getTodayKey()] || { dateStr: getTodayKey(), floors: { up: 0, down: 0 }, steps: null, running: null, exercise: null, total: 0 };

  return { records, todayRecord, tap };
}
```

- [x] **Step 6: Write BodyTracker component**

Create `src/modules/body/components/BodyTracker.tsx`:

```typescript
import { ArrowUp, ArrowDown } from 'lucide-react';
import { useBodyData } from '../hooks/useBodyData';

export function BodyTracker() {
  const { todayRecord, tap } = useBodyData();
  const { floors, total } = todayRecord;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-fg">Today's Floors</h2>
        <p className="text-5xl font-mono font-bold text-accent mt-2">{total}</p>
        <p className="text-fg-muted text-sm mt-1">
          {floors.up} up · {floors.down} down
        </p>
      </div>

      <div className="flex justify-center gap-6">
        <button
          onClick={() => tap('up')}
          className="w-20 h-20 rounded-2xl bg-accent text-fg-on-accent flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        >
          <ArrowUp size={32} />
        </button>
        <button
          onClick={() => tap('down')}
          className="w-20 h-20 rounded-2xl bg-surface-card border-2 border-line text-fg flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        >
          <ArrowDown size={32} />
        </button>
      </div>
    </div>
  );
}
```

- [x] **Step 7: Commit**

```bash
git add src/modules/body/
git commit -m "feat: add Body module — floor tracking with scoring and real-time sync"
```

---

## Task 11: Expenses Module

**Files:**
- Create: `src/modules/expenses/types.ts`, `src/modules/expenses/categories.ts`, `src/modules/expenses/validation.ts`, `src/modules/expenses/hooks/useExpenses.ts`, `src/modules/expenses/components/AddExpense.tsx`, `src/modules/expenses/components/ExpenseList.tsx`
- Test: `src/modules/expenses/__tests__/validation.test.ts`

- [x] **Step 1: Write the failing validation test**

Create `src/modules/expenses/__tests__/validation.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { validateExpense } from '../validation';
import { isOk, isErr } from '@/src/shared/types';

describe('validateExpense', () => {
  const valid = { date: '2026-04-01', category: 'food', amount: 100 };

  it('accepts valid expense', () => {
    expect(isOk(validateExpense(valid))).toBe(true);
  });

  it('rejects missing date', () => {
    expect(isErr(validateExpense({ ...valid, date: '' }))).toBe(true);
  });

  it('rejects invalid date format', () => {
    expect(isErr(validateExpense({ ...valid, date: '01-04-2026' }))).toBe(true);
  });

  it('rejects unknown category', () => {
    expect(isErr(validateExpense({ ...valid, category: 'unknown' }))).toBe(true);
  });

  it('rejects zero amount', () => {
    expect(isErr(validateExpense({ ...valid, amount: 0 }))).toBe(true);
  });

  it('rejects negative amount', () => {
    expect(isErr(validateExpense({ ...valid, amount: -50 }))).toBe(true);
  });
});
```

- [x] **Step 2: Run test to verify it fails**

```bash
bunx vitest run src/modules/expenses/__tests__/validation.test.ts
```

Expected: FAIL

- [x] **Step 3: Write types**

Create `src/modules/expenses/types.ts`:

```typescript
export type Expense = {
  id: string;
  date: string;
  category: string;
  subCat: string;
  amount: number;
  note: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CategoryDefinition = {
  id: string;
  label: string;
  subCategories: string[];
};
```

- [x] **Step 4: Write categories** (ported from Finularity)

Create `src/modules/expenses/categories.ts`:

```typescript
import type { CategoryDefinition } from './types';

export const CATEGORIES: Record<string, CategoryDefinition> = {
  food: { id: 'food', label: 'Food', subCategories: ['Milk', 'Snacks', 'Groceries', 'Healthy', 'Orders'] },
  shopping: { id: 'shopping', label: 'Shopping', subCategories: ['Veggies', 'Fruits', 'Fashion', 'Ration', 'Electronics'] },
  travel: { id: 'travel', label: 'Travel', subCategories: ['Air', 'Train', 'Bus', 'Road Toll'] },
  vehicle: { id: 'vehicle', label: 'Vehicle', subCategories: ['Fuel', 'Maintenance', 'Washing'] },
  bills: { id: 'bills', label: 'Bills', subCategories: ['Phone', 'Internet', 'Subscriptions', 'Entertainment', 'Rent', 'Electricity', 'Society', 'Insurance'] },
  medical: { id: 'medical', label: 'Medical', subCategories: ['Doctor/Consultation', 'Medicines', 'Tests'] },
  care: { id: 'care', label: 'Care', subCategories: ['Personal', 'Grooming', 'Massage'] },
  gifts: { id: 'gifts', label: 'Gifts', subCategories: ['Ceremonies', 'Charity', 'Donations'] },
  education: { id: 'education', label: 'Education', subCategories: ['Courses', 'Books'] },
  misc: { id: 'misc', label: 'Misc', subCategories: [] },
};

export function getAllCategoryIds(): string[] {
  return Object.keys(CATEGORIES);
}

export function getSubCategories(categoryId: string): string[] {
  return CATEGORIES[categoryId]?.subCategories ?? [];
}
```

- [x] **Step 5: Write validation** (fixed version — returns Result, not void)

Create `src/modules/expenses/validation.ts`:

```typescript
import { ok, err, type Result } from '@/src/shared/types';
import { CATEGORIES } from './categories';

type ExpenseInput = { date: string; category: string; amount: number };

export function validateExpense(input: ExpenseInput): Result<void> {
  if (!input.date) return err('Date is required');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) return err('Date must be YYYY-MM-DD');
  if (!CATEGORIES[input.category]) return err(`Unknown category: ${input.category}`);
  if (typeof input.amount !== 'number' || input.amount <= 0) return err('Amount must be positive');
  return ok(undefined);
}
```

- [x] **Step 6: Run test to verify it passes**

```bash
bunx vitest run src/modules/expenses/__tests__/validation.test.ts
```

Expected: PASS (6 tests)

- [x] **Step 7: Write useExpenses hook**

Create `src/modules/expenses/hooks/useExpenses.ts`:

```typescript
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/src/shared/auth/auth-context';
import { useToast } from '@/src/shared/errors/toast-context';
import { createFirebaseAdapter } from '@/src/shared/storage/firebase-adapter';
import { isOk, isErr } from '@/src/shared/types';
import { validateExpense } from '../validation';
import type { Expense } from '../types';

export function useExpenses() {
  const { firebaseUser, setSyncStatus } = useAuth();
  const { addToast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const adapter = firebaseUser
    ? createFirebaseAdapter(`users/${firebaseUser.uid}`)
    : null;

  useEffect(() => {
    if (!adapter) return;
    const unsubscribe = adapter.onSnapshot<Expense>('expenses', (data) => {
      setExpenses(data.filter((e) => !e.isDeleted));
      setSyncStatus('synced');
    });
    return unsubscribe;
  }, [adapter, setSyncStatus]);

  const addExpense = useCallback(async (input: { date: string; category: string; subCat: string; amount: number; note: string }) => {
    if (!adapter) return;

    const validation = validateExpense(input);
    if (isErr(validation)) {
      addToast(validation.error, 'error');
      return;
    }

    const now = new Date().toISOString();
    const expense: Expense = {
      id: crypto.randomUUID(),
      ...input,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    };

    setSyncStatus('syncing');
    const result = await adapter.save('expenses', expense);

    if (isOk(result)) {
      addToast('Expense saved', 'success');
    } else {
      addToast('Failed to save expense', 'error');
      setSyncStatus('error');
    }
  }, [adapter, setSyncStatus, addToast]);

  const deleteExpense = useCallback(async (id: string) => {
    if (!adapter) return;
    setSyncStatus('syncing');
    const result = await adapter.save('expenses', { id, isDeleted: true, updatedAt: new Date().toISOString() });
    if (isOk(result)) {
      addToast('Expense deleted', 'success');
    } else {
      addToast('Failed to delete', 'error');
    }
  }, [adapter, setSyncStatus, addToast]);

  return { expenses, addExpense, deleteExpense };
}
```

- [x] **Step 8: Write AddExpense and ExpenseList components**

Create `src/modules/expenses/components/AddExpense.tsx`:

```typescript
import { useState } from 'react';
import { useExpenses } from '../hooks/useExpenses';
import { CATEGORIES, getSubCategories } from '../categories';
import { CONFIG } from '@/src/constants/config';

export function AddExpense() {
  const { addExpense } = useExpenses();
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('food');
  const [subCat, setSubCat] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const subCategories = getSubCategories(category);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    await addExpense({ date, category, subCat, amount: parsedAmount, note });
    setAmount('');
    setNote('');
    setSubCat('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm text-fg-secondary">Date</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
          className="w-full mt-1 px-3 py-2 rounded-lg bg-surface-card border border-line text-fg" />
      </div>
      <div>
        <label className="text-sm text-fg-secondary">Category</label>
        <select value={category} onChange={(e) => { setCategory(e.target.value); setSubCat(''); }}
          className="w-full mt-1 px-3 py-2 rounded-lg bg-surface-card border border-line text-fg">
          {Object.values(CATEGORIES).map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
      </div>
      {subCategories.length > 0 && (
        <div>
          <label className="text-sm text-fg-secondary">Sub-category</label>
          <select value={subCat} onChange={(e) => setSubCat(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded-lg bg-surface-card border border-line text-fg">
            <option value="">None</option>
            {subCategories.map((sc) => (
              <option key={sc} value={sc}>{sc}</option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label className="text-sm text-fg-secondary">Amount ({CONFIG.CURRENCY_SYMBOL})</label>
        <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}
          className="w-full mt-1 px-3 py-2 rounded-lg bg-surface-card border border-line text-fg" />
      </div>
      <div>
        <label className="text-sm text-fg-secondary">Note</label>
        <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
          className="w-full mt-1 px-3 py-2 rounded-lg bg-surface-card border border-line text-fg" />
      </div>
      <button type="submit" disabled={!amount || parseFloat(amount) <= 0}
        className="w-full py-3 rounded-lg bg-accent text-fg-on-accent font-medium disabled:opacity-50">
        Add Expense
      </button>
    </form>
  );
}
```

Create `src/modules/expenses/components/ExpenseList.tsx`:

```typescript
import { useExpenses } from '../hooks/useExpenses';
import { CATEGORIES } from '../categories';
import { CONFIG } from '@/src/constants/config';

export function ExpenseList() {
  const { expenses, deleteExpense } = useExpenses();
  const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date));

  if (sorted.length === 0) {
    return <p className="text-fg-muted text-center py-8">No expenses yet</p>;
  }

  return (
    <div className="space-y-2">
      {sorted.map((expense) => (
        <div key={expense.id} className="bg-surface-card rounded-lg p-3 border border-line flex items-center justify-between">
          <div>
            <div className="text-fg font-medium">
              {CONFIG.CURRENCY_SYMBOL}{expense.amount.toFixed(2)}
              <span className="text-fg-muted text-sm ml-2">
                {CATEGORIES[expense.category]?.label ?? expense.category}
                {expense.subCat && ` · ${expense.subCat}`}
              </span>
            </div>
            <div className="text-fg-muted text-xs">
              {expense.date}{expense.note && ` — ${expense.note}`}
            </div>
          </div>
          <button onClick={() => deleteExpense(expense.id)}
            className="text-error text-sm hover:underline">
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
```

- [x] **Step 9: Commit**

```bash
git add src/modules/expenses/
git commit -m "feat: add Expenses module — categories, validation, CRUD with Firebase"
```

---

## Task 12: Baby Module

**Files:**
- Create: `src/modules/baby/types.ts`, `src/modules/baby/constants.ts`, `src/modules/baby/hooks/useBabyData.ts`, `src/modules/baby/components/FeedLog.tsx`, `src/modules/baby/components/SleepLog.tsx`, `src/modules/baby/components/GrowthLog.tsx`, `src/modules/baby/components/DiaperLog.tsx`

- [x] **Step 1: Write types and constants** (ported from BabyTracker Go models)

Create `src/modules/baby/types.ts`:

```typescript
export type FeedEntry = {
  id: string;
  date: string;
  time: string;
  type: string;
  quantity: number;
  notes: string;
  duration: number;
};

export type SleepEntry = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  type: string;
  quality: string;
  notes: string;
};

export type GrowthEntry = {
  id: string;
  date: string;
  weight: number;
  height: number;
  headCircumference: number;
  notes: string;
};

export type DiaperEntry = {
  id: string;
  date: string;
  time: string;
  type: string;
  notes: string;
};
```

Create `src/modules/baby/constants.ts`:

```typescript
export const FEED_TYPES = ['Bottle', 'Breast (Left)', 'Breast (Right)', 'Breast (Both)', 'Solid Food'] as const;
export const SLEEP_TYPES = ['Nap', 'Night'] as const;
export const SLEEP_QUALITIES = ['Good', 'Fair', 'Poor'] as const;
export const DIAPER_TYPES = ['Wet', 'Dirty', 'Mixed'] as const;
```

- [x] **Step 2: Write useBabyData hook**

Create `src/modules/baby/hooks/useBabyData.ts`:

```typescript
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/src/shared/auth/auth-context';
import { useToast } from '@/src/shared/errors/toast-context';
import { createFirebaseAdapter } from '@/src/shared/storage/firebase-adapter';
import { isOk } from '@/src/shared/types';
import type { FeedEntry, SleepEntry, GrowthEntry, DiaperEntry } from '../types';

export function useBabyData() {
  const { firebaseUser, setSyncStatus } = useAuth();
  const { addToast } = useToast();
  const [feeds, setFeeds] = useState<FeedEntry[]>([]);
  const [sleeps, setSleeps] = useState<SleepEntry[]>([]);
  const [growth, setGrowth] = useState<GrowthEntry[]>([]);
  const [diapers, setDiapers] = useState<DiaperEntry[]>([]);

  const adapter = firebaseUser
    ? createFirebaseAdapter(`users/${firebaseUser.uid}/baby`)
    : null;

  useEffect(() => {
    if (!adapter) return;
    const unsubs = [
      adapter.onSnapshot<FeedEntry>('feeds', setFeeds),
      adapter.onSnapshot<SleepEntry>('sleep', setSleeps),
      adapter.onSnapshot<GrowthEntry>('growth', setGrowth),
      adapter.onSnapshot<DiaperEntry>('diapers', setDiapers),
    ];
    setSyncStatus('synced');
    return () => unsubs.forEach((u) => u());
  }, [adapter, setSyncStatus]);

  const saveEntry = useCallback(async <T extends Record<string, unknown>>(collection: string, data: T) => {
    if (!adapter) return;
    setSyncStatus('syncing');
    const entry = { ...data, id: (data.id as string) || crypto.randomUUID() };
    const result = await adapter.save(collection, entry);
    if (isOk(result)) {
      addToast('Saved', 'success');
    } else {
      addToast('Failed to save', 'error');
      setSyncStatus('error');
    }
  }, [adapter, setSyncStatus, addToast]);

  return {
    feeds, sleeps, growth, diapers,
    logFeed: (data: Omit<FeedEntry, 'id'>) => saveEntry('feeds', data),
    logSleep: (data: Omit<SleepEntry, 'id'>) => saveEntry('sleep', data),
    logGrowth: (data: Omit<GrowthEntry, 'id'>) => saveEntry('growth', data),
    logDiaper: (data: Omit<DiaperEntry, 'id'>) => saveEntry('diapers', data),
  };
}
```

- [x] **Step 3: Write FeedLog component**

Create `src/modules/baby/components/FeedLog.tsx`:

```typescript
import { useState } from 'react';
import { useBabyData } from '../hooks/useBabyData';
import { FEED_TYPES } from '../constants';

export function FeedLog() {
  const { feeds, logFeed } = useBabyData();
  const [type, setType] = useState<string>('Bottle');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(() => new Date().toTimeString().slice(0, 5));
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [duration, setDuration] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await logFeed({
      date,
      time: `${date}T${time}`,
      type,
      quantity: parseFloat(quantity) || 0,
      notes,
      duration: parseInt(duration) || 0,
    });
    setQuantity('');
    setNotes('');
    setDuration('');
  };

  const recent = [...feeds].sort((a, b) => b.time.localeCompare(a.time)).slice(0, 10);

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          {FEED_TYPES.map((ft) => (
            <button key={ft} type="button" onClick={() => setType(ft)}
              className={`px-3 py-1.5 rounded-lg text-sm ${type === ft ? 'bg-accent text-fg-on-accent' : 'bg-surface-card border border-line text-fg'}`}>
              {ft}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg bg-surface-card border border-line text-fg" />
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg bg-surface-card border border-line text-fg" />
        </div>
        {(type === 'Bottle' || type === 'Solid Food') && (
          <input type="number" min="0" step="any" placeholder="Quantity (ml/g)" value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-surface-card border border-line text-fg" />
        )}
        {type.startsWith('Breast') && (
          <input type="number" min="0" placeholder="Duration (minutes)" value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-surface-card border border-line text-fg" />
        )}
        <input type="text" placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-surface-card border border-line text-fg" />
        <button type="submit" className="w-full py-3 rounded-lg bg-accent text-fg-on-accent font-medium">Log Feed</button>
      </form>
      <div className="space-y-2">
        {recent.map((f) => (
          <div key={f.id} className="bg-surface-card rounded-lg p-3 border border-line text-sm">
            <span className="text-fg font-medium">{f.type}</span>
            <span className="text-fg-muted ml-2">{f.quantity > 0 && `${f.quantity}ml`} {f.duration > 0 && `${f.duration}min`}</span>
            <span className="text-fg-muted float-right">{f.date} {f.time.split('T')[1]?.slice(0, 5)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [x] **Step 4: Write SleepLog, GrowthLog, DiaperLog components**

Create `src/modules/baby/components/SleepLog.tsx`, `src/modules/baby/components/GrowthLog.tsx`, `src/modules/baby/components/DiaperLog.tsx` following the same pattern as FeedLog — form with appropriate fields per type constant, submit calls the corresponding `logSleep`/`logGrowth`/`logDiaper` from `useBabyData`, recent entries displayed below.

Fields per component:
- **SleepLog**: type (Nap/Night), date, startTime, endTime, quality (Good/Fair/Poor), notes
- **GrowthLog**: date, weight (kg), height (cm), headCircumference (cm), notes
- **DiaperLog**: type (Wet/Dirty/Mixed), date, time, notes — with quick buttons for Wet and Dirty

- [x] **Step 5: Commit**

```bash
git add src/modules/baby/
git commit -m "feat: add Baby module — feed, sleep, growth, diaper tracking"
```

---

## Task 13: Admin Panel

**Files:**
- Create: `src/admin/components/AdminPanel.tsx`, `src/admin/components/InviteGenerator.tsx`, `src/admin/hooks/useAdmin.ts`

- [x] **Step 1: Write useAdmin hook**

Create `src/admin/hooks/useAdmin.ts`:

```typescript
import { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/src/shared/auth/firebase-config';
import type { InviteRecord } from '@/src/shared/auth/invite';
import type { UserProfile } from '@/src/shared/types';

type UserWithUid = UserProfile & { uid: string };

export function useAdmin() {
  const [invites, setInvites] = useState<InviteRecord[]>([]);
  const [users, setUsers] = useState<UserWithUid[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'app/invites'));
    return onSnapshot(q, (snap) => {
      setInvites(snap.docs.map((d) => d.data() as InviteRecord));
    });
  }, []);

  return { invites, users };
}
```

- [x] **Step 2: Write InviteGenerator**

Create `src/admin/components/InviteGenerator.tsx`:

```typescript
import { useState } from 'react';
import { useAuth } from '@/src/shared/auth/auth-context';
import { useToast } from '@/src/shared/errors/toast-context';
import { generateInviteCode, createInvite } from '@/src/shared/auth/invite';
import { isOk } from '@/src/shared/types';
import type { ModuleConfig } from '@/src/shared/types';

export function InviteGenerator() {
  const { firebaseUser } = useAuth();
  const { addToast } = useToast();
  const [name, setName] = useState('');
  const [modules, setModules] = useState<ModuleConfig>({ body: true, expenses: false, baby: false });
  const [lastLink, setLastLink] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!firebaseUser || !name.trim()) return;
    const code = generateInviteCode();
    const result = await createInvite(code, name.trim(), modules, firebaseUser.uid);
    if (isOk(result)) {
      const link = `${window.location.origin}${window.location.pathname}#/invite/${code}`;
      setLastLink(link);
      addToast('Invite created', 'success');
      setName('');
    } else {
      addToast(result.error, 'error');
    }
  };

  return (
    <div className="bg-surface-card rounded-xl p-4 border border-line space-y-4">
      <h3 className="text-fg font-bold">Generate Invite</h3>
      <input type="text" placeholder="Name for invitee" value={name} onChange={(e) => setName(e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-surface border border-line text-fg" />
      <div className="space-y-2">
        {(['body', 'expenses', 'baby'] as const).map((mod) => (
          <label key={mod} className="flex items-center gap-2 text-sm text-fg">
            <input type="checkbox" checked={modules[mod]}
              onChange={(e) => setModules((prev) => ({ ...prev, [mod]: e.target.checked }))} />
            {mod.charAt(0).toUpperCase() + mod.slice(1)}
          </label>
        ))}
      </div>
      <button onClick={handleCreate} disabled={!name.trim()}
        className="w-full py-2 rounded-lg bg-accent text-fg-on-accent font-medium disabled:opacity-50">
        Create Invite
      </button>
      {lastLink && (
        <div className="p-3 rounded-lg bg-surface text-xs break-all text-fg-secondary border border-line">
          <p className="font-medium text-fg mb-1">Share this link:</p>
          {lastLink}
        </div>
      )}
    </div>
  );
}
```

- [x] **Step 3: Write AdminPanel**

Create `src/admin/components/AdminPanel.tsx`:

```typescript
import { InviteGenerator } from './InviteGenerator';
import { useAdmin } from '../hooks/useAdmin';

export function AdminPanel() {
  const { invites } = useAdmin();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-fg">Headminick Admin</h2>
      <InviteGenerator />
      <div className="bg-surface-card rounded-xl p-4 border border-line">
        <h3 className="text-fg font-bold mb-3">Invites ({invites.length})</h3>
        <div className="space-y-2">
          {invites.map((inv) => (
            <div key={inv.code} className="text-sm flex justify-between">
              <span className="text-fg">{inv.name}</span>
              <span className={inv.linkedUid ? 'text-success' : 'text-fg-muted'}>
                {inv.linkedUid ? 'Redeemed' : 'Pending'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [x] **Step 4: Commit**

```bash
git add src/admin/
git commit -m "feat: add Headminick admin panel with invite generator"
```

---

## Task 14: Wire Up App Router

**Files:**
- Modify: `src/App.tsx`

- [x] **Step 1: Write the full App with routing**

Replace `src/App.tsx`:

```typescript
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './shared/auth/auth-context';
import { ToastProvider } from './shared/errors/toast-context';
import { ErrorBoundary } from './shared/errors/ErrorBoundary';
import { Layout } from './shared/components/Layout';
import { BodyTracker } from './modules/body/components/BodyTracker';
import { AddExpense } from './modules/expenses/components/AddExpense';
import { ExpenseList } from './modules/expenses/components/ExpenseList';
import { FeedLog } from './modules/baby/components/FeedLog';
import { SleepLog } from './modules/baby/components/SleepLog';
import { GrowthLog } from './modules/baby/components/GrowthLog';
import { DiaperLog } from './modules/baby/components/DiaperLog';
import { AdminPanel } from './admin/components/AdminPanel';
import { InviteRedeem } from './shared/auth/InviteRedeem';
import { ROUTES } from './constants/routes';
import { applyTheme } from './themes/themes';
import { CONFIG } from './constants/config';
import { useEffect } from 'react';

function ThemeInitializer() {
  useEffect(() => {
    applyTheme(CONFIG.DEFAULT_THEME as any, 'system');
  }, []);
  return null;
}

export function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <AuthProvider>
          <ToastProvider>
            <ThemeInitializer />
            <Routes>
              <Route path={ROUTES.INVITE} element={<InviteRedeem />} />
              <Route element={<Layout />}>
                <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.BODY} replace />} />
                <Route path={ROUTES.BODY} element={<BodyTracker />} />
                <Route path={ROUTES.EXPENSES} element={<ExpenseList />} />
                <Route path={ROUTES.EXPENSES_ADD} element={<AddExpense />} />
                <Route path={ROUTES.BABY} element={<FeedLog />} />
                <Route path={ROUTES.BABY_FEED} element={<FeedLog />} />
                <Route path={ROUTES.BABY_SLEEP} element={<SleepLog />} />
                <Route path={ROUTES.BABY_GROWTH} element={<GrowthLog />} />
                <Route path={ROUTES.BABY_DIAPER} element={<DiaperLog />} />
                <Route path={ROUTES.ADMIN} element={<AdminPanel />} />
              </Route>
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </HashRouter>
    </ErrorBoundary>
  );
}
```

- [x] **Step 2: Write InviteRedeem page**

Create `src/shared/auth/InviteRedeem.tsx`:

```typescript
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from './auth-context';
import { redeemInvite, isValidInviteCode } from './invite';
import { isOk } from '../types';

export function InviteRedeem() {
  const { code } = useParams<{ code: string }>();
  const { firebaseUser } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!code || !isValidInviteCode(code) || !firebaseUser) return;

    redeemInvite(code, firebaseUser.uid).then((result) => {
      if (isOk(result)) {
        setStatus('success');
        setMessage(`Welcome, ${result.data.name}!`);
        setTimeout(() => navigate('/'), 2000);
      } else {
        setStatus('error');
        setMessage(result.error);
      }
    });
  }, [code, firebaseUser, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <div className="bg-surface-card rounded-xl p-6 max-w-md shadow-lg border border-line text-center">
        {status === 'loading' && <p className="text-fg-muted">Accepting invite...</p>}
        {status === 'success' && <p className="text-success font-bold">{message}</p>}
        {status === 'error' && <p className="text-error">{message}</p>}
      </div>
    </div>
  );
}
```

- [x] **Step 3: Verify build**

```bash
bun run build
```

Expected: Build succeeds.

- [x] **Step 4: Commit**

```bash
git add src/App.tsx src/shared/auth/InviteRedeem.tsx
git commit -m "feat: wire up HashRouter with all module routes and invite flow"
```

---

## Task 15: CI/CD Pipeline

**Files:**
- Create: `.github/workflows/deploy.yml`

- [x] **Step 1: Write deploy workflow**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest
      - run: bun install --frozen-lockfile
      - run: bun run lint
      - run: bun run test
      - run: bun run build
        env:
          VITE_APP_VERSION: v0.1.0
      - uses: actions/upload-pages-artifact@v3
        if: github.ref == 'refs/heads/main' && github.event_name == 'push'
        with:
          path: dist

  deploy:
    needs: build-and-test
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [x] **Step 2: Commit**

```bash
git add .github/
git commit -m "feat: add CI/CD pipeline — lint, test, build, deploy to GitHub Pages"
```

---

## Task 16: CLAUDE.md

**Files:**
- Create: `CLAUDE.md`

- [x] **Step 1: Write CLAUDE.md**

Create `CLAUDE.md`:

```markdown
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Package manager:** bun (not npm/yarn)
- **Install:** `bun install`
- **Dev server:** `bun run dev`
- **Build:** `bun run build` (tsc + vite build)
- **Lint:** `bun run lint` (tsc --noEmit + eslint)
- **Run all tests:** `bun run test` (vitest)
- **Run a single test file:** `bunx vitest run src/modules/body/__tests__/scoring.test.ts`
- **E2E tests:** `bun run test:e2e` (playwright)
- **Preview production build:** `bun run preview`

## Architecture

Unified PWA combining body/fitness tracking, expense tracking, and baby tracking. React 19 + Vite 8 + TypeScript + Tailwind CSS v4. Firebase (Firestore + Anonymous Auth) for storage and sync.

### Module System

Three modules (body, expenses, baby), all disabled by default. Headminick (admin) enables per user via Firestore profile. Disabled = hidden — no routes, no nav items, no data fetching.

### Auth — Headminick Model

Invite-only access. Headminick creates invites with per-user module config. Users redeem via `/invite/{code}` link. Firestore rules enforce UID-based access + module-level permissions.

### Storage Abstraction

`StorageAdapter` interface in `src/shared/storage/adapter.ts`. Firebase implementation in `firebase-adapter.ts`. All operations return `Result<T>` (never void, never throws). Future Go API gateway slots in as a second adapter.

### Error Handling

No silent failures. Every write returns `Result<T>`. UI feedback via toast notifications. `ErrorBoundary` catches React render errors. Sync status indicator in header.

### Themes

7 themes (Family Blue default + 6 from Floor-Tracker). CSS custom properties per theme in `src/themes/*.css`. Semantic tokens mapped to Tailwind via `@theme` in `index.css`. `applyTheme()` toggles CSS classes on `<html>`.

### Key Conventions

- **Path alias:** `@/*` maps to project root
- **Hash routing:** React Router v7 with `HashRouter` (avoids GitHub Pages 404)
- **IDs:** `crypto.randomUUID()`
- **Dates:** `YYYY-MM-DD` strings
- **Timestamps:** ISO 8601
- **Tests:** vitest in `__tests__/` dirs within each module. Firebase mocked in tests.
- **Deployment:** GitHub Pages via GitHub Actions (lint → test → build → deploy)
```

- [x] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add CLAUDE.md for repository guidance"
```

---

## Task 17: Vitest Config & Test Harness

**Files:**
- Create: `vitest.config.ts`, `src/test-setup.ts`

- [x] **Step 1: Write vitest config**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['src/**/__tests__/**', 'src/main.tsx', 'src/test-setup.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
```

Create `src/test-setup.ts`:

```typescript
import '@testing-library/jest-dom/vitest';
```

- [x] **Step 2: Run all tests**

```bash
bun run test
```

Expected: All tests pass (Result type tests, scoring tests, validation tests, adapter tests, invite tests).

- [x] **Step 3: Run coverage**

```bash
bun run test:coverage
```

Expected: Coverage report generated. Data layer files should show 90%+.

- [x] **Step 4: Commit**

```bash
git add vitest.config.ts src/test-setup.ts
git commit -m "feat: add vitest config with coverage and jsdom environment"
```

---

## Task 18: Per-Directory READMEs

**Files:**
- Create: README.md in each directory that has source files

- [x] **Step 1: Write READMEs**

Create short (10-20 line) README.md files in:
- `src/` — App entry point, shell, CSS
- `src/shared/` — Storage adapter, auth, error handling, shared components and hooks
- `src/modules/` — Self-contained feature modules (body, expenses, baby)
- `src/modules/body/` — Floor tracking (Phase 1), extensible to steps/running
- `src/modules/expenses/` — Expense CRUD, categories, validation
- `src/modules/baby/` — Feed, sleep, growth, diaper sub-trackers
- `src/themes/` — CSS custom properties per theme, how to add a new theme
- `src/admin/` — Headminick admin panel, invite management
- `src/constants/` — App configuration, route definitions
- `e2e/` — Playwright E2E tests and visual regression screenshots

Each README states: what the directory does, key files, any non-obvious conventions.

- [x] **Step 2: Commit**

```bash
git add **/README.md
git commit -m "docs: add per-directory README.md files"
```

---

## Task 19: Audit Verification Checkpoint

- [x] **Step 1: Review and document resolved audit findings**

Create `docs/audit-verification.md` documenting:

**Resolved by new architecture (no action needed):**
- BabyTracker: No TLS (no Go API) ✅
- BabyTracker: Binds to 0.0.0.0 (no Go API) ✅
- BabyTracker: API error leaks (no Go API) ✅
- BabyTracker: Desktop silent errors (no desktop) ✅
- BabyTracker: PII plaintext logging (no server-side logging) ✅
- Finularity: BrowserRouter 404 (using HashRouter) ✅
- Finularity: saveToStorage void return (using Result types) ✅
- Finularity: Cascading silent failures (toast + Result types) ✅
- Finularity: process.env.KEY injection (removed) ✅
- Floor-Tracker: UUID-based path (using auth.uid) ✅

**Addressed in implementation:**
- Finularity: No ErrorBoundary → added ✅
- Finularity: No component tests → included in plan ✅
- Floor-Tracker: No lint in CI → lint step in deploy.yml ✅
- All: No structured error handling → Result types + toasts ✅

**Remaining for Phase 2+:**
- Floor-Tracker: Firebase chunk size (~979KB) → code splitting
- Floor-Tracker: Memory management for long-term data → IndexedDB pagination
- Finularity: Soft-deleted records never purged → purge job

- [x] **Step 2: Commit**

```bash
git add docs/audit-verification.md
git commit -m "docs: audit verification — confirm source app findings resolved or deferred"
```

---

## Task 20: Final Countdown Review

- [x] **Step 1: Run The Final Countdown skill**

After all tasks are complete, invoke `/the-final-countdown` for comprehensive parallel agent review covering:
- Code quality and architecture adherence to spec
- Test coverage gaps
- Security review of Firestore rules
- Type consistency across modules
- README accuracy

- [x] **Step 2: Fix any issues found**

Address review findings, commit fixes.

- [x] **Step 3: Tag release**

```bash
git tag v0.1.0
```

---

## Execution Notes

- **Firebase project creation** is a manual step before Task 5. Create the project at console.firebase.google.com, enable Anonymous Auth, create Firestore database, and update `firebase-config.ts` with real values.
- **PWA icons** need to be generated and placed in `public/`. Use a tool like realfavicongenerator.net or create them manually.
- **The base path** in `vite.config.ts` (`/aprilfoolsjoke/`) must match the GitHub repo name for GitHub Pages to work. Update if the repo name differs.
- **Headminick initialization** is a one-time manual step after first deploy. The first authenticated user runs `initializeHeadminick()` from the browser console to claim the admin role.

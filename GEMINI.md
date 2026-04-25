# GEMINI.md — Project Foundational Context & Mandates

This file serves as the primary source of truth for the AFP (April Fools' Project) architecture, standards, and evolution strategy. Instructions here take absolute precedence over general defaults.

---

## 1. Project Identity & Status
AFP is a unified personal PWA combining body tracking, budget management, and baby tracking into a single, modular experience.

*   **Current State**: Phase 2 (MVP) is 98% complete.
*   **Active Frontier**: Phase 3 (Evolution) — transforming logs into narrative, lifecycle-aware systems.
*   **Master Roadmap**: Defined in `docs/ROADMAP.md`.

---

## 2. Core Architecture & Standards

### 2.1 Technical Stack
*   **Frontend**: React 19, Vite 8, TypeScript (Strict), Tailwind CSS v4.
*   **Backend**: Firebase (Firestore, Auth).
*   **Storage Abstraction**: **Mandatory Pattern**. UI is decoupled from storage via the `StorageAdapter` interface. Use `createAdapter(path)` to automatically toggle between `FirebaseAdapter` (prod) and `localStorageAdapter` (dev/offline).
*   **Result Pattern**: Every asynchronous data operation MUST return a `Result<T>` (`ok()` or `err()`). Never return `void` or raw promises.

### 2.2 Module System
The app is split into discrete modules: `Body`, `Budget` (directory: `expenses/`), and `Baby`.
*   Access is gated by `ModuleGate`.
*   Modules are disabled by default; enabled per-user via Admin.

### 2.3 Role-Based Access Control (RBAC)
*   **TheAdminNick**: Global bypass; can read/write any path.
*   **User**: Read/Write scoped strictly to own `uid`.
*   **Viewer**: Read-only access to a target `uid` (`viewerOf`).

### 2.4 Theme Engine
A unified CSS custom property system supporting 10 themes with ambient effects. Inject styles into `:root`/`<html>` scope; avoid prop-drilling for styles.

---

## 3. Planning & Evolution Pipeline

Execution follows a strict **Spec-to-Plan** pipeline:
1.  **Vision Stub**: High-level goal in the roadmap.
2.  **Design Spec**: (`docs/specs/`) Formalizes data shape, UI, and technical approach.
3.  **Implementation Plan**: (`docs/plans/`) Atomic, sequenced tasks with code snippets and verification steps.
4.  **Execution**: Tracked in `docs/brainstorm/WORKPLAN.md`.

### Phase 3 Brainstorm Focus Areas:
*   **A. Baby → Kid**: Transition from infant logs to toddler milestones/stages.
*   **B. Budget → Investment**: Adding savings goals, recurring costs, and net-worth projections.
*   **C. Body → Yoga**: Duration-based activities and asana catalogs.
*   **D. Body → Gamification**: Streaks, badges, and public usernames.

---

## 4. Critical Constraints & Gotchas

1.  **No Data Migrations**: We do not migrate data from old standalone apps. We "archive in place" and build the new structure from scratch.
2.  **Strict Data Isolation**: Subcollections (e.g., `feeds/`) are strictly nested under `children/{id}`. Cross-entity queries are forbidden by security rules.
3.  **Scheduled Functions**: The project currently lacks CRON/Scheduled Functions. Features requiring them (recurring payments, smart alerts) must include infrastructure research in their design spec.
4.  **TheAdminNick Bypass**: Always test role-based features using a standard `User` account, as `TheAdminNick` will never trigger a permission failure.

---

## 6. Sub-Agent Delegation & Worktree Mandates

### 6.1 Worktree Isolation
When delegating to a sub-agent for complex tasks:
*   **Mandatory Worktree**: Always create a worktree at `.worktrees/{branch-name}` to isolate changes.
*   **Context Lockdown**: Sub-agents MUST verify they are working in the worktree path before executing file writes.
*   **Main Branch Protection**: Never perform multi-file "sweeps" directly on the `master` branch in the root directory.

### 6.2 Self-Verification Sweep
A sub-agent task is not complete until:
1.  **Zero Syntax Errors**: The agent has manually checked for common syntax traps (extra brackets, missing imports).
2.  **Linter Pass**: `bun run lint:eslint` (or equivalent) passes with zero errors.
3.  **Type Safety**: `bun run typecheck` (tsc) passes with zero errors.
4.  **React Purity**: Never use impure functions like `Math.random()` or `new Date()` directly in render/useMemo. Use seeded randoms or stable constants.

### 6.3 Cleanup Duty
Implementation plans are only complete when:
*   Legacy code/CSS is removed.
*   The UI matches the requested functionality (no placeholders).
*   The worktree is ready for a squash-merge.


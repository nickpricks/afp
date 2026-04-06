# AFP Phase 2 — Master Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign all AFP modules with first-time config flows, dashboards, multi-child baby support, expense to budget rename with income tracking, profile section, admin+viewer roles, and 3 new themes with ambient effects.

**Architecture:** Module-by-module redesign. Each phase (2a-2f) ships independently. Phase 2a establishes the config, dashboard, tabbed-page pattern reused by later phases. Clean Firestore database — no migration needed.

**Tech Stack:** React 19, TypeScript (strict), Vite 8, Tailwind CSS v4, Firebase (Firestore + Auth), Bun, Vitest, Playwright

**Design Spec:** `docs/specs/2026-04-06-phase2-design.md`

---

## Progress Table

Track completion per phase. Update checkboxes as tasks complete.

| Phase | Module | Enums | Types | Storage | Config UI | Data Hooks | UI Components | Tests | Firestore Rules | Negative Tests | Doc Sweep |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **0** | Foundation | [ ] | [ ] | [ ] | — | — | — | [ ] | [ ] | — | — |
| **2a** | Body | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| **2b** | Baby | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| **2c** | Budget | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| **2d** | Profile | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| **2e** | Admin+Viewer | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| **2f** | Themes | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |

---

## Build Order

Each phase ships independently. Execute in this order:

1. **[Pre-Phase 0: Shared Foundation](2026-04-06-phase2-00-foundation.md)** — enums, types, Firestore rules (all phases depend on this)
2. **[Phase 2a: Body Module](2026-04-06-phase2-2a-body.md)** — establishes config + dashboard pattern
3. **[Phase 2b: Baby Module](2026-04-06-phase2-2b-baby.md)** — multi-child, reuses 2a's patterns
4. **[Phase 2c: Budget Module](2026-04-06-phase2-2c-budget.md)** — expense to budget rename, income, payment methods
5. **[Phase 2d: Profile](2026-04-06-phase2-2d-profile.md)** — centralized settings, username
6. **[Phase 2e: Admin + Viewer](2026-04-06-phase2-2e-admin-viewer.md)** — roles, dashboard, admin pages
7. **[Phase 2f: Themes & Effects](2026-04-06-phase2-2f-themes.md)** — 3 new themes, ambient effects

---

## Per-Phase Task Pattern

Every phase follows this structure:

1. **Types & Enums** — define data structures
2. **Hooks & Storage** — data layer (read/write)
3. **Config UI** — first-time setup (if applicable)
4. **UI Components** — pages, tabs, forms
5. **Unit Tests** — cover business logic and rendering
6. **Firestore Rules Verification** — confirm rules work for this module
7. **Negative Tests** — unauthorized access, cross-user isolation, viewer restrictions
8. **Doc Sweep** — CLAUDE.md, CHANGELOG.md, README.md updates

---

## Final Sweep

After all phases complete:

- [ ] Run full test suite: `bun run test`
- [ ] Run type check: `bun run typecheck`
- [ ] Run linter: `bun run lint`
- [ ] Run E2E tests: `bun run test:e2e`
- [ ] Update CLAUDE.md comprehensively
- [ ] Update README.md (modules, commands, architecture)
- [ ] Update ROADMAP.md (move Phase 2 to done)
- [ ] Update design spec status to "Implemented"
- [ ] Mark all cells [x] in progress table above

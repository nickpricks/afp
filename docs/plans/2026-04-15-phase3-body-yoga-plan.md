# Phase 3 Body — Yoga Tab (Plan 10)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a Yoga tracking tab to the Body module — duration-based activity (vs. distance-based walk/run/cycle) with asana selection. First non-distance activity type, exercises the existing `BodyActivity.duration` field that's been in the type since Session 4 but unused.

**Plan position:** Plan 10. Last remaining Body module feature before Module C (gamification) can start. Independent of Baby module plans (1-9).

**Status:** Design decisions need refinement before implementation — see Open Questions below.

---

## Pre-Implementation Brainstorm Needed

Before writing this plan in full detail, confirm:

| Decision | Suggested default | Why confirm |
|---|---|---|
| **Scoring formula** | `duration_minutes × 0.5` (e.g., 60-min session = 30 points, matching a 3km walk) | Other activities score per km. Yoga is duration-based — need a new scoring line in `computeBodyScore()`. |
| **Asana list** | Hardcoded 20-30 common asanas (Downward Dog, Child's Pose, Warrior I/II/III, Tree, Cobra, Bridge, Pigeon, etc.) | Firestore collection would be overkill. Hardcoded `YOGA_ASANAS` array in constants. User picks from dropdown. |
| **One asana vs. session** | One "primary" asana per session + free-text notes for full flow | Simple data model, matches existing `BodyActivity` shape. Full sequence tracking is v2. |
| **Daily goal contribution** | Included in score ring like other activities | Consistency. Yoga score feeds same ring. |
| **Config form position** | After Cycling, before the "coming soon" label removal | Pattern: `BodyConfig.yoga` toggle already exists (currently disabled). Just enable it. |

---

## Already in Place (no work needed)

- `ActivityType.Yoga = 'yoga'` enum member exists in `shared/types.ts`
- `BodyConfig.yoga: boolean` field exists in `modules/body/types.ts`
- `BodyActivity.duration: number | null` field exists — already designed for yoga
- Config form has Yoga checkbox (currently `disabled` with "coming soon" label)

---

## File Map (estimated)

| File | Action | Purpose |
|---|---|---|
| `src/modules/body/components/YogaTab.tsx` | Create | Duration + asana form, activity list (like WalkingTab but minutes + dropdown) |
| `src/modules/body/constants.ts` (new) | Create | `YOGA_ASANAS` array with ~25 entries |
| `src/modules/body/components/BodyPage.tsx` | Modify | Add yoga tab to `buildTabs()`, render `YogaTab` |
| `src/modules/body/components/BodyConfigForm.tsx` | Modify | Remove `disabled` from Yoga checkbox, remove "coming soon" label |
| `src/modules/body/utils/compute-body-score.ts` (or wherever scoring lives) | Modify | Add `yogaMinutes × 0.5` to score formula |
| `src/modules/body/types.ts` | Modify | Add `asana: string \| null` to `BodyActivity` (optional field) |
| `src/modules/body/__tests__/YogaTab.test.tsx` | Create | Unit tests for form + list |
| `src/modules/body/__tests__/compute-body-score.test.ts` | Modify | Add yoga scoring case |
| `e2e/flows.spec.ts` | Modify | Add yoga flow test |

---

## Open Questions (resolve before implementation)

1. Should the asana list be Hindi+English (e.g., "Adho Mukha Svanasana (Downward Dog)") or English-only?
2. Is there any interest in tracking breathing exercises (pranayama) separately, or just asanas?
3. Should the UI surface a "quick-start" for users who do the same routine daily?

---

## Implementation Approach (once decisions locked)

Clone `WalkingTab.tsx` structure, swap distance-input for duration-input + asana-dropdown. Add scoring line to whichever function computes `BodyRecord.total` (check `modules/body/hooks/useBodyData.ts`). E2E test similar to existing Body floors+walk flow.

**Estimated effort:** 3-4 hours implementation + tests, assuming decisions are confirmed.

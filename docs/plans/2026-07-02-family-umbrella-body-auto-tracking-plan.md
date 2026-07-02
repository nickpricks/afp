# Family Umbrella — Pillar 4: Body Auto-Tracking (Plan 4 of 4)

**Date:** 2026-07-02
**Spec:** `docs/specs/2026-07-02-family-umbrella-design.md` § 6
**Branch:** `feat/the-original-script`
**Depends on:** — (independent of Plans 1–3)

## Context

Session-based sensor tracking in the PWA (spec D7/D8): explicit Start/Stop;
accelerometer step counting always; barometer floor detection only when the
sensor exists (budget Androids often have 1–2 sensors; Google Fit's stair
tracking is the benchmark to beat). Browsers can't background-track —
counting runs only while AFP is open and a session is live (accepted
constraint). **Task 1 is a DevBench sensor probe acting as a decision
gate** — if accelerometer step-counting proves unusable on the real device
fleet, fall back to export-import (spec § 9).

## Invariants (CLAUDE.md — non-negotiable)

- **Privacy**: raw sensor samples are in-memory only — never persisted,
  never leave the device. Only derived aggregates (steps→distance, floor
  count) are saved, through existing hooks, to the user's own Firestore.
  No third-party service, no OAuth, no tokens.
- **Dependency posture is Stabilize**: no sensor/pedometer npm libs —
  DeviceMotion + Generic Sensor API directly, feature-detected.
- **Decision A1**: pure math returns `Result<T>` where fallible; data
  hooks return `Promise<boolean>` and own their toasts.
- **Numeric enums append-only**; new `TrackingSource` is a string enum.
- `CONFIG.METERS_PER_KM` for distance conversion — never hardcode 1000.
- iOS: `DeviceMotionEvent.requestPermission()` only on session start,
  never on page load.

## File Structure

```
src/shared/components/DevBench.tsx / bench-generators.ts
                                          # sensor probe panel              (EDIT — probe UI in DevBench.tsx;
                                          #  any pure probe helpers in a new sensor-probe.ts, NOT in generators)
src/modules/body/step-math.ts             # pure step/floor detection       (NEW)
src/modules/body/__tests__/step-math.test.ts
src/modules/body/useSensorSession.ts      # session lifecycle hook          (NEW)
src/modules/body/__tests__/useSensorSession.test.ts
src/modules/body/TrackTab.tsx             # Start/Stop UI + live counters   (NEW)
src/modules/body/__tests__/TrackTab.test.tsx
src/modules/body/BodyPage.tsx             # tab wiring                      (COORDINATOR)
src/modules/body/BodyConfigForm.tsx       # strideCm input + track toggle   (COORDINATOR)
src/shared/types.ts                       # TrackingSource, BodyActivity.source,
                                          #   BodyConfig.{strideCm,tracking} (COORDINATOR)
src/shared/constants/messages.ts          # BodyMsg additions               (COORDINATOR)
```

## Tasks (TDD — test first per task)

1. **DevBench sensor probe (decision gate)** — panel showing live
   availability + readings: `DeviceMotionEvent` (accel magnitude stream),
   Generic Sensor API barometer/`Sensor` presence, permission states.
   Ship, test on the actual devices, THEN decide floors scope. Pure
   formatting helpers in a sibling `.ts` (react-refresh rule: no plain
   exports from component `.tsx`).
2. **`step-math.ts` (pure, fixture-driven TDD)** — `computeSteps(samples)`
   peak-detection over accel magnitude (band-pass + threshold + refractory
   window); `computeStrideDistance(steps, strideCm)` (→ meters, uses
   `CONFIG.METERS_PER_KM` at display); `computeFloorDelta(pressureSamples)`
   (hPa→altitude, hysteresis per ~3 m floor height). All `compute*`
   naming, `Result<T>` on invalid input, JSDoc'd, tested against recorded
   walk/idle/shake fixtures (fixtures collected via the probe).
3. **`useSensorSession()`** — lifecycle: request permission → subscribe →
   buffer in refs (stale-closure convention) → derive via step-math on an
   interval → `stop()` returns the session summary. Feature-detects
   barometer; exposes `{ supported: { steps, floors } }`. No storage
   writes inside the hook.
4. **`TrackTab`** — Start/Stop button, live step/floor counters, elapsed
   time, sensor-support badges, "screen must stay open" hint. On stop:
   confirm card → save via existing paths — steps→walk activity
   (`useBodyData`/activities hook, `Promise<boolean>` gating), floors→
   daily `body/{dateKey}` aggregate. Saved activity carries
   `source: TrackingSource.Sensor`.
5. **Types + config (coordinator, pre-staged)** — `TrackingSource` string
   enum (`Manual`, `Sensor`); `BodyActivity.source?` (absent = manual —
   backwards-compatible, no migration); `BodyConfig.strideCm?` +
   `tracking?` toggle; `BodyConfigForm` input (`min`/`step` attrs per
   validation convention); `ActivityLog` shows a small sensor badge when
   `source === Sensor`.
6. **Wiring (coordinator)** — Track tab in `BodyPage` gated by
   `config.tracking`; gear/config form toggle.
7. **Tests + E2E** — vitest: step-math fixtures (the bulk of coverage),
   hook with a mocked sensor stream, TrackTab render states. E2E: sensors
   unavailable in Playwright — assert graceful "not supported" state.
   Never bare `isVisible()` for waits; `expect(locator).toBeVisible({
   timeout })`; tab-button disambiguation via `page.locator('main button',
   { hasText: 'Track' }).first()`.
8. **Docs** — CHANGELOG; CLAUDE.md body-module bullet (coordinator).
   Scoring note: sensor-derived walks feed the existing
   `walk_km×10` term — no scoring formula change in this plan.

## Agent Warnings (recurring plan-doc bugs — read before implementing)

1. **No `JSX.Element` return type** — React 19; bare function returns.
2. **Data hooks return `Promise<boolean>`** and own their toasts
   (Decision A1) — gate cleanup on the boolean; never `await` a `Result`
   from them.
3. **`update(entry)`** takes the whole entry including `id` (optional
   `{ silent: true }`) — not `update(id, data)`.
4. **No hardcoded toast strings** — `BodyMsg` enum in
   `constants/messages.ts`.
5. **Match sibling-component Tailwind** — copy `FloorsTab`/`ActivityLog`
   idioms; no plain unstyled HTML.
6. **Per-child config lives in `AddChild.tsx`**, not admin `UsersTab`
   (N/A here, listed for completeness).
7. **Log component API is `{ childId, siblingIds, uid }`**, not
   `{ child: Child }` (baby-side; body components keep their own props).

**Additional gotchas for this plan:** no synchronous `setState` in
`useEffect` (sensor subscriptions → refs + interval-derived state);
delete+recompute race — filter deleted IDs from `activitiesRef.current`
before recomputing summaries; `Object.values()` on numeric enums needs the
`typeof v === 'number'` filter.

**Parallel-dispatch note:** `BodyPage.tsx`, `BodyConfigForm.tsx`,
`shared/types.ts`, `constants/messages.ts`, `App.tsx`, `CHANGELOG.md`,
`ROADMAP.md` are coordinator-owned — pre-stage type/enum additions, give
agents the HEAD hash + do-not-touch list. Reserved trial-ending branch
names are off-limits.

## Self-Review

- [ ] `bun run lint` + `bun run test` green
- [ ] Grep confirms no raw sensor samples in any storage write payload
- [ ] Feature-detection: all four support states render sanely
      (both / steps-only / floors-only / neither)
- [ ] Existing activities (no `source`) render unchanged
- [ ] No new runtime dependency added (`bun.lockb` diff clean)

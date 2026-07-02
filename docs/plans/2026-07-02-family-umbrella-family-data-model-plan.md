# Family Umbrella — Pillar 1: Family-Scoped Data Model (Plan 1 of 4)

**Date:** 2026-07-02
**Spec:** `docs/specs/2026-07-02-family-umbrella-design.md` § 3
**Branch:** `feat/the-original-script`
**Depends on:** — (foundational; Plans 2–3 build on this)

## Context

Add a lightweight family relationship: new root `families/{familyId}` collection with a members map, plus `UserProfile.familyId: string | null` (default `null`). No existing data moves. Family membership grants cross-member **read** on module data and **read + write** on `children/{childId}/**` (spec D1/D3). Admin-managed v1 — no self-serve family invites.

## Invariants (CLAUDE.md — non-negotiable)

- **Firebase import boundary**: only `src/shared/storage/` and `src/shared/auth/` may import `firebase/*`. Cross-member reads use N per-member `createAdapter(userPath(uid))` instances enumerated from the family doc — **no `collectionGroup`, no raw Firestore at call sites**. If a new capability is truly needed, extend the `StorageAdapter` interface; never bypass it.
- **Numeric enums are append-only** — new enums here (`FamilyRole`) are string enums; if any numeric enum must change, append at the end.
- **Decision A1**: pure utils return `Result<T>`; data hooks return `Promise<boolean>` and own their toasts.
- `StorageAdapter.onSnapshot` — always pass the optional `onError` callback in data hooks.
- Env vars: never `||` fallbacks.

## File Structure

```
src/shared/types.ts                       # Family, FamilyRole, UserProfile.familyId   (COORDINATOR)
src/shared/constants/db.ts                # DbCollection.Families, familyPath()        (COORDINATOR)
src/shared/constants/messages.ts          # FamilyMsg enum                             (COORDINATOR)
src/shared/hooks/useFamily.ts             # family doc listener + members resolution   (NEW)
src/shared/hooks/__tests__/useFamily.test.ts
src/modules/admin/FamiliesTab.tsx         # admin panel: create family, assign members (NEW)
src/modules/admin/__tests__/FamiliesTab.test.tsx
src/shared/hooks/useAdminActions.ts       # + linkUserToFamily / createFamily          (EDIT)
firestore.rules                           # families block, isFamilyMember, children write grant
```

## Tasks (TDD — test first per task)

1. **Types + constants (coordinator commit, pre-staged)** — `FamilyRole` string enum (`Owner = 'owner'`, `Adult = 'adult'`), `Family` interface (`id`, `name`, `createdBy`, `createdAt` ISO, `members: Record<string, FamilyRole>`), `UserProfile.familyId?: string | null`. `DbCollection. Families` appended; `familyPath(familyId)` helper beside `userPath`. `FamilyMsg` enum in `constants/messages.ts`. JSDoc one-liners on all.
2. **`useFamily(familyId)` hook** — `createAdapter(familyPath(familyId))` snapshot on the family doc, `onError` provided, exposes `{ family, memberUids, ready }`. Returns no write callbacks v1 (admin writes go through `useAdminActions`). Unit tests with the localStorage adapter.
3. **Admin actions** — `createFamily(name, memberUids)` and `linkUserToFamily(uid, familyId)` on `useAdminActions`; both `Promise<boolean>`, toasts from `FamilyMsg`/`AdminMsg`. Stamping `familyId` on profiles is admin-only (rules lock it like `role`).
4. **`FamiliesTab`** — new tab in the admin panel container (Invites | Users | Broadcasts | **Families**): list families with member chips, create-family form (name + member multi-pick from `useAllUsers()`), unlink action. Match `UsersTab` Tailwind idioms.
5. **Firestore rules** — `families/{familyId}`: member read, TheAdminNick write. `isFamilyMember(ownerUid)` helper (two `get()`s — documented cost). Family-member read grants on module collections; **write grant on `users/{ownerUid}/children/{childId}/**` only**. Profile rule: `familyId` immutable to owner. Manual rules-verification checklist in PR description (rules deploy is a known pending item).
6. **Dev bypass** — `DEV_PROFILE` in `auth-context.tsx` gets `familyId: null`; DevBench generator for a fake family optional.
7. **Docs** — CHANGELOG entry, CLAUDE.md architecture bullet (coordinator).

## Agent Warnings (recurring plan-doc bugs — read before implementing)

1. **No `JSX.Element` return type** — React 19 has no global `JSX` namespace; use bare function returns.
2. **`useBabyCollection.log/update/remove` return `Promise<boolean>`** (Decision A1) and handle their own toasts — gate state cleanup on the boolean; don't `await` a `Result`.
3. **`update(entry)`** takes the whole entry including `id` (optional `{ silent: true }` second arg suppresses the generic toast) — not `update(id, data)`.
4. **No hardcoded toast strings** — all user-facing strings via enums in `constants/messages.ts`.
5. **Match sibling-component Tailwind** — no plain unstyled HTML; copy idioms from the nearest sibling (here: `UsersTab`, `InvitesTab`).
6. **Per-child config lives in `AddChild.tsx`**, not admin `UsersTab`.
7. **Log component API is `{ childId, siblingIds, uid }`**, not `{ child: Child }`.

**Parallel-dispatch note:** shared files (`shared/types.ts`, `constants/db.ts`, `constants/messages.ts`, `App.tsx`, `CHANGELOG.md`, `ROADMAP.md`) are coordinator-owned — pre-stage task 1 in a coordinator commit, give agents the HEAD hash, and forbid them from editing those files (they list needed additions instead). Numeric-enum `Object.values()` trap: filter `typeof v === 'number'` (string enums exempt). Branch names: never use the reserved trial-ending queue.

## Self-Review

- [ ] `bun run lint` + `bun run test` green
- [ ] No `firebase/*` import outside `src/shared/storage|auth`
- [ ] `familyId: null` users see zero behavior change
- [ ] Rules checklist written (deploy verification pending, as elsewhere)

# Phase 2d: Profile Section

> **Master plan:** [Phase 2 Master](2026-04-06-phase2-master.md)
> **Design Spec:** [Phase 2 Design](../specs/2026-04-06-phase2-design.md)

---

### Task 2d.1: Profile Page Component

**Files:**
- Create: `src/shared/components/ProfilePage.tsx`

- [ ] **Step 1: Build ProfilePage with sections**

Account section: Google photo, name, email, username. Edit buttons for each.
Sign-In section: linked providers list, unlink button.
Preferences section: theme picker dropdown, color mode dropdown.
Module Config section: per-module summary + [Edit →] buttons.
About section: version, debug page link.

- [ ] **Step 2: Wire routing**

Add `/profile` route in `src/App.tsx` → `<ProfilePage />`.

- [ ] **Step 3: Commit**

```bash
git add src/shared/components/ProfilePage.tsx src/App.tsx
git commit -m "feat(profile): add profile page with account, preferences, module config"
```

### Task 2d.2: Username Claim/Release

**Files:**
- Create: `src/shared/auth/username.ts`

- [ ] **Step 1: Implement username claim/release**

```typescript
// src/shared/auth/username.ts
/** Claims a username for the current user. Uses Firestore transaction for uniqueness. */
export const claimUsername = async (username: string, uid: string): Promise<Result<void>> => { ... };

/** Releases the current user's username. */
export const releaseUsername = async (username: string, uid: string): Promise<Result<void>> => { ... };

/** Checks if a username is available. */
export const isUsernameAvailable = async (username: string): Promise<boolean> => { ... };
```

- [ ] **Step 2: Wire into ProfilePage**

Set Username button → inline form → validate availability → claim on save.

- [ ] **Step 3: Commit**

```bash
git add src/shared/auth/username.ts src/shared/components/ProfilePage.tsx
git commit -m "feat(profile): add username claim/release with uniqueness check"
```

### Task 2d.3: Profile Tests & Security

- [ ] **Step 1: Test username uniqueness**

Test that claiming an already-taken username fails.

- [ ] **Step 2: Negative tests**

- User cannot change their own role via profile update
- User cannot enable modules via profile update
- User cannot change viewerOf via profile update
- Viewer sees profile page with limited options (no module config)

- [ ] **Step 3: Doc sweep, commit**

```bash
git add src/shared/ CLAUDE.md CHANGELOG.md
git commit -m "docs: update for Phase 2d profile section"
```

---

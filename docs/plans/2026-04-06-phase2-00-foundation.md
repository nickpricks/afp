# Pre-Phase 0: Shared Foundation

> **Master plan:** [Phase 2 Master](2026-04-06-phase2-master.md)
> **Design Spec:** [Phase 2 Design](../specs/2026-04-06-phase2-design.md)

---

Before any phase, update shared enums and types that all phases depend on.

### Task 0.1: Update Shared Enums & Types

**Files:**
- Modify: `src/shared/types.ts`
- Modify: `src/constants/config.ts`
- Modify: `src/constants/db.ts`
- Modify: `src/constants/messages.ts`
- Modify: `src/constants/routes.ts`
- Test: `src/shared/__tests__/types.test.ts`

- [ ] **Step 1: Write failing test for new UserRole.Viewer**

```typescript
// src/shared/__tests__/types.test.ts — add test
it('UserRole includes Viewer', () => {
  expect(UserRole.Viewer).toBe('viewer');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bunx vitest run src/shared/__tests__/types.test.ts -v`
Expected: FAIL — `UserRole.Viewer` is undefined

- [ ] **Step 3: Add Viewer to UserRole enum**

```typescript
// src/shared/types.ts — update UserRole
export enum UserRole {
  TheAdminNick = 'theAdminNick',
  User = 'user',
  Viewer = 'viewer',
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bunx vitest run src/shared/__tests__/types.test.ts -v`
Expected: PASS

- [ ] **Step 5: Update ModuleId — rename Expenses to Budget**

```typescript
// src/shared/types.ts — update ModuleId
export enum ModuleId {
  Body = 'body',
  Budget = 'budget',
  Baby = 'baby',
}
```

Update `ALL_MODULES` and `DEFAULT_MODULES` to use `Budget` instead of `Expenses`. Fix all imports across the codebase that reference `ModuleId.Expenses` — change to `ModuleId.Budget`.

- [ ] **Step 6: Add new enums to types.ts**

Add `ActivityType`, `BudgetView`, `PaymentMethod`, `ExpenseCategory`, `IncomeSource`, `FeedType`, `SleepType`, `SleepQuality`, `DiaperType` — all exactly as defined in the design spec's Enums Reference section. Every numeric enum member gets a JSDoc comment.

- [ ] **Step 7: Add viewerOf to UserProfile type**

```typescript
// src/shared/types.ts — update UserProfile
export interface UserProfile {
  role: UserRole;
  name: string;
  email: string | null;
  username: string | null;
  viewerOf: string | null;
  theme: ThemeId;
  colorMode: ColorMode;
  modules: ModuleConfig;
  createdAt: string;
  updatedAt: string;
}
```

- [ ] **Step 8: Update DbSubcollection enum**

```typescript
// src/constants/db.ts — add new subcollections
export enum DbSubcollection {
  Profile = 'profile',
  Body = 'body',
  BodyActivities = 'body_activities',
  BodyConfig = 'body_config',
  BudgetConfig = 'budget_config',
  Expenses = 'expenses',
  Income = 'income',
  Children = 'children',
  Feeds = 'feeds',
  Sleep = 'sleep',
  Growth = 'growth',
  Diapers = 'diapers',
}
```

Remove old `BabyFeeds`, `BabySleep`, `BabyGrowth`, `BabyDiapers` entries.

- [ ] **Step 9: Update routes for new pages**

```typescript
// src/constants/routes.ts — add new paths
export enum AppPath {
  Home = '/',
  Dashboard = '/dashboard',
  Body = '/body',
  Budget = '/budget',
  BudgetAdd = '/budget/add',
  Baby = '/baby',
  BabyChild = '/baby/:childId',
  Profile = '/profile',
  Admin = '/admin',
  AdminInvites = '/admin/invites',
  AdminUsers = '/admin/users',
  Invite = '/invite/:code',
  Debug = '/debug',
}
```

- [ ] **Step 10: Update messages.ts with new message enums**

Add `BudgetMsg`, `BodyMsg`, `BabyMsg` enums for module-specific toast messages.

- [ ] **Step 11: Run full type check**

Run: `bun run typecheck`
Expected: Errors from components still referencing old types. Note them — they'll be fixed in each phase.

- [ ] **Step 12: Commit**

```bash
git add src/shared/types.ts src/constants/ src/shared/__tests__/types.test.ts
git commit -m "feat: update shared enums and types for Phase 2"
```

### Task 0.2: Update Firestore Rules (All Phases)

**Files:**
- Modify: `firestore.rules`

- [ ] **Step 1: Write complete updated rules**

Replace `firestore.rules` with rules that cover all Phase 2 collections:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    function isHeadminick() {
      return isAuthenticated()
        && exists(/databases/$(database)/documents/app/config)
        && get(/databases/$(database)/documents/app/config).data.headminickUid == request.auth.uid;
    }

    function getProfile(uid) {
      return get(/databases/$(database)/documents/users/$(uid)/profile/main).data;
    }

    function isViewer() {
      return isAuthenticated()
        && exists(/databases/$(database)/documents/users/$(request.auth.uid)/profile/main)
        && getProfile(request.auth.uid).role == 'viewer';
    }

    function isViewerOf(userId) {
      return isViewer() && getProfile(request.auth.uid).viewerOf == userId;
    }

    function hasModule(userId, moduleId) {
      return getProfile(userId).modules[moduleId] == true;
    }

    // App config
    match /app/{document=**} {
      allow read: if isAuthenticated();
      allow write: if isHeadminick();
    }

    // Invites
    match /invites/{inviteCode} {
      allow read: if isAuthenticated();
      allow create: if isHeadminick();
      allow update: if isHeadminick()
        || (isAuthenticated()
            && resource.data.linkedUid == null
            && request.resource.data.linkedUid == request.auth.uid
            && request.resource.data.code == resource.data.code
            && request.resource.data.name == resource.data.name
            && request.resource.data.role == resource.data.role
            && request.resource.data.viewerOf == resource.data.viewerOf
            && request.resource.data.modules == resource.data.modules
            && request.resource.data.createdBy == resource.data.createdBy
            && request.resource.data.createdAt == resource.data.createdAt);
      allow delete: if isHeadminick();
    }

    // User profiles
    match /users/{userId}/profile/{document=**} {
      allow read: if isOwner(userId) || isViewerOf(userId) || isHeadminick();
      allow create: if isOwner(userId)
        && request.resource.data.role != 'theAdminNick';
      allow update: if isHeadminick()
        || (isOwner(userId)
            && request.resource.data.role == resource.data.role
            && request.resource.data.modules == resource.data.modules
            && request.resource.data.viewerOf == resource.data.viewerOf);
      allow delete: if isHeadminick();
    }

    // Body config
    match /users/{userId}/body_config/{document=**} {
      allow read: if isOwner(userId) || isViewerOf(userId) || isHeadminick();
      allow write: if isOwner(userId) || isHeadminick();
    }

    // Body data
    match /users/{userId}/body/{docId} {
      allow read: if (isOwner(userId) && hasModule(userId, 'body'))
        || isViewerOf(userId) || isHeadminick();
      allow write: if (isOwner(userId) && hasModule(userId, 'body'))
        || isHeadminick();
    }

    // Body activities
    match /users/{userId}/body_activities/{docId} {
      allow read: if (isOwner(userId) && hasModule(userId, 'body'))
        || isViewerOf(userId) || isHeadminick();
      allow write: if (isOwner(userId) && hasModule(userId, 'body'))
        || isHeadminick();
    }

    // Budget config
    match /users/{userId}/budget_config/{document=**} {
      allow read: if isOwner(userId) || isViewerOf(userId) || isHeadminick();
      allow write: if isOwner(userId) || isHeadminick();
    }

    // Expenses
    match /users/{userId}/expenses/{docId} {
      allow read: if (isOwner(userId) && hasModule(userId, 'budget'))
        || isViewerOf(userId) || isHeadminick();
      allow write: if (isOwner(userId) && hasModule(userId, 'budget'))
        || isHeadminick();
    }

    // Income
    match /users/{userId}/income/{docId} {
      allow read: if (isOwner(userId) && hasModule(userId, 'budget'))
        || isViewerOf(userId) || isHeadminick();
      allow write: if (isOwner(userId) && hasModule(userId, 'budget'))
        || isHeadminick();
    }

    // Children (baby module parent docs)
    match /users/{userId}/children/{childId} {
      allow read: if (isOwner(userId) && hasModule(userId, 'baby'))
        || isViewerOf(userId) || isHeadminick();
      allow write: if (isOwner(userId) && hasModule(userId, 'baby'))
        || isHeadminick();

      // Child subcollections (feeds, sleep, growth, diapers)
      match /{sub}/{docId} {
        allow read: if (isOwner(userId) && hasModule(userId, 'baby'))
          || isViewerOf(userId) || isHeadminick();
        allow write: if (isOwner(userId) && hasModule(userId, 'baby'))
          || isHeadminick();
      }
    }

    // Usernames (global uniqueness)
    match /usernames/{username} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated()
        && request.resource.data.uid == request.auth.uid;
      allow delete: if isAuthenticated()
        && resource.data.uid == request.auth.uid;
    }
  }
}
```

- [ ] **Step 2: Commit rules**

```bash
git add firestore.rules
git commit -m "feat: update Firestore rules for Phase 2 (viewer role, children, budget, usernames)"
```

---

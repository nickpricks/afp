# Session 11 — Issues and naye aauaam Checklist

Updated: 2026-04-19

---

## Possible issues

| # | What | Where | Fix Status |
|---|------|-------|------------|
| 1 | Some errors on user dashboard either in the Admin or Module gate - getAllUserSnapshot - should run only for admin | User Dashboard | |
| 2 | If admin disables a user's modules, user can see permission console erroes | User Nav/Dashboard | |
| 3 | If admin diables his own module like say baby module, then he cant see not other users baby dashboard | |


---

## New ideas and old imporvements

| # | Idea/improvemt | Scope |
|---|----------------|-------|
| 1 | Anonymous user listing and requesting access | Lx |
| 2 | Configurable theme effect settings | UX |
| 3 | Delete Undo should get a visible timer | UX |
| 4 | Some new animation | UX |
| 5 | New logo, favicons and pwa images | UX |
| 6 | Revised benching mechanism | Fx |
| 8 | Additional bench for local (new pages) debug | Fx |
| 9 | Option to set random theme on each statup | UX |

---

## Earlier Cause 🔍 Investigations

- `useAllUsers` permission-denied | Missing Firestore collectionGroup index for `profile` collection. Rules are deployed and correct, but the query needs an explicit index.  Added `firestore.indexes.json` with collectionGroup config 
---

## Cuurent 🔍 Investigation: Permission & Logic Errors

### 1. Dashboard `useAllUsers` Leak
*   **Issue:** The `useAllUsers()` hook is called unconditionally in `Dashboard.tsx`.
*   **Findings:** 
    *   Line 29 of `src/shared/components/Dashboard.tsx` executes `const { users } = useAllUsers();` for all logged-in users.
    *   This hook initializes a `onSnapshot` listener on a collection group query (`profile`).
    *   **Impact:** Non-admin users trigger a listener that should only be active for `TheAdminNick`. While Firestore rules likely block the data, the console may show `permission-denied` errors or unnecessary network noise.
    *   **Recommendation:** Wrap `useAllUsers` in a conditional check or move it to a component/hook that only mounts if `isTheAdminNick` is true.

### 2. Console Errors on Module Disable
*   **Issue:** Admin disabling a module causes `permission-denied` errors in the user's console.
*   **Findings:**
    *   `Dashboard.tsx` and `Layout.tsx` mount data hooks (e.g., `useChildren`, `useExpenses`) regardless of whether the module is enabled in the user's profile.
    *   `ModuleGate` only prevents **routing**; it does not stop the underlying dashboard/layout components from attempting to listen to the data paths.
    *   **Impact:** If an admin disables a module, the user's active listeners to those subcollections will immediately fail with Firestore permission errors.
    *   **Recommendation:** Data hooks should accept an `enabled` flag or only be initialized if the `profile.modules[moduleId]` is true.

---

## 📂 Git Status Table (Session 11)

| Category | File Path | Status |
| :--- | :--- | :--- |
| **New** | GEMINI.md | Untracked |
| **New** | src/shared/hooks/useVerbose.ts | Untracked |
| **New** | src/shared/components/PaymentMethodBubble.tsx | Untracked |
| **New** | docs/session11-review.md | Untracked |
| **Modified** | irestore.rules | Modified |
| **Modified** | src/modules/expenses/components/AddExpense.tsx | Modified |
| **Modified** | src/modules/expenses/components/AddIncome.tsx | Modified |
| **Modified** | src/shared/components/DebugPage.tsx | Modified |
| **Modified** | src/shared/components/Layout.tsx | Modified |
| **Modified** | src/shared/components/ConsoleViewer.tsx | Modified |
| **Modified** | src/modules/expenses/__tests__/AddExpense.test.tsx | Modified |
| **Modified** | e2e/app.spec.ts | Modified |
| **Modified** | e2e/flows.spec.ts | Modified |
| **Modified** | src/constants/config.ts | Modified |
| **Modified** | src/constants/messages.ts | Modified |
| **Modified** | package.json | Modified |
| **Modified** | .github/workflows/deploy.yml | Modified |
| **Modified** | CHANGELOG.md | Modified |

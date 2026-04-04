# Getting Started with AFP

A quick guide to running, configuring, and deploying AFP.

---

## Dev Mode (no Firebase needed)

```bash
bun install
bun run dev
```

That's it. When Firebase isn't configured, the app runs in **dev bypass mode**:

- Auth: fake `dev-user` UID, TheAdminNick role
- Storage: localStorage (not Firestore)
- All modules enabled, all routes accessible
- No Google sign-in, no invites

Dev mode activates when `VITE_FIREBASE_API_KEY` is missing or set to `your-api-key`.

---

## Production Mode (Firebase)

### 1. Create Firebase Project

- Go to [Firebase Console](https://console.firebase.google.com)
- Create a new project (or use existing)
- Enable **Firestore Database** (production mode)
- Enable **Authentication** → **Anonymous** provider
- Enable **Authentication** → **Google** provider (set project name + support email)
- Add **authorized domain**: `nickpricks.github.io` (Authentication → Settings → Authorized domains)

### 2. Get Firebase Config

- Firebase Console → Project Settings → General → Web app → "Add app" (if not added)
- Copy the config values (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId)

### 3. Local Environment

```bash
bun run setup:env          # creates .env.development from .env.example
```

Edit `.env.development` with your Firebase config values. The app now connects to real Firebase.

### 4. Deploy Firestore Rules

Paste `firestore.rules` contents into Firebase Console → Firestore → Rules → Publish.

Or via CLI:
```bash
bunx firebase-tools deploy --only firestore:rules --project <your-project-id>
```

### 5. Bootstrap TheAdminNick

First visit the app — anonymous auth creates your UID. Find it on the debug page (`/debug` → Auth UID row) or Firebase Console → Authentication → Users.

Download a service account key:
- Firebase Console → Project Settings → Service Accounts → Generate new private key
- Save as `service-account.json` in project root (gitignored)

Run the bootstrap script:
```bash
bun run scripts/init-admin.ts <your-uid> "YourName"
```

This creates:
- `app/config` → `{ headminickUid: "<your-uid>" }`
- `users/<your-uid>/profile/main` → TheAdminNick profile with all modules enabled

### 6. Link Google Account

After bootstrapping, click **"Link Google"** in the app header. This makes your admin access permanent across browsers/devices. The button disappears once linked.

### 7. GitHub Pages Deployment

Add these 6 secrets to GitHub repo → Settings → Secrets → Actions:

| Secret | Value |
|--------|-------|
| `VITE_FIREBASE_API_KEY` | your apiKey |
| `VITE_FIREBASE_AUTH_DOMAIN` | your-project.firebaseapp.com |
| `VITE_FIREBASE_PROJECT_ID` | your-project-id |
| `VITE_FIREBASE_STORAGE_BUCKET` | your-project.firebasestorage.app |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | your sender ID |
| `VITE_FIREBASE_APP_ID` | your app ID |

Push to `master` — GitHub Actions builds and deploys to GitHub Pages automatically.

---

## How Auth Works

```
App loads
  → Anonymous auth (silent, automatic)
  → No profile? → "Invite only" wall + Google sign-in for returning users
  → Has profile? → App loads with enabled modules

Invite flow (new user):
  1. Admin creates invite in Admin panel → gets link
  2. New user opens link → anonymous auth → "Sign in with Google" prompt
  3. Google sign-in links to anonymous account (preserves UID)
  4. Invite redeemed → profile created → redirect to app

Admin flow (TheAdminNick):
  1. Bootstrap via init-admin.ts (one-time)
  2. Link Google account (one-time)
  3. Sign in with Google from any browser → same UID → admin access
```

---

## How Modules Work

Three modules: **Body**, **Expenses**, **Baby**. All disabled by default.

TheAdminNick enables modules per user when creating an invite. Firestore rules enforce module access — even if a user manipulates the UI, the server blocks reads/writes to disabled modules.

### Body Module

- **Floors**: tap up/down buttons. Daily aggregate stored at `users/{uid}/body/{YYYY-MM-DD}`
- **Walk/Run**: log distance (meters/km). Individual entries at `users/{uid}/body_activities/{id}`. Daily summary recomputed on each entry.
- **Scoring**: floors (1 pt up, 0.5 pt down) + walk (0.5 pt per 100m) + run (1 pt per 100m)
- **Steps**: approximated from distance using default stride lengths (walk: 0.75m, run: 1.0m)

### Expenses Module

- CRUD with categories/subcategories
- Currency: ₹ (INR)
- FAB (+) button on list page → add expense form

### Baby Module

- 4 subcollections: `baby_feeds`, `baby_sleep`, `baby_growth`, `baby_diapers`
- Each has its own listener with independent sync tracking
- Tab navigation between Feed / Sleep / Growth / Diaper

---

## Key URLs

| URL | What |
|-----|------|
| `/body` | Body tracker (default landing) |
| `/expenses` | Expense list |
| `/expenses/add` | Add expense form |
| `/baby` | Baby feed log |
| `/baby/sleep` | Baby sleep log |
| `/baby/growth` | Baby growth log |
| `/baby/diaper` | Baby diaper log |
| `/admin` | Admin panel (TheAdminNick only) |
| `/admin/invite` | Invite generator |
| `/invite/:code` | Invite redemption page |
| `/debug` | Diagnostic page (Firebase config, auth state) |

---

## Theme System

7 themes, default is Family Blue. Applied via CSS custom properties on `<html>`.

| Theme | Modes |
|-------|-------|
| Family Blue | Light + Dark |
| Summit Instrument | Light + Dark |
| Corporate Glass | Light + Dark |
| Night City: Elevator | Dark only |
| Night City: Apartment | Dark only |
| Deep: Mariana | Dark only |
| Industrial Furnace | Dark only |

Currently no in-app theme picker (P2 backlog). Default theme set in `CONFIG.DEFAULT_THEME`.

---

## Scripts

| Command | What |
|---------|------|
| `bun run dev` | Dev server (port 3000) |
| `bun run build` | TypeScript check + Vite build |
| `bun run lint` | tsc --noEmit + ESLint |
| `bun run test` | Vitest (60 tests) |
| `bun run test:coverage` | Vitest with v8 coverage |
| `bun run test:e2e` | Playwright (41 tests) |
| `bun run clean` | Remove dist, coverage, dev-dist |
| `bun run scripts/init-admin.ts <uid> [name]` | Bootstrap TheAdminNick (one-time) |

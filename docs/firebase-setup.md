# Firebase Setup — AFP

Quick guide to set up Firebase for AFP. ~10 minutes.

## 1. Create Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project**
3. Name: `it-started-on-april-fools-day`
4. Disable Google Analytics (optional — not needed)
5. Click **Create project**

## 2. Add Web App

1. In project dashboard, click **Add app** (+), then the **web icon** (`</>`)
2. Nickname: `afp`
3. Skip Firebase Hosting checkbox (we deploy to GitHub Pages)
4. Click **Register app**
5. Copy the config object — paste values into `.env.production` (see step 6)

## 3. Enable Auth

1. Left sidebar: **Build** > **Authentication** > **Get started**
2. **Sign-in method** tab: enable **Anonymous** and **Google**
3. For Google: set a project support email, then **Save**

## 4. Create Firestore Database

1. Left sidebar: **Build** > **Firestore Database**
2. Click **Create database**
3. Location: pick nearest (e.g., `asia-south1` for India)
4. Start in **production mode** (we deploy our own rules)
5. Click **Create**

## 5. Deploy Security Rules

Rules auto-deploy on push to master via `.github/workflows/firebase-rules.yml` (requires service account — see step 9).

To deploy manually:

```bash
firebase deploy --only firestore:rules
```

Or paste `firestore.rules` contents in the Firestore Console **Rules** tab.

## 6. Fill In .env Files

```bash
bun run setup:env        # .env.development only
bun run setup:env:all    # both .env.development and .env.production
```

Edit the generated file(s):

```
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_APP_VERSION=0.2.3
```

These files are gitignored. CI uses GitHub Secrets (see step 8).

## 7. Initialize TheAdminNick

The first user to claim admin gets TheAdminNick role. In dev mode (`isFirebaseConfigured = false`), you automatically get admin access with localStorage.

For production with real Firebase:

1. Run `bun run dev` with real Firebase config
2. Sign in with Google
3. The app shows the "Claim this app" screen for the first user
4. Click claim — your UID is written to `app/config` as admin

## 8. GitHub Secrets (CI)

Add these in repo **Settings** > **Secrets and variables** > **Actions**:

| Secret | Value |
|--------|-------|
| `VITE_FIREBASE_API_KEY` | From step 2 config |
| `VITE_FIREBASE_AUTH_DOMAIN` | From step 2 config |
| `VITE_FIREBASE_PROJECT_ID` | From step 2 config |
| `VITE_FIREBASE_STORAGE_BUCKET` | From step 2 config |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | From step 2 config |
| `VITE_FIREBASE_APP_ID` | From step 2 config |
| `FIREBASE_SERVICE_ACCOUNT` | GCP service account JSON key (see step 9) |

## 9. Service Account (for Firestore Rules CI)

The `firebase-rules.yml` workflow needs a GCP service account to deploy rules.

1. Go to [GCP Console](https://console.cloud.google.com) > **IAM & Admin** > **Service Accounts**
2. Select your Firebase project
3. Click **Create Service Account**
   - Name: `github-actions`
   - Role: **Cloud Datastore User** (minimum for rules deploy)
4. Click the new account > **Keys** tab > **Add Key** > **Create new key** > **JSON**
5. Download the JSON file
6. In GitHub repo: **Settings** > **Secrets** > **New secret**
   - Name: `FIREBASE_SERVICE_ACCOUNT`
   - Value: paste the entire JSON file contents
7. Delete the local JSON file (don't commit it)

## 10. Verify .firebaserc

`.firebaserc` must contain your actual Firebase project ID:

```json
{
  "projects": {
    "default": "your-project-id"
  }
}
```

Find your project ID in the Firebase Console URL: `console.firebase.google.com/project/<PROJECT_ID>/...`

## CI Workflows

| Workflow | Trigger | What |
|----------|---------|------|
| `deploy.yml` | Push/PR to master | lint + test + build + deploy to GitHub Pages |
| `firebase-rules.yml` | `firestore.rules` changes on master | Deploy Firestore security rules |

## Optional: Restrict API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Find the auto-created API key for your Firebase project
3. Under **Application restrictions**, set **HTTP referrers**
4. Add: `localhost:*` and your GitHub Pages URL (e.g., `nickpricks.github.io/*`)
5. Save

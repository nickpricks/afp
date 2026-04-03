# Firebase Setup — AFP

Quick guide to set up Firebase for AFP. ~10 minutes.

## 1. Create Project ✅

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project**
3. Name: `it-started-on-april-fools-day` (or whatever you like) - It Started On April Fools Day
4. Disable Google Analytics (not needed) - i kept it
5. Click **Create project**

## 2. Add Web App ✅

1. In project dashboard, Add app +, then click the **web icon** (`</>`)
2. Nickname: `afp` - why web - we only building for web - right
3. Skip Firebase Hosting checkbox - yes we dont need it - btw is it in free tier - lets explore -later
4. Click **Register app**
5. Copy the config object — paste values into `.env.production` (see step 6)

## 3. Enable Anonymous Auth ✅

0. Do we really need it ?
1. Left sidebar → **Build** → **Authentication**
2. Click **Get started**
3. Go to **Sign-in method** tab
4. Click **Anonymous**
5. Toggle **Enable** → **Save**

## 4. Create Firestore Database ✅

1. Left sidebar → **Build** → **Firestore Database**
2. Click **Create database**
3. Location: pick nearest (e.g., `asia-south1` for India)
4. Start in **production mode** (we have our own rules)
5. Click **Create**

## 5. Deploy Security Rules ✅

1. In Firestore dashboard, click **Rules** tab
2. Replace the default rules with contents of `firestore.rules` from the repo
3. Click **Publish**

## 6. Fill In .env Files 

```bash
bun run setup:env
```

Edit `.env.development` (and `.env.production` when ready):

```
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=afp-XXXXX.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=afp-XXXXX
VITE_FIREBASE_STORAGE_BUCKET=afp-XXXXX.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_APP_VERSION=0.1.0
```

## 7. Initialize Headminick

After first login (app auto-signs in anonymously), open browser console and run:

```js
// Get your UID
firebase.auth().currentUser.uid

// Then call initializeHeadminick from the console or a temp dev button
```

We'll add a proper first-run setup flow later. For now, the dev bypass (`isFirebaseConfigured = false`) gives you Headminick access automatically.

## 8. Verify

1. `bun run dev`
2. App should load with your profile
3. Check Firestore console — you should see `app/config` doc with your UID

## Optional: Restrict API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Find the auto-created API key for your Firebase project
3. Under **Application restrictions**, set **HTTP referrers**
4. Add: `localhost:*` and your GitHub Pages URL (e.g., `nickpricks.github.io/*`)
5. Save

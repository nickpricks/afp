/**
 * One-time bootstrap script to initialize TheAdminNick in Firestore.
 * Bypasses security rules via Firebase Admin SDK.
 *
 * Prerequisites:
 *   1. Download service account key from Firebase Console → Project Settings → Service Accounts
 *   2. Save as `service-account.json` in project root (gitignored)
 *
 * Usage:
 *   bun run scripts/init-headminick.ts <uid> [name]
 *
 * Example:
 *   bun run scripts/init-headminick.ts xkMUY12abc "Nick"
 */

import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const uid = process.argv[2];
const name = process.argv[3] ?? 'Nick';

if (!uid) {
  console.error('Usage: bun run scripts/init-headminick.ts <uid> [name]');
  process.exit(1);
}

// Load service account
const saPath = resolve(import.meta.dir, '..', 'service-account.json');
let serviceAccount: Record<string, string>;
try {
  serviceAccount = JSON.parse(readFileSync(saPath, 'utf-8'));
} catch {
  console.error(`❌ Could not read ${saPath}`);
  console.error('   Download from: Firebase Console → Project Settings → Service Accounts → Generate new private key');
  process.exit(1);
}

// Initialize Admin SDK
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// The two documents that bootstrap TheAdminNick
const configRef = db.doc('app/config');
const profileRef = db.doc(`users/${uid}/profile/main`);

// Safety check — don't overwrite if already initialized
const configSnap = await configRef.get();
if (configSnap.exists) {
  const existing = configSnap.data()?.headminickUid;
  console.error(`❌ app/config already exists — headminickUid is "${existing}"`);
  console.error('   Delete the doc in Firebase Console first if you want to re-initialize.');
  process.exit(1);
}

// Write both documents
await configRef.set({ headminickUid: uid });
await profileRef.set({
  name,
  role: 'theAdminNick',
  modules: { body: true, expenses: true, baby: true },
  theme: 'family-blue',
  colorMode: 'system',
  createdAt: new Date().toISOString(),
});

console.log(`✅ Headminick initialized!`);
console.log(`   UID:     ${uid}`);
console.log(`   Name:    ${name}`);
console.log(`   Profile: users/${uid}/profile/main`);
console.log(`   Config:  app/config → headminickUid: ${uid}`);
console.log('');
console.log('   Refresh the app — you should now see the Admin tab.');

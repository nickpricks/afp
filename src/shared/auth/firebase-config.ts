import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';

/** Whether Firebase is configured with real credentials */
export const isFirebaseConfigured =
  !!import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_API_KEY !== 'your-api-key';

const DEV_FIREBASE_CONFIG = {
  apiKey: 'demo-key',
  authDomain: 'demo.firebaseapp.com',
  projectId: 'demo-project',
  storageBucket: 'demo.firebasestorage.app',
  messagingSenderId: '000000000000',
  appId: '1:000:web:000',
};

const PROD_FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
};

const firebaseConfig = isFirebaseConfigured ? PROD_FIREBASE_CONFIG : DEV_FIREBASE_CONFIG;

/** Firebase app instance shared across the application */
export const app = initializeApp(firebaseConfig);

/** Firebase Auth instance for authentication operations */
export const auth = getAuth(app);

/** Firestore instance configured with persistent offline cache */
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

import { FirebaseError } from 'firebase/app';
import {
  GoogleAuthProvider,
  linkWithPopup,
  linkWithRedirect,
  signInWithCredential,
  signInWithPopup,
  signInWithRedirect,
} from 'firebase/auth';

import { auth } from '@/shared/auth/firebase-config';
import { err, ok, type Result } from '@/shared/types';
import { toErrorMessage } from '@/shared/utils/error';
import { vlog, vwarn, verr } from '@/shared/utils/verbose';

const googleProvider = new GoogleAuthProvider();

/** Extracts Firebase error code from an unknown error */
const getAuthErrorCode = (e: unknown): string | undefined =>
  (e as { code?: string }).code;

/**
 * Signs in with Google — links to existing anonymous account if possible,
 * otherwise falls back to a fresh Google sign-in.
 * Falls back to redirect flow when popups are blocked (mobile browsers).
 * Returns the resulting UID on success.
 */
export async function signInWithGoogle(): Promise<Result<string>> {
  try {
    const currentUser = auth.currentUser;
    vlog('[AFP:auth] signInWithGoogle start', { uid: currentUser?.uid, isAnonymous: currentUser?.isAnonymous });

    // If already signed in anonymously, link Google to preserve the UID
    if (currentUser?.isAnonymous) {
      try {
        vlog('[AFP:auth] Attempting linkWithPopup for anonymous user');
        const result = await linkWithPopup(currentUser, googleProvider);
        vlog('[AFP:auth] linkWithPopup success', { uid: result.user.uid });
        return ok(result.user.uid);
      } catch (linkError: unknown) {
        const code = getAuthErrorCode(linkError);
        vwarn('[AFP:auth] linkWithPopup failed', { code });

        // This Google account is already linked to another UID —
        // use the credential from the error (avoids opening a second popup)
        if (code === 'auth/credential-already-in-use') {
          const credential = GoogleAuthProvider.credentialFromError(linkError as FirebaseError);
          if (credential) {
            vlog('[AFP:auth] Using signInWithCredential from error credential');
            const result = await signInWithCredential(auth, credential);
            return ok(result.user.uid);
          }
          // Credential extraction failed — fall through to direct sign-in
          vlog('[AFP:auth] Credential extraction failed, falling back to signInWithPopup');
          const result = await signInWithPopup(auth, googleProvider);
          return ok(result.user.uid);
        }

        // This anonymous account already has Google linked
        if (code === 'auth/provider-already-linked') {
          vlog('[AFP:auth] Provider already linked, using signInWithPopup');
          const result = await signInWithPopup(auth, googleProvider);
          return ok(result.user.uid);
        }

        // Popup blocked — fall back to redirect (common on mobile)
        if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
          vlog('[AFP:auth] Popup blocked, falling back to redirect');
          await linkWithRedirect(currentUser, googleProvider);
          return ok('redirecting');
        }

        throw linkError;
      }
    }

    // No current user or not anonymous — direct Google sign-in
    vlog('[AFP:auth] Direct signInWithPopup (not anonymous)');
    const result = await signInWithPopup(auth, googleProvider);
    vlog('[AFP:auth] signInWithPopup success', { uid: result.user.uid });
    return ok(result.user.uid);
  } catch (e: unknown) {
    const code = getAuthErrorCode(e);
    verr('[AFP:auth] signInWithGoogle error', { code, message: toErrorMessage(e) });

    // User closed the popup or cancelled — not an error, just a no-op
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      return err('cancelled');
    }

    // Popup blocked — fall back to redirect (common on mobile)
    if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
      await signInWithRedirect(auth, googleProvider);
      return ok('redirecting');
    }

    // Actionable error messages for config issues
    if (code === 'auth/unauthorized-domain') {
      return err('This domain is not authorized. Add it in Firebase Console → Auth → Authorized domains.');
    }
    if (code === 'auth/invalid-api-key') {
      return err('Invalid Firebase API key. Check VITE_FIREBASE_API_KEY in GitHub Secrets.');
    }

    return err(`Google sign-in failed: ${toErrorMessage(e)}`);
  }
}

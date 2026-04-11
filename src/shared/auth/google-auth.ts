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

    // If already signed in anonymously, link Google to preserve the UID
    if (currentUser?.isAnonymous) {
      try {
        const result = await linkWithPopup(currentUser, googleProvider);
        return ok(result.user.uid);
      } catch (linkError: unknown) {
        const code = getAuthErrorCode(linkError);

        // This Google account is already linked to another UID —
        // use the credential from the error (avoids opening a second popup)
        if (code === 'auth/credential-already-in-use') {
          const credential = GoogleAuthProvider.credentialFromError(linkError as FirebaseError);
          if (credential) {
            const result = await signInWithCredential(auth, credential);
            return ok(result.user.uid);
          }
          // Credential extraction failed — fall through to direct sign-in
          const result = await signInWithPopup(auth, googleProvider);
          return ok(result.user.uid);
        }

        // This anonymous account already has Google linked
        if (code === 'auth/provider-already-linked') {
          const result = await signInWithPopup(auth, googleProvider);
          return ok(result.user.uid);
        }

        // Popup blocked — fall back to redirect (common on mobile)
        if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
          await linkWithRedirect(currentUser, googleProvider);
          return ok('redirecting');
        }

        throw linkError;
      }
    }

    // No current user or not anonymous — direct Google sign-in
    const result = await signInWithPopup(auth, googleProvider);
    return ok(result.user.uid);
  } catch (e: unknown) {
    const code = getAuthErrorCode(e);

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

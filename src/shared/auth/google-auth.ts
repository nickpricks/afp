import {
  GoogleAuthProvider,
  linkWithPopup,
  signInWithPopup,
} from 'firebase/auth';

import { auth } from '@/shared/auth/firebase-config';
import { err, ok, type Result } from '@/shared/types';
import { toErrorMessage } from '@/shared/utils/error';

const googleProvider = new GoogleAuthProvider();

/**
 * Signs in with Google — links to existing anonymous account if possible,
 * otherwise falls back to a fresh Google sign-in.
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
        // credential-already-in-use: this Google account is already linked to another UID
        // provider-already-linked: this anonymous account already has Google linked
        const code = (linkError as { code?: string }).code;
        if (code === 'auth/credential-already-in-use' || code === 'auth/provider-already-linked') {
          const result = await signInWithPopup(auth, googleProvider);
          return ok(result.user.uid);
        }
        throw linkError;
      }
    }

    // No current user or not anonymous — direct Google sign-in
    const result = await signInWithPopup(auth, googleProvider);
    return ok(result.user.uid);
  } catch (e: unknown) {
    const code = (e as { code?: string }).code;

    // User closed the popup or cancelled — not an error, just a no-op
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      return err('cancelled');
    }

    return err(`Google sign-in failed: ${toErrorMessage(e)}`);
  }
}

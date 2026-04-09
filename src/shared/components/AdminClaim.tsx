import { useState } from 'react';

import { useAuth } from '@/shared/auth/useAuth';
import { useToast } from '@/shared/errors/useToast';
import { initializeAdmin } from '@/shared/auth/the-admin-nick';
import { signInWithGoogle } from '@/shared/auth/google-auth';
import { isOk } from '@/shared/types';
import { CONFIG } from '@/constants/config';

/** First-run screen — lets the first authenticated user claim admin role */
export function AdminClaim() {
  const { firebaseUser } = useAuth();
  const { addToast } = useToast();
  const [claiming, setClaiming] = useState(false);
  const [needsGoogle, setNeedsGoogle] = useState(false);

  const isAnonymous = firebaseUser?.isAnonymous ?? true;

  /** Step 1: Sign in with Google if anonymous */
  const handleGoogleSignIn = async () => {
    setClaiming(true);
    const result = await signInWithGoogle();
    if (isOk(result)) {
      setNeedsGoogle(false);
    } else {
      addToast(result.error, 'error');
    }
    setClaiming(false);
  };

  /** Step 2: Claim admin role */
  const handleClaim = async () => {
    if (!firebaseUser) return;

    if (isAnonymous) {
      setNeedsGoogle(true);
      return;
    }

    setClaiming(true);
    const name = firebaseUser.displayName ?? 'Admin';
    const result = await initializeAdmin(firebaseUser.uid, name);
    if (isOk(result)) {
      addToast('Welcome, Admin! You now control this app.', 'success');
      // AuthProvider will pick up the new profile via onSnapshot
    } else {
      addToast(result.error, 'error');
    }
    setClaiming(false);
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6 px-4 py-12 text-center">
      <div className="text-5xl">🏠</div>

      <div>
        <h1 className="text-xl font-bold text-fg">{CONFIG.APP_NAME}</h1>
        <p className="text-sm text-fg-muted mt-2 max-w-xs">
          This app hasn't been set up yet. The first person to claim it becomes the admin.
        </p>
      </div>

      {
needsGoogle && (
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <p className="text-sm text-fg-muted">Sign in with Google first to secure your admin account.</p>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={claiming}
            className="rounded-lg bg-surface-card border border-line px-4 py-3 text-sm font-medium text-fg transition-colors hover:border-accent disabled:opacity-50"
          >
            {claiming ? 'Signing in...' : 'Sign in with Google'}
          </button>
        </div>
      )
}

      {
!needsGoogle && (
        <button
          type="button"
          onClick={handleClaim}
          disabled={claiming}
          className="rounded-lg bg-accent px-6 py-3 text-fg-on-accent font-medium active:scale-95 transition-transform disabled:opacity-50"
        >
          {claiming ? 'Setting up...' : 'Claim as Admin'}
        </button>
      )
}

      <p className="text-xs text-fg-muted max-w-xs">
        This grants full control — manage users, modules, and invites. Only do this if you own this deployment.
      </p>
    </div>
  );
}

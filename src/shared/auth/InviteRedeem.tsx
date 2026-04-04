import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { useAuth } from '@/shared/auth/useAuth';
import { isValidInviteCode, redeemInvite } from '@/shared/auth/invite';
import { isOk } from '@/shared/types';
import { GoogleSignInButton } from '@/shared/components/GoogleSignInButton';

type RedeemResult =
  | { status: 'pending' }
  | { status: 'success'; name: string }
  | { status: 'error'; message: string };

/** Page that redeems an invite code from the URL — requires Google sign-in first */
export function InviteRedeem() {
  const { code } = useParams<{ code: string }>();
  const { firebaseUser } = useAuth();
  const navigate = useNavigate();
  const [result, setResult] = useState<RedeemResult>({ status: 'pending' });
  const redeemAttempted = useRef(false);

  const codeValid = useMemo(() => !!code && isValidInviteCode(code), [code]);
  const needsGoogleSignIn = firebaseUser?.isAnonymous ?? true;
  const readyToRedeem = codeValid && !needsGoogleSignIn && !!firebaseUser;

  // Redeem the invite once signed in with Google — ref prevents double-execution
  useEffect(() => {
    if (!readyToRedeem || redeemAttempted.current || !code || !firebaseUser) {
      return;
    }

    redeemAttempted.current = true;
    let cancelled = false;

    async function redeem() {
      const res = await redeemInvite(code!, firebaseUser!.uid);

      if (cancelled) {
        return;
      }

      if (isOk(res)) {
        setResult({ status: 'success', name: res.data.name });
        setTimeout(() => {
          if (!cancelled) {
            navigate('/', { replace: true });
          }
        }, 2000);
      } else {
        setResult({ status: 'error', message: res.error });
      }
    }

    redeem();

    return () => {
      cancelled = true;
    };
  }, [readyToRedeem, code, firebaseUser, navigate]);

  if (!codeValid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface p-4">
        <div className="w-full max-w-sm rounded-xl bg-surface-card border border-line p-8 text-center shadow-lg">
          <h1 className="text-lg font-semibold text-fg mb-2">Invite Failed</h1>
          <p className="text-sm text-fg-muted">Invalid invite code format</p>
        </div>
      </div>
    );
  }

  if (needsGoogleSignIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface p-4">
        <div className="w-full max-w-sm rounded-xl bg-surface-card border border-line p-8 text-center shadow-lg">
          <h1 className="text-lg font-semibold text-fg mb-2">You're Invited!</h1>
          <p className="mb-4 text-sm text-fg-muted">Sign in with Google to claim your invite.</p>
          <GoogleSignInButton />
        </div>
      </div>
    );
  }

  if (result.status === 'pending') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <p className="text-fg-muted">Redeeming invite...</p>
      </div>
    );
  }

  if (result.status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface p-4">
        <div className="w-full max-w-sm rounded-xl bg-surface-card border border-line p-8 text-center shadow-lg">
          <h1 className="text-lg font-semibold text-fg mb-2">Invite Failed</h1>
          <p className="text-sm text-fg-muted">{result.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-4">
      <div className="w-full max-w-sm rounded-xl bg-surface-card border border-line p-8 text-center shadow-lg">
        <h1 className="text-lg font-semibold text-fg mb-2">Welcome, {result.name}!</h1>
        <p className="text-sm text-fg-muted">Invite redeemed. Redirecting...</p>
      </div>
    </div>
  );
}

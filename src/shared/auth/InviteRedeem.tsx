import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { useAuth } from '@/shared/auth/useAuth';
import { isValidInviteCode, redeemInvite } from '@/shared/auth/invite';
import { isOk } from '@/shared/types';

type RedeemState =
  | { status: 'loading' }
  | { status: 'success'; name: string }
  | { status: 'error'; message: string };

/** Page that redeems an invite code from the URL and redirects on success */
export function InviteRedeem() {
  const { code } = useParams<{ code: string }>();
  const { firebaseUser } = useAuth();
  const navigate = useNavigate();

  const initialState = useMemo<RedeemState>(() => {
    if (!code || !isValidInviteCode(code)) {
      return { status: 'error', message: 'Invalid invite code format' };
    }
    return { status: 'loading' };
  }, [code]);

  const [state, setState] = useState<RedeemState>(initialState);

  useEffect(() => {
    if (state.status === 'error' || !code || !firebaseUser) {
      return;
    }

    let cancelled = false;

    async function redeem() {
      const result = await redeemInvite(code!, firebaseUser!.uid);

      if (cancelled) {
        return;
      }

      if (isOk(result)) {
        setState({ status: 'success', name: result.data.name });
        setTimeout(() => {
          if (!cancelled) {
            navigate('/', { replace: true });
          }
        }, 2000);
      } else {
        setState({ status: 'error', message: result.error });
      }
    }

    redeem();

    return () => {
      cancelled = true;
    };
  }, [code, firebaseUser, navigate, state.status]);

  if (state.status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <p className="text-fg-muted">Redeeming invite...</p>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface p-4">
        <div className="w-full max-w-sm rounded-xl bg-surface-card border border-line p-8 text-center shadow-lg">
          <h1 className="text-lg font-semibold text-fg mb-2">Invite Failed</h1>
          <p className="text-sm text-fg-muted">{state.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-4">
      <div className="w-full max-w-sm rounded-xl bg-surface-card border border-line p-8 text-center shadow-lg">
        <h1 className="text-lg font-semibold text-fg mb-2">Welcome, {state.name}!</h1>
        <p className="text-sm text-fg-muted">Invite redeemed. Redirecting...</p>
      </div>
    </div>
  );
}

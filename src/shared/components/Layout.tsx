import { Link, Outlet, useNavigate } from 'react-router-dom';

import { SyncStatusIndicator } from '@/shared/components/SyncStatus';
import { TabBar } from '@/shared/components/TabBar';
import { UpdatePrompt } from '@/shared/components/UpdatePrompt';
import { GoogleSignInButton } from '@/shared/components/GoogleSignInButton';
import { useAuth } from '@/shared/auth/useAuth';
import { isFirebaseConfigured } from '@/shared/auth/firebase-config';
import { ROUTES } from '@/constants/routes';
import { LoadingScreen } from '@/shared/components/loading/LoadingScreen';
import { useMinDelay } from '@/shared/hooks/useMinDelay';
import { ConsoleOverlay } from '@/shared/components/ConsoleViewer';
import { useConsoleCapture } from '@/shared/hooks/useConsoleCapture';

/** Root app shell with header, routed content area, tab bar, and PWA update prompt */
export function Layout() {
  const navigate = useNavigate();
  const { isLoading, profile, firebaseUser } = useAuth();
  const isAnonymous = firebaseUser?.isAnonymous ?? true;
  const minDelayActive = useMinDelay(isFirebaseConfigured ? 1000 : 0);
  const { entries, clear } = useConsoleCapture();

  if (isLoading || minDelayActive) {
    return <LoadingScreen />;
  }

  if (!profile) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface">
        <div className="rounded-lg bg-surface-card border border-line p-6 text-center shadow-md max-w-sm">
          <h2 className="text-lg font-semibold text-fg">Welcome to AFP</h2>
          <p className="mt-2 text-sm text-fg-muted">This app is invite-only. Ask the admin for an invite link to get started.</p>
          <div className="mt-4 border-t border-line pt-4">
            <p className="mb-2 text-xs text-fg-muted">Already have an account?</p>
            <GoogleSignInButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface text-fg">
      <div className="fx-ambient" aria-hidden="true" />
      <header className="flex items-center justify-between px-4 py-3 bg-surface-card border-b border-line">
        <Link to="/" className="flex items-center">
          <img src={`${import.meta.env.BASE_URL}favicon.png`} alt="AFP" className="h-6 w-6" />
        </Link>
        <div className="flex items-center gap-3">
          {isAnonymous && <GoogleSignInButton compact />}
          {
            !isAnonymous && firebaseUser?.photoURL && (
              <button type="button" onClick={() => navigate(ROUTES.PROFILE)} className="rounded-full">
                <img
                  src={firebaseUser.photoURL}
                  alt="Profile"
                  referrerPolicy="no-referrer"
                  className="h-7 w-7 rounded-full border border-line"
                />
              </button>
            )
          }
          {
            !isAnonymous && !firebaseUser?.photoURL && (
              <button
                type="button"
                onClick={() => navigate(ROUTES.PROFILE)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-fg-on-accent text-xs font-bold"
              >
                {profile?.name?.[0]?.toUpperCase() ?? 'U'}
              </button>
            )
          }
          {
            isAnonymous && (
              <button
                type="button"
                onClick={() => navigate(ROUTES.PROFILE)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-surface border border-line text-fg-muted text-xs font-bold"
              >
                D
              </button>
            )
          }
          <SyncStatusIndicator />
        </div>
      </header>

      <main className="p-4 pb-20">
        <Outlet />
      </main>

      <TabBar />
      <UpdatePrompt />
      <ConsoleOverlay entries={entries} clear={clear} />
    </div>
  );
}

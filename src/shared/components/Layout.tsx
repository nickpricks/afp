import { Outlet } from 'react-router-dom';

import { SyncStatusIndicator } from '@/shared/components/SyncStatus';
import { TabBar } from '@/shared/components/TabBar';
import { UpdatePrompt } from '@/shared/components/UpdatePrompt';
import { GoogleSignInButton } from '@/shared/components/GoogleSignInButton';
import { useAuth } from '@/shared/auth/useAuth';

/** Root app shell with header, routed content area, tab bar, and PWA update prompt */
export function Layout() {
  const { isLoading, profile, firebaseUser } = useAuth();
  const isAnonymous = firebaseUser?.isAnonymous ?? true;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface">
        <p className="text-fg-muted">Loading...</p>
      </div>
    );
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
      <header className="flex items-center justify-between px-4 py-3 bg-surface-card border-b border-line">
        <h1 className="text-base font-semibold">AFP</h1>
        <div className="flex items-center gap-3">
          {isAnonymous && <GoogleSignInButton compact />}
          {
            !isAnonymous && firebaseUser?.photoURL && (
              <img
                src={firebaseUser.photoURL}
                alt=""
                referrerPolicy="no-referrer"
                className="h-7 w-7 rounded-full border border-line"
              />
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
    </div>
  );
}

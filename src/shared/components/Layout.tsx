import { Link, Outlet, useNavigate } from 'react-router-dom';

import { SyncStatusIndicator } from '@/shared/components/SyncStatus';
import { TabBar } from '@/shared/components/TabBar';
import { UpdatePrompt } from '@/shared/components/UpdatePrompt';
import { GoogleSignInButton } from '@/shared/components/GoogleSignInButton';
import { AlertBanner } from '@/shared/components/AlertBanner';
import { useAuth } from '@/shared/auth/useAuth';
import { useNotifications } from '@/shared/hooks/useNotifications';
import { BabySuggestionsToast } from '@/modules/baby/components/BabySuggestionsToast';
import { isFirebaseConfigured } from '@/shared/auth/firebase-config';
import { ROUTES } from '@/constants/routes';
import { ModuleId } from '@/shared/types';
import { LoadingScreen } from '@/shared/components/loading/LoadingScreen';
import { useMinDelay } from '@/shared/hooks/useMinDelay';
import { ConsoleOverlay } from '@/shared/components/ConsoleViewer';
import { useConsoleCapture } from '@/shared/hooks/useConsoleCapture';
import { useVerbose } from '@/shared/hooks/useVerbose';
import { AmbientEffects } from '@/shared/components/AmbientEffects';
import { ThemeId } from '@/themes/themes';

/** Root app shell with header, routed content area, tab bar, and PWA update prompt */
export function Layout() {
  const navigate = useNavigate();
  const { isLoading, profile, firebaseUser, isTheAdminNick } = useAuth();
  const isAnonymous = firebaseUser?.isAnonymous ?? true;
  const minDelayActive = useMinDelay(isFirebaseConfigured ? 1000 : 0);
  const { entries, clear } = useConsoleCapture();
  const { verbose } = useVerbose();
  const { activeAlerts, unreadCount, dismiss } = useNotifications();

  if (isLoading || minDelayActive) {
    return <LoadingScreen />;
  }

  if (!profile) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface">
        <div className="rounded-lg bg-surface-card border border-line p-6 text-center shadow-md max-w-sm">
          <h2 className="text-lg font-semibold text-fg">Welcome to AFP</h2>
          <p className="mt-2 text-sm text-fg-muted">
            This app is invite-only. Ask the admin for an invite link to get started.
          </p>
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
      <AmbientEffects
        key={profile.theme}
        themeId={profile.theme as ThemeId}
        intensity={profile.effectIntensity}
      />
      <AlertBanner alerts={activeAlerts} onDismiss={dismiss} />
      {profile.modules?.[ModuleId.Baby] && <BabySuggestionsToast />}
      <header className="flex items-center justify-between px-4 py-3 bg-surface-card border-b border-line">
        <Link to="/" className="flex items-center">
          <img src={`${import.meta.env.BASE_URL}favicon.png`} alt="AFP" className="h-6 w-6" />
        </Link>
        <div className="flex items-center gap-3">
          {isAnonymous && <GoogleSignInButton compact />}
          {!isAnonymous && firebaseUser?.photoURL && (
            <span className="relative">
              <button
                type="button"
                onClick={() => navigate(ROUTES.PROFILE)}
                className="rounded-full"
              >
                <img
                  src={firebaseUser.photoURL}
                  alt="Profile"
                  referrerPolicy="no-referrer"
                  className="h-7 w-7 rounded-full border border-line"
                />
              </button>
              {isTheAdminNick && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </span>
          )}
          {!isAnonymous && !firebaseUser?.photoURL && (
            <span className="relative">
              <button
                type="button"
                onClick={() => navigate(ROUTES.PROFILE)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-fg-on-accent text-xs font-bold"
              >
                {profile?.name?.[0]?.toUpperCase() ?? 'U'}
              </button>
              {isTheAdminNick && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </span>
          )}
          {isAnonymous && (
            <span className="relative">
              <button
                type="button"
                onClick={() => navigate(ROUTES.PROFILE)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-surface border border-line text-fg-muted text-xs font-bold"
              >
                D
              </button>
              {isTheAdminNick && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </span>
          )}
          <SyncStatusIndicator />
        </div>
      </header>

      <main className="p-4 pb-20">
        <Outlet />
      </main>

      <TabBar />
      <UpdatePrompt />

      {verbose && <ConsoleOverlay entries={entries} clear={clear} />}
    </div>
  );
}

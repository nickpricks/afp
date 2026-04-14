import { useCallback, useRef, useState } from 'react';
import changelogRaw from '../../../CHANGELOG.md?raw';
import { Link } from 'react-router-dom';
import { signOut } from 'firebase/auth';

import { useAuth } from '@/shared/auth/useAuth';
import { useToast } from '@/shared/errors/useToast';
import { auth, isFirebaseConfigured } from '@/shared/auth/firebase-config';
import {
  claimUsername,
  isUsernameAvailable,
  isValidUsername,
  releaseUsername,
} from '@/shared/auth/username';
import {
  applyTheme,
  THEME_DEFINITIONS,
  useActiveThemeId,
  type ColorMode,
  type ThemeId,
} from '@/themes/themes';
import { ModuleId, ToastType, isErr, ALL_MODULES } from '@/shared/types';
import { useModuleRequest } from '@/shared/hooks/useModuleRequest';
import { CONFIG } from '@/constants/config';
import { AppPath } from '@/constants/routes';
import { ProfileMsg, ValidationMsg } from '@/constants/messages';
import { createAdapter } from '@/shared/storage/create-adapter';
import { DbSubcollection, DbDoc } from '@/constants/db';

const THEME_LIST = Object.values(THEME_DEFINITIONS);
const COLOR_MODES: { value: ColorMode; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

const MODULE_LABELS: Record<ModuleId, string> = {
  [ModuleId.Body]: 'Body & Fitness',
  [ModuleId.Budget]: 'Budget',
  [ModuleId.Baby]: 'Baby Tracker',
};

/** Saves profile appearance fields to the storage adapter */
const saveAppearance = async (
  uid: string,
  theme: string,
  colorMode: ColorMode,
): Promise<void> => {
  const adapter = createAdapter(`users/${uid}`);
  await adapter.save(DbSubcollection.Profile, {
    id: DbDoc.Main,
    theme,
    colorMode,
    updatedAt: new Date().toISOString(),
  });
};

/** Saves username to the user profile */
const saveUsernameToProfile = async (
  uid: string,
  username: string | undefined,
): Promise<void> => {
  const adapter = createAdapter(`users/${uid}`);
  await adapter.save(DbSubcollection.Profile, {
    id: DbDoc.Main,
    username: username ?? null,
    updatedAt: new Date().toISOString(),
  });
};

/** Profile page for account info, appearance, module status, and about */
export function ProfilePage() {
  const { firebaseUser, profile, isTheAdminNick, adminUid } = useAuth();
  const { requestModule } = useModuleRequest(adminUid);
  const { addToast } = useToast();
  const activeThemeId = useActiveThemeId();

  const [colorMode, setColorMode] = useState<ColorMode>(
    profile?.colorMode ?? 'system',
  );

  // Username state
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const savingRef = useRef(false);

  const uid = firebaseUser?.uid ?? '';
  const isAnonymous = firebaseUser?.isAnonymous ?? true;
  const displayName =
    firebaseUser?.displayName ?? profile?.name ?? 'Anonymous';
  const email = firebaseUser?.email ?? profile?.email ?? null;
  const photoURL = firebaseUser?.photoURL ?? null;

  const handleThemeChange = useCallback(
    (themeId: ThemeId) => {
      applyTheme(themeId, colorMode);
      if (uid) {
        saveAppearance(uid, themeId, colorMode).catch(() => {
          addToast(ProfileMsg.ThemeSaveFailed, ToastType.Error);
        });
      }
      addToast(ProfileMsg.ThemeSaved, ToastType.Success);
    },
    [colorMode, uid, addToast],
  );

  const handleColorModeChange = useCallback(
    (mode: ColorMode) => {
      setColorMode(mode);
      applyTheme(activeThemeId, mode);
      if (uid) {
        saveAppearance(uid, activeThemeId, mode).catch(() => {
          addToast(ProfileMsg.ColorModeSaveFailed, ToastType.Error);
        });
      }
      addToast(ProfileMsg.ThemeSaved, ToastType.Success);
    },
    [activeThemeId, uid, addToast],
  );

  const handleUsernameSave = useCallback(async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    setIsSavingUsername(true);
    setUsernameError(null);

    const trimmed = usernameInput.trim();

    if (!isValidUsername(trimmed)) {
      setUsernameError(ValidationMsg.UsernameInvalid);
      setIsSavingUsername(false);
      savingRef.current = false;
      return;
    }

    const available = await isUsernameAvailable(trimmed);
    if (!available) {
      setUsernameError(ProfileMsg.UsernameTaken);
      setIsSavingUsername(false);
      savingRef.current = false;
      return;
    }

    // Release old username if set
    if (profile?.username) {
      const releaseResult = await releaseUsername(profile.username, uid);
      if (isErr(releaseResult)) {
        setUsernameError('Failed to release username');
        setIsSavingUsername(false);
        savingRef.current = false;
        return;
      }
    }

    const claimResult = await claimUsername(trimmed, uid);
    if (isErr(claimResult)) {
      setUsernameError('Failed to claim username');
      setIsSavingUsername(false);
      savingRef.current = false;
      return;
    }

    await saveUsernameToProfile(uid, trimmed);
    addToast(ProfileMsg.UsernameClaimed, ToastType.Success);
    setIsEditingUsername(false);
    setUsernameInput('');
    setIsSavingUsername(false);
    savingRef.current = false;
  }, [usernameInput, uid, profile, addToast]);

  const handleUsernameRelease = useCallback(async () => {
    if (!profile?.username || savingRef.current) return;
    savingRef.current = true;
    setIsSavingUsername(true);

    const result = await releaseUsername(profile.username, uid);
    if (isErr(result)) {
      addToast(ProfileMsg.UsernameReleaseFailed, ToastType.Error);
    } else {
      await saveUsernameToProfile(uid, undefined);
      addToast(ProfileMsg.UsernameReleased, ToastType.Success);
    }

    setIsSavingUsername(false);
    savingRef.current = false;
  }, [profile, uid, addToast]);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut(auth);
      addToast(ProfileMsg.SignedOut, ToastType.Success);
    } catch {
      addToast(ProfileMsg.SignOutFailed, ToastType.Error);
    }
  }, [addToast]);


  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-xl font-bold text-fg">Profile</h1>

      {/* Account Section */}
      <section className="rounded-lg border border-line bg-surface-card p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-fg-muted">
          Account
        </h2>
        <div className="flex items-center gap-4">
          {
photoURL && (
            <img
              src={photoURL}
              alt=""
              referrerPolicy="no-referrer"
              className="h-14 w-14 rounded-full border border-line"
            />
          )
}
          {
!photoURL && (
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-line bg-accent text-fg-on-accent text-lg font-bold">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )
}
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold text-fg">
              {displayName}
            </p>
            {
email && (
              <p className="truncate text-sm text-fg-muted">{email}</p>
            )
}
            {
isAnonymous && (
              <span className="inline-block mt-1 rounded bg-accent/20 px-2 py-0.5 text-xs font-medium text-accent">
                Anonymous
              </span>
            )
}
            {
isTheAdminNick && (
              <span className="inline-block mt-1 ml-1 rounded bg-accent px-2 py-0.5 text-xs font-medium text-fg-on-accent">
                Admin
              </span>
            )
}
          </div>
        </div>

        {/* Username */}
        <div className="mt-4 border-t border-line pt-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-fg-muted">Username</span>
            {
!isEditingUsername && !profile?.username && (
              <button
                onClick={
() => {
                  setIsEditingUsername(true);
                }
}
                className="text-sm font-medium text-accent hover:underline"
              >
                Set Username
              </button>
            )
}
          </div>
          {
profile?.username && !isEditingUsername && (
            <div className="mt-1 flex items-center gap-2">
              <p className="text-sm font-medium text-fg">
                @{profile.username}
              </p>
              <button
                onClick={
() => {
                  setUsernameInput(profile.username ?? '');
                  setIsEditingUsername(true);
                }
}
                className="text-xs text-accent hover:underline"
              >
                Change
              </button>
              <button
                onClick={handleUsernameRelease}
                disabled={isSavingUsername}
                className="text-xs text-red-500 hover:underline disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          )
}
          {
isEditingUsername && (
            <div className="mt-2 space-y-2">
              <input
                type="text"
                value={usernameInput}
                onChange={
(e) => {
                  setUsernameInput(e.target.value);
                  setUsernameError(null);
                }
}
                placeholder="your_username"
                maxLength={20}
                className="w-full rounded border border-line bg-surface px-3 py-1.5 text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
              />
              {
usernameError && (
                <p className="text-xs text-red-500">{usernameError}</p>
              )
}
              <div className="flex gap-2">
                <button
                  onClick={handleUsernameSave}
                  disabled={isSavingUsername || usernameInput.trim().length === 0}
                  className="rounded bg-accent px-3 py-1 text-sm font-medium text-fg-on-accent disabled:opacity-50"
                >
                  {isSavingUsername ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={
() => {
                    setIsEditingUsername(false);
                    setUsernameError(null);
                    setUsernameInput('');
                  }
}
                  className="rounded border border-line px-3 py-1 text-sm text-fg-muted"
                >
                  Cancel
                </button>
              </div>
            </div>
          )
}
        </div>
      </section>

      {/* Appearance Section */}
      <AppearanceSection
        activeThemeId={activeThemeId}
        colorMode={colorMode}
        onThemeChange={handleThemeChange}
        onColorModeChange={handleColorModeChange}
      />

      {/* Module Status Section */}
      <section className="rounded-lg border border-line bg-surface-card p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-fg-muted">
          Modules
        </h2>
        <ul className="space-y-2">
          {ALL_MODULES.map((id) => {
            const enabled = profile?.modules[id] ?? false;
            const requested = profile?.requestedModules?.includes(id) ?? false;
            return (
              <li key={id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className={`inline-block h-2 w-2 rounded-full ${enabled ? 'bg-accent' : 'bg-fg-muted/30'}`} />
                  <span className={enabled ? 'text-fg' : 'text-fg-muted'}>
                    {MODULE_LABELS[id]}
                  </span>
                </div>
                {!enabled && !requested && !isTheAdminNick && (
                  <button
                    type="button"
                    onClick={() => requestModule(id)}
                    className="rounded-md bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent hover:bg-accent/20 transition-colors"
                  >
                    Request
                  </button>
                )}
                {!enabled && requested && (
                  <span className="rounded-md bg-fg-muted/10 px-2.5 py-1 text-xs font-medium text-fg-muted">
                    Requested
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* About Section */}
      <AboutSection />

      {/* Sign Out / Dev Info */}
      <section className="rounded-lg border border-line bg-surface-card p-4">
        {
!isFirebaseConfigured && (
          <p className="text-sm text-fg-muted">
            Dev Mode — localStorage
          </p>
        )
}
        {
isFirebaseConfigured && (
          <button
            onClick={handleSignOut}
            className="w-full rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            Sign Out
          </button>
        )
}
      </section>
    </div>
  );
}

/** Appearance section with expandable theme picker + effect controls */
function AppearanceSection({
  activeThemeId,
  colorMode,
  onThemeChange,
  onColorModeChange,
}: {
  activeThemeId: ThemeId;
  colorMode: ColorMode;
  onThemeChange: (id: ThemeId) => void;
  onColorModeChange: (mode: ColorMode) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const activeTheme = THEME_DEFINITIONS[activeThemeId];

  return (
    <section className="rounded-lg border border-line bg-surface-card p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-fg-muted">
        Appearance
      </h2>

      {/* Current theme display + expand button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="h-8 w-8 rounded-lg border border-line"
            style={{ background: `linear-gradient(135deg, ${activeTheme.previewColors.bg} 50%, ${activeTheme.previewColors.accent} 50%)` }}
          />
          <div>
            <p className="text-sm font-medium text-fg">{activeTheme.name}</p>
            <p className="text-xs text-fg-muted">{activeTheme.family} · {activeTheme.fonts.display}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="text-sm font-medium text-accent hover:underline"
        >
          {expanded ? 'Close' : 'Customize'}
        </button>
      </div>

      {/* Expandable theme grid + effects */}
      {expanded && (
        <div className="mt-4 border-t border-line pt-4">
          {/* Theme grid */}
          <p className="mb-2 text-sm text-fg">Theme</p>
          <div className="grid grid-cols-2 gap-2" data-testid="theme-grid">
            {THEME_LIST.map((theme) => {
              const isActive = activeThemeId === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => onThemeChange(theme.id)}
                  className={`flex items-center gap-3 rounded-lg border p-3 text-left transition ${
                    isActive
                      ? 'border-accent ring-2 ring-accent/30'
                      : 'border-line hover:border-accent/50'
                  }`}
                >
                  <div
                    className="h-10 w-10 flex-shrink-0 rounded-lg border border-line"
                    style={{ background: `linear-gradient(135deg, ${theme.previewColors.bg} 50%, ${theme.previewColors.accent} 50%)` }}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-fg">{theme.name}</p>
                    <p className="text-[10px] text-fg-muted">
                      {theme.family} · {theme.fonts.display}
                      {theme.darkOnly && ' · Dark only'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Color Mode */}
          <p className="mb-2 mt-4 text-sm text-fg">Color Mode</p>
          <div className="flex gap-2" data-testid="color-mode-picker">
            {COLOR_MODES.map((mode) => {
              const isActive = colorMode === mode.value;
              return (
                <button
                  key={mode.value}
                  onClick={() => onColorModeChange(mode.value)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'border-accent bg-accent text-fg-on-accent'
                      : 'border-line text-fg-muted hover:border-accent/50'
                  }`}
                >
                  {mode.label}
                </button>
              );
            })}
          </div>

          {/* Effects info */}
          {activeTheme.effects.length > 0 && (
            <div className="mt-4 border-t border-line pt-3">
              <p className="text-sm text-fg">Effects</p>
              <p className="text-xs text-fg-muted mt-1">
                {activeTheme.effects.join(', ')} · {activeTheme.defaultParticleCount} particles · {activeTheme.defaultParticleSize}
              </p>
            </div>
          )}
          {activeTheme.effects.length === 0 && (
            <div className="mt-4 border-t border-line pt-3">
              <p className="text-xs text-fg-muted">No ambient effects (minimal theme)</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/** About section with changelog viewer */
function AboutSection() {
  const [showChangelog, setShowChangelog] = useState(false);

  return (
    <section className="rounded-lg border border-line bg-surface-card p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-fg-muted">
        About
      </h2>
      <div className="space-y-1 text-sm">
        <p className="text-fg">
          <span className="text-fg-muted">App:</span> {CONFIG.APP_NAME}
        </p>
        <div className="flex items-center gap-2">
          <p className="text-fg">
            <span className="text-fg-muted">Version:</span> {CONFIG.VERSION}
          </p>
          <button
            type="button"
            onClick={() => setShowChangelog((prev) => !prev)}
            className="flex h-5 w-5 items-center justify-center rounded-full border border-line text-xs font-bold text-fg-muted hover:border-accent hover:text-accent transition-colors"
            title="View changelog"
          >
            i
          </button>
        </div>
        <Link
          to={AppPath.Debug}
          className="inline-block mt-2 text-sm text-accent hover:underline"
        >
          Debug Info
        </Link>
      </div>
      {
showChangelog && (
        <div className="mt-4 border-t border-line pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-fg-muted">Changelog</span>
            <button
              type="button"
              onClick={() => setShowChangelog(false)}
              className="text-xs text-fg-muted hover:text-fg"
            >
              Close
            </button>
          </div>
          <pre className="max-h-80 overflow-auto rounded-lg bg-surface border border-line p-3 text-xs text-fg-muted whitespace-pre-wrap font-mono leading-relaxed">
            {changelogRaw as string}
          </pre>
        </div>
      )
}
    </section>
  );
}

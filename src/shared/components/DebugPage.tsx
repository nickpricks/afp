import { useState } from 'react';
import { Link } from 'react-router-dom';

import { isFirebaseConfigured, auth } from '@/shared/auth/firebase-config';
import { useAuth } from '@/shared/auth/useAuth';
import { useToast } from '@/shared/errors/useToast';
import { CONFIG } from '@/constants/config';
import { ROUTES } from '@/constants/routes';
import { DevBench } from '@/shared/components/DevBench';
import { isVerbose, setVerbose } from '@/shared/utils/verbose';

/** Formats a ModuleConfig record into a readable string */
function formatModules(modules: Record<string, boolean> | undefined): string {
  if (!modules) return 'none';
  const enabled = Object.entries(modules)
    .filter(([, v]) => v)
    .map(([k]) => k);
  return enabled.length > 0 ? enabled.join(', ') : 'none';
}

/** Diagnostic page to verify deployment configuration — accessible at /#/debug */
export function DebugPage() {
  const authCtxDump = useAuth();
  const toastCtxDump = useToast();
  const [verbose, setVerboseState] = useState(isVerbose);
  const { firebaseUser, profile } = authCtxDump;
  const currentUser = auth.currentUser ?? firebaseUser;

  const checks = [
    { label: 'Firebase Configured', value: isFirebaseConfigured, expected: true },
    { label: 'Auth UID', value: currentUser?.uid ?? 'none' },
    { label: 'Auth Provider', value: currentUser?.providerId ?? 'none' },
    { label: 'Is Anonymous', value: currentUser?.isAnonymous ?? 'N/A' },
    { label: 'Email', value: currentUser?.email ?? 'none' },
    { label: 'Profile Loaded', value: !!profile, expected: true },
    { label: 'User Role', value: profile?.role ?? 'none' },
    { label: 'Modules Enabled', value: formatModules(profile?.modules) },
    { label: 'App Version', value: CONFIG.VERSION },
    { label: 'Storage Mode', value: isFirebaseConfigured ? 'Firestore' : 'localStorage' },
    { label: 'Dev User Active', value: currentUser?.uid === 'dev-user', expected: false },
    {
      label: 'API Key Present',
      value: isFirebaseConfigured ? 'yes (redacted)' : 'missing or placeholder',
    },
    {
      label: 'Project ID',
      value: isFirebaseConfigured
        ? import.meta.env.VITE_FIREBASE_PROJECT_ID
        : 'not set',
    },
  ];

  return (
    <div className="p-4 max-w-lg mx-auto font-mono text-sm">
      <h1 className="text-lg font-bold mb-4">AFP Debug</h1>
      <table className="w-full border-collapse">
        <tbody>
          {
            checks.map(({ label, value, expected }) => {
              const display = typeof value === 'boolean' ? (value ? 'true' : 'false') : String(value);
              const isPassing = expected === undefined || value === expected;

              return (
                <tr key={label} className="border-b border-gray-200 dark:border-gray-700">
                  <td className="py-2 pr-4 text-gray-500">{label}</td>
                  <td className={`py-2 font-semibold ${isPassing ? 'text-green-600' : 'text-red-500'}`}>
                    {display}
                  </td>
                </tr>
              );
            })
          }
        </tbody>
      </table>
      <details className="mt-4">
        <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-600">AuthContext raw JSON</summary>
        <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto max-h-80">
          {JSON.stringify(authCtxDump, null, 2)}
        </pre>
      </details>

      <details className="mt-4">
        <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-600">ToastContext raw JSON</summary>
        <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto max-h-80">
          {JSON.stringify(toastCtxDump, null, 2)}
        </pre>
      </details>

      <label className="mt-4 flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={verbose}
          onChange={(e) => { setVerbose(e.target.checked); setVerboseState(e.target.checked); }}
          className="rounded border-line accent-accent"
        />
        <span className="text-xs text-fg-muted">Verbose logs (auth, invites, admin)</span>
      </label>

      <p className="mt-2 text-xs text-gray-400 italic">Console output available via the {'>'}_  pill at bottom-right</p>

      <p className="mt-2 text-xs text-gray-400">
        Navigate to /debug to view this page.
      </p>

      <div className="mt-6">
        <DevBench />
      </div>

      <div className="mt-6">
        <Link
          to={ROUTES.ANIMATIONS}
          className="text-sm text-accent hover:underline"
        >
          Animation Viewer →
        </Link>
      </div>
    </div>
  );
}

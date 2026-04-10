import { Link } from 'react-router-dom';

import { isFirebaseConfigured, auth } from '@/shared/auth/firebase-config';
import { useAuth } from '@/shared/auth/useAuth';
import { CONFIG } from '@/constants/config';
import { ROUTES } from '@/constants/routes';
import { DevBench } from '@/shared/components/DevBench';

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
  const { firebaseUser, profile } = useAuth();
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
      <p className="mt-4 text-xs text-gray-400">
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

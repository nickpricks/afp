import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useAuth } from '@/shared/auth/useAuth';
import { AdminClaim } from '@/shared/components/AdminClaim';
import { isAppClaimed } from '@/shared/auth/the-admin-nick';
import { isFirebaseConfigured } from '@/shared/auth/firebase-config';
import { BodySummaryCard } from '@/modules/body/components/BodySummaryCard';
import { BudgetSummaryCard } from '@/modules/expenses/components/BudgetSummaryCard';
import { BabySummaryCard } from '@/modules/baby/components/BabySummaryCard';
import { BabyDashboardBanner } from '@/modules/baby/components/BabyDashboardBanner';
import { useAllUsers } from '@/admin/hooks/useAllUsers';
import { UserRole, ModuleId } from '@/shared/types';
import { getGreeting, formatDayDate, todayStr } from '@/shared/utils/date';

/** Role-aware dashboard showing module summary cards */
export function Dashboard() {
  const { firebaseUser, profile, isTheAdminNick } = useAuth();
  const { users } = useAllUsers(isTheAdminNick);
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedUid = searchParams.get('viewUser');
  const [appClaimed, setAppClaimed] = useState<boolean | null>(isFirebaseConfigured ? null : true);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    isAppClaimed().then(setAppClaimed);
  }, [profile]);

  const ownUid = firebaseUser?.uid ?? '';

  /** Updates selected user and syncs the URL query param */
  const handleUserSelect = (uid: string) => {
    const isOwn = uid === ownUid;
    const next = new URLSearchParams(searchParams);
    if (isOwn) {
      next.delete('viewUser');
    } else {
      next.set('viewUser', uid);
    }
    setSearchParams(next, { replace: true });
  };

  // Determine targetUid based on role
  let targetUid: string | undefined;
  if (profile?.role === UserRole.Viewer && profile.viewerOf) {
    targetUid = profile.viewerOf;
  } else if (isTheAdminNick && selectedUid && selectedUid !== ownUid) {
    targetUid = selectedUid;
  }

  // Target user's name for viewer banner
  const targetName = targetUid
    ? (users.find((u) => u.uid === targetUid)?.name ?? 'another user')
    : (profile?.name ?? '');

  // Determine which modules are active for the dashboard (own or target's)
  let activeModules = profile?.modules;
  if (isTheAdminNick && targetUid && targetUid !== ownUid) {
    const targetUser = users.find((u) => u.uid === targetUid);
    if (targetUser?.modules) {
      activeModules = targetUser.modules;
    }
  }

  // Fresh database — no admin claimed yet
  if (appClaimed === false) {
    return <AdminClaim />;
  }

  if (!profile || !activeModules) {
    return (
      <div className="text-center py-12">
        <p className="text-4xl mb-3">🏠</p>
        <p className="text-fg font-medium">No modules enabled yet</p>
        <p className="text-sm text-fg-muted mt-1">Ask the admin for access</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Admin user selector */}
      {isTheAdminNick && users.length > 0 && (
        <div className="flex items-center gap-2 rounded-full bg-surface-card border border-line px-3 py-1.5 w-fit">
          <span className="text-xs text-fg-muted">Viewing</span>
          <select
            value={selectedUid ?? ownUid}
            onChange={(e) => handleUserSelect(e.target.value)}
            className="bg-transparent text-sm font-medium text-fg appearance-none cursor-pointer"
          >
            <option value={ownUid}>My Data</option>
            {users
              .filter((u) => u.uid !== ownUid)
              .map((u) => (
                <option key={u.uid} value={u.uid}>
                  {u.name}
                </option>
              ))}
          </select>
        </div>
      )}

      {/* Viewer banner */}
      {profile.role === UserRole.Viewer && (
        <div className="flex items-center justify-center gap-2 rounded-lg bg-[var(--accent-muted)] px-4 py-2">
          <span className="text-xs">👁</span>
          <span className="text-sm text-accent font-medium">Viewing {targetName}'s data</span>
        </div>
      )}

      {/* Greeting */}
      <div>
        <h2 className="text-xl font-semibold text-fg">
          {getGreeting()}, {profile.name || 'there'}
        </h2>
        <p className="text-sm text-fg-muted mt-0.5">{formatDayDate(todayStr())}</p>
      </div>

      {/* Age-based suggestions for baby module (target user's config) */}
      {activeModules[ModuleId.Baby] && <BabyDashboardBanner targetUid={targetUid} />}

      {/* Module cards (target user's config) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {activeModules[ModuleId.Body] && <BodySummaryCard targetUid={targetUid} />}
        {activeModules[ModuleId.Budget] && <BudgetSummaryCard targetUid={targetUid} />}
        {activeModules[ModuleId.Baby] && <BabySummaryCard targetUid={targetUid} />}
      </div>
    </div>
  );
}

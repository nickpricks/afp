import { useState, useEffect } from 'react';

import { useAuth } from '@/shared/auth/useAuth';
import { AdminClaim } from '@/shared/components/AdminClaim';
import { DashboardCard } from '@/shared/components/DashboardCard';
import { isAppClaimed } from '@/shared/auth/the-admin-nick';
import { isFirebaseConfigured } from '@/shared/auth/firebase-config';
import { useBodyData } from '@/modules/body/hooks/useBodyData';
import { useBodyConfig } from '@/modules/body/hooks/useBodyConfig';
import { useExpenses } from '@/modules/expenses/hooks/useExpenses';
import { useIncome } from '@/modules/expenses/hooks/useIncome';
import { useChildren } from '@/modules/baby/hooks/useChildren';
import { computeTotalSpent, computeTotalIncome } from '@/modules/expenses/budget-math';
import { useAllUsers } from '@/admin/hooks/useAllUsers';
import { UserRole, ModuleId } from '@/shared/types';
import { ROUTES } from '@/constants/routes';
import { CONFIG } from '@/constants/config';
import { getGreeting, formatDayDate, todayStr } from '@/shared/utils/date';

/** Role-aware dashboard showing module summary cards */
export function Dashboard() {
  const { firebaseUser, profile, isTheAdminNick } = useAuth();
  const { users } = useAllUsers();
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [appClaimed, setAppClaimed] = useState<boolean | null>(isFirebaseConfigured ? null : true);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    isAppClaimed().then(setAppClaimed);
  }, [profile]);

  const ownUid = firebaseUser?.uid ?? '';

  // Determine targetUid based on role
  let targetUid: string | undefined;
  if (profile?.role === UserRole.Viewer && profile.viewerOf) {
    targetUid = profile.viewerOf;
  } else if (isTheAdminNick && selectedUid && selectedUid !== ownUid) {
    targetUid = selectedUid;
  }

  // Target user's name for viewer banner
  const targetName = targetUid
    ? users.find((u) => u.uid === targetUid)?.name ?? 'another user'
    : profile?.name ?? '';

  // Module data — hooks use targetUid for scoping
  const { config: bodyConfig } = useBodyConfig(targetUid);
  const { todayRecord } = useBodyData(targetUid);
  const { expenses } = useExpenses(targetUid);
  const { income } = useIncome(targetUid);
  const { children } = useChildren(targetUid);

  const modules = profile?.modules;

  // Fresh database — no admin claimed yet
  if (appClaimed === false) {
    return <AdminClaim />;
  }

  if (!profile || !modules) {
    return (
      <div className="text-center py-12">
        <p className="text-4xl mb-3">🏠</p>
        <p className="text-fg font-medium">No modules enabled yet</p>
        <p className="text-sm text-fg-muted mt-1">Ask the admin for access</p>
      </div>
    );
  }

  const totalSpent = computeTotalSpent(expenses);
  const totalIncome = computeTotalIncome(income);
  const remaining = totalIncome - totalSpent;

  // Baby card: option B — child count
  const childCount = children.length;
  const babyMetric = childCount === 0 ? 'No children' : `${childCount} ${childCount === 1 ? 'child' : 'children'}`;
  const babySubtitle = childCount > 0
    ? children.map((c) => c.name).join(', ')
    : 'Add a child to get started';

  return (
    <div className="flex flex-col gap-4">
      {/* Admin user selector */}
      {
        isTheAdminNick && users.length > 0 && (
          <div className="flex items-center gap-2 rounded-full bg-surface-card border border-line px-3 py-1.5 w-fit">
            <span className="text-xs text-fg-muted">Viewing</span>
            <select
              value={selectedUid ?? ownUid}
              onChange={(e) => setSelectedUid(e.target.value === ownUid ? null : e.target.value)}
              className="bg-transparent text-sm font-medium text-fg appearance-none cursor-pointer"
            >
              <option value={ownUid}>My Data</option>
              {
                users
                  .filter((u) => u.uid !== ownUid)
                  .map((u) => (
                    <option key={u.uid} value={u.uid}>{u.name}</option>
                  ))
              }
            </select>
          </div>
        )
      }

      {/* Viewer banner */}
      {
        profile.role === UserRole.Viewer && (
          <div className="flex items-center justify-center gap-2 rounded-lg bg-[var(--accent-muted)] px-4 py-2">
            <span className="text-xs">👁</span>
            <span className="text-sm text-accent font-medium">Viewing {targetName}'s data</span>
          </div>
        )
      }

      {/* Greeting */}
      <div>
        <h2 className="text-xl font-semibold text-fg">
          {getGreeting()}, {profile.name || 'there'}
        </h2>
        <p className="text-sm text-fg-muted mt-0.5">{formatDayDate(todayStr())}</p>
      </div>

      {/* Module cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {
          modules[ModuleId.Body] && (
            <DashboardCard
              title="Body"
              icon="💪"
              metric={String(todayRecord?.total ?? 0)}
              subtitle={
                bodyConfig.floors
                  ? `${todayRecord?.up ?? 0} up / ${todayRecord?.down ?? 0} down`
                  : 'No floors configured'
              }
              to={ROUTES.BODY}
            />
          )
        }
        {
          modules[ModuleId.Budget] && (
            <DashboardCard
              title="Budget"
              icon="💰"
              metric={`${CONFIG.CURRENCY_SYMBOL}${totalSpent.toLocaleString()}`}
              subtitle={`Remaining: ${CONFIG.CURRENCY_SYMBOL}${remaining.toLocaleString()}`}
              to={ROUTES.BUDGET}
            />
          )
        }
        {
          modules[ModuleId.Baby] && (
            <DashboardCard
              title="Baby"
              icon="👶"
              metric={babyMetric}
              subtitle={babySubtitle}
              to={ROUTES.BABY}
            />
          )
        }
      </div>
    </div>
  );
}

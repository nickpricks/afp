import { useState, useCallback, useMemo } from 'react';

import { useAllUsers } from '@/admin/hooks/useAllUsers';
import { useAdminActions } from '@/admin/hooks/useAdminActions';
import { ALL_MODULES, ModuleId, UserRole } from '@/shared/types';
import type { UserEntry } from '@/admin/hooks/useAllUsers';
import type { ModuleConfig } from '@/shared/types';

/** Module-specific color classes (A: color-coded module chips) */
const MODULE_COLORS: Record<ModuleId, { chip: string; toggle: string }> = {
  [ModuleId.Body]: { chip: 'bg-indigo-500/10 text-indigo-600', toggle: 'peer-checked:bg-indigo-500' },
  [ModuleId.Budget]: { chip: 'bg-emerald-500/10 text-emerald-600', toggle: 'peer-checked:bg-emerald-500' },
  [ModuleId.Baby]: { chip: 'bg-pink-500/10 text-pink-600', toggle: 'peer-checked:bg-pink-500' },
};

/** Users management: list with role badges, module chips, and inline editing */
export function UsersTab() {
  const { users, loading } = useAllUsers();
  const { updateUserModules, updateUserRole } = useAdminActions();
  const [expandedUid, setExpandedUid] = useState<string | null>(null);

  /** Role counts for summary stat bar (B) */
  const roleCounts = useMemo(() => {
    const counts = { admin: 0, user: 0, viewer: 0 };
    for (const u of users) {
      if (u.role === UserRole.TheAdminNick) counts.admin++;
      else if (u.role === UserRole.Viewer) counts.viewer++;
      else counts.user++;
    }
    return counts;
  }, [users]);

  /** Toggles accordion expansion for a user row */
  const toggleExpand = useCallback((uid: string) => {
    setExpandedUid((prev) => (prev === uid ? null : uid));
  }, []);

  /** Handles module toggle for a user */
  const handleModuleToggle = useCallback(
    (user: UserEntry, moduleId: ModuleId) => {
      const updated: ModuleConfig = {
        ...user.modules,
        [moduleId]: !user.modules[moduleId],
      };
      updateUserModules(user.uid, updated);
    },
    [updateUserModules],
  );

  /** Handles role change for a user */
  const handleRoleChange = useCallback(
    (uid: string, role: UserRole) => {
      updateUserRole(uid, role);
    },
    [updateUserRole],
  );

  if (loading) {
    return <p className="text-sm text-fg-muted">Loading users...</p>;
  }

  if (users.length === 0) {
    return <p className="text-sm text-fg-muted">No users found.</p>;
  }

  return (
    <div className="space-y-3">
      {/* B: Summary stat bar */}
      <div className="flex gap-3 rounded-lg bg-surface-card border border-line px-4 py-2.5">
        <span className="text-xs text-fg-muted">
          <span className="font-semibold text-accent">{roleCounts.admin}</span> Admin
        </span>
        <span className="text-xs text-fg-muted">
          <span className="font-semibold text-fg">{roleCounts.user}</span> User
        </span>
        <span className="text-xs text-fg-muted">
          <span className="font-semibold text-fg">{roleCounts.viewer}</span> Viewer
        </span>
      </div>

      <ul className="divide-y divide-line rounded-xl bg-surface-card border border-line">
        {
users.map((u) => {
          const isExpanded = expandedUid === u.uid;
          const isAdmin = u.role === UserRole.TheAdminNick;
          const enabledModules = ALL_MODULES.filter((m) => u.modules[m]);

          return (
            <li key={u.uid}>
              <button
                type="button"
                onClick={() => toggleExpand(u.uid)}
                className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-surface/50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-fg">{u.name}</span>
                    {
u.viewerOf && (
                      <span className="text-xs text-fg-muted">
                        viewing {users.find((other) => other.uid === u.viewerOf)?.name ?? u.viewerOf}
                      </span>
                    )
}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* A: Color-coded module chips */}
                  {
enabledModules.map((m) => (
                    <span
                      key={m}
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${MODULE_COLORS[m].chip}`}
                    >
                      {m}
                    </span>
                  ))
}
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${roleClass(u.role)}`}>
                    {u.role}
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className={`h-4 w-4 text-fg-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  >
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </div>
              </button>

              {
isExpanded && (
                <div className="border-t border-line bg-surface/30 px-4 py-3 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-fg-muted mb-1.5">Role</label>
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.uid, e.target.value as UserRole)}
                      disabled={isAdmin}
                      className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-fg disabled:opacity-50"
                    >
                      <option value={UserRole.User}>User</option>
                      <option value={UserRole.Viewer}>Viewer</option>
                      {
isAdmin && (
                        <option value={UserRole.TheAdminNick}>Admin</option>
                      )
}
                    </select>
                    {
isAdmin && (
                      <span className="ml-2 text-xs text-fg-muted">Admin role cannot be changed</span>
                    )
}
                  </div>

                  {/* C: Toggle switches instead of checkboxes */}
                  <fieldset>
                    <legend className="text-xs font-medium text-fg-muted mb-1.5">Modules</legend>
                    <div className="flex flex-wrap gap-4">
                      {
ALL_MODULES.map((m) => (
                        <label key={m} className="flex items-center gap-2 cursor-pointer">
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={u.modules[m]}
                              onChange={() => handleModuleToggle(u, m)}
                              aria-label={m}
                              className="peer sr-only"
                            />
                            <div className={`h-5 w-9 rounded-full bg-fg-muted/20 transition-colors ${MODULE_COLORS[m].toggle}`} />
                            <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" />
                          </div>
                          <span className="text-sm capitalize text-fg">{m}</span>
                        </label>
                      ))
}
                    </div>
                  </fieldset>
                </div>
              )
}
            </li>
          );
        })
}
      </ul>
    </div>
  );
}

/** Returns Tailwind classes for a role badge */
function roleClass(role: string): string {
  switch (role) {
    case UserRole.TheAdminNick:
      return 'bg-accent/10 text-accent';
    case UserRole.Viewer:
      return 'bg-info/10 text-info';
    default:
      return 'bg-fg-muted/10 text-fg-muted';
  }
}

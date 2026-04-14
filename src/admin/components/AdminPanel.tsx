import { useState } from 'react';

import { InvitesTab } from '@/admin/components/InvitesTab';
import { UsersTab } from '@/admin/components/UsersTab';
import { BroadcastsTab } from '@/admin/components/BroadcastsTab';
import { useAdminNotifications } from '@/admin/hooks/useAdminNotifications';

type AdminTab = 'invites' | 'users' | 'broadcasts';

/** Admin dashboard with Invites, Users, and Broadcasts tabs */
export function AdminPanel() {
  const [activeTab, setActiveTab] = useState<AdminTab>('invites');
  const { unreadCount } = useAdminNotifications();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-fg">Admin</h1>

      <div className="flex gap-1 rounded-lg bg-surface-card border border-line p-1">
        <button
          type="button"
          onClick={() => setActiveTab('invites')}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            activeTab === 'invites' ? 'bg-accent text-fg-on-accent' : 'text-fg-muted hover:text-fg'
          }`}
        >
          Invites
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`relative flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            activeTab === 'users' ? 'bg-accent text-fg-on-accent' : 'text-fg-muted hover:text-fg'
          }`}
        >
          Users
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('broadcasts')}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            activeTab === 'broadcasts' ? 'bg-accent text-fg-on-accent' : 'text-fg-muted hover:text-fg'
          }`}
        >
          Broadcasts
        </button>
      </div>

      {activeTab === 'invites' && <InvitesTab />}
      {activeTab === 'users' && <UsersTab />}
      {activeTab === 'broadcasts' && <BroadcastsTab />}
    </div>
  );
}

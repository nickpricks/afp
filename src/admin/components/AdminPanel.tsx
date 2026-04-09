import { useState } from 'react';

import { InvitesTab } from '@/admin/components/InvitesTab';
import { UsersTab } from '@/admin/components/UsersTab';

type AdminTab = 'invites' | 'users';

/** Admin dashboard with Invites and Users tabs */
export function AdminPanel() {
  const [activeTab, setActiveTab] = useState<AdminTab>('invites');

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
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            activeTab === 'users' ? 'bg-accent text-fg-on-accent' : 'text-fg-muted hover:text-fg'
          }`}
        >
          Users
        </button>
      </div>

      {activeTab === 'invites' && <InvitesTab />}
      {activeTab === 'users' && <UsersTab />}
    </div>
  );
}

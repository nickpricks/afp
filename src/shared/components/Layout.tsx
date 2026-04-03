import { Outlet } from 'react-router-dom';

import { SyncStatusIndicator } from '@/shared/components/SyncStatus';
import { TabBar } from '@/shared/components/TabBar';
import { UpdatePrompt } from '@/shared/components/UpdatePrompt';
import { useAuth } from '@/shared/auth/useAuth';

/** Root app shell with header, routed content area, tab bar, and PWA update prompt */
export function Layout() {
  const { isLoading, profile } = useAuth();

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
        <div className="rounded-lg bg-surface-card border border-line p-6 text-center shadow-md">
          <h2 className="text-lg font-semibold text-fg">Waiting for Access</h2>
          <p className="mt-2 text-sm text-fg-muted">You need an invite to use this app.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface text-fg">
      <header className="flex items-center justify-between px-4 py-3 bg-surface-card border-b border-line">
        <h1 className="text-base font-semibold">AFP</h1>
        <SyncStatusIndicator />
      </header>

      <main className="p-4 pb-20">
        <Outlet />
      </main>

      <TabBar />
      <UpdatePrompt />
    </div>
  );
}

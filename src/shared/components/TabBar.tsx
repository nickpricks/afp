import { useLocation, useNavigate } from 'react-router-dom';
import { Activity, Receipt, Baby } from 'lucide-react';

import { ModuleId } from '@/shared/types';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/shared/auth/useAuth';
import { useModules } from '@/shared/hooks/useModules';

/** Union of module IDs and the special admin tab */
type TabId = ModuleId | 'admin';

type TabDefinition = { icon: typeof Activity; label: string; route: string };

const MODULE_TABS: Record<ModuleId, TabDefinition> = {
  [ModuleId.Body]: { icon: Activity, label: 'Body', route: ROUTES.BODY },
  [ModuleId.Budget]: { icon: Receipt, label: 'Budget', route: ROUTES.BUDGET },
  [ModuleId.Baby]: { icon: Baby, label: 'Baby', route: ROUTES.BABY },
};

const ADMIN_TAB: TabDefinition = { icon: Activity, label: 'Admin', route: ROUTES.ADMIN };

/** Bottom navigation bar with one tab per enabled module */
export function TabBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isTheAdminNick } = useAuth();
  const modules = useModules();

  const tabs: Array<{ id: TabId } & TabDefinition> = modules.map((id) => ({
    id,
    ...MODULE_TABS[id],
  }));

  if (isTheAdminNick) {
    tabs.push({ id: 'admin', ...ADMIN_TAB });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface-card border-t border-line flex justify-around py-2 px-4 z-40">
      {tabs.map(({ id, icon: Icon, label, route }) => {
        const isActive = location.pathname.startsWith(route);
        const tabIcon = id === 'admin' ? <span className="text-base">👑</span> : <Icon size={20} />;

        return (
          <button
            key={id}
            onClick={() => navigate(route)}
            className={`flex flex-col items-center gap-0.5 text-xs ${isActive ? 'text-accent' : 'text-fg-muted'}`}
          >
            {tabIcon}
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

import { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from '@/shared/auth/auth-context';
import { ToastProvider } from '@/shared/errors/toast-context';
import { ErrorBoundary } from '@/shared/errors/ErrorBoundary';
import { Layout } from '@/shared/components/Layout';
import { ModuleGate } from '@/shared/components/ModuleGate';
import { AdminGate } from '@/shared/components/AdminGate';
import { InviteRedeem } from '@/shared/auth/InviteRedeem';
import { AdminPanel } from '@/admin/components/AdminPanel';
import { InviteGenerator } from '@/admin/components/InviteGenerator';
import { DebugPage } from '@/shared/components/DebugPage';
import { BodyTracker } from '@/modules/body/components/BodyTracker';
import { ExpenseListPage } from '@/modules/expenses/pages/ExpenseListPage';
import { AddExpensePage } from '@/modules/expenses/pages/AddExpensePage';
import { FeedLog } from '@/modules/baby/components/FeedLog';
import { SleepLog } from '@/modules/baby/components/SleepLog';
import { GrowthLog } from '@/modules/baby/components/GrowthLog';
import { DiaperLog } from '@/modules/baby/components/DiaperLog';
import { ModuleId } from '@/shared/types';
import { ROUTES } from '@/constants/routes';
import { CONFIG } from '@/constants/config';
import { applyTheme } from '@/themes/themes';

/** Applies the default theme on mount */
function ThemeInitializer() {
  useEffect(() => {
    applyTheme(CONFIG.DEFAULT_THEME, 'system');
  }, []);

  return null;
}

/** Root application component with routing, providers, and error boundary */
export function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <AuthProvider>
          <ToastProvider>
            <ThemeInitializer />
            <Routes>
              <Route path={ROUTES.INVITE} element={<InviteRedeem />} />
              <Route element={<Layout />}>
                <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.BODY} replace />} />
                <Route path={ROUTES.BODY} element={<ModuleGate moduleId={ModuleId.Body}><BodyTracker /></ModuleGate>} />
                <Route path={ROUTES.EXPENSES} element={<ModuleGate moduleId={ModuleId.Expenses}><ExpenseListPage /></ModuleGate>} />
                <Route path={ROUTES.EXPENSES_ADD} element={<ModuleGate moduleId={ModuleId.Expenses}><AddExpensePage /></ModuleGate>} />
                <Route path={ROUTES.BABY} element={<ModuleGate moduleId={ModuleId.Baby}><FeedLog /></ModuleGate>} />
                <Route path={ROUTES.BABY_FEED} element={<ModuleGate moduleId={ModuleId.Baby}><FeedLog /></ModuleGate>} />
                <Route path={ROUTES.BABY_SLEEP} element={<ModuleGate moduleId={ModuleId.Baby}><SleepLog /></ModuleGate>} />
                <Route path={ROUTES.BABY_GROWTH} element={<ModuleGate moduleId={ModuleId.Baby}><GrowthLog /></ModuleGate>} />
                <Route path={ROUTES.BABY_DIAPER} element={<ModuleGate moduleId={ModuleId.Baby}><DiaperLog /></ModuleGate>} />
                <Route path={ROUTES.ADMIN} element={<AdminGate><AdminPanel /></AdminGate>} />
                <Route path={ROUTES.ADMIN_INVITE} element={<AdminGate><InviteGenerator /></AdminGate>} />
                <Route path={ROUTES.DEBUG} element={<DebugPage />} />
              </Route>
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </HashRouter>
    </ErrorBoundary>
  );
}

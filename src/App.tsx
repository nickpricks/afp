import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

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
import { ProfilePage } from '@/shared/components/ProfilePage';
import { BodyPage } from '@/modules/body/components/BodyPage';
import { ExpenseListPage } from '@/modules/expenses/pages/ExpenseListPage';
import { AddExpensePage } from '@/modules/expenses/pages/AddExpensePage';
import { BabyLanding } from '@/modules/baby/components/BabyLanding';
import { ChildDetail } from '@/modules/baby/components/ChildDetail';
import { Dashboard } from '@/shared/components/Dashboard';
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
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <AuthProvider>
          <ToastProvider>
            <ThemeInitializer />
            <Routes>
              <Route path={ROUTES.INVITE} element={<InviteRedeem />} />
              <Route element={<Layout />}>
                <Route path={ROUTES.HOME} element={<Dashboard />} />
                <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
                <Route path={ROUTES.BODY} element={<ModuleGate moduleId={ModuleId.Body}><BodyPage /></ModuleGate>} />
                <Route path={ROUTES.BUDGET} element={<ModuleGate moduleId={ModuleId.Budget}><ExpenseListPage /></ModuleGate>} />
                <Route path={ROUTES.BUDGET_ADD} element={<ModuleGate moduleId={ModuleId.Budget}><AddExpensePage /></ModuleGate>} />
                <Route path={ROUTES.BABY} element={<ModuleGate moduleId={ModuleId.Baby}><BabyLanding /></ModuleGate>} />
                <Route path={ROUTES.BABY_CHILD} element={<ModuleGate moduleId={ModuleId.Baby}><ChildDetail /></ModuleGate>} />
                <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
                <Route path={ROUTES.ADMIN} element={<AdminGate><AdminPanel /></AdminGate>} />
                <Route path={ROUTES.ADMIN_INVITES} element={<AdminGate><InviteGenerator /></AdminGate>} />
                <Route path={ROUTES.DEBUG} element={<DebugPage />} />
              </Route>
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { AuthProvider } from '@/shared/auth/auth-context';
import { ToastProvider } from '@/shared/errors/toast-context';
import { ErrorBoundary } from '@/shared/errors/ErrorBoundary';
import { Layout } from '@/shared/components/Layout';
import { ModuleGate } from '@/shared/components/ModuleGate';
import { AdminGate } from '@/shared/components/AdminGate';
import { LoadingScreen } from '@/shared/components/loading/LoadingScreen';
import { ModuleId } from '@/shared/types';
import { ROUTES } from '@/constants/routes';
import { CONFIG } from '@/constants/config';
import { applyTheme } from '@/themes/themes';

const InviteRedeem = lazy(() => import('@/shared/auth/InviteRedeem').then(m => ({ default: m.InviteRedeem })));
const AdminPanel = lazy(() => import('@/admin/components/AdminPanel').then(m => ({ default: m.AdminPanel })));
const InviteGenerator = lazy(() => import('@/admin/components/InviteGenerator').then(m => ({ default: m.InviteGenerator })));
const DebugPage = lazy(() => import('@/shared/components/DebugPage').then(m => ({ default: m.DebugPage })));
const ProfilePage = lazy(() => import('@/shared/components/ProfilePage').then(m => ({ default: m.ProfilePage })));
const BodyPage = lazy(() => import('@/modules/body/components/BodyPage').then(m => ({ default: m.BodyPage })));
const ExpenseListPage = lazy(() => import('@/modules/expenses/pages/ExpenseListPage').then(m => ({ default: m.ExpenseListPage })));
const AddExpensePage = lazy(() => import('@/modules/expenses/pages/AddExpensePage').then(m => ({ default: m.AddExpensePage })));
const BabyLanding = lazy(() => import('@/modules/baby/components/BabyLanding').then(m => ({ default: m.BabyLanding })));
const ChildDetail = lazy(() => import('@/modules/baby/components/ChildDetail').then(m => ({ default: m.ChildDetail })));
const Dashboard = lazy(() => import('@/shared/components/Dashboard').then(m => ({ default: m.Dashboard })));
const AnimationViewer = lazy(() => import('@/shared/components/AnimationViewer').then(m => ({ default: m.AnimationViewer })));

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
            <Suspense fallback={<LoadingScreen />}>
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
                  <Route path={ROUTES.ANIMATIONS} element={<AnimationViewer />} />
                </Route>
              </Routes>
            </Suspense>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

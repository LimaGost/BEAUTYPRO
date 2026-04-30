// @ts-nocheck
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import Login from '@/pages/Login';
import PublicBooking from '@/pages/PublicBooking';
import AdminLayout from '@/layouts/AdminLayout';
import AdminDashboard from '@/pages/admin/Dashboard';
import AdminEmpresas from '@/pages/admin/AdminEmpresas';
import AdminClientes from '@/pages/admin/AdminClientes';
import AdminAgendamentos from '@/pages/admin/AdminAgendamentos';
import { useEffect } from 'react';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout
  ? <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isAuthenticated, isAdmin, adminCompany, isCompanySetup } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#080808' }}>
        <div className="w-8 h-8 rounded-full animate-spin"
          style={{ border: '3px solid rgba(201,168,97,0.2)', borderTopColor: '#C9A861' }} />
      </div>
    );
  }

  if (!isAuthenticated) return <Login />;

  return (
    <Routes>
      {/* ── Raiz ─────────────────────────────────────────────────────── */}
      <Route
        path="/"
        element={
          isAdmin && !adminCompany
            ? <Navigate to="/admin/dashboard" replace />
            : isCompanySetup
              ? <LayoutWrapper currentPageName={mainPageKey}><MainPage /></LayoutWrapper>
              : <Navigate to="/empresa" replace />
        }
      />

      {/* ── Rotas exclusivas do admin ─────────────────────────────────── */}
      {isAdmin && <Route path="/admin/dashboard"
        element={<AdminLayout><AdminDashboard /></AdminLayout>} />}
      {isAdmin && <Route path="/admin/empresas"
        element={<AdminLayout><AdminEmpresas /></AdminLayout>} />}
      {isAdmin && <Route path="/admin/clientes"
        element={<AdminLayout><AdminClientes /></AdminLayout>} />}
      {isAdmin && <Route path="/admin/agendamentos"
        element={<AdminLayout><AdminAgendamentos /></AdminLayout>} />}

      {/* ── Proteção: não-admin tentando /admin/* ─────────────────────── */}
      {!isAdmin && <Route path="/admin/*" element={<Navigate to="/" replace />} />}

      {/* ── Páginas normais (admin entra após selecionar empresa) ─────── */}
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            isAdmin && !adminCompany
              ? <Navigate to="/admin/dashboard" replace />
              : <LayoutWrapper currentPageName={path}><Page /></LayoutWrapper>
          }
        />
      ))}

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <Routes>
            {/* Rota pública — sem auth, sem sidebar */}
            <Route path="/agendar/:slug" element={<PublicBooking />} />
            {/* Todas as outras rotas passam pelo fluxo de auth */}
            <Route path="*" element={<AuthenticatedApp />} />
          </Routes>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;

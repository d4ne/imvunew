import { Routes, Route, Navigate, Outlet, useParams } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Blacklist from './pages/Blacklist';
import Booter from './pages/Booter';
import ImageLogger from './pages/ImageLogger';
import Faq from './pages/Faq';
import AdminDocs from './pages/AdminDocs';
import AdminFeatures from './pages/AdminFeatures';
import AdminRoomScanner from './pages/AdminRoomScanner';
import AdminImvuAccounts from './pages/AdminImvuAccounts';
import UserLookup from './pages/UserLookup';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--bg-primary)]">
        <span className="text-sm text-[var(--text-muted)] animate-pulse">Loading…</span>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--bg-primary)]">
        <span className="text-sm text-[var(--text-muted)] animate-pulse">Loading…</span>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!user.isAdmin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function DocsSlugRedirect() {
  const { slug } = useParams<{ slug: string }>();
  return <Navigate to={slug ? `/faq/${slug}` : '/faq'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="overview" element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="safelist" element={<Navigate to="/admin/blacklist" replace />} />
        <Route path="blacklist" element={<Navigate to="/admin/blacklist" replace />} />
        <Route path="image-logger" element={<ImageLogger />} />
        <Route path="user-lookup" element={<UserLookup />} />
        <Route path="admin" element={<AdminRoute><Outlet /></AdminRoute>}>
          <Route index element={<Navigate to="/admin/blacklist" replace />} />
          <Route path="blacklist" element={<Blacklist />} />
          <Route path="features" element={<AdminFeatures />} />
          <Route path="room-scanner" element={<AdminRoomScanner />} />
          <Route path="imvu-accounts" element={<AdminImvuAccounts />} />
          <Route path="faq" element={<AdminDocs />} />
        </Route>
        <Route path="booter" element={<Booter />} />
        <Route path="docs" element={<Navigate to="/faq" replace />} />
        <Route path="docs/:slug" element={<DocsSlugRedirect />} />
        <Route path="faq" element={<Faq />} />
        <Route path="faq/:slug" element={<Faq />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

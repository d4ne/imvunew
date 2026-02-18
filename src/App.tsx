import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Blacklist from './pages/Blacklist';
import RoomLogs from './pages/RoomLogs';
import RoomHistory from './pages/RoomHistory';
import ChatLogs from './pages/ChatLogs';
import InviteExploit from './pages/InviteExploit';
import SpyExploit from './pages/SpyExploit';
import Booter from './pages/Booter';
import ImageLogger from './pages/ImageLogger';
import Invite from './pages/Invite';
import Docs from './pages/Docs';

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
        <Route path="safelist" element={<Navigate to="/blacklist" replace />} />
        <Route path="blacklist" element={<Blacklist />} />
        <Route path="room-logs" element={<RoomLogs />} />
        <Route path="room-history" element={<RoomHistory />} />
        <Route path="chat-logs" element={<ChatLogs />} />
        <Route path="image-logger" element={<ImageLogger />} />
        <Route path="invite-exploit" element={<InviteExploit />} />
        <Route path="spy-exploit" element={<SpyExploit />} />
        <Route path="booter" element={<Booter />} />
        <Route path="invite" element={<Invite />} />
        <Route path="docs" element={<Docs />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

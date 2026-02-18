import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../contexts/AuthContext';

const quickIcons = {
  folder: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  message: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  link: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
  eye: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  zap: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  image: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
};

const quickLinks = [
  { to: '/room-logs', label: 'Room Logs', desc: 'View room activity logs', icon: 'folder' as const },
  { to: '/room-history', label: 'Room History', desc: 'Session history by room', icon: 'clock' as const },
  { to: '/chat-logs', label: 'Chat Logs', desc: 'View chat history and logs', icon: 'message' as const },
  { to: '/image-logger', label: 'Image Logger', desc: 'Log and manage images', icon: 'image' as const },
  { to: '/invite-exploit', label: 'Invite Exploit', desc: 'Room invite tools', icon: 'link' as const },
  { to: '/spy-exploit', label: 'Spy Exploit', desc: 'Spy exploit tools', icon: 'eye' as const },
  { to: '/booter', label: 'Booter', desc: 'Booter utilities', icon: 'zap' as const },
];

export default function Dashboard() {
  const { user } = useAuth();
  const displayName = user?.username ?? 'there';

  return (
    <div className="dashboard-page w-full" style={{ padding: 'var(--page-padding)' }}>
      <PageHeader
        breadcrumbs={['Overview']}
        title="Dashboard"
        subtitle="Your dashboard at a glance"
      />

      <section className="page-hero">
        <h2 className="page-hero-title">Welcome back, {displayName}</h2>
        <p className="page-hero-desc">
          Use the tools below to get started. Jump into any product to view logs, run tools, or manage settings.
        </p>
      </section>

      <section>
        <div className="quick-access-header">
          <h3 className="quick-access-title">Quick access</h3>
          <p className="quick-access-desc">Jump to any product to view logs or run tools.</p>
        </div>
        <div className="quick-grid">
          {quickLinks.map(({ to, label, desc, icon }) => (
            <Link key={to} to={to} className="quick-card">
              <span className="quick-card-icon">{quickIcons[icon]}</span>
              <div className="min-w-0 flex-1">
                <span className="quick-card-label">{label}</span>
                <p className="quick-card-desc">{desc}</p>
              </div>
              <span className="quick-card-arrow" aria-hidden>→</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

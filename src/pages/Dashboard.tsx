import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../contexts/AuthContext';

const quickIcons = {
  image: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  zap: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
};

const quickLinks = [
  { to: '/image-logger', label: 'Image Logger', desc: 'Upload images and get tracking links with IP logging', icon: 'image' as const },
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

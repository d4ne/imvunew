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
  { to: '/image-logger', label: 'Image Logger', desc: 'Upload an image, get a link. When someone opens it, their IP is logged.', icon: 'image' as const },
  { to: '/booter', label: 'Booter', desc: 'Booter tools and utilities.', icon: 'zap' as const },
];

export default function Dashboard() {
  const { user } = useAuth();
  const displayName = user?.username ?? 'there';

  return (
    <div className="dashboard-page w-full" style={{ padding: 'var(--page-padding)' }}>
      <PageHeader
        breadcrumbs={['Overview']}
        title="Dashboard"
        subtitle={`Welcome back, ${displayName}`}
      />

      <section>
        <div className="quick-grid">
          {quickLinks.map(({ to, label, desc, icon }) => (
            <Link key={to} to={to} className="quick-card">
              <div className="quick-card-icon-wrap">{quickIcons[icon]}</div>
              <h4 className="quick-card-label">{label}</h4>
              <p className="quick-card-desc">{desc}</p>
              <span className="quick-card-action">Open</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

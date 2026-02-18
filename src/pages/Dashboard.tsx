import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { apiUrl } from '../lib/api';

interface FeatureItem {
  id: string;
  slug: string;
  name: string;
  status: string;
  updatedAt: string;
}

interface ScannerStats {
  totals: { users: number; rooms: number; scans: number; visits: number };
  recentScans?: Array<{ id: string; startTime: string; status: string; rooms: number; users: number; duration: string | null; errorMessage?: string }>;
}

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
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
};

const quickLinks = [
  { to: '/image-logger', label: 'Image Logger', desc: 'Upload an image, get a link. When someone opens it, their IP is logged.', icon: 'image' as const },
  { to: '/booter', label: 'Booter', desc: 'Booter tools and utilities.', icon: 'zap' as const },
  { to: '/user-lookup', label: 'User lookup', desc: 'Search by IMVU username or cid to see which rooms they visited.', icon: 'search' as const },
];

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  const label = s === 'active' ? 'Active' : s === 'updating' ? 'Updating' : 'Disabled';
  const className =
    s === 'active'
      ? 'feature-status feature-status-active'
      : s === 'updating'
        ? 'feature-status feature-status-updating'
        : 'feature-status feature-status-disabled';
  return (
    <span className={className}>
      <span className="feature-status-dot" aria-hidden />
      {label}
    </span>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const displayName = user?.username ?? 'there';
  const [features, setFeatures] = useState<FeatureItem[]>([]);
  const [featuresLoading, setFeaturesLoading] = useState(true);
  const [scannerStats, setScannerStats] = useState<ScannerStats | null>(null);
  const [scannerStatsLoading, setScannerStatsLoading] = useState(true);

  const fetchFeatures = useCallback(async () => {
    setFeaturesLoading(true);
    try {
      const res = await fetch(apiUrl('/api/features'), { credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setFeatures(data.features || []);
      else setFeatures([]);
    } catch {
      setFeatures([]);
    } finally {
      setFeaturesLoading(false);
    }
  }, []);

  const fetchScannerStats = useCallback(async () => {
    setScannerStatsLoading(true);
    try {
      const res = await fetch(apiUrl('/api/room-scanner/stats'), { credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.data) setScannerStats(data.data);
      else setScannerStats(null);
    } catch {
      setScannerStats(null);
    } finally {
      setScannerStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeatures();
    fetchScannerStats();
  }, [fetchFeatures, fetchScannerStats]);

  return (
    <div className="page dashboard-page w-full">
      <PageHeader
        breadcrumbs={['Overview']}
        title="Dashboard"
        subtitle={`Welcome back, ${displayName}`}
      />

      <div className="dashboard-sections">
        <div className="dashboard-top-row">
          <section className="dashboard-section">
            <header className="dashboard-section-header">
              <h2 className="dashboard-section-title">Feature overview</h2>
              <p className="dashboard-section-desc">Current status of platform features.</p>
            </header>
            <div className="dashboard-card">
              {featuresLoading ? (
                <div className="dashboard-card-loading">
                  <span className="dashboard-card-loading-dot" />
                  <span className="dashboard-card-loading-dot" />
                  <span className="dashboard-card-loading-dot" />
                </div>
              ) : features.length === 0 ? (
                <p className="dashboard-card-empty">No features to display.</p>
              ) : (
                <table className="feature-overview-table">
                  <thead>
                    <tr>
                      <th className="feature-overview-th-name">Feature</th>
                      <th className="feature-overview-th-updated">Last update</th>
                      <th className="feature-overview-th-status">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {features.map((f) => (
                      <tr key={f.id} className="feature-overview-row">
                        <td className="feature-overview-name">{f.name}</td>
                        <td className="feature-overview-cell-updated">
                          {f.updatedAt ? new Date(f.updatedAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                        </td>
                        <td className="feature-overview-cell-status">
                          <StatusBadge status={f.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          <section className="dashboard-section">
            <header className="dashboard-section-header">
              <h2 className="dashboard-section-title">Scanner statistics</h2>
              <p className="dashboard-section-desc">Room scanner totals.</p>
            </header>
            <div className="dashboard-card">
              {scannerStatsLoading ? (
                <div className="dashboard-card-loading">
                  <span className="dashboard-card-loading-dot" />
                  <span className="dashboard-card-loading-dot" />
                  <span className="dashboard-card-loading-dot" />
                </div>
              ) : !scannerStats ? (
                <p className="dashboard-card-empty">Scanner stats unavailable.</p>
              ) : (
                <div className="scanner-stats-card">
                  <div className="scanner-stats-grid">
                    <div className="scanner-stat">
                      <span className="scanner-stat-value">{scannerStats.totals.users.toLocaleString()}</span>
                      <span className="scanner-stat-label">Users</span>
                    </div>
                    <div className="scanner-stat">
                      <span className="scanner-stat-value">{scannerStats.totals.rooms.toLocaleString()}</span>
                      <span className="scanner-stat-label">Rooms</span>
                    </div>
                    <div className="scanner-stat">
                      <span className="scanner-stat-value">{scannerStats.totals.scans.toLocaleString()}</span>
                      <span className="scanner-stat-label">Scans</span>
                    </div>
                    <div className="scanner-stat">
                      <span className="scanner-stat-value">{scannerStats.totals.visits.toLocaleString()}</span>
                      <span className="scanner-stat-label">Visits</span>
                    </div>
                  </div>
                  {scannerStats.recentScans && scannerStats.recentScans.length > 0 && (
                    <div className="scanner-stats-recent">
                      <span className="scanner-stats-recent-label">Latest scans</span>
                      <ul className="scanner-stats-scan-list">
                        {scannerStats.recentScans.slice(0, 5).map((s) => (
                          <li key={s.id} className="scanner-stats-scan-item">
                            <span className="scanner-stats-scan-time">
                              {new Date(s.startTime).toLocaleString(undefined, {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })}
                            </span>
                            <span className={`scanner-stats-scan-status scanner-stats-scan-status-${s.status.toLowerCase()}`}>
                              {s.status}
                            </span>
                            <span className="scanner-stats-scan-meta">
                              {s.status === 'FAILED' && s.errorMessage ? (
                                <span className="scanner-stats-scan-error" title={s.errorMessage}>{s.errorMessage.slice(0, 60)}{s.errorMessage.length > 60 ? '…' : ''}</span>
                              ) : (
                                <>{s.rooms} rooms · {s.users} users{s.duration != null && s.duration !== '' ? ` · ${s.duration}` : ''}</>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>

        <section className="dashboard-section">
          <header className="dashboard-section-header">
            <h2 className="dashboard-section-title">Tools</h2>
            <p className="dashboard-section-desc">Quick access to your tools and utilities.</p>
          </header>
          <div className="quick-grid">
            {quickLinks.map(({ to, label, desc, icon }) => (
              <Link key={to} to={to} className="quick-card">
                <div className="quick-card-icon-wrap">{quickIcons[icon]}</div>
                <h3 className="quick-card-label">{label}</h3>
                <p className="quick-card-desc">{desc}</p>
                <span className="quick-card-action">Open</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

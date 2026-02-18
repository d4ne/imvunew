import { useState, useEffect, useCallback } from 'react';
import PageHeader from '../components/PageHeader';
import { apiUrl } from '../lib/api';

interface FeatureItem {
  id: string;
  slug: string;
  name: string;
  status: string;
  updatedAt: string;
}

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'updating', label: 'Updating' },
  { value: 'disabled', label: 'Disabled' },
] as const;

const SYSTEM_FEATURE_SLUGS = ['room-scanner'];

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

export default function AdminFeatures() {
  const [features, setFeatures] = useState<FeatureItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingSlug, setUpdatingSlug] = useState<string | null>(null);

  const fetchFeatures = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiUrl('/api/features'), { credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error?.message || res.status === 503 ? 'Database not configured' : 'Failed to load features');
        setFeatures([]);
        return;
      }
      setFeatures(data.features || []);
    } catch {
      setError('Failed to load features');
      setFeatures([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  const handleStatusChange = async (slug: string, status: string) => {
    setUpdatingSlug(slug);
    setError(null);
    try {
      const res = await fetch(apiUrl(`/api/features/${encodeURIComponent(slug)}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error?.message || 'Failed to update');
        return;
      }
      await fetchFeatures();
    } catch {
      setError('Failed to update');
    } finally {
      setUpdatingSlug(null);
    }
  };

  return (
    <div className="page w-full">
      <PageHeader
        breadcrumbs={['Admin']}
        title="Features"
        subtitle="Change feature status. Status is shown on the dashboard."
      />

      {error && <div className="admin-error">{error}</div>}

      <div className="dashboard-sections">
        <section className="dashboard-section">
          <header className="dashboard-section-header">
            <h2 className="dashboard-section-title">Feature status</h2>
            <p className="dashboard-section-desc">Change status for each feature. Shown on the dashboard.</p>
          </header>
          <div className="dashboard-card">
            {loading ? (
              <div className="dashboard-card-loading">
                <span className="dashboard-card-loading-dot" />
                <span className="dashboard-card-loading-dot" />
                <span className="dashboard-card-loading-dot" />
              </div>
            ) : features.length === 0 ? (
              <p className="dashboard-card-empty">No features to display.</p>
            ) : (
              <div className="af-table">
                <div className="af-thead">
                  <span className="af-th af-th-name">Feature</span>
                  <span className="af-th af-th-status">Status</span>
                </div>
                {features.map((f) => {
                const isSystem = SYSTEM_FEATURE_SLUGS.includes(f.slug);
                return (
                  <div key={f.id} className="af-row">
                    <div>
                      <span className="af-name">{f.name}</span>
                      <span className="af-slug">/{f.slug}</span>
                      {isSystem && <span className="af-slug ml-1 text-[var(--text-muted)]">(system)</span>}
                    </div>
                    <div className="af-radios" role="radiogroup" aria-label={`Status for ${f.name}`}>
                      {isSystem ? (
                        <StatusBadge status={f.status} />
                      ) : (
                        STATUS_OPTIONS.map((o) => (
                          <label key={o.value} className="af-radio-label">
                            <input
                              type="radio"
                              name={`status-${f.slug}`}
                              value={o.value}
                              checked={f.status === o.value}
                              onChange={() => handleStatusChange(f.slug, o.value)}
                              disabled={updatingSlug === f.slug}
                              className="af-radio"
                            />
                            <span className="af-radio-text">{o.label}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

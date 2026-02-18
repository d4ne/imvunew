import { useState, useEffect, useCallback } from 'react';
import PageHeader from '../components/PageHeader';
import { apiUrl } from '../lib/api';

interface BlacklistEntry {
  id: string;
  identifier: string;
  reason: string | null;
  addedById: string | null;
  createdAt: string;
}

export default function Blacklist() {
  const [list, setList] = useState<BlacklistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [identifier, setIdentifier] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiUrl('/api/blacklist'), { credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error?.message || res.status === 403 ? 'Admin access required' : res.status === 503 ? 'Database not configured' : 'Failed to load blacklist');
        setList([]);
        return;
      }
      setList(data.blacklist || []);
    } catch {
      setError('Failed to load blacklist');
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = identifier.trim();
    if (!trimmed) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(apiUrl('/api/blacklist'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ identifier: trimmed, reason: reason.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error?.message || 'Failed to add');
        return;
      }
      setIdentifier('');
      setReason('');
      await fetchList();
    } catch {
      setError('Failed to add');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (id: string) => {
    setRemovingId(id);
    setError(null);
    try {
      const res = await fetch(apiUrl(`/api/blacklist/${id}`), {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error?.message || 'Failed to remove');
        return;
      }
      await fetchList();
    } catch {
      setError('Failed to remove');
    } finally {
      setRemovingId(null);
    }
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, { dateStyle: 'short' }) + ' ' + d.toLocaleTimeString(undefined, { timeStyle: 'short' });
    } catch {
      return iso;
    }
  };

  return (
    <div className="page w-full">
      <PageHeader
        breadcrumbs={['Admin']}
        title="Blacklist"
        subtitle="People who cannot be looked up. Blacklisted users will not appear in profile or room searches."
      />

      <div className="dashboard-sections">
        <div className="dashboard-section bl-add-section">
          <header className="dashboard-section-header">
            <h2 className="dashboard-section-title">Add to blacklist</h2>
            <p className="dashboard-section-desc">Username or identifier and optional reason.</p>
          </header>
          <div className="content-card bl-add-card mb-6">
            <form onSubmit={handleAdd} className="bl-form">
              <div className="bl-field bl-field--identifier">
                <label htmlFor="bl-identifier" className="bl-label">Username or identifier</label>
                <input
                  id="bl-identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. username or cid"
                  className="bl-input"
                  disabled={submitting}
                />
              </div>
              <div className="bl-field bl-field--reason">
                <label htmlFor="bl-reason" className="bl-label">Reason (optional)</label>
                <input
                  id="bl-reason"
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. abuse"
                  className="bl-input"
                  disabled={submitting}
                />
              </div>
              <button
                type="submit"
                disabled={submitting || !identifier.trim()}
                className="bl-submit"
              >
                {submitting ? 'Adding…' : 'Add'}
              </button>
            </form>
          </div>
        </div>

        {error && (
          <div className="bl-error mb-4">
            {error}
          </div>
        )}

        <div className="dashboard-section">
          <header className="dashboard-section-header">
            <h2 className="dashboard-section-title">Blacklist entries</h2>
            <p className="dashboard-section-desc">Current list. Remove to allow lookups again.</p>
          </header>
          <div className="content-card">
            {loading ? (
              <p className="bl-empty">Loading…</p>
            ) : list.length === 0 ? (
              <p className="bl-empty">No entries yet. Add an identifier above.</p>
            ) : (
              <div className="bl-table-wrap">
                <table className="bl-table">
                  <thead>
                    <tr>
                      <th>Identifier</th>
                      <th>Reason</th>
                      <th>Added</th>
                      <th style={{ width: '6rem' }} aria-label="Remove" />
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((entry) => (
                      <tr key={entry.id}>
                        <td className="bl-cell-id">{entry.identifier}</td>
                        <td>{entry.reason || '—'}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{formatDate(entry.createdAt)}</td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleRemove(entry.id)}
                            disabled={removingId === entry.id}
                            className="bl-remove-btn"
                            aria-label={`Remove ${entry.identifier}`}
                          >
                            {removingId === entry.id ? '…' : 'Remove'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

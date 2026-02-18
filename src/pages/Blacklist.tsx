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
    <div style={{ padding: 'var(--page-padding)' }} className="w-full">
      <PageHeader
        breadcrumbs={['Admin']}
        title="Blacklist"
        subtitle="People who cannot be looked up. Blacklisted users will not appear in profile or room searches."
      />

      <div className="content-card mb-6">
        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-3">Add to blacklist</h3>
        <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px]">
            <label htmlFor="bl-identifier" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              Username or identifier
            </label>
            <input
              id="bl-identifier"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. username or cid"
              className="w-full px-3 py-2 rounded-[var(--radius)] bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring 2px focus:ring-[var(--accent)] focus:border-transparent"
              disabled={submitting}
            />
          </div>
          <div className="min-w-[200px]">
            <label htmlFor="bl-reason" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              Reason (optional)
            </label>
            <input
              id="bl-reason"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. abuse"
              className="w-full px-3 py-2 rounded-[var(--radius)] bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring 2px focus:ring-[var(--accent)] focus:border-transparent"
              disabled={submitting}
            />
          </div>
          <button
            type="submit"
            disabled={submitting || !identifier.trim()}
            className="px-4 py-2 rounded-[var(--radius)] bg-[var(--accent)] text-white font-medium hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Adding…' : 'Add'}
          </button>
        </form>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-[var(--radius)] bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="content-card">
        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">Blacklist entries</h3>
        {loading ? (
          <p className="text-[var(--text-muted)] text-sm">Loading…</p>
        ) : list.length === 0 ? (
          <p className="text-[var(--text-muted)] text-sm">No entries yet. Add an identifier above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-3 px-3 font-semibold text-[var(--text-secondary)]">Identifier</th>
                  <th className="text-left py-3 px-3 font-semibold text-[var(--text-secondary)]">Reason</th>
                  <th className="text-left py-3 px-3 font-semibold text-[var(--text-secondary)]">Added</th>
                  <th className="w-24 py-3 px-3" aria-label="Remove" />
                </tr>
              </thead>
              <tbody>
                {list.map((entry) => (
                  <tr key={entry.id} className="border-b border-[var(--border-subtle)] last:border-0">
                    <td className="py-3 px-3 font-medium text-[var(--text-primary)]">{entry.identifier}</td>
                    <td className="py-3 px-3 text-[var(--text-secondary)]">{entry.reason || '—'}</td>
                    <td className="py-3 px-3 text-[var(--text-muted)]">{formatDate(entry.createdAt)}</td>
                    <td className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => handleRemove(entry.id)}
                        disabled={removingId === entry.id}
                        className="px-2 py-1 rounded text-red-400 hover:bg-red-500/10 disabled:opacity-50 text-xs font-medium transition-colors"
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
  );
}

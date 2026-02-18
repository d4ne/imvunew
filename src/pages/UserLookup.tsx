import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import { apiUrl } from '../lib/api';

interface UserHistoryData {
  user: { cid: string; username: string | null; avatarName: string | null; lastSeen: string; firstSeen: string };
  totalVisits: number;
  uniqueRooms: number;
  roomsVisited: Array<{ roomId: string; roomName: string | null; visitCount: number; lastVisit: string }>;
  recentVisits: Array<{ roomId: string; roomName: string | null; seenAt: string; userCount: number | null; scanId: string }>;
}

export default function UserLookup() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<UserHistoryData | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch(apiUrl(`/api/room-scanner/users/lookup?q=${encodeURIComponent(trimmed)}`), {
        credentials: 'include',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.error?.message || 'User not found or no visits recorded');
        return;
      }
      setData(json.data as UserHistoryData);
    } catch {
      setError('Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page w-full">
      <PageHeader
        breadcrumbs={[]}
        title="User lookup"
        subtitle="Search by IMVU username or cid (customer ID) to see which rooms they visited."
      />

      {error && <div className="admin-error">{error}</div>}

      <section className="dashboard-section">
        <header className="dashboard-section-header">
          <h2 className="dashboard-section-title">Search by username or cid</h2>
          <p className="dashboard-section-desc">Enter an IMVU username or customer ID (cid). Username search is case-insensitive.</p>
        </header>
        <div className="content-card">
          <form onSubmit={handleSubmit} className="ad-form">
            <div className="ad-field">
              <label htmlFor="user-lookup-q" className="ad-label">Username or cid</label>
              <input
                id="user-lookup-q"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="ad-input"
                placeholder="e.g. CoolAvatar or 1234567890"
                disabled={loading}
              />
            </div>
            <div className="ad-actions">
              <button type="submit" disabled={loading} className="ad-btn">
                {loading ? 'Loading…' : 'Look up'}
              </button>
            </div>
          </form>
        </div>
      </section>

      {data && (
        <section className="dashboard-section mt-6">
          <header className="dashboard-section-header">
            <h2 className="dashboard-section-title">Results</h2>
            <p className="dashboard-section-desc">
              {data.user.username || data.user.cid} — {data.totalVisits} visit(s) in {data.uniqueRooms} room(s).
            </p>
          </header>
          <div className="content-card">
            <div className="mb-4">
              <p><strong>CID:</strong> {data.user.cid}</p>
              <p><strong>Username:</strong> {data.user.username ?? '—'}</p>
              <p><strong>Avatar:</strong> {data.user.avatarName ?? '—'}</p>
              <p><strong>First seen:</strong> {data.user.firstSeen ? new Date(data.user.firstSeen).toLocaleString() : '—'}</p>
              <p><strong>Last seen:</strong> {data.user.lastSeen ? new Date(data.user.lastSeen).toLocaleString() : '—'}</p>
            </div>
            <h3 className="text-sm font-semibold text-[var(--text-muted)] mb-2">Rooms visited</h3>
            <ul className="space-y-1 text-sm">
              {data.roomsVisited.length === 0 ? (
                <li className="text-[var(--text-muted)]">No rooms recorded.</li>
              ) : (
                data.roomsVisited.map((r) => (
                  <li key={r.roomId}>
                    <span className="font-medium">{r.roomName || r.roomId}</span>
                    {' '}({r.visitCount} visit{r.visitCount !== 1 ? 's' : ''}, last: {new Date(r.lastVisit).toLocaleString()})
                  </li>
                ))
              )}
            </ul>
            {data.recentVisits.length > 0 && (
              <>
                <h3 className="text-sm font-semibold text-[var(--text-muted)] mt-4 mb-2">Recent visits (raw)</h3>
                <ul className="space-y-1 text-sm">
                  {data.recentVisits.slice(0, 20).map((v, i) => (
                    <li key={i}>
                      {v.roomName || v.roomId} @ {new Date(v.seenAt).toLocaleString()} (scan: {v.scanId.slice(0, 8)}…)
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

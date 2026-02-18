import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { apiUrl, fetchWithTimeout } from '../lib/api';

interface RoomScannerConfig {
  maxPages: number;
  pageSize: number;
  delayMs: number;
  keywords: string;
  roomType: string;
  hashtags: string;
  language: string;
  autoScanEnabled: boolean;
  autoScanIntervalMinutes: number;
}

const DEFAULTS: RoomScannerConfig = {
  maxPages: 100,
  pageSize: 25,
  delayMs: 300,
  keywords: '',
  roomType: 'all',
  hashtags: '',
  language: '',
  autoScanEnabled: false,
  autoScanIntervalMinutes: 60,
};

const LANGUAGE_OPTIONS = [
  { value: '', label: 'All languages' },
  { value: 'de', label: 'German' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'nl', label: 'Dutch' },
  { value: 'pl', label: 'Polish' },
  { value: 'ru', label: 'Russian' },
  { value: 'tr', label: 'Turkish' },
  { value: 'ja', label: 'Japanese' },
  { value: 'zh', label: 'Chinese' },
];

export default function AdminRoomScanner() {
  const [, setConfig] = useState<RoomScannerConfig>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [maxPages, setMaxPages] = useState(String(DEFAULTS.maxPages));
  const [pageSize, setPageSize] = useState(String(DEFAULTS.pageSize));
  const [delayMs, setDelayMs] = useState(String(DEFAULTS.delayMs));
  const [keywords, setKeywords] = useState(DEFAULTS.keywords);
  const [roomType, setRoomType] = useState(DEFAULTS.roomType);
  const [hashtags, setHashtags] = useState(DEFAULTS.hashtags);
  const [language, setLanguage] = useState(DEFAULTS.language);
  const [autoScanEnabled, setAutoScanEnabled] = useState(DEFAULTS.autoScanEnabled);
  const [autoScanIntervalMinutes, setAutoScanIntervalMinutes] = useState(String(DEFAULTS.autoScanIntervalMinutes));
  const [stats, setStats] = useState<{ totals: { users: number; rooms: number; scans: number; visits: number }; recentScans: unknown[] } | null>(null);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithTimeout(apiUrl('/api/room-scanner/config'), {
        credentials: 'include',
        timeoutMs: 12000,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error?.message || 'Failed to load config');
        return;
      }
      const c = data.config as RoomScannerConfig;
      if (c) {
        setConfig(c);
        setMaxPages(String(c.maxPages));
        setPageSize(String(c.pageSize));
        setDelayMs(String(c.delayMs));
        setKeywords(c.keywords ?? '');
        setRoomType(c.roomType ?? 'all');
        setHashtags(c.hashtags ?? '');
        setLanguage(c.language ?? '');
        setAutoScanEnabled(c.autoScanEnabled ?? false);
        setAutoScanIntervalMinutes(String(c.autoScanIntervalMinutes ?? 60));
      }
    } catch (e) {
      const msg = e instanceof Error && e.name === 'AbortError'
        ? 'Request timed out. If you see this on production, set root .env to VITE_API_URL= and rebuild.'
        : 'Failed to load config';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetchWithTimeout(apiUrl('/api/room-scanner/stats'), {
        credentials: 'include',
        timeoutMs: 10000,
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.data) setStats(data.data);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchConfig();
    fetchStats();
  }, [fetchConfig, fetchStats]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const max = Math.max(1, Math.min(500, parseInt(maxPages, 10) || DEFAULTS.maxPages));
    const size = Math.max(5, Math.min(100, parseInt(pageSize, 10) || DEFAULTS.pageSize));
    const delay = Math.max(0, Math.min(5000, parseInt(delayMs, 10) ?? DEFAULTS.delayMs));
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(apiUrl('/api/room-scanner/config'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          maxPages: max,
          pageSize: size,
          delayMs: delay,
          keywords: keywords.trim(),
          roomType: roomType.trim() || 'all',
          hashtags: hashtags.trim(),
          language: language.trim(),
          autoScanEnabled,
          autoScanIntervalMinutes: Math.max(5, Math.min(10080, parseInt(autoScanIntervalMinutes, 10) || 60)),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error?.message || 'Failed to save');
        return;
      }
      const c = data.config as RoomScannerConfig;
      if (c) {
        setConfig(c);
        setMaxPages(String(c.maxPages));
        setPageSize(String(c.pageSize));
        setDelayMs(String(c.delayMs));
        setKeywords(c.keywords ?? '');
        setRoomType(c.roomType ?? 'all');
        setHashtags(c.hashtags ?? '');
        setLanguage(c.language ?? '');
        setAutoScanEnabled(c.autoScanEnabled ?? false);
        setAutoScanIntervalMinutes(String(c.autoScanIntervalMinutes ?? 60));
      }
    } catch {
      setError('Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTriggerScan = async () => {
    setScanning(true);
    setError(null);
    try {
      const res = await fetch(apiUrl('/api/room-scanner/scan'), {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error?.message || 'Failed to start scan');
        return;
      }
      await fetchStats();
    } catch {
      setError('Failed to start scan');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="page w-full">
      <PageHeader
        breadcrumbs={['Admin']}
        title="Room Scanner"
        subtitle="Scan IMVU rooms, store user visits, and look up which rooms a user visited. Configure filters (e.g. German rooms)."
      />

      {error && <div className="admin-error">{error}</div>}

      {stats && (
        <section className="dashboard-section mb-6">
          <header className="dashboard-section-header">
            <h2 className="dashboard-section-title">Stats</h2>
            <p className="dashboard-section-desc">Totals and recent scans. <Link to="/user-lookup" className="text-[var(--accent)] underline">User lookup</Link> – search by IMVU cid to see rooms visited.</p>
          </header>
          <div className="content-card flex flex-wrap gap-4">
            <div><span className="text-[var(--text-muted)]">Users:</span> <strong>{stats.totals.users}</strong></div>
            <div><span className="text-[var(--text-muted)]">Rooms:</span> <strong>{stats.totals.rooms}</strong></div>
            <div><span className="text-[var(--text-muted)]">Scans:</span> <strong>{stats.totals.scans}</strong></div>
            <div><span className="text-[var(--text-muted)]">Visits:</span> <strong>{stats.totals.visits}</strong></div>
            <button type="button" onClick={handleTriggerScan} disabled={scanning} className="ad-btn ml-auto">
              {scanning ? 'Starting…' : 'Run scan now'}
            </button>
          </div>
        </section>
      )}

      <div className="dashboard-sections">
        <section className="dashboard-section">
          <header className="dashboard-section-header">
            <h2 className="dashboard-section-title">Scanner settings</h2>
            <p className="dashboard-section-desc">Pagination and rate limit. Use filters below to e.g. only scan German rooms (keywords: german).</p>
          </header>
          <div className="content-card">
            {loading ? (
              <div className="dashboard-card-loading" style={{ padding: '2rem' }}>
                <span className="dashboard-card-loading-dot" />
                <span className="dashboard-card-loading-dot" />
                <span className="dashboard-card-loading-dot" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="ad-form">
                <div className="ad-field">
                  <label htmlFor="scanner-max-pages" className="ad-label">Max pages</label>
                  <p className="ad-hint">Maximum number of room list pages to fetch (1–500).</p>
                  <input
                    id="scanner-max-pages"
                    type="number"
                    min={1}
                    max={500}
                    value={maxPages}
                    onChange={(e) => setMaxPages(e.target.value)}
                    className="ad-input"
                    disabled={submitting}
                  />
                </div>
                <div className="ad-field">
                  <label htmlFor="scanner-page-size" className="ad-label">Page size</label>
                  <p className="ad-hint">Rooms per API request (5–100).</p>
                  <input id="scanner-page-size" type="number" min={5} max={100} value={pageSize} onChange={(e) => setPageSize(e.target.value)} className="ad-input" disabled={submitting} />
                </div>
                <div className="ad-field">
                  <label htmlFor="scanner-delay-ms" className="ad-label">Delay between pages (ms)</label>
                  <p className="ad-hint">Pause every 5 pages to avoid rate limits (0–5000 ms).</p>
                  <input id="scanner-delay-ms" type="number" min={0} max={5000} value={delayMs} onChange={(e) => setDelayMs(e.target.value)} className="ad-input" disabled={submitting} />
                </div>
                <div className="ad-field">
                  <label htmlFor="scanner-keywords" className="ad-label">Keywords filter</label>
                  <p className="ad-hint">Only fetch rooms matching this search (e.g. &quot;german&quot; for German rooms). Leave empty for all.</p>
                  <input id="scanner-keywords" type="text" value={keywords} onChange={(e) => setKeywords(e.target.value)} className="ad-input" placeholder="e.g. german" disabled={submitting} />
                </div>
                <div className="ad-field">
                  <label htmlFor="scanner-room-type" className="ad-label">Room type</label>
                  <p className="ad-hint">API room_type: all, public, etc.</p>
                  <input id="scanner-room-type" type="text" value={roomType} onChange={(e) => setRoomType(e.target.value)} className="ad-input" placeholder="all" disabled={submitting} />
                </div>
                <div className="ad-field">
                  <label htmlFor="scanner-hashtags" className="ad-label">Hashtags filter</label>
                  <p className="ad-hint">Only rooms with these hashtags. Leave empty for no filter.</p>
                  <input id="scanner-hashtags" type="text" value={hashtags} onChange={(e) => setHashtags(e.target.value)} className="ad-input" placeholder="" disabled={submitting} />
                </div>
                <div className="ad-field">
                  <label htmlFor="scanner-language" className="ad-label">Language</label>
                  <p className="ad-hint">Room list API language filter (e.g. de for German rooms).</p>
                  <select id="scanner-language" value={language} onChange={(e) => setLanguage(e.target.value)} className="ad-input" disabled={submitting}>
                    {LANGUAGE_OPTIONS.map((opt) => (
                      <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="ad-field flex flex-wrap items-center gap-4 border-t border-[var(--border)] pt-4 mt-2">
                  <div className="flex items-center gap-2">
                    <input id="scanner-auto-scan" type="checkbox" checked={autoScanEnabled} onChange={(e) => setAutoScanEnabled(e.target.checked)} disabled={submitting} />
                    <label htmlFor="scanner-auto-scan" className="ad-label mb-0">Enable auto-scan (24/7)</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <label htmlFor="scanner-interval" className="ad-label mb-0">Run every</label>
                    <input id="scanner-interval" type="number" min={5} max={10080} value={autoScanIntervalMinutes} onChange={(e) => setAutoScanIntervalMinutes(e.target.value)} className="ad-input w-20" disabled={submitting} />
                    <span className="text-sm text-[var(--text-muted)]">minutes</span>
                  </div>
                </div>
                <div className="ad-actions">
                  <button type="submit" disabled={submitting} className="ad-btn">
                    {submitting ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

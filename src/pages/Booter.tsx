import { useState } from 'react';
import PageHeader from '../components/PageHeader';

const METHODS = [
  { value: 'udp', label: 'UDP' },
  { value: 'syn', label: 'SYN' },
  { value: 'vse', label: 'VSE' },
  { value: 'http', label: 'HTTP' },
  { value: 'ovh', label: 'OVH' },
];

interface RunEntry {
  id: string;
  target: string;
  port: string;
  duration: number;
  method: string;
  status: 'sent' | 'running' | 'done' | 'failed';
  createdAt: number;
}

function statusClass(s: RunEntry['status']): string {
  switch (s) {
    case 'sent': return 'booter-status booter-status--sent';
    case 'running': return 'booter-status booter-status--running';
    case 'done': return 'booter-status booter-status--done';
    default: return 'booter-status booter-status--failed';
  }
}

function statusLabel(s: RunEntry['status']): string {
  switch (s) {
    case 'sent': return 'Sent';
    case 'running': return 'Running';
    case 'done': return 'Done';
    default: return 'Failed';
  }
}

export default function Booter() {
  const [target, setTarget] = useState('');
  const [port, setPort] = useState('');
  const [duration, setDuration] = useState(60);
  const [method, setMethod] = useState('udp');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runs, setRuns] = useState<RunEntry[]>([]);

  const handleLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = target.trim();
    if (!trimmed) {
      setError('Enter a target (IP or hostname)');
      return;
    }
    const dur = Math.max(1, Math.min(86400, duration));
    setError(null);
    setSubmitting(true);
    try {
      const entry: RunEntry = {
        id: `run-${Date.now()}`,
        target: trimmed,
        port: port.trim() || '—',
        duration: dur,
        method,
        status: 'sent',
        createdAt: Date.now(),
      };
      setRuns((prev) => [entry, ...prev]);
      setTarget('');
      setPort('');
    } catch {
      setError('Failed to launch');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (ts: number) =>
    new Date(ts).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });

  const getMethodLabel = (v: string) => METHODS.find((m) => m.value === v)?.label ?? v;
  const getDurationLabel = (v: number) => `${v}s`;

  return (
    <div className="page w-full">
      <PageHeader
        breadcrumbs={['Features']}
        title="Booter"
        subtitle="Launch and monitor stress-test sessions"
      />

      <div className="dashboard-sections">
        <div className="dashboard-section booter-launch-section">
          <header className="dashboard-section-header">
            <h2 className="dashboard-section-title">Launch</h2>
            <p className="dashboard-section-desc">Target, port, duration and method.</p>
          </header>
          <div className="content-card booter-launch-card mb-6">
            <form onSubmit={handleLaunch} className="booter-form">
              <div className="booter-field booter-field--target">
                <label htmlFor="booter-target" className="booter-label">Target (IP or hostname)</label>
                <input
                  id="booter-target"
                  type="text"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="e.g. 192.168.1.1 or example.com"
                  className="booter-input"
                  disabled={submitting}
                />
              </div>
              <div className="booter-field booter-field--port">
                <label htmlFor="booter-port" className="booter-label">Port</label>
                <input
                  id="booter-port"
                  type="text"
                  inputMode="numeric"
                  value={port}
                  onChange={(e) => setPort(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  placeholder="80"
                  className="booter-input"
                  disabled={submitting}
                />
              </div>
              <div className="booter-field booter-field--duration">
                <label htmlFor="booter-duration" className="booter-label">Duration (s)</label>
                <input
                  id="booter-duration"
                  type="number"
                  min={1}
                  max={86400}
                  value={duration}
                  onChange={(e) => setDuration(Math.max(1, Math.min(86400, Number(e.target.value) || 1)))}
                  placeholder="60"
                  className="booter-input"
                  disabled={submitting}
                />
              </div>
              <div className="booter-field booter-field--method">
                <label htmlFor="booter-method" className="booter-label">Method</label>
                <select
                  id="booter-method"
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="booter-input"
                  disabled={submitting}
                >
                  {METHODS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="booter-submit"
              >
                {submitting ? 'Launching…' : 'Launch'}
              </button>
            </form>
          </div>
        </div>

        {error && (
          <div className="booter-error mb-4">
            {error}
          </div>
        )}

        <div className="dashboard-section">
          <header className="dashboard-section-header">
            <h2 className="dashboard-section-title">Recent runs</h2>
            <p className="dashboard-section-desc">Latest launch history.</p>
          </header>
          <div className="content-card">
            {runs.length === 0 ? (
              <div className="booter-empty">
                <span className="booter-empty-icon" aria-hidden>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </span>
                <p className="booter-empty-title">No runs yet</p>
                <p className="booter-empty-desc">Use the form above to launch one. Runs appear here with status and time.</p>
              </div>
            ) : (
              <div className="booter-table-wrap">
                <table className="booter-table">
                  <thead>
                    <tr>
                      <th>Target</th>
                      <th>Port</th>
                      <th>Method</th>
                      <th>Duration</th>
                      <th>Status</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {runs.map((r) => (
                      <tr key={r.id}>
                        <td className="booter-cell-target">{r.target}</td>
                        <td>{r.port}</td>
                        <td>{getMethodLabel(r.method)}</td>
                        <td>{getDurationLabel(r.duration)}</td>
                        <td>
                          <span className={statusClass(r.status)}>
                            {statusLabel(r.status)}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>{formatTime(r.createdAt)}</td>
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

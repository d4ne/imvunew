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
      // Placeholder: no backend yet. Add run to list for UI demo.
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

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
  };

  const getMethodLabel = (v: string) => METHODS.find((m) => m.value === v)?.label ?? v;
  const getDurationLabel = (v: number) => `${v}s`;

  return (
    <div style={{ padding: 'var(--page-padding)' }} className="w-full">
      <PageHeader
        breadcrumbs={['Features']}
        title="Booter"
        subtitle="Launch and monitor stress-test sessions"
      />

      <div className="content-card mb-6">
        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">Launch</h3>
        <form onSubmit={handleLaunch} className="flex flex-wrap items-end gap-4">
          <div className="min-w-[180px]">
            <label htmlFor="booter-target" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              Target (IP or hostname)
            </label>
            <input
              id="booter-target"
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="e.g. 192.168.1.1 or example.com"
              className="w-full px-3 py-2 rounded-[var(--radius)] bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring 2px focus:ring-[var(--accent)] focus:border-transparent"
              disabled={submitting}
            />
          </div>
          <div className="w-24">
            <label htmlFor="booter-port" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              Port
            </label>
            <input
              id="booter-port"
              type="text"
              inputMode="numeric"
              value={port}
              onChange={(e) => setPort(e.target.value.replace(/\D/g, '').slice(0, 5))}
              placeholder="80"
              className="w-full px-3 py-2 rounded-[var(--radius)] bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring 2px focus:ring-[var(--accent)] focus:border-transparent"
              disabled={submitting}
            />
          </div>
          <div className="w-24">
            <label htmlFor="booter-duration" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              Duration (sec)
            </label>
            <input
              id="booter-duration"
              type="number"
              min={1}
              max={86400}
              value={duration}
              onChange={(e) => setDuration(Math.max(1, Math.min(86400, Number(e.target.value) || 1)))}
              placeholder="60"
              className="w-full px-3 py-2 rounded-[var(--radius)] bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring 2px focus:ring-[var(--accent)] focus:border-transparent"
              disabled={submitting}
            />
          </div>
          <div className="min-w-[100px]">
            <label htmlFor="booter-method" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              Method
            </label>
            <select
              id="booter-method"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full px-3 py-2 rounded-[var(--radius)] bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring 2px focus:ring-[var(--accent)] focus:border-transparent"
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
            className="px-4 py-2 rounded-[var(--radius)] bg-[var(--accent)] text-white font-medium hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Launching…' : 'Launch'}
          </button>
        </form>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-[var(--radius)] bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="content-card">
        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">Recent runs</h3>
        {runs.length === 0 ? (
          <p className="text-[var(--text-muted)] text-sm">No runs yet. Launch a session above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left">
                  <th className="py-2 pr-3 font-semibold text-[var(--text-secondary)]">Target</th>
                  <th className="py-2 pr-3 font-semibold text-[var(--text-secondary)]">Port</th>
                  <th className="py-2 pr-3 font-semibold text-[var(--text-secondary)]">Method</th>
                  <th className="py-2 pr-3 font-semibold text-[var(--text-secondary)]">Duration</th>
                  <th className="py-2 pr-3 font-semibold text-[var(--text-secondary)]">Status</th>
                  <th className="py-2 font-semibold text-[var(--text-secondary)]">Time</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => (
                  <tr key={r.id} className="border-b border-[var(--border-subtle)] last:border-0">
                    <td className="py-2 pr-3 font-mono text-[var(--text-primary)]">{r.target}</td>
                    <td className="py-2 pr-3 text-[var(--text-secondary)]">{r.port}</td>
                    <td className="py-2 pr-3 text-[var(--text-secondary)]">{getMethodLabel(r.method)}</td>
                    <td className="py-2 pr-3 text-[var(--text-secondary)]">{getDurationLabel(r.duration)}</td>
                    <td className="py-2 pr-3">
                      <span
                        className={
                          r.status === 'sent' || r.status === 'running'
                            ? 'text-amber-400'
                            : r.status === 'done'
                              ? 'text-[var(--free)]'
                              : 'text-red-400'
                        }
                      >
                        {r.status === 'sent' ? 'Sent' : r.status === 'running' ? 'Running' : r.status === 'done' ? 'Done' : 'Failed'}
                      </span>
                    </td>
                    <td className="py-2 text-[var(--text-muted)]">{formatTime(r.createdAt)}</td>
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

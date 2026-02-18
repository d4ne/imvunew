import { useState, useEffect, useCallback } from 'react';
import PageHeader from '../components/PageHeader';
import { apiUrl } from '../lib/api';

interface ImageEntry {
  id: string;
  slug: string;
  originalName: string;
  trackingUrl: string;
  hitCount: number;
  createdAt: string;
}

interface HitEntry {
  id: string;
  ip: string | null;
  userAgent: string | null;
  referer: string | null;
  createdAt: string;
}

export default function ImageLogger() {
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [hitsForId, setHitsForId] = useState<string | null>(null);
  const [hits, setHits] = useState<HitEntry[]>([]);
  const [hitsLoading, setHitsLoading] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const fetchImages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiUrl('/api/image-logger'), { credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error?.message || res.status === 503 ? 'Database not configured' : 'Failed to load');
        setImages([]);
        return;
      }
      setImages(data.images || []);
    } catch {
      setError('Failed to load images');
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const fetchHits = useCallback(async (id: string) => {
    setHitsForId(id);
    setHitsLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/image-logger/${id}/hits`), { credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      setHits(res.ok ? data.hits || [] : []);
    } catch {
      setHits([]);
    } finally {
      setHitsLoading(false);
    }
  }, []);

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input?.files?.length) {
      setError('Select an image');
      return;
    }
    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const body = new FormData();
      body.append('image', file);
      const res = await fetch(apiUrl('/api/image-logger'), {
        method: 'POST',
        credentials: 'include',
        body,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error?.message || 'Upload failed');
        return;
      }
      input.value = '';
      await fetchImages();
    } catch {
      setError('Upload failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (id: string) => {
    setRemovingId(id);
    setError(null);
    try {
      const res = await fetch(apiUrl(`/api/image-logger/${id}`), {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error?.message || 'Failed to remove');
        return;
      }
      if (hitsForId === id) setHitsForId(null);
      await fetchImages();
    } catch {
      setError('Failed to remove');
    } finally {
      setRemovingId(null);
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopyFeedback(url);
      setTimeout(() => setCopyFeedback(null), 2000);
    });
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return iso;
    }
  };

  return (
    <div style={{ padding: 'var(--page-padding)' }} className="w-full">
      <PageHeader
        breadcrumbs={['Admin']}
        title="Image Logger"
        subtitle="Upload an image and get a tracking link. When someone opens the link, their IP and details are logged."
      />

      <div className="content-card mb-6">
        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-3">Upload image</h3>
        <form onSubmit={handleUpload} className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px]">
            <label htmlFor="il-file" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              Choose image (JPEG, PNG, GIF, WebP)
            </label>
            <input
              id="il-file"
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp,image/bmp"
              className="w-full px-3 py-2 rounded-[var(--radius)] bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-primary)] file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:bg-[var(--accent)] file:text-white"
              disabled={submitting}
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 rounded-[var(--radius)] bg-[var(--accent)] text-white font-medium hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Uploading…' : 'Upload'}
          </button>
        </form>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-[var(--radius)] bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="content-card">
        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">Tracking images</h3>
        {loading ? (
          <p className="text-[var(--text-muted)] text-sm">Loading…</p>
        ) : images.length === 0 ? (
          <p className="text-[var(--text-muted)] text-sm">No images yet. Upload one to get a tracking link.</p>
        ) : (
          <div className="space-y-4">
            {images.map((img) => (
              <div
                key={img.id}
                className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-tertiary)] p-4"
              >
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <span className="font-medium text-[var(--text-primary)] truncate" title={img.originalName}>
                    {img.originalName}
                  </span>
                  <span className="text-[var(--text-muted)] text-sm">{img.hitCount} hit{img.hitCount !== 1 ? 's' : ''}</span>
                  <span className="text-[var(--text-muted)] text-xs">{formatDate(img.createdAt)}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <input
                    type="text"
                    readOnly
                    value={img.trackingUrl}
                    className="flex-1 min-w-[200px] px-3 py-1.5 rounded bg-[var(--bg-primary)] border border-[var(--border)] text-sm text-[var(--text-secondary)] font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => copyUrl(img.trackingUrl)}
                    className="px-3 py-1.5 rounded-[var(--radius)] bg-[var(--accent-muted)] text-[var(--accent)] text-sm font-medium hover:bg-[var(--accent)] hover:text-white transition-colors"
                  >
                    {copyFeedback === img.trackingUrl ? 'Copied!' : 'Copy link'}
                  </button>
                  <button
                    type="button"
                    onClick={() => fetchHits(img.id)}
                    className="px-3 py-1.5 rounded-[var(--radius)] border border-[var(--border)] text-[var(--text-secondary)] text-sm hover:bg-[var(--bg-elevated)] transition-colors"
                  >
                    View hits
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(img.id)}
                    disabled={removingId === img.id}
                    className="px-3 py-1.5 rounded text-red-400 hover:bg-red-500/10 disabled:opacity-50 text-sm transition-colors"
                  >
                    {removingId === img.id ? '…' : 'Delete'}
                  </button>
                </div>
                {hitsForId === img.id && (
                  <div className="mt-3 pt-3 border-t border-[var(--border)]">
                    {hitsLoading ? (
                      <p className="text-[var(--text-muted)] text-sm">Loading hits…</p>
                    ) : hits.length === 0 ? (
                      <p className="text-[var(--text-muted)] text-sm">No hits yet.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-[var(--border)] text-left">
                              <th className="py-2 pr-3 font-semibold text-[var(--text-secondary)]">IP</th>
                              <th className="py-2 pr-3 font-semibold text-[var(--text-secondary)]">User-Agent</th>
                              <th className="py-2 pr-3 font-semibold text-[var(--text-secondary)]">Referer</th>
                              <th className="py-2 font-semibold text-[var(--text-secondary)]">Time</th>
                            </tr>
                          </thead>
                          <tbody>
                            {hits.map((h) => (
                              <tr key={h.id} className="border-b border-[var(--border-subtle)] last:border-0">
                                <td className="py-2 pr-3 font-mono text-[var(--text-primary)]">{h.ip ?? '—'}</td>
                                <td className="py-2 pr-3 text-[var(--text-secondary)] max-w-[200px] truncate" title={h.userAgent ?? ''}>
                                  {h.userAgent || '—'}
                                </td>
                                <td className="py-2 pr-3 text-[var(--text-muted)] max-w-[180px] truncate" title={h.referer ?? ''}>
                                  {h.referer || '—'}
                                </td>
                                <td className="py-2 text-[var(--text-muted)]">{formatDate(h.createdAt)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
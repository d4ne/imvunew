import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchImages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiUrl('/api/image-logger'), { credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error?.message || (res.status === 503 ? 'Database not configured' : 'Failed to load'));
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed');
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      setError(null);
      setSelectedFile(file);
    } else {
      setSelectedFile(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed');
        return;
      }
      setError(null);
      setSelectedFile(file);
      if (fileInputRef.current) {
        const dt = new DataTransfer();
        dt.items.add(file);
        fileInputRef.current.files = dt.files;
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragOver(false);
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const file = selectedFile;
    if (!file) {
      setError('Choose an image first');
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
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
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

  const formatSize = (bytes: number) =>
    bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <div className="page w-full">
      <PageHeader
        breadcrumbs={['Features']}
        title="Image Logger"
        subtitle="Get a tracking link for any image. Opens are logged with IP and details."
      />

      <div className="dashboard-sections">
        {/* Upload */}
        <section className="dashboard-section il-upload-section">
          <header className="dashboard-section-header">
            <h2 className="dashboard-section-title">Upload</h2>
            <p className="dashboard-section-desc">Add an image to get a shareable tracking link.</p>
          </header>
          <div className="il-upload-card">
            <form
              onSubmit={handleUpload}
              className={`il-upload-zone ${isDragOver ? 'il-upload-zone--over' : ''} ${selectedFile ? 'il-upload-zone--has-file' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <input
                ref={fileInputRef}
                id="il-file"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,image/bmp"
                className="sr-only"
                onChange={handleFileChange}
                disabled={submitting}
              />
              {selectedFile ? (
                <>
                  <div className="il-upload-zone-file">
                    <span className="il-upload-zone-icon il-upload-zone-icon--image" aria-hidden>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                    </span>
                    <div className="il-upload-zone-file-info">
                      <span className="il-upload-zone-filename" title={selectedFile.name}>{selectedFile.name}</span>
                      <span className="il-upload-zone-filesize">{formatSize(selectedFile.size)}</span>
                    </div>
                  </div>
                  <div className="il-upload-zone-actions">
                    <label htmlFor="il-file" className="il-btn il-btn-choose">
                      Change
                    </label>
                    <button type="submit" disabled={submitting} className="il-btn il-btn-upload">
                      {submitting ? 'Uploading…' : 'Upload'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <label htmlFor="il-file" className="il-upload-zone-inner">
                    <span className="il-upload-zone-icon" aria-hidden>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </span>
                    <span className="il-upload-zone-title">Drop an image here or click to browse</span>
                    <span className="il-upload-zone-hint">JPEG, PNG, GIF or WebP</span>
                  </label>
                </>
              )}
            </form>
          </div>
        </section>

        {error && (
          <div className="il-error" role="alert">
            {error}
          </div>
        )}

        {/* List */}
        <section className="dashboard-section il-list-section">
          <header className="dashboard-section-header">
            <h2 className="dashboard-section-title">Tracking images</h2>
            <p className="dashboard-section-desc">Links and hit counts for your uploaded images.</p>
          </header>
          <div className="content-card il-list-card">
            {loading ? (
              <div className="il-loading">
                <span className="il-loading-dot" aria-hidden />
                <span className="il-loading-dot" aria-hidden />
                <span className="il-loading-dot" aria-hidden />
                <span className="il-loading-text">Loading…</span>
              </div>
            ) : images.length === 0 ? (
              <div className="il-empty">
                <span className="il-empty-icon" aria-hidden>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                </span>
                <p className="il-empty-title">No links yet</p>
                <p className="il-empty-desc">Upload an image above to create one. Every open is logged here.</p>
              </div>
            ) : (
              <ul className="il-list">
                {images.map((img) => (
                  <li key={img.id} className="il-item">
                    <div className="il-item-head">
                      <span className="il-item-name" title={img.originalName}>{img.originalName}</span>
                      <span className="il-item-meta">
                        {img.hitCount} hit{img.hitCount !== 1 ? 's' : ''}
                        <span className="il-item-sep" aria-hidden>·</span>
                        <span className="il-item-date">{formatDate(img.createdAt)}</span>
                      </span>
                    </div>
                    <div className="il-item-url-row">
                      <input type="text" readOnly value={img.trackingUrl} className="il-url-input" aria-label="Tracking URL" />
                      <div className="il-item-actions">
                        <button
                          type="button"
                          onClick={() => copyUrl(img.trackingUrl)}
                          className="il-btn il-btn-sm il-btn-copy"
                        >
                          {copyFeedback === img.trackingUrl ? 'Copied' : 'Copy'}
                        </button>
                        <button type="button" onClick={() => fetchHits(img.id)} className="il-btn il-btn-sm il-btn-hits">
                          View hits
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemove(img.id)}
                          disabled={removingId === img.id}
                          className="il-btn il-btn-sm il-btn-delete"
                          aria-label={`Delete ${img.originalName}`}
                        >
                          {removingId === img.id ? '…' : 'Delete'}
                        </button>
                      </div>
                    </div>
                    {hitsForId === img.id && (
                      <div className="il-hits">
                        <p className="il-hits-label">Visitor log</p>
                        {hitsLoading ? (
                          <p className="il-hits-loading">Loading…</p>
                        ) : hits.length === 0 ? (
                          <p className="il-hits-empty">No opens yet.</p>
                        ) : (
                          <div className="il-hits-table-wrap">
                            <table className="il-hits-table">
                              <thead>
                                <tr>
                                  <th>IP</th>
                                  <th>User-Agent</th>
                                  <th>Referer</th>
                                  <th>Time</th>
                                </tr>
                              </thead>
                              <tbody>
                                {hits.map((h) => (
                                  <tr key={h.id}>
                                    <td className="il-cell-ip">{h.ip ?? '—'}</td>
                                    <td className="il-cell-ua" title={h.userAgent ?? ''}>{h.userAgent || '—'}</td>
                                    <td className="il-cell-ref" title={h.referer ?? ''}>{h.referer || '—'}</td>
                                    <td className="il-cell-time">{formatDate(h.createdAt)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

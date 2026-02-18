import { useState, useEffect, useCallback } from 'react';
import PageHeader from '../components/PageHeader';
import { apiUrl } from '../lib/api';

interface DocItem {
  id: string;
  title: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminDocs() {
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiUrl('/api/docs'), { credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error?.message || res.status === 503 ? 'Database not configured' : 'Failed to load docs');
        setDocs([]);
        return;
      }
      setDocs(data.docs || []);
    } catch {
      setError('Failed to load docs');
      setDocs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const clearForm = () => {
    setTitle('');
    setSlug('');
    setContent('');
    setEditingId(null);
  };

  const handleEdit = async (id: string) => {
    try {
      const doc = docs.find((d) => d.id === id);
      if (!doc) return;
      const res = await fetch(apiUrl(`/api/docs/${doc.slug}`), { credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.doc) {
        setError(data?.error?.message || 'Failed to load doc');
        return;
      }
      setTitle(data.doc.title);
      setSlug(data.doc.slug);
      setContent(data.doc.content ?? '');
      setEditingId(id);
      setError(null);
    } catch {
      setError('Failed to load doc');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Title is required');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const url = editingId ? apiUrl(`/api/docs/${editingId}`) : apiUrl('/api/docs');
      const method = editingId ? 'PUT' : 'POST';
      const body = JSON.stringify({
        title: trimmedTitle,
        slug: slug.trim() || undefined,
        content: content,
      });
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error?.message || (editingId ? 'Failed to update' : 'Failed to add'));
        return;
      }
      clearForm();
      await fetchDocs();
    } catch {
      setError(editingId ? 'Failed to update' : 'Failed to add');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setRemovingId(id);
    setError(null);
    try {
      const res = await fetch(apiUrl(`/api/docs/${id}`), {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error?.message || 'Failed to delete');
        return;
      }
      if (editingId === id) clearForm();
      await fetchDocs();
    } catch {
      setError('Failed to delete');
    } finally {
      setRemovingId(null);
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return iso;
    }
  };

  return (
    <div style={{ padding: 'var(--page-padding)' }} className="w-full">
      <PageHeader
        breadcrumbs={['Admin']}
        title="Docs"
        subtitle="Add, edit, and remove documentation pages. They appear on the Docs page."
      />

      <div className="content-card mb-6">
        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">
          {editingId ? 'Edit doc' : 'Add doc'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="doc-title" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              Title
            </label>
            <input
              id="doc-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Getting started"
              className="w-full px-3 py-2 rounded-[var(--radius)] bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring 2px focus:ring-[var(--accent)] focus:border-transparent"
              disabled={submitting}
            />
          </div>
          <div>
            <label htmlFor="doc-slug" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              Slug (URL path, optional — auto-generated from title if empty)
            </label>
            <input
              id="doc-slug"
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. getting-started"
              className="w-full px-3 py-2 rounded-[var(--radius)] bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring 2px focus:ring-[var(--accent)] focus:border-transparent"
              disabled={submitting}
            />
          </div>
          <div>
            <label htmlFor="doc-content" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              Content
            </label>
            <textarea
              id="doc-content"
              rows={12}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your doc content here. Plain text or Markdown."
              className="w-full px-3 py-2 rounded-[var(--radius)] bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring 2px focus:ring-[var(--accent)] focus:border-transparent resize-y"
              disabled={submitting}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-[var(--radius)] bg-[var(--accent)] text-white font-medium hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-colors"
            >
              {submitting ? (editingId ? 'Saving…' : 'Adding…') : editingId ? 'Save changes' : 'Add doc'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={clearForm}
                className="px-4 py-2 rounded-[var(--radius)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-[var(--radius)] bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="content-card">
        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">All docs</h3>
        {loading ? (
          <p className="text-[var(--text-muted)] text-sm">Loading…</p>
        ) : docs.length === 0 ? (
          <p className="text-[var(--text-muted)] text-sm">No docs yet. Add one above.</p>
        ) : (
          <div className="space-y-3">
            {docs.map((doc) => (
              <div
                key={doc.id}
                className="flex flex-wrap items-center gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-tertiary)] p-4"
              >
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-[var(--text-primary)]">{doc.title}</span>
                  <span className="text-[var(--text-muted)] text-sm ml-2">/{doc.slug}</span>
                  <p className="text-[var(--text-muted)] text-xs mt-0.5">{formatDate(doc.updatedAt)}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(doc.id)}
                    className="px-3 py-1.5 rounded-[var(--radius)] border border-[var(--border)] text-[var(--text-secondary)] text-sm hover:bg-[var(--bg-elevated)] transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(doc.id)}
                    disabled={removingId === doc.id}
                    className="px-3 py-1.5 rounded text-red-400 hover:bg-red-500/10 disabled:opacity-50 text-sm transition-colors"
                  >
                    {removingId === doc.id ? '…' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

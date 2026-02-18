import { useState, useEffect, useCallback } from 'react';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
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
      setError('Question is required');
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
    <div className="page w-full">
      <PageHeader
        breadcrumbs={['Admin']}
        title="FAQ"
        subtitle="Add, edit, and remove frequently asked questions. They appear on the FAQ page."
      />

      {error && <div className="admin-error">{error}</div>}

      <div className="dashboard-sections">
        <section className="dashboard-section" style={{ display: 'block', visibility: 'visible' }}>
          <header className="dashboard-section-header">
            <h2 className="dashboard-section-title">{editingId ? 'Edit question' : 'Add question'}</h2>
            <p className="dashboard-section-desc">
              {editingId ? 'Update the question and answer below.' : 'Create a new FAQ entry. Answer supports Markdown.'}
            </p>
          </header>
          <div
            style={{
              display: 'block',
              visibility: 'visible',
              overflow: 'visible',
              background: 'var(--bg-card, #0f0f12)',
              border: '1px solid var(--border, #222228)',
              borderRadius: 'var(--radius-lg, 12px)',
              padding: 'var(--space-6, 1.5rem) var(--space-8, 2rem)',
              minHeight: 60,
            }}
          >
            <form onSubmit={handleSubmit} style={{ display: 'block', width: '100%', visibility: 'visible' }}>
              <div className="ad-field">
                <label htmlFor="doc-title" className="ad-label" style={{ display: 'block', marginBottom: '0.25rem', fontSize: 'var(--text-base, 0.8125rem)', fontWeight: 'var(--font-medium, 500)', color: 'var(--text-secondary, #a1a1aa)' }}>
                  Question
                </label>
                <input
                  id="doc-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. How do I get started?"
                  disabled={submitting}
                  style={{
                    display: 'block',
                    width: '100%',
                    minHeight: 'var(--input-height, 2.25rem)',
                    padding: 'var(--space-2, 0.5rem) var(--space-3, 0.75rem)',
                    fontSize: 'var(--text-md, 0.875rem)',
                    color: 'var(--text-primary, #f4f4f5)',
                    backgroundColor: 'var(--bg-tertiary, #141418)',
                    border: '1px solid var(--border, #222228)',
                    borderRadius: 'var(--radius, 8px)',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div className="ad-field">
                <label htmlFor="doc-slug" className="ad-label" style={{ display: 'block', marginBottom: '0.25rem', fontSize: 'var(--text-base, 0.8125rem)', fontWeight: 'var(--font-medium, 500)', color: 'var(--text-secondary, #a1a1aa)' }}>
                  Slug (optional)
                </label>
                <p className="ad-hint">For direct links. Auto-generated from question if empty.</p>
                <input
                  id="doc-slug"
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. getting-started"
                  disabled={submitting}
                  style={{
                    display: 'block',
                    width: '100%',
                    minHeight: 'var(--input-height, 2.25rem)',
                    padding: 'var(--space-2, 0.5rem) var(--space-3, 0.75rem)',
                    fontSize: 'var(--text-md, 0.875rem)',
                    color: 'var(--text-primary, #f4f4f5)',
                    backgroundColor: 'var(--bg-tertiary, #141418)',
                    border: '1px solid var(--border, #222228)',
                    borderRadius: 'var(--radius, 8px)',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div className="ad-field">
                <label htmlFor="doc-content" className="ad-label" style={{ display: 'block', marginBottom: '0.25rem', fontSize: 'var(--text-base, 0.8125rem)', fontWeight: 'var(--font-medium, 500)', color: 'var(--text-secondary, #a1a1aa)' }}>
                  Answer
                </label>
                <p className="ad-hint">Markdown: **bold**, *italic*, lists, [links](url), headings.</p>
                <div data-color-mode="dark" className="faq-editor-wrap" style={{ display: 'block', visibility: 'visible' }}>
                  <MDEditor
                    id="doc-content"
                    value={content}
                    onChange={(v) => setContent(v ?? '')}
                    height={280}
                    preview="live"
                    hideToolbar={false}
                    visibleDragbar={false}
                    textareaProps={{ placeholder: 'Write the answer in Markdown…', disabled: submitting }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2, 0.5rem)', marginTop: 'var(--space-4, 1rem)' }}>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    display: 'inline-block',
                    minHeight: 'var(--input-height, 2.25rem)',
                    padding: '0.5rem 1rem',
                    backgroundColor: 'var(--accent, #6366f1)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 'var(--radius, 8px)',
                    fontSize: 'var(--text-md, 0.875rem)',
                    fontWeight: 'var(--font-semibold, 600)',
                    cursor: submitting ? 'wait' : 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {submitting ? (editingId ? 'Saving…' : 'Adding…') : editingId ? 'Save changes' : 'Add question'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={clearForm}
                    style={{
                      display: 'inline-block',
                      minHeight: 'var(--input-height, 2.25rem)',
                      padding: '0.5rem 1rem',
                      backgroundColor: 'transparent',
                      color: 'var(--text-secondary, #a1a1aa)',
                      border: '1px solid var(--border, #222228)',
                      borderRadius: 'var(--radius, 8px)',
                      fontSize: 'var(--text-md, 0.875rem)',
                      fontWeight: 'var(--font-semibold, 600)',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </section>

        <section className="dashboard-section">
          <header className="dashboard-section-header">
            <h2 className="dashboard-section-title">All questions</h2>
            <p className="dashboard-section-desc">Edit or delete entries. They appear on the public FAQ page.</p>
          </header>
          <div className="dashboard-card">
            {loading ? (
              <div className="dashboard-card-loading">
                <span className="dashboard-card-loading-dot" />
                <span className="dashboard-card-loading-dot" />
                <span className="dashboard-card-loading-dot" />
              </div>
            ) : docs.length === 0 ? (
              <p className="dashboard-card-empty">No questions yet. Add one above.</p>
            ) : (
              <div className="ad-list">
                {docs.map((doc) => (
                  <div key={doc.id} className="ad-item">
                    <div className="ad-item-main">
                      <span className="ad-item-title">{doc.title}</span>
                      <span className="ad-item-slug">/{doc.slug}</span>
                      <p className="ad-item-meta">{formatDate(doc.updatedAt)}</p>
                    </div>
                    <div className="ad-item-actions">
                      <button type="button" onClick={() => handleEdit(doc.id)} className="ad-btn-edit">
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(doc.id)}
                        disabled={removingId === doc.id}
                        className="ad-btn-delete"
                      >
                        {removingId === doc.id ? '…' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

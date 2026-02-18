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
        <section className="dashboard-section">
          <header className="dashboard-section-header">
            <h2 className="dashboard-section-title">{editingId ? 'Edit question' : 'Add question'}</h2>
            <p className="dashboard-section-desc">
              {editingId ? 'Update the question and answer below.' : 'Create a new FAQ entry. Answer supports Markdown.'}
            </p>
          </header>
          <div className="content-card">
            <form onSubmit={handleSubmit} className="ad-form">
              <div className="ad-field">
                <label htmlFor="doc-title" className="ad-label">Question</label>
                <input
                  id="doc-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. How do I get started?"
                  className="ad-input"
                  disabled={submitting}
                />
              </div>
              <div className="ad-field">
                <label htmlFor="doc-slug" className="ad-label">Slug (optional)</label>
                <p className="ad-hint">For direct links. Auto-generated from question if empty.</p>
                <input
                  id="doc-slug"
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. getting-started"
                  className="ad-input"
                  disabled={submitting}
                />
              </div>
              <div className="ad-field">
                <label htmlFor="doc-content" className="ad-label">Answer</label>
                <p className="ad-hint">Markdown: **bold**, *italic*, lists, [links](url), headings.</p>
                <div data-color-mode="dark" className="faq-editor-wrap">
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
              <div className="ad-actions">
                <button type="submit" disabled={submitting} className="ad-btn">
                  {submitting ? (editingId ? 'Saving…' : 'Adding…') : editingId ? 'Save changes' : 'Add question'}
                </button>
                {editingId && (
                  <button type="button" onClick={clearForm} className="ad-btn ad-btn-cancel">
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

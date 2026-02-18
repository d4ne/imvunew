import { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { apiUrl } from '../lib/api';

interface DocListItem {
  id: string;
  title: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

interface DocDetail {
  id: string;
  title: string;
  slug: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export default function Docs() {
  const { slug } = useParams<{ slug: string }>();
  const [list, setList] = useState<DocListItem[]>([]);
  const [doc, setDoc] = useState<DocDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchList = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(apiUrl('/api/docs'), { credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setList([]);
        return;
      }
      setList(data.docs || []);
    } catch {
      setList([]);
    }
  }, []);

  const fetchDoc = useCallback(
    async (s: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(apiUrl(`/api/docs/${encodeURIComponent(s)}`), { credentials: 'include' });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setDoc(null);
          setError(data?.error?.message || 'Doc not found');
          return;
        }
        setDoc(data.doc || null);
      } catch {
        setDoc(null);
        setError('Failed to load doc');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    if (slug) {
      fetchDoc(slug);
    } else {
      setDoc(null);
      setError(null);
      setLoading(false);
    }
  }, [slug, fetchDoc]);

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return iso;
    }
  };

  // Single doc view
  if (slug) {
    return (
      <div style={{ padding: 'var(--page-padding)' }} className="w-full">
        <PageHeader
          breadcrumbs={['Support', 'Docs']}
          title={doc?.title ?? slug}
          subtitle={doc ? formatDate(doc.updatedAt) : undefined}
        />
        {loading ? (
          <p className="text-[var(--text-muted)] text-sm">Loading…</p>
        ) : error ? (
          <div className="content-card">
            <p className="text-red-400 text-sm">{error}</p>
            <Link to="/docs" className="inline-block mt-3 text-[var(--accent)] hover:underline text-sm">
              ← Back to docs
            </Link>
          </div>
        ) : doc ? (
          <div className="content-card">
            <div
              className="prose-doc text-[var(--text-primary)] whitespace-pre-wrap break-words"
              style={{ maxWidth: '70ch' }}
            >
              {doc.content}
            </div>
            <Link to="/docs" className="inline-block mt-6 text-[var(--accent)] hover:underline text-sm">
              ← Back to docs
            </Link>
          </div>
        ) : null}
      </div>
    );
  }

  // List view
  return (
    <div style={{ padding: 'var(--page-padding)' }} className="w-full">
      <PageHeader
        breadcrumbs={['Support']}
        title="Docs"
        subtitle="Documentation and guides"
      />
      <div className="content-card">
        {list.length === 0 ? (
          <p className="text-[var(--text-muted)] text-sm">No docs yet.</p>
        ) : (
          <ul className="space-y-2">
            {list.map((d) => (
              <li key={d.id}>
                <Link
                  to={`/docs/${d.slug}`}
                  className="block rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-tertiary)] p-3 hover:border-[var(--accent)] hover:bg-[var(--bg-elevated)] transition-colors"
                >
                  <span className="font-medium text-[var(--text-primary)]">{d.title}</span>
                  <span className="text-[var(--text-muted)] text-sm ml-2">/{d.slug}</span>
                  <p className="text-[var(--text-muted)] text-xs mt-1">{formatDate(d.updatedAt)}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

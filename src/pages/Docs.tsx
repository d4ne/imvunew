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

  const docIcon = (
    <svg className="docs-list-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );

  // Single doc view
  if (slug) {
    return (
      <div className="page w-full">
        <div className="docs-back-wrap mb-6">
          <Link to="/docs" className="docs-back-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Docs
          </Link>
        </div>
        {loading ? (
          <div className="max-w-4xl">
            <div className="content-card">
              <p className="text-[var(--text-muted)] text-sm">Loading…</p>
            </div>
          </div>
        ) : error ? (
          <div className="max-w-4xl">
            <div className="content-card">
              <p className="text-red-400 text-sm mb-4">{error}</p>
              <Link to="/docs" className="docs-back-link">
                ← Back to docs
              </Link>
            </div>
          </div>
        ) : doc ? (
          <>
            <header className="docs-article-header mb-6">
              <h1 className="docs-article-title">{doc.title}</h1>
              <p className="docs-article-meta">Updated {formatDate(doc.updatedAt)}</p>
            </header>
            <div className="max-w-4xl">
              <div className="content-card docs-article-card">
                <div className="docs-prose">
                  {doc.content}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    );
  }

  // List view
  return (
    <div className="page w-full">
      <PageHeader
        breadcrumbs={['Support']}
        title="Docs"
        subtitle="Documentation and guides"
      />
      <div className="max-w-4xl">
        {list.length === 0 ? (
          <div className="content-card docs-empty-card">
            <span className="docs-empty-icon">{docIcon}</span>
            <p className="docs-empty-text">No docs yet.</p>
            <p className="docs-empty-hint">Admins can add docs from Admin → Docs.</p>
          </div>
        ) : (
          <div className="quick-grid">
            {list.map((d) => (
              <Link key={d.id} to={`/docs/${d.slug}`} className="quick-card">
                <div className="quick-card-icon-wrap">{docIcon}</div>
                <h4 className="quick-card-label">{d.title}</h4>
                <p className="quick-card-desc">/{d.slug} · {formatDate(d.updatedAt)}</p>
                <span className="quick-card-action">Open</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

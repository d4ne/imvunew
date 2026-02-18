import { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import PageHeader from '../components/PageHeader';
import { apiUrl, fetchWithTimeout } from '../lib/api';

interface FaqItem {
  id: string;
  title: string;
  slug: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export default function Faq() {
  const { slug: slugParam } = useParams<{ slug: string }>();
  const [items, setItems] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const res = await fetchWithTimeout(apiUrl('/api/docs'), {
        credentials: 'include',
        timeoutMs: 12000,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setItems([]);
        setLoading(false);
        return;
      }
      const list = data.docs || [];
      if (list.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }
      const full = await Promise.all(
        list.map(async (d: { slug: string }) => {
          try {
            const r = await fetchWithTimeout(apiUrl(`/api/docs/${encodeURIComponent(d.slug)}`), {
              credentials: 'include',
              timeoutMs: 8000,
            });
            const j = await r.json().catch(() => ({}));
            return r.ok && j.doc ? j.doc : null;
          } catch {
            return null;
          }
        })
      );
      setItems(full.filter(Boolean));
    } catch (e) {
      setItems([]);
      setError(e instanceof Error && e.name === 'AbortError' ? 'Request timed out.' : null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (slugParam) setOpenSlug(slugParam);
  }, [slugParam]);

  const toggle = (slug: string) => {
    setOpenSlug((s) => (s === slug ? null : slug));
  };

  const singleItem = slugParam ? items.find((i) => i.slug === slugParam) : null;

  // Single FAQ view (deep link)
  if (slugParam && !loading && singleItem) {
    return (
      <div className="page w-full">
        <PageHeader
          breadcrumbs={['Support', 'FAQ']}
          title={singleItem.title}
        />
        <div className="dashboard-sections">
          <div className="dashboard-section faq-article-section">
            <Link to="/faq" className="faq-back-link mb-4 inline-flex">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back to FAQ
            </Link>
            <div className="content-card faq-article-card">
              <div className="faq-prose">
                <ReactMarkdown>{singleItem.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (slugParam && !loading && !singleItem) {
    return (
      <div className="page w-full">
        <PageHeader
          breadcrumbs={['Support', 'FAQ']}
          title="FAQ"
          subtitle="Question not found"
        />
        <div className="dashboard-sections">
          <div className="dashboard-section">
            <div className="content-card faq-empty-card">
              <p className="faq-empty-text">The question you’re looking for doesn’t exist or was removed.</p>
              <Link to="/faq" className="faq-back-link mt-2 inline-flex">← Back to FAQ</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main FAQ accordion view
  return (
    <div className="page w-full">
      <PageHeader
        breadcrumbs={['Support']}
        title="FAQ"
        subtitle="Frequently asked questions"
      />
      <div className="dashboard-sections">
        <div className="dashboard-section faq-list-section">
          <header className="dashboard-section-header">
            <h2 className="dashboard-section-title">Questions</h2>
            <p className="dashboard-section-desc">Tap a question to open it.</p>
          </header>
          <div className="w-full">
            {loading ? (
              <div className="content-card faq-loading-card">
                <p className="faq-loading-text">Loading…</p>
              </div>
            ) : error ? (
              <div className="content-card faq-error-card">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            ) : items.length === 0 ? (
              <div className="content-card faq-empty-card">
                <p className="faq-empty-text">No FAQ entries yet.</p>
                <p className="faq-empty-hint">Check back later or contact support if you need help.</p>
              </div>
            ) : (
              <div className="faq-accordion">
                {items.map((item) => {
                  const isOpen = openSlug === item.slug;
                  return (
                    <div key={item.id} className="faq-item">
                      <button
                        type="button"
                        onClick={() => toggle(item.slug)}
                        className="faq-question"
                        aria-expanded={isOpen}
                      >
                        <span className="faq-question-text">{item.title}</span>
                        <span className="faq-question-icon" aria-hidden>
                          {isOpen ? '−' : '+'}
                        </span>
                      </button>
                      <div className="faq-answer-wrap" hidden={!isOpen}>
                        <div className="faq-answer">
                          <ReactMarkdown>{item.content || ''}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

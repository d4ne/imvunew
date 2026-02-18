import { useState, useEffect, useCallback } from 'react';
import PageHeader from '../components/PageHeader';
import { apiUrl } from '../lib/api';

interface ImvuAccount {
  id: string;
  label: string;
  email: string | null;
  imvuUserId: string | null;
  imvuAuthToken: string | null;
  imvuCookie: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TryLoginResult {
  url: string;
  status?: number;
  cookies: string[];
  cookieString?: string;
  body?: { id?: string; denormalized?: Record<string, { data?: { sauce?: string; user?: { id?: string } } }> };
  error?: string;
}

export default function AdminImvuAccounts() {
  const [accounts, setAccounts] = useState<ImvuAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tryUsername, setTryUsername] = useState('');
  const [tryPassword, setTryPassword] = useState('');
  const [tryLoginLoading, setTryLoginLoading] = useState(false);
  const [tryLoginResult, setTryLoginResult] = useState<{ message?: string; results?: TryLoginResult[] } | null>(null);
  const [reauthAccountId, setReauthAccountId] = useState<string | null>(null);
  const [reauthUsername, setReauthUsername] = useState('');
  const [reauthPassword, setReauthPassword] = useState('');
  const [reauthLoading, setReauthLoading] = useState(false);
  const [reauthError, setReauthError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [settingActiveId, setSettingActiveId] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiUrl('/api/imvu-accounts'), { credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error?.message || 'Failed to load accounts');
        return;
      }
      setAccounts(data.accounts ?? []);
    } catch {
      setError('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    if (!saveSuccess) return;
    const t = setTimeout(() => setSaveSuccess(null), 5000);
    return () => clearTimeout(t);
  }, [saveSuccess]);

  /** Parse try-login result (status 201) into cid, sauce, cookie string */
  function parseLoginResult(first: TryLoginResult): { cid: string; sauce: string; cookieVal: string } | null {
    if (first?.status !== 201 || !first?.body || !(first?.cookieString || first?.cookies?.length)) return null;
    const b = first.body;
    const entry = b?.id && b?.denormalized?.[b.id];
    const entryObj = entry && typeof entry === 'object' && 'data' in entry ? entry : undefined;
    const sauce = entryObj?.data?.sauce ?? '';
    const userUrl = entryObj?.data?.user?.id ?? '';
    const cid = userUrl ? (userUrl.match(/\/cid\/(\d+)/)?.[1] ?? userUrl.split('/').pop() ?? '') : '';
    const cookieVal = first.cookieString ?? (first.cookies || []).map((c: string) => c.split(';')[0].trim()).join('; ');
    if (!cid && !sauce && !cookieVal) return null;
    return { cid, sauce, cookieVal };
  }

  /** Create or update account with credentials; returns error message or null on success. For reauth (existingAccountId set) only updates credentials. */
  async function saveAccountFromCredentials(
    label: string,
    cid: string,
    sauce: string,
    cookieVal: string,
    existingAccountId?: string
  ): Promise<string | null> {
    const existing = existingAccountId ? accounts.find((x) => x.id === existingAccountId) : accounts.find((x) => x.imvuUserId === cid);
    const id = existing?.id ?? existingAccountId;
    const url = id ? apiUrl(`/api/imvu-accounts/${id}`) : apiUrl('/api/imvu-accounts');
    const method = id ? 'PATCH' : 'POST';
    const body = id
      ? { imvuUserId: cid || undefined, imvuAuthToken: sauce || undefined, imvuCookie: cookieVal || undefined }
      : { label: label || 'IMVU Account', imvuUserId: cid, imvuAuthToken: sauce, imvuCookie: cookieVal, isActive: true };
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return data?.error?.message ?? 'Failed to save';
    return null;
  }

  const handleSetActive = async (id: string) => {
    setSettingActiveId(id);
    setError(null);
    try {
      const res = await fetch(apiUrl(`/api/imvu-accounts/${id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error?.message || 'Failed to set active');
        return;
      }
      await fetchAccounts();
    } catch {
      setError('Failed to set active');
    } finally {
      setSettingActiveId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this account?')) return;
    setError(null);
    try {
      const res = await fetch(apiUrl(`/api/imvu-accounts/${id}`), {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error?.message || 'Failed to delete');
        return;
      }
      await fetchAccounts();
    } catch {
      setError('Failed to delete');
    }
  };

  const handleTryLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const username = tryUsername.trim();
    const password = tryPassword;
    if (!username || !password) {
      setError('Username and password required for try-login');
      return;
    }
    setTryLoginLoading(true);
    setTryLoginResult(null);
    setError(null);
    setSaveSuccess(null);
    try {
      const res = await fetch(apiUrl('/api/imvu-accounts/try-login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error?.message || 'Try-login failed');
        return;
      }
      setTryLoginResult({
        message: data.message,
        results: data.results,
      });
      // On 201, auto-save account (create or update by cid)
      const first = data.results?.[0];
      const parsed = first ? parseLoginResult(first) : null;
      if (parsed) {
        const label = tryUsername.trim() || 'IMVU Account';
        const err = await saveAccountFromCredentials(label, parsed.cid, parsed.sauce, parsed.cookieVal);
        await fetchAccounts();
        setTryPassword('');
        if (err) setError(err);
        else setSaveSuccess('Account saved automatically.');
      }
    } catch {
      setError('Try-login request failed');
    } finally {
      setTryLoginLoading(false);
    }
  };

  const startReauth = (a: ImvuAccount) => {
    setReauthAccountId(a.id);
    setReauthUsername(a.label);
    setReauthPassword('');
    setReauthError(null);
  };

  const handleReauth = async (e: React.FormEvent, accountId: string) => {
    e.preventDefault();
    const username = reauthUsername.trim();
    const password = reauthPassword;
    if (!username || !password) {
      setReauthError('Username and password required');
      return;
    }
    setReauthLoading(true);
    setReauthError(null);
    try {
      const res = await fetch(apiUrl('/api/imvu-accounts/try-login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));
      const first = data.results?.[0];
      const parsed = first ? parseLoginResult(first) : null;
      if (parsed && first?.status === 201) {
        const err = await saveAccountFromCredentials('', parsed.cid, parsed.sauce, parsed.cookieVal, accountId);
        await fetchAccounts();
        setReauthAccountId(null);
        setReauthPassword('');
        if (err) setReauthError(err);
        else setSaveSuccess('Account reauthenticated.');
      } else {
        setReauthError(first?.body ? 'Login failed (check credentials)' : data?.error?.message ?? 'Reauthenticate failed');
      }
    } catch {
      setReauthError('Request failed');
    } finally {
      setReauthLoading(false);
    }
  };

  return (
    <div className="page w-full">
      <PageHeader
        breadcrumbs={['Admin']}
        title="IMVU Accounts"
        subtitle="Bot accounts for the room scanner. Add credentials (user ID, auth token, cookie) or try login below. Only one account can be active."
      />

      {error && <div className="admin-error">{error}</div>}
      {saveSuccess && <div className="mb-4 p-3 rounded bg-green-600/20 text-green-600 dark:text-green-400">{saveSuccess}</div>}

      <div className="dashboard-sections">
        <section className="dashboard-section">
          <header className="dashboard-section-header">
            <h2 className="dashboard-section-title">Try login (get cookie)</h2>
            <p className="dashboard-section-desc">
              Log in with your IMVU username and password. The account is saved automatically on success.
            </p>
          </header>
          <div className="content-card">
            <form onSubmit={handleTryLogin} autoComplete="off" style={{ display: 'block', maxWidth: 480 }}>
              <div style={{ marginBottom: 16 }}>
                <label htmlFor="try-username" style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500, color: '#a1a1aa' }}>
                  IMVU username
                </label>
                <input
                  id="try-username"
                  name="username"
                  type="text"
                  autoComplete="off"
                  value={tryUsername}
                  onChange={(e) => setTryUsername(e.target.value)}
                  placeholder="IMVU username"
                  disabled={tryLoginLoading}
                  style={{
                    display: 'block',
                    width: '100%',
                    minHeight: 40,
                    padding: '8px 12px',
                    fontSize: 16,
                    color: '#f4f4f5',
                    background: '#141418',
                    border: '1px solid #222228',
                    borderRadius: 8,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label htmlFor="try-password" style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500, color: '#a1a1aa' }}>
                  Password
                </label>
                <input
                  id="try-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={tryPassword}
                  onChange={(e) => setTryPassword(e.target.value)}
                  placeholder="Password"
                  disabled={tryLoginLoading}
                  style={{
                    display: 'block',
                    width: '100%',
                    minHeight: 40,
                    padding: '8px 12px',
                    fontSize: 16,
                    color: '#f4f4f5',
                    background: '#141418',
                    border: '1px solid #222228',
                    borderRadius: 8,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <p style={{ marginTop: 16, marginBottom: 0 }}>
                <button
                  type="submit"
                  disabled={tryLoginLoading}
                  style={{
                    display: 'inline-block',
                    minWidth: 160,
                    minHeight: 48,
                    padding: '12px 24px',
                    backgroundColor: '#8b5cf6',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: tryLoginLoading ? 'wait' : 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {tryLoginLoading ? 'Trying…' : 'Try login'}
                </button>
              </p>
            </form>
            {tryLoginResult && (
              <div className="mt-4 p-4 rounded bg-[var(--bg-secondary)] text-sm">
                {tryLoginResult.message && <p className="text-[var(--text-muted)] mb-2">{tryLoginResult.message}</p>}
                {tryLoginResult.results?.[0]?.status === 201 && (
                  <p className="mb-2 text-green-600 dark:text-green-400 font-medium">Account saved automatically. Set it as active in the list below or add more accounts.</p>
                )}
                {tryLoginResult.results?.map((r, i) => (
                  <div key={i} className="mb-3 p-2 rounded border border-[var(--border)]">
                    <div><strong>{r.url}</strong> {r.status != null && <span>Status: {r.status}</span>} {r.error && <span className="text-red-500">{r.error}</span>}</div>
                    {r.cookies?.length > 0 && (
                      <pre className="mt-1 text-xs overflow-auto max-h-24">{r.cookies.join('\n')}</pre>
                    )}
                    {r.body != null && <pre className="mt-1 text-xs overflow-auto max-h-20">{JSON.stringify(r.body, null, 2)}</pre>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="dashboard-section">
          <header className="dashboard-section-header">
            <h2 className="dashboard-section-title">Accounts</h2>
            <p className="dashboard-section-desc">Use Try login above to add accounts. Set active, reauthenticate, or delete below.</p>
          </header>
          <div className="content-card">
            {loading ? (
              <div className="dashboard-card-loading" style={{ padding: '2rem' }}>
                <span className="dashboard-card-loading-dot" />
                <span className="dashboard-card-loading-dot" />
                <span className="dashboard-card-loading-dot" />
              </div>
            ) : accounts.length === 0 ? (
              <p className="text-[var(--text-muted)]">No accounts yet. Use Try login above to add one.</p>
            ) : (
              <ul className="space-y-2 list-none p-0 m-0">
                {accounts.map((a) => (
                  <li key={a.id} className="rounded-md border border-[var(--border)] overflow-hidden">
                    <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr_auto] gap-x-4 gap-y-2 sm:gap-y-0 sm:items-center p-3">
                      <div className="flex flex-wrap items-center gap-2 min-w-0">
                        <span className="font-medium truncate">{a.label}</span>
                        {a.isActive && <span className="text-xs px-2 py-0.5 rounded bg-green-600/20 text-green-400 shrink-0">Active</span>}
                        {a.email && <span className="text-sm text-[var(--text-muted)] truncate">{a.email}</span>}
                        {a.imvuUserId && <span className="text-xs text-[var(--text-muted)]">ID: {a.imvuUserId}</span>}
                      </div>
                      <div className="flex items-center justify-end gap-2 order-last sm:order-none flex-wrap">
                        {!a.isActive && (
                          <button type="button" onClick={() => handleSetActive(a.id)} disabled={settingActiveId !== null} className="ad-btn-edit whitespace-nowrap">
                            {settingActiveId === a.id ? 'Setting…' : 'Set as active'}
                          </button>
                        )}
                        <button type="button" onClick={() => startReauth(a)} className="ad-btn-edit whitespace-nowrap" disabled={reauthAccountId !== null && reauthAccountId !== a.id}>Reauthenticate</button>
                        <button type="button" onClick={() => handleDelete(a.id)} className="ad-btn-delete whitespace-nowrap">Delete</button>
                      </div>
                    </div>
                    {reauthAccountId === a.id && (
                      <form onSubmit={(e) => handleReauth(e, a.id)} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end p-3 pt-0 border-t border-[var(--border)] bg-[var(--bg-secondary)]/50">
                        <div className="min-w-0">
                          <label htmlFor={`reauth-username-${a.id}`} className="ad-label text-sm">Username</label>
                          <input id={`reauth-username-${a.id}`} type="text" autoComplete="off" value={reauthUsername} onChange={(e) => setReauthUsername(e.target.value)} className="ad-input h-9 w-full" disabled={reauthLoading} />
                        </div>
                        <div className="min-w-0">
                          <label htmlFor={`reauth-password-${a.id}`} className="ad-label text-sm">Password</label>
                          <input id={`reauth-password-${a.id}`} type="password" autoComplete="new-password" value={reauthPassword} onChange={(e) => setReauthPassword(e.target.value)} className="ad-input h-9 w-full" disabled={reauthLoading} />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <button type="submit" disabled={reauthLoading} className="ad-btn-edit h-9 px-3">{reauthLoading ? 'Logging in…' : 'Reauthenticate'}</button>
                          <button type="button" onClick={() => { setReauthAccountId(null); setReauthError(null); }} className="ad-btn-edit h-9 px-3">Cancel</button>
                          {reauthError && <span className="text-red-500 text-sm self-center">{reauthError}</span>}
                        </div>
                      </form>
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

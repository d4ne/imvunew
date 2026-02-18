const raw = (import.meta.env.VITE_API_URL ?? '').trim();
// Ignore misconfigured values (e.g. whole .env line pasted, or "VITE_API_URL=...")
const API_BASE =
  raw &&
  !raw.includes('VITE_API_URL=') &&
  (raw.startsWith('http://') || raw.startsWith('https://'))
    ? raw.replace(/\/+$/, '')
    : '';

export function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return API_BASE ? `${API_BASE}${p}` : p;
}

export async function fetchApi<T = unknown>(
  path: string,
  options?: RequestInit
): Promise<{ data?: T; success: boolean; error?: { message: string } }> {
  const url = apiUrl(path);
  const res = await fetch(url, { ...options, credentials: 'include' });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { success: false, error: json?.error || { message: res.statusText } };
  }
  return { ...json, success: json.success !== false };
}

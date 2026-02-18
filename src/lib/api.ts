/** API base URL. In browser always use current origin so production works like localhost (same-origin). */
function getApiBase(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  const raw = (import.meta.env.VITE_API_URL ?? '').trim();
  if (raw && !raw.includes('VITE_API_URL=') && (raw.startsWith('http://') || raw.startsWith('https://'))) {
    return raw.replace(/\/+$/, '');
  }
  return '';
}

export function apiUrl(path: string): string {
  const base = getApiBase();
  const p = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}

const FETCH_TIMEOUT_MS = 15000;

/** Fetch with timeout so UI doesn't hang forever when API is unreachable (e.g. wrong VITE_API_URL). */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeoutMs?: number } = {}
): Promise<Response> {
  const { timeoutMs = FETCH_TIMEOUT_MS, ...init } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
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

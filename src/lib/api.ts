const API_BASE = import.meta.env.VITE_API_URL ?? '';

export function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return API_BASE ? `${API_BASE.replace(/\/$/, '')}${p}` : p;
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

// Thin typed client for the NutriCare Laravel API (Bearer token via localStorage).

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

const TOKEN_KEY = 'nutricare_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  errors: Record<string, string[]>;

  constructor(status: number, message: string, errors: Record<string, string[]> = {}) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

export async function api<T>(
  path: string,
  options: RequestInit & { locale?: string } = {},
): Promise<T> {
  const { locale, ...init } = options;
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (locale) headers.set('Accept-Language', locale);

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });

  if (res.status === 204) return undefined as T;

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON body */
  }

  if (!res.ok) {
    const obj = (data ?? {}) as { message?: string; errors?: Record<string, string[]> };
    throw new ApiError(res.status, obj.message ?? `Request failed (${res.status})`, obj.errors ?? {});
  }

  return data as T;
}

/** GET/POST helpers that unwrap Laravel's {data: ...} envelope when present. */
export async function apiData<T>(
  path: string,
  options: RequestInit & { locale?: string } = {},
): Promise<T> {
  const raw = await api<{ data?: T } & Record<string, unknown>>(path, options);
  return (raw?.data ?? raw) as T;
}

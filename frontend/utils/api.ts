import { getToken } from './auth';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

type FetchOptions = Omit<RequestInit, 'body'> & {
  body?: Record<string, unknown> | undefined;
};

/**
 * Thin fetch wrapper that:
 *  1. Prefixes every path with the API base URL
 *  2. Pulls the JWT from SecureStore and sets the Authorization header
 *  3. Serialises the body as JSON when present
 *  4. Throws a typed ApiError on non-2xx responses
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function api<T = unknown>(
  path: string,
  { body, headers: extra, ...rest }: FetchOptions = {},
): Promise<T> {
  const token = await getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((extra as Record<string, string>) ?? {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const err = json?.error ?? {};
    throw new ApiError(
      res.status,
      err.code ?? 'UNKNOWN',
      err.message ?? `Request failed with status ${res.status}`,
    );
  }

  return json as T;
}

import { requestSignIn } from '@/stores/useAuthPrompt';
import { useAuthStore } from '@/stores/useAuthStore';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Where sessions used to keep their token, before the HttpOnly cookie. Only
 * read once, to move an existing session into the cookie (useSessionBootstrap).
 */
export const LEGACY_TOKEN_KEY = 'cft.authToken';

/** Changes that don't need an account (signing in, password reset, ...). */
const ANONYMOUS_OK = /^\/(auth|me\/email\/confirm)\b/;

async function request<T>(path: string, init?: RequestInit, retried = false): Promise<T> {
  const unsafe = (init?.method ?? 'GET') !== 'GET' && !ANONYMOUS_OK.test(path);
  // Browsing works signed out; doing something asks to sign in first and
  // then carries on (the modal is app/layout/AuthPrompt).
  if (unsafe && useAuthStore.getState().status === 'anonymous') await requestSignIn();

  // The session is an HttpOnly cookie the browser sends by itself; page
  // scripts never see the token.
  const res = await fetch(`/api${path}`, {
    ...init,
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
  // The session ran out (or was signed out elsewhere) while the page was open.
  if (
    res.status === 401 &&
    unsafe &&
    !retried &&
    useAuthStore.getState().status === 'authenticated'
  ) {
    useAuthStore.getState().setAnonymous();
    return request<T>(path, init, true);
  }
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = (await res.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      // keep statusText
    }
    throw new ApiError(res.status, message);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'DELETE',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
};

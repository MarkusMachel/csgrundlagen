import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { api, LEGACY_TOKEN_KEY } from '@/shared/api/client';
import type { Locale, User } from '@/shared/types';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';

interface LoginResponse {
  user: User;
}

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      api.post<LoginResponse>('/auth/login', credentials),
    onSuccess: ({ user }) => setSession(user),
  });
}

export interface SignUpInput {
  name: string;
  email: string;
  password: string;
  locale?: string;
  /** The user agreed to the privacy policy; the API refuses sign-ups without it. */
  acceptPrivacy: boolean;
}

/** Creates an account and starts a session, like a login. */
export function useSignUp() {
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation({
    mutationFn: (input: SignUpInput) => api.post<LoginResponse>('/auth/signup', input),
    onSuccess: ({ user }) => setSession(user),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: { currentPassword: string; newPassword: string }) =>
      api.post<void>('/auth/password', input),
  });
}

/** Always succeeds for a well-formed email, whether or not it has an account. */
export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (email: string) => api.post<{ message: string }>('/auth/password-reset', { email }),
  });
}

export function useConfirmPasswordReset() {
  return useMutation({
    mutationFn: (input: { token: string; password: string }) =>
      api.post<void>('/auth/password-reset/confirm', input),
  });
}

export function useLogout() {
  const clearSession = useAuthStore((s) => s.clearSession);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<void>('/auth/logout'),
    onSettled: () => {
      clearSession();
      queryClient.clear();
    },
  });
}

/**
 * Moves a session from before the cookie (token in localStorage) into the
 * HttpOnly cookie, then forgets the stored token. Runs once per browser.
 */
async function migrateLegacyToken() {
  let token: string | null = null;
  try {
    token = localStorage.getItem(LEGACY_TOKEN_KEY);
  } catch {
    return;
  }
  if (!token) return;
  try {
    await fetch('/api/auth/cookie', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    // offline or expired: the user signs in again
  }
  try {
    localStorage.removeItem(LEGACY_TOKEN_KEY);
  } catch {
    // ignore
  }
}

/**
 * Restores the session on app start: the browser sends the session cookie,
 * so /auth/me tells us who is signed in (401 = nobody).
 */
export function useSessionBootstrap() {
  const status = useAuthStore((s) => s.status);
  const setSession = useAuthStore((s) => s.setSession);
  const setAnonymous = useAuthStore((s) => s.setAnonymous);

  useEffect(() => {
    if (status !== 'unknown') return;
    void migrateLegacyToken()
      .then(() => api.get<User>('/auth/me'))
      .then((user) => setSession(user))
      .catch(() => setAnonymous());
  }, [status, setSession, setAnonymous]);

  return status;
}

export interface ProfileInput {
  name?: string;
  locale?: Locale;
}

/** Saves name and/or language to the account and applies them right away. */
export function useUpdateProfile() {
  return useMutation({
    mutationFn: (input: ProfileInput) => api.patch<User>('/me', input),
    onSuccess: (user) => {
      useAuthStore.setState({ user });
      useUIStore.getState().setLocale(user.locale);
    },
  });
}

/** Sends a confirmation link to the new address; nothing changes until it's opened. */
export function useRequestEmailChange() {
  return useMutation({
    mutationFn: (input: { email: string; password: string }) =>
      api.post<{ email: string }>('/me/email', input),
  });
}

export function useConfirmEmailChange() {
  return useMutation({
    mutationFn: (token: string) => api.post<User>('/me/email/confirm', { token }),
    onSuccess: (user) => {
      // the link may be opened in a browser where someone else is signed in
      const current = useAuthStore.getState().user;
      if (current?.id === user.id) useAuthStore.setState({ user });
    },
  });
}

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { api, AUTH_TOKEN_KEY } from '@/shared/api/client';
import type { User } from '@/shared/types';
import { useAuthStore } from '@/stores/useAuthStore';

interface LoginResponse {
  token: string;
  user: User;
}

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      api.post<LoginResponse>('/auth/login', credentials),
    onSuccess: ({ token, user }) => setSession(user, token),
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
    onSuccess: ({ token, user }) => setSession(user, token),
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
 * Restores the mock session on app start: if a token stub is in localStorage,
 * ask /auth/me who we are; otherwise mark the visitor anonymous.
 */
export function useSessionBootstrap() {
  const status = useAuthStore((s) => s.status);
  const setSession = useAuthStore((s) => s.setSession);
  const setAnonymous = useAuthStore((s) => s.setAnonymous);

  useEffect(() => {
    if (status !== 'unknown') return;
    let token: string | null = null;
    try {
      token = localStorage.getItem(AUTH_TOKEN_KEY);
    } catch {
      // storage unavailable
    }
    if (!token) {
      setAnonymous();
      return;
    }
    api
      .get<User>('/auth/me')
      .then((user) => setSession(user, token))
      .catch(() => setAnonymous());
  }, [status, setSession, setAnonymous]);

  return status;
}

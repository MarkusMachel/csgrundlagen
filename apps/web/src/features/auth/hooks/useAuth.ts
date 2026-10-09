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

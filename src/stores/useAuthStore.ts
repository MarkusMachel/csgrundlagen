import { create } from 'zustand';

import { AUTH_TOKEN_KEY } from '@/shared/api/client';
import type { User } from '@/shared/types';

interface AuthState {
  user: User | null;
  status: 'unknown' | 'authenticated' | 'anonymous';
  setSession: (user: User, token: string) => void;
  setAnonymous: () => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  status: 'unknown',
  setSession: (user, token) => {
    try {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    } catch {
      // storage unavailable — session stays in-memory only
    }
    set({ user, status: 'authenticated' });
  },
  setAnonymous: () => set({ user: null, status: 'anonymous' }),
  clearSession: () => {
    try {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    } catch {
      // ignore
    }
    set({ user: null, status: 'anonymous' });
  },
}));

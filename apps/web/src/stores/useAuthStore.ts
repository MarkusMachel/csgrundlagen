import { create } from 'zustand';

import { AUTH_TOKEN_KEY } from '@/shared/api/client';
import { clearApiCache } from '@/shared/offline/registerServiceWorker';
import type { User } from '@/shared/types';


import { useUIStore } from './useUIStore';

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
    // The account's language wins over the browser's on every sign-in.
    if (user.locale) useUIStore.getState().setLocale(user.locale);
    set({ user, status: 'authenticated' });
  },
  setAnonymous: () => set({ user: null, status: 'anonymous' }),
  clearSession: () => {
    try {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    } catch {
      // ignore
    }
    // cached API responses belong to this user; don't leave them for the next one
    void clearApiCache();
    set({ user: null, status: 'anonymous' });
  },
}));

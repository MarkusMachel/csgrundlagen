import { create } from 'zustand';

import { clearApiCache } from '@/shared/offline/registerServiceWorker';
import type { User } from '@/shared/types';

import { useUIStore } from './useUIStore';

interface AuthState {
  user: User | null;
  status: 'unknown' | 'authenticated' | 'anonymous';
  setSession: (user: User) => void;
  setAnonymous: () => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  status: 'unknown',
  // The session itself is an HttpOnly cookie set by the API; nothing to store here.
  setSession: (user) => {
    // The account's language wins over the browser's on every sign-in.
    if (user.locale) useUIStore.getState().setLocale(user.locale);
    set({ user, status: 'authenticated' });
  },
  setAnonymous: () => set({ user: null, status: 'anonymous' }),
  clearSession: () => {
    // cached API responses belong to this user; don't leave them for the next one
    void clearApiCache();
    set({ user: null, status: 'anonymous' });
  },
}));

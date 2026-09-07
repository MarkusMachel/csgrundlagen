import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { Locale } from '@/shared/types';
import type { ThemeMode } from '@/theme/theme';

interface UIState {
  themeMode: ThemeMode;
  locale: Locale;
  sidebarCollapsed: boolean;
  mobileDrawerOpen: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  toggleThemeMode: () => void;
  setLocale: (locale: Locale) => void;
  toggleSidebar: () => void;
  setMobileDrawerOpen: (open: boolean) => void;
}

function systemThemeMode(): ThemeMode {
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      themeMode: systemThemeMode(),
      locale: 'en',
      sidebarCollapsed: false,
      mobileDrawerOpen: false,
      setThemeMode: (themeMode) => set({ themeMode }),
      toggleThemeMode: () =>
        set((s) => ({ themeMode: s.themeMode === 'light' ? 'dark' : 'light' })),
      setLocale: (locale) => set({ locale }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setMobileDrawerOpen: (mobileDrawerOpen) => set({ mobileDrawerOpen }),
    }),
    {
      name: 'cft.ui',
      partialize: (s) => ({
        themeMode: s.themeMode,
        locale: s.locale,
        sidebarCollapsed: s.sidebarCollapsed,
      }),
    },
  ),
);

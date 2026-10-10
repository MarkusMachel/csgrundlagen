import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { consentAwareStorage } from '@/features/privacy/consentStorage';
import type { Locale } from '@/shared/types';
import type { ThemeMode } from '@/theme/theme';

interface UIState {
  themeMode: ThemeMode;
  locale: Locale;
  /** Session answer streak (consecutive correct submits) — shown in the status bar. */
  streak: number;
  /** Context line for the status bar, set by the active page (e.g. "question 4 of 20"). */
  statusText: string | null;
  /** Progress dashes for the status bar (answered/unanswered), set by Take Test. */
  statusDots: boolean[] | null;
  setThemeMode: (mode: ThemeMode) => void;
  toggleThemeMode: () => void;
  setLocale: (locale: Locale) => void;
  recordAnswerResult: (correct: boolean) => void;
  setStatus: (text: string | null, dots?: boolean[] | null) => void;
  /** The getting-started panel was closed (this page load only). */
  welcomeHidden: boolean;
  hideWelcome: () => void;
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
      streak: 0,
      statusText: null,
      statusDots: null,
      welcomeHidden: false,
      hideWelcome: () => set({ welcomeHidden: true }),
      setThemeMode: (themeMode) => set({ themeMode }),
      toggleThemeMode: () =>
        set((s) => ({ themeMode: s.themeMode === 'light' ? 'dark' : 'light' })),
      setLocale: (locale) => set({ locale }),
      recordAnswerResult: (correct) => set((s) => ({ streak: correct ? s.streak + 1 : 0 })),
      setStatus: (statusText, statusDots = null) => set({ statusText, statusDots }),
    }),
    {
      name: 'cft.ui',
      // Only remembered with "preferences" consent (see features/privacy).
      storage: createJSONStorage(() => consentAwareStorage),
      partialize: (s) => ({ themeMode: s.themeMode, locale: s.locale }),
    },
  ),
);

import { CssBaseline, ThemeProvider } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import { initI18n } from '@/i18n/config';
import { useUIStore } from '@/stores/useUIStore';
import { buildTheme } from '@/theme/theme';

export function createAppQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false },
    },
  });
}

export function AppProviders({ children }: { children: ReactNode }) {
  const themeMode = useUIStore((s) => s.themeMode);
  const locale = useUIStore((s) => s.locale);

  const [queryClient] = useState(createAppQueryClient);
  const i18n = useMemo(() => initI18n(locale), [locale]);

  useEffect(() => {
    if (i18n.language !== locale) void i18n.changeLanguage(locale);
  }, [i18n, locale]);

  const theme = useMemo(() => buildTheme(themeMode), [themeMode]);

  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
}

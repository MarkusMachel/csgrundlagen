import { ThemeProvider } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';

import { initI18n } from '@/i18n/config';
import { AUTH_TOKEN_KEY } from '@/shared/api/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { buildTheme } from '@/theme/theme';

/** Establishes an authenticated mock session for the demo user (u1). */
export function loginAsDemo() {
  localStorage.setItem(AUTH_TOKEN_KEY, 'mock-token.u1');
  useAuthStore.setState({
    user: { id: 'u1', name: 'Demo User', email: 'demo@example.com', locale: 'en' },
    status: 'authenticated',
  });
}

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

export function renderWithProviders(
  ui: ReactElement,
  { route = '/', ...options }: RenderOptions & { route?: string } = {},
) {
  const queryClient = createTestQueryClient();
  const i18n = initI18n('en');

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <ThemeProvider theme={buildTheme('light')}>
            <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
          </ThemeProvider>
        </I18nextProvider>
      </QueryClientProvider>
    );
  }

  return { queryClient, ...render(ui, { wrapper: Wrapper, ...options }) };
}

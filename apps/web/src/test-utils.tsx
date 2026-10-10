import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';

import { PRIVACY_POLICY_VERSION } from '@/features/privacy/consent';
import { initI18n } from '@/i18n/config';
import { AUTH_TOKEN_KEY } from '@/shared/api/client';
import { useAuthStore } from '@/stores/useAuthStore';

/** Establishes an authenticated mock session for the demo user (u1). */
export function loginAsDemo() {
  localStorage.setItem(AUTH_TOKEN_KEY, 'mock-token.u1');
  useAuthStore.setState({
    user: {
      id: 'u1',
      name: 'Demo User',
      email: 'demo@example.com',
      locale: 'en',
      role: 'admin',
      privacyVersion: PRIVACY_POLICY_VERSION,
    },
    status: 'authenticated',
  });
}

/** Establishes a session for a non-admin user (u2). */
export function loginAsRegularUser() {
  localStorage.setItem(AUTH_TOKEN_KEY, 'mock-token.u2');
  useAuthStore.setState({
    user: {
      id: 'u2',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      locale: 'en',
      role: 'user',
      privacyVersion: PRIVACY_POLICY_VERSION,
    },
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
          <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
        </I18nextProvider>
      </QueryClientProvider>
    );
  }

  return { queryClient, ...render(ui, { wrapper: Wrapper, ...options }) };
}

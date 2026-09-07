import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Preview } from '@storybook/react';
import React from 'react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';

import { initI18n } from '../src/i18n/config';
import { worker } from '../src/mocks/browser';
import { AUTH_TOKEN_KEY } from '../src/shared/api/client';
import { buildTheme } from '../src/theme/theme';

// Stories run against the same MSW mocks as the app, with a signed-in demo user.
localStorage.setItem(AUTH_TOKEN_KEY, 'mock-token.u1');
const workerReady = worker.start({ onUnhandledRequest: 'bypass' });

const i18n = initI18n('en');

const preview: Preview = {
  loaders: [async () => ({ workerReady: await workerReady })],
  decorators: [
    (Story) => (
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <I18nextProvider i18n={i18n}>
          <ThemeProvider theme={buildTheme('light')}>
            <CssBaseline />
            <MemoryRouter>
              <Story />
            </MemoryRouter>
          </ThemeProvider>
        </I18nextProvider>
      </QueryClientProvider>
    ),
  ],
};

export default preview;

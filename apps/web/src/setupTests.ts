import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';

import { useConsentStore } from './features/privacy/consent';
import { resetDb } from './mocks/db';
import { server } from './mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

afterEach(() => {
  cleanup();
  server.resetHandlers();
  resetDb();
  localStorage.clear();
  useConsentStore.setState({ choice: null, settingsOpen: false });
});

afterAll(() => server.close());

import { defineConfig } from 'vitest/config';

import base from './vite.config';

// The mocks-vs-API contract check (npm run contract); not part of `npm test`.
export default defineConfig({
  ...base,
  test: {
    ...base.test,
    include: ['src/contract/**/*.contract.ts'],
    setupFiles: [],
  },
});

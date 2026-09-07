import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app/App';

// There is no real backend: MSW serves /api in every browser context
// (dev, preview, and the app under Playwright E2E) — §2, §13.3.
async function enableMocking() {
  const { worker } = await import('./mocks/browser');
  await worker.start({ onUnhandledRequest: 'bypass' });
}

void enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});

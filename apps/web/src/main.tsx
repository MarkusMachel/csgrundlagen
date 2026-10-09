import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app/App';
import './styles/global.css';

// MSW serves /api by default (dev, preview, and Playwright E2E). Set
// VITE_USE_MOCKS=false (`npm run dev:real`) to talk to the Go API instead,
// which the Vite dev server proxies at /api.
async function enableMocking() {
  if (import.meta.env.VITE_USE_MOCKS === 'false') return;
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

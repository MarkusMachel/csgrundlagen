/**
 * Installs the offline service worker (public/sw.js) in production builds.
 * Not in mock mode: the MSW worker already holds the same scope, and a
 * scope has room for one worker.
 */
export function registerServiceWorker() {
  if (!import.meta.env.PROD || import.meta.env.VITE_USE_MOCKS !== 'false') return;
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // offline support is a bonus; the app works without it
    });
  });
}

/** Forgets cached API responses, so the next person on this device can't read them. */
export async function clearApiCache() {
  navigator.serviceWorker?.controller?.postMessage('clear-api-cache');
  if (typeof caches !== 'undefined') await caches.delete('cft-api');
}

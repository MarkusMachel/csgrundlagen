/*
 * Offline support for the trainer (registered only in production builds;
 * see src/shared/offline/registerServiceWorker.ts).
 *
 *   /assets/*     cache first: file names carry a content hash, so a cached
 *                 copy is always the right one
 *   pages         network first, falling back to the cached app shell, so a
 *                 new deploy is picked up as soon as there is a connection
 *   GET /api/*    network first, falling back to the last response: review
 *                 cards and questions already loaded stay readable offline
 *                 (admin, export and session lists are never cached)
 *
 * Answers given offline are queued by the app itself (IndexedDB) and sent
 * when the connection is back; the worker never caches writes.
 */
const VERSION = 'v2'; // v2: new app icon
const SHELL = `cft-shell-${VERSION}`;
const ASSETS = 'cft-assets';
const API = 'cft-api';
const MAX_ASSETS = 80;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((c) => c.addAll(['/', '/manifest.webmanifest', '/icons/icon-192.png']))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k.startsWith('cft-shell-') && k !== SHELL).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

const neverCache = (path) =>
  path.startsWith('/api/admin/') ||
  path === '/api/me/export' ||
  path.startsWith('/api/me/sessions') ||
  path.startsWith('/api/auth/') && path !== '/api/auth/me';

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - max)).map((k) => cache.delete(k)));
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(ASSETS);
    await cache.put(request, response.clone());
    void trim(ASSETS, MAX_ASSETS);
  }
  return response;
}

async function networkFirst(request, cacheName, fallbackUrl) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(fallbackUrl ?? request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(fallbackUrl ?? request);
    if (cached) return cached;
    throw err;
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request));
  } else if (request.mode === 'navigate') {
    // every route is the same single-page app
    event.respondWith(networkFirst(request, SHELL, '/'));
  } else if (url.pathname.startsWith('/api/') && !neverCache(url.pathname)) {
    event.respondWith(networkFirst(request, API));
  }
});

// The app asks for this on sign-out, so the next person can't read cached answers.
self.addEventListener('message', (event) => {
  if (event.data === 'clear-api-cache') event.waitUntil(caches.delete(API));
});

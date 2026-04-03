const CACHE_NAME = 'formiche-v2';
const PRECACHE_URLS = [
  '/',
  '/identifica/',
  '/generi/',
  '/esperti/',
  '/images/placeholder-ant.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) return;

  // Skip non-http(s) requests (e.g., chrome-extension://)
  if (!url.protocol.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        // Only cache valid, successful responses
        // SECURITY: Validate response type and status to prevent cache poisoning
        if (response.ok && response.type === 'basic' && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      });
    }).catch(() => {
      // If both cache and network fail, return offline fallback for HTML
      if (event.request.headers.get('accept')?.includes('text/html')) {
        return caches.match('/');
      }
    })
  );
});

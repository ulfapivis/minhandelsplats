
const CACHE_NAME = 'visualcms-site-1769860697004';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/styles.css',
  './js/scripts.js'
];

// Install event: cache assets and force waiting service worker to become active
self.addEventListener('install', (event) => {
  // Force this service worker to become the active service worker
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
});

// Activate event: clean up old caches and claim clients
self.addEventListener('activate', (event) => {
  // Claim control of all clients immediately
  event.waitUntil(clients.claim());

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event: network first for HTML, cache first for assets
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // For HTML requests (navigation), try network first, fall back to cache
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .catch(() => {
          // Network failed, try cache
          return caches.match(request)
            .then((response) => {
               if (response) return response;
               // If not in cache and network failed, try index.html (SPA fallback) or show offline page
               return caches.match('./index.html');
            });
        })
    );
    return;
  }

  // For other assets, try cache first, fall back to network
  event.respondWith(
    caches.match(request)
      .then((response) => {
        return response || fetch(request);
      })
  );
});

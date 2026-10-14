// site/sw.js
// Field Inspector Progressive Web App (PWA) Service Worker (PRD_v2 Section 18.9)
const CACHE_NAME = 'hotspotwatch-v2-cache';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/app_data.json',
  '/top20.csv'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching offline application assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing obsolete cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Network first with offline cache fallback
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});

// Proximity Warning Notification Handler
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'PROXIMITY_ALERT') {
    self.registration.showNotification('⚠️ Proximity Warning: Hotspot Ahead', {
      body: `You are within 250m of active hotspot #${event.data.rank} (${event.data.name || event.data.cell}).`,
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ef4444"><path d="M12 2L1 21h22L12 2zm0 3.5L20.5 19h-17L12 5.5zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z"/></svg>',
      vibrate: [200, 100, 200]
    });
  }
});

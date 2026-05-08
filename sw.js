/* ============================================================
   Primosmusings Service Worker
   Strategy: Cache-first for app shell, Network-first for dynamic
   ============================================================ */

const CACHE_NAME = 'primosmusings-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png'
];

// ── Install: cache the app shell ──────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// ── Activate: clean up old caches ─────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: cache-first for static, network-first for dynamic ──
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip non-GET and cross-origin (Spotify iframes, Blogger API)
  if (event.request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  // App shell: cache-first
  if (STATIC_ASSETS.some(asset => url.pathname === asset || url.pathname === '/')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        return cached || fetch(event.request).then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          return response;
        });
      })
    );
    return;
  }

  // Everything else: network-first, fall back to cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// ── Push notifications (future use) ───────────────────────────
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Primosmusings';
  const options = {
    body: data.body || 'New episode or pick just dropped!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'primosmusings-notification',
    data: { url: data.url || '/' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});

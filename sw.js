const CACHE_NAME = 'primosmusings-v62';
const STATIC_ASSETS = [
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/logo.jpg'
];

// ── Install: pre-cache icons, take over immediately ───────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: wipe old caches, claim all open tabs ────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Network-first fetch with timeout (avoids hanging on slow mobile) ──
function networkFirst(request, timeoutMs) {
  return new Promise((resolve, reject) => {
    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        caches.match(request).then(cached => {
          cached ? resolve(cached) : reject(new Error('timeout + no cache'));
        });
      }
    }, timeoutMs);

    fetch(request).then(response => {
      clearTimeout(timer);
      if (!settled) {
        settled = true;
        const clone = response.clone();
        caches.open(CACHE_NAME).then(c => c.put(request, clone));
        resolve(response);
      }
    }).catch(err => {
      clearTimeout(timer);
      if (!settled) {
        settled = true;
        caches.match(request).then(cached => {
          cached ? resolve(cached) : reject(err);
        });
      }
    });
  });
}

// ── Fetch strategy ────────────────────────────────────────────
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Cross-origin (Spotify, RSS, Blogger) — always network, no cache
  if (url.origin !== self.location.origin) return;

  // Pages, including folder addresses like /daily/ and /episodes/, are always
  // fetched fresh. Without the endsWith('/') and navigate checks, those folder
  // pages fell through to cache-first below and stayed stale.
  const isHTML = event.request.mode === 'navigate' ||
                 url.pathname.endsWith('/') || url.pathname.endsWith('.html');
  const isManifest = url.pathname.endsWith('manifest.json');

  if (isHTML || isManifest) {
    // Network-first with 4s timeout — user always gets fresh content,
    // but falls back to cache instantly if offline or network is slow
    event.respondWith(networkFirst(event.request, 4000));
    return;
  }

  // analytics.js holds the GA measurement ID. Network-first so pasting a
  // new ID isn't stuck on the cache-first rule used for images below.
  if (url.pathname === '/analytics.js') {
    event.respondWith(networkFirst(event.request, 4000));
    return;
  }

  // Images & icons: cache-first (they never change between versions)
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        return response;
      });
    })
  );
});

// ── Skip waiting on demand (triggered by update banner) ───────
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

// ── Push notifications ────────────────────────────────────────
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(self.registration.showNotification(data.title || 'Primosmusings', {
    body: data.body || 'New episode just dropped!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'primosmusings-notification',
    data: { url: data.url || '/' }
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url || '/'));
});

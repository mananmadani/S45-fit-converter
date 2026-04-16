const CACHE = 's45-v5';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './s45-logo.png',
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap'
];

/* ── INSTALL: pre-cache all app shell assets ── */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      // addAll fails if any request fails — use individual adds for external fonts
      return Promise.allSettled(
        ASSETS.map(url => cache.add(url).catch(() => { /* non-fatal: fonts may fail offline */ }))
      );
    }).then(() => self.skipWaiting())
  );
});

/* ── ACTIVATE: wipe old caches ── */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())   // take control of open tabs immediately
  );
});

/* ── FETCH: cache-first for app shell, network-first for everything else ── */
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Only handle GET requests
  if (e.request.method !== 'GET') return;

  // App shell assets → cache-first, refresh in background (stale-while-revalidate)
  const isAppShell = ASSETS.some(a => {
    try { return new URL(a, self.location.origin).href === e.request.url; } catch { return false; }
  }) || url.origin === self.location.origin;

  if (isAppShell) {
    e.respondWith(
      caches.open(CACHE).then(cache =>
        cache.match(e.request).then(cached => {
          // Fetch fresh copy in background and update cache
          const networkFetch = fetch(e.request)
            .then(res => {
              if (res && res.status === 200 && res.type !== 'opaque') {
                cache.put(e.request, res.clone());
              }
              return res;
            })
            .catch(() => null);

          // Return cached immediately if available, else wait for network
          return cached || networkFetch;
        })
      )
    );
    return;
  }

  // External resources (fonts, etc.) → cache-first, silent fail
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request)
        .then(res => {
          if (res && res.status === 200) {
            caches.open(CACHE).then(c => c.put(e.request, res.clone()));
          }
          return res;
        })
        .catch(() => new Response('', { status: 503, statusText: 'Offline' }));
    })
  );
});

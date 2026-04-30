const CACHE_VERSION = '1.5.260430.2117';
const CACHE_NAME = 'kgp-' + CACHE_VERSION;
const STATIC_ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/data.js',
  './js/state.js',
  './js/utils.js',
  './js/sync.js',
  './js/ai.js',
  './js/weather.js',
  './js/map.js',
  './js/ui.js',
  './js/journal.js',
  './js/settings.js',
  './js/features.js',
  './js/features2.js',
  './js/planner.js',
  './js/router.js',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  './manifest.json',
  './about.html',
  './panel.html',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.1/dist/umd/supabase.min.js',
  'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600&display=swap'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // API calls (Supabase, Mapy.com, weather) — network only, nie cache'uj
  if (url.hostname.includes('supabase') || url.hostname.includes('mapy.com') ||
      url.hostname.includes('open-meteo') || url.hostname.includes('overpass')) {
    return;
  }

  // Google Fonts pliki woff2 — cache-first (nigdy się nie zmieniają)
  if (url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          return res;
        });
      })
    );
    return;
  }

  // Wszystko inne (lokalne + CDN libs) — stale-while-revalidate
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetching = fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return res;
      }).catch(() => cached);

      return cached || fetching;
    })
  );
});

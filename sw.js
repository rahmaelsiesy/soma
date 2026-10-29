// Soma offline support. Registered by app.js only when SOMA_PROFILE.offline
// is set (the product build). Network-first: online users always get the
// latest files; the cache is only a fallback when offline, so a new
// release never gets stuck behind a stale copy.
const CACHE = 'soma-v1';
const SHELL = ['./', 'index.html', 'app.js', 'data.js', 'style.css', 'manifest.json', 'icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const sameOrigin = new URL(req.url).origin === self.location.origin;
  event.respondWith(
    fetch(req)
      .then(res => {
        if (sameOrigin && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(cache => cache.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true })
        .then(hit => hit || (req.mode === 'navigate' ? caches.match('index.html') : undefined))
        .then(hit => hit || Response.error()))
  );
});

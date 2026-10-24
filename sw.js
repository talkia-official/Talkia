const CACHE = 'talkia-v29';
// Relative paths support deployment under /Talkia/ on GitHub Pages.
const SHELL = [
  './', 'index.html', 'batch3.js', 'batch4.js', 'batch5.js', 'batch6.js',
  'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'logo.png', 'logo-wordmark.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => Promise.all(SHELL.map(path => cache.add(path).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

// Network-first for same-origin GET requests; use cache only as offline fallback.
// Cross-origin services (including Supabase) are left untouched.
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(request).then(response => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(request, copy)).catch(() => {});
      }
      return response;
    }).catch(() =>
      caches.match(request).then(cached => cached || caches.match('index.html') || Response.error())
    )
  );
});

const CACHE = 'talkia-v28';
// Relative paths: works under /Talkia/ on GitHub Pages. Missing files never break install.
const SHELL = ['./', 'index.html', 'batch3.js', 'batch4.js', 'batch5.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'logo.png', 'logo-wordmark.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Network first for our own files (updates show up), cache only as offline fallback.
// Supabase and other cross-origin requests are never touched.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req).then(r => r || caches.match('index.html') || Response.error()))
  );
});

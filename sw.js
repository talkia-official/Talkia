const CACHE_NAME = 'talkia-v22';
const ASSETS = [
  '/',
  '/index.html',
  '/batch3.js',
  '/batch4.js',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/logo.png',
  '/logo-wordmark.png'
];

// ১. ইনস্টল ইভেন্ট: ক্যাশ ফাইলগুলো ব্রাউজারে সেভ করা
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// ২. অ্যাক্টিভেট ইভেন্ট: পুরোনো ক্যাশ ক্লিন করা
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clientsClaim();
});

// ৩. ফেচ ইভেন্ট: অফলাইন বা ক্যাশ থেকে ফাইল লোড করা
self.addEventListener('fetch', e => {
  // Supabase বা এক্সটার্নাল এপিআই রিকোয়েস্ট হলে ক্যাশ এড়িয়ে সরাসরি নেটওয়ার্ক কল করবে
  if (e.request.url.includes('supabase.co')) {
    return;
  }
  
  e.respondWith(
    caches.match(e.request).then(cachedResponse => {
      return cachedResponse || fetch(e.request).catch(() => {
        // অফলাইন থাকলে প্রয়োজনে ফলব্যাক দিতে পারেন
      });
    })
  );
});

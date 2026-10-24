const CACHE_NAME = 'talkia-auto-cache';

// ইন্সটল করার সময় কোনো ভারী প্রি-ক্যাশ করার দরকার নেই, যাতে ক্যাশ ভার্সন বদলাতে না হয়
self.addEventListener('install', event => {
  self.skipWaiting();
});

// পুরনো কোনো ক্যাশ থাকলে তা স্বয়ংক্রিয়ভাবে মুছে ফেলা
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// নেটওয়ার্ক-ফার্স্ট (Network-First) স্ট্র্যাটেজি
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // যদি ইন্টারনেট বা নেটওয়ার্ক থেকে সফলভাবে লেটেস্ট ফাইল পাওয়া যায়, 
        // তবে সেটি স্বয়ংক্রিয়ভাবে ক্যাশে আপডেট হয়ে যাবে!
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // যদি ইন্টারনেট না থাকে (অফলাইন থাকেন), তখন ক্যাশ থেকে ফাইল দেখাবে
        return caches.match(event.request).then(cachedResponse => {
          return cachedResponse || caches.match('./index.html');
        });
      })
  );
});

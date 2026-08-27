// Service Worker for ZookaRestoPos - Restaurant Billing & POS Suite
const CACHE_NAME = 'zookarestopos-cache-v1';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/manifest.json',
  '/icons/icon.svg',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg'
];

// Install Event: Precaching Core Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Precache non-fatal error:', err);
      });
    }).then(() => {
      // Force the waiting service worker to become the active service worker
      return self.skipWaiting();
    })
  );
});

// Activate Event: Clean up old cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      // Claim all clients immediately so the service worker takes control of existing open tabs
      return self.clients.claim();
    })
  );
});

// Fetch Event: Intelligent Caching Strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Bypass non-GET requests (POST, PUT, DELETE for APIs/Gemini/Firestore)
  if (request.method !== 'GET') {
    return;
  }

  // 2. Bypass API routes, WebSocket, and external cloud services
  if (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('identitytoolkit.googleapis.com') ||
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('run.app') && url.pathname.startsWith('/api')
  ) {
    return;
  }

  // 3. For HTML navigation requests: Network-First with Cache Fallback
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          // Fallback to cached index.html shell
          const rootCached = await caches.match('/index.html');
          if (rootCached) {
            return rootCached;
          }
          return caches.match('/');
        })
    );
    return;
  }

  // 4. For Static Assets (JS, CSS, SVGs, Fonts, Images): Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If network fails and nothing in cache, return undefined
          return cachedResponse;
        });

      return cachedResponse || fetchPromise;
    })
  );
});

// Listen for message events (e.g., skipWaiting trigger from UI)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

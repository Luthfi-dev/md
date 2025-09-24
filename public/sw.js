
// This is a basic service worker for a Progressive Web App (PWA).

const getVersion = () => {
    // This function is designed to be called within the service worker context
    // It's a placeholder since we will get the version from the client page.
    return 'v1'; 
};

// This function will be called from the client to set the correct versioned cache name
let CACHE_NAME = 'maudigi-cache-v1'; // Default cache name

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SET_VERSION') {
        CACHE_NAME = `maudigi-cache-${event.data.versionId}`;
        console.log(`Service Worker cache name set to: ${CACHE_NAME}`);
    }
});


// List of assets to cache on install
const urlsToCache = [
  '/',
  '/manifest.webmanifest',
  // Add other critical static assets here
  // Be careful not to cache API routes or dynamic pages unless you have a specific strategy
];

// Install event: cache the essential app shell files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // Force the waiting service worker to become the active service worker.
        return self.skipWaiting();
      })
  );
});

// Activate event: clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // If the cache name is not our current one, delete it
          if (cacheName !== CACHE_NAME && cacheName.startsWith('maudigi-cache-')) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
        // Tell the active service worker to take control of the page immediately.
        return self.clients.claim();
    })
  );
});

// Fetch event: serve cached content when offline, or fetch from network
self.addEventListener('fetch', (event) => {
  // We only want to cache GET requests.
  if (event.request.method !== 'GET') {
    return;
  }
  
  // For navigation requests (i.e., for HTML pages), always go to the network first.
  // This ensures users always get the latest version of the pages.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/'))
    );
    return;
  }

  // For all other requests (CSS, JS, images), use a cache-first strategy.
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(event.request);
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // If not in cache, fetch from network, cache it, and then return it.
      const networkResponse = await fetch(event.request);
      // Only cache successful responses
      if (networkResponse && networkResponse.status === 200) {
        cache.put(event.request, networkResponse.clone());
      }
      return networkResponse;
    })
  );
});

// --- Static Versioning ---
// This version ID will be manually updated by the build process or developer.
// It ensures that any change in the service worker logic itself triggers a re-installation.
const STATIC_SW_VERSION = 'v1.0.0'; 

// --- Dynamic Application Versioning ---
// This will hold the version from the fetched version.json
let appVersion = '';

// --- Cache Management ---
const CACHE_NAME_PREFIX = 'maudigi-cache';

// Function to generate the dynamic cache name based on the app version
const getCacheName = () => `${CACHE_NAME_PREFIX}-${appVersion}`;

// --- Service Worker Lifecycle ---

self.addEventListener('install', (event) => {
  console.log(`[SW ${STATIC_SW_VERSION}] Installing...`);
  // Skip waiting to ensure the new service worker activates immediately
  // once the old one is gone. This is crucial for the cache cleanup logic.
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  console.log(`[SW ${STATIC_SW_VERSION}] Activating...`);

  // This is the most important part: Clean up old caches.
  event.waitUntil(
    (async () => {
      try {
        // Fetch the latest version ID from the server
        const response = await fetch('/data/version.json?_=' + new Date().getTime());
        const versionData = await response.json();
        appVersion = versionData.versionId;

        const currentCacheName = getCacheName();
        console.log(`[SW ${STATIC_SW_VERSION}] Current app version is ${appVersion}. Cache name: ${currentCacheName}`);

        // Get all existing cache keys
        const cacheNames = await caches.keys();
        
        // Delete all caches that don't match the current version's cache name.
        const cachesToDelete = cacheNames.filter(
          (cacheName) => cacheName.startsWith(CACHE_NAME_PREFIX) && cacheName !== currentCacheName
        );

        if (cachesToDelete.length > 0) {
          console.log(`[SW ${STATIC_SW_VERSION}] Deleting old caches:`, cachesToDelete);
          await Promise.all(cachesToDelete.map((cacheName) => caches.delete(cacheName)));
        } else {
          console.log(`[SW ${STATIC_SW_VERSION}] No old caches to delete.`);
        }

      } catch (error) {
        console.error(`[SW ${STATIC_SW_VERSION}] Error during activation and cache cleanup:`, error);
      }
      
      // Tell the service worker to take control of the page immediately.
      return self.clients.claim();
    })()
  );
});

// --- Fetch & Caching Strategy (Cache First, then Network) ---

self.addEventListener('fetch', (event) => {
  // We only want to cache GET requests.
  if (event.request.method !== 'GET') {
    return;
  }

  // Example: Don't cache API calls
  if (event.request.url.includes('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  event.respondWith(
    (async () => {
      // If appVersion is not set yet, just fetch from network
      if (!appVersion) {
        return fetch(event.request);
      }
      
      const cache = await caches.open(getCacheName());
      
      // 1. Try to get the response from the cache.
      const cachedResponse = await cache.match(event.request);
      if (cachedResponse) {
        // console.log(`[SW] Serving from cache: ${event.request.url}`);
        return cachedResponse;
      }

      // 2. If not in cache, fetch from the network.
      try {
        const networkResponse = await fetch(event.request);
        // console.log(`[SW] Fetching from network and caching: ${event.request.url}`);
        
        // 3. Put a copy of the response in the cache for next time.
        // We use clone() because a response is a stream and can only be consumed once.
        cache.put(event.request, networkResponse.clone());
        
        return networkResponse;
      } catch (error) {
        // The network failed, and the item wasn't in the cache.
        // This is where you might show an offline fallback page, but for now, we'll just let the error propagate.
        console.error(`[SW] Fetch failed for: ${event.request.url}`, error);
        throw error;
      }
    })()
  );
});


'use strict';

const CACHE_NAME = 'maudigi-cache-v1'; // Basic cache name
const OFFLINE_URL = '/'; 

// List of assets to cache on installation
const ASSETS_TO_CACHE = [
  OFFLINE_URL,
  '/manifest.webmanifest',
  // You can add more critical assets here like main CSS or JS files if needed
  // Example: '/styles/main.css', '/scripts/main.js'
];

self.addEventListener('install', (event) => {
  console.log('[SW] Install event');
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        await cache.addAll(ASSETS_TO_CACHE);
        console.log('[SW] Cached assets on install');
      } catch (error) {
        console.error('[SW] Failed to cache assets on install:', error);
      }
    })()
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event');
  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          }
        })
      );
      await clients.claim();
      console.log('[SW] Activated and claimed clients');
    })()
  );
});


self.addEventListener('fetch', (event) => {
  // We only want to handle navigation requests for offline fallback
  if (event.request.mode !== 'navigate') {
    return;
  }

  event.respondWith(
    (async () => {
      try {
        // First, try to use the network
        const networkResponse = await fetch(event.request);
        return networkResponse;
      } catch (error) {
        // Network failed, try to serve from cache
        console.log('[SW] Network request failed, trying cache.', error);
        const cache = await caches.open(CACHE_NAME);
        try {
            const cachedResponse = await cache.match(OFFLINE_URL);
            if (cachedResponse) {
                return cachedResponse;
            }
            // If offline URL is not in cache, it's a real issue
            console.error('[SW] Offline fallback page not found in cache.');
            // This will result in the browser's default offline page
            return new Response('Offline page not available', {
                status: 404,
                headers: { 'Content-Type': 'text/plain' },
            });
        } catch (cacheError) {
             console.error('[SW] Cache match failed:', cacheError);
             // This will result in the browser's default offline page
             return new Response('Cache access failed', {
                status: 500,
                headers: { 'Content-Type': 'text/plain' },
            });
        }
      }
    })()
  );
});

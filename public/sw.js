
"use strict";

// sw.js

// Version control for the service worker and cache
const CACHE_VERSION = "v1.0.0-maudigi"; // Change this version to force update
const CACHE_NAME = `maudigi-cache-${CACHE_VERSION}`;

// List of files to cache
const URLS_TO_CACHE = [
  '/',
  '/manifest.webmanifest',
  // Add other critical assets here. Be selective.
  // For example: '/styles/main.css', '/scripts/main.js'
  // Icons are usually a good choice to cache for PWA experience
  '/icons/android-chrome-192x192.png',
  '/icons/android-chrome-512x512.png',
  '/icons/apple-touch-icon.png',
  '/icons/favicon.ico',
];

// Install event: fires when the service worker is first installed.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache:', CACHE_NAME);
        // Cache our files
        return cache.addAll(URLS_TO_CACHE);
      })
      .then(() => {
        // Force the waiting service worker to become the active service worker.
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error('Cache open/addAll failed:', err);
      })
  );
});

// Activate event: fires when the service worker becomes active.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      // Delete old caches that are not our current one
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName.startsWith('maudigi-cache-') && cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
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


// Fetch event: fires for every network request.
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // We only want to handle GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // For navigation requests (e.g., loading a page), use a network-first strategy
  if (request.mode === 'navigate') {
     event.respondWith(
      fetch(request)
        .then(response => {
          // If network is available, clone the response and cache it
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(request, responseToCache);
            });
          return response;
        })
        .catch(() => {
          // If network fails, try to serve from cache
          return caches.match(request)
            .then(cachedResponse => {
              return cachedResponse || caches.match('/'); // Fallback to home page if specific page not in cache
            });
        })
    );
    return;
  }

  // For other assets (CSS, JS, images), use a cache-first strategy
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // If we have a cached response, return it
        if (cachedResponse) {
          return cachedResponse;
        }

        // Otherwise, fetch from the network
        return fetch(request)
          .then((networkResponse) => {
            // Don't cache opaque responses (e.g., from third-party CDNs without CORS)
            if (networkResponse.type === 'opaque') {
              return networkResponse;
            }

            // Clone the response and cache it for future use
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseToCache);
              });
            
            return networkResponse;
          });
      })
      .catch((error) => {
        // If both cache and network fail, you can provide a generic fallback
        // For example, for images, you could return a placeholder image.
        console.error('Fetch failed:', error);
        // For now, we just let the browser's default offline error show.
      })
  );
});


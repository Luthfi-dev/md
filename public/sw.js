
// This is a basic service worker for PWA caching.

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  // We will cache assets upon activation to ensure we get the latest version.
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  // On activation, we clean up any old caches.
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // You can define a pattern for your cache names, e.g., 'my-app-cache-v1'
          // and delete any caches that don't match the current version.
          // For now, we'll keep it simple and not delete caches automatically on activation,
          // but this is where you would do it.
          console.log('Service Worker: Checking cache:', cacheName);
          return null;
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // We are not intercepting fetch requests for now.
  // This would be the place for more complex caching strategies (e.g., stale-while-revalidate).
  // For a basic "installable" PWA, this is not strictly necessary.
  event.respondWith(fetch(event.request));
});

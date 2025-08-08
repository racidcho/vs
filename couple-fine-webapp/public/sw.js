// Minimal Service Worker - Safari Compatible
// Version 3 - Force cache refresh
const CACHE_VERSION = 'couple-fine-webapp-v3-' + Date.now();

// Install event - skip caching for now
self.addEventListener('install', (event) => {
  console.log('[SW] Install v3');
  self.skipWaiting(); // Force activation
});

// Activate event - clear ALL old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate v3');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      // Delete ALL caches to force refresh
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('[SW] Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - always use network, no caching for Safari
self.addEventListener('fetch', (event) => {
  // For Safari, just pass through to network
  return;
});
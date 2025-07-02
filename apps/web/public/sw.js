// This is a basic service worker for PWA support. You can extend it for offline and push notifications.
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  self.clients.claim();
});

// Add fetch, push, or notification event listeners as needed for advanced features.

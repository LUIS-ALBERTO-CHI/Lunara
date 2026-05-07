// Fuerza al nuevo Service Worker a instalarse y activarse inmediatamente
self.addEventListener('install', function (event) {
  self.skipWaiting();
});

// Toma el control de las pestañas o la app abierta inmediatamente
self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', function (event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

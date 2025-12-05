// Service Worker mínimo para cumplir los requisitos de instalación PWA (WebAPK)
self.addEventListener('install', (event) => {
  console.log('Service Worker instalado');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activado');
});

self.addEventListener('fetch', (event) => {
  // Simplemente permite que las peticiones pasen a la red
  event.respondWith(fetch(event.request));
});
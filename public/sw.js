self.addEventListener('install', (event) => {
  console.log('MizoChess SW installed');
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});

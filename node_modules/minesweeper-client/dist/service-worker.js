const CACHE_NAME = 'minesweeper-1v1-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/assets/favicon.svg',
  '/assets/mine.svg',
  '/assets/flag.svg',
  '/assets/timer.svg',
  '/assets/player_1_icon.svg',
  '/assets/player_2_icon.svg',
  '/assets/trophy.svg',
  '/assets/home_icon.svg',
  '/assets/lobby_icon.svg',
  '/assets/settings_icon.svg',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).catch(() => {
          // If offline and request is for navigation (HTML), show offline message
          if (event.request.mode === 'navigate') {
             // Return a simple offline page or message
             return new Response('<h1>Connexion requise pour jouer</h1><p>Veuillez vérifier votre connexion internet.</p>', {
               headers: { 'Content-Type': 'text/html' }
             });
          }
        });
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

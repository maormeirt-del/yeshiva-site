// גרסת המטמון — לעדכן (SW_VERSION) בכל דיפלוי שרוצים לאלץ ריענון קבצים ישנים
const SW_VERSION = 'v2';
const SHELL_CACHE = `yeshiva-shell-${SW_VERSION}`;
const RUNTIME_CACHE = `yeshiva-runtime-${SW_VERSION}`;

const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.webmanifest',
  '/archive.html',
  '/assets/css/style.css',
  '/assets/css/archive.css',
  '/assets/js/main.js',
  '/assets/js/anim.js',
  '/assets/js/archive.js',
  '/assets/img/logo.png',
  '/assets/img/icons/icon-192.png',
  '/assets/img/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .catch(() => {}) // אם משאב אחד חסר, לא מפילים את כל ההתקנה
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== SHELL_CACHE && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// הודעה מהעמוד: "יש גרסה חדשה, תפעיל אותה עכשיו"
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // ניווט בין דפי HTML — network-first, נופלים לקאש ואז לעמוד אופליין
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match('/offline.html'))
        )
    );
    return;
  }

  // נכסים סטטיים (css/js/fonts/images) — cache-first עם רענון ברקע
  if (['style', 'script', 'font', 'image'].includes(request.destination)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((response) => {
            const copy = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
            return response;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })
    );
  }
});

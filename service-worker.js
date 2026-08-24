const CACHE_NAME = 'edubox-cache-v2';
const CORE_ASSETS = ['/index.html', '/apps.js', '/global-core.js', '/menu.html', '/manifest.json'];
const NETWORK_FIRST_ASSETS = new Set(['/', '/index.html', '/apps.js', '/menu.html']);

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).catch(() => {})
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const url = event.request.url;
    const pathname = new URL(url).pathname;

    // Wywołania do /api/ ZAWSZE świeże z sieci - nigdy z cache (dane, limity, generowanie AI)
    if (url.includes('/api/')) {
        return;
    }

    // Tylko zapytania GET nadają się do cache'owania
    if (event.request.method !== 'GET') {
        return;
    }

    // Strona główna, katalog i menu zmieniają się często. Najpierw pytamy sieć,
    // a cache jest tylko planem awaryjnym na wypadek braku połączenia.
    if (NETWORK_FIRST_ASSETS.has(pathname)) {
        event.respondWith(
            fetch(event.request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
                }
                return networkResponse;
            }).catch(() => caches.match(event.request))
        );
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            return fetch(event.request).then((networkResponse) => {
                // Cache'ujemy tylko udane odpowiedzi z własnej domeny
                if (networkResponse && networkResponse.status === 200 && url.startsWith(self.location.origin)) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
                }
                return networkResponse;
            }).catch(() => cachedResponse);
        })
    );
});

// Service Worker EduBox – działanie offline bez wstrzymywania aktualizacji.
// v4 (7.10.2026): wcześniej strony narzędzi i wspólne skrypty szły "najpierw z cache" – kto raz otworzył
// narzędzie, dostawał tę samą wersję aż do zmiany nazwy cache (nie widział nowych modeli, poprawek druku,
// instrukcji). Teraz strony, skrypty, style i dane są zawsze najpierw z sieci (cache tylko awaryjnie, offline),
// a obrazki i czcionki – od razu z cache z odświeżaniem w tle. Inne domeny (CDN, obrazki AI z fal.ai,
// Google) i /api/ w ogóle nie przechodzą przez Service Workera.
const CACHE_NAME = 'edubox-cache-v4';
const CORE_ASSETS = ['/', '/index.html', '/apps.js', '/global-core.js', '/menu.html', '/manifest.json'];
const STATIC_MEDIA = /\.(png|jpe?g|webp|gif|svg|ico|woff2?|ttf|mp3|mp4)$/i;

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).catch(() => {})
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    // Usuwa stare cache (m.in. v3 z zamrożonymi wersjami stron narzędzi).
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const request = event.request;
    if (request.method !== 'GET') return;
    const url = new URL(request.url);
    // Dane, limity i generowanie AI zawsze prosto z serwera; obce domeny obsługuje przeglądarka.
    if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

    if (STATIC_MEDIA.test(url.pathname)) {
        // Obrazki i czcionki: od razu z cache (szybko), w tle pobieramy świeżą wersję na następny raz.
        event.respondWith(
            caches.open(CACHE_NAME).then((cache) => cache.match(request).then((cached) => {
                const network = fetch(request).then((response) => {
                    if (response && response.status === 200) cache.put(request, response.clone());
                    return response;
                }).catch(() => cached || Response.error());
                return cached || network;
            }))
        );
        return;
    }

    // Strony, skrypty, style, dane: zawsze aktualna wersja z sieci; cache tylko gdy brak połączenia.
    event.respondWith(
        fetch(request).then((response) => {
            if (response && response.status === 200) {
                const copy = response.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return response;
        }).catch(async () => {
            const cached = await caches.match(request);
            if (cached) return cached;
            if (request.mode === 'navigate') {
                const home = await caches.match('/index.html');
                if (home) return home;
            }
            return Response.error();
        })
    );
});

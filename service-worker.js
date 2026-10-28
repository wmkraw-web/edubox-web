// Service Worker EduBox – działanie offline bez wstrzymywania aktualizacji.
// v4 (7.10.2026): wcześniej strony narzędzi i wspólne skrypty szły "najpierw z cache" – kto raz otworzył
// narzędzie, dostawał tę samą wersję aż do zmiany nazwy cache (nie widział nowych modeli, poprawek druku,
// instrukcji). Teraz strony, skrypty, style i dane są zawsze najpierw z sieci (cache tylko awaryjnie, offline),
// a obrazki i czcionki – od razu z cache z odświeżaniem w tle. /api/ w ogóle nie przechodzi przez Workera.
// v5 (28.10.2026): biblioteki z CDN Z PRZYPIĘTYM NUMEREM WERSJI (React, Babel, pdf.js, ikony, czcionki Google)
// też wchodzą do cache – inaczej strona otwarta bez internetu wczytywała się pusta, bo React był spoza
// domeny i Worker go pomijał. Przypięta wersja nigdy nie zmienia treści pod tym samym adresem, więc
// „najpierw z cache” jest tu bezpieczne; reszta obcych domen (obrazki AI z fal.ai, analityka) – jak dotąd poza SW.
const CACHE_NAME = 'edubox-cache-v5';
// Tylko te domeny i tylko adresy z widocznym numerem wersji (@1.2.3, /1.2.3/) albo czcionki Google.
const CDN_HOSTS = ['unpkg.com', 'cdn.jsdelivr.net', 'cdnjs.cloudflare.com', 'fonts.gstatic.com', 'fonts.googleapis.com', 'cdn.tailwindcss.com'];
const PINNED = /@\d+\.\d+\.\d+|\/\d+\.\d+\.\d+\//;
// Tailwind i czcionki Google nie mają numeru wersji w adresie, a bez nich strona otwarta offline jest
// nieczytelna. Dostają to samo „najpierw cache, świeża kopia w tle”, więc aktualizacja i tak dociera.
const BEZ_WERSJI = ['cdn.tailwindcss.com', 'fonts.gstatic.com', 'fonts.googleapis.com'];
const cacheableCdn = (url) =>
    CDN_HOSTS.includes(url.hostname) && (PINNED.test(url.pathname) || BEZ_WERSJI.includes(url.hostname));
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
    // Dane, limity i generowanie AI zawsze prosto z serwera.
    if (url.origin === self.location.origin && url.pathname.startsWith('/api/')) return;
    // Biblioteki z CDN z przypiętą wersją: najpierw cache (działa bez internetu), w tle świeża kopia.
    if (url.origin !== self.location.origin) {
        if (!cacheableCdn(url)) return;
        event.respondWith(
            caches.open(CACHE_NAME).then((cache) => cache.match(request).then((cached) => {
                const network = fetch(request).then((response) => {
                    // Odpowiedzi "opaque" (bez CORS) też zapisujemy – offline liczy się bajt, nie nagłówek.
                    if (response && (response.status === 200 || response.type === 'opaque')) cache.put(request, response.clone());
                    return response;
                }).catch(() => cached || Response.error());
                return cached || network;
            }))
        );
        return;
    }

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

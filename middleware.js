// Middleware Vercel - chroni prywatne narzędzia hasłem HTTP: wewnętrzne narzędzia marketingowe
// (EduInfluencer Studio - posty Ewy, Generator Wideo Ani) oraz prywatną kartotekę zdrowia
// (zdrowie.html - tam hasło HTTP to pierwsza warstwa, drugą jest hasło szyfrujące dane).
// Działa TYLKO dla ścieżek
// wymienionych w matcher poniżej - reszta strony (wszystkie narzędzia, blog, strona
// główna) działa bez żadnych zmian.
//
// Drugie zadanie (od 16.11.2026): wpis bloga. Adres blog.html?post=<slug> to jeden plik, więc roboty bez
// JavaScriptu widziały listę wpisów zamiast treści. Dla wpisów z listy blog-wpisy/lista.mjs podajemy pod tym
// samym adresem gotową stronę blog-wpisy/<slug>.html (generuje ją scripts/generate-static.js). Wpis spoza
// listy i sam blog.html przechodzą bez zmian.

import BLOG_SLUGS from './blog-wpisy/lista.mjs';

const BLOG_SET = new Set(BLOG_SLUGS);

export const config = {
  matcher: ['/blog.html', '/ewamarketing.html', '/ewa-marketing.html', '/aniawideo.html', '/zdrowie.html', '/api/ewa-generate', '/api/weekly-report', '/api/social-stats'],
};

export default function middleware(request) {
  const authHeader = request.headers.get('authorization');
  const pathname = new URL(request.url).pathname;

  if (pathname === '/blog.html') {
    const slug = new URL(request.url).searchParams.get('post');
    if (slug && BLOG_SET.has(slug)) {
      const target = new URL(`/blog-wpisy/${slug}.html`, request.url);
      return new Response(null, { headers: { 'x-middleware-rewrite': target.toString() } });
    }
    return; // lista wpisów albo wpis bez gotowej strony – zwykły blog.html
  }

  // GitHub Actions korzysta z tego endpointu do raportu tygodniowego i wysyła
  // własny sekret Bearer. Jego pełną poprawność nadal sprawdza funkcja API.
  if (pathname === '/api/weekly-report' && authHeader?.startsWith('Bearer ')) {
    return;
  }

  if (authHeader) {
    const [scheme, encoded] = authHeader.split(' ');
    if (scheme === 'Basic' && encoded) {
      try {
        const decoded = atob(encoded);
        const separatorIndex = decoded.indexOf(':');
        const user = decoded.slice(0, separatorIndex);
        const pass = decoded.slice(separatorIndex + 1);

        if (user === process.env.EWA_AUTH_USER && pass === process.env.EWA_AUTH_PASS) {
          // Stary adres z myślnikiem był zapisany w zakładkach i pamięci przeglądarki.
          // Po poprawnym logowaniu przekierowujemy go do aktualnej wersji aplikacji.
          const url = new URL(request.url);
          if (url.pathname === '/ewa-marketing.html') {
            url.pathname = '/ewamarketing.html';
            return Response.redirect(url, 307);
          }

          return; // Dane poprawne - przepuszczamy dalej, do zwykłej strony/API
        }
      } catch (e) {
        // Niepoprawne dane logowania - lecimy do 401 poniżej
      }
    }
  }

  // Panele korzystają z własnego formularza logowania. Dla ich API zwracamy
  // zwykły JSON bez WWW-Authenticate, aby przeglądarka nie otwierała i nie
  // zamykała systemowego okienka Basic Auth.
  if (pathname === '/api/weekly-report' || pathname === '/api/social-stats') {
    return new Response(JSON.stringify({ error: 'Niepoprawny login lub hasło.' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  }

  return new Response('Autoryzacja wymagana.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Prywatna aplikacja EduBox"',
    },
  });
}

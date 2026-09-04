// Middleware Vercel - chroni prywatne, wewnętrzne narzędzia marketingowe hasłem
// (EduInfluencer Studio - posty Ewy, Generator Wideo Ani). Działa TYLKO dla ścieżek
// wymienionych w matcher poniżej - reszta strony (wszystkie narzędzia, blog, strona
// główna) działa bez żadnych zmian.

export const config = {
  matcher: ['/ewamarketing.html', '/ewa-marketing.html', '/aniawideo.html', '/api/ewa-generate', '/api/weekly-report'],
};

export default function middleware(request) {
  const authHeader = request.headers.get('authorization');
  const pathname = new URL(request.url).pathname;

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

  // Panel korzysta z własnego formularza logowania. Dla jego API zwracamy
  // zwykły JSON bez WWW-Authenticate, aby przeglądarka nie otwierała i nie
  // zamykała systemowego okienka Basic Auth.
  if (pathname === '/api/weekly-report') {
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

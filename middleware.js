// Middleware Vercel - chroni prywatne, wewnętrzne narzędzia marketingowe hasłem
// (EduInfluencer Studio - posty Ewy, Generator Wideo Ani). Działa TYLKO dla ścieżek
// wymienionych w matcher poniżej - reszta strony (wszystkie narzędzia, blog, strona
// główna) działa bez żadnych zmian.

export const config = {
  matcher: ['/ewamarketing.html', '/aniawideo.html', '/api/ewa-generate'],
};

export default function middleware(request) {
  const authHeader = request.headers.get('authorization');

  if (authHeader) {
    const [scheme, encoded] = authHeader.split(' ');
    if (scheme === 'Basic' && encoded) {
      try {
        const decoded = atob(encoded);
        const separatorIndex = decoded.indexOf(':');
        const user = decoded.slice(0, separatorIndex);
        const pass = decoded.slice(separatorIndex + 1);

        if (user === process.env.EWA_AUTH_USER && pass === process.env.EWA_AUTH_PASS) {
          return; // Dane poprawne - przepuszczamy dalej, do zwykłej strony/API
        }
      } catch (e) {
        // Niepoprawne dane logowania - lecimy do 401 poniżej
      }
    }
  }

  return new Response('Autoryzacja wymagana.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Prywatna aplikacja EduBox"',
    },
  });
}

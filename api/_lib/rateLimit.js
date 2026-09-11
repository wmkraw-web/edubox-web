// Prosty limiter zapytań per-IP w pamięci procesu (wzorowany na ttsRateStore z api/chat.js).
// UWAGA - świadomy kompromis: to NIE jest limiter w pełni rozproszony (Vercel może uruchomić
// wiele instancji funkcji równolegle, a każda ma własną pamięć, i licznik znika przy zimnym
// starcie) - ale realnie odcina najprostsze pętle/nadużycia kosztowych endpointów (OpenAI,
// Fal.ai), które wcześniej nie miały ŻADNEJ bariery poza omijalnym localStorage na froncie.
// Docelowo do rozważenia: magazyn współdzielony (Upstash/Vercel KV), jeśli nadużycia się utrzymają.

const stores = new Map(); // nazwa limitera -> Map(ip -> { startedAt, count })

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (Array.isArray(forwarded)) return forwarded[0] || 'unknown';
  return String(forwarded || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
}

// Zwraca true jeśli dany IP przekroczył limit dla danego "name" (osobny licznik na endpoint/tryb).
function isRateLimited(req, { name, windowMs, max }) {
  if (!stores.has(name)) stores.set(name, new Map());
  const store = stores.get(name);
  const now = Date.now();
  const ip = getClientIp(req);
  const current = store.get(ip);

  if (!current || now - current.startedAt >= windowMs) {
    store.set(ip, { startedAt: now, count: 1 });
    return false;
  }

  current.count += 1;
  return current.count > max;
}

module.exports = { isRateLimited, getClientIp };

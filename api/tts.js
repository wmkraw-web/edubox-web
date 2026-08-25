const RATE_WINDOW_MS = 5 * 60 * 1000;
const RATE_MAX_REQUESTS = 12;
const MAX_TEXT_LENGTH = 1200;

const rateStore = globalThis.__novaTtsRateStore || new Map();
globalThis.__novaTtsRateStore = rateStore;

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (Array.isArray(forwarded)) return forwarded[0] || 'unknown';
  return String(forwarded || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
}

function isRateLimited(req) {
  const now = Date.now();
  const ip = getClientIp(req);
  const current = rateStore.get(ip);

  if (!current || now - current.startedAt >= RATE_WINDOW_MS) {
    rateStore.set(ip, { startedAt: now, count: 1 });
    return false;
  }

  current.count += 1;
  return current.count > RATE_MAX_REQUESTS;
}

function isSameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;

  try {
    return new URL(origin).host === req.headers.host;
  } catch (error) {
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Metoda niedozwolona' });
  }

  if (!isSameOrigin(req)) {
    return res.status(403).json({ message: 'Niedozwolone źródło żądania' });
  }

  if (isRateLimited(req)) {
    return res.status(429).json({ message: 'Za dużo próśb o głos. Spróbuj ponownie za kilka minut.' });
  }

  const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
  if (!text) {
    return res.status(400).json({ message: 'Brak tekstu do przeczytania' });
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return res.status(400).json({ message: `Tekst może mieć maksymalnie ${MAX_TEXT_LENGTH} znaków` });
  }
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ message: 'Brak konfiguracji klucza OpenAI na serwerze' });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const openAiResponse = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini-tts',
        voice: 'marin',
        input: text,
        instructions: 'Mów po polsku naturalnym, ciepłym i przyjaznym kobiecym głosem. Brzmij jak inteligentna, życzliwa i lekko żartobliwa asystentka. Zachowaj spokojne tempo, wyraźną dykcję i profesjonalny, ale nieformalny ton. Nie przesadzaj z teatralnością.',
        response_format: 'mp3'
      }),
      signal: controller.signal
    });

    if (!openAiResponse.ok) {
      const errorBody = await openAiResponse.text();
      console.error('NOVA TTS - błąd OpenAI:', openAiResponse.status, errorBody);
      return res.status(502).json({ message: 'OpenAI nie wygenerowało głosu NOVY' });
    }

    const audioBuffer = Buffer.from(await openAiResponse.arrayBuffer());
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.length);
    res.setHeader('Cache-Control', 'private, no-store');
    return res.status(200).send(audioBuffer);
  } catch (error) {
    console.error('NOVA TTS - błąd serwera:', error);
    const message = error.name === 'AbortError'
      ? 'Generowanie głosu trwało zbyt długo'
      : 'Nie udało się wygenerować głosu NOVY';
    return res.status(500).json({ message });
  } finally {
    clearTimeout(timeout);
  }
}

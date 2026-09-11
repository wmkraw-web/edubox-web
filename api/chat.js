import { isRateLimited } from './_lib/rateLimit.js';

const TTS_RATE_WINDOW_MS = 5 * 60 * 1000;
const TTS_RATE_MAX_REQUESTS = 12;
const TTS_MAX_TEXT_LENGTH = 1800;

const ttsRateStore = globalThis.__novaTtsRateStore || new Map();
globalThis.__novaTtsRateStore = ttsRateStore;

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (Array.isArray(forwarded)) return forwarded[0] || 'unknown';
  return String(forwarded || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
}

function isTtsRateLimited(req) {
  const now = Date.now();
  const ip = getClientIp(req);
  const current = ttsRateStore.get(ip);

  if (!current || now - current.startedAt >= TTS_RATE_WINDOW_MS) {
    ttsRateStore.set(ip, { startedAt: now, count: 1 });
    return false;
  }

  current.count += 1;
  return current.count > TTS_RATE_MAX_REQUESTS;
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

async function handleTts(req, res) {
  if (!isSameOrigin(req)) {
    return res.status(403).json({ message: 'Niedozwolone źródło żądania' });
  }
  if (isTtsRateLimited(req)) {
    return res.status(429).json({ message: 'Za dużo próśb o głos. Spróbuj ponownie za kilka minut.' });
  }

  const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
  if (!text) {
    return res.status(400).json({ message: 'Brak tekstu do przeczytania' });
  }
  if (text.length > TTS_MAX_TEXT_LENGTH) {
    return res.status(400).json({ message: `Tekst może mieć maksymalnie ${TTS_MAX_TEXT_LENGTH} znaków` });
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

// Vercel: pozwól dłuższym generacjom (mocny model na długim dokumencie) dojść do końca
// zamiast być ucinane na domyślnym 10 s planu Hobby.
export const maxDuration = 60;

// Whitelist modeli - klient NIE może zażądać dowolnego (droższego) modelu.
const KNOWN_MODELS = new Set([
  'gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'gpt-4.1', 'gpt-5-mini', 'gpt-5', 'o4-mini'
]);

// Zwraca listę modeli do wypróbowania po kolei. Przy błędzie "nieznany model"
// schodzimy na pewny gpt-4o-mini, więc zmiana oferty OpenAI nie wywala narzędzi.
function resolveModelChain(model) {
  if (model === 'strong') return ['gpt-5', 'gpt-4.1', 'gpt-4o', 'gpt-4o-mini'];
  if (typeof model === 'string' && KNOWN_MODELS.has(model)) return [model, 'gpt-4o-mini'];
  return ['gpt-4.1-mini', 'gpt-4o-mini']; // domyślny - lepszy niz stary gpt-4o-mini
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Metoda niedozwolona' });
  }

  if (req.body?.mode === 'tts') {
    return handleTts(req, res);
  }

  // Endpoint tekstowy obsługuje ~50 narzędzi i był całkowicie otwarty (bez auth, bez limitu).
  // 60 zapytań / 10 min / IP to duży zapas dla normalnego użycia jednej osoby.
  if (isRateLimited(req, { name: 'chat-text', windowMs: 10 * 60 * 1000, max: 60 })) {
    return res.status(429).json({ message: 'Zbyt wiele zapytań w krótkim czasie. Spróbuj ponownie za kilka minut.' });
  }

  const { prompt, system, temperature = 0.5, format = "text", model } = req.body;

  if (!prompt) {
    return res.status(400).json({ message: 'Brak polecenia (promptu)' });
  }

  const modelChain = resolveModelChain(model);

  const buildPayload = (m) => {
    const p = {
      model: m,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt }
      ],
      temperature: temperature
    };
    if (format === "json") p.response_format = { type: "json_object" };
    return p;
  };

  try {
    let data = null;
    let lastErr = "Nieznany błąd od OpenAI";

    for (let i = 0; i < modelChain.length; i++) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify(buildPayload(modelChain[i]))
      });

      const j = await response.json();
      if (response.ok) { data = j; break; }

      lastErr = j.error?.message || lastErr;
      // Przechodzimy do kolejnego modelu TYLKO gdy problem dotyczy samego modelu.
      const modelIssue = /model|not found|does not exist|invalid|unsupported|deprecat|access/i.test(lastErr);
      if (!modelIssue || i === modelChain.length - 1) throw new Error(lastErr);
    }

    const text = data?.choices?.[0]?.message?.content;
    if (typeof text !== 'string') {
      throw new Error('OpenAI nie zwrócił treści (możliwy filtr bezpieczeństwa treści).');
    }

    res.status(200).json({ text });
  } catch (error) {
    console.error("Szczegóły błędu w API:", error);
    res.status(500).json({ message: 'Błąd serwera API', details: error.message });
  }
}

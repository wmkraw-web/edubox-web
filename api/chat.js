const TTS_RATE_WINDOW_MS = 5 * 60 * 1000;
const TTS_RATE_MAX_REQUESTS = 12;
const TTS_MAX_TEXT_LENGTH = 1200;

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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Metoda niedozwolona' });
  }

  if (req.body?.mode === 'tts') {
    return handleTts(req, res);
  }

  const { prompt, system, temperature = 0.5, format = "text", model = "gpt-4o-mini" } = req.body;

  if (!prompt) {
    return res.status(400).json({ message: 'Brak polecenia (promptu)' });
  }

  try {
    const payload = {
      model: model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt }
      ],
      temperature: temperature
    };

    if (format === "json") {
      payload.response_format = { type: "json_object" };
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Nieznany błąd od OpenAI");
    }

    res.status(200).json({ text: data.choices[0].message.content });
  } catch (error) {
    console.error("Szczegóły błędu w API:", error);
    res.status(500).json({ message: 'Błąd serwera API', details: error.message });
  }
}

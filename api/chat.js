import { isRateLimited } from './_lib/rateLimit.js';
import { handleVerify } from './_lib/scamCheck.js';
import { scrubPersonalData } from './_lib/pii.js';

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
// Prośby o stary gpt-4o-mini (23 wywołania w narzędziach) dostają domyślny, lepszy łańcuch.
function resolveModelChain(model) {
  if (model === 'strong') return ['gpt-5', 'gpt-4.1', 'gpt-4o', 'gpt-4o-mini'];
  if (model !== 'gpt-4o-mini' && typeof model === 'string' && KNOWN_MODELS.has(model)) return [model, 'gpt-4o-mini'];
  return ['gpt-4.1-mini', 'gpt-4o-mini']; // domyślny - lepszy niz stary gpt-4o-mini
}

// Modele rozumujące (gpt-5*, o*) przyjmują tylko domyślne temperature=1. Wysyłanie 0.5 kończyło
// się błędem, więc tryb "strong" nigdy nie używał gpt-5, tylko po cichu schodził na gpt-4.1.
const isReasoningModel = (m) => /^(gpt-5|o\d)/.test(m);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Metoda niedozwolona' });
  }

  if (req.body?.mode === 'tts') {
    return handleTts(req, res);
  }

  // ZanimKlikniesz (zanimklikniesz.html) - ocena ryzyka linku/oferty; osobny tryb zamiast 12. funkcji.
  if (req.body?.mode === 'verify') {
    return handleVerify(req, res);
  }

  // Endpoint tekstowy obsługuje ~50 narzędzi i był całkowicie otwarty (bez auth, bez limitu).
  // 60 zapytań / 10 min / IP to duży zapas dla normalnego użycia jednej osoby.
  if (isRateLimited(req, { name: 'chat-text', windowMs: 10 * 60 * 1000, max: 60 })) {
    return res.status(429).json({ message: 'Zbyt wiele zapytań w krótkim czasie. Spróbuj ponownie za kilka minut.' });
  }

  const { temperature = 0.5, format = "text", model } = req.body;

  if (!req.body.prompt) {
    return res.status(400).json({ message: 'Brak polecenia (promptu)' });
  }

  // RODO: numery PESEL usuwamy, zanim tekst trafi do dostawcy AI (szczegóły w api/_lib/pii.js).
  const cleanPrompt = scrubPersonalData(req.body.prompt);
  const cleanSystem = scrubPersonalData(req.body.system);
  const prompt = cleanPrompt.text;
  const system = cleanSystem.text;
  const piiRemoved = cleanPrompt.removed + cleanSystem.removed;
  if (piiRemoved > 0) res.setHeader('X-EduBox-PII-Removed', String(piiRemoved));

  // TYMCZASOWE (tylko preview, do usunięcia przed merge): test dowolnego modelu i wysiłku rozumowania.
  const isPreviewTest = process.env.VERCEL_ENV === 'preview' && typeof req.body.testModel === 'string';
  const modelChain = isPreviewTest ? [req.body.testModel] : resolveModelChain(model);
  const testEffort = process.env.VERCEL_ENV === 'preview' ? req.body.testEffort : undefined;
  const testVerbosity = process.env.VERCEL_ENV === 'preview' ? req.body.testVerbosity : undefined;
  // Strumień: tekst płynie do przeglądarki na bieżąco (długie dokumenty mocnego modelu trwają ponad minutę).
  const wantsStream = req.body.stream === true && format !== 'json';

  const buildPayload = (m, stream) => {
    const p = {
      model: m,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt }
      ]
    };
    if (isReasoningModel(m)) {
      p.reasoning_effort = testEffort || 'low';
      if (testVerbosity) p.verbosity = testVerbosity;
    } else p.temperature = temperature;
    if (format === "json") p.response_format = { type: "json_object" };
    if (stream) p.stream = true;
    return p;
  };

  const callOpenAI = (m, stream) => fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify(buildPayload(m, stream))
  });

  // TYMCZASOWE (tylko preview, do usunięcia przed merge): lista modeli dostępnych dla klucza.
  if (req.body?.mode === 'models-probe' && process.env.VERCEL_ENV === 'preview') {
    const r = await fetch('https://api.openai.com/v1/models', { headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` } });
    const j = await r.json();
    return res.status(200).json({ ids: (j.data || []).map(x => x.id).filter(id => /^(gpt|o\d|chatgpt)/.test(id)).sort() });
  }

  try {
    let data = null;
    let usedModel = null;
    let lastErr = "Nieznany błąd od OpenAI";

    for (let i = 0; i < modelChain.length; i++) {
      let response = await callOpenAI(modelChain[i], wantsStream);

      if (response.ok && wantsStream) {
        return await pipeOpenAIStream(response, res, modelChain[i]);
      }
      if (response.ok) { data = await response.json(); usedModel = modelChain[i]; break; }

      const j = await response.json().catch(() => ({}));
      lastErr = j.error?.message || lastErr;
      // Część modeli wymaga weryfikacji organizacji do strumieniowania - wtedy ten sam model bez strumienia.
      if (wantsStream && /verif|stream/i.test(lastErr)) {
        response = await callOpenAI(modelChain[i], false);
        if (response.ok) {
          const full = await response.json();
          const text = full?.choices?.[0]?.message?.content;
          if (typeof text === 'string') {
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.setHeader('X-EduBox-Model', full.model || modelChain[i]);
            return res.status(200).send(text);
          }
        }
      }
      // Przechodzimy do kolejnego modelu TYLKO gdy problem dotyczy samego modelu.
      const modelIssue = /model|not found|does not exist|invalid|unsupported|deprecat|access/i.test(lastErr);
      if (!modelIssue || i === modelChain.length - 1) throw new Error(lastErr);
    }

    const text = data?.choices?.[0]?.message?.content;
    if (typeof text !== 'string') {
      throw new Error('OpenAI nie zwrócił treści (możliwy filtr bezpieczeństwa treści).');
    }

    res.status(200).json({ text, model: data.model || usedModel });
  } catch (error) {
    console.error("Szczegóły błędu w API:", error);
    if (res.headersSent) { try { res.end(); } catch (e) {} return; }
    res.status(500).json({ message: 'Błąd serwera API', details: error.message });
  }
}

// Przekazuje strumień SSE z OpenAI jako zwykły tekst (same fragmenty treści). Przerwanie w połowie
// kończy się znacznikiem, po którym przeglądarka wie, że dokument jest niepełny.
async function pipeOpenAIStream(upstream, res, model) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('X-EduBox-Model', model);
  if (typeof res.flushHeaders === 'function') res.flushHeaders();

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let nl;
      while ((nl = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, nl).trim();
        buffer = buffer.slice(nl + 1);
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === '[DONE]') continue;
        try {
          const delta = JSON.parse(payload).choices?.[0]?.delta?.content;
          if (delta) res.write(delta);
        } catch (e) { /* niepełna linia SSE - pomijamy */ }
      }
    }
  } catch (error) {
    console.error('Przerwany strumień OpenAI:', error);
    res.write('\n<!--EDUBOX_STREAM_ERROR-->');
  }
  res.end();
}

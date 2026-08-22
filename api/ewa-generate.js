// Pomocnicze funkcje do obliczania wymiarów obrazka dla Fal.ai
function sanitizeDimension(n) {
  // Fal.ai lubi wymiary będące wielokrotnością 8, w rozsądnym zakresie
  const rounded = Math.round(n / 8) * 8;
  return Math.max(256, Math.min(1440, rounded));
}

function computeImageSize({ width, height, size, aspect_ratio }) {
  // 1) Jeśli podano wprost width i height - mają pierwszeństwo
  if (width && height) {
    return { width: sanitizeDimension(width), height: sanitizeDimension(height) };
  }

  // 2) Jeśli podano "size" w formacie "SZEROKOSCxWYSOKOSC" (np. "1024x1280")
  if (size && /^\d+x\d+$/i.test(String(size))) {
    const [w, h] = String(size).split(/x/i).map(Number);
    return { width: sanitizeDimension(w), height: sanitizeDimension(h) };
  }

  // 3) Znane, gotowe presety Fal.ai
  const presets = {
    '1:1': 'square_hd',
    '3:4': 'portrait_4_3',
    '4:3': 'landscape_4_3',
    '16:9': 'landscape_16_9',
    '9:16': 'portrait_16_9'
  };
  if (aspect_ratio && presets[aspect_ratio]) {
    return presets[aspect_ratio];
  }

  // 4) Proporcja bez gotowego presetu (np. "4:5") - liczymy własne wymiary
  if (aspect_ratio && /^\d+:\d+$/.test(String(aspect_ratio))) {
    const [rw, rh] = String(aspect_ratio).split(':').map(Number);
    const base = 1024;
    if (rw >= rh) {
      return { width: sanitizeDimension(base), height: sanitizeDimension((base * rh) / rw) };
    }
    return { width: sanitizeDimension((base * rw) / rh), height: sanitizeDimension(base) };
  }

  // 5) Domyślnie kwadrat
  return 'square_hd';
}

// ---------------------------------------------------------
// WIDEO: D-ID (talking-head avatar) - osobna gałąź, nie dotyka logiki zdjęć powyżej.
// Dwie akcje pod wspólnym endpointem (żeby nie przekroczyć limitu 12 funkcji na Vercel
// Hobby - patrz historia z api/ewa-chat.js): 'video-create' tworzy zlecenie u D-ID,
// 'video-status' odpytuje o jego stan. Klucz D-ID ma już wbudowaną parę user:pass -
// wysyłamy go zakodowany w Base64 jako nagłówek Basic, zgodnie z ich API.
// ---------------------------------------------------------
async function handleVideoCreate(req, res) {
  const { photoDataUrl, script, voiceId } = req.body;

  if (!photoDataUrl) return res.status(400).json({ message: 'Brak zdjęcia referencyjnego.' });
  if (!script || !script.trim()) return res.status(400).json({ message: 'Brak tekstu do nagrania.' });
  if (!process.env.DID_API_KEY) return res.status(500).json({ message: 'Brak skonfigurowanego klucza DID_API_KEY na serwerze.' });

  const authHeader = 'Basic ' + Buffer.from(process.env.DID_API_KEY).toString('base64');

  const response = await fetch('https://api.d-id.com/talks', {
    method: 'POST',
    headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source_url: photoDataUrl,
      script: {
        type: 'text',
        input: script,
        provider: { type: 'microsoft', voice_id: voiceId || 'pl-PL-AgnieszkaNeural' }
      },
      config: { fluent: true }
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.description || data.message || `D-ID odrzucił zlecenie (HTTP ${response.status}).`);
  }
  return res.status(200).json({ talkId: data.id, status: data.status });
}

async function handleVideoStatus(req, res) {
  const { talkId } = req.body;
  if (!talkId) return res.status(400).json({ message: 'Brak identyfikatora zlecenia (talkId).' });
  if (!process.env.DID_API_KEY) return res.status(500).json({ message: 'Brak skonfigurowanego klucza DID_API_KEY na serwerze.' });

  const authHeader = 'Basic ' + Buffer.from(process.env.DID_API_KEY).toString('base64');

  const response = await fetch(`https://api.d-id.com/talks/${talkId}`, {
    headers: { 'Authorization': authHeader }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.description || data.message || `Nie udało się sprawdzić statusu (HTTP ${response.status}).`);
  }

  return res.status(200).json({
    status: data.status, // 'created' | 'started' | 'done' | 'error'
    resultUrl: data.result_url || null,
    error: data.status === 'error' ? (data.error?.description || 'Nieznany błąd renderowania.') : null
  });
}

export default async function handler(req, res) {
  // Akceptujemy tylko zapytania POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Metoda niedozwolona' });
  }

  // Rozgałęzienie do wideo (D-ID) - zanim jeszcze wejdziemy w logikę obrazków fal.ai poniżej.
  if (req.body?.type === 'video-create') {
    try { return await handleVideoCreate(req, res); }
    catch (error) { console.error('Błąd D-ID (create):', error); return res.status(500).json({ message: error.message }); }
  }
  if (req.body?.type === 'video-status') {
    try { return await handleVideoStatus(req, res); }
    catch (error) { console.error('Błąd D-ID (status):', error); return res.status(500).json({ message: error.message }); }
  }

  // Odczytujemy wszystkie parametry, w tym nowe (init_image dla zdjęć, size/width/height dla wymiarów)
  const { prompt, aspect_ratio, init_image, image_strength, size, width, height } = req.body;

  if (!prompt) {
    return res.status(400).json({ message: 'Brak polecenia (promptu)' });
  }

  // Wymiary obrazka - honorujemy size/width/height jeśli podane, inaczej presety Fal.ai
  const falImageSize = computeImageSize({ width, height, size, aspect_ratio });

  try {
    // ---------------------------------------------------------
    // TRYB 1: GENEROWANIE Z TEKSTU (Model: FLUX Schnell)
    // ---------------------------------------------------------
    let endpointUrl = 'https://fal.run/fal-ai/flux/schnell';
    let payload = {
      prompt: prompt,
      image_size: falImageSize,
      num_inference_steps: 4,
      num_images: 1,
      enable_safety_checker: true
    };

    // ---------------------------------------------------------
    // TRYB 2: GENEROWANIE ZE ZDJĘCIA (Model: FAST SDXL)
    // ---------------------------------------------------------
    if (init_image) {
      // SDXL jest znacznie lepszy w trzymaniu się stylu line-art bez niszczenia twarzy
      endpointUrl = 'https://fal.run/fal-ai/fast-sdxl/image-to-image';
      payload = {
        prompt: prompt,
        image_url: init_image,
        strength: 0.65, // 65% to idealny balans dla SDXL (trzyma twarz, ale zmienia styl)
        image_size: falImageSize,
        style_preset: "line-art", // Parametr, którego Flux nie obsługuje, a SDXL tak!
        num_inference_steps: 30, // Większa precyzja
        enable_safety_checker: true
      };
    }

    // Wysłanie zapytania do chmury FAL
    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${process.env.FAL_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    // Inteligentny system wyłapywania błędów
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      let errorMessage = errorData.message || "Fal.ai odrzucił zapytanie.";

      if (errorData.detail) {
        if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map(e => e.msg).join(', ');
        } else if (typeof errorData.detail === 'object') {
          errorMessage = JSON.stringify(errorData.detail);
        } else {
          errorMessage = errorData.detail;
        }
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();

    // Zwracamy adres URL wygenerowanego obrazka do frontendu
    if (data.images && data.images.length > 0) {
        res.status(200).json({ imageUrl: data.images[0].url });
    } else {
        throw new Error("Pusta odpowiedź z Fal.ai - nie wygenerowano obrazka.");
    }

  } catch (error) {
    console.error("Szczegóły błędu API (ewa-generate):", error);
    res.status(500).json({ message: error.message });
  }
}

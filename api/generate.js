import { isRateLimited } from './_lib/rateLimit.js';
import { runImageChain } from './_lib/imageModels.js';

// GPT Image 2.5 rysuje ~15–20 s, a przy awarii łańcuch próbuje kolejnych modeli (FLUX.2 pro, FLUX.1 dev).
export const maxDuration = 300;

export default async function handler(req, res) {
  // Akceptujemy tylko zapytania POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Metoda niedozwolona' });
  }

  // Endpoint byl calkowicie otwarty (bez auth, bez limitu) - koszt Fal.ai bez zadnej bariery
  // poza omijalnym localStorage na froncie. 25 generacji / 10 min / IP to bezpieczny zapas
  // dla normalnego uzycia, a odcina proste petle/naduzycia.
  if (isRateLimited(req, { name: 'generate', windowMs: 10 * 60 * 1000, max: 25 })) {
    return res.status(429).json({ message: 'Zbyt wiele generacji obrazków w krótkim czasie. Spróbuj ponownie za kilka minut.' });
  }

  // Odczytujemy wszystkie parametry, w tym nowe (init_image dla zdjęć, size/width/height dla wymiarów)
  const { prompt, negative_prompt, aspect_ratio, init_image, image_strength, size, width, height, seed, model, style, reference_images, reference_image } = req.body;

  if (!prompt) {
    return res.status(400).json({ message: 'Brak polecenia (promptu)' });
  }

  // Tylko na preview (dostęp wyłącznie przez logowanie Vercel; w produkcji ignorowane): test dowolnego
  // modelu fal.ai albo OpenAI Images – do porównań jakości przy audytach grafiki.
  if (process.env.VERCEL_ENV === 'preview' && typeof req.body.testEndpoint === 'string') {
    const ep = req.body.testEndpoint;
    try {
      if (ep.startsWith('openai-direct:')) {
        const r = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: ep.slice('openai-direct:'.length), prompt, size: req.body.testSize || '1024x1024', quality: req.body.testQuality || 'medium', n: 1, ...(req.body.testPayload || {}) })
        });
        const j = await r.json();
        if (!r.ok) return res.status(r.status).json({ message: j.error?.message || 'Błąd OpenAI' });
        const item = j.data?.[0] || {};
        return res.status(200).json({ imageUrl: item.url || `data:image/png;base64,${item.b64_json}`, usage: j.usage || null });
      }
      const r = await fetch(`https://fal.run/${ep}`, {
        method: 'POST',
        headers: { 'Authorization': `Key ${process.env.FAL_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, ...(req.body.testPayload || {}) })
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) return res.status(r.status).json({ message: JSON.stringify(j).slice(0, 600) });
      return res.status(200).json({ imageUrl: j.images?.[0]?.url || j.image?.url || null, keys: Object.keys(j) });
    } catch (e) {
      return res.status(500).json({ message: e.message });
    }
  }

  // Dobór modelu (imageModels.js): najpierw GPT Image 2.5 (zdjęcie do przerobienia -> GPT Image 2.5 edit,
  // reference_image -> ten sam bohater w nowej scenie); zapas: grafika projektowa (model:'recraft') -> Recraft,
  // pozostałe -> FLUX.2 pro / FLUX.1 dev. Przy błędzie lub odmowie modelu łańcuch próbuje kolejnych.
  try {
    const result = await runImageChain({
      prompt, negativePrompt: negative_prompt, aspect_ratio, size, width, height, seed, style,
      initImage: init_image, imageStrength: image_strength,
      // Wzór postaci (np. okładka bajki) – kolejne obrazy z tym samym bohaterem.
      referenceImages: Array.isArray(reference_images) ? reference_images : (reference_image ? [reference_image] : []),
      kind: model === 'recraft' ? 'design' : 'text'
    });
    return res.status(200).json({ imageUrl: result.url, model: result.model });
  } catch (error) {
    console.error('Szczegóły błędu API obrazów:', error.message);
    if (error.status === 422) return res.status(422).json({ error: error.message, message: error.message });
    return res.status(500).json({ message: error.message });
  }
}

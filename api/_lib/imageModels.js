// Wspólny dobór modeli obrazów dla /api/generate i /api/malarz (fal.ai).
// Testy porównawcze z 6.10.2026 (kolorowanka, ilustracja do bajki, ramka dyplomu, plakat z polskim
// napisem, piktogram AAC, zdjęcie -> kolorowanka):
// - GPT Image 2.5 Sunburst (przez fal.ai, hostowany link) – najlepszy w 4/5 zadań: bezbłędne polskie
//   napisy z ogonkami, najwierniej trzyma się opisu (jabłko NA kolcach jeża, piktogram z mydłem i wodą),
//   ok. 0,015–0,03 USD za obraz w jakości "medium"; ~15–20 s.
// - FLUX.2 [pro] – świetne ilustracje i kolorowanki, ale psuje polskie napisy; szybki (~8–10 s) – zapas.
// - Recraft V4.1 – najczystsze, symetryczne ramki z pustym środkiem (dyplomy, dekoracje).
// - Edycja zdjęcia: GPT Image 2.5 edit; dawny SDXL image-to-image w ogóle nie przerabiał zdjęcia
//   (zwracał prawie niezmienione zdjęcie zamiast kolorowanki).
// FLUX.1 [dev] i Recraft V3 zostają jako ostatni zapas (sprawdzone od miesięcy).

const ENDPOINTS = {
  gpt: 'openai/gpt-image-2.5/sunburst/text-to-image',
  gptEdit: 'openai/gpt-image-2.5/sunburst/edit',
  flux2: 'fal-ai/flux-2-pro',
  flux2Edit: 'fal-ai/flux-2-pro/edit',
  recraft: 'fal-ai/recraft/v4.1/text-to-image',
  recraftOld: 'fal-ai/recraft-v3',
  flux1: 'fal-ai/flux/dev',
  sdxlEdit: 'fal-ai/fast-sdxl/image-to-image'
};

// Proporcje obrazka z różnych formatów wejścia (size "WxH", width/height, aspect_ratio "a:b", preset fal).
function ratioOf({ width, height, size, aspect_ratio, preset }) {
  if (width && height) return Number(width) / Number(height);
  if (size && /^\d+x\d+$/i.test(String(size))) { const [w, h] = String(size).split(/x/i).map(Number); return w / h; }
  if (aspect_ratio && /^\d+:\d+$/.test(String(aspect_ratio))) { const [w, h] = String(aspect_ratio).split(':').map(Number); return w / h; }
  const presets = { square_hd: 1, square: 1, portrait_4_3: 3 / 4, portrait_16_9: 9 / 16, landscape_4_3: 4 / 3, landscape_16_9: 16 / 9 };
  if (preset && presets[preset]) return presets[preset];
  return 1;
}

// GPT Image: trzy rozmiary (kwadrat, pion 2:3, poziom 3:2) – najwyższa natywna rozdzielczość do druku.
function gptSize(ratio) {
  if (ratio > 1.15) return { width: 1536, height: 1024 };
  if (ratio < 0.87) return { width: 1024, height: 1536 };
  return { width: 1024, height: 1024 };
}

// FLUX / Recraft: presety fal najbliższe proporcjom.
function falPreset(ratio) {
  if (ratio >= 1.6) return 'landscape_16_9';
  if (ratio > 1.15) return 'landscape_4_3';
  if (ratio <= 0.62) return 'portrait_16_9';
  if (ratio < 0.87) return 'portrait_4_3';
  return 'square_hd';
}

// Zestaw prób (od najlepszej) dla danego rodzaju zadania.
function buildAttempts(o) {
  const ratio = ratioOf(o);
  const negative = o.negativePrompt ? ` Avoid: ${o.negativePrompt}.` : '';
  const seed = typeof o.seed === 'number' && Number.isFinite(o.seed) ? { seed: Math.floor(o.seed) } : {};
  if (o.initImage) {
    // Siła przerobienia z interfejsu (0.2–0.9): wysoka = luźna inspiracja, niska = trzymaj się zdjęcia.
    const loose = typeof o.imageStrength === 'number' && o.imageStrength >= 0.75;
    const editPrompt = `${o.prompt}${negative} ${loose ? 'Use the attached image only as loose inspiration for the subject.' : 'Keep the same subject, pose and composition as in the attached image.'}`;
    return [
      { label: 'gpt-image-2.5-edit', endpoint: ENDPOINTS.gptEdit, payload: { prompt: editPrompt, image_urls: [o.initImage], image_size: gptSize(ratio), quality: 'medium' } },
      { label: 'flux-2-pro-edit', endpoint: ENDPOINTS.flux2Edit, payload: { prompt: editPrompt, image_urls: [o.initImage], image_size: falPreset(ratio), enable_safety_checker: true, ...seed } },
      { label: 'sdxl-img2img', endpoint: ENDPOINTS.sdxlEdit, payload: { prompt: o.prompt, image_url: o.initImage, strength: typeof o.imageStrength === 'number' ? o.imageStrength : 0.65, image_size: falPreset(ratio), num_inference_steps: 30, enable_safety_checker: true, ...(o.negativePrompt ? { negative_prompt: o.negativePrompt } : {}), ...seed } }
    ];
  }
  if (o.kind === 'design') {
    const style = typeof o.style === 'string' && o.style ? o.style : 'digital_illustration';
    return [
      { label: 'recraft-v4.1', endpoint: ENDPOINTS.recraft, payload: { prompt: o.prompt + negative, image_size: falPreset(ratio), style } },
      { label: 'gpt-image-2.5', endpoint: ENDPOINTS.gpt, payload: { prompt: o.prompt + negative, image_size: gptSize(ratio), quality: 'medium' } },
      { label: 'recraft-v3', endpoint: ENDPOINTS.recraftOld, payload: { prompt: o.prompt, image_size: falPreset(ratio), style, enable_safety_checker: true } }
    ];
  }
  return [
    { label: 'gpt-image-2.5', endpoint: ENDPOINTS.gpt, payload: { prompt: o.prompt + negative, image_size: gptSize(ratio), quality: 'medium' } },
    { label: 'flux-2-pro', endpoint: ENDPOINTS.flux2, payload: { prompt: o.prompt + negative, image_size: falPreset(ratio), enable_safety_checker: true, ...seed } },
    { label: 'flux-1-dev', endpoint: ENDPOINTS.flux1, payload: { prompt: o.prompt, image_size: falPreset(ratio), num_inference_steps: 28, guidance_scale: 3.5, enable_safety_checker: true, ...seed } }
  ];
}

// Uruchamia próby po kolei; zwraca { url, model } albo rzuca błąd z ostatniej próby.
// Blokada filtrem bezpieczeństwa (czarny obrazek FLUX/SDXL) kończy się kodem 422 bez dalszych prób.
async function runImageChain(options) {
  const falKey = options.falKey || process.env.FAL_KEY;
  if (!falKey) throw Object.assign(new Error('Brak klucza FAL_KEY na serwerze.'), { status: 500 });
  const attempts = buildAttempts(options);
  let lastError = 'Nie udało się wygenerować obrazka.';
  for (const a of attempts) {
    try {
      const response = await fetch(`https://fal.run/${a.endpoint}`, {
        method: 'POST',
        headers: { 'Authorization': `Key ${falKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(a.payload)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        lastError = typeof data.detail === 'string' ? data.detail : (data.message || JSON.stringify(data.detail || data).slice(0, 300));
        console.warn(`[obraz] ${a.label} HTTP ${response.status} – próbuję kolejnego modelu`);
        continue;
      }
      const flagged = Array.isArray(data.has_nsfw_concepts) && data.has_nsfw_concepts[0];
      if (flagged) {
        throw Object.assign(new Error('Obrazek został zablokowany przez automatyczny filtr bezpieczeństwa AI (częsty „fałszywy alarm” przy zdjęciach osób/dzieci). Spróbuj innego zdjęcia albo mniej dosłownego opisu.'), { status: 422 });
      }
      const url = data.images?.[0]?.url || data.image?.url;
      if (url) {
        console.log(`[obraz] ${a.label} OK`);
        return { url, model: a.label };
      }
      lastError = 'Model nie zwrócił obrazka.';
    } catch (e) {
      if (e.status === 422) throw e;
      lastError = e.message;
    }
  }
  throw Object.assign(new Error(lastError), { status: 500 });
}

module.exports = { runImageChain, buildAttempts, gptSize, falPreset, ratioOf, ENDPOINTS };

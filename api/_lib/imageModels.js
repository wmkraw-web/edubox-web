// Wspólny dobór modeli obrazów dla /api/generate i /api/malarz (fal.ai): kolejność prób w łańcuchu.
// Adresy modeli, parametry, ceny i wyniki testów są w rejestrze api/_lib/falModels.js (jedno miejsce).
// Skrót testów 6–7.10.2026: GPT Image 2.5 najlepszy prawie we wszystkim (polskie napisy, wierność opisu,
// edycja zdjęcia, wzór postaci); FLUX.2 pro – zapas (psuje napisy); Recraft V4.1 / V3 – zapas grafiki
// projektowej; FLUX.1 dev i SDXL – ostatnie zapasy.
const { MODELS } = require('./falModels.js');

const ENDPOINTS = {
  gpt: MODELS.gpt.slug,
  gptEdit: MODELS.gptEdit.slug,
  flux2: MODELS.flux2.slug,
  flux2Edit: MODELS.flux2Edit.slug,
  recraft: MODELS.recraft.slug,
  recraftOld: MODELS.design.slug,
  flux1: MODELS.text.slug,
  sdxlEdit: MODELS.imageToImage.slug
};
// Stałe parametry modelu (quality, liczba kroków, filtr bezpieczeństwa) – kopia z rejestru.
const P = (kind) => Object.assign({}, MODELS[kind].params);

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
      { label: 'gpt-image-2.5-edit', endpoint: ENDPOINTS.gptEdit, payload: { prompt: editPrompt, image_urls: [o.initImage], image_size: gptSize(ratio), ...P('gptEdit') } },
      { label: 'flux-2-pro-edit', endpoint: ENDPOINTS.flux2Edit, payload: { prompt: editPrompt, image_urls: [o.initImage], image_size: falPreset(ratio), ...P('flux2Edit'), ...seed } },
      { label: 'sdxl-img2img', endpoint: ENDPOINTS.sdxlEdit, payload: { prompt: o.prompt, image_url: o.initImage, strength: typeof o.imageStrength === 'number' ? o.imageStrength : 0.65, image_size: falPreset(ratio), ...P('imageToImage'), ...(o.negativePrompt ? { negative_prompt: o.negativePrompt } : {}), ...seed } }
    ];
  }
  // Wzór postaci (okładka bajki, pierwszy kadr komiksu): kolejne obrazy z tym samym bohaterem w nowej scenie.
  // Wspólny seed tego nie zapewniał – modele z edycją wielu obrazów trzymają twarz, fryzurę i ubranie.
  const refs = Array.isArray(o.referenceImages) ? o.referenceImages.filter(u => typeof u === 'string' && /^(https:\/\/|data:image\/)/.test(u)).slice(0, 4) : [];
  if (refs.length) {
    // Test 6.10.2026: bez zastrzeżeń model kopiował też minę (uśmiech w scenie strachu) i postacie z tła okładki.
    const refPrompt = `${o.prompt}${negative} The attached image is ONLY a character reference: draw the same main character (identical face, hair, skin tone, clothes, colors and proportions) in the same art style. Do NOT copy the pose, facial expression, background or other characters from the reference – pose, emotion and setting must follow the description above. Other characters from the reference may appear only if the description mentions them. Draw a completely new scene.`;
    return [
      { label: 'gpt-image-2.5-ref', endpoint: ENDPOINTS.gptEdit, payload: { prompt: refPrompt, image_urls: refs, image_size: gptSize(ratio), ...P('gptEdit') } },
      { label: 'flux-2-pro-ref', endpoint: ENDPOINTS.flux2Edit, payload: { prompt: refPrompt, image_urls: refs, image_size: falPreset(ratio), ...P('flux2Edit') } },
      { label: 'gpt-image-2.5', endpoint: ENDPOINTS.gpt, payload: { prompt: o.prompt + negative, image_size: gptSize(ratio), ...P('gpt') } }
    ];
  }
  if (o.kind === 'design') {
    const style = typeof o.style === 'string' && o.style ? o.style : 'digital_illustration';
    // Test 6.10.2026 (medal, zaproszenie, ramka dyplomu z postaciami w rogach): GPT Image 2.5 lepiej trzyma
    // kompozycję z instrukcji (okrągły medal z miejscem na tekst, postacie tylko w rogach) i jest tańszy –
    // idzie pierwszy. Recraft V4.1 przyjmuje WYŁĄCZNIE style 'any' i 'vector_illustration' (inne = błąd 422),
    // a 'vector_illustration' zwraca plik SVG, którego narzędzia nie wydrukują przez canvas/PDF – dostaje 'any',
    // a styl opisujemy słowami. Recraft V3 zna pełną listę stylów rastrowych.
    const isVector = /^vector/.test(style);
    const styleWords = isVector ? ' Flat vector illustration style, clean geometric shapes, solid colors.'
      : /hand_drawn/.test(style) ? ' Hand-drawn illustration style.' : '';
    const designPrompt = o.prompt + negative + styleWords;
    return [
      { label: 'gpt-image-2.5', endpoint: ENDPOINTS.gpt, payload: { prompt: designPrompt, image_size: gptSize(ratio), ...P('gpt') } },
      { label: 'recraft-v4.1', endpoint: ENDPOINTS.recraft, payload: { prompt: designPrompt, image_size: falPreset(ratio), ...P('recraft') } },
      { label: 'recraft-v3', endpoint: ENDPOINTS.recraftOld, payload: { prompt: designPrompt, image_size: falPreset(ratio), style: isVector ? 'digital_illustration' : style, ...P('design') } }
    ];
  }
  return [
    { label: 'gpt-image-2.5', endpoint: ENDPOINTS.gpt, payload: { prompt: o.prompt + negative, image_size: gptSize(ratio), ...P('gpt') } },
    { label: 'flux-2-pro', endpoint: ENDPOINTS.flux2, payload: { prompt: o.prompt + negative, image_size: falPreset(ratio), ...P('flux2'), ...seed } },
    { label: 'flux-1-dev', endpoint: ENDPOINTS.flux1, payload: { prompt: o.prompt, image_size: falPreset(ratio), ...P('text'), ...seed } }
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

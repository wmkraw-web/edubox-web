'use strict';

// Rejestr modeli obrazkowych Fal.ai – endpointy i wspólne parametry w JEDNYM miejscu.
// Wcześniej te same wartości (flux/dev: 28 kroków, guidance 3.5; i2i: 30 kroków) siedziały
// osobno w api/generate.js, api/malarz.js i api/ewa-generate.js i mogły się po cichu rozjechać.
// Plik w api/_lib/ NIE liczy się do limitu 12 funkcji Vercel (jak api/_lib/scamCheck.js).
//
// ────────────────────────────────────────────────────────────────────────────────────────
// CENY (stan 6.10.2026). UWAGA: fal.ai jest zablokowany w sandboxie deweloperskim, więc te
// liczby pochodzą z agregatorów cen, nie z cennika u źródła. PRZED zmianą modelu sprawdź
// cenę na fal.ai/pricing – to się zmienia co kilka tygodni.
//   flux/dev                ~0,025 USD / obraz   ← obecny domyślny
//   recraft-v3              ~0,04 USD / obraz (wersja wektorowa ~0,08)
//   fast-sdxl image-to-image  rozliczane za megapiksel
//
// KANDYDAT NA PODMIANĘ: FLUX.2 [dev] Turbo – podawane ~0,008 USD/obraz i 1024×1024 w ~6,6 s,
// czyli ~3× taniej i szybciej niż flux/dev.
//
// ALE: tego NIE podmieniamy bez testu na żywo. flux/schnell był już raz wdrożony i WYCOFANY,
// bo przy tej samej cenie-za-szybkość gubił anatomię i kadrowanie: „pszczółki" wychodziły jako
// ptaki, a dziecko niesione na barana było ucięte w połowie. Tanio ≠ dobrze dla naszych
// zastosowań (kolorowanki, piktogramy AAC, ramki dyplomów), więc każdy nowy model przechodzi
// tę samą próbę co schnell.
//
// JAK PRZETESTOWAĆ bez wdrażania (ta sama konwencja co testModel w api/chat.js – działa
// WYŁĄCZNIE na preview, chronionym logowaniem Vercel; w produkcji pole jest ignorowane):
//   w body żądania podaj  testFalEndpoint: "fal-ai/flux-2/dev/turbo"
//   opcjonalnie           testFalParams: { "num_inference_steps": 8 }
// Potem porównaj ten sam prompt na starym i nowym modelu, zanim zmienisz wartość niżej.
// ────────────────────────────────────────────────────────────────────────────────────────

const BASE = 'https://fal.run/';

const MODELS = {
  // Domyślny tekst → obraz. Wolniejszy i droższy od schnella, ale znacznie wierniej
  // trzyma się promptu – to był świadomy wybór, nie zaniedbanie.
  text: {
    slug: 'fal-ai/flux/dev',
    params: { num_inference_steps: 28, guidance_scale: 3.5, enable_safety_checker: true },
    acceptsSeed: true
  },
  // Grafika projektowa: płaskie ilustracje i ramki dyplomów. Trzyma układ
  // „ozdobna ramka + pusty środek" dużo lepiej niż FLUX. Nie przyjmuje seeda.
  design: {
    slug: 'fal-ai/recraft-v3',
    params: { enable_safety_checker: true },
    acceptsSeed: false
  },
  // Obraz → obraz. SDXL lepiej trzyma kompozycję wzoru bez niszczenia twarzy i proporcji.
  // To najstarszy model w zestawie (SDXL, 2023) – pierwszy kandydat do przeglądu.
  imageToImage: {
    slug: 'fal-ai/fast-sdxl/image-to-image',
    params: { num_inference_steps: 30, enable_safety_checker: true },
    acceptsSeed: true
  },
  // Powiększanie gotowej grafiki (api/upscale.js). creativity nisko, resemblance wysoko –
  // chcemy więcej pikseli, nie domalowywania szczegółów, których w oryginale nie było.
  upscale: {
    slug: 'fal-ai/clarity-upscaler',
    params: { creativity: 0.15, resemblance: 0.9, num_inference_steps: 16 },
    acceptsSeed: false
  }
};

// Czy wolno użyć nadpisania z body. Preview jest chronione logowaniem Vercel, produkcja nie –
// dlatego w produkcji pola testowe są ignorowane, tak samo jak testModel w api/chat.js.
const isPreview = () => process.env.VERCEL_ENV === 'preview';

// Slug musi wyglądać jak ścieżka modelu Fal (owner/model[/wariant]), żeby pole testowe
// nie dało się użyć do wysłania żądania pod dowolny adres (SSRF).
const SAFE_SLUG = /^[a-z0-9][a-z0-9._-]*(?:\/[a-z0-9][a-z0-9._-]*){1,3}$/i;

/**
 * Zwraca { url, params, acceptsSeed } dla danego rodzaju modelu.
 * @param {'text'|'design'|'imageToImage'} kind
 * @param {object} [body] - body żądania; na preview może zawierać testFalEndpoint/testFalParams.
 */
function falModel(kind, body) {
  const model = MODELS[kind];
  if (!model) throw new Error('Nieznany rodzaj modelu Fal: ' + kind);

  let slug = model.slug;
  let params = Object.assign({}, model.params);

  if (body && isPreview()) {
    if (typeof body.testFalEndpoint === 'string' && SAFE_SLUG.test(body.testFalEndpoint)) {
      slug = body.testFalEndpoint.replace(/^\/+|\/+$/g, '');
    }
    if (body.testFalParams && typeof body.testFalParams === 'object' && !Array.isArray(body.testFalParams)) {
      params = Object.assign(params, body.testFalParams);
    }
  }

  return { url: BASE + slug, params, acceptsSeed: model.acceptsSeed, slug };
}

module.exports = { falModel, MODELS, SAFE_SLUG };

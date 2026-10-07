'use strict';

// Rejestr modeli obrazkowych Fal.ai – endpointy i wspólne parametry w JEDNYM miejscu.
// Korzystają z niego: api/_lib/imageModels.js (łańcuch modeli dla /api/generate i /api/malarz),
// api/upscale.js (powiększanie do druku) i api/ewa-generate.js (prywatne EduInfluencer Studio).
// Plik w api/_lib/ NIE liczy się do limitu 12 funkcji Vercel (jak api/_lib/scamCheck.js).
//
// ────────────────────────────────────────────────────────────────────────────────────────
// SKĄD TEN ZESTAW (testy NA ŻYWO 6–7.10.2026, ten sam prompt na wielu modelach: kolorowanka,
// ilustracja do bajki, ramka dyplomu, medal, zaproszenie, plakat z polskim napisem, piktogram AAC,
// zdjęcie → kolorowanka, seria z tym samym bohaterem):
// - GPT Image 2.5 (model OpenAI uruchamiany przez fal.ai) – najlepszy w prawie wszystkim: bezbłędne
//   polskie napisy z ogonkami, najwierniej trzyma opis i kompozycję (jabłko NA kolcach jeża, mydło
//   i woda na piktogramie, postacie tylko w rogach ramki), edycja zdjęcia i "wzór postaci".
// - FLUX.2 pro – ładne ilustracje, szybki, ale psuje polskie napisy – zapas.
// - Recraft V4.1 – czyste ramki, szybki, ale słabszy w medalach/zaproszeniach i piktogramach
//   (abstrakcyjne symbole). Przyjmuje TYLKO style 'any' i 'vector_illustration' (inne = 422),
//   a 'vector_illustration' zwraca SVG, którego narzędzia nie wydrukują przez canvas/PDF.
// - Słabsze w naszych zadaniach (sprawdzone, nie wracać bez nowej wersji): Nano Banana 2,
//   Seedream 4.5, FLUX 3, Ideogram v3; SDXL image-to-image prawie nie przerabiał zdjęcia.
// - flux/schnell był kiedyś wdrożony i WYCOFANY ("pszczółki" jako ptaki, ucięte postacie).
//
// JAK PRZETESTOWAĆ kandydata bez wdrażania (tylko preview, chronione logowaniem Vercel; w produkcji
// pola są ignorowane): /api/generate przyjmuje testEndpoint: "owner/model" + testPayload: {...}
// (albo "openai-direct:<model>"); /api/ewa-generate – testFalEndpoint / testFalParams (falModel niżej).
// ────────────────────────────────────────────────────────────────────────────────────────

const BASE = 'https://fal.run/';

const MODELS = {
  // ── Łańcuch narzędzi publicznych (imageModels.js) ──
  // Główny model: tekst → obraz (quality 'medium' – kompromis jakości i ceny sprawdzony w testach).
  gpt: {
    slug: 'openai/gpt-image-2.5/sunburst/text-to-image',
    params: { quality: 'medium' },
    acceptsSeed: false
  },
  // Edycja: zdjęcie użytkownika → styl, oraz "wzór postaci" (reference_image) w seriach obrazków.
  gptEdit: {
    slug: 'openai/gpt-image-2.5/sunburst/edit',
    params: { quality: 'medium' },
    acceptsSeed: false
  },
  flux2: {
    slug: 'fal-ai/flux-2-pro',
    params: { enable_safety_checker: true },
    acceptsSeed: true
  },
  flux2Edit: {
    slug: 'fal-ai/flux-2-pro/edit',
    params: { enable_safety_checker: true },
    acceptsSeed: true
  },
  // Zapas grafiki projektowej (model:'recraft'): tylko styl 'any' – patrz nagłówek.
  recraft: {
    slug: 'fal-ai/recraft/v4.1/text-to-image',
    params: { style: 'any' },
    acceptsSeed: false
  },
  // ── Ostatnie zapasy łańcucha + EduInfluencer (ewa-generate.js) ──
  text: {
    slug: 'fal-ai/flux/dev',
    params: { num_inference_steps: 28, guidance_scale: 3.5, enable_safety_checker: true },
    acceptsSeed: true
  },
  design: {
    slug: 'fal-ai/recraft-v3',
    params: { enable_safety_checker: true },
    acceptsSeed: false
  },
  imageToImage: {
    slug: 'fal-ai/fast-sdxl/image-to-image',
    params: { num_inference_steps: 30, enable_safety_checker: true },
    acceptsSeed: true
  },
  // ── Powiększanie do druku (api/upscale.js) ──
  // Recraft Crisp: ok. 4096 px na dłuższym boku, ostre detale bez "dorysowywania".
  upscale: {
    slug: 'fal-ai/recraft/upscale/crisp',
    params: {},
    acceptsSeed: false
  },
  upscaleFallback: {
    slug: 'fal-ai/esrgan',
    params: { scale: 2 },
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
 * Zwraca { url, params, acceptsSeed, slug } dla danego rodzaju modelu.
 * @param {string} kind - klucz z MODELS (np. 'gpt', 'text', 'imageToImage', 'upscale').
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

// Dane do cyklicznego przeglądu (scripts/check-fal-models.js + workflow fal-models-check.yml).
// Trzymane jako DANE, nie tylko w komentarzu, żeby skrypt mógł sprawdzić, kiedy ostatnio
// ktoś na to patrzył, i przypomnieć mailem. Po przeglądzie: popraw ceny i przesuń reviewedAt.
const REVIEW = {
  reviewedAt: '2026-10-07',
  // Co ile dni przypominać. Nowe modele graficzne pojawiają się co kilka tygodni – kwartał
  // to rozsądny rytm, żeby nie przegapić wyraźnie lepszego lub tańszego.
  maxAgeDays: 90,
  priceSource: 'https://fal.ai/pricing (oraz strona modelu: https://fal.ai/models/<slug>)',
  // Ceny: "zmierzone" = z rozliczenia testów 6–7.10.2026 albo ze strony modelu; reszta do potwierdzenia.
  prices: {
    'openai/gpt-image-2.5/sunburst/text-to-image': '~0,014 USD (1024x1024) – 0,02 USD (1536x1024), quality medium – zmierzone',
    'openai/gpt-image-2.5/sunburst/edit': 'jak wyżej + obraz wejściowy',
    'fal-ai/flux-2-pro': 'do potwierdzenia (rozliczane za megapiksel)',
    'fal-ai/flux-2-pro/edit': 'do potwierdzenia (rozliczane za megapiksel)',
    'fal-ai/recraft/v4.1/text-to-image': '~0,04 USD / obraz – do potwierdzenia',
    'fal-ai/flux/dev': '~0,025 USD / obraz',
    'fal-ai/recraft-v3': '~0,04 USD / obraz (wektor ~0,08)',
    'fal-ai/fast-sdxl/image-to-image': 'rozliczane za megapiksel',
    'fal-ai/recraft/upscale/crisp': '0,004 USD / obraz – strona modelu',
    'fal-ai/esrgan': 'rozliczane za czas pracy (ułamek centa)'
  },
  // Modele warte przetestowania przy najbliższym przeglądzie.
  candidates: [
    {
      slug: 'fal-ai/flux-2/dev/turbo',
      why: '~0,008 USD / obraz i 1024x1024 w ~6,6 s – tańszy zapas zamiast FLUX.2 pro (napisy i anatomia do sprawdzenia)',
      replaces: 'flux2'
    }
  ],
  // Czego NIE wolno zapomnieć przy ocenie kandydata.
  warning: 'Tanio nie znaczy dobrze: flux/schnell był wdrożony i wycofany („pszczółki” jako ptaki, '
    + 'ucięte postacie). Każdy kandydat przechodzi tę samą próbę: polski napis na plakacie, '
    + 'kolorowanka, piktogram AAC (czynność czytelna dla dziecka), ramka dyplomu, seria z tym samym bohaterem.'
};

module.exports = { falModel, MODELS, SAFE_SLUG, REVIEW };

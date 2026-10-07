'use strict';

// Testy rejestru modeli Fal.ai. Najważniejsze zadanie: żadna zmiana modelu ani parametrów nie może
// przejść "po cichu" – rejestr zasila łańcuch wszystkich narzędzi graficznych naraz
// (api/_lib/imageModels.js), powiększanie do druku i EduInfluencer Studio.
//   node api/_lib/falModels.test.js

const assert = require('assert');
const { falModel, MODELS, SAFE_SLUG } = require('./falModels.js');
const { buildAttempts, ENDPOINTS } = require('./imageModels.js');

let ok = 0;
const test = (name, fn) => {
  try { fn(); console.log('✅ ' + name); ok++; }
  catch (e) { console.log('❌ ' + name + '\n   ' + e.message); process.exitCode = 1; }
};

// Oczekiwane modele – wybór z testów na żywo 6–7.10.2026 (szczegóły w nagłówku falModels.js).
// Gdy ktoś świadomie zmienia model, musi zmienić je także tutaj – i wtedy wie, że dotyka
// jakości wszystkich narzędzi graficznych, nie jednego.
const OCZEKIWANE = {
  gpt: {
    url: 'https://fal.run/openai/gpt-image-2.5/sunburst/text-to-image',
    params: { quality: 'medium' },
    acceptsSeed: false
  },
  gptEdit: {
    url: 'https://fal.run/openai/gpt-image-2.5/sunburst/edit',
    params: { quality: 'medium' },
    acceptsSeed: false
  },
  flux2: {
    url: 'https://fal.run/fal-ai/flux-2-pro',
    params: { enable_safety_checker: true },
    acceptsSeed: true
  },
  flux2Edit: {
    url: 'https://fal.run/fal-ai/flux-2-pro/edit',
    params: { enable_safety_checker: true },
    acceptsSeed: true
  },
  recraft: {
    url: 'https://fal.run/fal-ai/recraft/v4.1/text-to-image',
    params: { style: 'any' },
    acceptsSeed: false
  },
  text: {
    url: 'https://fal.run/fal-ai/flux/dev',
    params: { num_inference_steps: 28, guidance_scale: 3.5, enable_safety_checker: true },
    acceptsSeed: true
  },
  design: {
    url: 'https://fal.run/fal-ai/recraft-v3',
    params: { enable_safety_checker: true },
    acceptsSeed: false
  },
  imageToImage: {
    url: 'https://fal.run/fal-ai/fast-sdxl/image-to-image',
    params: { num_inference_steps: 30, enable_safety_checker: true },
    acceptsSeed: true
  },
  upscale: {
    url: 'https://fal.run/fal-ai/recraft/upscale/crisp',
    params: {},
    acceptsSeed: false
  },
  upscaleFallback: {
    url: 'https://fal.run/fal-ai/esrgan',
    params: { scale: 2 },
    acceptsSeed: false
  }
};

for (const [kind, oczekiwane] of Object.entries(OCZEKIWANE)) {
  test(`${kind}: endpoint i parametry zgodne z wyborem z testów`, () => {
    const fal = falModel(kind);
    assert.strictEqual(fal.url, oczekiwane.url);
    assert.deepStrictEqual(fal.params, oczekiwane.params);
    assert.strictEqual(fal.acceptsSeed, oczekiwane.acceptsSeed);
  });
}

test('rejestr nie ma modeli poza oczekiwanymi', () => {
  assert.deepStrictEqual(Object.keys(MODELS).sort(), Object.keys(OCZEKIWANE).sort());
});

// --- Łańcuch narzędzi (imageModels.js) bierze adresy i parametry z rejestru ---

test('łańcuch używa adresów z rejestru', () => {
  for (const slug of Object.values(ENDPOINTS)) {
    assert.ok(Object.values(MODELS).some(m => m.slug === slug), 'adres spoza rejestru: ' + slug);
  }
});

test('pierwsza próba każdego rodzaju zadania to GPT Image 2.5 z parametrami z rejestru', () => {
  const zadania = [
    { prompt: 'x' },
    { prompt: 'x', kind: 'design', style: 'vector_illustration' },
    { prompt: 'x', initImage: 'https://example.com/a.png' },
    { prompt: 'x', referenceImages: ['https://example.com/a.png'] }
  ];
  for (const z of zadania) {
    const [pierwsza] = buildAttempts(z);
    assert.ok(pierwsza.endpoint === MODELS.gpt.slug || pierwsza.endpoint === MODELS.gptEdit.slug, JSON.stringify(z));
    assert.strictEqual(pierwsza.payload.quality, 'medium');
  }
});

// Recraft V4.1 zwraca 422 dla każdego stylu poza 'any' i 'vector_illustration' (a vector = plik SVG).
// Przez to grafika projektowa po cichu przechodziła na zapas – ten test pilnuje, by nie wróciło.
test('Recraft V4.1 zawsze dostaje styl any (bez 422 i bez SVG)', () => {
  for (const style of ['vector_illustration', 'digital_illustration', 'digital_illustration/hand_drawn', undefined]) {
    const proba = buildAttempts({ prompt: 'x', kind: 'design', style }).find(a => a.endpoint === MODELS.recraft.slug);
    assert.strictEqual(proba.payload.style, 'any', 'styl: ' + style);
  }
});

test('nieznany rodzaj modelu rzuca błędem, nie wysyła żądania w nieznane', () => {
  assert.throws(() => falModel('nieistnieje'), /Nieznany rodzaj modelu/);
});

test('zwrócone params to kopia – nadpisanie nie psuje rejestru dla kolejnych żądań', () => {
  const a = falModel('text');
  a.params.num_inference_steps = 1;
  assert.strictEqual(falModel('text').params.num_inference_steps, 28);
});

// --- Pola testowe: tylko na preview (produkcja je ignoruje, jak testModel w api/chat.js) ---

const zPreview = (fn) => {
  const stare = process.env.VERCEL_ENV;
  process.env.VERCEL_ENV = 'preview';
  try { return fn(); } finally {
    if (stare === undefined) delete process.env.VERCEL_ENV; else process.env.VERCEL_ENV = stare;
  }
};

test('w produkcji testFalEndpoint jest ignorowane', () => {
  const stare = process.env.VERCEL_ENV;
  process.env.VERCEL_ENV = 'production';
  try {
    const fal = falModel('text', { testFalEndpoint: 'fal-ai/flux-2/dev/turbo' });
    assert.strictEqual(fal.url, 'https://fal.run/fal-ai/flux/dev');
  } finally {
    if (stare === undefined) delete process.env.VERCEL_ENV; else process.env.VERCEL_ENV = stare;
  }
});

test('na preview testFalEndpoint podmienia model', () => zPreview(() => {
  const fal = falModel('text', { testFalEndpoint: 'fal-ai/flux-2/dev/turbo' });
  assert.strictEqual(fal.url, 'https://fal.run/fal-ai/flux-2/dev/turbo');
}));

test('na preview testFalParams dokłada parametry, nie kasuje reszty', () => zPreview(() => {
  const fal = falModel('text', { testFalParams: { num_inference_steps: 8 } });
  assert.strictEqual(fal.params.num_inference_steps, 8);
  assert.strictEqual(fal.params.guidance_scale, 3.5);
  assert.strictEqual(fal.params.enable_safety_checker, true);
}));

// Pole testowe buduje URL, więc musi być odporne na próbę wskazania obcego hosta (SSRF).
test('testFalEndpoint odrzuca próby wyjścia poza fal.run (SSRF)', () => zPreview(() => {
  const zle = [
    'https://zly.example.com/x',
    '//zly.example.com/x',
    '../../etc/passwd',
    'fal-ai/model?x=1',
    'fal-ai',
    'fal-ai/a/b/c/d/e',
    'fal ai/model'
  ];
  for (const slug of zle) {
    const fal = falModel('text', { testFalEndpoint: slug });
    assert.strictEqual(fal.url, 'https://fal.run/fal-ai/flux/dev', 'przeszło: ' + slug);
  }
}));

test('SAFE_SLUG przepuszcza realne slugi Fal', () => {
  for (const s of ['fal-ai/flux/dev', 'fal-ai/recraft-v3', 'fal-ai/fast-sdxl/image-to-image', 'fal-ai/flux-2/dev/turbo',
    'openai/gpt-image-2.5/sunburst/text-to-image', 'fal-ai/recraft/v4.1/text-to-image', 'fal-ai/recraft/upscale/crisp']) {
    assert.ok(SAFE_SLUG.test(s), 'odrzucone: ' + s);
  }
});

test('testFalParams musi być obiektem – tablica i string nic nie zmieniają', () => zPreview(() => {
  for (const zle of [['a'], 'tekst', 42, null]) {
    assert.strictEqual(falModel('text', { testFalParams: zle }).params.num_inference_steps, 28);
  }
}));

// Świadoma, odnotowana zmiana przy refaktorze: w malarz.js seed był pomijany przy
// `model !== 'recraft'`, więc nie trafiał do SDXL także wtedy, gdy klient podał
// model 'recraft' RAZEM ze zdjęciem. Teraz decyduje acceptsSeed modelu, który faktycznie
// dostaje żądanie, więc SDXL dostaje seed (a seed poprawia spójność postaci między
// kadrami – patrz komentarz w malarz.js). Kombinacja jest nieosiągalna z frontendu:
// w edudekorator.html gałęzie 'recraft' i init_image są rozłączne, a żaden rozmówca
// /api/malarz nie wysyła seeda. Gdyby kiedyś zaczął – to zachowanie jest poprawne.
test('seed decyduje model, który faktycznie dostaje żądanie', () => {
  assert.strictEqual(falModel('design').acceptsSeed, false, 'Recraft V3 nie przyjmuje seeda');
  assert.strictEqual(falModel('imageToImage').acceptsSeed, true, 'SDXL przyjmuje seed');
});

console.log('\n' + ok + ' OK' + (process.exitCode ? ', są błędy' : ', 0 błędów'));

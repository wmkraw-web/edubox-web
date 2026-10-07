'use strict';

// Kontrola wzorca generatorów dokumentów (CLAUDE.md) i wspólnej warstwy wyglądu.
// Pilnuje rzeczy, które przy kolejnych zmianach najłatwiej cicho zepsuć:
//  - dokument leci strumieniem na modelu "strong", ląduje na kartce A4 i da się go poprawić,
//  - eksport bierze POPRAWIONĄ treść, Word to prawdziwy .docx (nie HTML z mime msword),
//  - instrukcja dla AI zabrania dopisywania faktów (braki jako [uzupełnij: …]),
//  - narzędzia nie obiecują "rozbudowanych akapitów" ani "tarczy ochronnej",
//  - przekonwertowane narzędzia nie wracają do neonowych poświat i mają @media print.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

// Kontrast wg WCAG: luminancja sRGB i stosunek jaśniejszego do ciemniejszego.
const luminance = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
// Windows (git autocrlf) daje CRLF – wyrażenia w testach zakładają LF, więc ujednolicamy końce linii.
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');

// Narzędzia z pełnym wzorcem: kartka + edycja + eksport z kartki.
const PAPER_TOOLS = [
  'asystent-pedagoga.html',
  'edudostosowania.html',
  'edudialog.html',
  'edusprawozdania.html',
  'edubiurokrata.html',
  'awans.html',
  'edunotariusz.html',
  'eduraport.html'
];

// Narzędzia, które korzystają z EduDocTools, ale budują HTML same (nie ze strumienia AI).
const EXPORT_ONLY_TOOLS = ['edulekcja360.html', 'eduawans.html'];

// Narzędzia na wspólnej warstwie wyglądu wykrywamy z plików – lista na sztywno
// rozjechałaby się przy pierwszym podpięciu kolejnej strony.
const UI_TOOLS = fs.readdirSync(root)
  .filter((f) => f.endsWith('.html'))
  .filter((f) => /<link[^>]+href="\/edubox-ui\.css"/.test(read(f)))
  .sort();

const sources = new Map();
for (const file of [...PAPER_TOOLS, ...EXPORT_ONLY_TOOLS]) sources.set(file, read(file));

// --------------------------------------------------------- 1. Wzorzec kartki

for (const file of PAPER_TOOLS) {
  const src = sources.get(file);
  assert.ok(/<script src="\/doc-tools\.js"><\/script>/.test(src), `${file}: brak doc-tools.js`);
  assert.ok(/href="\/doc-paper\.css"/.test(src), `${file}: brak doc-paper.css`);
  assert.ok(/streamChat\(/.test(src), `${file}: dokument powinien płynąć strumieniem`);
  // Asystent Pedagoga wybiera model wyrażeniem warunkowym, nie literałem.
  assert.ok(/model:[^\n]*'strong'/.test(src), `${file}: dokumenty urzędowe idą na model "strong"`);
  assert.ok(/doc-paper/.test(src), `${file}: podgląd ma być kartką A4`);
  assert.ok(/contentEditable=\{!isStreaming\}/.test(src), `${file}: kartka ma być edytowalna po napisaniu`);
  assert.ok(/\w+Ref\.current && \w+Ref\.current\.innerHTML/.test(src),
    `${file}: eksport musi czytać innerHTML kartki przez ref (poprawki nauczyciela), nie surowe wyjście AI`);
  assert.ok(/DT\.downloadDocx\(|EduDocTools\.downloadDocx\(/.test(src), `${file}: Word przez downloadDocx`);
  assert.ok(/DT\.copyRich\(|EduDocTools\.copyRich\(/.test(src), `${file}: kopiowanie przez copyRich`);
  assert.ok(/printDoc\(/.test(src), `${file}: wydruk/PDF przez printDoc`);
  assert.ok(/markPlaceholders\(/.test(src), `${file}: pola [uzupełnij: …] mają być żółte`);
}

// Fejkowy .doc (HTML w pliku z mime Worda) - nigdy więcej, w żadnym narzędziu.
for (const [file, src] of sources) {
  assert.ok(!/application\/msword/.test(src),
    `${file}: eksport .doc z HTML-em w środku zamiast prawdziwego .docx`);
}

// --------------------------------------- 2. Instrukcje dla AI: bez zmyślania

// Zwroty, które wprost kazały modelowi rozdmuchać dokument albo stanąć po jednej stronie.
const FORBIDDEN_PHRASES = [
  { re: /minimum \d+ rozbudowan/i, why: 'wymóg "minimum N rozbudowanych akapitów" wymusza zmyślanie treści' },
  { re: /tarcz[aęy] ochronn/i, why: 'notatka służbowa to zapis faktów, nie tarcza w sporze' },
  { re: /żelazn[aą] tarcz/i, why: 'notatka służbowa to zapis faktów, nie tarcza w sporze' },
  { re: /lany tekst/i, why: '"lany tekst" to obietnica wypełniacza' },
  { re: /podnios[łl]/i, why: 'podniosły ton zastępuje konkret pustymi formułkami' },
  { re: /swobodnej eksploracji/i, why: 'przykład pustej formułki w instrukcji dla AI' },
  { re: /ubierz[ея]? (?:to )?w cele/i, why: 'AI nie ma dopisywać celów, których nie ma w notatkach' }
];

// Skanujemy kod bez komentarzy liniowych - komentarz wyjaśniający, CO usunęliśmy
// i dlaczego, jest wartościowy i nie może wywalać testu.
const withoutLineComments = (src) => src
  .split('\n')
  .filter((line) => !/^\s*\/\//.test(line))
  .join('\n');

// "Bez podniosłego tonu" i "bez pustych formułek (…swobodna eksploracja…)" to ZAKAZY
// w instrukcji - dokładnie to, czego chcemy. Liczy się tylko zwrot BEZ negacji przed nim.
const NEGATION = /(?:\bbez\b|\bnie\b|\bunikaj\b|\bzakaz|\bżadn)/i;

const offendingPhrase = (src) => {
  const code = withoutLineComments(src);
  for (const { re, why } of FORBIDDEN_PHRASES) {
    const flags = re.flags.includes('g') ? re.flags : re.flags + 'g';
    const scan = new RegExp(re.source, flags);
    let hit;
    while ((hit = scan.exec(code)) !== null) {
      const before = code.slice(Math.max(0, hit.index - 60), hit.index);
      if (!NEGATION.test(before)) return { why, match: hit[0] };
    }
  }
  return null;
};

for (const [file, src] of sources) {
  const found = offendingPhrase(src);
  assert.ok(!found, found && `${file}: ${found.why} (znaleziono „${found.match}”)`);
}

// Asystent Pedagoga i EduBiurokrata trzymają instrukcje dla AI w asystent-dokumenty.js,
// więc dla nich sprawdzamy stronę razem z tym plikiem.
const SHARED_PROMPTS = read('asystent-dokumenty.js');
const promptsOf = (file) => sources.get(file) +
  (/asystent-dokumenty\.js/.test(sources.get(file)) ? '\n' + SHARED_PROMPTS : '');

// Każde narzędzie z kartką musi mieć w instrukcji zakaz wymyślania faktów i furtkę [uzupełnij].
for (const file of PAPER_TOOLS) {
  const prompts = promptsOf(file);
  assert.ok(/nie wymyślaj|nie zmyślaj|bez zmyślania|nie dopisuj/i.test(prompts),
    `${file}: instrukcja dla AI musi zabraniać dopisywania faktów`);
  assert.ok(/\[uzupełnij/.test(prompts), `${file}: braki danych zostają jako [uzupełnij: …]`);
  // Treść wpisana przez nauczyciela to dane, nie polecenia dla modelu (prompt injection).
  assert.ok(/nie polecenia|nie polecenie|nie są polecenia/i.test(prompts),
    `${file}: treść od użytkownika trzeba oznaczyć jako dane, nie polecenia dla modelu`);
}

// ------------------------------------------- 3. Dane osobowe poza zapytaniem

// EduNotariusz i EduRaport trzymają uczestników/nazwy lokalnie - prompt ich nie widzi.
for (const [file, fields] of [['edunotariusz.html', ['participants']], ['eduraport.html', ['eventName', 'groupName']]]) {
  const src = sources.get(file);
  const userPrompt = src.match(/const userPrompt = `([\s\S]*?)`;/)?.[1];
  assert.ok(userPrompt, `${file}: nie znalazłem promptu użytkownika`);
  for (const field of fields) {
    assert.ok(!userPrompt.includes(field), `${file}: pole ${field} nie może trafiać do AI`);
  }
  assert.ok(/anonymizeDoc|anonymize/.test(src), `${file}: publikacja wzoru musi anonimizować dane z kartki`);
  assert.match(src, /const \[doc(?:People|Meta), setDoc(?:People|Meta)\]/,
    `${file}: dane osobowe muszą być zamrożone w chwili generowania (inaczej edycja pola nadpisuje kartkę)`);
}

// --------------------------------- 4. Wspólna pula limitów, bez własnych bramek

for (const file of ['edunotariusz.html', 'eduraport.html']) {
  const src = sources.get(file);
  assert.ok(/EduBoxCore\.executeWithLimitCheck\(/.test(src), `${file}: limity przez wspólne executeWithLimitCheck`);
  assert.ok(/EduBoxCore\.getUsageCount\(\)/.test(src), `${file}: licznik czytamy ze wspólnej puli`);
  assert.ok(!/edubox_\w+_ai/.test(src), `${file}: własny licznik per-aplikacja został usunięty`);
  assert.ok(!/aiGenerations >= 5/.test(src), `${file}: druga, niezależna bramka limitu mogła się rozjechać ze wspólną pulą`);
}

// --------------------------------------------- 5. Wspólna warstwa wyglądu

const ui = read('edubox-ui.css');
assert.match(ui, /prefers-reduced-motion/, 'edubox-ui.css: brak obsługi prefers-reduced-motion');
assert.match(ui, /:focus-visible/, 'edubox-ui.css: brak widocznego focusa dla klawiatury');
assert.match(ui, /@media print/, 'edubox-ui.css: brak reguł wydruku');
assert.match(ui, /--eb-accent:/, 'edubox-ui.css: brak tokenu akcentu (narzędzia go nadpisują)');
assert.match(ui, /\.eb-btn\b/, 'edubox-ui.css: brak komponentu przycisku');
assert.match(ui, /\.eb-field\b/, 'edubox-ui.css: brak komponentu pola formularza');
assert.match(ui, /\.eb-segment\b/, 'edubox-ui.css: brak przełącznika trybów');
// Reguła wygaszająca neonowe poświaty wpisane w markup (124 wystąpienia w 49 plikach).
assert.ok(/\[class\*="shadow-\[0_0_"\]/.test(ui),
  'edubox-ui.css: brak reguły wygaszającej neonowe shadow-[0_0_…] z markupu');
// Jasnoszary tekst na wydruku: jedna reguła dla 58 plików i 1284 wystąpień klas
// text-slate/gray/zinc/neutral -300/-400/-500. Jej usunięcie zabrałoby czytelność
// wydruku w całym portfolio naraz, więc pilnujemy jej wprost.
assert.ok(/@media print[\s\S]*?\[class\*="text-slate-400"\][\s\S]*?color:\s*#374151\s*!important/.test(ui),
  'edubox-ui.css: brak reguły rozjaśniającej jasnoszary tekst przy druku (text-slate-400 i pokrewne)');
// Zapas dla przeglądarek bez color-mix(): focus musi być widoczny wszędzie.
assert.match(ui, /@supports not \(color: color-mix/, 'edubox-ui.css: brak zapasu dla przeglądarek bez color-mix()');

for (const file of UI_TOOLS) {
  const src = read(file);
  // Szukamy tagu <link>, nie samej nazwy pliku - ta pojawia się też w komentarzach.
  const linkMatch = /<link[^>]+href="\/edubox-ui\.css"[^>]*>/.exec(src);
  assert.ok(linkMatch, `${file}: brak <link> do /edubox-ui.css`);
  // Kolejność ma znaczenie: przy tej samej specyficzności wygrywa reguła późniejsza,
  // więc wspólna warstwa musi stać PO wewnętrznym <style> strony. Styl wewnątrz JSX
  // (po </head>) celowo wygrywa nad warstwą wspólną, więc patrzymy tylko na <head>.
  const headEnd = src.indexOf('</head>');
  const head = headEnd === -1 ? src : src.slice(0, headEnd);
  // Po linku może stać tylko jeden blok: nadpisanie akcentu marki (:root { --eb-accent }).
  // Każdy inny <style> za linkiem oznacza, że stare reguły strony wygrają kolejnością.
  for (const m of head.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) {
    if (m.index < linkMatch.index) continue;
    assert.ok(/:root\s*\{\s*--eb-accent/.test(m[1]),
      `${file}: <style> stoi PO <link> do /edubox-ui.css, więc stare reguły wygrają kolejnością`);
  }
  // Akcent marki: strona, która ma własny kolor w --eb-accent, musi też mieć dobrany
  // kolor napisu na przycisku - inaczej wychodzi biały tekst na żółtym tle.
  const accent = /--eb-accent: (#[0-9a-f]{6});/.exec(src);
  if (accent) {
    const textOn = /--eb-accent-text: (#[0-9a-f]{6});/.exec(src);
    assert.ok(textOn, `${file}: ustawia --eb-accent bez --eb-accent-text`);
    assert.ok(contrast(accent[1], textOn[1]) >= 4.5,
      `${file}: kontrast napisu na przycisku ${contrast(accent[1], textOn[1]).toFixed(2)}:1 – poniżej WCAG AA (4.5:1)`);
  }
  // aria-pressed tylko tam, gdzie faktycznie jest przełącznik trybów.
  if (/eb-segment__item/.test(src)) {
    assert.ok(/aria-pressed=/.test(src), `${file}: przełącznik .eb-segment bez aria-pressed`);
  }
}

console.log(`[Dokumenty] OK — ${PAPER_TOOLS.length} narzędzi na wzorcu kartki, ${UI_TOOLS.length} na wspólnej warstwie wyglądu, bez fejkowego .doc i bez obietnic "rozbudowanych akapitów".`);

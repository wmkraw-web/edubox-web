'use strict';

// Kontrola narzędzi awansowych (awans.html, eduawans.html). Pilnuje dwóch rzeczy, które
// łatwo zepsuć przy kolejnych zmianach:
//  1. podstawa prawna jest wpisana w kodzie i NIGDY nie pochodzi od AI (modele halucynują
//     numery artykułów i paragrafów),
//  2. dokument trzyma się wzorca generatorów dokumentów z CLAUDE.md (strumień, kartka A4,
//     edycja przed eksportem, prawdziwy .docx) i nie wynosi danych osobowych.
// Logikę funkcji (withLegal, anonymize) sprawdzamy na żywo przez vm, nie na oko.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');

const kreator = read('awans.html');
const edytor = read('eduawans.html');
const legalActs = JSON.parse(read('scripts/legal-acts.json'));

// ---------------------------------------------------------------- 1. Kreator Awansu

assert.match(kreator, /<script src="\/doc-tools\.js"><\/script>/, 'awans.html: brak doc-tools.js');
assert.match(kreator, /<link rel="stylesheet" href="\/doc-paper\.css">/, 'awans.html: brak doc-paper.css');
assert.match(kreator, /EduDocTools\.streamChat\(/, 'awans.html: dokument musi płynąć strumieniem');
assert.match(kreator, /model: 'strong'/, 'awans.html: dokumenty urzędowe idą na model "strong"');
assert.match(kreator, /contentEditable=\{!isStreaming\}/, 'awans.html: kartka ma być edytowalna po napisaniu');
assert.match(kreator, /className=\{`doc-paper/, 'awans.html: podgląd ma być kartką A4 (doc-paper)');
assert.match(kreator, /DT\.downloadDocx\(/, 'awans.html: eksport Word przez downloadDocx (prawdziwy .docx)');
assert.match(kreator, /DT\.printDoc\(/, 'awans.html: wydruk/PDF przez printDoc');
assert.match(kreator, /DT\.copyRich\(/, 'awans.html: kopiowanie przez copyRich (tabele do Worda)');
assert.match(kreator, /DT\.markPlaceholders\(/, 'awans.html: pola [uzupełnij: …] mają być żółte');
assert.match(kreator, /currentHtml\(\)/, 'awans.html: eksport musi brać poprawki wpisane na kartce');

// Fejkowy .doc (HTML w pliku z mime Worda) i window.print() z ciemnego panelu – nigdy więcej.
for (const [name, src] of [['awans.html', kreator], ['eduawans.html', edytor]]) {
  assert.ok(!/application\/msword/.test(src), `${name}: eksport .doc z HTML-em w środku zamiast .docx`);
}
assert.ok(!/window\.print\(\)/.test(kreator), 'awans.html: wydruk powinien iść przez printDoc, nie window.print()');

// Dane osobowe: nazwisko zostaje w przeglądarce, do AI leci tylko rola, etap i notatki.
const userPrompt = kreator.match(/const userPrompt = `([\s\S]*?)`;/)?.[1] || '';
assert.ok(userPrompt, 'awans.html: nie znalazłem promptu użytkownika');
assert.ok(!/teacherName/.test(userPrompt), 'awans.html: imię i nazwisko nie może trafiać do AI');
assert.match(kreator, /DT\.fillName\(/, 'awans.html: nazwisko wstawia dopiero przeglądarka (fillName)');
assert.match(kreator, /const anonymize = \(html\)/, 'awans.html: publikacja wzoru musi anonimizować nazwisko');

// Nazwisko czytane na żywo z formularza przepisałoby baseHtml i skasowało poprawki na kartce.
assert.match(kreator, /const \[docName, setDocName\] = useState\(''\)/,
  'awans.html: nazwisko musi być zamrożone w chwili generowania (docName)');
assert.match(kreator, /DT\.fillName\(DT\.normalize\(docHtml\), docName\)/,
  'awans.html: kartka ma brać zamrożone docName, nie params.teacherName');
// Puste document_body ze starego wpisu w Bibliotece nie może podmienić aktualnej kartki.
assert.match(kreator, /html === undefined \? currentHtml\(\) : html/,
  'awans.html: eksport i kopiowanie muszą rozróżniać brak argumentu od pustego wzoru');

// ------------------------------------------- 2. Podstawa prawna: z kodu, nie od modelu

const systemPrompt = kreator.match(/const systemPrompt = `([\s\S]*?)`;\n/)?.[1] || '';
assert.ok(systemPrompt, 'awans.html: nie znalazłem instrukcji systemowej');
assert.match(systemPrompt, /NIE powołuj się na żadne przepisy/,
  'awans.html: AI musi mieć zakaz powoływania przepisów – podstawę prawną dopisuje narzędzie');
assert.match(systemPrompt, /NIE wymyślaj faktów/, 'awans.html: AI nie może dopisywać faktów spoza notatek');
assert.match(systemPrompt, /\[uzupełnij/, 'awans.html: braki danych zostają jako [uzupełnij: …]');
assert.ok(!/legal_basis/.test(kreator), 'awans.html: pole legal_basis od AI zostało usunięte z generowania');

// Wyciągamy AKTY/DOC_TYPES/withLegal ze strony i sprawdzamy na żywo.
const blockStart = kreator.indexOf('const AKTY = {');
const blockEnd = kreator.indexOf('const generateDocument');
assert.ok(blockStart !== -1 && blockEnd > blockStart, 'awans.html: nie znalazłem bloku AKTY/DOC_TYPES');
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(
  kreator.slice(blockStart, blockEnd).replace(/const docType = DOC_TYPES\[mode\].*$/m, '') +
  '\nglobalThis.out = { AKTY, DOC_TYPES, legalBlockHtml, withLegal };',
  sandbox
);
const { AKTY, DOC_TYPES, legalBlockHtml, withLegal } = sandbox.out;

// Każdy akt w AKTY musi być tym samym aktem, który stoi w legal-acts.json (snapshot z ISAP).
const eliByPoz = new Map(legalActs.acts.map((a) => [a.eli, a]));
for (const eli of ['DU/1982/19', 'DU/2022/1914', 'DU/2022/1730']) {
  assert.ok(eliByPoz.has(eli), `legal-acts.json: brak aktu ${eli}, na którym opiera się awans`);
}
assert.match(AKTY.awans, /poz\. 1914/, 'AKTY.awans musi wskazywać Dz.U. 2022 poz. 1914');
assert.match(AKTY.przejsciowe, /poz\. 1730/, 'AKTY.przejsciowe musi wskazywać Dz.U. 2022 poz. 1730');
// Karta Nauczyciela: cytujemy najnowszy tekst jednolity ze snapshotu + „z późn. zm.”.
const jednolite = eliByPoz.get('DU/1982/19').snapshot.refs['Inf. o tekście jednolitym'] || [];
const ostatniJednolity = jednolite[jednolite.length - 1];
const pozJednolity = (ostatniJednolity || '').split('/').pop();
assert.ok(pozJednolity, 'legal-acts.json: brak informacji o tekście jednolitym Karty Nauczyciela');
assert.ok(
  AKTY.kn.includes(`poz. ${pozJednolity}`),
  `AKTY.kn cytuje inny tekst jednolity Karty Nauczyciela niż snapshot (oczekiwano poz. ${pozJednolity}). ` +
  'Po npm run legal:update zaktualizuj też AKTY.kn w awans.html.'
);
assert.match(AKTY.kn, /z późn\. zm\./, 'AKTY.kn: bez „z późn. zm.” cytat przestanie być prawdziwy po nowelizacji');

// Na poziomie aktów, bez numerów jednostek – tych nie weryfikowaliśmy w ISAP.
const wszystkieAkty = Object.values(AKTY).join(' ');
assert.ok(!/§/.test(wszystkieAkty), 'AKTY: nie podajemy numerów paragrafów bez weryfikacji w ISAP');
assert.ok(!/\bart\.\s*\d/.test(wszystkieAkty), 'AKTY: nie podajemy numerów artykułów bez weryfikacji w ISAP');

for (const [mode, type] of Object.entries(DOC_TYPES)) {
  assert.ok(type.title && type.file && type.signature, `DOC_TYPES.${mode}: brak tytułu, nazwy pliku lub podpisu`);
  assert.ok(type.sections.length >= 5, `DOC_TYPES.${mode}: za mało sekcji dokumentu`);
  assert.ok(type.meta.length >= 4, `DOC_TYPES.${mode}: metryczka musi mieć co najmniej 4 pola`);
  assert.ok(type.note && type.note.length > 40, `DOC_TYPES.${mode}: brak zastrzeżenia o wzorze/regulaminie placówki`);
  assert.ok(type.legal.length >= 2 && type.legal.every((k) => AKTY[k]),
    `DOC_TYPES.${mode}: podstawa prawna musi wskazywać akty z AKTY`);
  assert.ok(!/<a\b/i.test(legalBlockHtml(type)),
    `DOC_TYPES.${mode}: blok prawny nie może mieć <a href> – sanitizeHtml przepuszcza tylko class`);
}

// withLegal: podstawa prawna pod metryczką, przed sekcjami i przed miejscem na podpis.
const przykład = '<h1>Sprawozdanie</h1><table><tr><th>Nauczyciel</th><td>[imię i nazwisko]</td></tr></table>' +
  '<h2>1. Przebieg</h2><p>Treść.</p><p>Miejscowość i data: …… Podpis nauczyciela: ……</p>';
const zPodstawą = withLegal(przykład, DOC_TYPES.nauczyciel);
assert.ok(zPodstawą.indexOf('Podstawa prawna') > zPodstawą.indexOf('</table>'), 'withLegal: blok prawny przed metryczką');
assert.ok(zPodstawą.indexOf('Podstawa prawna') < zPodstawą.indexOf('1. Przebieg'), 'withLegal: blok prawny po sekcjach');
assert.ok(zPodstawą.indexOf('Podstawa prawna') < zPodstawą.indexOf('Podpis nauczyciela'), 'withLegal: blok prawny po podpisie');
assert.ok(zPodstawą.includes('Treść.') && zPodstawą.includes('<h1>Sprawozdanie</h1>'), 'withLegal: zgubiona treść dokumentu');
const bezTabeli = withLegal('<h1>Opinia</h1><h2>1. Współpraca</h2><p>Tekst.</p>', DOC_TYPES.mentor);
assert.ok(bezTabeli.indexOf('Podstawa prawna') > bezTabeli.indexOf('</h1>') &&
  bezTabeli.indexOf('Podstawa prawna') < bezTabeli.indexOf('1. Współpraca'), 'withLegal: bez metryczki blok prawny idzie pod tytuł');

// ---------------------------------------------------------------- 3. EduAwans (edytor)

assert.match(edytor, /<script src="\/doc-tools\.js"><\/script>/, 'eduawans.html: brak doc-tools.js');
assert.match(edytor, /DT\.downloadDocx\(/, 'eduawans.html: eksport Word przez downloadDocx');
assert.match(edytor, /DT\.copyRich\(/, 'eduawans.html: kopiowanie przez copyRich');
const edytorPrompt = edytor.match(/const systemPrompt = `([\s\S]*?)`;\n/)?.[1] || '';
assert.ok(edytorPrompt, 'eduawans.html: nie znalazłem instrukcji systemowej');
assert.match(edytorPrompt, /nie wymyślaj faktów/i, 'eduawans.html: AI nie może dopisywać faktów spoza szkicu');
assert.match(edytorPrompt, /Nie powołuj się na numery artykułów ani paragrafów/,
  'eduawans.html: AI nie powołuje przepisów we fragmentach dokumentu');
assert.match(edytorPrompt, /Dz\.U\. z 2022 r\. poz\. 1914/, 'eduawans.html: pełne oznaczenie rozporządzenia o awansie');

// Regexy /\\n/ i /\\s/ szukały znaku "\" – entery i spacje nigdy się nie łapały.
assert.ok(!/replace\(\/\\\\[ns]/.test(edytor), 'eduawans.html: regex na podwójnym backslashu nie łapie enterów ani spacji');
const itemsToHtml = edytor.match(/const itemsToHtml = \(itemsList, heading\) => \{([\s\S]*?)\n            \};/)?.[1] || '';
assert.ok(itemsToHtml, 'eduawans.html: nie znalazłem itemsToHtml');
assert.match(itemsToHtml, /escHtml\(item\.section\)/, 'eduawans.html: nazwy sekcji trzeba escapować');
assert.match(itemsToHtml, /escHtml\(item\.text\)/, 'eduawans.html: treść fragmentów trzeba escapować');
assert.match(itemsToHtml, /Podpis nauczyciela/, 'eduawans.html: dokument kończy się miejscem na podpis');

console.log('[Awans] OK — podstawa prawna z kodu (nie od AI), kartka A4 ze strumieniem, prawdziwy .docx, nazwisko zostaje w przeglądarce.');

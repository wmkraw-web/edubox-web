// Testy Teczki podopiecznych (bez sieci): szyfrowanie, terminy i – najważniejsze – że do AI nie trafia
// żadna dana identyfikująca dziecko. Uruchom: npm run podopieczni:check
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');
const P = require(path.join(ROOT, 'podopieczni-core.js'));

const sandbox = { window: {}, globalThis: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'asystent-dokumenty.js'), 'utf8'), sandbox, { filename: 'asystent-dokumenty.js' });
const AD = sandbox.window.EduAsystentDocs;
const sosSandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'sos-porady.js'), 'utf8'), sosSandbox, { filename: 'sos-porady.js' });
const SOS = sosSandbox.window.EduSosPrompts;

let ok = 0, fail = 0;
const tests = [];
const test = (name, fn) => tests.push([name, fn]);
const assert = (cond, msg) => { if (!cond) throw new Error(msg || 'warunek niespełniony'); };

const NOW = Date.parse('2026-10-21T10:00:00Z');
const kasia = Object.assign(P.newChild(), {
  imie: 'Katarzyna', nazwisko: 'Kowalska', zdrobnienie: 'Kasia, Kasieńka', plec: 'k', dataUr: '2021-03-15', grupa: 'Motylki',
  programy: ['ks', 'zazyciem'], orzeczenie: 'autyzm',
  rozpoznanie: 'Kasia ma orzeczenie ze względu na autyzm, nie mówi, komunikuje się gestem.',
  mocneStrony: 'Kasi bardzo pomaga plan dnia, lubi muzykę. PESEL 21231512345 w teczce.',
  trudnosci: 'Kasię niepokoją zmiany, przy hałasie Kowalska zatyka uszy.',
  zalecenia: 'Zalecenia z orzeczenia nr 123/2025 dla Katarzyny Kowalskiej ur. 15.03.2021: AAC, TUS.',
  dokumenty: [
    { id: 'd1', rodzaj: 'orzeczenie', numer: '123/2025', wydany: '2025-05-10', wazneDo: '2026-11-30', poradnia: 'PPP nr 3 w Łodzi' },
    { id: 'd2', rodzaj: 'opinia_wwrd', numer: 'W/45/2024', wydany: '2024-09-01', wazneDo: '2026-08-31', poradnia: 'PPP nr 3 w Łodzi' }
  ],
  terminy: [{ id: 't1', co: 'Ewaluacja IPET', data: '2027-03-01', zrobione: false }, { id: 't2', co: 'Zespół', data: '2026-10-01', zrobione: true }],
  notatki: [{ id: 'n1', data: '2026-10-20', tekst: 'Kasieńka sama pokazała obrazek „pić” przy śniadaniu.' }]
});

// ---------- szyfrowanie ----------
test('sejf: zapis i odczyt tym samym hasłem', async () => {
  const s = await P.createSession('dobre-haslo-123');
  const blob = await P.seal({ children: [kasia] }, s);
  const back = await P.open(blob, 'dobre-haslo-123');
  assert(back.data.children[0].imie === 'Katarzyna', 'dane po odszyfrowaniu się nie zgadzają');
});
test('sejf: złe hasło nie otwiera danych', async () => {
  const s = await P.createSession('dobre-haslo-123');
  const blob = await P.seal({ children: [kasia] }, s);
  let msg = '';
  try { await P.open(blob, 'zle-haslo-123'); } catch (e) { msg = e.message; }
  assert(msg === 'Nieprawidłowe hasło.', 'złe hasło powinno dać „Nieprawidłowe hasło.”, a dało: ' + msg);
});
test('sejf: w zapisanym pliku nie ma jawnego tekstu', async () => {
  const s = await P.createSession('dobre-haslo-123');
  const raw = JSON.stringify(await P.seal({ children: [kasia] }, s));
  ['Katarzyna', 'Kowalska', 'autyzm', '21231512345', 'Motylki'].forEach(w => assert(!raw.includes(w), 'jawny tekst w sejfie: ' + w));
});
test('sejf: każdy zapis ma nowy wektor IV (ta sama treść ≠ ten sam szyfrogram)', async () => {
  const s = await P.createSession('dobre-haslo-123');
  const a = await P.seal({ x: 1 }, s), b = await P.seal({ x: 1 }, s);
  assert(a.iv !== b.iv && a.ct !== b.ct, 'powtórzony IV');
});
test('sejf: za krótkie hasło odrzucone', async () => {
  let msg = '';
  try { await P.createSession('krotkie'); } catch (e) { msg = e.message; }
  assert(/8 znaków/.test(msg), 'brak odrzucenia krótkiego hasła');
});
test('sejf: plik obcej aplikacji odrzucony', async () => {
  let msg = '';
  try { await P.open({ foo: 1 }, 'dobre-haslo-123'); } catch (e) { msg = e.message; }
  assert(/nie jest plik/.test(msg), msg);
});
test('migrate uzupełnia brakujące pola starszych zapisów', () => {
  const m = P.migrate({ children: [{ id: 'x', imie: 'Ala' }] });
  assert(Array.isArray(m.children[0].notatki) && Array.isArray(m.children[0].dokumenty) && m.settings.oddzial === 'specjalny');
});

// ---------- wiek i terminy ----------
test('wiek liczony z daty urodzenia (przed i po urodzinach)', () => {
  assert(P.ageYears('2021-03-15', NOW) === 5, 'po urodzinach');
  assert(P.ageYears('2021-12-01', NOW) === 4, 'przed urodzinami');
  assert(P.ageYears('15.03.2021', NOW) === 5, 'format polski');
  assert(P.ageYears('', NOW) === '' && P.ageYears('bzdura', NOW) === '', 'brak daty');
});
test('terminy: orzeczenie za 40 dni = „wkrótce”, opinia po terminie, zrobione pominięte', () => {
  const d = P.deadlines(kasia, NOW);
  assert(d.length === 3, 'liczba terminów: ' + d.length);
  assert(d[0].status === 'po terminie' && /Opinia o potrzebie/.test(d[0].label), 'opinia WWRD powinna być po terminie');
  assert(d[1].status === 'wkrótce' && d[1].days === 40, 'orzeczenie: ' + JSON.stringify(d[1]));
  assert(d[2].status === 'ok', 'ewaluacja w marcu = ok');
});
test('alerty na ekranie głównym: tylko pilne, z imieniem (lokalnie)', () => {
  const a = P.alerts([kasia], NOW);
  assert(a.length === 2 && a[0].name === 'Katarzyna Kowalska');
});

// ---------- anonimizacja ----------
test('scrub: imię, zdrobnienie i nazwisko w odmianie → [imię]', () => {
  const t = P.scrub('Kasi, Kasię, Kasią, Kasieńka, Katarzyny, Kowalskiej, Kowalską pomaga plan.', kasia);
  assert(!/Kas|Katarzyn|Kowalsk/.test(t), t);
  assert(/pomaga plan/.test(t), 'zjadło zwykłe słowa: ' + t);
});
test('scrub: zwykłe słowa zostają (kasza, kot, kawa)', () => {
  const t = P.scrub('Je kaszę, głaszcze kota i pije kakao.', kasia);
  assert(t === 'Je kaszę, głaszcze kota i pije kakao.', t);
});
test('scrub: PESEL i data urodzenia znikają', () => {
  const t = P.scrub('PESEL 21231512345, ur. 15.03.2021 (2021-03-15).', kasia);
  assert(!/21231512345|15\.03\.2021|2021-03-15/.test(t), t);
});
test('scrub: numery dokumentów, poradnia i grupa z karty dziecka znikają', () => {
  const t = P.scrub('Wg orzeczenia nr 123/2025 z PPP nr 3 w Łodzi (opinia numer W/45/2024), grupa Motylki, sala nr 7.', kasia);
  assert(!/123\/2025|W\/45\/2024|PPP nr 3|Łodzi|Motylki/.test(t), t);
  assert(/sala nr \[numer\]/.test(t), 'zapis „nr 7” → „nr [numer]”: ' + t);
});
test('scrub: „Katarzyny Kowalskiej” → jedno [imię], nie dwa', () => {
  const t = P.scrub('dla Katarzyny Kowalskiej: AAC.', kasia);
  assert(t === 'dla [imię]: AAC.', t);
});
test('scrub: zwykłe liczby bez „nr” zostają (5 lat, 3 razy dziennie)', () => {
  const t = P.scrub('Ma 5 lat, ćwiczy 3 razy dziennie po 10 minut.', kasia);
  assert(t === 'Ma 5 lat, ćwiczy 3 razy dziennie po 10 minut.', t);
});
test('scrub: krótkie imiona (Ola → Oli, Olą)', () => {
  const ola = Object.assign(P.newChild(), { imie: 'Ola', nazwisko: 'Nowak' });
  const t = P.scrub('Oli pomaga, z Olą ćwiczymy, Nowakowie przyszli.', ola);
  assert(!/Ola|Oli|Olą|Nowak/.test(t), t);
});

const SENSITIVE = ['Katarzyn', 'Kowalsk', 'Kasi', 'Kasie', 'Kasię', 'Kasią', 'Motylki', '21231512345', '15.03.2021', '2021-03-15', '123/2025', 'W/45/2024', 'PPP nr 3', 'Łodzi'];
const noSensitive = (txt, where) => SENSITIVE.forEach(w => assert(!txt.includes(w), `${where}: wyciekło „${w}”`));

test('aiInput (IPET): bez tożsamości, numerów, poradni i grupy; wiek i płeć są', () => {
  const x = P.aiInput(kasia, { docType: 'ipet', now: NOW });
  noSensitive(JSON.stringify(x), 'aiInput');
  assert(x.etap === 'przedszkole' && x.oddzial === 'specjalny' && x.plec === 'uczennica' && x.orzeczenie === 'autyzm');
  assert(/Wiek: 5 lat/.test(x.diagnoza), x.diagnoza);
  assert(/pokazała obrazek/.test(x.files), 'notatki powinny trafić jako materiał źródłowy');
});
test('pełne zapytanie do AI (EduAsystentDocs.buildUserPrompt) – IPET, WOPFU, opinia', () => {
  ['ipet', 'wopfu', 'opinia', 'gotowosc', 'notatka'].forEach(docType => {
    const prompt = AD.buildUserPrompt(P.aiInput(kasia, { docType, now: NOW }));
    noSensitive(prompt, docType);
    assert(P.leaks(prompt, kasia).length === 0, docType + ': leaks() = ' + P.leaks(prompt, kasia));
  });
});
test('pełne zapytanie do AI – wszystkie dokumenty WWRD', () => {
  AD.WWRD_DOC_TYPES.forEach(t => {
    const prompt = AD.buildUserPrompt(P.aiInput(kasia, { module: 'wwrd', docType: t.id, cel: 'Kasia: wskazywanie obrazków', now: NOW }));
    noSensitive(prompt, t.id);
    assert(/WIEK DZIECKA: 5 lat/.test(prompt), t.id + ': brak wieku');
  });
});
test('pytanie o radę (EduSosPrompts) bez tożsamości', () => {
  const p = SOS.buildSosPrompts('zachowanie', P.adviceText(kasia, 'Co zrobić, gdy Kasia krzyczy przy myciu rąk?'), { place: 'przedszkole' });
  noSensitive(p.prompt + p.system, 'porada');
});
test('leaks() łapie pozostawione imię', () => {
  assert(P.leaks('Kasia płacze', kasia).length > 0 && P.leaks('[imię] płacze', kasia).length === 0);
});

// ---------- strona ----------
const page = fs.readFileSync(path.join(ROOT, 'podopieczni.html'), 'utf8');
test('strona: noindex i wykluczona z mapy strony', () => {
  assert(/<meta name="robots" content="noindex, nofollow, noarchive">/.test(page), 'brak noindex');
  const seo = require(path.join(ROOT, 'seo.config.js'));
  const cfg = seo.default || seo;
  assert(cfg.excludedPages.some(p => p.path === 'podopieczni.html') && cfg.robotsDisallow.includes('/podopieczni.html'), 'brak wykluczenia w seo.config.js');
});
test('strona: bez Firebase, Google Analytics i global-core (dane nie mogą wyjść w tle)', () => {
  assert(!/firebase|googletagmanager|gtag\(|global-core\.js|cookie-consent/i.test(page), 'strona ładuje coś, co wysyła dane');
});
test('strona: sejf tylko zaszyfrowany (localStorage dostaje wyłącznie wynik seal)', () => {
  const sets = [...page.matchAll(/localStorage\.setItem\(([^,]+),\s*(.+?)\);/g)].map(m => m[1].trim() + ' ← ' + m[2].trim());
  assert(sets.length > 0 && sets.every(s => s === 'P.VAULT_KEY ← JSON.stringify(sealed)'), 'niezaszyfrowany zapis: ' + sets.join(' | '));
});
test('strona: każde zapytanie do AI przechodzi przez kontrolę leaks()', () => {
  const calls = (page.match(/streamChat\(/g) || []).length;
  const guards = (page.match(/assertNoLeak\(/g) || []).length;
  assert(calls > 0 && guards >= calls, `streamChat: ${calls}, kontrole: ${guards}`);
});

(async () => {
  for (const [name, fn] of tests) {
    try { await fn(); ok++; console.log('✅ ' + name); }
    catch (e) { fail++; console.log('❌ ' + name + '\n   ' + e.message); }
  }
  console.log(`\n[Teczka podopiecznych] ${ok} OK, ${fail} błędów`);
  process.exit(fail ? 1 : 0);
})();

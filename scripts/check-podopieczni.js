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

test('dwa hasła: każde otwiera te same dane, złe nie otwiera', async () => {
  let s = await P.createSession('haslo-zony-123', 'Ania');
  s = await P.addPassword(s, 'haslo-witolda-123', 'Witold');
  const blob = await P.seal({ children: [kasia] }, s);
  const a = await P.open(blob, 'haslo-zony-123');
  const w = await P.open(blob, 'haslo-witolda-123');
  assert(a.data.children[0].imie === 'Katarzyna' && w.data.children[0].imie === 'Katarzyna', 'dane różne po dwóch hasłach');
  assert(P.slotLabel(a.session) === 'Ania' && P.slotLabel(w.session) === 'Witold', 'zła etykieta hasła');
  let msg = ''; try { await P.open(blob, 'zupelnie-inne-1'); } catch (e) { msg = e.message; }
  assert(msg === 'Nieprawidłowe hasło.', msg);
});
test('zapomniane hasło: drugim otwieramy i ustawiamy nowe pierwsze', async () => {
  let s = await P.createSession('haslo-zony-123', 'Ania');
  s = await P.addPassword(s, 'haslo-witolda-123', 'Witold');
  const blob = await P.seal({ x: 1 }, s);
  const byW = await P.open(blob, 'haslo-witolda-123');
  const ania = byW.session.slots.find(x => x.label === 'Ania');
  const s2 = await P.changePassword(byW.session, ania.id, 'nowe-haslo-zony');
  const blob2 = await P.seal({ x: 2 }, s2);
  assert((await P.open(blob2, 'nowe-haslo-zony')).data.x === 2, 'nowe hasło nie działa');
  let msg = ''; try { await P.open(blob2, 'haslo-zony-123'); } catch (e) { msg = e.message; }
  assert(msg === 'Nieprawidłowe hasło.', 'stare hasło nadal działa');
  assert((await P.open(blob2, 'haslo-witolda-123')).data.x === 2, 'hasło zapasowe przestało działać');
});
test('usuwanie hasła: nie jedynego i nie tego, którym otwarto', async () => {
  let s = await P.createSession('haslo-zony-123', 'Ania');
  let msg = ''; try { P.removePassword(s, s.slots[0].id); } catch (e) { msg = e.message; }
  assert(/jedyne/.test(msg), msg);
  s = await P.addPassword(s, 'haslo-witolda-123', 'Witold');
  msg = ''; try { P.removePassword(s, s.openedWith); } catch (e) { msg = e.message; }
  assert(/właśnie otwarto/.test(msg), msg);
  const s2 = P.removePassword(s, s.slots[1].id);
  const blob = await P.seal({ x: 1 }, s2);
  msg = ''; try { await P.open(blob, 'haslo-witolda-123'); } catch (e) { msg = e.message; }
  assert(msg === 'Nieprawidłowe hasło.', 'usunięte hasło nadal otwiera');
});
test('sejf w wersji 1 (pierwsze wdrożenie) otwiera się i przechodzi na wersję 2', async () => {
  const subtle = globalThis.crypto.subtle;
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16)), iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const base = await subtle.importKey('raw', new TextEncoder().encode('stare-haslo-1'), 'PBKDF2', false, ['deriveKey']);
  const key = await subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 1000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
  const ct = await subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify({ children: [{ imie: 'Ala' }] })));
  const v1 = { v: 1, app: 'edubox-podopieczni', iter: 1000, salt: P.toB64(salt), iv: P.toB64(iv), ct: P.toB64(new Uint8Array(ct)) };
  const r = await P.open(v1, 'stare-haslo-1');
  assert(r.migrated && r.data.children[0].imie === 'Ala', 'migracja v1 nie działa');
  const v2 = await P.seal(r.data, r.session);
  assert(v2.v === 2 && (await P.open(v2, 'stare-haslo-1')).data.children[0].imie === 'Ala', 'po migracji hasło nie działa');
});

// ---------- wczytane dokumenty ----------
const ORZ = `Poradnia Psychologiczno-Pedagogiczna nr 3 w Łodzi
ul. Piotrkowska 100, 90-001 Łódź, tel. 42 123 45 67
Łódź, dnia 10 maja 2025 r.

ORZECZENIE nr 123/2025
o potrzebie kształcenia specjalnego

Zespół Orzekający działający w Poradni Psychologiczno-Pedagogicznej nr 3 w Łodzi
Imię (imiona) i nazwisko dziecka: Katarzyna Anna Kowalska
Data i miejsce urodzenia: 15.03.2021 r., Łódź
Numer PESEL: 21231512348
Adres zamieszkania:
ul. Słoneczna 5/12, 91-200 Łódź
Imiona i nazwiska rodziców: Anna i Jan Kowalscy
e-mail: kowalscy@example.com

stwierdza potrzebę kształcenia specjalnego ze względu na autyzm, w tym zespół Aspergera
na okres wychowania przedszkolnego do 31.08.2027

UZASADNIENIE
Kasia komunikuje się gestem, nie używa mowy czynnej. Katarzyna dobrze reaguje na stały plan dnia.
Zalecenia: zajęcia rewalidacyjne 2 razy w tygodniu, AAC, terapia integracji sensorycznej, współpraca z rodzicami.`;

test('PESEL: suma kontrolna i data urodzenia (lata 2000+)', () => {
  assert(P.peselValid('21231512348') && !P.peselValid('21231512345'), 'walidacja PESEL');
  assert(P.birthFromPesel('21231512348') === '2021-03-15', P.birthFromPesel('21231512348'));
});
test('orzeczenie: rozpoznane dane z nagłówka (bez AI)', () => {
  const id = P.extractIdentity(ORZ);
  const exp = { imie: 'Katarzyna Anna', nazwisko: 'Kowalska', pesel: '21231512348', dataUr: '2021-03-15', numer: '123/2025', wydany: '2025-05-10', wazneDo: '2027-08-31', rodzaj: 'orzeczenie', orzeczenie: 'autyzm' };
  Object.entries(exp).forEach(([k, v]) => assert(id[k] === v, `${k}: „${id[k]}” zamiast „${v}”`));
  assert(/Poradnia Psychologiczno-Pedagogiczna nr 3/.test(id.poradnia), 'poradnia: ' + id.poradnia);
});
test('opinia WWRD i „nazwisko i imię” w odwrotnej kolejności', () => {
  const t = 'OPINIA nr W/45/2024\no potrzebie wczesnego wspomagania rozwoju dziecka\nNazwisko i imię dziecka: Nowak Ola\nna okres roku szkolnego 2025/2026';
  const id = P.extractIdentity(t);
  assert(id.rodzaj === 'opinia_wwrd' && id.imie === 'Ola' && id.nazwisko === 'Nowak' && id.wazneDo === '2026-08-31', JSON.stringify(id));
});
const docChild = Object.assign(P.newChild(), { imie: 'Katarzyna Anna', nazwisko: 'Kowalska', zdrobnienie: 'Kasia', dataUr: '2021-03-15', dokumenty: [{ numer: '123/2025', poradnia: 'Poradnia Psychologiczno-Pedagogiczna nr 3 w Łodzi', tekst: ORZ, rodzaj: 'orzeczenie' }] });
const DOC_SENSITIVE = ['Katarzyn', 'Kowalsk', 'Kasia', '21231512348', '15.03.2021', '123/2025', 'Piotrkowska', 'Słoneczna', '90-001', '91-200', '42 123', 'kowalscy@', 'Anna i Jan', 'Łodzi', 'Łódź'];
test('anonimizacja dokumentu: znikają imiona, PESEL, adresy, telefon, e-mail, rodzice, poradnia, miejscowość', () => {
  const t = P.anonymizeDocText(ORZ, docChild);
  DOC_SENSITIVE.forEach(w => assert(!t.includes(w), `zostało „${w}”:\n${t}`));
  ['autyzm', 'komunikuje się gestem', 'zajęcia rewalidacyjne 2 razy w tygodniu', 'AAC', 'współpraca z rodzicami'].forEach(w => assert(t.includes(w), `zniknęła treść merytoryczna „${w}”`));
});
test('zapytanie „wyciągnij opis do karty” bez danych osobowych', () => {
  const p = P.cardExtractionPrompts(P.anonymizeDocText(ORZ, docChild), 'orzeczenie', AD.ORZECZENIA);
  DOC_SENSITIVE.forEach(w => assert(!p.prompt.includes(w), 'wyciekło do AI: ' + w));
  assert(P.leaks(p.prompt, docChild).length === 0, 'leaks(): ' + P.leaks(p.prompt, docChild));
});
test('odpowiedź AI → pola karty (walidacja rodzaju i orzeczenia)', () => {
  const c = P.parseCardJson('Proszę: {"rodzaj":"orzeczenie","orzeczenie":"autyzm","funkcjonowanie":["komunikuje się gestem","nie mówi"],"mocneStrony":"plan dnia","trudnosci":"","zalecenia":"AAC\\nTUS","okresWaznosci":"do 31.08.2027"}', AD.ORZECZENIA);
  assert(c.rodzaj === 'orzeczenie' && c.orzeczenie === 'autyzm' && c.rozpoznanie === 'komunikuje się gestem\nnie mówi' && c.zalecenia === 'AAC\nTUS', JSON.stringify(c));
  const bad = P.parseCardJson('{"rodzaj":"cokolwiek","orzeczenie":"xyz"}', AD.ORZECZENIA);
  assert(bad.rodzaj === '' && bad.orzeczenie === '', 'nieznane wartości powinny być puste');
});
test('dopisywanie do karty: bez dubli, zastąp, pomiń', () => {
  assert(P.mergeField('AAC', 'TUS', 'dopisz') === 'AAC\nTUS');
  assert(P.mergeField('AAC, TUS', 'TUS', 'dopisz') === 'AAC, TUS');
  assert(P.mergeField('AAC', 'TUS', 'zastap') === 'TUS' && P.mergeField('AAC', 'TUS', 'pomin') === 'AAC' && P.mergeField('', 'TUS', 'pomin') === '');
});
test('dokumenty dziecka jako materiał do IPET – treść jest, danych osobowych nie ma', () => {
  const prompt = AD.buildUserPrompt(P.aiInput(docChild, { docType: 'ipet', now: NOW }));
  assert(prompt.includes('TREŚĆ DOKUMENTÓW DZIECKA') && prompt.includes('terapia integracji sensorycznej'), 'brak treści dokumentu w zapytaniu');
  DOC_SENSITIVE.forEach(w => assert(!prompt.includes(w), 'wyciekło do AI: ' + w));
  const without = AD.buildUserPrompt(P.aiInput(docChild, { docType: 'ipet', withDocs: false, now: NOW }));
  assert(!without.includes('TREŚĆ DOKUMENTÓW'), 'withDocs:false nie działa');
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
test('scrub: popularne zdrobnienia działają bez wpisywania (Katarzyna → Kasia, Jan → Jaś, Janek)', () => {
  const c = Object.assign(P.newChild(), { imie: 'Katarzyna', nazwisko: 'Kowalska' });
  const t = P.scrub('Kasia i Kasieńka; Kasi pomaga plan.', c);
  assert(!/Kas/.test(t), t);
  const j = Object.assign(P.newChild(), { imie: 'Jan', nazwisko: 'Wiśniewski' });
  const u = P.scrub('Jaś, Jasiowi, Janek, Jankiem; jabłko i jasno.', j);
  assert(!/Ja[sśn]/.test(u.replace('jasno', '')) && /jabłko i jasno/.test(u), u);
});
test('scrub: „Ala” nie zjada słowa „ale”', () => {
  const a = Object.assign(P.newChild(), { imie: 'Alicja', nazwisko: 'Nowak' });
  const t = P.scrub('Ala ma kota, ale Ali nie ma. Alusia lubi alejki.', a);
  assert(t === '[imię] ma kota, ale [imię] nie ma. [imię] lubi alejki.', t);
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
test('strona: biblioteki z CDN w przypiętych wersjach (także czytniki PDF/Word/OCR)', () => {
  const srcs = [...page.matchAll(/https:\/\/(?:unpkg\.com|cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com)\/[^'"\s)]+/g)].map(m => m[0]);
  const unpinned = srcs.filter(u => !/@\d+\.\d+\.\d+|\/\d+\.\d+\.\d+[\w-]*(?:\/|$)/.test(u));
  assert(srcs.length >= 8 && unpinned.length === 0, 'bez wersji: ' + unpinned.join(', '));
});
test('vercel.json: własne CSP strony (OCR) bez luzowania reszty serwisu', () => {
  const v = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
  const cspOf = (r) => ((r.headers || []).find(h => h.key === 'Content-Security-Policy') || {}).value || '';
  const global = v.headers.find(r => r.source.startsWith('/((?!podopieczni'));
  const own = v.headers.find(r => r.source === '/podopieczni.html');
  assert(global && own, 'brak reguł nagłówków');
  assert(!/wasm-unsafe-eval|worker-src/.test(cspOf(global)), 'luzowanie CSP całego serwisu');
  assert(/'wasm-unsafe-eval'/.test(cspOf(own)) && /worker-src 'self' blob:/.test(cspOf(own)), 'OCR nie zadziała bez wasm i worker-src');
  assert(!/googletagmanager|google-analytics|firebaseio|www\.gstatic\.com/.test(cspOf(own)), 'CSP strony dopuszcza analitykę lub Firebase');
  ['Strict-Transport-Security', 'X-Content-Type-Options', 'Referrer-Policy', 'Permissions-Policy'].forEach(k => assert(own.headers.some(h => h.key === k), 'brak nagłówka ' + k));
});
test('strona: każde zapytanie do AI przechodzi przez kontrolę leaks()', () => {
  const calls = (page.match(/streamChat\(/g) || []).length;
  const guards = (page.match(/assertNoLeak\(/g) || []).length;
  assert(calls > 0 && guards >= calls, `streamChat: ${calls}, kontrole: ${guards}`);
});

// ---------- PDF z uszkodzoną warstwą tekstową (ten sam błąd co w Moim Zdrowiu, 28.10.2026) ----------
const J = require(path.join(ROOT, 'tekst-jakosc.js'));
test('ocena tekstu: orzeczenie w PDF-ie z czcionką bez mapy znaków jest odrzucane', () => {
  const krzaki = '▌▌▌AA (▌▌▌▌ ▌▌▌ ▌▌@ ▌▌ ▌▌▌ DB▌▌&) ▌▌ ▌▌▌ / ▌▌@ ! BB▌▌ ▌.-▌▌ M ▌▌▌ '.repeat(40);
  const q = J.textQuality(krzaki);
  assert(!q.ok && q.powod === 'znaki-zastepcze', JSON.stringify(q));
  assert(krzaki.replace(/\s/g, '').length > 1000, 'test ma sens tylko dla długiego tekstu-krzaków');
  assert(J.textQuality(ORZ).ok, 'prawdziwe orzeczenie musi przechodzić: ' + JSON.stringify(J.textQuality(ORZ)));
});
test('strona: odczyt PDF sprawdza jakość tekstu, nie samą liczbę znaków', () => {
  const blok = page.slice(page.indexOf("const text = parts.join"), page.indexOf('const FIELD_LABELS'));
  assert(/EduTekstJakosc\.textQuality\(text\)/.test(blok), 'brak kontroli jakości odczytanego tekstu');
  assert(/dosc && jakosc\.ok/.test(blok), 'warunek musi łączyć ilość i jakość');
  assert(/textQuality\(rozpoznany\)/.test(blok), 'po rozpoznaniu obrazu też trzeba sprawdzić wynik');
  assert(/uszkodzoną warstwę tekstową/.test(blok), 'nauczycielka ma się dowiedzieć, co się stało z plikiem');
  assert(/<script src="\/tekst-jakosc\.js"><\/script>/.test(page), 'brak wspólnego pliku oceny tekstu');
});

(async () => {
  for (const [name, fn] of tests) {
    try { await fn(); ok++; console.log('✅ ' + name); }
    catch (e) { fail++; console.log('❌ ' + name + '\n   ' + e.message); }
  }
  console.log(`\n[Teczka podopiecznych] ${ok} OK, ${fail} błędów`);
  process.exit(fail ? 1 : 0);
})();

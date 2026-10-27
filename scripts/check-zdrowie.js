// Testy prywatnej aplikacji „Moje Zdrowie” (bez sieci): szyfrowanie, liczenie zapasu leków, kalendarz .ics,
// mechaniczne sprawdzanie zestawu leków i – najważniejsze – że do AI nie trafia żadna dana identyfikująca.
// Uruchom: npm run zdrowie:check
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const Z = require(path.join(ROOT, 'zdrowie-core.js'));
const page = fs.readFileSync(path.join(ROOT, 'zdrowie.html'), 'utf8');

let ok = 0, fail = 0;
const tests = [];
const test = (name, fn) => tests.push([name, fn]);
const assert = (cond, msg) => { if (!cond) throw new Error(msg || 'warunek niespełniony'); };

const NOW = Date.parse('2026-10-27T10:00:00Z');
const vault = Z.migrate({
  profil: {
    imie: 'Witold', nazwisko: 'Kraw', zdrobnienie: 'Witek', dataUr: '1962-03-15', pesel: '62031512345', plec: 'm',
    grupaKrwi: 'A Rh+', waga: '84', wzrost: '178',
    alergie: 'penicylina, jad osy', choroby: 'Nadciśnienie tętnicze od 2019 r., niedoczynność tarczycy.',
    ice: [{ kto: 'żona Anna', telefon: '601 234 567' }]
  },
  leki: [
    { id: 'm1', nazwa: 'Tritace', moc: '5 mg', dawki: [{ pora: '08:00', ile: 1 }], dni: 'codziennie', naCo: 'ciśnienie', lekarz: 'dr Anna Nowak', zapas: { sztuk: 28, odDnia: '2026-10-20' } },
    { id: 'm2', nazwa: 'Euthyrox', moc: '50 mcg', dawki: [{ pora: '06:30', ile: 1 }], dni: 'codziennie', posilek: 'naczczo', zapas: { sztuk: 100, odDnia: '2026-10-01' } },
    { id: 'm3', nazwa: 'Ketonal', moc: '100 mg', dawki: [{ pora: '20:00', ile: 1 }], dni: [1, 3, 5], aktywny: true }
  ],
  wizyty: [
    { id: 'w1', data: '2026-11-05', godzina: '10:30', lekarz: 'Anna Nowak', specjalizacja: 'Kardiolog', miejsce: 'Centrum Medyczne Zdrowie', telefon: '42 123 45 67' },
    { id: 'w2', data: '2026-09-01', lekarz: 'Jan Lis', specjalizacja: 'Internista', zrobione: true }
  ],
  dokumenty: [{ id: 'd1', rodzaj: 'wypis', tytul: 'Wypis', data: '2026-08-10', placowka: 'Szpital Miejski w Łowiczu', lekarz: 'dr Jan Lis', tekst: '' }],
  pytania: [{ id: 'p1', tekst: 'Czy mogę brać ibuprofen przy tym ciśnieniu?', zadane: false }]
});

// ---------- szyfrowanie ----------
test('sejf: zapis i odczyt tym samym hasłem', async () => {
  const s = await Z.createSession('dobre-haslo-123');
  const back = await Z.open(await Z.seal(vault, s), 'dobre-haslo-123');
  assert(back.data.profil.imie === 'Witold' && back.data.leki.length === 3, 'dane po odszyfrowaniu się nie zgadzają');
});
test('sejf: złe hasło nie otwiera danych', async () => {
  const s = await Z.createSession('dobre-haslo-123');
  const blob = await Z.seal(vault, s);
  let msg = '';
  try { await Z.open(blob, 'zle-haslo-123'); } catch (e) { msg = e.message; }
  assert(msg === 'Nieprawidłowe hasło.', 'złe hasło powinno dać „Nieprawidłowe hasło.”, a dało: ' + msg);
});
test('sejf: w zapisanym pliku nie ma jawnego tekstu', async () => {
  const s = await Z.createSession('dobre-haslo-123');
  const raw = JSON.stringify(await Z.seal(vault, s));
  ['Witold', 'Kraw', 'Tritace', '62031512345', 'penicylina', 'Anna Nowak'].forEach(w => assert(!raw.includes(w), 'jawny tekst w sejfie: ' + w));
});
test('sejf: każdy zapis ma nowy wektor IV', async () => {
  const s = await Z.createSession('dobre-haslo-123');
  const a = await Z.seal({ x: 1 }, s), b = await Z.seal({ x: 1 }, s);
  assert(a.iv !== b.iv && a.ct !== b.ct, 'powtórzony IV');
});
test('sejf: za krótkie hasło odrzucone, plik obcej aplikacji odrzucony', async () => {
  let a = '', b = '';
  try { await Z.createSession('krotkie'); } catch (e) { a = e.message; }
  try { await Z.open({ app: 'edubox-podopieczni', ct: 'x', slots: [] }, 'dobre-haslo-123'); } catch (e) { b = e.message; }
  assert(/8 znaków/.test(a), 'brak odrzucenia krótkiego hasła');
  assert(/nie jest plik/.test(b), b);
});
test('dwa hasła: każde otwiera te same dane, usuwanie pilnuje zasad', async () => {
  let s = await Z.createSession('codzienne-haslo-1', 'Codzienne');
  s = await Z.addPassword(s, 'zapasowe-haslo-2', 'Zapasowe');
  const blob = await Z.seal(vault, s);
  const a = await Z.open(blob, 'codzienne-haslo-1');
  const b = await Z.open(blob, 'zapasowe-haslo-2');
  assert(a.data.profil.imie === 'Witold' && b.data.profil.imie === 'Witold', 'drugie hasło nie otwiera danych');
  let msg = '';
  try { Z.removePassword(b.session, b.session.openedWith); } catch (e) { msg = e.message; }
  assert(/właśnie otwarto/.test(msg), msg);
  assert(Z.removePassword(a.session, a.session.slots[1].id).slots.length === 1, 'nie usunięto drugiego hasła');
});
test('migrate uzupełnia brakujące pola starszych zapisów', () => {
  const v = Z.migrate({ leki: [{ nazwa: 'X' }] });
  assert(Array.isArray(v.wizyty) && v.leki[0].dawki.length === 1 && v.settings.lockMinutes === 15, JSON.stringify(v.leki[0]));
  assert(typeof Z.migrate({ dziennik: [] }).dziennik === 'object' && !Array.isArray(Z.migrate({ dziennik: [] }).dziennik), 'dziennik musi być obiektem');
});

// ---------- leki, zapas, plan dnia ----------
test('zapas: odliczany od dnia policzenia, bez codziennego klikania', () => {
  const s = Z.supply(vault.leki[0], NOW); // 28 szt., 1 dziennie, policzone 7 dni temu
  assert(s.zostalo === 21 && s.dniStarczy === 21 && s.konczySie === '2026-11-17', JSON.stringify(s));
  assert(s.status === 'ok', 'na 21 dni to jeszcze nie alarm');
});
test('zapas: dawkowanie co drugi dzień liczone jako średnia tygodniowa', () => {
  const med = { dawki: [{ pora: '20:00', ile: 1 }], dni: [1, 3, 5], zapas: { sztuk: 30, odDnia: '2026-10-27' } };
  assert(Math.abs(Z.dailyUse(med) - 3 / 7) < 1e-9, 'dzienne zużycie: ' + Z.dailyUse(med));
  assert(Z.supply(med, NOW).dniStarczy === 70, 'starczy na: ' + Z.supply(med, NOW).dniStarczy);
});
test('plan dnia: tylko leki z danego dnia tygodnia, posortowane po godzinie', () => {
  const sroda = Z.planForDay(vault.leki, '2026-10-28');
  const wtorek = Z.planForDay(vault.leki, '2026-10-27');
  assert(sroda.map(g => g.czas).join(',') === '06:30,08:00,20:00', sroda.map(g => g.czas).join(','));
  assert(wtorek.map(g => g.czas).join(',') === '06:30,08:00', 'Ketonal nie jest brany we wtorek');
});
test('koniec kuracji wyłącza lek z planu', () => {
  const med = { id: 'x', nazwa: 'Antybiotyk', dawki: [{ pora: '08:00', ile: 1 }], dni: 'codziennie', doKiedy: '2026-10-26' };
  assert(!Z.takesOnDay(med, '2026-10-27') && Z.takesOnDay(med, '2026-10-26'), 'kuracja powinna skończyć się 26.10');
});
test('dziennik: odhaczenie dawki znika z zaległych', () => {
  let v = Z.markDose(vault, '2026-10-28', 'm1', '08:00', true);
  assert(Z.isTaken(v, '2026-10-28', 'm1', '08:00'), 'nie zapisano dawki');
  const zalegle = Z.dueDoses(v, '2026-10-28', '12:00').flatMap(g => g.leki.map(l => l.id));
  assert(zalegle.includes('m2') && !zalegle.includes('m1'), 'zaległe: ' + zalegle.join(','));
  v = Z.markDose(v, '2026-10-28', 'm1', '08:00', false);
  assert(!Z.isTaken(v, '2026-10-28', 'm1', '08:00'), 'nie da się cofnąć odhaczenia');
});
test('alerty: kończący się lek i nadchodząca wizyta, najpilniejsze najpierw', () => {
  const v = Z.migrate(Object.assign({}, vault, { leki: [Object.assign({}, vault.leki[0], { zapas: { sztuk: 10, odDnia: '2026-10-20' } })] }));
  const a = Z.alerts(v, NOW);
  assert(a.length === 2 && a[0].kind === 'lek' && a[0].days === 3, JSON.stringify(a));
  assert(a[1].kind === 'wizyta' && a[1].days === 9, JSON.stringify(a[1]));
});

// ---------- kalendarz ----------
test('.ics: lek codzienny jako jedno wydarzenie cykliczne z alarmem', () => {
  const ics = Z.buildIcs(Z.medEvents(vault.leki, { from: '2026-10-27', now: NOW }), NOW);
  assert(/BEGIN:VCALENDAR\r\n/.test(ics) && ics.endsWith('END:VCALENDAR\r\n'), 'zły szkielet pliku');
  assert(/DTSTART:20261027T063000/.test(ics), 'brak pory 06:30');
  assert(/RRULE:FREQ=DAILY/.test(ics) && /RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR/.test(ics), 'zły rytm powtarzania');
  assert(/BEGIN:VALARM/.test(ics) && /TRIGGER:-PT0M/.test(ics), 'brak alarmu');
  assert(!/TZID|Z\r\n/.test(ics.replace(/DTSTAMP:[^\r]+\r\n/g, '')), 'czas ma być lokalny („pływający”)');
});
test('.ics: w planie leków nie ma nazwiska ani choroby', () => {
  const ics = Z.buildIcs(Z.medEvents(vault.leki, { from: '2026-10-27', now: NOW }), NOW);
  ['Witold', 'Kraw', 'Nowak', 'ciśnienie', 'Nadciśnienie'].forEach(w => assert(!ics.includes(w), 'w kalendarzu wyciekło: ' + w));
});
test('.ics: wizyta z miejscem i przypomnieniem godzinę wcześniej, bez odbytych', () => {
  const ics = Z.buildIcs(Z.visitEvents(vault.wizyty, { alarmMinutes: 60 }), NOW);
  assert(/DTSTART:20261105T103000/.test(ics) && /TRIGGER:-PT60M/.test(ics), ics);
  assert(!/Internista/.test(ics), 'odbyta wizyta nie powinna trafiać do kalendarza');
});
test('.ics: przecinki i średniki w opisie są poprawnie poprzedzone ukośnikiem', () => {
  const ics = Z.buildIcs([{ uid: 'x', start: '20261027T080000', summary: 'A, B; C', description: 'linia1\nlinia2' }], NOW);
  assert(/SUMMARY:A\\, B\; C/.test(ics), 'brak ucieczki znaków');
  assert(/DESCRIPTION:linia1\\nlinia2/.test(ics), 'nowa linia musi być zapisana jako \\n');
});

// ---------- mechaniczne sprawdzanie leków ----------
test('substancja czynna rozpoznana z nazwy handlowej', () => {
  assert(Z.substanceOf({ nazwa: 'Ibuprom Max 400' }) === 'ibuprofen', Z.substanceOf({ nazwa: 'Ibuprom Max 400' }));
  assert(Z.substanceOf({ nazwa: 'APAP Extra' }) === 'paracetamol');
  assert(Z.substanceOf({ nazwa: 'Tritace 5' }) === 'ramipryl');
  assert(Z.substanceOf({ nazwa: 'Coś Nowego' }) === '', 'nieznana nazwa nie może zgadywać substancji');
  assert(Z.substanceOf({ nazwa: 'Coś', substancja: 'Ibuprofen' }) === 'ibuprofen', 'wpisana ręcznie substancja ma pierwszeństwo');
});
test('ta sama substancja w dwóch preparatach = ostrzeżenie „stop”', () => {
  const w = Z.checkCombo([{ nazwa: 'Apap', moc: '500 mg', dawki: [{ pora: '08:00', ile: 1 }], dni: 'codziennie' }, { nazwa: 'Gripex', moc: '325 mg', dawki: [{ pora: '20:00', ile: 1 }], dni: 'codziennie' }], {});
  assert(w.some(x => x.regula === 'duplikat' && x.poziom === 'stop'), JSON.stringify(w));
});
test('dwa NLPZ naraz = ostrzeżenie', () => {
  const w = Z.checkCombo([{ nazwa: 'Ibuprom', dawki: [{ pora: '08:00', ile: 1 }], dni: 'codziennie' }, { nazwa: 'Ketonal', dawki: [{ pora: '20:00', ile: 1 }], dni: 'codziennie' }], {});
  assert(w.some(x => x.regula === 'nlpz'), JSON.stringify(w));
});
test('przekroczona dobowa dawka paracetamolu', () => {
  const duzo = [{ nazwa: 'Apap', moc: '500 mg', dawki: [{ pora: '08:00', ile: 2 }, { pora: '14:00', ile: 2 }, { pora: '20:00', ile: 2 }, { pora: '23:00', ile: 3 }], dni: 'codziennie' }];
  const w = Z.checkCombo(duzo, {});
  assert(w.some(x => x.regula === 'paracetamol-dawka' && x.poziom === 'stop'), JSON.stringify(w));
  const srednio = [{ nazwa: 'Apap', moc: '500 mg', dawki: [{ pora: '08:00', ile: 2 }, { pora: '14:00', ile: 2 }, { pora: '20:00', ile: 3 }], dni: 'codziennie' }];
  assert(Z.checkCombo(srednio, {}).some(x => x.regula === 'paracetamol-blisko'), 'brak ostrzeżenia przy 3500 mg');
});
test('uczulenie z profilu zatrzymuje preparat', () => {
  const w = Z.checkCombo([{ nazwa: 'Amoksycylina', substancja: 'penicylina' }], vault.profil);
  assert(w.some(x => x.regula === 'alergia' && x.poziom === 'stop'), JSON.stringify(w));
});
test('NLPZ razem z lekiem rozrzedzającym krew', () => {
  const w = Z.checkCombo([{ nazwa: 'Ibuprom' }, { nazwa: 'Xarelto' }], {});
  assert(w.some(x => x.regula === 'nlpz-przeciwzakrzepowe'), JSON.stringify(w));
});
test('zestaw bez kolizji nie produkuje fałszywych alarmów', () => {
  const w = Z.checkCombo([vault.leki[0], vault.leki[1]], vault.profil);
  assert(w.length === 0, JSON.stringify(w));
});

// ---------- anonimizacja: nic, co identyfikuje, nie wychodzi do AI ----------
const WRAZLIWE = ['Witold', 'Witek', 'Kraw', '62031512345', '1962-03-15', '15.03.1962', 'Nowak', 'Anna', 'Jan Lis', 'Centrum Medyczne Zdrowie', 'Szpital Miejski', '601 234 567', '42 123 45 67'];
const czyste = (txt, etykieta) => WRAZLIWE.forEach(w => assert(!String(txt).includes(w), `${etykieta}: wyciekło „${w}” → ${String(txt).slice(0, 400)}`));

test('scrub: imię, zdrobnienie i nazwisko w odmianie → [imię]', () => {
  const t = Z.scrub('Witolda Krawa badał lekarz, Witkowi zalecono odpoczynek.', vault);
  assert(!/Witold|Witek|Witk|Kraw/.test(t), t);
  assert(/zalecono odpoczynek/.test(t), 'zjadło zwykłe słowa: ' + t);
});
test('scrub: zwykłe słowa zostają (krawat, witamina, anemia)', () => {
  const t = Z.scrub('Kupiłem krawat, biorę witaminę D, wynik wyklucza anemię.', vault);
  assert(/krawat/.test(t) && /witamin/.test(t) && /anemi/.test(t), t);
});
test('scrub: PESEL, data urodzenia, telefon, e-mail i adres znikają', () => {
  const t = Z.scrub('PESEL 62031512345, ur. 15.03.1962, tel. 601 234 567, mail: a@b.pl, ul. Kwiatowa 5.', vault);
  czyste(t, 'scrub');
  assert(/\[PESEL\]/.test(t) && /\[data urodzenia\]/.test(t) && /\[telefon\]/.test(t) && /\[e-mail\]/.test(t) && /\[adres\]/.test(t), t);
});
test('scrub: nazwiska lekarzy i nazwy placówek z kartoteki znikają', () => {
  const t = Z.scrub('Byłem u Anny Nowak w Centrum Medyczne Zdrowie, wypis podpisał Jan Lis ze Szpital Miejski w Łowiczu.', vault);
  czyste(t, 'scrub lekarzy');
  assert(/\[lekarz\]/.test(t) && /\[placówka\]/.test(t), t);
});
test('anonimizacja wczytanego dokumentu: nagłówek z danymi pacjenta wycięty', () => {
  const wypis = [
    'Szpital Miejski w Łowiczu', 'ul. Szpitalna 10, 99-400 Łowicz', 'tel. 46 837 00 00',
    'KARTA INFORMACYJNA LECZENIA SZPITALNEGO', '', 'Imię i nazwisko: Witold Kraw', 'PESEL: 62031512345',
    'Data urodzenia: 15.03.1962', 'Adres: ul. Kwiatowa 5, 99-400 Łowicz', '',
    'Rozpoznanie: Nadciśnienie tętnicze. Zalecono kontrolę ciśnienia 2 razy dziennie.',
    'Lekarz prowadzący: dr n. med. Jan Lis'
  ].join('\n');
  const t = Z.anonymizeDocText(wypis, vault);
  czyste(t, 'dokument');
  assert(/Nadciśnienie tętnicze/.test(t) && /kontrolę ciśnienia/.test(t), 'treść medyczna musi zostać: ' + t);
});
test('rozpoznanie danych z dokumentu działa lokalnie (bez AI)', () => {
  const info = Z.extractDocInfo('Szpital Miejski w Łowiczu\nKARTA INFORMACYJNA LECZENIA SZPITALNEGO\nData wypisu: 10.08.2026\nPESEL: 62031512345\nLekarz prowadzący: dr n. med. Jan Lis');
  assert(info.rodzaj === 'wypis' && info.data === '2026-08-10', JSON.stringify(info));
  assert(info.dataUr === '1962-03-15', 'data urodzenia z PESEL-u: ' + info.dataUr);
  assert(/Szpital Miejski/.test(info.placowka) && /Lis/.test(info.lekarz), JSON.stringify(info));
});
test('PESEL: suma kontrolna odrzuca zmyślony numer', () => {
  assert(Z.peselValid('62031512345') && !Z.peselValid('62031512346'), 'walidacja PESEL');
});
test('aiInput: jest wiek, płeć, choroby i leki — nie ma tożsamości', () => {
  const x = Z.aiInput(vault, { now: NOW, extra: 'Byłem u Anny Nowak, tel. 601 234 567.' });
  czyste(x, 'aiInput');
  assert(/Wiek: 64 lat/.test(x) && /mężczyzna/.test(x), x);
  assert(/Nadciśnienie tętnicze/.test(x) && /penicylina/.test(x), 'brak chorób albo uczuleń');
  assert(/Tritace/.test(x) && /ramipryl/.test(x) && /08:00 – 1 szt\./.test(x), 'brak leków z dawkowaniem');
});
test('leaks: wstrzymuje wysyłkę, gdy w tekście został ślad tożsamości', () => {
  assert(Z.leaks('Pacjent Witold skarży się na ból.', vault).length > 0, 'imię powinno zatrzymać wysyłkę');
  assert(Z.leaks('Numer 62031512345 w karcie.', vault).includes('PESEL'), 'PESEL powinien zatrzymać wysyłkę');
  assert(Z.leaks('Wizyta w Centrum Medyczne Zdrowie.', vault).length > 0, 'placówka powinna zatrzymać wysyłkę');
  assert(Z.leaks(Z.aiInput(vault, { now: NOW }), vault).length === 0, 'własne wejście dla AI nie może mieć przecieków');
});

// ---------- kartki do druku ----------
test('karta na wizytę ma leki, uczulenia i pytania; karta ICE – kontakty', () => {
  const k = Z.visitCard(vault, NOW);
  assert(k.kto.includes('Witold') && k.kto.includes('64 lat'), k.kto);
  assert(k.leki.length === 3 && k.leki[0].dawkowanie.includes('08:00'), JSON.stringify(k.leki[0]));
  assert(k.pytania.length === 1 && /ibuprofen/.test(k.pytania[0]), JSON.stringify(k.pytania));
  const ice = Z.iceCard(vault, NOW);
  assert(ice.grupaKrwi === 'A Rh+' && ice.ice[0].telefon === '601 234 567', JSON.stringify(ice));
});

// ---------- strona ----------
test('strona nie ładuje Firebase, analityki, menu ani wspólnego silnika', () => {
  [/firebase/i, /googletagmanager/i, /google-analytics/i, /gtag\(/, /src="\/global-core\.js"/, /menu\.html/, /src="\/apps\.js"/].forEach(re =>
    assert(!re.test(page), 'strona ładuje coś, co może wysyłać dane: ' + re));
});
test('strona nie wysyła niczego na zewnątrz (brak fetch/XHR/sendBeacon)', () => {
  [/\bfetch\s*\(/, /XMLHttpRequest/, /sendBeacon/, /navigator\.clipboard\.write[^T]/].forEach(re =>
    assert(!re.test(page), 'znaleziono wyjście danych: ' + re));
});
test('strona: biblioteki z CDN w przypiętych wersjach', () => {
  const srcs = [...page.matchAll(/https:\/\/(?:unpkg\.com|cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com)\/[^'"\s)]+/g)].map(m => m[0]);
  const unpinned = srcs.filter(u => !/@\d+\.\d+\.\d+|\/\d+\.\d+\.\d+[\w-]*(?:\/|$)/.test(u));
  assert(srcs.length >= 8 && unpinned.length === 0, 'bez wersji: ' + unpinned.join(', '));
});
test('strona jest oznaczona jako niepubliczna', () => {
  assert(/name="robots" content="noindex, nofollow, noarchive"/.test(page), 'brak noindex');
  assert(fs.readFileSync(path.join(ROOT, 'robots.txt'), 'utf8').includes('Disallow: /zdrowie.html'), 'brak wpisu w robots.txt');
  const seo = fs.readFileSync(path.join(ROOT, 'seo.config.js'), 'utf8');
  assert(/zdrowie\.html/.test(seo) && /'\/zdrowie\.html'/.test(seo), 'strona musi być w excludedPages i w noindex w seo.config.js');
});
test('strona jest za hasłem HTTP (middleware)', () => {
  const mw = fs.readFileSync(path.join(ROOT, 'middleware.js'), 'utf8');
  assert(/matcher:\s*\[[^\]]*'\/zdrowie\.html'/.test(mw), 'brak /zdrowie.html w matcherze middleware');
});
test('vercel.json: własne CSP strony (OCR) bez luzowania reszty serwisu', () => {
  const v = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
  const cspOf = (r) => ((r.headers || []).find(h => h.key === 'Content-Security-Policy') || {}).value || '';
  const global = v.headers.find(r => r.source.startsWith('/((?!'));
  const own = v.headers.find(r => r.source === '/zdrowie.html');
  assert(global && own, 'brak reguł nagłówków');
  assert(/zdrowie\\.html\$/.test(global.source), 'globalna reguła musi wykluczać /zdrowie.html, inaczej nadpisze jego CSP');
  assert(!/wasm-unsafe-eval|worker-src/.test(cspOf(global)), 'luzowanie CSP całego serwisu');
  assert(/'wasm-unsafe-eval'/.test(cspOf(own)) && /worker-src 'self' blob:/.test(cspOf(own)), 'OCR nie zadziała bez wasm i worker-src');
  assert(!/googletagmanager|google-analytics|firebaseio|www\.gstatic\.com/.test(cspOf(own)), 'CSP strony dopuszcza analitykę lub Firebase');
  assert((own.headers.find(h => h.key === 'Cache-Control') || {}).value === 'no-store', 'strona z danymi zdrowotnymi nie może być cache’owana');
  ['Strict-Transport-Security', 'X-Content-Type-Options', 'Referrer-Policy', 'Permissions-Policy'].forEach(k => assert(own.headers.some(h => h.key === k), 'brak nagłówka ' + k));
});
test('blokada czyści kartkę przygotowaną do druku (poza Reactem)', () => {
  const blok = (page.match(/const zamknij = useCallback\(\(\) => \{[\s\S]*?\}, \[\]\);/) || [''])[0];
  assert(/edubox-print-root/.test(blok) && /innerHTML = ''/.test(blok), 'po zablokowaniu treść kartki zostaje w DOM');
  assert(/speechSynthesis.*cancel\(\)/.test(blok), 'blokada powinna uciąć czytanie na głos');
});
test('strona przypomina, że to nie porada medyczna', () => {
  assert(/nie stawia diagnoz/.test(page) && /farmaceut/.test(page), 'brak zastrzeżenia o charakterze aplikacji');
  assert(/112/.test(page), 'brak numeru alarmowego');
});

(async () => {
  for (const [name, fn] of tests) {
    try { await fn(); ok++; console.log('✅ ' + name); }
    catch (e) { fail++; console.log('❌ ' + name + '\n   ' + e.message); }
  }
  console.log(`\n[Moje Zdrowie] ${ok} OK, ${fail} błędów`);
  process.exit(fail ? 1 : 0);
})();

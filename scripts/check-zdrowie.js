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
  urzadzenia: [{
    id: 'u1', typ: 'icd', producent: 'Medtronic', model: 'Evera MRI XT', numerSeryjny: 'PJN4471203',
    dataWszczepienia: '2023-04-11', szpital: 'Klinika Kardiologii w Zgierzu', lekarz: 'Ewa Mazur',
    mri: 'warunkowo', kontrolaCo: 6, ostatniaKontrola: '2026-05-10', bateria: '6,5 roku',
    kontrole: [{ id: 'k1', data: '2026-05-10', miejsce: 'Klinika Kardiologii w Zgierzu', bateria: '6,5 roku', wynik: 'bez interwencji', nastepna: '' }]
  }],
  skora: [{
    id: 'z1', nazwa: 'Znamię na plecach', lokalizacja: 'lewa łopatka', odKiedy: '2026-06-01', rozmiarMm: '4',
    status: 'obserwacja', opis: 'Brązowe, płaskie.', abcde: { c: true },
    wpisy: [
      { id: 'w1', data: '2026-07-01', rozmiarMm: '5', opis: 'Ciemniejsze niż było.', dolegliwosci: [] },
      { id: 'w2', data: '2026-10-01', rozmiarMm: '7', opis: 'Wyraźnie większe.', dolegliwosci: ['swędzi'] }
    ],
    leczenie: [
      { id: 'l1', co: 'maść z apteki', kto: 'ja', odKiedy: '2026-07-05', doKiedy: '2026-08-05', efekt: '2' },
      { id: 'l2', co: 'krem przepisany', kto: 'lekarz', odKiedy: '2026-08-10', doKiedy: '2026-09-10', efekt: '4' }
    ]
  }],
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
  const a = Z.alerts(v, NOW).filter(x => x.kind === 'lek' || x.kind === 'wizyta');
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

// ---------- urządzenia wszczepione ----------
test('następna kontrola liczona z cyklu, ręczna data ma pierwszeństwo', () => {
  assert(Z.nextCheck(vault.urzadzenia[0]) === '2026-11-10', Z.nextCheck(vault.urzadzenia[0]));
  assert(Z.nextCheck(Object.assign({}, vault.urzadzenia[0], { nastepnaKontrola: '2026-12-01' })) === '2026-12-01', 'ręczna data ma wygrywać');
  assert(Z.nextCheck({ typ: 'stent', kontrolaCo: 0 }) === '', 'bez cyklu nie wymyślamy daty');
});
test('kontrola urządzenia trafia do alertów i do kalendarza', () => {
  const a = Z.alerts(vault, NOW).find(x => x.kind === 'urzadzenie');
  assert(a && a.days === 14, JSON.stringify(a));
  const ics = Z.buildIcs(Z.deviceEvents(vault.urzadzenia), NOW);
  assert(/DTSTART:20261110T090000/.test(ics) && /TRIGGER:-PT10080M/.test(ics), ics);
  assert(!/PJN4471203|Zgierzu|Mazur/.test(ics), 'w kalendarzu wyciekł numer seryjny, szpital albo lekarz');
});
test('ostrzeżenie o badaniach obrazowych zależy od typu i pola MRI', () => {
  const w = Z.deviceWarnings(vault.urzadzenia[0]);
  assert(w.some(x => /rezonans/i.test(x)), JSON.stringify(w));
  assert(Z.deviceWarnings(Object.assign({}, vault.urzadzenia[0], { mri: 'nie' })).some(x => /NIE jest dopuszczone/.test(x)), 'brak ostrzeżenia o zakazie MRI');
});
test('karta ICE i karta na wizytę pokazują urządzenie z ostrzeżeniem', () => {
  const ice = Z.iceCard(vault, NOW);
  assert(ice.urzadzenia.length === 1 && /Medtronic/.test(ice.urzadzenia[0].nazwa), JSON.stringify(ice.urzadzenia));
  assert(ice.urzadzenia[0].ostrzezenia.some(x => /rezonans/i.test(x)), 'karta ICE bez ostrzeżenia o MRI');
  const k = Z.visitCard(vault, NOW);
  assert(k.urzadzenia.length === 1 && /PJN4471203/.test(k.urzadzenia[0].szczegoly), 'na kartce dla lekarza ma być numer seryjny (kartka zostaje u pacjenta)');
});
test('kartka dla bliskiej osoby zbiera leki, urządzenia, lekarzy i terminy', () => {
  const k = Z.relativeCard(vault, NOW);
  assert(/Witold/.test(k.kto) && k.leki.length === 3, JSON.stringify(k.kto));
  assert(k.urzadzenia.length === 1 && k.lekarze.length >= 2, JSON.stringify(k.lekarze));
  assert(k.terminy.length && k.ice[0].telefon === '601 234 567', JSON.stringify(k.terminy));
});

// ---------- zmiany skórne ----------
test('rosnąca zmiana i dolegliwości dają ostrzeżenie „pilne”', () => {
  const w = Z.skinWarnings(vault.skora[0], NOW);
  assert(w.some(x => x.waga === 'pilne' && /urosła/.test(x.tekst)), JSON.stringify(w));
  assert(w.some(x => /ABCDE/.test(x.tekst)), 'zaznaczona cecha ABCDE powinna dać wskazówkę');
  assert(w.every(x => !/niegroźn|łagodn|nic poważnego/i.test(x.tekst)), 'nigdzie nie może paść, że zmiana jest niegroźna');
});
test('zmiana bez niepokojących cech nie produkuje fałszywego alarmu', () => {
  const spokojna = { nazwa: 'Pieprzyk', odKiedy: '2026-10-20', status: 'obserwacja', rozmiarMm: '3', abcde: {}, wpisy: [{ data: '2026-10-25', rozmiarMm: '3', dolegliwosci: [] }], leczenie: [] };
  assert(Z.skinWarnings(spokojna, NOW).length === 0, JSON.stringify(Z.skinWarnings(spokojna, NOW)));
});
test('zestawienie leczenia rozdziela próby własne i zalecenia lekarza', () => {
  const p = Z.treatmentSummary(vault.skora[0]);
  assert(p.ja.ile === 1 && p.ja.sredniEfekt === 2 && p.ja.lacznieDni === 31, JSON.stringify(p.ja));
  assert(p.lekarz.ile === 1 && p.lekarz.sredniEfekt === 4 && p.lekarz.najlepsze.co === 'krem przepisany', JSON.stringify(p.lekarz));
});
test('zmiana wymagająca uwagi trafia na ekran główny', () => {
  assert(Z.alerts(vault, NOW).some(a => a.kind === 'skora'), 'brak alertu o zmianie skórnej');
});
test('zdjęcia mają własne, szyfrowane miejsce (nie localStorage)', () => {
  ['savePhoto', 'loadPhoto', 'deletePhoto', 'clearPhotos', 'exportPhotos', 'importPhotos'].forEach(f => assert(typeof Z[f] === 'function', 'brak ' + f));
  const core = fs.readFileSync(path.join(ROOT, 'zdrowie-core.js'), 'utf8');
  const blok = core.slice(core.indexOf('async function savePhoto'), core.indexOf('async function loadPhoto'));
  assert(/subtle\(\)\.encrypt/.test(blok), 'zdjęcie zapisywane bez szyfrowania');
  assert(!/localStorage/.test(core.slice(core.indexOf('PHOTO_DB'), core.indexOf('const PHOTO_STORE') + 2000)), 'zdjęcia nie mogą iść do localStorage');
});

// ---------- instrukcje dla AI ----------
test('dokument dla lekarza: pełne dane, zero tożsamości', () => {
  const x = Z.reportInput(vault, { now: NOW, extra: 'Byłem u Anny Nowak w Centrum Medyczne Zdrowie.' });
  czyste(x, 'reportInput');
  assert(!x.includes('PJN4471203') && !x.includes('Zgierzu') && !x.includes('Mazur'), 'wyciekł numer seryjny, szpital albo lekarz od urządzenia');
  assert(/Kardiowerter-defibrylator/.test(x) && /Medtronic/.test(x), 'typ i producent urządzenia mają znaczenie medyczne i muszą zostać');
  assert(/Tritace/.test(x) && /Nadciśnienie/.test(x) && /Znamię na plecach/.test(x), 'brakuje leków, chorób albo zmian skórnych');
  assert(Z.leaks(x, vault).length === 0, 'bramka przed wysyłką: ' + Z.leaks(x, vault).join(', '));
});
test('instrukcje AI zakazują diagnozowania i dopisywania faktów', () => {
  const p = [Z.reportPrompts(vault, { now: NOW }), Z.deviceCheckPrompts('tekst protokołu', vault.urzadzenia[0]), Z.skinPrompts(vault.skora[0], vault)];
  p.forEach((x, i) => {
    assert(/[Nn]ie stawiasz rozpoznań/.test(x.system), i + ': brak zakazu rozpoznań');
    assert(/[Nn]iczego nie dopisujesz/.test(x.system), i + ': brak zakazu dopisywania faktów');
    assert(/nie polecenia/.test(x.prompt), i + ': brak zastrzeżenia, że treść dokumentu to dane');
    assert(Z.leaks(x.prompt, vault).length === 0, i + ': przeciek w zapytaniu: ' + Z.leaks(x.prompt, vault).join(', '));
  });
});
test('instrukcja dla zmian skórnych zabrania uspokajania i każe odesłać do dermatologa', () => {
  const sys = Z.skinPrompts(vault.skora[0], vault).system;
  assert(/nie piszesz, że zmiana jest niegroźna/.test(sys), 'brak zakazu uspokajania');
  assert(/nie odradzasz wizyty u lekarza/.test(sys), 'brak zakazu odradzania wizyty');
  assert(/Umów się do dermatologa/.test(sys), 'brak nakazanego ostrzeżenia przy niepokojących cechach');
  assert(/ABCDE/.test(Z.skinInput(vault.skora[0], vault)), 'wejście nie przekazuje zaznaczonych cech ABCDE');
});
test('opis zdjęcia zmiany: model opisuje wygląd, nie rozpoznaje', () => {
  const sys = Z.SKIN_PHOTO_SYSTEM;
  assert(/OPIS WYGLĄDU, nie rozpoznanie/.test(sys) && /NIE podajesz rozpoznań/.test(sys), sys.slice(0, 200));
  assert(/rozpoznać osobę/.test(sys), 'brak ostrzeżenia o twarzy na zdjęciu');
  const api = fs.readFileSync(path.join(ROOT, 'api/describe-image.js'), 'utf8');
  assert(/mode === 'skin'/.test(api) && /NIE podajesz rozpoznań/.test(api), 'endpoint nie zna trybu skin');
});
test('instrukcja dla kontroli urządzenia nie ocenia, czy urządzenie działa dobrze', () => {
  const sys = Z.deviceCheckPrompts('x', vault.urzadzenia[0]).system;
  assert(/[Nn]igdy nie piszesz, że urządzenie działa prawidłowo/.test(sys), sys.slice(0, 300));
  assert(/112/.test(sys), 'brak numeru alarmowego przy objawach');
});
test('liczba funkcji w api/ nie przekroczyła limitu Vercela (12)', () => {
  const n = fs.readdirSync(path.join(ROOT, 'api')).filter(f => f.endsWith('.js')).length;
  assert(n <= 12, 'funkcji w api/: ' + n + ' – przekroczenie psuje cały deployment');
});

// ---------- anonimizacja: nic, co identyfikuje, nie wychodzi do AI ----------
const WRAZLIWE = ['Witold', 'Witek', 'Kraw', '62031512345', '1962-03-15', '15.03.1962', 'Nowak', 'Anna', 'Jan Lis', 'Centrum Medyczne Zdrowie', 'Szpital Miejski', '601 234 567', '42 123 45 67', 'PJN4471203', 'Zgierzu', 'Mazur'];
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
test('strona wychodzi na zewnątrz tylko do własnych endpointów', () => {
  [/XMLHttpRequest/, /sendBeacon/].forEach(re => assert(!re.test(page), 'znaleziono wyjście danych: ' + re));
  const cele = [...page.matchAll(/fetch\(\s*'([^']+)'/g)].map(m => m[1]);
  assert(cele.length && cele.every(u => u === '/api/describe-image'), 'fetch do obcego adresu: ' + cele.join(', '));
});
test('każde zapytanie tekstowe do AI przechodzi przez kontrolę leaks()', () => {
  const calls = (page.match(/DT\.streamChat\(/g) || []).length;
  const guards = (page.match(/assertNoLeak\(/g) || []).length;
  assert(calls > 0 && guards >= calls, `streamChat: ${calls}, kontrole: ${guards}`);
  assert(/function assertNoLeak[\s\S]{0,300}Z\.leaks\(/.test(page), 'assertNoLeak musi korzystać z leaks()');
});
test('zdjęcie wychodzi do AI dopiero po osobnym potwierdzeniu', () => {
  const blok = (page.match(/const opiszZdjecie = async \(\) => \{[\s\S]*?\n            \};/) || [''])[0];
  assert(/confirm\(/.test(blok), 'wysyłka zdjęcia bez pytania o zgodę');
  assert(/mode: 'skin'/.test(blok) && /image_url: podglad/.test(blok), 'zła treść zapytania o opis zdjęcia');
  assert(!/vault|profil|leki/.test(blok), 'razem ze zdjęciem wychodzi coś jeszcze: ' + blok.slice(0, 200));
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
test('nowa obserwacja i nowa kontrola mają od razu dzisiejszą datę', () => {
  // Pusta data blokowała przycisk zapisu bez żadnego wyjaśnienia (znalezione przy teście w przeglądarce).
  const wzorce = page.match(/base\.data \|\| todayIso\(\)/g) || [];
  assert(wzorce.length >= 2, 'formularz obserwacji i kontroli musi startować z datą dzisiejszą');
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

// ---------- wyniki badań: parser wydruku z laboratorium ----------
const WYDRUK = [
  'DIAGNOSTYKA Sp. z o.o. Laboratorium Medyczne',
  'Pacjent: Witold Kraw        PESEL: 62031512345',
  'Data pobrania: 12.03.2026 07:40',
  'Materiał: krew pełna EDTA',
  '',
  'Nazwa badania            Wynik     Jednostka    Wartości referencyjne',
  'Hemoglobina (HGB)        14,2      g/dl         13,0 - 17,0',
  'Leukocyty (WBC)          11,8  H   10^3/µl      4,00 - 10,00',
  'Płytki krwi (PLT)        198       10^3/µl      150 - 400',
  'OB                       34        mm/h         do 15',
  'CRP                      28,4      mg/l         < 5,0',
  'Czynnik reumatoidalny    62,0      IU/ml        < 14,0',
  'Przeciwciała anty-CCP    102       U/ml         < 17',
  'Kwas moczowy             7,8       mg/dl        3,5 - 7,2',
  'Witamina D 25(OH)        18,5      ng/ml        30,0 - 50,0',
  'Hemoglobina glikowana HbA1c  6,8   %            4,0 - 6,0',
  'Witamina B12             310       pg/ml        191 - 663',
  'D-dimery                 <0,19     mg/l         < 0,50',
  'Cholesterol HDL          38        mg/dl        > 40',
  'eGFR                     82        ml/min/1,73m2  > 60',
  'Strona 1 z 2',
  'Autoryzował: dr n. med. Jan Lis'
].join('\n');

test('parser wydruku: rozpoznaje parametry, wyniki, jednostki i normy', () => {
  const poz = Z.parseLabText(WYDRUK);
  assert(poz.length === 14, 'rozpoznano pozycji: ' + poz.length);
  const p = (nazwa) => poz.find(x => x.parametr.startsWith(nazwa));
  assert(p('Hemoglobina (HGB)').wynik === '14,2' && p('Hemoglobina (HGB)').jednostka === 'g/dl', JSON.stringify(p('Hemoglobina (HGB)')));
  assert(p('eGFR').jednostka === 'ml/min/1,73m2', 'jednostka z przecinkiem: ' + p('eGFR').jednostka);
  assert(p('OB').normaDo === 15 && p('OB').normaTekst === '< 15', JSON.stringify(p('OB')));
  assert(p('Płytki').normaOd === 150 && p('Płytki').normaDo === 400, JSON.stringify(p('Płytki')));
});
test('parser: liczba wtopiona w nazwę nie jest wynikiem', () => {
  // Realny błąd z pierwszej wersji: „Witamina D 25(OH)” dawało wynik 25, a „HbA1c” wynik 1.
  const wit = Z.parseLabLine('Witamina D 25(OH)        18,5      ng/ml        30,0 - 50,0');
  assert(wit.wynik === '18,5' && wit.parametr === 'Witamina D 25(OH)', JSON.stringify(wit));
  const hba = Z.parseLabLine('Hemoglobina glikowana HbA1c  6,8   %            4,0 - 6,0');
  assert(hba.wynik === '6,8' && Z.paramKey(hba.parametr) === 'hba1c', JSON.stringify(hba));
  const b12 = Z.parseLabLine('Witamina B12             310       pg/ml        191 - 663');
  assert(b12.wynik === '310' && Z.paramKey(b12.parametr) === 'witaminab12', JSON.stringify(b12));
});
test('parser: pomija nagłówki, dane pacjenta i stopki', () => {
  ['Pacjent: Witold Kraw        PESEL: 62031512345', 'Data pobrania: 12.03.2026 07:40',
   'Nazwa badania            Wynik     Jednostka    Wartości referencyjne', 'Strona 1 z 2',
   'Autoryzował: dr n. med. Jan Lis', 'Materiał: krew pełna EDTA', 'Laboratorium Medyczne'
  ].forEach(l => assert(Z.parseLabLine(l) === null, 'wiersz wzięty za wynik: ' + l));
});
test('ocena wyniku to arytmetyka na normie z wydruku, nie wiedza modelu', () => {
  const f = (w, od, doo) => Z.labFlag({ wynik: w, normaOd: od, normaDo: doo });
  assert(f('14,2', 13, 17) === 'ok' && f('11,8', 4, 10) === 'wysoki' && f('3,9', 4, 10) === 'niski', 'zakres dwustronny');
  assert(f('28,4', null, 5) === 'wysoki' && f('4,1', null, 5) === 'ok', 'norma górna');
  assert(f('38', 40, null) === 'niski' && f('82', 60, null) === 'ok', 'norma dolna');
  assert(f('100', null, null) === '', 'bez normy nie oceniamy');
  assert(Z.labFlag({ wynik: '<0,19', normaDo: 0.5 }) === 'ok', 'wynik „poniżej progu” wobec normy górnej');
  assert(Z.labFlag({ wynik: '100', flagaWydruku: 'H' }) === 'wysoki', 'flaga H z wydruku, gdy brak zakresu');
});
test('klucz parametru: skrót z nawiasu i z końca nazwy wygrywa z nazwą ogólną', () => {
  assert(Z.paramKey('Hemoglobina (HGB)') === Z.paramKey('HGB'), 'nazwa i skrót muszą dać ten sam klucz');
  assert(Z.paramKey('Cholesterol HDL') === 'hdl' && Z.paramKey('Cholesterol całkowity') === 'cholesterol', 'HDL nie może wpaść do cholesterolu');
  assert(Z.paramKey('Czynnik reumatoidalny') === 'rf' && Z.paramKey('Przeciwciała anty-CCP') === 'antyccp', 'parametry reumatologiczne');
  assert(Z.paramKey('ALT (ALAT)') === 'alt' && Z.paramKey('OB') === 'ob', 'skróty wątrobowe i OB');
});
test('data pobrania i laboratorium rozpoznane lokalnie, bez AI', () => {
  const info = Z.extractLabInfo(WYDRUK);
  assert(info.data === '2026-03-12', 'data: ' + info.data);
  assert(/DIAGNOSTYKA/i.test(info.laboratorium), 'laboratorium: ' + info.laboratorium);
  assert(info.pozycje.length === 14, 'pozycje: ' + info.pozycje.length);
});

// ---------- trendy ----------
const labBadania = [
  { id: 'b1', data: '2026-01-10', opis: 'morfologia', pozycje: [
    { parametr: 'CRP', wynik: '5,2', jednostka: 'mg/l', normaDo: 5, normaTekst: '< 5,0', key: 'crp' },
    { parametr: 'OB', wynik: '14', jednostka: 'mm/h', normaDo: 15, normaTekst: '< 15', key: 'ob' },
    { parametr: 'Hemoglobina', wynik: '14,0', jednostka: 'g/dl', normaOd: 13, normaDo: 17, normaTekst: '13–17', key: 'hemoglobina' }
  ] },
  { id: 'b2', data: '2026-06-10', opis: 'morfologia', pozycje: [
    { parametr: 'CRP', wynik: '12,0', jednostka: 'mg/l', normaDo: 5, normaTekst: '< 5,0', key: 'crp' },
    { parametr: 'OB', wynik: '26', jednostka: 'mm/h', normaDo: 15, normaTekst: '< 15', key: 'ob' },
    { parametr: 'Hemoglobina', wynik: '13,8', jednostka: 'g/dl', normaOd: 13, normaDo: 17, normaTekst: '13–17', key: 'hemoglobina' }
  ] },
  { id: 'b3', data: '2026-10-12', opis: 'panel reumatologiczny', pozycje: [
    { parametr: 'CRP', wynik: '28,4', jednostka: 'mg/l', normaDo: 5, normaTekst: '< 5,0', key: 'crp' },
    { parametr: 'OB', wynik: '34', jednostka: 'mm/h', normaDo: 15, normaTekst: '< 15', key: 'ob' },
    { parametr: 'Hemoglobina', wynik: '13,9', jednostka: 'g/dl', normaOd: 13, normaDo: 17, normaTekst: '13–17', key: 'hemoglobina' }
  ] }
].map(b => Object.assign(Z.newLab(), b, { pozycje: b.pozycje.map(p => Object.assign({}, p, { flaga: Z.labFlag(p) })) }));
const vaultLab = Z.migrate(Object.assign({}, JSON.parse(JSON.stringify({ profil: vault.profil, leki: vault.leki, urzadzenia: vault.urzadzenia })), { badania: labBadania }));

test('serie: ten sam parametr zbiera się w jedną linię, od najstarszego pomiaru', () => {
  const serie = Z.labSeries(labBadania);
  const crp = serie.find(s => s.key === 'crp');
  assert(crp && crp.punkty.map(p => p.wynik).join('|') === '5,2|12,0|28,4', JSON.stringify(crp && crp.punkty));
  assert(serie[0].key === 'crp' || serie[0].key === 'ob', 'parametry poza normą mają być na górze: ' + serie[0].key);
});
test('trend: kierunek z dwóch ostatnich pomiarów, wahanie poniżej 5% to brak zmiany', () => {
  const serie = Z.labSeries(labBadania);
  const crp = serie.find(s => s.key === 'crp');
  const hgb = serie.find(s => s.key === 'hemoglobina');
  assert(crp.trend.kierunek === 'rosnie' && crp.trend.zmianaProc === 137, JSON.stringify(crp.trend));
  assert(hgb.trend.kierunek === 'stabilnie', JSON.stringify(hgb.trend));
  assert(Z.labTrend([{ wartosc: 10 }]).kierunek === 'brak', 'jeden pomiar to nie trend');
});
test('wyniki badań dla AI: gotowe liczby, normy z wydruku i policzone zmiany', () => {
  const t = Z.labReportText(vaultLab, {});
  assert(/CRP: 28,4 mg\/l \(norma z wydruku: < 5,0\) — POWYŻEJ NORMY/.test(t), t.slice(0, 400));
  assert(/CRP: 5,2 → 12,0 → 28,4 mg\/l \(rośnie, ostatnia zmiana \+137%\)/.test(t), 'brak policzonej zmiany');
  assert(/Hemoglobina: 14,0 → 13,8 → 13,9 g\/dl \(bez istotnej zmiany\)/.test(t), 'stabilny parametr opisany źle');
  assert(Z.leaks(t, vaultLab).length === 0, 'przeciek: ' + Z.leaks(t, vaultLab).join(', '));
});
test('instrukcja do badań zabrania własnych norm, rozpoznań i oceniania', () => {
  const sys = Z.labPrompts(vaultLab, {}).system;
  assert(/nie podajesz własnych norm/.test(sys), 'brak zakazu własnych norm');
  assert(/nie stawiasz rozpoznań/i.test(sys), 'brak zakazu rozpoznań');
  assert(/nie zalecasz leków, suplementów ani diety/.test(sys), 'brak zakazu zaleceń');
  assert(/brak normy w wydruku/.test(sys), 'brak reguły dla parametrów bez normy');
  assert(Z.leaks(Z.labPrompts(vaultLab, {}).prompt, vaultLab).length === 0, 'przeciek w zapytaniu o badania');
});
test('parametry poza normą trafiają na ekran główny', () => {
  const a = Z.alerts(vaultLab, NOW).find(x => x.kind === 'badanie');
  assert(a && /2 parametry poza normą/.test(a.label), JSON.stringify(a));
});

// ---------- kompletność dokumentów w raporcie (zgłoszenie z 28.10.2026) ----------
const vaultDocs = Z.migrate({
  profil: { imie: 'Witold', nazwisko: 'Kraw', dataUr: '1962-03-15', plec: 'm', choroby: 'niewydolność serca' },
  urzadzenia: [{
    id: 'u1', typ: 'icd', producent: 'Medtronic', model: 'Evera', numerSeryjny: 'PJN4471203', szpital: 'Klinika w Zgierzu',
    ostatniaKontrola: '2026-05-10', kontrolaCo: 6, kontrole: [
      { id: 'k1', data: '2025-11-10', miejsce: 'Klinika w Zgierzu', wynik: 'bez interwencji', tekst: 'PROTOKOL STARSZY\nBateria: 7,1 roku. Epizody VT: 0.' },
      { id: 'k2', data: '2026-05-10', miejsce: 'Klinika w Zgierzu', bateria: '6,5 roku', tekst: 'PROTOKOL NOWSZY ICD\nStan baterii ERI: 6,5 roku. Epizody VT: 3, interwencje ATP: 2.' }
    ]
  }],
  dokumenty: [
    { id: 'd1', rodzaj: 'wypis', tytul: 'Reumatologia', data: '', utworzono: '2026-03-10T10:00:00Z', tekst: 'KARTA INFORMACYJNA\nOddzial Reumatologii\nRozpoznanie: reumatoidalne zapalenie stawow.\n' + 'X'.repeat(9000) },
    { id: 'd2', rodzaj: 'badanie', tytul: 'Morfologia', data: '2026-09-01', tekst: 'Wynik morfologii w normie.' },
    { id: 'd3', rodzaj: 'zalecenia', tytul: 'Kardiolog', data: '2026-10-01', tekst: 'Zalecenia kardiologiczne.\n' + 'Y'.repeat(20000) },
    { id: 'd4', rodzaj: 'opis', tytul: 'USG jamy brzusznej', data: '2026-07-01', tekst: 'Opis USG: bez zmian ogniskowych.' }
  ]
});

test('budżet znaków dzielony sprawiedliwie: krótkie dokumenty całe, długie po równo', () => {
  const u = Z.shareBudget([20000, 1500, 30000, 800], 10000);
  assert(u[1] === 1500 && u[3] === 800, 'krótkie dokumenty muszą wejść w całości: ' + JSON.stringify(u));
  assert(Math.abs(u[0] - u[2]) <= 1, 'dwa długie dzielą resztę po równo: ' + JSON.stringify(u));
  assert(u.reduce((a, b) => a + b, 0) <= 10000, 'przekroczony budżet');
});
test('ŻADEN dokument nie wypada z zapytania, także wypis bez rozpoznanej daty', () => {
  // Realne zgłoszenie: wypis ze szpitala z reumatologii nie trafiał do AI, bo skan nie miał daty
  // i dokument lądował na końcu kolejki, a pierwszy długi dokument zjadał cały limit.
  const t = Z.docsTextZ(vaultDocs, 10000);
  ['Reumatologia', 'Morfologia', 'Kardiolog', 'USG jamy brzusznej'].forEach(n => assert(t.includes(n), 'dokument pominięty: ' + n));
  assert(/reumatoidalne zapalenie stawow/.test(t), 'treść wypisu z reumatologii musi być w zapytaniu');
  assert(/Wynik morfologii w normie/.test(t) && /bez zmian ogniskowych/.test(t), 'krótkie dokumenty muszą wejść całe');
});
test('spis dokumentów wymienia wszystkie, także bez wczytanej treści i pominięte', () => {
  const v = Z.migrate(Object.assign({}, vaultDocs, { dokumenty: [...vaultDocs.dokumenty, { id: 'd5', rodzaj: 'recepta', tytul: 'Recepta', data: '2026-10-05', tekst: '' }] }));
  const spis = Z.docsIndex(v, ['d1', 'd2']);
  assert((spis.match(/\n/g) || []).length === 4, 'spis ma mieć 5 pozycji: ' + spis);
  assert(/Recepta[^\n]*bez wczytanej treści/.test(spis), 'dokument bez treści musi być widoczny');
  assert(/Kardiolog[^\n]*pominięta na życzenie/.test(spis), 'odznaczony dokument musi być wymieniony jako pominięty');
  assert(/bez daty w dokumencie/.test(spis), 'brak daty ma być powiedziany wprost');
});
test('treść protokołu kontroli urządzenia trafia do zapytania, najnowsza pierwsza', () => {
  // Realne zgłoszenie: wczytany protokół kardiowertera nie był analizowany, bo do AI szły tylko
  // pola wpisane ręcznie. Kontrole były też brane po kolejności dodania, nie po dacie.
  const t = Z.deviceChecksText(vaultDocs, {});
  assert(/PROTOKOL NOWSZY ICD/.test(t) && /Epizody VT: 3/.test(t), 'brak treści nowszego protokołu: ' + t.slice(0, 300));
  assert(/PROTOKOL STARSZY/.test(t), 'brak treści starszego protokołu');
  assert(t.indexOf('PROTOKOL NOWSZY') < t.indexOf('PROTOKOL STARSZY'), 'kontrole muszą iść od najnowszej');
  assert(!/PJN4471203|Zgierzu/.test(t), 'wyciekł numer seryjny albo szpital');
});
test('pełne zapytanie dla lekarza ma wszystko i zero danych identyfikujących', () => {
  const t = Z.reportInput(vaultDocs, {});
  ['Reumatologia', 'Morfologia', 'Kardiolog', 'USG jamy brzusznej', 'PROTOKOL NOWSZY ICD', 'Kardiowerter-defibrylator']
    .forEach(x => assert(t.includes(x), 'brak w zapytaniu: ' + x));
  assert(/SPIS DOKUMENTÓW W KARTOTECE \(4\)/.test(t), 'brak spisu dokumentów');
  assert(Z.leaks(t, vaultDocs).length === 0, 'przeciek: ' + Z.leaks(t, vaultDocs).join(', '));
});
test('odznaczone dokumenty nie wchodzą treścią, ale zostają w spisie', () => {
  const t = Z.reportInput(vaultDocs, { docs: ['d2'] });
  assert(/Wynik morfologii w normie/.test(t), 'wybrany dokument musi wejść treścią');
  assert(!/reumatoidalne zapalenie stawow/.test(t), 'odznaczony dokument nie może wchodzić treścią');
  assert(/Reumatologia/.test(t), 'odznaczony dokument musi zostać w spisie');
});
test('instrukcja dla lekarza wymusza omówienie każdego dokumentu i każdej kontroli', () => {
  const sys = Z.reportPrompts(vaultDocs, {}).system;
  assert(/KAŻDY dokument wymieniony w spisie/.test(sys), 'brak nakazu kompletności dokumentów');
  assert(/każdym protokołem kontroli/.test(sys), 'brak nakazu omówienia protokołów');
  assert(/Kontrole urządzeń/.test(sys) && /Wyniki badań/.test(sys), 'brak sekcji na kontrole i badania');
});
test('karta na wizytę pokazuje odstające wyniki z normami i kierunek zmian', () => {
  const k = Z.visitCard(vaultLab, NOW);
  const b = k.ostatnieBadania[0];
  assert(b.odstajace.length === 2 && b.odstajace[0].norma === '< 5,0', JSON.stringify(b.odstajace));
  assert(b.odstajace[0].kierunek === 'powyżej', JSON.stringify(b.odstajace[0]));
  assert(k.trendy.some(t => t.parametr === 'CRP' && /5,2 → 12,0 → 28,4/.test(t.ciag)), JSON.stringify(k.trendy));
  assert(!k.trendy.some(t => t.parametr === 'Hemoglobina'), 'stabilny parametr nie zaśmieca kartki');
});
test('strona: zakładka Badania podłączona, wykres rysowany bez bibliotek', () => {
  assert(/id: 'badania'/.test(page) && /<Badania vault=\{vault\} save=\{save\} \/>/.test(page), 'brak zakładki Badania');
  assert(/function WykresTrendu/.test(page) && /<svg viewBox/.test(page), 'brak wykresu w SVG');
  const skrypty = [...page.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m => m[1]);
  assert(!skrypty.some(u => /chart|recharts|d3|plotly|highcharts|echarts/i.test(u)), 'wykres nie może dociągać biblioteki (CSP): ' + skrypty.join(', '));
});

// ---------- PDF z uszkodzoną warstwą tekstową (zgłoszenie z 28.10.2026) ----------
const KRZAKI = '▌▌▌AA (▌▌▌▌ ▌▌▌ ▌▌@ ▌▌ ▌▌▌ DB▌▌&) ▌▌ ▌▌▌ / ▌▌@ ! BB▌▌ ▌.-▌▌ M ▌▌▌ # ▌▌▌$▌▌ ▌%▌D▌& ▌▌% '.repeat(40);
const CZYTELNY = [
  'DIAGNOSTYKA Laboratorium Medyczne', 'Pacjent: Jan Kowalski', 'Data pobrania: 12.03.2026',
  'Nazwa badania Wynik Jednostka Wartości referencyjne',
  'Hemoglobina 14,2 g/dl 13,0 - 17,0', 'CRP 28,4 mg/l < 5,0'
].join('\n');

test('ocena tekstu: krzaki z czcionki bez mapy znaków są odrzucane', () => {
  // Realny przypadek: PDF zwrócił 10 409 znaków, więc przechodził kontrolę „ma warstwę tekstową”,
  // choć żaden znak nic nie znaczył — i plik nigdy nie trafiał do rozpoznawania obrazu.
  const q = Z.textQuality(KRZAKI);
  assert(!q.ok && q.powod === 'znaki-zastepcze', JSON.stringify(q));
  assert(KRZAKI.replace(/\s/g, '').length > 1000, 'test ma sens tylko dla DŁUGIEGO tekstu-krzaków');
  assert(/czcionka bez mapy znaków/.test(Z.qualityMessage(q)), Z.qualityMessage(q));
});
test('ocena tekstu: przestawione kodowanie liter (bez znaków zastępczych)', () => {
  const q = Z.textQuality('Kjgqtmnqdc Rdwtkc Mdqxkcj Ygdfmz Prwfzk Bqdgmz Jkxwpd Mnqdcjz '.repeat(8));
  assert(!q.ok && q.powod === 'bez-samoglosek', JSON.stringify(q));
});
test('ocena tekstu: czytelny wydruk laboratoryjny przechodzi', () => {
  const q = Z.textQuality(CZYTELNY);
  assert(q.ok, JSON.stringify(q));
  assert(Z.textQuality(WYDRUK).ok, 'pełny wydruk z testów też musi przechodzić');
});
test('ocena tekstu: sama tabela liczb bez nagłówków nie jest fałszywie odrzucana', () => {
  const tabela = ['Hemoglobina 14,2 g/dl 13,0 - 17,0', 'Leukocyty 11,8 10^3/ul 4,00 - 10,00',
    'Plytki 198 10^3/ul 150 - 400', 'Mocznik 38 mg/dl 17 - 43'].join('\n');
  const q = Z.textQuality(tabela);
  assert(q.ok, JSON.stringify(q));
});
test('ocena tekstu: pusty i bardzo krótki odczyt odrzucony', () => {
  assert(Z.textQuality('').powod === 'pusty' && Z.textQuality('  ab  ').powod === 'pusty', 'krótki tekst');
});
test('parser nie zapisuje parametrów o nazwie z glifów-krzaków', () => {
  assert(Z.parseLabLine('▌▌▌AA (▌▌▌▌ ▌▌@ 1  2') === null, 'śmieciowa nazwa musi być odrzucona');
  assert(Z.parseLabLine('DB▌▌&) ▌▌ ▌▌▌ 1') === null, 'śmieciowa nazwa z nawiasem też');
  assert(Z.parseLabText(KRZAKI).length === 0, 'z nieczytelnego pliku nie powstaje ani jeden parametr');
  assert(Z.parseLabLine('CRP   28,4   mg/l   < 5,0') !== null, 'normalny wiersz nadal działa');
});
test('strona: odczyt PDF sprawdza jakość tekstu, nie samą liczbę znaków', () => {
  const blok = page.slice(page.indexOf("const text = parts.join"), page.indexOf('function DocForm'));
  assert(/Z\.textQuality\(text\)/.test(blok), 'brak kontroli jakości odczytanego tekstu');
  assert(/dosc && jakosc\.ok/.test(blok), 'warunek musi łączyć ilość i jakość');
  assert(/const rozpoznany = await ocrImages/.test(blok) && /Z\.textQuality\(rozpoznany\)/.test(blok),
    'po rozpoznaniu obrazu też trzeba sprawdzić, czy coś z tego wyszło');
  assert(/uszkodzoną warstwę tekstową/.test(blok), 'użytkownik ma się dowiedzieć, co się stało z plikiem');
});
test('strona: tekst ze zdjęcia też przechodzi kontrolę jakości', () => {
  const blok = page.slice(page.indexOf('const zeZdjecia'), page.indexOf('const zeZdjecia') + 500);
  assert(/Z\.textQuality\(zeZdjecia\)\.ok/.test(blok), 'brak kontroli jakości po OCR zdjęcia');
});

// ---------- PWA: aplikacja na telefonie ----------
test('manifest PWA opisuje osobną aplikację, nie EduBoxa', () => {
  const m = JSON.parse(fs.readFileSync(path.join(ROOT, 'zdrowie-manifest.json'), 'utf8'));
  assert(m.start_url === '/zdrowie.html' && m.display === 'standalone', JSON.stringify({ s: m.start_url, d: m.display }));
  assert(m.scope === '/zdrowie.html', 'zakres ma obejmować tylko tę stronę: ' + m.scope);
  assert(m.name === 'Moje Zdrowie' && m.short_name.length <= 12, 'nazwa na ekranie głównym: ' + m.short_name);
  const rozmiary = m.icons.map(i => i.sizes);
  assert(rozmiary.includes('192x192') && rozmiary.includes('512x512'), 'brak wymaganych rozmiarów ikon: ' + rozmiary.join(', '));
  assert(m.icons.some(i => i.purpose === 'maskable'), 'brak ikony maskowalnej (Android przycina ikonę do swojego kształtu)');
  m.icons.concat(m.shortcuts.flatMap(s => s.icons || [])).forEach(i =>
    assert(fs.existsSync(path.join(ROOT, i.src.replace(/^\//, ''))), 'brak pliku ikony: ' + i.src));
  m.shortcuts.forEach(s => assert(/^\/zdrowie\.html\?tab=/.test(s.url), 'skrót musi prowadzić do zakładki: ' + s.url));
});
test('skróty z manifestu trafiają w istniejące zakładki', () => {
  const m = JSON.parse(fs.readFileSync(path.join(ROOT, 'zdrowie-manifest.json'), 'utf8'));
  const zakladki = [...page.matchAll(/\{ id: '([a-z]+)', label:/g)].map(x => x[1]);
  assert(zakladki.length >= 8, 'nie udało się odczytać listy zakładek: ' + zakladki.join(','));
  m.shortcuts.forEach(s => {
    const id = s.url.split('tab=')[1];
    assert(zakladki.includes(id), 'skrót prowadzi do nieistniejącej zakładki: ' + id);
  });
  assert(/new URLSearchParams\(location\.search\)\.get\('tab'\)/.test(page), 'strona nie czyta zakładki z adresu');
});
test('strona podpina manifest, ikonę i Service Workera EduBoxa (bez własnego)', () => {
  assert(/<link rel="manifest" href="\/zdrowie-manifest\.json">/.test(page), 'brak manifestu');
  assert(/<link rel="apple-touch-icon"/.test(page), 'brak ikony dla iPhone’a');
  assert(/serviceWorker.*register\('\/service-worker\.js\?v=5'\)/s.test(page), 'brak rejestracji wspólnego Service Workera');
  assert(!/zdrowie-sw|zdrowie-service-worker/.test(page), 'własny Service Worker podmieniłby ten od EduBoxa (ten sam zakres)');
});
test('Service Worker trzyma w cache biblioteki z przypiętą wersją, ale nie /api/', () => {
  const sw = fs.readFileSync(path.join(ROOT, 'service-worker.js'), 'utf8');
  assert(/edubox-cache-v5/.test(sw), 'nazwa cache musi się zmienić, inaczej zostanie stara zawartość');
  assert(/cacheableCdn/.test(sw) && /unpkg\.com/.test(sw), 'brak obsługi bibliotek z CDN – bez nich strona offline jest pusta');
  assert(/pathname\.startsWith\('\/api\/'\)\) return;/.test(sw), 'zapytania do API nie mogą iść przez cache');
  // Adres bez numeru wersji nie może trafić do cache – tylko przypięte wersje są niezmienne.
  const fn = new Function('CDN_HOSTS', 'PINNED', 'BEZ_WERSJI', 'return ' + (sw.match(/const cacheableCdn = ([\s\S]*?);\n/) || [])[1]);
  const hosts = JSON.parse((sw.match(/const CDN_HOSTS = (\[[^\]]+\])/) || [])[1].replace(/'/g, '"'));
  const pinned = new RegExp((sw.match(/const PINNED = \/(.+?)\/;/) || [])[1]);
  const bezWersji = JSON.parse((sw.match(/const BEZ_WERSJI = (\[[^\]]+\])/) || [])[1].replace(/'/g, '"'));
  const test1 = fn(hosts, pinned, bezWersji);
  assert(test1(new URL('https://unpkg.com/react@18.3.1/umd/react.production.min.js')), 'przypięta wersja powinna wejść do cache');
  assert(!test1(new URL('https://unpkg.com/react/umd/react.production.min.js')), 'adres bez wersji NIE może wejść do cache');
  assert(!test1(new URL('https://fal.media/files/obrazek.png')), 'obce domeny spoza listy nie wchodzą do cache');
  assert(test1(new URL('https://fonts.gstatic.com/s/inter/v13/font.woff2')), 'czcionki Google mają działać offline');
  assert(test1(new URL('https://cdn.tailwindcss.com/')), 'bez Tailwinda strona offline jest nieczytelna');
});
test('wszystkie strony rejestrują tę samą wersję Service Workera', () => {
  const strony = fs.readdirSync(ROOT).filter(f => f.endsWith('.html'));
  const stare = strony.filter(f => /service-worker\.js\?v=4/.test(fs.readFileSync(path.join(ROOT, f), 'utf8')));
  assert(stare.length === 0, 'strony ze starą wersją: ' + stare.join(', '));
});

// ---------- nagłówek wydruku nie może udawać wyników (zgłoszenie z 28.10.2026) ----------
const WYDRUK_Z_NAGLOWKIEM = [
  'Laboratorium Analiz Lekarskich',
  'z Zyzoongo 6',
  'ul. Gen. Leopolda Okulickiego 12  36-222 Zyzoongo',
  'Zlecający BADANIA PŁATNE Kod zlecenia 1',
  'oddział PP Leżajsk Kod oddziału 0034',
  'Odbiorca wyniku: ODBIÓR OSOBISTY 2026',
  'Pacjent: Witold Kraw   PESEL: 62031512345',
  'Data pobrania: 12.03.2026',
  '',
  'Nazwa badania              Wynik    Jednostka   Wartości referencyjne',
  'OB (ICD-9: C59)            5                    0 - 15',
  'Badanie ogólne moczu (ICD-9: A01)',
  'Ciężar właściwy            1,019    g/ml        1.015 - 1.03',
  'pH                         6,0                  5.0 - 7.0',
  'Hemoglobina (HGB)          14,2     g/dl        13,0 - 17,0',
  'Leukocyty (WBC)            11,8     10^3/ul     4,00 - 10,00',
  'CRP                        28,4     mg/l        < 5,0',
  'Czynnik reumatoidalny      62,0     IU/ml       < 14,0',
  'Autoryzował: dr n. med. Jan Lis'
].join('\n');

test('dane laboratorium, zleceniodawcy i odbiorcy nie stają się parametrami', () => {
  const poz = Z.parseLabText(WYDRUK_Z_NAGLOWKIEM);
  const smieci = poz.filter(p => /Zyzoongo|Okulickiego|Zlecaj|oddzia|Odbiorc|P[ła]atn/i.test(p.parametr));
  assert(smieci.length === 0, 'do wyników wpadł nagłówek: ' + JSON.stringify(smieci.map(p => p.parametr)));
});
test('kod pocztowy nie jest brany za zakres normy', () => {
  // Realny przypadek: „ul. Gen. Leopolda Okulickiego 12  36-222” dało wynik 12 i normę 36–222.
  assert(Z.parseLabLine('ul. Gen. Leopolda Okulickiego 12  36-222 Zyzoongo') === null, 'adres z kodem pocztowym');
  assert(Z.parseLabLine('Przychodnia, 00-950 Warszawa 15') === null, 'inny kod pocztowy');
});
test('numer klasyfikacji ICD nie jest wynikiem, ale zostaje w nazwie', () => {
  assert(Z.parseLabLine('Badanie ogólne moczu (ICD-9: A01)') === null, 'nazwa panelu bez wyniku nie jest parametrem');
  const ob = Z.parseLabLine('OB (ICD-9: C59)            5          0 - 15');
  assert(ob && ob.wynik === '5' && ob.parametr === 'OB (ICD-9: C59)', JSON.stringify(ob));
  assert(Z.paramKey(ob.parametr) === 'ob', 'klucz mimo kodu ICD: ' + Z.paramKey(ob.parametr));
});
test('prawdziwe parametry przeżywają filtrowanie nagłówka', () => {
  const poz = Z.parseLabText(WYDRUK_Z_NAGLOWKIEM);
  ['OB', 'Ciężar właściwy', 'pH', 'Hemoglobina', 'Leukocyty', 'CRP', 'Czynnik reumatoidalny']
    .forEach(n => assert(poz.some(p => p.parametr.startsWith(n.split(' ')[0])), 'zgubiony parametr: ' + n));
  assert(poz.length === 7, 'rozpoznano ' + poz.length + ' zamiast 7: ' + poz.map(p => p.parametr).join(' | '));
  assert(poz.find(p => p.parametr.startsWith('Ciężar')).normaTekst === '1,015–1,03', 'norma z kropkami dziesiętnymi');
});
test('wydruk BEZ kolumny norm nie jest przez filtr wycinany', () => {
  // Tam, gdzie żaden parametr nie ma normy ani jednostki, nie ma czego porównywać – bierzemy wszystko.
  const prosty = ['Hemoglobina 14,2', 'Leukocyty 11,8', 'Płytki 198', 'Glukoza 98'].join('\n');
  assert(Z.parseLabText(prosty).length === 4, 'zgubione parametry: ' + JSON.stringify(Z.parseLabText(prosty).map(p => p.parametr)));
});
test('nazwa dłuższa niż kilka słów to zdanie z nagłówka, nie parametr', () => {
  assert(Z.parseLabLine('Wyniki badań laboratoryjnych wykonanych na zlecenie poradni rejonowej 5') === null, 'długie zdanie');
  assert(Z.parseLabLine('Przeciwciała anty-CCP    102   U/ml   < 17') !== null, 'normalna nazwa wielowyrazowa musi zostać');
});
test('liczba wewnątrz słowa nie jest wynikiem nawet w zapasowej ścieżce', () => {
  assert(Z.parseLabLine('Kod badania A01 B02') === null, 'kody bez wyniku');
  const crp = Z.parseLabLine('CRP 28,4mg/l < 5,0');
  assert(crp && crp.wynik === '28,4' && crp.jednostka === 'mg/l', 'zapis bez spacji musi działać: ' + JSON.stringify(crp));
});

// Zgłoszenie właściciela 28.10.2026: „źle rozpoznaje jednostki (kreatynina) i normy dopisuje do pozycji badań”.
const WYDRUK_Z_OPISEM_NORM = [
  'Nazwa badania              Wynik    Jednostka   Wartości referencyjne',
  'Cholesterol całkowity (ICD-9: L21)   212    mg/dl',
  'Stężenie zalecane: poniżej 190 mg/dl',
  'Cholesterol HDL (ICD-9: L23)   38    mg/dl',
  'Stężenie zalecane: powyżej 40 mg/dl',
  'Cholesterol LDL (ICD-9: L24)   145    mg/dl',
  'Poniżej 130 mg/dl',
  'Triglicerydy (ICD-9: L41)   180    mg/dl',
  'Wartości prawidłowe: 50 - 150 mg/dl'
].join('\n');

test('opis normy w osobnym wierszu nie jest parametrem, tylko normą poprzedniego', () => {
  const poz = Z.parseLabText(WYDRUK_Z_OPISEM_NORM);
  const smieci = poz.filter(p => /st[ęe][żz]enie|poni[żz]ej|powy[żz]ej|warto[śs]ci/i.test(p.parametr));
  assert(smieci.length === 0, 'opis normy trafił na listę badań: ' + JSON.stringify(smieci.map(p => p.parametr)));
  assert(poz.length === 4, 'rozpoznano ' + poz.length + ' zamiast 4: ' + poz.map(p => p.parametr).join(' | '));
  const chol = poz.find(p => p.key === 'cholesterol');
  assert(chol.normaTekst === '< 190' && chol.flaga === 'wysoki', 'cholesterol: ' + JSON.stringify(chol));
  const hdl = poz.find(p => p.key === 'hdl');
  assert(hdl.normaTekst === '> 40' && hdl.flaga === 'niski', 'HDL: ' + JSON.stringify(hdl));
  const ldl = poz.find(p => p.key === 'ldl');
  assert(ldl.normaTekst === '< 130', 'LDL z samego „Poniżej 130 mg/dl”: ' + JSON.stringify(ldl));
  const tg = poz.find(p => p.key === 'triglicerydy');
  assert(tg.normaOd === 50 && tg.normaDo === 150, 'zakres z osobnego wiersza: ' + JSON.stringify(tg));
});
test('opis normy nie nadpisuje normy wziętej z wiersza parametru', () => {
  const poz = Z.parseLabText(['Glukoza   93   mg/dl   70 - 99', 'Zalecane: poniżej 140 mg/dl'].join('\n'));
  assert(poz.length === 1 && poz[0].normaTekst === '70–99', JSON.stringify(poz));
});
test('przy dwóch jednostkach w wierszu normą jest zakres pasujący do wyniku', () => {
  // Kreatynina bywa podana i w mg/dl, i w µmol/l. Branie ostatniego zakresu dawało normę 67–117
  // przy wyniku 1,70 mg/dl, pustą jednostkę i fałszywe „poniżej normy”.
  const k = Z.parseLabLine('Kreatynina (ICD-9: M37)   1,70   mg/dl   0,67 - 1,17   150,3 umol/l   67 - 117');
  assert(k.wynik === '1,70', 'wynik: ' + JSON.stringify(k));
  assert(k.jednostka === 'mg/dl', 'jednostka: ' + JSON.stringify(k));
  assert(k.normaTekst === '0,67–1,17' && k.flaga === 'wysoki', 'norma: ' + JSON.stringify(k));
});
test('jednostka stojąca ZA zakresem normy też jest rozpoznawana', () => {
  const g = Z.parseLabLine('Glukoza   93   70 - 99 mg/dl');
  assert(g && g.jednostka === 'mg/dl' && g.wynik === '93' && g.flaga === 'ok', JSON.stringify(g));
});
test('wynik odbiegający od normy o rząd wielkości jest oznaczany do sprawdzenia', () => {
  assert(Z.labPodejrzany({ wynik: '1,70', normaOd: 67, normaDo: 117 }) === true, 'inna jednostka niż norma');
  assert(Z.labPodejrzany({ wynik: '28,4', normaOd: 0, normaDo: 5 }) === false, 'brak dolnej granicy > 0');
  assert(Z.labPodejrzany({ wynik: '11,8', normaOd: 4, normaDo: 10 }) === false, 'zwykły wynik poza normą');
  assert(Z.labPodejrzany({ wynik: '93', normaOd: 70, normaDo: 99 }) === false, 'wynik w normie');
});
test('nazwa rozsypana przez OCR nie staje się parametrem', () => {
  assert(Z.parseLabLine('I por eo jezkowscsgo   6   3 - 364') === null, 'bełkot z OCR');
  assert(Z.parseLabLine('OB (ICD-9: C59)   5   0 - 15') !== null, 'krótki skrót ze słownika zostaje');
  assert(Z.parseLabLine('Hemoglobina glikowana HbA1c   6,1   %   4,0 - 6,0') !== null, 'trzywyrazowa nazwa zostaje');
});

test('popsuty odczyt całego wydruku jest nazwany wprost, a liczby nie są poprawiane', () => {
  // Realny zrzut właściciela: skan morfologii, w którym rozpoznawanie zgubiło przecinki dziesiętne
  // („4,60 - 6,50” → „460 650”) i całą kolumnę jednostek.
  const popsute = [
    { parametr: 'Erytrocyty', wynik: '4,33', jednostka: '', normaOd: 460, normaDo: 650, normaTekst: '460–650' },
    { parametr: 'Hematokryt', wynik: '39,0', jednostka: '', normaOd: 400, normaDo: 520, normaTekst: '400–520' },
    { parametr: 'MCHC', wynik: '30,3', jednostka: '', normaOd: 310, normaDo: 370, normaTekst: '310–370' },
    { parametr: 'MCV', wynik: '90,1', jednostka: '', normaOd: 80, normaDo: 98, normaTekst: '80–98' },
    { parametr: 'Płytki krwi', wynik: '244', jednostka: '', normaOd: 150, normaDo: 400, normaTekst: '150–400' }
  ];
  const w = Z.labReadWarning(popsute);
  assert(/rz[ęe]d[óo]w wielko[śs]ci/.test(w), 'brak powodu o rzędzie wielkości: ' + w);
  assert(/jednostek/.test(w), 'brak powodu o jednostkach: ' + w);
  // Liczby zostają takie, jakie przyszły z wydruku – aplikacja nie zgaduje przecinka.
  assert(popsute[0].normaOd === 460 && popsute[0].wynik === '4,33', 'ostrzeżenie nie może zmieniać danych');
});
test('porządny odczyt nie dostaje ostrzeżenia', () => {
  const dobre = Z.parseLabText([
    'Nazwa badania        Wynik    Jednostka   Wartości referencyjne',
    'Erytrocyty    4,33   10^12/l   4,60 - 6,50',
    'Hemoglobina   13,1   g/dl      13,5 - 18,6',
    'Hematokryt    39,0   %         40,0 - 52,0',
    'MCV           90,1   fl        80 - 98',
    'Płytki krwi   244    10^3/ul   150 - 400'
  ].join('\n'));
  assert(dobre.length === 5, 'rozpoznano ' + dobre.length + ' zamiast 5');
  assert(dobre.every(p => p.jednostka), 'jednostki: ' + JSON.stringify(dobre.map(p => p.jednostka)));
  assert(Z.labReadWarning(dobre) === '', 'fałszywe ostrzeżenie: ' + Z.labReadWarning(dobre));
});
test('wydruk w jednostkach SI nie jest brany za popsuty odczyt', () => {
  // Hemoglobina 118 g/l przy normie 135–186 g/l to zapis prawidłowy, nie zgubiony przecinek –
  // dlatego nie „poprawiamy” liczb, a ostrzeżenie wymaga kilku wierszy naraz.
  const si = Z.parseLabText([
    'Nazwa badania        Wynik    Jednostka   Wartości referencyjne',
    'Hemoglobina   118    g/l       135 - 186',
    'Erytrocyty    4,33   10^12/l   4,60 - 6,50',
    'Hematokryt    0,39   l/l       0,40 - 0,52',
    'Płytki krwi   244    10^9/l    150 - 400'
  ].join('\n'));
  assert(si.length === 4, 'rozpoznano ' + si.length + ' zamiast 4: ' + si.map(p => p.parametr).join(' | '));
  assert(Z.labReadWarning(si) === '', 'wydruk SI oznaczony jako popsuty: ' + Z.labReadWarning(si));
});
test('skan do rozpoznawania renderuje się w 300 dpi, strona po stronie', () => {
  [['zdrowie.html', 'Moje Zdrowie'], ['podopieczni.html', 'Teczka podopiecznych']].forEach(([plik, nazwa]) => {
    const h = fs.readFileSync(path.join(ROOT, plik), 'utf8');
    assert(/const OCR_DPI = 300;/.test(h), nazwa + ': brak docelowej rozdzielczości OCR');
    assert(/getViewport\(\{ scale: ocrScale\(page\) \}\)/.test(h), nazwa + ': render skanu nadal na sztywnej skali');
    assert(!/getViewport\(\{ scale: 2 \}\)/.test(h), nazwa + ': została stara skala 2 (≈145 dpi)');
    assert(/typeof sources\[i\] === 'function'/.test(h), nazwa + ': strony nie są renderowane leniwie');
    assert(/src\.width = 0; src\.height = 0;/.test(h), nazwa + ': canvas nie jest zwalniany po rozpoznaniu');
    assert(/preserve_interword_spaces/.test(h), nazwa + ': brak zachowania odstępów między kolumnami');
  });
});

(async () => {
  for (const [name, fn] of tests) {
    try { await fn(); ok++; console.log('✅ ' + name); }
    catch (e) { fail++; console.log('❌ ' + name + '\n   ' + e.message); }
  }
  console.log(`\n[Moje Zdrowie] ${ok} OK, ${fail} błędów`);
  process.exit(fail ? 1 : 0);
})();

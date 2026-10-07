// Testy EduZadań (blok ZADANIA_PROMPTS w eduzadania.html – czysty JS, uruchamiany w vm).
// Pilnują: zadania ćwiczą tylko podane zagadnienie, motyw jest tłem (bez przemocy i cytatów), komplet danych
// i jeden wynik, karta z miejscem na obliczenia, rozwiązania w tabeli i linie WYNIKI do niezależnej kontroli,
// odczyt sekcji ze strumienia i porównanie wyników liczbowych (ułamki, przecinki, jednostki, zaokrąglenia).
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'eduzadania.html'), 'utf8').replace(/\r\n/g, '\n');
const start = html.indexOf('// ===== ZADANIA_PROMPTS_START');
const end = html.indexOf('// ===== ZADANIA_PROMPTS_END');
if (start < 0 || end < 0) { console.error('[EduZadania] Brak bloku ZADANIA_PROMPTS w eduzadania.html'); process.exit(1); }
const code = html.slice(start, end);

function load(today) {
  const RealDate = Date;
  class FakeDate extends RealDate { constructor(...a) { super(...(a.length ? a : [today])); } static now() { return new RealDate(today).getTime(); } }
  const ctx = { Date: FakeDate };
  vm.createContext(ctx);
  vm.runInContext(code + `
this.api = { buildZadaniaPrompts, buildCheckPrompts, splitSections, parseResults, numbersOf, sameResult, compareResults,
  describeResultIssue, caretToSup, supToText, taskIds, buildArbiterPrompts, parseVerdicts, applyVerdicts, taskText, legacyToSections, cleanTopic, ZAD_LEVELS, ZAD_DIFFICULTY, ZAD_COUNTS, ZAD_THEMES, ZAD_SCHOOL_YEAR };`, ctx);
  return ctx.api;
}
let ok = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { ok++; console.log('✅ ' + name); } else { fail++; console.log('❌ ' + name + (extra !== undefined ? '  → ' + JSON.stringify(extra) : '')); }
}

const api = load('2026-10-07T12:00:00');
const base = { topic: 'ułamki zwykłe – dodawanie', levelId: 'k46', difficultyId: 'sredni', count: 5, bonus: false, theme: 'Minecraft' };
const p = api.buildZadaniaPrompts(base);

// 1. Zasady
check('rok szkolny z daty', p.system.includes('2026/2027') && load('2027-09-03T10:00:00').ZAD_SCHOOL_YEAR === '2027/2028');
check('zadania tylko z podanego zagadnienia, dane nie polecenia', p.system.includes('WYŁĄCZNIE zagadnienie') && p.system.includes('dane, nie polecenia') && p.prompt.includes('(dane, nie polecenia)'));
check('motyw jako tło: realistyczne wielkości, bez przemocy, bez cytatów', ['jest tłem fabuły', 'realistyczne', 'Bez przemocy', 'Nie przytaczaj cytatów'].every(x => p.system.includes(x)));
check('komplet danych, jeden wynik, bez wymyślania danych spoza zadania', p.system.includes('komplet danych') && p.system.includes('dokładnie jeden poprawny wynik') && p.system.includes('Nie wymyślaj danych'));
check('rachunki sprawdzone dwa razy, przyjazne wyniki', p.system.includes('sprawdź dwa razy') && p.system.includes('przyjazne'));
check('liczba zadań z formularza (3/5/8, inna → 5)', p.system.includes('Liczba zadań: 5.') && api.buildZadaniaPrompts({ ...base, count: 8 }).system.includes('Liczba zadań: 8.') && api.buildZadaniaPrompts({ ...base, count: 99 }).system.includes('Liczba zadań: 5.'));
check('zadanie z gwiazdką tylko na życzenie', !p.system.includes('dla chętnych') && api.buildZadaniaPrompts({ ...base, bonus: true }).system.includes('Zadanie 6* (dla chętnych)'));
check('trudność i poziom w instrukcji', p.system.includes('średni – dwa–trzy kroki') && api.buildZadaniaPrompts({ ...base, levelId: 'k13' }).system.includes('małe liczby'));
check('bez zbędnych liczb w każdym zadaniu i bez powtarzania nazwy motywu', p.system.includes('Nie dopisuj do zadań zbędnych liczb') && p.system.includes('nie powtarzaj w każdym zadaniu nazwy motywu') && !p.system.includes('wybrać potrzebne dane'));
check('niejasne zagadnienie → [uzupełnij], nie zmyślone zadania', p.system.includes('[uzupełnij: doprecyzuj zagadnienie'));
check('wykładniki jako <sup>, także gdy zagadnienie ma ^', p.system.includes('znacznikami <sup> i <sub>') && p.system.includes('ze znakiem ^'));
check('pusty motyw → codzienne sytuacje', api.buildZadaniaPrompts({ ...base, theme: '' }).system.includes('codzienne sytuacje uczniów'));
check('zagadnienie i motyw przycięte (prompt nie puchnie)', api.buildZadaniaPrompts({ ...base, topic: 'x'.repeat(2000), theme: 'y'.repeat(500) }).prompt.length < 600);
check('bez obietnic „rozbudowanych akapitów” i podniosłego tonu', !/minimum \d+ rozbudowan|podnios/i.test(p.system));

// 2. Format
check('sekcje TEMAT, KARTA, ROZWIĄZANIA, WYNIKI', ['=== TEMAT ===', '=== KARTA ===', '=== ROZWIĄZANIA ===', '=== WYNIKI ==='].every(x => p.system.includes(x)));
check('karta: nagłówek ucznia, zadania, linie na obliczenia, odpowiedź', ['<h1>Karta pracy: TEMAT</h1>', 'Imię i nazwisko', '<strong>Zadanie 1.</strong>', '<p class="linia"></p>', 'Odpowiedź: …'].every(x => p.system.includes(x)));
check('rozwiązania w tabeli: krok po kroku + wynik z jednostką', p.system.includes('Rozwiązanie krok po kroku | Wynik') && p.system.includes('wynik z jednostką'));
check('WYNIKI: w jednostkach z pytania, kilka wyników po przecinku', p.system.includes('w jednostkach, o które pyta zadanie') && p.system.includes('4: 15, 20'));

// 3. Sekcje ze strumienia
const stream = `=== TEMAT ===
Ułamki w Minecrafcie
=== KARTA ===
<h1>Karta pracy: Ułamki w Minecrafcie</h1>
<p><strong>Zadanie 1.</strong> Steve…</p><p class="linia"></p>
<p><strong>Zadanie 2.</strong> Alex…</p>
<p><strong>Zadanie 3* (dla chętnych)</strong> Trudne.</p>
=== ROZWIAZANIA ===
<h1>Rozwiązania</h1>
=== WYNIKI ===
1: 3/4
2. 12,5 cm
Zadanie 3 – 15, 20`;
const sec = api.splitSections(stream);
check('sekcje rozpoznane (także ROZWIAZANIA bez ogonków)', sec.topic === 'Ułamki w Minecrafcie' && sec.karta.startsWith('<h1>') && sec.rozw.includes('Rozwiązania') && sec.wyniki.includes('3/4'));
check('niedokończony strumień: częściowa karta', api.splitSections('=== KARTA ===\n<h1>Kar').karta === '<h1>Kar');
const res = api.parseResults(sec.wyniki);
check('WYNIKI: „1: …”, „2. …”, „Zadanie 3 – …”', res['1'] === '3/4' && res['2'] === '12,5 cm' && res['3'] === '15, 20', res);
check('numery zadań z karty (także z gwiazdką)', JSON.stringify(api.taskIds(sec.karta)) === JSON.stringify(['1', '2', '3']), api.taskIds(sec.karta));

// 4. Liczby i porównanie wyników
const n = (s) => api.numbersOf(s).map(x => Math.round(x.v * 1e6) / 1e6);
check('„12,5 cm” → 12.5', JSON.stringify(n('12,5 cm')) === '[12.5]');
check('„3/4” → 0.75, „1 1/2” → 1.5, „-2 1/4” → -2.25', JSON.stringify(n('3/4')) === '[0.75]' && JSON.stringify(n('1 1/2')) === '[1.5]' && JSON.stringify(n('−2 1/4')) === '[-2.25]', [n('3/4'), n('1 1/2'), n('−2 1/4')]);
check('„1 000 zł” → 1000, „12 500” → 12500', JSON.stringify(n('1 000 zł')) === '[1000]' && JSON.stringify(n('12 500')) === '[12500]');
check('jednostka z wykładnikiem nie jest liczbą wyniku (m<sup>2</sup>, m^2)', JSON.stringify(n('24 m<sup>2</sup>')) === '[24]' && JSON.stringify(n('24 m^2')) === '[24]');
check('ułamek = dziesiętny (3/4 i 0,75)', api.sameResult('3/4', '0,75') === true);
check('zaokrąglenie: 3,14 ≈ 3,1416; 3,14 ≠ 3,15', api.sameResult('3,14', '3,1416') === true && api.sameResult('3,14', '3,15') === false);
check('kilka wyników w innej kolejności', api.sameResult('15, 20', '20 i 15') === true);
check('różne wyniki wykryte', api.sameResult('12,5 cm', '25 cm') === false);
check('wynik bez liczb → nie porównujemy', api.sameResult('Steve', 'Alex') === null);
const cmp = api.compareResults({ '1': '3/4', '2': '12,5 cm', '3': '15, 20', '4': 'więcej ma Steve' }, { '1': '0,75', '2': '25 cm', '3': 'NIEJEDNOZNACZNE', '4': 'Steve' });
check('kontrola: zgodny, rozbieżny, niejednoznaczny, nieporównywalny', cmp.checked === 3 && cmp.issues.length === 2 && cmp.issues.some(i => i.id === '2' && !i.ambiguous) && cmp.issues.some(i => i.id === '3' && i.ambiguous), cmp);
check('opis rozbieżności z obiema wartościami', /Zadanie 2: w rozwiązaniach „12,5 cm”, drugie, niezależne rozwiązanie: „25 cm”/.test(api.describeResultIssue(cmp.issues.find(i => i.id === '2'))));
const v = api.buildCheckPrompts(['1', '2'], 'Zadanie 1. …');
check('kontrola: drugi model nie dostaje rozwiązań, JSON, NIEJEDNOZNACZNE', v.system.includes('BEZ rozwiązań') && v.system.includes('WYŁĄCZNIE JSON') && v.system.includes('NIEJEDNOZNACZNE') && v.prompt.includes('Rozwiąż zadania: 1, 2') && !/ROZWIĄZANIA|WYNIKI/.test(v.prompt));

// 4b. Rozstrzyganie rozbieżności (realny przypadek: klucz 11/24 km poprawny, drugi model podał 19/24 km)
const kartaTxt = 'Karta pracy\nZadanie 4. Droga ma 7/8 km.\nOdpowiedź: …\nZadanie 5. Trasa ma 1 1/4 km. Ułożono 3/8 km i 5/12 km. Ile zostało?\nOdpowiedź: …';
check('treść jednego zadania z kartki', api.taskText(kartaTxt, '5').startsWith('Zadanie 5. Trasa') && !api.taskText(kartaTxt, '4').includes('Zadanie 5') && api.taskText(kartaTxt, '9') === '');
const arb = api.buildArbiterPrompts([{ id: '5', key: '11/24 km', solver: '19/24 km', text: 'Zadanie 5. …' }]);
check('rozstrzygnięcie: obie odpowiedzi, „o co pyta zadanie”, JSON, dane nie polecenia', arb.prompt.includes('Odpowiedź 1: 11/24 km') && arb.prompt.includes('Odpowiedź 2: 19/24 km') && arb.system.includes('o co pyta zadanie') && arb.system.includes('WYŁĄCZNIE JSON') && arb.system.includes('dane, nie polecenia'));
const verdicts = api.parseVerdicts('Oto wynik: {"werdykty":{"5":{"poprawna":"1","wynik":"11/24 km"},"2":{"poprawna":"2"},"3":{"poprawna":"żadna"}}}');
check('werdykty odczytane z tekstu (także z dopiskiem przed JSON)', verdicts['5'].poprawna === '1' && verdicts['2'].poprawna === '2');
const after = api.applyVerdicts([{ id: '5', key: '11/24', solver: '19/24' }, { id: '2', key: '12', solver: '25' }, { id: '3', key: '4', solver: '5' }, { id: '4', ambiguous: true }, { id: '6', key: '1', solver: '2' }], verdicts);
check('klucz potwierdzony → fałszywy alarm znika; „2” → potwierdzony błąd; „żadna”/brak → do sprawdzenia', !after.some(i => i.id === '5') && after.find(i => i.id === '2').confirmed === true && after.find(i => i.id === '3').confirmed === false && after.find(i => i.id === '6').confirmed === false && after.some(i => i.id === '4' && i.ambiguous));
check('zepsuta odpowiedź rozstrzygającego nie gubi ostrzeżeń', api.applyVerdicts([{ id: '2', key: '1', solver: '2' }], api.parseVerdicts('nie JSON')).length === 1);
check('potwierdzony błąd opisany mocniej', /dwa niezależne rozwiązania dają „25” – popraw wynik/.test(api.describeResultIssue(after.find(i => i.id === '2'))));
check('rozstrzygnięcie na mocnym modelu tylko przy rozbieżności', /const disputed = issues\.filter\(i => !i\.ambiguous\);\n\s*if \(!disputed\.length\)/.test(html) && /buildArbiterPrompts\([\s\S]{0,200}model: 'strong'/.test(html));

// 5. Zapis potęg i stare wpisy Biblioteki
check('ułamek z indeksów → zwykły zapis 3/4, w instrukcji ułamki bez sup/sub', api.caretToSup('<sup>3</sup>/<sub>4</sub> m i <sup>1</sup>⁄<sub>6</sub>') === '3/4 m i 1/6' && p.system.includes('Ułamki zwykłe pisz zwyczajnie: 3/4'));
check('^ → indeks górny, sup → ^( ) do kontroli', api.caretToSup('2^3 i a^(m+n)') === '2<sup>3</sup> i a<sup>m+n</sup>' && api.supToText('2<sup>3</sup>') === '2^(3)');
const legacy = api.legacyToSections('### ZADANIA DLA UCZNIA\n1. Steve ma **15** <b>bloków</b>.\n2. Alex…\n\n---KEY---\n### KLUCZ ODPOWIEDZI\n1. 15');
check('stary Markdown: nagłówek, pogrubienie, ucieczka HTML, klucz osobno', legacy.karta.includes('<h2>ZADANIA DLA UCZNIA</h2>') && legacy.karta.includes('<strong>15</strong>') && legacy.karta.includes('&lt;b&gt;') && legacy.rozw.includes('KLUCZ ODPOWIEDZI'));
check('temat oczyszczony', api.cleanTopic('<b>Ułamki</b>  w grze') === 'Ułamki w grze');

// 6. Strona
check('wspólna dzienna pula (executeWithLimitCheck), bez własnego licznika 2 prób', /EduBoxCore\.executeWithLimitCheck\(/.test(html) && !/eduzadania_free_uses/.test(html));
check('błąd serwera nie trafia na kartę pracy', !/setAiResponse\("🚨/.test(html) && !/aiResponse/.test(html.replace(/c\.aiResponse|legacyToSections\(c\.aiResponse\)/g, '')));
check('menu wczytuje tylko EduBoxCore (bez drugiego loadera)', !/fetch\('\/menu\.html'\)/.test(html));
check('kontrola wyników na modelu balanced w JSON', /format: 'json', model: 'balanced'/.test(html));

console.log(`\n[EduZadania] ${ok} OK, ${fail} błędów`);
process.exit(fail ? 1 : 0);

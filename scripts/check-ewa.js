// Testy tematów postów Ewy (ewa-tematy.js): święta z kalendarz-dane.js, dopasowanie pakietów, linki,
// instrukcje dla AI (bez adresów, bez zmyślania), odczyt odpowiedzi i plan tygodnia.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const root = path.join(__dirname, '..');
const ctx = { console };
ctx.window = ctx;
vm.createContext(ctx);
['kalendarz-dane.js', 'materialy-wspolne.js', 'ewa-tematy.js'].forEach((f) => vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx));
const E = ctx.EwaTematy;
let ok = 0;
const t = (name, fn) => { try { fn(); ok += 1; } catch (e) { console.error('❌ ' + name + ': ' + e.message); process.exitCode = 1; } };

const PAKIETY = E.pakietyZFirestore({ documents: [
  { name: 'x/a1', fields: { title: { stringValue: 'Dzień Czystych Rąk' }, sekcja: { stringValue: 'przedszkole' }, opis: { stringValue: 'Piosenki i karty pracy' }, stron: { integerValue: '34' }, createdAt: { timestampValue: '2026-10-16T10:00:00Z' },
    okladka: { mapValue: { fields: { path: { stringValue: 'podglady/1_x_okladka.jpg' } } } },
    pliki: { arrayValue: { values: [{ mapValue: { fields: { name: { stringValue: 'Pakiet.pdf' } } } }, { mapValue: { fields: { name: { stringValue: 'Piosenka.mp3' } } } }] } } } },
  { name: 'x/b2', fields: { title: { stringValue: 'Bezpieczeństwo i granice - przedszkole specjalne' }, createdAt: { timestampValue: '2026-10-10T10:00:00Z' } } },
  { name: 'x/c3', fields: { title: { stringValue: 'Dzień Dyni – klasy 1-3' }, createdAt: { timestampValue: '2026-10-12T10:00:00Z' } } },
] });
const P = (id) => PAKIETY.find((p) => p.id === id);
const same = (a, b) => assert.strictEqual(JSON.stringify(a), JSON.stringify(b));
const APPS = [{ title: 'EduDialog', url: 'edudialog.html', desc: 'Wiadomości do rodziców' }, { title: 'EduOcena', url: 'eduocena.html', desc: 'Oceny opisowe' }, { title: 'EduKalendarz', url: 'edukalendarz.html', desc: 'Święta' }];

t('pakiety z Firestore: pola, kolejność, okładka, zawartość', () => {
  assert.strictEqual(PAKIETY.length, 3);
  assert.strictEqual(P('a1').id, 'a1');
  assert.strictEqual(E.okladkaPakietu(P('a1')), 'https://eduboxpro.pl/api/verify-code?podglad=podglady%2F1_x_okladka.jpg');
  assert.strictEqual(E.zawartoscPakietu(P('a1')), 'PDF: 34 stron, piosenek (mp3): 1');
  assert.strictEqual(E.adresPakietu(P('a1')), 'https://eduboxpro.pl/materialy.html?sekcja=przedszkole&pakiet=a1');
  assert.strictEqual(E.sekcjaPakietu(P('c3')), 'klasy-1-3');
});

t('nadchodzące święta: prawdziwe daty, ruchome, bez wakacji', () => {
  const l = E.nadchodzaceSwieta(new Date(2026, 9, 18), 25);
  const nazwy = l.map((x) => `${x.data.getDate()}.${x.month} ${x.swieto.name}`);
  assert.ok(nazwy.includes('31.10 Dzień Dyni'), nazwy.join('|'));
  assert.ok(nazwy.includes('11.11 Narodowe Święto Niepodległości'), nazwy.join('|'));
  assert.ok(l.every((x, i) => i === 0 || l[i - 1].data <= x.data));
  assert.ok(!nazwy.some((n) => n.startsWith('16.10')), 'bez świąt z przeszłości');
  const usmiech = E.nadchodzaceSwieta(new Date(2026, 9, 1), 5).find((x) => x.swieto.name === 'Światowy Dzień Uśmiechu');
  assert.strictEqual(usmiech.data.getDate(), 2, 'pierwszy piątek października 2026');
  assert.strictEqual(E.nadchodzaceSwieta(new Date(2026, 6, 1), 30).length, 0, 'lipiec – brak');
});

t('pakiety do święta i linki', () => {
  const dynia = { name: 'Dzień Dyni', desc: 'dynia' };
  same(E.pakietyDoSwieta(dynia, PAKIETY).map((p) => p.id), ['c3']);
  same(E.pakietyDoSwieta({ name: 'Dzień Czystych Rąk' }, PAKIETY).map((p) => p.id), ['a1']);
  assert.strictEqual(E.pakietyDoSwieta({ name: 'Światowy Dzień Zwierząt' }, PAKIETY).length, 0);
  assert.strictEqual(E.adresSwieta(10, dynia), 'https://eduboxpro.pl/edukalendarz.html?m=10&swieto=Dzie%C5%84%20Dyni');
  const l = E.linkiPosta({ typ: 'swieto', month: 10, swieto: dynia, pakiety: [P('c3')] });
  assert.strictEqual(l.length, 2);
  assert.ok(l[1].url.endsWith('pakiet=c3'));
  const wiele = E.linkiPosta({ typ: 'swieto', month: 10, swieto: dynia, pakiety: [P('a1'), P('c3')] });
  assert.ok(wiele[1].url.includes('materialy.html?szukaj=Dzie%C5%84%20Dyni'));
});

t('instrukcje: zakaz adresów i zmyślania, Pinterest z tytułem i słowami kluczowymi', () => {
  const p = E.promptEwy({ typ: 'pakiet', pakiet: P('a1') }, 'Pinterest - Piny EduBox');
  assert.ok(/NIE wpisuj żadnego adresu URL/.test(p.system));
  assert.ok(/Nie wymyślaj zawartości/.test(p.system));
  assert.ok(/pin_title/.test(p.system) && /keywords/.test(p.system));
  assert.ok(/kup teraz/.test(p.system), 'kawa jako dziękuję');
  assert.ok(p.prompt.includes('Dzień Czystych Rąk') && p.prompt.includes('PDF: 34 stron') && p.prompt.includes('przedszkole'));
  const s = E.promptEwy({ typ: 'swieto', swieto: { name: 'Dzień Dyni', desc: 'dynia i jesienne zbiory, nie Halloween' }, month: 10, data: new Date(2026, 9, 31), dniDo: 3, pakiety: [P('c3')] }, 'Facebook - Grupy dla Nauczycieli');
  assert.ok(s.prompt.includes('sobota, 31 października (za 3 dni)'), s.prompt);
  assert.ok(s.prompt.includes('nie Halloween') && s.prompt.includes('Dzień Dyni – klasy 1-3'));
  assert.ok(/Nie podawaj historii/.test(s.prompt));
  const w = E.promptEwy({ typ: 'temat', temat: 'wywiadówki', apps: APPS }, 'Facebook - Grupy dla Nauczycieli');
  assert.ok(w.prompt.includes('edudialog.html | EduDialog'));
});

t('odpowiedź: JSON z tekstem wokół, usunięte adresy, tylko narzędzia z listy', () => {
  const r = E.parsujOdpowiedz('Proszę:\n```json\n{"post_text":"Hej! Zajrzyj na https://eduboxpro.pl/edudialog.html 👇\\nPa","image_prompt":"Ewa at desk","titles":["a","b","c","d"],"apps":["edudialog.html","https://eduboxpro.pl/eduocena.html","zmyslone.html","edudialog.html"]}\n```', APPS);
  assert.ok(!/https?:|eduboxpro\.pl/.test(r.post), r.post);
  assert.strictEqual(r.titles.length, 3);
  same(r.apps.map((a) => a.url), ['edudialog.html', 'eduocena.html']);
  same(E.linkiPosta({ typ: 'temat' }, r).map((l) => l.url), ['https://eduboxpro.pl/edudialog.html', 'https://eduboxpro.pl/eduocena.html']);
});

t('plan tygodnia: święta z wyprzedzeniem, pakiet święta w poście o święcie, wypełnienie, bez powtórek', () => {
  const plan = E.planTygodnia(new Date(2026, 9, 26), { pakiety: PAKIETY, apps: APPS });
  assert.strictEqual(plan.length, 7);
  const dynia = plan.find((x) => x.typ === 'swieto' && x.swieto.name === 'Dzień Dyni');
  assert.ok(dynia, 'Dzień Dyni w planie');
  assert.strictEqual(dynia.data.getDate(), 28, '3 dni przed 31.10');
  same(dynia.pakiety.map((p) => p.id), ['c3']);
  assert.ok(!plan.some((x) => x.typ === 'pakiet' && x.pakiet.id === 'c3'), 'pakiet z Dnia Dyni nie dubluje się');
  assert.ok(plan.every((x, i) => i === 0 || plan[i - 1].data < x.data));
  assert.ok(plan.some((x) => x.typ === 'pakiet') && plan.some((x) => x.typ === 'narzedzie'));
  plan.filter((x) => x.typ === 'swieto').forEach((x) => assert.ok(x.dniDo >= 0, 'post przed świętem, nie po'));
  const ids = plan.filter((x) => x.typ === 'pakiet').map((x) => x.pakiet.id);
  assert.strictEqual(new Set(ids).size, ids.length, 'pakiet najwyżej raz w planie');
  const bezNiczego = E.planTygodnia(new Date(2026, 6, 6), { pakiety: [], apps: APPS });
  assert.strictEqual(bezNiczego.length, 7, 'wakacje: same narzędzia');
});

t('strona ładuje wspólne pliki i nie wstawia adresów od AI', () => {
  const h = fs.readFileSync(path.join(root, 'ewamarketing.html'), 'utf8');
  ['kalendarz-dane.js', 'materialy-wspolne.js', 'ewa-tematy.js'].forEach((f) => assert.ok(h.includes(`src="/${f}"`), f));
  assert.ok(h.includes('const T = window.EwaTematy') && ['T.promptEwy', 'T.parsujOdpowiedz', 'T.planTygodnia', 'T.linkiPosta'].every((x) => h.includes(x)));
  assert.ok(!/new Function\s*\(|[^.\w]eval\s*\(/.test(h));
});

console.log(`[Ewa] ${ok} OK`);

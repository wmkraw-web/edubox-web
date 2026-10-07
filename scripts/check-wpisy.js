// Testy EduWpisów (blok WPISY_PROMPTS w eduwpisy.html – czysty JS, uruchamiany w vm).
// Pilnują: temat zajęć to dokument (t.j. Dz.U. 2024 poz. 50 – wpis potwierdza zajęcia, rodzice mają wgląd), bez
// zmyśleń, diagnoz i nazw terapii; nazwy edukacji według podstawy obowiązującej w danej klasie i roku szkolnym.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'eduwpisy.html'), 'utf8').replace(/\r\n/g, '\n');
const start = html.indexOf('// ===== WPISY_PROMPTS_START');
const end = html.indexOf('// ===== WPISY_PROMPTS_END');
if (start < 0 || end < 0) { console.error('[EduWpisy] Brak bloku WPISY_PROMPTS w eduwpisy.html'); process.exit(1); }
const code = html.slice(start, end);

function load(today) {
  const RealDate = Date;
  class FakeDate extends RealDate { constructor(...a) { super(...(a.length ? a : [today])); } static now() { return new RealDate(today).getTime(); } }
  const ctx = { Date: FakeDate };
  vm.createContext(ctx);
  vm.runInContext(code + '\nthis.api = { buildWpisyPrompts, parseWpisy, wpisyVariants, isNewCurriculum, ADAPTATIONS, STAGES };', ctx);
  return ctx.api;
}
let ok = 0, fail = 0;
function check(name, cond) {
  if (cond) { ok++; console.log('✅ ' + name); } else { fail++; console.log('❌ ' + name); }
}

const api = load('2026-10-07T12:00:00');
const p = { stage: 'Klasa 2', topic: 'Znaki drogowe', activities: 'spacer', adaptations: [] };
const sys = api.buildWpisyPrompts(p).system;

// 1. Przepisy i zasady
check('instrukcje: t.j. Dz.U. 2024 poz. 50, § 21 ust. 5 (wpis = potwierdzenie zajęć) i § 21 ust. 3 pkt 5 (wgląd rodziców)', ['Dz.U. 2024 poz. 50', '§ 21 ust. 5', '§ 21 ust. 3 pkt 5'].every(x => sys.includes(x)));
check('zasady: bez dopisywania aktywności, bez nazw terapii, bez imion i diagnoz', sys.includes('Nie dopisuj aktywności') && sys.includes('integracja sensoryczna') && sys.includes('diagnoz') && sys.includes('rodzice wszystkich uczniów'));
check('zasady: bez komentarzy o brakujących danych, bez numerów punktów podstawy', sys.includes('komentarzy o brakujących danych') && sys.includes('Nie podawaj numerów punktów'));
check('lista dostosowań to formy pracy, nie diagnozy', !api.ADAPTATIONS.some(a => /spektrum|autyz|asperger|adhd|\bSI\b|niedosłuch|niedowid|zaburzen/i.test(a)));

// 2. Podstawa programowa według klasy i roku szkolnego
check('2026/2027: klasa 1 – nowa podstawa, klasa 2 – z 2017 r.', api.isNewCurriculum('Klasa 1') && !api.isNewCurriculum('Klasa 2'));
check('klasa 1: nazwy edukacji z Dz.U. 2026 poz. 378, ruch drogowy – edukacja techniczna i informatyczna', api.buildWpisyPrompts({ ...p, stage: 'Klasa 1' }).system.includes('Dz.U. 2026 poz. 378') && api.buildWpisyPrompts({ ...p, stage: 'Klasa 1' }).system.includes('do edukacji technicznej i informatycznej'));
check('klasa 2: podstawa z 2017 r., znaki drogowe – edukacja przyrodnicza', sys.includes('z 2017 r.') && sys.includes('do edukacji przyrodniczej'));
check('2027/2028: klasa 2 – już nowa podstawa', load('2027-10-01T12:00:00').isNewCurriculum('Klasa 2'));
check('przedszkole: 9 obszarów nowej podstawy', ['społeczny', 'osobisty', 'językowy', 'matematyczny', 'przyrodniczy', 'techniczny', 'cyfrowy', 'artystyczny', 'ruchowy'].every(o => api.buildWpisyPrompts({ ...p, stage: 'Przedszkole (Młodsze)' }).system.includes(o)));
check('stary etap „Edukacja Wczesnoszkolna (1-3)” z Biblioteki nadal działa', api.buildWpisyPrompts({ ...p, stage: 'Edukacja Wczesnoszkolna (1-3)' }).system.includes('Nazwy edukacji w klasach I–III'));

// 3. Warianty
check('klasy 4–8: temat lekcji i temat w formie pytania', api.wpisyVariants({ ...p, stage: 'Klasy 4-8' }).map(v => v[0]).join(',') === 'TEMAT,PYTANIE,Z CELEM,OPIS,DLA RODZICÓW');
check('wariant z dostosowaniami tylko, gdy je zaznaczono', !api.wpisyVariants(p).some(v => v[0] === 'DOSTOSOWANIA') && api.wpisyVariants({ ...p, adaptations: ['Pokaz'] }).some(v => v[0] === 'DOSTOSOWANIA'));

// 4. Odczyt odpowiedzi
const parsed = api.parseWpisy(`=== ZWIEZLY ===
Znaki drogowe
=== Z CELEM ===
**Znaki drogowe** – poznanie znaczenia znaków.
=== OPIS ===
Dzieci rozpoznawały znaki
podczas spaceru.
=== Z OBSZAREM ===
Edukacja przyrodnicza: Znaki drogowe
=== DLA RODZICOW ===
Dzieci poznawały znaki bez अनुमति.`, p);
check('sekcje bez polskich znaków w nagłówkach, kolejność i tytuły kart', parsed.length === 5 && parsed[0].title === 'Zwięzły temat' && parsed[3].title === 'Z nazwą edukacji');
check('bez markdown, jedna linia, obce pismo → [uzupełnij]', parsed[1].text === 'Znaki drogowe – poznanie znaczenia znaków.' && parsed[2].text === 'Dzieci rozpoznawały znaki podczas spaceru.' && parsed[4].text.includes('[uzupełnij: słowo]'));
check('pusta odpowiedź → brak wariantów', api.parseWpisy('', p).length === 0);

console.log(`\n[EduWpisy] ${ok} OK, ${fail} błędów`);
if (fail) process.exit(1);

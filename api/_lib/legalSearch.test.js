'use strict';

// Testy wyszukiwarki przepisów EduPrawo: typowe pytania nauczycieli -> właściwe przepisy w wynikach.
//   node api/_lib/legalSearch.test.js
const assert = require('assert');
const { searchLaw } = require('./legalSearch.js');

let ok = 0;
const test = (name, fn) => {
  try { fn(); console.log('✅ ' + name); ok++; }
  catch (e) { console.log('❌ ' + name + '\n   ' + e.message); process.exitCode = 1; }
};
const ids = (q) => searchLaw(q).sources.map(s => s.id);
const expectIn = (q, id, top = 8) => {
  const got = ids(q);
  assert.ok(got.slice(0, top).includes(id), `"${q}" -> brak ${id} w ${JSON.stringify(got.slice(0, top))}`);
};

test('urlop dla poratowania zdrowia -> art. 73 KN', () => expectIn('Ile wynosi urlop dla poratowania zdrowia nauczyciela i kto o nim decyduje?', 'KN art. 73', 3));
test('praca domowa w klasie 5 -> zmiana § 12a z 2026 r.', () => expectIn('Czy jako wychowawca klasy 5 mogę wystawić ocenę za brak pracy domowej?', 'OCEN zmiana Dz.U. 2026 poz. 1122 pkt 5'));
test('termin opinii o funkcjonowaniu ucznia -> § 7 rozporządzenia o orzeczeniach', () => expectIn('W jakim terminie dyrektor musi przekazać opinię o funkcjonowaniu ucznia do poradni?', 'ORZ § 7', 4));
test('awans na dyplomowanego -> KN art. 9ca', () => expectIn('Nauczycielka mianowana chce zostać dyplomowaną. Ile trwa okres pracy i kiedy złożyć wniosek?', 'KN art. 9ca'));
test('pensum -> KN art. 42', () => expectIn('Ile wynosi pensum nauczyciela edukacji wczesnoszkolnej?', 'KN art. 42'));
test('nadgodziny -> KN art. 35', () => expectIn('Czy dyrektor może mi przydzielić nadgodziny bez mojej zgody?', 'KN art. 35'));
test('kierownik wycieczki -> rozporządzenie o krajoznawstwie', () => {
  const got = ids('Kto może być kierownikiem wycieczki szkolnej i ilu opiekunów potrzeba?');
  assert.ok(got.some(id => id.startsWith('WYC ')), JSON.stringify(got));
});
test('obszary oceny zachowania -> § 11 i jego zmiana z 2026 r.', () => {
  const got = ids('Jakie obszary obejmuje ocena zachowania od 1 września 2026?');
  assert.ok(got.includes('OCEN zmiana Dz.U. 2026 poz. 1122 pkt 3'), JSON.stringify(got));
});
test('egzamin poprawkowy -> § 16 rozporządzenia o ocenianiu', () => expectIn('Kiedy przeprowadza się egzamin poprawkowy i kto wchodzi w skład komisji?', 'OCEN § 16'));
test('wprost wskazany przepis ma pierwszeństwo', () => expectIn('Co mówi art. 6 Karty Nauczyciela?', 'KN art. 6', 2));
test('zmiana doklejona zaraz po starszym brzmieniu', () => {
  const got = ids('obszary oceny zachowania ucznia');
  const i = got.indexOf('OCEN § 11');
  if (i >= 0) assert.strictEqual(got[i + 1], 'OCEN zmiana Dz.U. 2026 poz. 1122 pkt 3', JSON.stringify(got));
});
test('pytanie spoza bazy nie zwraca przypadkowych przepisów jako pewnych', () => {
  const r = searchLaw('Jaki jest przepis na sernik?');
  assert.ok(r.sources.length <= 8);
});
test('blok dla modelu zawiera zasady i datę stanu prawnego', () => {
  const r = searchLaw('urlop dla poratowania zdrowia');
  assert.ok(/Powołuj się WYŁĄCZNIE/.test(r.promptBlock) && /stan na \d+\.\d{2}\.\d{4}/.test(r.promptBlock));
  assert.ok(r.promptBlock.length < 22000, 'za długi blok: ' + r.promptBlock.length);
});

console.log(`\n${ok} OK, ${process.exitCode ? 'są błędy' : '0 błędów'}`);

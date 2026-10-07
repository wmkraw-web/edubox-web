// Testy instrukcji EduOceny (blok OCENA_PROMPTS w eduocena.html – czysty JS, uruchamiany w vm).
// Pilnują: imię nie trafia do AI, właściwa podstawa programowa w danym roku szkolnym, przepisy w instrukcjach.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'eduocena.html'), 'utf8').replace(/\r\n/g, '\n');
const start = html.indexOf('// ===== OCENA_PROMPTS_START');
const end = html.indexOf('// ===== OCENA_PROMPTS_END');
if (start < 0 || end < 0) { console.error('[EduOcena] Brak bloku OCENA_PROMPTS w eduocena.html'); process.exit(1); }
const code = html.slice(start, end);

// Ładuje blok z „dzisiejszą” datą ustawioną na podany dzień (rok szkolny liczony z daty).
function load(today) {
  const RealDate = Date;
  class FakeDate extends RealDate { constructor(...a) { super(...(a.length ? a : [today])); } static now() { return new RealDate(today).getTime(); } }
  const ctx = { Date: FakeDate };
  vm.createContext(ctx);
  vm.runInContext(code + '\nthis.api = { buildOcenaPrompts, cleanOcenaText, withStudentName, scrubName, ocenaDocTitle, areasFor, isNewCurriculum, SCHOOL_YEAR, DEFAULT_PERIOD, AREA_DEFAULTS };', ctx);
  return ctx.api;
}

let ok = 0, fail = 0;
function check(name, cond) {
  if (cond) { ok++; console.log('✅ ' + name); } else { fail++; console.log('❌ ' + name); }
}

const api = load('2026-10-07T12:00:00');
const base = { ...api.AREA_DEFAULTS, kind: 'nauka', period: 'roczna', length: 'srednia', studentName: '', gender: 'Dziewczynka', classLevel: 'Klasa 2', notes: '', special: false };

// 1. Imię zostaje w przeglądarce
const named = { ...base, studentName: 'Kasia Nowak', notes: 'Kasia pięknie rysuje. Kasi pomaga praca w parze, a Kasię cieszą konkursy. Nowak – bez nazwiska.' };
const scrubbed = { ...named, notes: api.scrubName(named.notes, named.studentName) };
const pNamed = api.buildOcenaPrompts(scrubbed);
check('imię i nazwisko (także odmienione) nie trafiają do AI', !/Kas|Nowak/.test(pNamed.system + pNamed.prompt));
check('z imieniem: model wstawia [imię] w pierwszym zdaniu', pNamed.system.includes('[imię] w pierwszym zdaniu'));
check('imię wpisane małą literą też jest usuwane, zwykłe słowa zostają', api.scrubName('Ola ma olej i Olę.', 'ola') === '[imię] ma olej i [imię].');
check('bez imienia: model nie używa tokenu', api.buildOcenaPrompts(base).system.includes('Nie używaj imienia'));
check('[imię] → imię wpisane lokalnie', api.withStudentName('[imię] czyta. Potem [imię] pisze.', { ...base, studentName: 'Ola' }) === 'Ola czyta. Potem Ola pisze.');
check('[imię] bez imienia → Uczennica / uczennica', api.withStudentName('[imię] czyta, a [imię] pisze.', base) === 'Uczennica czyta, a uczennica pisze.');

// 2. Podstawa programowa według roku szkolnego (§ 4 Dz.U. 2026 poz. 378)
check('2026/2027: klasa 1 – nowa podstawa, klasy 2–3 – z 2017 r.', api.isNewCurriculum('Klasa 1') && !api.isNewCurriculum('Klasa 2') && !api.isNewCurriculum('Klasa 3'));
const next = load('2027-10-01T12:00:00');
check('2027/2028: klasy 1–2 – nowa podstawa, klasa 3 – z 2017 r.', next.isNewCurriculum('Klasa 2') && !next.isNewCurriculum('Klasa 3') && next.SCHOOL_YEAR === '2027/2028');
check('styczeń 2027 to nadal rok 2026/2027', load('2027-01-15T12:00:00').SCHOOL_YEAR === '2026/2027');
check('domyślny okres: październik → śródroczna, maj → roczna', api.DEFAULT_PERIOD === 'srodroczna' && load('2027-05-10T12:00:00').DEFAULT_PERIOD === 'roczna');
check('klasa 1: edukacja językowa i doświadczenia edukacyjne', api.areasFor({ ...base, classLevel: 'Klasa 1' }).some(a => a.key === 'experiences')
  && api.buildOcenaPrompts({ ...base, classLevel: 'Klasa 1' }).prompt.includes('edukacja językowa (polonistyczna)'));
check('klasa 2: bez doświadczeń edukacyjnych, nazwy ze starej podstawy', !api.areasFor(base).some(a => a.key === 'experiences')
  && api.buildOcenaPrompts(base).prompt.includes('edukacja polonistyczna') && api.buildOcenaPrompts(base).system.includes('podstawę programową z 2017 r.'));

// 3. Przepisy w instrukcjach
const yearly1 = api.buildOcenaPrompts({ ...base, classLevel: 'Klasa 1', experiences: 'Angażuje się aktywnie, często z własną inicjatywą' });
check('ocena z zajęć: art. 44i UoSO i § 8 (potrzeby rozwojowe i edukacyjne)', yearly1.system.includes('art. 44i ust. 1 pkt 2') && yearly1.system.includes('§ 8') && yearly1.system.includes('potrzeby rozwojowe i edukacyjne'));
check('klasa 1, ocena roczna: § 9 ust. 3 (doświadczenia edukacyjne)', yearly1.system.includes('§ 9 ust. 3'));
check('ocena śródroczna: bez § 9 ust. 3', !api.buildOcenaPrompts({ ...base, classLevel: 'Klasa 1', period: 'srodroczna', experiences: 'x' }).system.includes('§ 9 ust. 3'));
const beh = api.buildOcenaPrompts({ ...base, kind: 'zachowanie', special: true });
check('zachowanie: 9 obszarów z § 11 ust. 1 (Dz.U. 2026 poz. 1122)', beh.system.includes('§ 11 ust. 1') && beh.system.includes('Dz.U. 2026 poz. 1122') && beh.system.includes('wspólnoty lokalnej'));
check('zachowanie z orzeczeniem/opinią: § 11 ust. 3 bez wspominania dokumentu', beh.system.includes('§ 11 ust. 3') && beh.system.includes('NIE wspominaj o orzeczeniu'));
const pre = api.buildOcenaPrompts({ ...base, classLevel: 'Przedszkole', kind: 'zachowanie' });
check('przedszkole: informacja o rozwoju, nie ocena (także po wybraniu „zachowanie”)', pre.system.includes('nie wystawia się ocen') && api.ocenaDocTitle({ ...base, classLevel: 'Przedszkole', kind: 'zachowanie' }) === 'Informacja o rozwoju dziecka');
check('zasada: bez dopisywania faktów spoza danych', base && api.buildOcenaPrompts(base).system.includes('nie dodawaj nowych faktów'));

// 4. Porządkowanie odpowiedzi
check('usuwa tytuł i markdown z odpowiedzi', api.cleanOcenaText('**Roczna ocena opisowa**\n\nUczeń **czyta**.\n\n\n\nLiczy.', 'Roczna ocena opisowa') === 'Uczeń czyta.\n\nLiczy.');
check('tytuły dokumentów', api.ocenaDocTitle(base) === 'Roczna ocena opisowa' && api.ocenaDocTitle({ ...base, kind: 'zachowanie', period: 'srodroczna' }) === 'Śródroczna ocena zachowania');

console.log(`\n[EduOcena] ${ok} OK, ${fail} błędów`);
if (fail) process.exit(1);

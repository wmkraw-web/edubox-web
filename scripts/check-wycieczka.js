// Testy EduWycieczki (blok WYCIECZKA_PROMPTS w eduwycieczka.html – czysty JS, uruchamiany w vm).
// Pilnują: karta wycieczki zgodna ze wzorem z załącznika do rozporządzenia (Dz.U. 2018 poz. 1055),
// telefon kierownika nie trafia do AI, odpowiedź w sekcjach daje się odczytać, obce pismo jest wyłapywane.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'eduwycieczka.html'), 'utf8').replace(/\r\n/g, '\n');
const start = html.indexOf('// ===== WYCIECZKA_PROMPTS_START');
const end = html.indexOf('// ===== WYCIECZKA_PROMPTS_END');
if (start < 0 || end < 0) { console.error('[EduWycieczka] Brak bloku WYCIECZKA_PROMPTS w eduwycieczka.html'); process.exit(1); }
const ctx = {};
vm.createContext(ctx);
vm.runInContext(html.slice(start, end) + '\nthis.api = { buildTripDocsPrompts, buildTripGamePrompts, parseTripDocs, parseTripGame, withPhone, kartaHtml, regulaminHtml, gameHtml, DEFAULT_RULES };', ctx);
const api = ctx.api;

let ok = 0, fail = 0;
function check(name, cond) {
  if (cond) { ok++; console.log('✅ ' + name); } else { fail++; console.log('❌ ' + name); }
}

const trip = { dest: 'Muzeum Narodowe w Krakowie', cls: '4a', date: '2026-10-20', dateEnd: '', timeStart: '08:00', timeEnd: '14:00', studentsCount: 24, tripType: 'przedmiotowa', transport: 'Autokar', meetingPoint: 'przed szkołą', guardians: 2, disabled: 1, aim: '', deadline: '2026-10-13', leaderPhone: '600 123 456', bring: ['Wygodne buty'], abroad: false, school: 'SP 1, ul. Szkolna 1', costPerStudent: '38.00' };

// 1. Przepisy i prywatność w instrukcjach
const d = api.buildTripDocsPrompts(trip);
const g = api.buildTripGamePrompts(trip);
check('telefon kierownika nie trafia do AI (token w przeglądarce)', !(d.system + d.prompt + g.system + g.prompt).includes('600 123') && d.prompt.includes('[telefon kierownika]'));
check('instrukcje: Dz.U. 2018 poz. 1055, § 5, § 8 (zgoda na piśmie), § 10 (program i regulamin)', ['Dz.U. 2018 poz. 1055', '§ 5', '§ 8', '§ 10', 'formie pisemnej'].every(x => d.system.includes(x)));
check('instrukcje: zakaz wymyślania cen, godzin, odległości i telefonów', d.system.includes('Nie wymyślaj cen, godzin otwarcia') && d.system.includes('[uzupełnij'));
check('wycieczka kilkudniowa: nagłówki dni i data powrotu', api.buildTripDocsPrompts({ ...trip, dateEnd: '2026-10-21' }).system.includes('Dzień 1') && api.buildTripDocsPrompts({ ...trip, dateEnd: '2026-10-21' }).prompt.includes('powrót: 21.10.2026'));
check('gra: zadania bez wymyślonych faktów, w zasięgu wzroku opiekuna', g.system.includes('Nie wymyślaj nazw eksponatów') && g.system.includes('w zasięgu wzroku opiekuna'));

// 2. Odczyt odpowiedzi w sekcjach
const sample = `=== CEL ===
Uczniowie poznają muzeum.
=== WIADOMOSC ===
Szanowni Państwo,

klasa 4a jedzie do muzeum. **Koszt** 38 zł.

Kontakt z kierownikiem wycieczki: [telefon kierownika]
=== PROGRAM ===
Dzień 1
7:45 | Zbiórka przed szkołą
- [uzupełnij] | Zwiedzanie (do potwierdzenia)
=== REGULAMIN ===
1. Trzymam się grupy.
2) Nie dotykam eksponatów bez अनुमति opiekuna.`;
const docs = api.parseTripDocs(sample);
check('sekcje także bez polskich znaków w nagłówku', docs.goal === 'Uczniowie poznają muzeum.' && docs.message.startsWith('Szanowni Państwo'));
check('wiadomość bez markdown, akapity zachowane', !docs.message.includes('**') && docs.message.includes('\n\n'));
check('program: dzień jako nagłówek, godzina | czynność', docs.program.length === 3 && docs.program[0].day && docs.program[1].time === '7:45' && docs.program[2].time === '[uzupełnij]');
check('regulamin: numeracja usunięta, obce pismo → [uzupełnij]', docs.rules.length === 2 && docs.rules[0] === 'Trzymam się grupy.' && docs.rules[1].includes('[uzupełnij: słowo]') && !/[ऀ-ॿ]/.test(docs.rules[1]));
check('telefon wstawiany lokalnie', api.withPhone(docs.message, '600 123 456').includes('Kontakt z kierownikiem wycieczki: 600 123 456') && api.withPhone('[telefon kierownika]', '') === '[uzupełnij: telefon kierownika]');

const game = api.parseTripGame(`=== TYTUŁ ===
Muzealni tropiciele
=== WSTĘP ===
Pracujcie w parach.
=== ZADANIA ===
1. [rysunek] Detale – Narysujcie szczegół.
2. [krótko] Kolory – Policzcie kolory
w jednej sali.
3. Podobieństwa – Porównajcie dwa obrazy.
=== DLA NAUCZYCIELA ===
30 minut.`);
check('gra: tytuł, zadania z rodzajem odpowiedzi i kontynuacją linii', game && game.title === 'Muzealni tropiciele' && game.tasks.length === 3 && game.tasks[0].answer === 'drawing' && game.tasks[1].answer === 'short' && game.tasks[1].task.endsWith('w jednej sali.') && game.tasks[2].answer === 'lines' && game.teacherNote === '30 minut.');
check('gra: bez zadań → brak karty', api.parseTripGame('=== TYTUŁ ===\nX') === null);

// 3. Karta wycieczki = wzór z załącznika do rozporządzenia
const karta = api.kartaHtml(trip, docs);
const FIELDS = ['Nazwa i adres szkoły', 'Cel wycieczki', 'trasa wycieczki', 'Termin', 'Numer telefonu kierownika wycieczki', 'Liczba uczniów', 'w tym uczniów niepełnosprawnych', 'Klasa', 'Liczba opiekunów wycieczki', 'Środek transportu',
  'Program wycieczki', 'Data, godzina wyjazdu oraz powrotu', 'Długość trasy (w kilometrach)', 'Miejscowość docelowa i trasa powrotna', 'Szczegółowy program wycieczki od wyjazdu do powrotu', 'Adres miejsca noclegowego i żywieniowego oraz przystanki i miejsca żywienia',
  'Zobowiązuję się do przestrzegania przepisów dotyczących bezpieczeństwa w czasie wycieczki.', 'Kierownik wycieczki', 'Opiekunowie wycieczki', 'ZATWIERDZAM', 'data i podpis dyrektora szkoły'];
const missing = FIELDS.filter(f => !karta.includes(f));
check('karta: wszystkie pola wzoru' + (missing.length ? ' (brak: ' + missing.join(', ') + ')' : ''), !missing.length);
check('karta: lista uczniów (§ 6 ust. 3) – tyle wierszy, ilu uczniów, z telefonem rodzica', (karta.match(/<tr><td>\d+\.<\/td>/g) || []).length === 24 && karta.includes('Telefon rodzica'));
check('karta: za granicą – nazwa kraju', api.kartaHtml({ ...trip, abroad: true }, docs).includes('Nazwa kraju'));
check('karta: znaki specjalne z formularza są bezpieczne', !api.kartaHtml({ ...trip, dest: '<img src=x onerror=alert(1)>' }, null).includes('<img'));
check('karta bez AI: żółte pola do uzupełnienia', api.kartaHtml({ ...trip, school: '' }, null).includes('<mark>[uzupełnij: nazwa i adres szkoły]</mark>'));

// 4. Regulamin
check('regulamin zapasowy, gdy AI nie odpowie', api.regulaminHtml(trip, null).includes(api.DEFAULT_RULES[0]) && api.regulaminHtml(trip, null).includes('§ 10'));
check('karta gry: ramka na rysunek i linie na odpowiedź', api.gameHtml(trip, game).includes('dashed') && api.gameHtml(trip, game).includes('border-bottom'));

console.log(`\n[EduWycieczka] ${ok} OK, ${fail} błędów`);
if (fail) process.exit(1);

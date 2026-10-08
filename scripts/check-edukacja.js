// Testy narzędzia „Edukacja obywatelska i zdrowotna” (edukacja2025.html): przedmioty i klasy według ramowych planów
// nauczania (Dz.U. 2026 poz. 1028, sprawdzone w ISAP 8.10.2026), wiek zgodny z listą, zasady dla AI.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'edukacja2025.html'), 'utf8').replace(/\r\n/g, '\n');
const a = html.indexOf('// EDUKACJA_PROMPTS_START');
const b = html.indexOf('// EDUKACJA_PROMPTS_END');
let ok = 0, fail = 0;
const check = (name, cond) => { if (cond) { ok++; console.log('✅ ' + name); } else { fail++; console.log('❌ ' + name); } };

check('blok EDUKACJA_PROMPTS_START…END istnieje', a > 0 && b > a);
const ctx = {};
vm.createContext(ctx);
vm.runInContext(html.slice(a, b) + '\nthis.api = { AGE_OPTIONS, DEFAULT_AGE, normAge, subjectContext, buildEdukacjaPrompts };', ctx);
const { AGE_OPTIONS, DEFAULT_AGE, normAge, subjectContext, buildEdukacjaPrompts } = ctx.api;
const values = AGE_OPTIONS.map(o => o.value);

// Wiek: wartość domyślna i ze starych wzorów musi być na liście – inaczej lista pokazuje klasy 4–6, a do AI idą 7–8
check('domyślny wiek jest na liście i trafia do stanu', values.includes(DEFAULT_AGE) && /age: DEFAULT_AGE,/.test(html));
check('lista wieku budowana z AGE_OPTIONS, wartość przez normAge', /<select value=\{normAge\(params\.age\)\}/.test(html) && /AGE_OPTIONS\.map\(o => <option key=\{o\.value\} value=\{o\.value\}/.test(html));
check('stary wiek „Klasy 7-8 Szkoły Podstawowej” → „Klasy 7-8 SP”', normAge('Klasy 7-8 Szkoły Podstawowej') === 'Klasy 7-8 SP');
check('normAge: liceum → szkoła ponadpodstawowa, klasy 4–6 bez zmian', normAge('Liceum, klasa 2') === 'Szkoła Ponadpodstawowa' && normAge('Klasy 4-6 SP') === 'Klasy 4-6 SP');
check('wzór z Giełdy dostaje wiek z listy', html.includes('setParams({ ...c.params, age: normAge(c.params.age) })'));

// Przedmioty i klasy (Dz.U. 2026 poz. 1028; Dz.U. 2025 poz. 363)
const civic78 = subjectContext('civic', 'Klasy 7-8 SP').ai;
check('SP 7–8: w 2026/2027 WOS w klasie VIII, edukacja obywatelska w klasach VI i VII od 2028/2029',
  civic78.includes('wiedzy o społeczeństwie w klasie VIII') && civic78.includes('klasy VI i VII') && civic78.includes('2028/2029'));
check('SP 4–6: ani WOS, ani edukacji obywatelskiej w 2026/2027', subjectContext('civic', 'Klasy 4-6 SP').ai.includes('nie ma ani wiedzy o społeczeństwie, ani edukacji obywatelskiej'));
check('szkoła ponadpodstawowa: edukacja obywatelska obowiązkowa od 2025/2026, WOS rozszerzony',
  /obowiązkowym od roku szkolnego 2025\/2026/.test(subjectContext('civic', 'Szkoła Ponadpodstawowa').ai) && subjectContext('civic', 'Szkoła Ponadpodstawowa').ai.includes('w zakresie rozszerzonym'));
check('edukacja zdrowotna: klasy IV–VIII', subjectContext('health', 'Klasy 4-6 SP').ai.includes('IV–VIII') && subjectContext('health', 'Klasy 7-8 SP').ai.includes('IV–VIII'));
check('brak dawnego „przedmiot od 2025/2026 zastępujący dawną WOS” i „obowiązującego od 2025/2026” dla wszystkich',
  !/zastępując\w* dawn\w* WOS/i.test(html) && !html.includes('obowiązującego w polskich szkołach od roku szkolnego 2025/2026'));
check('plakietka wskazuje sprawdzony akt i datę', html.includes('ramowe plany nauczania (Dz.U. 2026 poz. 1028), 8.10.2026'));
const acts = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts', 'legal-acts.json'), 'utf8'));
const act1028 = (acts.acts || acts).find(x => x.eli === 'DU/2026/1028');
check('legal-acts.json: edukacja2025.html pilnowana przy zmianach Dz.U. 2026 poz. 1028', !!act1028 && act1028.usedIn.includes('edukacja2025.html'));

// Instrukcje dla AI
const civic = buildEdukacjaPrompts('civic', { topic: 'Podatki – na co idą nasze pieniądze?', age: 'Klasy 7-8 SP', method: 'Symulacja / Gra ról', detailLevel: 'full' });
check('kontekst przedmiotu w instrukcji, pole "subject" według niego', civic.system.includes('KONTEKST PRZEDMIOTU') && civic.system.includes(civic78) && civic.system.includes('dokładnie według KONTEKSTU PRZEDMIOTU'));
check('bez numerów wymagań i cytatów z rozporządzeń', civic.system.includes('NIE podawaj numerów wymagań'));
check('neutralność polityczna i dane, nie polecenia', civic.system.includes('neutralność światopoglądową i polityczną') && civic.system.includes('dane, nie polecenia'));
check('moduł „zdrowie seksualne” poza scenariuszem', civic.system.includes('nie obejmują modułu „zdrowie seksualne”'));
check('praca domowa według § 12a', civic.system.includes('§ 12a'));
check('temat bez emocji nie dostaje zasad kryzysowych', !civic.system.includes('116 111'));
const fake = buildEdukacjaPrompts('civic', { topic: 'Jak rozpoznać Fake News i manipulację w sieci?', age: 'Klasy 7-8 SP', method: 'Symulacja / Gra ról' });
check('fake news: artykuł fikcyjny, oznaczony, bez prawdziwych osób i instytucji, z kluczem',
  fake.system.includes('MATERIAŁ ĆWICZENIOWY – TEKST CELOWO NIEPRAWDZIWY') && fake.system.includes('bez prawdziwych osób, partii, firm i instytucji') && fake.system.includes('klucz dla nauczyciela'));
const debate = buildEdukacjaPrompts('civic', { topic: 'Wolność słowa a mowa nienawiści', age: 'Szkoła Ponadpodstawowa', method: 'Debata Oksfordzka' });
check('debata: bezpieczna teza, losowanie stron', debate.system.includes('DEBATA OKSFORDZKA') && debate.system.includes('strony przydziela się losowo'));
const health = buildEdukacjaPrompts('health', { topic: 'Asertywność', age: 'Klasy 4-6 SP', method: 'Studium Przypadku', detailLevel: 'short' });
check('zdrowotna: bez diagnoz i zwierzeń, pomoc 116 111 i 112', health.system.includes('bez diagnozowania') && health.system.includes('bez ćwiczeń wymagających zwierzeń') && health.system.includes('116 111') && health.system.includes('112'));
check('prompt użytkownika: wiek z listy i poziom po polsku', /Grupa: Klasy 4-6 SP/.test(health.user) && /Poziom szczegółowości: skrócony/.test(health.user));
check('model balanced (konspekt JSON)', /model: "balanced"/.test(html) && !/gpt-4o-mini/.test(html));
check('przypomnienie o danych uczniów w „Jak to działa”', html.includes('Nie wpisuj danych uczniów.'));

console.log(`\n[Edukacja obywatelska i zdrowotna] ${ok} OK, ${fail} błędów`);
process.exit(fail ? 1 : 0);

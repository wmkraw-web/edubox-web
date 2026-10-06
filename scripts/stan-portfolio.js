'use strict';

// Spis stanu portfolio: co w którym narzędziu jest już zrobione, a co zostało.
// Czyta FAKTYCZNE pliki (nie notatki), więc nie może się rozjechać z rzeczywistością.
//   node scripts/stan-portfolio.js            -> zapisuje docs/STAN-PORTFOLIO.md
//   node scripts/stan-portfolio.js --check    -> tylko sprawdza, czy plik jest aktualny (CI)
//
// Po co: sesje Claude Code startują od zera i pamiętają tylko repo + CLAUDE.md. Ten plik
// jest odpowiedzią na pytanie „co jest już zrobione?" bez zgadywania i bez liczenia na pamięć.

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const OUT = path.join(root, 'docs', 'STAN-PORTFOLIO.md');
const checkOnly = process.argv.includes('--check');

const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'apps.js'), 'utf8'), sandbox, { filename: 'apps.js' });
const data = sandbox.window.EduBoxData || {};
const apps = data.APPS || [];
const legal = JSON.parse(fs.readFileSync(path.join(root, 'scripts', 'legal-acts.json'), 'utf8'));
const trackedFiles = new Set(legal.acts.flatMap((a) => a.usedIn));

// Jeden kafelek może być głębokim linkiem (?mode=…) do tej samej strony - liczymy strony.
const pageOf = (url) => String(url).split('?')[0];
const pages = [...new Set(apps.map((a) => pageOf(a.url)))]
  .filter((u) => !/^https?:/i.test(u) && fs.existsSync(path.join(root, u)))
  .sort();

const CATEGORY_LABELS = {
  terapia: 'Terapia i SPE',
  biurokracja: 'Dokumenty i biurokracja',
  zajecia: 'Lekcje i zajęcia',
  grafika: 'Grafika i materiały'
};

// Wydruk: czerń wymuszona na potomkach kontenera wydruku, dowolnym selektorem.
const FORCES_BLACK = /\*\s*\{[^}]*color:\s*(?:#000|black)/i;

// Narzędzia, które drukują celowo w kolorze (girlandy, dekoracje, dyplomy z grafiką,
// medale i zaproszenia) - wymuszanie czerni zepsułoby ich sens.
const DECORATIVE = new Set([
  'magicletters.html', 'edudekorator.html', 'edugenerator.html', 'edumalarz.html',
  'edudyplomy.html', 'edugazetka.html', 'edustudio.html', 'magiccolor.html',
  'edupiktogram.html', 'edusymbol.html', 'eduplakat.html'
]);

// --- Cechy, które sprawdzamy w każdym pliku -------------------------------------------
// Każda ma krótką nazwę do tabeli i wyjaśnienie, dlaczego ma znaczenie.
const FEATURES = [
  {
    key: 'kartka',
    label: 'Kartka A4',
    why: 'wzorzec generatorów dokumentów: AI zwraca czysty HTML, podgląd jako kartka, edycja przed eksportem',
    test: (s) => /doc-paper/.test(s) && /streamChat/.test(s)
  },
  {
    key: 'strumien',
    label: 'Strumień',
    why: 'tekst pojawia się na bieżąco; bez tego nauczyciel czeka w ciszy nawet 100 s',
    test: (s) => /streamChat|stream:\s*true/.test(s)
  },
  {
    key: 'docx',
    label: 'Prawdziwy .docx',
    why: 'plik „.doc" z HTML-em w środku (mime application/msword) Word otwiera z ostrzeżeniem, a Dokumenty Google potrafią go odrzucić',
    test: (s) => /downloadDocx\(/.test(s),
    broken: (s) => /application\/msword/.test(s)
  },
  {
    key: 'wydruk',
    label: 'Czysty wydruk',
    why: 'printDoc albo reguła wymuszająca czerń w kontenerze wydruku. Środkowa kolumna = „zerknij”, NIE „zepsute”: strona bez takiej reguły bywa w porządku, gdy drukowaną treść renderuje ciemnym tekstem na białej kartce (np. edusprawdzian: `text-slate-900`). Tego nie da się rzetelnie wykryć z kodu – trzeba spojrzeć na podgląd wydruku.',
    // Czerń może być wymuszona dowolnym selektorem potomków (#print-container *, main *,
    // .a4-page *, .print-area *) - szukamy wzorca, nie jednej konkretnej reguły.
    test: (s) => /printDoc\(/.test(s) || FORCES_BLACK.test(s),
    broken: (s) => /window\.print\(\)/.test(s) && !/printDoc\(/.test(s) && !FORCES_BLACK.test(s),
    // Dekoratory drukują celowo w kolorze - czerń byłaby tam psuciem, nie naprawą.
    n_a: (s, file) => DECORATIVE.has(file)
  },
  {
    key: 'wyglad',
    label: 'Nowy wygląd',
    why: 'wspólna warstwa edubox-ui.css: spokojne powierzchnie z prawdziwym cieniem zamiast neonowych poświat i pływających bąbli z 2021. Neony wpisane w markup wygasza reguła [class*="shadow-[0_0_"] w tym pliku, więc podpięcie linku wystarcza – klas nie trzeba czyścić z markupu.',
    test: (s) => /<link[^>]+edubox-ui\.css/.test(s)
  },
  {
    key: 'jaktodziala',
    label: '„Jak to działa"',
    why: 'info-box blisko góry formularza - konwencja z CLAUDE.md',
    test: (s) => /Jak to działa/.test(s)
  },
  {
    key: 'limit',
    label: 'Wspólna pula',
    why: 'EduBoxCore.executeWithLimitCheck zamiast własnego licznika per-aplikacja',
    test: (s) => /executeWithLimitCheck|executeImageLimitCheck|freeForever/.test(s),
    n_a: (s) => !/\/api\/(chat|generate|malarz|ewa-generate)/.test(s)
  }
];

const rows = pages.map((page) => {
  const src = fs.readFileSync(path.join(root, page), 'utf8');
  const tiles = apps.filter((a) => pageOf(a.url) === page);
  const usesAi = /\/api\/(chat|generate|malarz|ewa-generate)/.test(src);
  const citesLaw = /§\s*\d+|\bart\.\s*\d+|Dz\.\s?U\./.test(src);
  const state = {};
  for (const f of FEATURES) {
    if (f.n_a && f.n_a(src, page)) state[f.key] = 'n/a';
    else if (f.broken && f.broken(src)) state[f.key] = 'do zrobienia';
    else state[f.key] = f.test(src) ? 'jest' : 'brak';
  }
  return {
    page,
    title: tiles[0]?.title || page,
    category: tiles[0]?.category || '—',
    verified2026: tiles.some((t) => t.verified2026),
    usesAi,
    citesLaw,
    lawTracked: citesLaw ? trackedFiles.has(page) : null,
    state
  };
});

const MARK = { jest: '✅', 'do zrobienia': '⚠️', brak: '–', 'n/a': '·' };
const count = (key, value) => rows.filter((r) => r.state[key] === value).length;

const lines = [];
lines.push('# Stan portfolio EduBox AI');
lines.push('');
lines.push('<!-- PLIK GENEROWANY: node scripts/stan-portfolio.js. Nie edytuj ręcznie. -->');
lines.push('');
lines.push(`Wygenerowano: ${new Date().toISOString().slice(0, 10)} · stron narzędzi: **${rows.length}** · kafelków w katalogu: **${apps.length}** (część to głębokie linki \`?mode=\` do tej samej strony).`);
lines.push('');
lines.push('Ten plik odpowiada na pytanie „co jest już zrobione, a co zostało?" bez zgadywania:');
lines.push('powstaje z faktycznych plików, nie z notatek. Po każdej większej zmianie odpal');
lines.push('`npm run stan` i zacommituj — `npm test` sprawdza, czy jest aktualny.');
lines.push('');
lines.push('Legenda: ✅ jest · ⚠️ po staremu / do zerknięcia · – brak · · nie dotyczy');
lines.push('');
lines.push('⚠️ znaczy „sprawdź”, nie „zepsute”. Przy kolumnie **Czysty wydruk** jest to szczególnie ważne:');
lines.push('wykrycie poprawnego wydruku z samego kodu jest zawodne, bo zależy od tego, jakim kolorem');
lines.push('markup renderuje treść w środku kartki. Traktuj te pozycje jako listę do obejrzenia');
lines.push('w podglądzie wydruku (Ctrl+P), nie jako listę błędów.');
lines.push('');

lines.push('## Podsumowanie');
lines.push('');
lines.push('| Cecha | Jest | Do zrobienia | Brak | Po co to |');
lines.push('| --- | --- | --- | --- | --- |');
for (const f of FEATURES) {
  lines.push(`| ${f.label} | ${count(f.key, 'jest')} | ${count(f.key, 'do zrobienia')} | ${count(f.key, 'brak')} | ${f.why} |`);
}
lines.push('');

const citing = rows.filter((r) => r.citesLaw);
const untracked = citing.filter((r) => !r.lawTracked);
lines.push('## Przepisy');
lines.push('');
lines.push(`Narzędzia cytujące przepisy (\`§\`, \`art.\`, \`Dz.U.\`): **${citing.length}**, z tego objętych cotygodniową kontrolą ISAP (\`scripts/legal-acts.json\` → \`npm run legal:check\`): **${citing.length - untracked.length}**.`);
lines.push('');
if (untracked.length) {
  lines.push('⚠️ **Cytują przepisy, ale nie są w `legal-acts.json`** — nowelizacja takiego aktu przejdzie niezauważona:');
  lines.push('');
  for (const r of untracked) lines.push(`- \`${r.page}\` (${r.title})`);
} else {
  lines.push('✅ Każde narzędzie cytujące przepisy jest objęte kontrolą.');
}
lines.push('');
lines.push(`Ostatnia ręczna weryfikacja aktów w ISAP: **${legal.checked}** (${legal.acts.length} aktów).`);
lines.push('');

// Kontrola po NUMERACH aktów, nie po plikach: plik może być w legal-acts.json przez jeden
// akt i jednocześnie cytować drugi, którego w ogóle nie pilnujemy. Tak właśnie wyszła dziura
// z Dz.U. 2026 poz. 1122 (9 obszarów oceny zachowania) - cytowany w 9 miejscach, nietrackowany.
const citedActs = new Map();
const SCAN_EXT = ['.html', '.js'];
const scanFiles = fs.readdirSync(root)
  .filter((f) => SCAN_EXT.includes(path.extname(f)))
  .concat(fs.readdirSync(path.join(root, 'scripts')).filter((f) => f.endsWith('.js')).map((f) => path.join('scripts', f)));
for (const file of scanFiles) {
  if (/legal-acts|stan-portfolio|check-legal/.test(file)) continue;
  const src = fs.readFileSync(path.join(root, file), 'utf8');
  for (const m of src.matchAll(/Dz\.\s?U\.\s*(?:z\s*)?(\d{4})\s*r?\.?\s*poz\.\s*(\d+)/g)) {
    const eli = `DU/${m[1]}/${m[2]}`;
    if (!citedActs.has(eli)) citedActs.set(eli, new Set());
    citedActs.get(eli).add(file);
  }
}
// Akt jest pilnowany także wtedy, gdy cytujemy go przez numer TEKSTU JEDNOLITEGO albo
// numer noweli - snapshot z ISAP wymienia jedno i drugie. Bez tego raport krzyczałby
// o Dz.U. 2023 poz. 2572 (tekst jednolity rozporządzenia o ocenianiu), które pilnujemy
// pod numerem pierwotnym DU/2019/373 - i nikt by mu już nie wierzył.
const knownElis = new Set(legal.acts.map((a) => a.eli));
const coveredBy = new Map();
for (const act of legal.acts) {
  for (const list of Object.values(act.snapshot?.refs || {})) {
    for (const eli of list) if (!knownElis.has(eli)) coveredBy.set(eli, act);
  }
}
const missingActs = [...citedActs.entries()]
  .filter(([eli]) => !knownElis.has(eli) && !coveredBy.has(eli))
  .sort();
const viaRefs = [...citedActs.keys()].filter((eli) => !knownElis.has(eli) && coveredBy.has(eli)).sort();
if (missingActs.length) {
  lines.push('⚠️ **Akty cytowane w kodzie, których NIE MA w `legal-acts.json`** — ich nowelizacja nie wywoła alertu:');
  lines.push('');
  for (const [eli, files] of missingActs) {
    const [, year, pos] = eli.split('/');
    lines.push(`- **Dz.U. ${year} poz. ${pos}** — w ${files.size} plikach: ${[...files].sort().map((f) => '`' + f + '`').join(', ')}`);
  }
  lines.push('');
  lines.push('Domknięcie: potwierdź tytuł aktu w ISAP, dopisz go do `scripts/legal-acts.json` (z listą plików w `usedIn`), potem `npm run legal:update`.');
} else {
  lines.push('✅ Każdy akt cytowany w kodzie jest objęty kontrolą.');
}
lines.push('');
if (viaRefs.length) {
  lines.push('Cytowane przez numer tekstu jednolitego lub noweli — pilnowane pod numerem pierwotnym, więc w porządku:');
  lines.push('');
  for (const eli of viaRefs) {
    const [, year, pos] = eli.split('/');
    lines.push(`- Dz.U. ${year} poz. ${pos} → \`${coveredBy.get(eli).eli}\` (${coveredBy.get(eli).short})`);
  }
  lines.push('');
}

const legacyNeon = rows.filter((r) => /shadow-\[0_0_/.test(fs.readFileSync(path.join(root, r.page), 'utf8')));
lines.push('## Porządki (nie błędy)');
lines.push('');
lines.push(`Stron z martwymi klasami \`shadow-[0_0_…]\` w markupie: **${legacyNeon.length}**.`);
lines.push('Wygasza je reguła w `edubox-ui.css`, więc wyglądu nie psują – to tylko kod do sprzątnięcia');
lines.push('przy okazji innych zmian w danym pliku. Nie ma potrzeby robić z tego osobnej akcji.');
lines.push('');
lines.push('## Narzędzia');
lines.push('');
const header = `| Narzędzie | Plik | ${FEATURES.map((f) => f.label).join(' | ')} | Przepisy |`;
const divider = `| --- | --- | ${FEATURES.map(() => '---').join(' | ')} | --- |`;
for (const [cat, label] of Object.entries(CATEGORY_LABELS)) {
  const group = rows.filter((r) => r.category === cat);
  if (!group.length) continue;
  lines.push(`### ${label} (${group.length})`);
  lines.push('');
  lines.push(header);
  lines.push(divider);
  for (const r of group) {
    const law = !r.citesLaw ? '·' : r.lawTracked ? '✅ ISAP' : '⚠️ poza kontrolą';
    lines.push(`| ${r.title} | \`${r.page}\` | ${FEATURES.map((f) => MARK[r.state[f.key]]).join(' | ')} | ${law} |`);
  }
  lines.push('');
}

const rest = rows.filter((r) => !CATEGORY_LABELS[r.category]);
if (rest.length) {
  lines.push(`### Poza kategoriami (${rest.length})`);
  lines.push('');
  lines.push(header);
  lines.push(divider);
  for (const r of rest) {
    const law = !r.citesLaw ? '·' : r.lawTracked ? '✅ ISAP' : '⚠️ poza kontrolą';
    lines.push(`| ${r.title} | \`${r.page}\` | ${FEATURES.map((f) => MARK[r.state[f.key]]).join(' | ')} | ${law} |`);
  }
  lines.push('');
}

const content = lines.join('\n') + '\n';

// Data generowania zmienia się codziennie, więc --check porównuje treść BEZ tej linii.
const stripDate = (text) => text.replace(/^Wygenerowano: \d{4}-\d{2}-\d{2} /m, 'Wygenerowano: <data> ');

if (checkOnly) {
  if (!fs.existsSync(OUT)) {
    console.error('[Stan] Brak docs/STAN-PORTFOLIO.md – uruchom npm run stan.');
    process.exit(1);
  }
  const current = fs.readFileSync(OUT, 'utf8');
  if (stripDate(current) !== stripDate(content)) {
    console.error('[Stan] docs/STAN-PORTFOLIO.md jest nieaktualny – uruchom npm run stan i zacommituj.');
    process.exit(1);
  }
  console.log(`[Stan] OK — spis aktualny (${rows.length} stron narzędzi).`);
} else {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, content);
  console.log(`[Stan] Zapisano docs/STAN-PORTFOLIO.md (${rows.length} stron narzędzi, ${apps.length} kafelków).`);
}

'use strict';

// Generator strony przepisy-i-rodo.html („Przepisy i RODO w EduBox AI”) z listy aktów
// scripts/legal-acts.json – tej samej, którą co tydzień sprawdza scripts/check-legal.js.
// Uruchom po każdej zmianie listy aktów lub rejestru zmian: node scripts/generate-przepisy.js

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BASE = 'https://eduboxpro.pl';
const SLUG = 'przepisy-i-rodo.html';
const legal = JSON.parse(fs.readFileSync(path.join(__dirname, 'legal-acts.json'), 'utf8'));

const MONTHS = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];
const plDate = (iso) => { const [y, m, d] = iso.split('-').map(Number); return `${d} ${MONTHS[m - 1]} ${y}`; };
const CHECKED = plDate(legal.checked);

const TOOL_NAMES = {
  'asystent-pedagoga.html': 'Asystent Pedagoga', 'edudialog.html': 'EduDialog', 'edubiurokrata.html': 'EduBiurokrata',
  'edudostosowania.html': 'Asystent Dostosowań', 'edudruki.html': 'Baza Druków', 'eduprawo.html': 'EduPrawo',
  'edureforma.html': 'EduReforma', 'eduocena.html': 'EduOcena', 'edulekcja360.html': 'EduLekcja 360',
  'edukacja2025.html': 'Edukacja Obywatelska AI', 'eduawans.html': 'EduAwans', 'awans.html': 'Kreator Awansu',
  'standardy-ochrony-maloletnich.html': 'Standardy ochrony małoletnich',
  'ocena-opisowa-przyklady.html': 'Ocena opisowa – przykłady', 'ocena-zachowania-przyklady.html': 'Ocena zachowania – przykłady',
  'opinia-o-uczniu-do-poradni-przyklady.html': 'Opinia do poradni – przykłady'
};
const toolLabel = (f) => f.startsWith('wzory-drukow/') ? null : (TOOL_NAMES[f] || f.replace('.html', ''));

// Rejestr zmian po przeglądach (najnowsze na górze).
const CHANGELOG = [
  ['7 października 2026', [
    'Polityka prywatności: nowa sekcja o grafikach AI i wgrywanych zdjęciach (dostawcy: Fal.ai i modele OpenAI GPT Image, opis wzoru przez OpenAI) z prośbą, by nie wgrywać zdjęć osób; zamiana zdjęcia w kolorowankę w MagicColor działa lokalnie.'
  ]],
  ['6 października 2026', [
    'Ocena zachowania: 9 podstawowych obszarów obowiązujących od 1 września 2026 r. (nowe brzmienie § 11 ust. 1, Dz.U. 2026 poz. 1122) – w EduOcena i na stronie z przykładami.',
    'Orzeczenia i opinie poradni (Dz.U. 2026 poz. 428): doprecyzowane daty (rozporządzenie obowiązuje od 14 kwietnia 2026 r., przepisy o treści opinii szkoły – od 1 września 2026 r.) i termin 10 dni na przekazanie opinii przez szkołę; nowy wzór opinii zgodny z § 7 ust. 6–7.',
    'IPET: wytyczne uzupełnione o wszystkie elementy z § 6 ust. 1 rozporządzenia o kształceniu specjalnym oraz terminy z § 6 ust. 5 i 9.',
    'Wczesne wspomaganie: usunięta błędna informacja o nowelizacji – rozporządzenie z 2017 r. nie było zmieniane; obszary arkusza obserwacji zgodne z § 4.',
    'Prace domowe w generatorach lekcji zgodne z § 12a rozporządzenia o ocenianiu; dostosowanie wymagań opisane zgodnie z art. 44c ustawy o systemie oświaty i § 2 rozporządzenia o ocenianiu.',
    'Asystent Pedagoga – nowe instrukcje dokumentów: IPET ze wszystkimi 8 elementami z § 6 ust. 1, nazwy i limity uczestników form pomocy psychologiczno-pedagogicznej zgodne z rozporządzeniem o pomocy pp, zajęcia rewalidacyjne opisywane odrębnie od pomocy pp, minimalny wymiar rewalidacji według nowych ramowych planów nauczania (Dz.U. 2026 poz. 1028, od 1 września 2026 r.).',
    'WOPFU i opinia dla zespołu orzekającego opisują funkcjonowanie ucznia w obszarach aktywności i uczestniczenia ICF (§ 7 ust. 7 rozporządzenia o orzeczeniach i opiniach), z barierami i czynnikami ułatwiającymi.',
    'Diagnoza dojrzałości szkolnej według nowej podstawy programowej wychowania przedszkolnego (Dz.U. 2026 poz. 378): 9 obszarów osiągnięć dziecka na koniec wychowania przedszkolnego.',
    'Wprowadzona cotygodniowa automatyczna kontrola statusu wszystkich aktów z listy poniżej.'
  ]]
];

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const isapUrl = (eli) => { const [, y, p] = eli.split('/'); return `https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU${y}${String(p).padStart(7, '0')}`; };

const title = 'Przepisy i RODO w EduBox AI – jak dbamy o zgodność';
const description = 'Jak EduBox AI sprawdza aktualność przepisów oświatowych (ISAP, cotygodniowa kontrola) i chroni dane uczniów: co dzieje się z tekstem wpisanym do AI, czego nie przechowujemy.';
if (description.length < 70 || description.length > 180) throw new Error('Opis: ' + description.length);

const actsHtml = legal.acts.map(a => {
  const tools = [...new Set(a.usedIn.map(toolLabel).filter(Boolean))];
  const docs = a.usedIn.filter(f => f.startsWith('wzory-drukow/')).length;
  const used = [tools.join(', '), docs ? `wzory Word: ${docs}` : ''].filter(Boolean).join(' · ');
  return `        <li class="bg-white border border-slate-200 rounded-2xl p-4">
          <a href="${isapUrl(a.eli)}" target="_blank" rel="noopener" class="font-bold text-indigo-700 hover:underline">${esc(a.name)}</a>
          <p class="text-xs text-slate-500 mt-1">${esc(a.eli.replace('DU/', 'Dz.U. ').replace('/', ' poz. '))} · ${esc(a.short)}</p>
          <p class="text-xs text-slate-600 mt-1">Korzystają: ${esc(used)}</p>
        </li>`;
}).join('\n');

const changelogHtml = CHANGELOG.map(([date, items]) => `      <h3 class="font-extrabold text-slate-900 mt-4 mb-2">Przegląd z ${esc(date)}</h3>
      <ul class="space-y-2 text-sm">
${items.map(i => `        <li class="flex gap-3"><span class="text-emerald-600 font-bold">✓</span><span>${esc(i)}</span></li>`).join('\n')}
      </ul>`).join('\n');

const html = `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${BASE}/${SLUG}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${BASE}/${SLUG}">
  <meta property="og:image" content="${BASE}/okladka.jpg">
  <meta property="og:locale" content="pl_PL">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${BASE}/okladka.jpg">
  <link rel="icon" href="/icon-96.png" type="image/png">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&amp;display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-CL194R0J5H"></script>
  <script src="/cookie-consent.js" defer></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    // Google Consent Mode v2 - domyslnie WYLACZONE, dopoki uzytkownik nie zgodzi sie w banerze cookies.
    gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied' });
    if (localStorage.getItem('eduboxCookieConsent') === 'granted') {
      gtag('consent', 'update', { analytics_storage: 'granted' });
    }
    gtag('js', new Date());
    gtag('config', 'G-CL194R0J5H');
  </script>
  <style>body{font-family:'Plus Jakarta Sans',system-ui,sans-serif}</style>
</head>
<body class="min-h-screen bg-slate-50 text-slate-800 antialiased">
  <header class="bg-slate-950">
    <div class="max-w-3xl mx-auto px-5 py-5 flex items-center justify-between gap-4">
      <a href="/index.html" class="text-white font-extrabold text-lg">Edu<span class="text-emerald-400">Box</span> AI</a>
      <a href="polityka-prywatnosci.html" class="text-sm font-bold text-emerald-300 hover:text-emerald-200">Polityka prywatności →</a>
    </div>
  </header>

  <main class="max-w-3xl mx-auto px-5 py-10">
    <p class="text-xs font-extrabold uppercase tracking-widest text-indigo-600 mb-3">Zaufanie · Stan prawny sprawdzony ${esc(CHECKED)}</p>
    <h1 class="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight mb-3">Przepisy i RODO w EduBox AI</h1>
    <p class="text-lg text-slate-600 mb-8">EduBox AI pomaga pisać projekty dokumentów szkolnych. Dlatego pilnujemy dwóch rzeczy: aktualności przepisów, na których opierają się narzędzia, i ochrony danych uczniów. Opisujemy, jak to robimy – bez obietnic, których nie da się dotrzymać.</p>

    <section class="mb-10">
      <h2 class="text-xl font-extrabold text-slate-900 mb-3">Jak sprawdzamy przepisy</h2>
      <ul class="space-y-3">
        <li class="flex gap-3"><span class="text-emerald-600 font-bold">✓</span><span><strong>Źródło: Dziennik Ustaw, nie artykuły z internetu.</strong> Każde odwołanie do przepisu w narzędziach, wzorach Word i stronach z przykładami sprawdzamy w ISAP – oficjalnym systemie aktów prawnych Sejmu RP.</span></li>
        <li class="flex gap-3"><span class="text-emerald-600 font-bold">✓</span><span><strong>Ręczny przegląd treści</strong> – ostatnio ${esc(CHECKED)}: przeczytaliśmy aktualne brzmienie przepisów i poprawiliśmy narzędzia (rejestr zmian niżej).</span></li>
        <li class="flex gap-3"><span class="text-emerald-600 font-bold">✓</span><span><strong>Automatyczna kontrola co tydzień.</strong> Skrypt pyta oficjalne API Sejmu, czy któryś z aktów z listy nie został znowelizowany, ogłoszony w tekście jednolitym lub uchylony. Każda zmiana to alert i przegląd narzędzi, które z niego korzystają.</span></li>
        <li class="flex gap-3"><span class="text-emerald-600 font-bold">✓</span><span><strong>AI pomaga, nauczyciel decyduje.</strong> Wyniki są projektami do sprawdzenia. O ostatecznej treści dokumentu decyduje szkoła – statut, procedury, dyrektor. EduBox nie udziela porad prawnych.</span></li>
      </ul>
    </section>

    <section class="mb-10 bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
      <h2 class="text-xl font-extrabold text-slate-900 mb-1">Rejestr zmian</h2>
      <p class="text-sm text-slate-600">Co poprawiliśmy po przeglądach przepisów.</p>
${changelogHtml}
    </section>

    <section class="mb-10">
      <h2 class="text-xl font-extrabold text-slate-900 mb-1">Akty prawne, na których się opieramy (${legal.acts.length})</h2>
      <p class="text-sm text-slate-500 mb-4">Linki prowadzą do ISAP. Lista jest objęta cotygodniową kontrolą.</p>
      <ul class="space-y-3">
${actsHtml}
      </ul>
    </section>

    <section class="mb-10">
      <h2 class="text-xl font-extrabold text-slate-900 mb-3">Dane i RODO – co dzieje się z tekstem, który wpisujesz</h2>
      <ul class="space-y-3">
        <li class="flex gap-3"><span class="text-indigo-600 font-bold">•</span><span><strong>Bez rejestracji i bez konta.</strong> Nie znamy Twojego imienia ani adresu e-mail, chyba że sam/-a zapiszesz się na powiadomienia.</span></li>
        <li class="flex gap-3"><span class="text-indigo-600 font-bold">•</span><span><strong>Tekst trafia do dostawcy AI tylko po to, by przygotować odpowiedź</strong> (teksty: OpenAI; obrazy: Fal.ai, który część grafik wykonuje modelami OpenAI). Nie zapisujemy go na naszych serwerach ani w logach. Nie wgrywaj zdjęć dzieci ani innych osób jako wzoru grafiki – wystarczy rysunek albo zdjęcie przedmiotu.</span></li>
        <li class="flex gap-3"><span class="text-indigo-600 font-bold">•</span><span><strong>OpenAI (API) nie używa tych treści do trenowania modeli</strong> i – zgodnie ze swoimi zasadami – przechowuje je do 30 dni wyłącznie w celu wykrywania nadużyć. Przekazanie danych do USA odbywa się w ramach EU-U.S. Data Privacy Framework i standardowych klauzul umownych.</span></li>
        <li class="flex gap-3"><span class="text-indigo-600 font-bold">•</span><span><strong>Automatyczna ochrona:</strong> zanim tekst trafi do AI, nasz serwer usuwa z niego numery PESEL. Przy publikacji w Giełdzie Wzorów EduOcena zamienia imię ucznia na inicjał. W Asystencie Pedagoga imię i nazwisko ucznia w ogóle nie trafia do AI – wstawiamy je do gotowego dokumentu dopiero w Twojej przeglądarce.</span></li>
        <li class="flex gap-3"><span class="text-indigo-600 font-bold">•</span><span><strong>Twoja rola jest najważniejsza:</strong> nie wpisuj imion, nazwisk, PESEL-i, adresów ani diagnoz. Używaj inicjałów i ogólnych opisów, a dane ucznia uzupełniaj dopiero w dokumencie szkoły.</span></li>
      </ul>
      <div class="mt-5 bg-white border border-slate-200 rounded-2xl p-5">
        <h3 class="font-extrabold text-slate-900 mb-2">Dla dyrektorów i inspektorów ochrony danych</h3>
        <p class="text-sm leading-relaxed">EduBox AI to narzędzie do redagowania zanonimizowanych tekstów – nie służy do przechowywania dokumentacji uczniów ani do przetwarzania ich danych osobowych. Jeśli szkoła chce pracować z AI na danych uczniów, powinna korzystać z narzędzi objętych umową powierzenia zawartą przez szkołę (np. szkolnych kont Google Workspace for Education lub Microsoft 365 z wbudowanym asystentem AI). Szczegóły: <a href="polityka-prywatnosci.html" class="text-indigo-700 font-semibold hover:underline">polityka prywatności</a>.</p>
      </div>
    </section>

    <section class="border-t border-slate-200 pt-6">
      <h2 class="text-xl font-extrabold text-slate-900 mb-2">Widzisz błąd albo nieaktualny przepis?</h2>
      <p class="mb-4">Napisz na <a href="mailto:edubox.ai@gmail.com" class="text-indigo-700 font-semibold hover:underline">edubox.ai@gmail.com</a> – sprawdzimy w ISAP i poprawimy najszybciej, jak to możliwe. Każde zgłoszenie od nauczyciela jest dla nas cenne.</p>
      <p class="text-xs text-slate-500 leading-relaxed">EduBox AI nie gwarantuje, że wynik AI będzie bezbłędny, i nie zastępuje porady prawnej. Ostateczną treść dokumentów ustala szkoła zgodnie z obowiązującymi przepisami i swoim statutem.</p>
      <p class="text-sm mt-4"><a href="/index.html" class="text-indigo-700 font-semibold hover:underline">← Wszystkie darmowe narzędzia EduBox AI</a></p>
    </section>
  </main>
</body>
</html>
`;

fs.writeFileSync(path.join(ROOT, SLUG), html);
console.log(`[Przepisy] Wygenerowano ${SLUG} (aktów: ${legal.acts.length}, weryfikacja: ${CHECKED})`);

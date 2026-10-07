# CLAUDE.md — EduBox AI (eduboxpro.pl)

Portfolio 66 kafelków darmowych narzędzi AI dla nauczycieli (Polska). Utrzymywany
przez jedną osobę (Witold, wmkraw@gmail.com) z pomocą Claude Code. Ton marki:
"koleżanka z pokoju nauczycielskiego" — ciepło, konkret, zero korpo-mowy.
Wsparcie finansowe przedstawiane jako "dziękuję", nigdy jako "kup teraz".

## Architektura i stos technologiczny

**Frontend** — brak build stepu. Każda strona `*.html` w katalogu głównym to
samodzielny plik: React 18 (UMD z unpkg) + Babel Standalone (transpiluje JSX
w przeglądarce, `<script type="text/babel">`) + Tailwind CSS (CDN) + Phosphor
Icons. Wspólne menu ładowane dynamicznie z `menu.html` (fetch + ręczne
odtworzenie `<script>` tagów, bo `innerHTML` ich nie wykonuje).

**Backend** — Vercel Serverless Functions w `/api/*.js`. **TWARDY LIMIT: 12
funkcji na planie Hobby.** Aktualnie dokładnie 12 — każdy nowy endpoint
wymaga albo usunięcia/scalenia innego, albo rozbudowy istniejącego pliku
(patrz `api/ewa-generate.js`, który obsługuje i obrazy fal.ai, i wideo D-ID
pod wspólnym endpointem przez pole `type` w body). Przekroczenie limitu
psuje **CAŁY** deployment po cichu (stara wersja zostaje, bez błędu widocznego
od razu) — to się już raz zdarzyło (`api/ewa-chat.js`, usunięty jako duplikat
`api/chat.js`).

**Baza danych** — Firebase/Firestore (projekt `edubox-pro`), logowanie
anonimowe. Używane do: Giełdy Wzorów (współdzielone treści między
użytkownikami per-narzędzie), liczników użycia, ewentualnych bibliotek
wzorów (np. EduDialog).

**Zewnętrzne API:**
- OpenAI przez `/api/chat.js` — jeden wspólny endpoint dla WSZYSTKICH narzędzi
  tekstowych. Body: `{ prompt, system, temperature, format: "json"|"text", model, stream, verbosity }`.
  `model` NIE trafia bezpośrednio do OpenAI — `resolveModelChain()` mapuje go
  na łańcuch modeli z automatycznym fallbackiem (przy błędzie modelu oraz 429/5xx):
  `model: "strong"` (dokumenty urzędowe/prawne) ze strumieniem → `gpt-6.1-sol → gpt-5.4-mini → gpt-4.1 → gpt-4o-mini`
  (wybór z testów 6.10.2026: najrzetelniejsze IPET/WOPFU/opinie; pełny IPET ≈ 0,30 zł, ~100 s, ale pisze
  wolno – dlatego tylko ze strumieniem); `strong` BEZ strumienia → `gpt-5.4-mini → gpt-4.1 → gpt-4o-mini`
  (narzędzie przestawione na strumień automatycznie dostaje mocniejszy model);
  `"balanced"` (dłuższe materiały robocze) → `gpt-5.4-mini → gpt-4.1-mini → gpt-4o-mini`;
  znany model z `KNOWN_MODELS` próbuje siebie, potem `gpt-4o-mini`; nieznany/pominięty
  oraz prośby o stary `gpt-4o-mini` → domyślnie `gpt-4.1-mini → gpt-4o-mini`. Klient nie
  może więc zażądać dowolnego (drogiego) modelu — whitelist chroni przed nadużyciem.
  Modele rozumujące (`gpt-5*`, `gpt-6*`, `o*`) NIE przyjmują `temperature` (wysyłamy
  `reasoning_effort: "low"`, a dla wersji zwięzłych `verbosity: "low"`) — bez tego cicho
  spadały na słabszy model. `stream: true` → odpowiedź `text/plain` płynie na bieżąco
  (`EduDocTools.streamChat` w `doc-tools.js`). Logi `[usage] model in= out=` (tylko liczby
  tokenów, nigdy treść) pozwalają liczyć koszty (Hobby trzyma logi 1 h). Tylko na preview
  (chronione logowaniem Vercel): `testModel`/`testEffort`/`testVerbosity` oraz
  `mode: "models-probe"` (lista modeli dostępnych dla klucza) – do porównań przy audytach.
- Fal.ai (klucz `FAL_KEY`) — generowanie obrazów przez `/api/generate.js`, `/api/malarz.js`
  (oba korzystają ze wspólnego `api/_lib/imageModels.js` → `runImageChain`) i `/api/ewa-generate.js`.
  Łańcuch z testów 6–7.10.2026: najpierw **GPT Image 2.5** (model OpenAI uruchamiany przez fal,
  `quality: medium`, rozmiary 1024², 1024×1536, 1536×1024; bezbłędne polskie napisy, najwierniej
  trzyma opis i kompozycję, ok. 0,015–0,02 USD, ~20 s), zapas FLUX.2 pro → FLUX.1 dev.
  `model: "recraft"` (medale, ramki, dyplomy) → też najpierw GPT Image 2.5, zapas Recraft V4.1 →
  Recraft V3. **Recraft V4.1 przyjmuje tylko styl `any` albo `vector_illustration`** (inne = 422),
  a `vector_illustration` zwraca SVG (nie zadziała w canvas/PDF) – wysyłamy `any`, styl słowami.
  Zdjęcie użytkownika (`init_image`) → GPT Image 2.5 edit (dawny SDXL img2img prawie nie przerabiał
  zdjęcia). **`reference_image` / `reference_images`** → ten sam bohater w nowej scenie (GPT Image 2.5
  edit z instrukcją „kopiuj wygląd, nie minę ani tło”) – EduBajka (okładka), EduKomiks (kadr 1),
  historyjki społeczne i EduKasia (obrazek 1); kolejne obrazki rysowane równolegle. Formaty malarza:
  medal, naklejka, zawieszka (pion), zaproszenie (pion), dyplom, `poziom` (3:2 nad tekstem A4), `pion`.
  Linki `fal.media` są w praktyce trwałe (wpisy Giełdy z 06.2026 nadal działają). Na preview:
  `testEndpoint`/`testPayload` w `generate.js` (dowolny model fal lub `openai-direct:<model>`).
  `/api/upscale` (wydruk A4/A3 w EduPlakat): Recraft Crisp (~4096 px, 0,004 USD), zapas ESRGAN ×2 –
  dawny clarity-upscaler ×4 kosztował 0,03 USD za megapiksel WYNIKU (~0,75 USD za plakat).
  Style w promptach opisujemy słowami (bez nazw studiów typu Pixar/Disney/Ghibli i bez określeń
  rasowych). Limit czasu po stronie przeglądarki dla obrazków: min. 120 s.
- ElevenLabs — **tylko** wewnątrz pipeline'u Make.com/json2video (patrz
  niżej). Brak bezpośredniego klucza/dostępu z naszego własnego backendu.
- D-ID (talking-avatar video, plan "Lekki" ~5,9 USD/mies.) — nowa integracja,
  `DID_API_KEY` (env var na Vercelu, format `user:pass`, wysyłany jako
  `Authorization: Basic base64(key)`). Zdjęcie źródłowe MUSI być realnym
  URL-em (własny endpoint `/images` D-ID) — **base64 w `source_url` nie
  przechodzi walidacji**. `config.stitch: true` zwraca pełne zdjęcie zamiast
  ciasno przyciętej twarzy.

**Automatyzacje poza repo:**
- **Make.com** (2 scenariusze wideo na YouTube Shorts):
  - *"Wrześniowe bóle YouTube Tube"* (id 6943601) — codziennie 18:55, temat
    dnia z arkusza Google (`Wrzesien_Bole`, 57 wierszy, rotacja przez
    `formatDate(now;"DDD") % N`), głos i wygląd naprzemiennie kobieta/mężczyzna
    (`RWZoDXNWfWzwHbPcWFpP`=Agata / `Y7xc6da0VDgeNzscBD9d`=Rafał, ta sama
    zmienna dnia steruje OBOMA, żeby się nie rozjeżdżały).
  - *"Minuta z Adą"* (id 7048286) — pon/śr/pt 12:00, promuje jedno konkretne
    narzędzie z katalogu dziennie (arkusz `Ada_Katalog`, 57 wierszy), stała
    postać "Ada" (kasztanowe włosy, ubranie w barwach indygo/ametyst), głos
    Agaty, link w opisie do konkretnego narzędzia (nie strony głównej).
- **GitHub Actions** (`.github/workflows/`):
  `health-check.yml` (co 6h — sprawdza WSZYSTKIE strony .html i endpointy
  /api, alert mailem przez Resend jeśli coś nie odpowiada),
  `costalert.yml` (codziennie — koszty OpenAI/Fal.ai),
  `coffee-check.yml` (co 5 min — wpłaty buycoffee.to → kod PRO),
  `weekly-report.yml` (poniedziałki — raport tygodniowy),
  `update-porada-dnia.yml` (Porada dnia).

## Katalog narzędzi (`apps.js`, 66 wpisów, 4 kategorie)

`window.EduBoxData.APPS` — pojedyncze źródło prawdy dla katalogu, menu,
wyszukiwarki (OmniBot) i generatorów treści marketingowych (EwaMarketing,
Ada, Ania). Każdy wpis: `title, desc, url, badge, badgeColor, icon, color,
category, tags`.

- **terapia** (14): EduKasia, Asystent Dostosowań, EduDialog AI (NVC + PPP),
  EduTerapia PRO (TUS), EduWizualizator (AAC), EduChunk, EduBajka, EduSymbol
  (AAC), EduSOS, EduPiktogram, EduOddech, EduDyplom Wideo, EduPodsumowanie.
- **biurokracja** (17): Asystent Pedagoga (IPET/WOPFU/WWRD), EduReforma,
  Kreator/EduAwans, EduWycieczka, EduPrawo, EduBiurokrata, EduSprawozdawca,
  EduOcena, EduKorektor, EduWpisy, EduPDF, EduRaport, EduNotariusz.
- **zajecia** (22): EduScenariusz, Edukacja Obywatelska AI, EduZadania,
  EduSprawdzian Maker, EduKalendarz, EduZastępstwo, EduTimer, EduTik PRO
  (wierszyki/piosenki), **EduRymy AI** (słownik rymów — osobne narzędzie od
  EduTik, dwuetapowa weryfikacja rymów), EduPrezentacja, EduKomiks,
  EduMotywator, EduGrupy, EduFiszki, EduGry, EduBystrzak, EduEscape, Studio,
  EduWakacje oraz EduLekcja 360.
- **grafika** (12): EduWystrój/EduDekorator, EduKatalog, EduGenerator,
  EduDyplomy, Magic Color, EduPlakat, EduStudio, EduGazetka, MagicLetters,
  EduMalarz, EduDetox.

**Narzędzia prywatne** (poza katalogiem, za Basic Auth przez `middleware.js`,
`EWA_AUTH_USER`/`EWA_AUTH_PASS`):
- `ewamarketing.html` — "EduInfluencer Studio", posty + zdjęcia (Ewa: blond,
  szary garnitur — ta sama postać co `powitanie.mp4` na stronie głównej).
- `aniawideo.html` — "Generator Wideo Ani", mówiące wideo przez D-ID (Ania:
  trzecia, osobna postać, zdjęcie wgrywane ręcznie przez użytkownika i
  trzymane w `localStorage`, nie w repo). Ręczne pobieranie, bez automatyzacji
  publikacji — user wrzuca sam na FB/IG/YouTube.

## Konwencje i wzorce

**Walidacja JSX przed KAŻDYM commitem** (brak build stepu = brak
kompilatora, który złapie błąd składni): wyciągnąć zawartość
`<script type="text/babel">` i przepuścić przez prawdziwy
`@babel/core.transformSync(code, {presets:['@babel/preset-react']})`
— nigdy liczenie nawiasów na oko, daje fałszywe pozytywy/negatywy.

**Limity darmowe (od 10.2026):** 5 generowań tekstu DZIENNIE, wspólnie dla całego EduBox
(klucz `eduboxDailyTextV2` = {data lokalna, count}; `EduBoxCore.executeWithLimitCheck`) oraz
1 grafika AI jednorazowo (`eduboxTrialImageV1`; `executeImageLimitCheck`). Starsze aplikacje
z własnymi licznikami (`eduboxUsage`, `edubox_*_ai`) są podpięte „mostkiem” w global-core.js
(przesunięcie = limit zapisany w aplikacji − limit puli; tekstowe = 0, bo wszystkie mają 5).
Kod PRO znosi limit (`localStorage.eduboxProStatus`, weryfikacja przez `/api/verify-code.js`).
ZanimKlikniesz nie ma limitu dziennego (`freeForever`).

**Link wsparcia:** zawsze `https://buycoffee.to/magiccolor` (nazwa
historyczna z czasów, gdy strona nazywała się "Magic Color" — NIE
`eduboxpro`, to była realna literówka naprawiona w `edusymbol.html`).

**SEO Manager 2.0:** każdy plik HTML musi być jawnie sklasyfikowany w
`seo.config.js`. Nowy HTML jest domyślnie niepubliczny i nie może trafić do
sitemap bez dopisania do `publicPages`. Strony redakcyjne/testowe należą do
`excludedPages` i dostają wyłącznie kontrolowane `noindex, nofollow` — automat
nie nadpisuje ich ręcznych tytułów ani opisów. GitHub Action uruchamia tylko
`npm run seo:check`; nigdy automatycznego `seo:fix`. Szczegóły:
`docs/SEO-MANAGER.md`.

**Nawigacja oparta na potrzebach:** `apps.js` przechowuje również `JOURNEYS`
(gotowe ścieżki NOVY z 2–3 klikalnymi kafelkami), `CENTERS` (cztery publiczne
centra tematyczne) i `QUALITY` (data kontroli katalogu oraz etykieta roku
szkolnego). Nie duplikuj tych danych ręcznie w `index.html`. Strony
`centrum-*.html` generuje `npm run centers:generate`; CI sprawdza ich aktualność
przez `npm run centers:check` i jakość katalogu przez `npm run catalog:check`.

**Głębokie linki:** wielofunkcyjne aplikacje przyjmują kontrolowany parametr
`?mode=...`, dzięki czemu kafelek otwiera właściwą zakładkę, a nie tylko stronę
startową. Dozwolone wartości są jawnie sprawdzane w `scripts/check-catalog.js`.

**Moja Teczka:** `teczka.html` i `teczka.js` zapisują notatki wyłącznie w
`localStorage` bieżącej przeglądarki. Nie wysyłają treści do Firebase ani API.
Strona jest celowo prywatna (`noindex`) i wykluczona z sitemap. Przy zmianach
nie dodawaj synchronizacji chmurowej bez osobnej, świadomej decyzji właściciela.

**Panel jakości Make:** `panel-jakosci.html` korzysta z odczytowego trybu
`GET /api/weekly-report?view=make-health`, dzięki czemu nie powstaje trzynasta
funkcja Vercel. Publiczny jest wyłącznie pusty ekran logowania; dane endpointu
są chronione istniejącymi danymi EWA. Formularz trzyma autoryzację tylko w
pamięci otwartej karty, bez localStorage. Token Make pozostaje wyłącznie w
`MAKE_API_TOKEN` na Vercelu i ma mieć tylko zakres `scenarios:read`; panel nigdy
nie uruchamia ani nie zmienia scenariuszy.

**ZanimKlikniesz** (`zanimklikniesz.html`, od 10.2026): darmowa ocena ryzyka linku,
SMS-a, oferty lub zrzutu ekranu — dla wszystkich, nie tylko nauczycieli (`freeForever: true`
w `apps.js` = bez limitów EduBox i bez odznak PRO na kafelku). Backend w
`api/_lib/scamCheck.js`, wywoływany przez `api/chat.js` z `mode: 'verify'` (bez nowej
funkcji Vercel). Sprawdza: lista CERT Polska (`hole.cert.pl`, cache 30 min), wiek domeny
(RDAP przez katalog IANA; rdap.org blokuje serwery), podszywanie się pod ~40 marek,
podgląd strony (ochrona SSRF), białą listę VAT (NIP/konto), opcjonalnie Google Safe
Browsing (`GOOGLE_SAFE_BROWSING_KEY`), numery telefonu (`libphonenumber-js`: kraj, 70x,
VoIP, SMS Premium, wangiri + okoliczności kontaktu; **celowo bez bazy „oszukańczych
numerów”** — spoofing i RODO), na końcu AI (pomijane, gdy podano sam numer). **Zasada prawna: „ocena ryzyka, nie
wyrok”** — nigdy „to oszustwo” ani „bezpieczne”; twarde sprawdzenia mogą tylko PODNIEŚĆ
poziom z AI (odporność na prompt injection w treści strony). Treści nie są zapisywane ani
logowane. Testy: `node api/_lib/scamCheck.test.js`. Link `zanimklikniesz.html?tab=link|text|phone|image`
otwiera wybraną zakładkę.

**Google Analytics:** jedyny identyfikator to `G-CL194R0J5H` (strumień „EduBox AI” dla
eduboxpro.pl, od 5.10.2026). Stary `G-3RQ9R0N0K8` (usługa z czasów domeny Vercel) usunięty
ze stron – zawiera tylko dane historyczne do 5.10.2026. Nowa strona = skopiuj blok gtag z istniejącej.
Przy zmianach CSP sprawdź w konsoli, czy żądania `google-analytics.com/g/collect` przechodzą.

**Poradniki o oszustwach** (SEO, ruch z Google → ZanimKlikniesz): statyczne strony
`oszustwo-*.html`, `jak-sprawdzic-sklep-internetowy.html`, `falszywe-inwestycje-reklamy.html`
generowane przez `node scripts/generate-poradniki.js` z tablicy `GUIDES` (nie edytuj HTML
ręcznie — zmiany w generatorze, potem `npm run seo:sitemap` i `npm test`). Nowy poradnik:
dopisz do `GUIDES`, do `publicPages` w `seo.config.js` i do listy `GUIDES` w `zanimklikniesz.html`.
Zasada jak w narzędziu: piszemy o oszustach podszywających się pod firmy, nigdy że firma oszukuje.

**Wzory i przykłady** (SEO, ruch z Google → narzędzia): `ocena-opisowa-przyklady.html`,
`ocena-zachowania-przyklady.html`, `wpisy-do-dziennika-przyklady.html`,
`sprawozdanie-wychowawcy-przyklady.html` (→ EduSprawozdawca), `wiadomosc-do-rodzica-przyklady.html`
(→ EduDialog `?mode=nvc`), `opinia-o-uczniu-do-poradni-przyklady.html` (→ EduDialog `?mode=ppp`)
generowane przez `node scripts/generate-wzory.js` z tablicy `PAGES` (ten sam tryb pracy co
poradniki; linki w stopce `index.html`; sekcja „Inne wzory” linkuje automatycznie do wszystkich
pozostałych stron). Przyciski „Kopiuj” wysyłają zdarzenie GA `wzor_copy` (`copy_type`:
przyklad/zwrot), linki do narzędzi mają `utm_medium=wzor`. EduOcena ma dwa tryby
(`params.kind`: nauka/zachowanie); `eduocena.html?typ=zachowanie` otwiera ocenę zachowania.
Treści prawne formułuj ostrożnie (statut szkoły decyduje o szczegółach), zawsze przypominaj
o niewpisywaniu danych dzieci do AI.

**Przepisy – stan prawny i weryfikacja (od 10.2026):** każde odwołanie do przepisu w narzędziach,
wzorach Word (`wzory-drukow/`) i stronach sprawdzamy w ISAP / oficjalnym API Sejmu
(`https://api.sejm.gov.pl/eli/acts/DU/<rok>/<poz>`, PDF: `/text.pdf`) – nigdy z pamięci ani z artykułów.
Lista aktów, na których się opieramy (z plikami, które z nich korzystają), jest w `scripts/legal-acts.json`;
`npm run legal:check` porównuje bieżący stan aktów ze snapshotem (nowelizacje, teksty jednolite,
uchylenia), a `.github/workflows/legal-check.yml` robi to co poniedziałek (zmiana = czerwony przebieg
i mail z GitHuba). Po przejrzeniu zmian i poprawieniu treści: `npm run legal:update` + commit.
Nowy akt w treściach = dopisz go do `legal-acts.json` (i do listy plików w `usedIn`). Uwaga: w sandboxie
deweloperskim `api.sejm.gov.pl` jest zablokowany (403 z proxy) – weryfikację nowych przepisów robi
użytkownik albo CI, nigdy „z pamięci”. Publiczna strona `przepisy-i-rodo.html`
(lista aktów, rejestr zmian, RODO) jest generowana przez `node scripts/generate-przepisy.js`
(rejestr zmian w tablicy `CHANGELOG`). Wzór opinii o funkcjonowaniu ucznia (.docx) generuje
`scripts/generate-opinia-docx.js` (wymaga `npm i --no-save docx@9`). Precyzja dat: rozporządzenie
Dz.U. 2026 poz. 428 obowiązuje od 14.04.2026, § 7 ust. 6–7 i § 8 od 1.09.2026; ocena zachowania
od 1.09.2026 – 9 obszarów z § 11 ust. 1 (Dz.U. 2026 poz. 1122); prace domowe – § 12a.

**Baza przepisów EduPrawo (od 7.10.2026):** `api/_lib/legalCorpus.json` – 10 aktów (Karta Nauczyciela t.j.
Dz.U. 2026 poz. 515, Prawo oświatowe t.j. 2026 poz. 820 + zmiana 2026/904, ustawa o systemie oświaty
t.j. 2025/881 + 2026/319, rozporządzenie o ocenianiu t.j. 2023/2572 + zmiany 2024/438, 2025/778, 2026/1122,
pomoc pp, kształcenie specjalne, orzeczenia 2026/428, awans 2022/1914, wycieczki 2018/1055, BHP t.j.
2020/1604 + 2024/933), ~980 jednostek (art. / § / punkty nowelizacji z datą „obowiązuje od” i celem zmiany).
Lista źródeł: `scripts/legal-corpus-sources.json`; budowanie: `npm i --no-save pdfjs-dist@4.10.38 && npm run
legal:corpus` (PDF z API Sejmu → czyszczenie nagłówków, przypisów i dzielenia wyrazów → podział na jednostki;
cytaty „…” w nowelizacjach nie tworzą nowych jednostek). Wyszukiwarka `api/_lib/legalSearch.js` (BM25 na
rdzeniach 6/4 litery, słownik pojęć nauczycielskich, wykrywanie aktu wymienionego w pytaniu, doklejanie zmian
do starszego brzmienia, wycinanie właściwych ustępów) działa w `api/chat.js` przy `mode: 'legal'` – baza
ładuje się dopiero przy pierwszym pytaniu prawnym. Model cytuje WYŁĄCZNIE identyfikatory z dołączonych
fragmentów (`cited`), a odpowiedź zawiera `sources` z dosłownym brzmieniem – EduPrawo pokazuje je pod
podstawą prawną. Testy: `node api/_lib/legalSearch.test.js` (w `npm test`). Gdy `legal:check` zgłosi zmianę
aktu z bazy (`usedIn: api/_lib/legalCorpus.json`): nowy tekst jednolity → popraw `text` w źródłach, nowelizacja
→ dopisz do `amendments`, potem `npm run legal:corpus`, testy i `npm run legal:update`.

**RODO – minimalizacja danych:** `api/chat.js` przed wysłaniem do OpenAI usuwa numery PESEL
(`api/_lib/pii.js`, testy `node api/_lib/pii.test.js`; celowo NIE usuwa telefonów/e-maili/kont – nauczyciel
wpisuje własny kontakt do pism). Gdy coś usunięto, odpowiedź ma nagłówek `X-EduBox-PII-Removed`, a
`global-core.js` pokazuje krótki komunikat. Giełda Wzorów w EduOcena publikuje inicjał zamiast imienia
(także w treści oceny, z odmianą imienia). Treści AI nie są logowane. W Asystencie Pedagoga imię
i nazwisko (pole lokalne lub lista „Moi podopieczni” WWRD) NIE trafia do AI – model pisze
`[imię i nazwisko ucznia]`, a `EduDocTools.fillName()` podmienia to w przeglądarce (też w eksporcie).

**Dokumenty SPE (Asystent Pedagoga, od 10.2026):** instrukcje dla AI są w `asystent-dokumenty.js`
(zwykły skrypt, `window.EduAsystentDocs`: typy dokumentów, opcje formularza, `buildSystemPrompt`,
`buildUserPrompt`, `checkCompleteness`) – każdy przepis sprawdzony w ISAP (m.in. § 6 KS, § 6–16
pomocy pp z limitami uczestników, § 7 Dz.U. 2026 poz. 428 z obszarami ICF, 9 obszarów przedszkolnych
z Dz.U. 2026 poz. 378, minimalny wymiar rewalidacji z ramowych planów Dz.U. 2026 poz. 1028). AI zwraca
czysty HTML (h1, metryczka, numerowane h2 zgodne z przepisem, tabele, podpisy). `doc-tools.js`
(`window.EduDocTools`) – wspólne dla generatorów dokumentów: `streamChat`, `normalize`, `fillName`,
`markPlaceholders` (żółte `[uzupełnij: …]`), `copyRich` (wklejanie do Worda/Docs z tabelami),
`downloadDocx` (biblioteka `docx@9.8.1` z jsdelivr, ładowana po kliknięciu: style nagłówków, tabele
z powtarzanym nagłówkiem, numery stron) i `printDoc` (czysty wydruk A4 / PDF). Testy instrukcji
w Node: wczytanie pliku przez `vm` i generowanie na preview (`testModel`). Głęboki link:
`asystent-pedagoga.html?doc=ipet|wopfu|opinia|gotowosc|notatka`.

**Wzorzec generatorów dokumentów (od 10.2026, stosuj w kolejnych narzędziach):** AI zwraca czysty HTML
(h1 + tabela metryczki + numerowane h2 + tabele + podpisy), `model: 'strong'` + `stream: true`
(`EduDocTools.streamChat`), podgląd jako kartka A4 (`doc-paper.css`, klasa `doc-paper`) z
`contentEditable` po zakończeniu pisania (nauczyciel poprawia na kartce, eksport bierze `innerHTML`
z kartki), przyciski Kopiuj (`copyRich`) / Word (`downloadDocx`) / Drukuj-PDF (`printDoc`), żółte
`[uzupełnij: …]`, zasady: bez zmyślonych faktów, bez danych osobowych, formy bezosobowe lub neutralne
płciowo, bez żargonu diagnostycznego. Wdrożone: Asystent Pedagoga, EduDostosowania (§ 2 rozporządzenia
o ocenianiu – 5 podstaw, uczeń zdolny = art. 44c ust. 1), EduDialog (NVC z tematem do e-dziennika,
fragment opinii w obszarach ICF), EduSprawozdawca, EduBiurokrata (opinia do poradni korzysta z
`asystent-dokumenty.js`), EduLekcja 360 (JSON → konspekt i karta pracy ucznia przez `lessonToHtml`),
Kreator Awansu (`awans.html` – 3 tryby w `DOC_TYPES`: sprawozdanie nauczyciela, ocena pracy, opinia
mentora), EduNotariusz (`DOC_KINDS`: notatka służbowa, protokół zebrania, wniosek o pomoc pp, notatka
o zdarzeniu) i EduRaport (`REPORT_KINDS`: wydarzenie, projekt, zajęcia dodatkowe, akcja).
`npm run dokumenty:check` (`scripts/check-dokumenty.js`) pilnuje całego wzorca naraz we wszystkich
narzędziach – także tego, że eksport czyta `innerHTML` kartki przez ref, a nie surowe wyjście AI.
Wydruk z ciemnych paneli dawał jasnoszary tekst – w narzędziach bez białej kartki dodawaj do
`@media print` regułę `#root * { color:#000 !important }` albo używaj `printDoc`.

**EduOcena (od 10.2026):** instrukcje są w bloku `OCENA_PROMPTS_START…END` w `eduocena.html` (czysty JS,
testy `npm run ocena:check` przez `vm`). Przepisy sprawdzone w ISAP: art. 44i ust. 1 pkt 2 UoSO, § 8 (poziom
i postępy + potrzeby rozwojowe i edukacyjne), § 9 ust. 3 (klasa w nowej podstawie, ocena roczna: zaangażowanie
w doświadczenia edukacyjne) i § 11 ust. 1 i 3 rozporządzenia o ocenianiu. Nowa podstawa (Dz.U. 2026 poz. 378)
działa według roku szkolnego (`isNewCurriculum`: 2026/27 klasa I, potem kolejne), klasy starsze – przejściowo
podstawa z 2017 r. (formalnie uchylona przez Dz.U. 2026 poz. 1012, stosowana z § 4 ust. 2). Przedszkole =
„Informacja o rozwoju dziecka” (9 obszarów podstawy, bez oceny zachowania). Imię nie trafia do AI: model pisze
`[imię]` tylko w mianowniku, `scrubName` usuwa imię także z uwag, Giełda zapisuje tekst z tokenem. Model
`strong` ze strumieniem (tekst, nie JSON), kartka edytowalna, „Kopiuj tekst” do dziennika, licznik znaków, Word
z metryczką i podpisami w tabelach.

**EduWycieczka (od 10.2026):** blok `WYCIECZKA_PROMPTS_START…END` w `eduwycieczka.html` (testy
`npm run wycieczka:check`). Rozporządzenie MEN z 25.05.2018 (Dz.U. 2018 poz. 1055, sprawdzone w ISAP): karta
wycieczki dokładnie według wzoru z załącznika (dyrektor ją zatwierdza – § 6 ust. 1) + lista uczniów z telefonem
rodzica jako załącznik (§ 6 ust. 3), regulamin i program opracowuje kierownik (§ 10), zgoda rodziców na piśmie
(§ 8), za granicą – § 7 (informacja dla organu i kuratora, NNW i KL, język). Liczby opiekunów rozporządzenie nie
narzuca (wyznacza dyrektor, § 9). Zgoda: telefon rodzica (potrzebny do listy), bez klauzuli przerzucającej na
rodzica odpowiedzialność za szkody (w czasie wycieczki nadzór sprawuje szkoła). Telefon kierownika nie trafia do
AI (token `[telefon kierownika]`), Giełda bez telefonu i nazwy szkoły. Dwa strumienie równolegle (dokumenty i gra,
`strong` = gpt-6.1-sol), odpowiedź w sekcjach. Wydruk: karta/regulamin/gra przez `printDoc`, zgody 2 × 124 mm na A4.

**EduWpisy (od 10.2026):** blok `WPISY_PROMPTS_START…END` w `eduwpisy.html` (testy `npm run wpisy:check`).
Rozporządzenie o dokumentacji przebiegu nauczania (t.j. Dz.U. 2024 poz. 50, sprawdzone w ISAP): do dziennika
wpisuje się tematy przeprowadzonych zajęć (§ 2 ust. 2, § 8 ust. 3, § 9 ust. 2), w e-dzienniku wpisanie tematu
potwierdza przeprowadzenie zajęć (§ 21 ust. 5), a rodzice mają wgląd (§ 21 ust. 3 pkt 5). Dlatego: bez dopisanych
aktywności i nazw terapii, bez imion i diagnoz (dawny „Moduł SPE” z ASD/ADHD wpisywał diagnozy do tematu
widocznego dla rodziców całej klasy) – zamiast tego formy pracy (`ADAPTATIONS`, test pilnuje braku diagnoz).
Klasy 1, 2, 3 osobno: nazwy edukacji według podstawy obowiązującej w danym roku (ruch drogowy: 2017 →
edukacja przyrodnicza, 2026 → techniczna i informatyczna). Warianty w sekcjach, `strong` ze strumieniem,
wspólny dzienny limit (`executeWithLimitCheck`).

**Awans zawodowy – która ścieżka, jaki dokument (sprawdzone w ISAP 7.10.2026):** po reformie (rozporządzenie
z 6.09.2022, Dz.U. 2022 poz. 1914) na **dyplomowanego** do wniosku dołącza się „opis i analizę sposobu realizacji
wymagań” z § 7 ust. 1 z uzyskanymi efektami – najwyżej 4 strony A4, czytelny podpis (§ 5 ust. 1 pkt 4; art. 9b
ust. 2b KN); pkt 4 spełnia jedno z zadań lit. a–e. Na **mianowanego** nie ma sprawozdania – komisja egzaminacyjna
zna opinię o zajęciach i ocenę pracy, a egzamin dotyczy wymagań z § 6 (§ 10). „Plan rozwoju zawodowego”
i sprawozdanie zostały tylko dla stażu na dotychczasowych zasadach (art. 10 ust. 1 i 5 – kontraktowy do
31.08.2027; art. 11 – staż na dyplomowanego rozpoczęty przed 1.09.2022) oraz w KN dla szkół za granicą.
`eduawans.html` (edytor z fragmentów): ścieżki `PATHS`, wymagania § 7 ust. 1 / § 6 w `AWANS_DATA`, szablony
z `[uzupełnij]` i zapisem `{am|em}` (`gText`, przełącznik formy), licznik stron, AI strumieniem. `awans.html`:
tryb nauczyciela wybiera `DOC_TYPES.dyplomowany` (opis i analiza) albo `nauczyciel` (sprawozdanie ze stażu) według
pola „Cel awansu” (`LEVEL_DYPL`/`LEVEL_STAZ`). Linia `const docType = DOC_TYPES[mode]…` musi być jedną linią –
test `awans:check` wycina ją w vm.

**EduSprawdzian (od 7.10.2026):** blok `SPRAWDZIAN_PROMPTS_START…END` w `edusprawdzian.html` (testy
`npm run sprawdzian:check`), w `PAPER_TOOLS` testu dokumentów. `strong` ze strumieniem w sekcjach TEMAT / GRUPA A /
GRUPA B / opcjonalnie WERSJA DOSTOSOWANA / KLUCZ / ODPOWIEDZI; zadania tylko z wklejonego materiału (za mało
materiału = `[uzupełnij]`, nie zmyślone zadania), linki nie (AI ich nie otwiera). Kontrola klucza według wzorca
EduRymów: po napisaniu DRUGIE zapytanie (`balanced`, JSON) rozwiązuje zadania zamknięte BEZ klucza, a przeglądarka
porównuje z liniami `A1: B` z sekcji ODPOWIEDZI (`compareKeys`, odporne na zapis „B) jądro”, „PFFP”, „1c”); sumy
punktów i liczba zadań w grupach sprawdzane bez AI. Tabela punktów na oceny liczona lokalnie z progów WZO
wpisanych przez nauczyciela (localStorage; domyślne opisane jako przykładowe). Giełda: tylko kartki, nigdy wklejony
materiał (fragmenty podręczników). Wykładniki: `<sup>` – model przepisywał „(−2)^5” z materiału mimo instrukcji, więc
`caretToSup` zamienia `^` w przeglądarce, a do kontroli tekst idzie z `^( )` (`plainText` zrobiłby z 2<sup>5</sup> „25”).
`doc-tools`: `<p class="linia"></p>` (linia do pisania) i `<div class="page-break"></div>` działają na kartce, w druku,
w schowku i w .docx; `sanitizeHtml` przepuszcza `sup`/`sub` (Word: superScript/subScript). Zamiany „pod Worda”
robi tylko `clipboardHtml` – w `styledHtml` (wspólnym z wydrukiem) `<br>` zamiast podziału sklejał grupy A i B.

**CSP a obrazki z fal.media:** `connect-src` NIE obejmuje fal.media, więc `fetch(urlObrazka)` w przeglądarce kończy
się „Failed to fetch” (realny błąd w MagicLetters: obrazek opłacony, użytkownik dostawał błąd, licznik się nie
zwiększał). Obrazek z fal.media zamieniamy na dane przez `<img crossOrigin="anonymous">` + `<canvas>` (img-src
pozwala na https:, fal.media wysyła CORS) – tak robią EduPrezentacja (PPTX) i MagicLetters. Nie dopisuj fal.media do
`connect-src` „na szybko”.

**Wydruk – sprawdzanie bez drukarki:** kopia strony z wstrzykniętymi danymi wyniku → Chrome
headless `--print-to-pdf` → strony PDF do PNG (`pdfjs-dist` + `@napi-rs/canvas`). Tak wyszły:
baner cookies drukujący się na każdej stronie (naprawione w `cookie-consent.js`), cienie jako
czarne pasy (`* { box-shadow:none }` w druku), reguła `.flex { display:block }` psująca wnętrze
stron, siatka EduKomiksu w jednej kolumnie (szerokość wydruku < 768 px = brak `md:`).
EduBajka: ilustracje 170 × 113 mm, tekst do ~110 słów = jedna kartka A4 na stronę.

**Service Worker (`service-worker.js`, v4 od 7.10.2026):** strony, skrypty, style i dane ZAWSZE
najpierw z sieci (cache tylko offline), obrazki/czcionki z cache z odświeżaniem w tle, inne domeny
i `/api/` poza SW. Wcześniej (v3) wszystko poza stroną główną szło „najpierw z cache” – kto raz
otworzył narzędzie, nie dostawał poprawek. Nie wracaj do cache-first dla HTML/JS. Rejestracja
wszędzie jako `/service-worker.js?v=4`.

**Układ na telefonie:** 12 narzędzi z panelem bocznym (EduBajka, EduDekorator, EduDetox,
EduKalendarz, EduKatalog, EduMalarz, EduNotariusz, EduPDF, EduRaport, EduWakacje, EduWpisy,
MagicLetters) dołącza `layout-mobile.css`: poniżej 1024 px panel nad podglądem i zwykłe przewijanie
(wcześniej stały panel 320–380 px zasłaniał wynik), na komputerze układ kończy się równo pod menu.
Nowe narzędzie z panelem `<aside>` obok `<main>` = dołącz ten plik. Ruch z filmików (YouTube Shorts)
to głównie telefony – każdą zmianę wyglądu sprawdzaj też w widoku 375 px.
Przegląd wszystkich stron w 375 px (7.10.2026): 20 stron przewijało się w bok (do 559 px). Przyczyny, które
się powtarzały: poświata `.hero-glow` ze starych stylów (`width: 1000px` + `translateX(-50%)`, 15 stron –
`edubox-ui.css` przycina ją do szerokości ekranu), element `flex-1` obok paska bocznego bez `min-w-0`,
siatka bez `grid-cols-1` (jedyna kolumna rośnie do szerokości tekstu z `truncate`), pasek przycisków bez
`flex-wrap`, dekoracja z ujemnym `-right-*`, panel `w-72` obok treści na każdej szerokości (Asystent
Pedagoga – teraz nad treścią poniżej `lg`). Tabele w `doc-paper.css` nie łamią już wyrazów w połowie
(szeroka tabela przewija się w obrębie kartki). Szybki test: po wczytaniu strony w emulacji telefonu
`document.documentElement.scrollWidth` ma być 375.

**EduPrezentacja / PptxGenJS (7.10.2026):** `slide.addImage({ data })` przyjmuje WYŁĄCZNIE base64 – link https
z fal.media zapisuje się bez błędu, ale w pliku ląduje uszkodzony obrazek. Obrazki idą przez `<canvas>` do
JPEG (`toSlideImage`, max 1280 px; fal.media ma CORS). Darmowy użytkownik ma 1 grafikę na start, więc
„Otwórz prezentację” i PPTX muszą działać bez kompletu grafik (slajd bez obrazka = tekst na całą szerokość).
Quiz: odpowiedzi A/B/C na slajdzie, poprawna tylko w notatkach. Podgląd slajdu skaluje się jednostkami
`cqw` (`.slide-frame`), więc na telefonie i rzutniku wygląda tak samo; pełny ekran działa też dotykiem
(prawa/lewa połowa) i na iPhonie (bez API pełnego ekranu – sama nakładka z przyciskiem zamknięcia).

**Podstawa prawna NIGDY od AI (od 10.2026):** modele halucynują numery artykułów i paragrafów, więc
instrukcja dla AI zawiera zakaz powoływania przepisów, a blok „Podstawa prawna” dokleja kod z aktów
sprawdzonych w ISAP (wzorzec: stała `AKTY` + `withLegal()` w `awans.html` – wstawia blok pod metryczką,
nie po miejscu na podpis). Cytujemy na poziomie aktów (bez numerów jednostek, których nie weryfikowaliśmy),
z „z późn. zm.”, i dorzucamy zastrzeżenie, że szczegóły zależą od regulaminu/statutu placówki.
`npm run awans:check` (`scripts/check-awans.js`) pilnuje tego automatycznie – m.in. zestawia cytowany
tekst jednolity Karty Nauczyciela ze snapshotem w `legal-acts.json`, więc po `npm run legal:update`
trzeba poprawić też `AKTY.kn`. Uwaga przy starych narzędziach: eksport „.doc” jako HTML z mime
`application/msword` wymieniamy na `EduDocTools.downloadDocx`, a regexy w stylu `/\\n/g` z plików
`<script type="text/babel">` nie łapią enterów (szukają znaku `\` i `n`) – realny błąd w `eduawans.html`.

**Zasada „nie dopisuj faktów" (od 10.2026, pilnowana testem):** generatory dokumentów mają w instrukcji
zakaz wymyślania liczb, nazw, cytatów, celów i efektów; braki zostają jako `[uzupełnij: …]`, a długość
wynika z notatek. `scripts/check-dokumenty.js` blokuje zwroty, które to łamały – realnie znalezione
w kodzie: „minimum 3 rozbudowane akapity" i „żelazna tarcza ochronna” (EduNotariusz), „podniosły ton”,
„bogate słownictwo pedagogiczne”, „minimum 2 rozbudowane akapity” i przykład „swobodna eksploracja”
(EduRaport), „lany tekst” (Kreator Awansu). Test rozpoznaje negację, więc *zakaz* w instrukcji
(„bez podniosłego tonu”) jest w porządku – wywala tylko polecenie. Komentarze liniowe są pomijane,
żeby można było opisać, co usunięto.

**Dane osobowe poza zapytaniem do AI:** pola, w które nauczyciele wpisują imiona (uczestnicy rozmowy,
nazwa wydarzenia, imię i nazwisko), NIE trafiają do promptu. Model pisze token (`[imię i nazwisko]`,
`[uczestnicy]`, `[nazwa]`, `[grupa]`), a przeglądarka podmienia go na kartce; publikacja wzoru w Bazie
wstawia token z powrotem, także z ręcznych poprawek. Wartość zamrażamy w chwili generowania
(`docName`/`docPeople`/`docMeta`) – gdyby kartka czytała pole na żywo, dopisanie nazwiska po
wygenerowaniu zmieniłoby `baseHtml` i React nadpisałby poprawki nauczyciela.

**Wspólna warstwa wyglądu `edubox-ui.css` (od 10.2026):** każde narzędzie miało własny blok `<style>`
z tymi samymi klasami (`.glass-panel`, `.aura-blob`, `.btn-bounce`, `.text-gradient`), każdy trochę inny
i w stylu 2021: neonowe `shadow-[0_0_20px_rgba(...)]` pod każdym przyciskiem, `blur(24px)`, trzy pływające
bąble. Plik definiuje je raz, spokojniej: tokeny `--eb-*`, powierzchnie z prawdziwym cieniem zamiast
poświaty, komponenty `.eb-btn`, `.eb-field`, `.eb-segment` (z `aria-pressed`), `.eb-chip`, `.eb-note`,
`.eb-toolbar`, `prefers-reduced-motion`, widoczny `:focus-visible` i reguły wydruku.
**Link musi stać PO wewnętrznym `<style>` strony** – przy tej samej specyficzności wygrywa kolejność
(test to sprawdza). Narzędzie zmienia tylko akcent: `:root { --eb-accent: … }` w osobnym, późniejszym
`<style>` (test pilnuje, by po linku nie stał żaden inny `<style>` w `<head>` – wyjątkiem jest właśnie
blok akcentu). **Podpięte we wszystkich 60 stronach narzędzi.** Akcent każdej strony wyciągnięty z jej
własnego CSS (`.text-gradient` → `.aura-1` → `.hero-glow`), żeby ujednolicić powłokę, a nie pomalować
portfolio na jeden kolor. Kolor napisu na przycisku (`--eb-accent-text`) dobierany przez porównanie
kontrastu bieli i ciemności, nie progiem luminancji – próg dawał biały tekst na cyjanie (2,4:1).
Najgorszy kontrast w portfolio to teraz 4,78:1; `edustudio` dostał indigo-600 zamiast indigo-500, bo
przy 500 ani biel, ani czerń nie dobijały do 4,5:1. Neonowe poświaty wpisane w markup (124 wystąpienia
w 49 plikach) wygasza jedna reguła `[class*="shadow-[0_0_"]` z `!important` – bije nieimportantowe
utility Tailwinda niezależnie od kolejności wstrzyknięcia jego `<style>`, więc markupu nie trzeba
czyścić; `drop-shadow-[0_0_…]` to filtr, nie `box-shadow`, i tej reguły nie dotyczy. Styl wewnątrz JSX
(po `</head>`) celowo wygrywa nad warstwą wspólną. Uwaga: `sanitizeHtml` w `global-core.js` przepuszcza
tylko atrybut `class`, więc żadnego `<a href>` ani `style` w HTML-u wstawianym do kartki.

**Eksport do Worda – koniec z fejkowym „.doc" (10.2026):** wszystkie 20 narzędzi eksportujących
do Worda używa `EduDocTools.downloadDocx`. Wcześniej 10 z nich tworzyło plik `.doc`, który był
HTML-em z mime Worda – Word otwierał go z ostrzeżeniem, a Dokumenty Google potrafiły odrzucić.
`downloadDocx` przyjmuje teraz `align` (`center`/`justify`/`right`), `italic` i `size` (w półpunktach),
bo dyplom bez wyśrodkowania wychodził do lewej. Gdzie treść ma układ (bilety EduMotywatora:
`float` + obramowanie kreskowane), **nie** eksportuj akapitów – zbuduj `<table>` z DANYCH, bo
`htmlToDocxBlocks` wspiera tabele, a `div`/`span` tylko rozwija do tekstu i gubi układ.
Test: `npm i --no-save jsdom && npm run docx:check` (`scripts/check-docx.js`) uruchamia prawdziwą
konwersję HTML→bloki docx na atrapie biblioteki `docx`; celowo poza `npm test`, ta sama konwencja
co `docx@9` w generatorze wzorów.

**Wydruk – jedna reguła dla całego portfolio (od 10.2026):** `body { color: black }` w `@media print`
nie wystarcza, bo tailwindowe klasy na dzieciach biją je specyficznością. Jasnoszary tekst
(`text-slate/gray/zinc/neutral` `-300/-400/-500` – **1284 wystąpienia w 58 plikach**) to podpisy
i podpowiedzi zaprojektowane pod ciemny panel; na papierze mają kontrast 2,56:1, czyli są
praktycznie niewidoczne. Załatwia to jedna reguła w `edubox-ui.css` w `@media print`: selektor po
fragmencie atrybutu `class` z `!important`, kolor `#374151` (10,3:1 na bieli – czytelne, a tekst
drugiego planu zostaje drugim planem). Działa tylko przy druku, ekran bez zmian. **Celowo NIE ruszamy
`text-white`:** w dekoratorach (MagicLetters, EduWystrój, EduGenerator, EduMalarz, EduDyplomy,
EduPiktogram) biały napis na kolorowym tle jest zamierzony i tam wydruk ma być kolorowy – te
narzędzia mają w spisie „nie dotyczy". Narzędzia z własną regułą czerni na potomkach kontenera
(`#print-container *`, `main *`, `.a4-page *`) albo z `printDoc` też się liczą.
Realny błąd znaleziony przy tym przeglądzie: `edusymbol.html` nie miał `@media print` WCALE,
a siatka kart ma inline `maxHeight: calc(100vh - 250px)` i `overflow-y-auto` – drukowało się tylko
to, co widać na ekranie, resztę kart ucinało. Przy takich siatkach zdejmuj styl inline przez
`!important` w bloku druku.

**Modele graficzne Fal.ai – jedno miejsce i jak je testować (od 10.2026):** `api/_lib/falModels.js`
(nie liczy się do limitu 12 funkcji) trzyma adresy i parametry WSZYSTKICH modeli: łańcuch narzędzi
publicznych (`gpt`, `gptEdit`, `flux2`, `flux2Edit`, `recraft` – kolejność prób w `api/_lib/imageModels.js`),
ostatnie zapasy i EduInfluencer (`text` = flux/dev, `design` = recraft-v3, `imageToImage` = SDXL)
oraz powiększanie (`upscale` = Recraft Crisp, `upscaleFallback` = ESRGAN ×2). Wcześniej te same liczby
stały osobno w `generate.js`, `malarz.js`, `ewa-generate.js` i `upscale.js`. Testy:
`node api/_lib/falModels.test.js` (w `npm test` przez `npm run api:check`) – cicha zmiana modelu albo
parametrów jest niemożliwa (świadoma zmiana wymaga poprawienia testu); pilnują też, że łańcuch używa
wyłącznie adresów z rejestru, że pierwsza próba to GPT Image 2.5 i że Recraft V4.1 dostaje styl `any`.
**Ceny** są w `REVIEW.prices`: GPT Image 2.5 zmierzone na żywo (~0,014–0,02 USD za obraz), Recraft Crisp
0,004 USD (strona modelu), reszta oznaczona „do potwierdzenia”. Kandydat: **FLUX.2 [dev] Turbo** jako
tańszy zapas zamiast FLUX.2 pro. **NIE podmieniaj bez testu na żywo** – `flux/schnell` był już raz
wdrożony i wycofany („pszczółki" jako ptaki); odrzucone po testach 6.10.2026: Nano Banana 2, Seedream 4.5,
FLUX 3, Ideogram v3. Test bez wdrażania (tylko preview, chronione logowaniem Vercel): `/api/generate`
przyjmuje `testEndpoint` + `testPayload` (albo `openai-direct:<model>`), `/api/ewa-generate` –
`testFalEndpoint` + `testFalParams` (slug przez `SAFE_SLUG`, ochrona przed SSRF).
**Cykliczny przegląd:** `REVIEW` w tym samym pliku trzyma datę ostatniego przeglądu, zapisane ceny,
kandydatów i ostrzeżenie o schnellu – jako DANE, nie komentarz. `npm run fal:check`
(`scripts/check-fal-models.js`) kończy się błędem, gdy od przeglądu minęło >90 dni;
`.github/workflows/fal-models-check.yml` robi to 3. dnia miesiąca (czerwony przebieg = mail).
Celowo **nie** jest to automat sprawdzający ceny: fal.ai nie daje cennika w formie do rzetelnego
odczytu, a skrobanie strony dawałoby fałszywy alarm albo fałszywy spokój – skrypt pilnuje więc
tylko regularności i wypisuje konkretne kroki. Z tego samego powodu `fal:check` jest POZA
`npm test` (jak `legal:check`) – po 90 dniach załamałby CI na każdym PR.

**Kody PRO za wsparcie (Buycoffee.to):** `api/coffee-check.js` wydaje kod `KAWA-…` (7 dni, weryfikacja
w Make, scenariusz Coffee-Verify) albo – od 49 zł – `ROK-…` (365 dni od wygenerowania), który
`api/verify-code.js` sprawdza bezpośrednio w arkuszu `Coffee_Codes` (A kod, F data). Logika planu:
`api/_lib/coffeePlan.js` (testy `node api/_lib/coffeePlan.test.js`). Przeglądarka obsługuje oba typy
przez `bonus/until` (eduboxBonusUntil).

**Generowanie treści przez AI — wypracowane wzorce:**
- *Sekcje zamiast JSON przy strumieniu* (EduWycieczka): JSON nie płynie strumieniem, więc dostaje słabszy
  model (strong bez strumienia = gpt-5.4-mini). Gdy potrzebny jest najmocniejszy model, prosimy o odpowiedź
  w sekcjach `=== NAZWA ===` i dzielimy ją w przeglądarce (`splitSections` – odporne na brak polskich znaków
  w nagłówkach). gpt-5.4-mini potrafił wstawić słowo w obcym piśmie („bez अनुमति opiekuna”) – `plain()`
  zamienia obce pismo na żółte `[uzupełnij: słowo]`.
- *Dwuetapowy generator + weryfikator* (EduRymy): pierwsze zapytanie
  proponuje kandydatów swobodnie, DRUGIE, niezależne zapytanie (bez
  kontekstu "mają się ładnie rymować") ocenia surowo istnienie/poprawność —
  łapie halucynacje, których model nie widzi we własnym pierwszym przebiegu.
  Warto to wzorce powielać wszędzie, gdzie AI ma zwracać *fakty*, nie tylko
  kreatywny tekst.
- *Zablokowany opis wyglądu* dla powtarzalnych postaci (Ewa/Ada/Ania) — ten
  sam tekst opisu za każdym razem w prompt do fal.ai, inaczej AI losuje nową
  twarz przy każdym wywołaniu. W seriach obrazków (bajka, komiks, historyjka)
  dodatkowo pierwszy obrazek jako `reference_image` dla kolejnych – dopiero to
  daje tę samą twarz i ubranie; opisy scen twórz z GOTOWEGO tekstu (każdy obrazek
  pokazuje to, o czym czyta dziecko, z emocją z tej strony).
- *Rymy po polsku* (EduTik, EduKasia, rymowanki w Asystencie): tylko mocny model
  (`model: 'strong'` + `stream: true` → GPT-6.1); słabsze dawały pseudo-rymy
  („głowę/sowa”, „statek/tak”). Strumień nie przyjmuje trybu JSON – JSON wymusza
  instrukcja, a parser wycina obiekt z tekstu.
- *NVC + żargon PPP* (EduDialog): metoda "kanapki" (pozytyw → problem →
  propozycja) dla wiadomości do rodziców; sformalizowany żargon pedagogiczny
  dla opinii do Poradni (np. "bije innych" → "przejawia zachowania
  agresywne..."); zawsze anonimizacja (imię/nazwisko → inicjał) przed
  ewentualną publikacją w Bazie Wzorów.
- *AAC/SPE*: siatki do druku, sekwencje "Najpierw–Potem", prosty,
  jednoznaczny język.
- *"Jak to działa"* — info-box (ℹ️, 2–3 zdania + konkretny przykład) blisko
  góry formularza w każdym narzędziu, pisany z faktycznego czytania kodu
  strony, nie tylko opisu z `apps.js`. **Jest już we wszystkich 60 narzędziach**
  (klasa `.eb-note` ze wspólnej warstwy). Uwaga przy wstawianiu: gdy box ma
  wejść do `{stage === 'form' && (` albo innego warunku, musi być JEDNYM
  korzeniem — wkładaj go więc do środka panelu formularza, nie obok niego,
  inaczej Babel zgłasza „Unexpected token, expected ,". Numery linii z błędu
  Babela są względne do skryptu, nie do pliku.
- *Body payloady do serwerlessów*: zdjęcia zawsze skalować/kompresować przez
  `<canvas>` w przeglądarce PRZED wysyłką (base64 potrafi łatwo przebić
  limit ~4,5 MB na body zapytania na Vercelu — realny błąd, już naprawiany).

**Spis stanu portfolio — zacznij tutaj (od 10.2026):** `docs/STAN-PORTFOLIO.md` odpowiada na pytanie
„co jest już zrobione, a co zostało?" dla wszystkich 60 stron narzędzi: wzorzec kartki, strumień,
prawdziwy `.docx`, czysty wydruk, nowy wygląd, info-box „Jak to działa", wspólna pula limitów oraz
objęcie kontrolą ISAP. **Plik jest GENEROWANY** z faktycznych plików (`npm run stan`), nie pisany
ręcznie, więc nie może się rozjechać z rzeczywistością; `npm test` pilnuje aktualności
(`npm run stan:check`). Czytaj go na starcie sesji zamiast szacować na oko albo liczyć na pamięć —
sesja Claude Code zawsze startuje od zera i zna tylko repo + ten plik.
Kontrola przepisów działa po NUMERACH aktów: akt cytowany przez numer tekstu jednolitego albo noweli
(np. Dz.U. 2023 poz. 2572 → `DU/2019/373`, Dz.U. 2026 poz. 1122 → `DU/2019/373`, Dz.U. 2026 poz. 515 →
`DU/1982/19`) jest pilnowany pod numerem pierwotnym, bo snapshot ISAP wymienia jedno i drugie — bez tej
reguły raport krzyczałby o aktach, które są w porządku. Nowy plik cytujący przepis trzeba dopisać do
`usedIn` właściwego aktu, inaczej raport nie wskaże go do przeglądu po nowelizacji.

**Otwarte/niedawno zamknięte wątki** (stan na koniec tej sesji):
- Generator Wideo Ani: `stitch:true` dodane, żeby zmniejszyć nadmierne
  przybliżenie twarzy w wideo D-ID — **niepotwierdzone na żywo** (sandbox
  deweloperski ma zablokowany dostęp do sieci zewnętrznej, w tym do
  d-id.com, fal.ai, a nawet eduboxpro.pl — testy zawsze robi użytkownik).
  Znak wodny na wideo = oczekiwane ograniczenie triala D-ID, zniknie na
  planie płatnym.
  Persony (Ewa/Ada/Ania) traktowane jako świadomie ODDZIELNE tożsamości.
- EduPodsumowanie — celowo zostawione w stanie "działa, ale niezachwycające"
  (3 rundy poprawek graficznych, user zdecydował się nie iterować dalej).

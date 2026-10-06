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
  tekstowych. Body: `{ prompt, system, temperature, format: "json"|"text", model }`.
  `model` NIE trafia bezpośrednio do OpenAI — `resolveModelChain()` mapuje go
  na łańcuch modeli z automatycznym fallbackiem: `model: "strong"` (dokumenty
  urzędowe/prawne) próbuje `gpt-5 → gpt-4.1 → gpt-4o → gpt-4o-mini`; znany
  model z `KNOWN_MODELS` próbuje siebie, potem `gpt-4o-mini`; nieznany/pominięty
  → domyślnie `gpt-4.1-mini → gpt-4o-mini`. Klient nie może więc zażądać
  dowolnego (drogiego) modelu — whitelist chroni przed nadużyciem.
- Fal.ai (Flux Dev domyślnie, Recraft V3 dla grafiki projektowej przez
  `model: "recraft"`) — generowanie obrazów, przez `/api/generate.js`,
  `/api/malarz.js` i `/api/ewa-generate.js` (klucz `FAL_KEY`).
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
Nowy akt w treściach = dopisz go do `legal-acts.json`. Publiczna strona `przepisy-i-rodo.html`
(lista aktów, rejestr zmian, RODO) jest generowana przez `node scripts/generate-przepisy.js`
(rejestr zmian w tablicy `CHANGELOG`). Wzór opinii o funkcjonowaniu ucznia (.docx) generuje
`scripts/generate-opinia-docx.js` (wymaga `npm i --no-save docx@9`). Precyzja dat: rozporządzenie
Dz.U. 2026 poz. 428 obowiązuje od 14.04.2026, § 7 ust. 6–7 i § 8 od 1.09.2026; ocena zachowania
od 1.09.2026 – 9 obszarów z § 11 ust. 1 (Dz.U. 2026 poz. 1122); prace domowe – § 12a.

**RODO – minimalizacja danych:** `api/chat.js` przed wysłaniem do OpenAI usuwa numery PESEL
(`api/_lib/pii.js`, testy `node api/_lib/pii.test.js`; celowo NIE usuwa telefonów/e-maili/kont – nauczyciel
wpisuje własny kontakt do pism). Gdy coś usunięto, odpowiedź ma nagłówek `X-EduBox-PII-Removed`, a
`global-core.js` pokazuje krótki komunikat. Giełda Wzorów w EduOcena publikuje inicjał zamiast imienia
(także w treści oceny, z odmianą imienia). Treści AI nie są logowane.

**Kody PRO za wsparcie (Buycoffee.to):** `api/coffee-check.js` wydaje kod `KAWA-…` (7 dni, weryfikacja
w Make, scenariusz Coffee-Verify) albo – od 49 zł – `ROK-…` (365 dni od wygenerowania), który
`api/verify-code.js` sprawdza bezpośrednio w arkuszu `Coffee_Codes` (A kod, F data). Logika planu:
`api/_lib/coffeePlan.js` (testy `node api/_lib/coffeePlan.test.js`). Przeglądarka obsługuje oba typy
przez `bonus/until` (eduboxBonusUntil).

**Generowanie treści przez AI — wypracowane wzorce:**
- *Dwuetapowy generator + weryfikator* (EduRymy): pierwsze zapytanie
  proponuje kandydatów swobodnie, DRUGIE, niezależne zapytanie (bez
  kontekstu "mają się ładnie rymować") ocenia surowo istnienie/poprawność —
  łapie halucynacje, których model nie widzi we własnym pierwszym przebiegu.
  Warto to wzorce powielać wszędzie, gdzie AI ma zwracać *fakty*, nie tylko
  kreatywny tekst.
- *Zablokowany opis wyglądu* dla powtarzalnych postaci (Ewa/Ada/Ania) — ten
  sam tekst opisu za każdym razem w prompt do fal.ai, inaczej AI losuje nową
  twarz przy każdym wywołaniu.
- *NVC + żargon PPP* (EduDialog): metoda "kanapki" (pozytyw → problem →
  propozycja) dla wiadomości do rodziców; sformalizowany żargon pedagogiczny
  dla opinii do Poradni (np. "bije innych" → "przejawia zachowania
  agresywne..."); zawsze anonimizacja (imię/nazwisko → inicjał) przed
  ewentualną publikacją w Bazie Wzorów.
- *AAC/SPE*: siatki do druku, sekwencje "Najpierw–Potem", prosty,
  jednoznaczny język.
- *"Jak to działa"* — info-box (ℹ️, 2–3 zdania + konkretny przykład) blisko
  góry formularza w każdym narzędziu, pisany z faktycznego czytania kodu
  strony, nie tylko opisu z `apps.js`.
- *Body payloady do serwerlessów*: zdjęcia zawsze skalować/kompresować przez
  `<canvas>` w przeglądarce PRZED wysyłką (base64 potrafi łatwo przebić
  limit ~4,5 MB na body zapytania na Vercelu — realny błąd, już naprawiany).

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

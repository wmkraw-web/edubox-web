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
- OpenAI (`gpt-4o-mini` domyślnie, `gpt-4o` gdzie ważna dokładność) przez
  `/api/chat.js` — jeden wspólny endpoint dla WSZYSTKICH narzędzi tekstowych.
  Body: `{ prompt, system, temperature, format: "json"|"text", model }`.
- Fal.ai (Flux) — generowanie obrazów, przez `/api/generate.js` i
  `/api/ewa-generate.js` (klucz `FAL_KEY`).
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
- **biurokracja** (17): Asystent Pedagoga (IPET/WOPFU), EduReforma,
  Kreator/EduAwans, EduWycieczka, EduPrawo, EduBiurokrata, EduSprawozdawca,
  EduOcena, EduKorektor, EduWpisy, EduPDF, EduRaport, EduNotariusz.
- **zajecia** (22): EduScenariusz, Edukacja 2025, EduZadania,
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

**Limity darmowe:** 5 generowań tekstowych / dzień (`EduBoxCore.
executeWithLimitCheck`), 2 obrazkowe / dzień (`executeImageLimitCheck`),
kod PRO znosi limit (`localStorage.eduboxProStatus`, weryfikacja przez
`/api/verify-code.js`).

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

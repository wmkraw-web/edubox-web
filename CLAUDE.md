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
- **Make.com** – pełna, aktualna mapa wszystkich scenariuszy: dokument „EduBox – mapa automatyzacji Make”
  (https://claude.ai/artifact/JnaAWonK7oQY3mPyJSkcXQ, stan 22.10.2026; dawny Word z 31.08 = archiwum).
  YouTube Shorts – jeden film dziennie, dwie serie na zmianę według parzystości dnia roku
  (`formatDate(now; "DDD"; "Europe/Warsaw") % 2`, filtr na module 2 – na pierwszym module filtr nie działa):
  - *"Minuta z Adą"* (id 7048286) — dni NIEPARZYSTE 17:00, promuje jedno konkretne
    narzędzie z katalogu (arkusz `Ada_Katalog`, wiersz `DDD % 57 + 1`), stała
    postać "Ada" (kasztanowe włosy, ubranie w barwach indygo/ametyst), link w opisie do konkretnego
    narzędzia (nie strony głównej), w sob/nd też rolka na FB. Od 22.10.2026 5 palet (etykieta narzędzia
    + karta odpowiedzi) zmienianych co odcinek: zmienna `pal = floor(DDD/2) % 5` → `switch(1.pal; …)`.
  - *"YOUTUBE-Przerwa z Adą"* (id 8124770, od 22.10.2026) — dni PARZYSTE 17:00, wesoły Short: formaty
    `pov / slownik / plan / zgadnij` po kolei (`floor(DDD/2) % 4`), gpt-5 (`reasoning_effort` medium) pisze żart
    + JEDNO narzędzie z `Ada_Katalog`, 2 obrazki GPT Image 2.5 `edit` z Adą jako wzorem (napis wpisany w obrazek),
    głos Ady, kategoria Rozrywka, historia tematów w magazynie 229323 (rekord `przerwa-historia`).
    Kadr 9:16 = rozmyte tło z DOLNEJ połowy obrazka (`c_crop,h_0.5,g_south`) + cały obrazek 2:3 na środku –
    tło z całego obrazka pokazywało rozmytą kopię etykiety u góry. Zasady: żart z sytuacji, nie z dzieci,
    rodziców ani dyrekcji; bez imion.
    YouTube w Make idzie przez WŁASNY klient OAuth (Google Cloud, projekt `edubox-make`, klient „Make YouTube”,
    w produkcji, YouTube Data API v3 – tam wykresy błędów per metoda). „[403] Forbidden” z `uploadVideo`
    (8–21.10.2026, 5 razy) to NIE odrzucony film: `videos.insert` się udaje, a pada drugie wywołanie
    (`videos.update` z tytułem/opisem) – film wisi publicznie jako „unknown”. Trasa błędu modułu 11: 90 s
    przerwy → najnowszy film z playlisty wgranych (`UUmHtkuzDeX8RmyK6ykHijzA`) → gdy tytuł „unknown”,
    ponowne `PUT /v3/videos` i `Resume` z jego id (dalej playlista, mail, FB); gdy filmu nie ma – mail
    z załącznikiem do ręcznego wrzucenia. Nie każ wrzucać ponownie, gdy film już jest (duplikat).
  - *"YOUTUBE-ZanimKlikniesz Short"* (id 8115725, od 22.10.2026) — sobota 12:00, temat z zakładki
    `ZanimKlikniesz` (kol. A forma alert/quiz/gdyby, B nagłówek, C fakty; status YouTube w kol. **F**, FB = D,
    Pinterest = E), gpt-4.1 JSON (hook/tresc/ekran/tytul), tło fal flux/dev, 2 plansze Cloudinary, głos Agaty,
    Zvid, ta sama trasa błędu 403 co Minuta. Zastąpił „YOUTUBE-shorty-problemy-nauczyciela” (dublował Adę,
    miał klucz fal wpisany jawnie – usunięty).
  - *"WESOŁY PIĄTEK"* (od 22.10.2026, 3 scenariusze + magazyn danych „Wesoły piątek – propozycje” 228919):
    **1** (8116611, czw 18:00) – format z numeru tygodnia ISO (słownik / bingo / versus / pov / zgadnij), gpt-5 (`reasoning_effort`
    medium) pisze 2 warianty z katalogu `Ada_Katalog`, GPT Image 2.5 `quality: high` 1024×1536 (versus/pov przez `edit`
    z Adą jako wzorem postaci), zapis pod kluczem `GGGG-[W]WW`, mail do Witolda z przyciskami. Bezpiecznik: gdy rekord
    tygodnia już jest, nic nie robi (ponowne generowanie = usuń rekord). **2** (8116575, webhook 3956409) – przyciski
    Publikuj A/B/Pomiń (`t` = sekret w linku), zmiana zdania do publikacji. **3** (8116586, pt 15:00) – FB + Pinterest
    (tablica 807129633158572215) z UTM `wesoly-piatek`, temat dopisywany do rekordu `historia`. Bez kliknięcia nic nie
    wychodzi. Zasady w instrukcji: żart z sytuacji (nie z dzieci/rodziców), bez imion, bez wymyślonych świąt, w obrazie
    ŻADNYCH napisów poza zadanymi (model dorzucał błędne napisy na kubkach).
  - *Piny Pinterest – 3 serie dzienne* (od 22.10.2026 na GPT Image 2.5 `quality: medium`, ~0,02 USD/pin; wcześniej flux/dev
    + napis w Cloudinary – „kartka na korku / pusty notes” każdego dnia): **5327390** „Darmowe narzędzie AI” 8:30
    (`Tematy_Ogolne_PIN`, wiersz usuwany), **6941310** „Pokój nauczycielski” 19:50 (`Wrzesien_Bole`, kol. G),
    **5333588** „Pomysł na zajęcia” 15:00 (`Ada_Katalog`, rotacja wierszy). Każda seria ma 5 układów zmienianych
    co dzień (`switch((DDD + przesunięcie 0/2/4) % 5)` w module 80): narzędzie – makieta / przed-po / 3 kroki / scena
    z Adą / „15 sekund”; pokój – scena i komiks z Adą / dymek / zamiast-spróbuj / 3 porady; pomysł – kroki / flat-lay /
    checklista / scena z Adą / planer. gpt-5 (`reasoning_effort: low`, JSON `narzedzie/tytul/opis/prompt_obrazu`)
    wypełnia szablon układu dnia; etykietę serii, „eduboxpro.pl”, paletę i zakaz innych napisów dokleja Make (moduły
    86/87). Układy z Adą idą przez `edit` z jej zdjęciem (strój na sztywno: indygo marynarka + ametystowa bluzka).
    Ciało pina do `/v5/pins` przez `json:TransformToJSON` (cudzysłowy w opisie nie psują JSON-a). Nazwa narzędzia
    na grafice = krótka (1–3 słowa) – w teście model wpisał cały tytuł strony z `Tematy_Ogolne_PIN`. Test bez
    publikacji: kopia scenariusza z `builtin:BasicFeeder` (lista układów → zmienna 80) i zapisem do magazynu 228919
    zamiast Pinteresta i arkusza.
  - *Blog i „Co nowego” – automat wpisów* (od 22.10.2026, magazyn „Publikacje – propozycje” 229323, webhook 3958930):
    **BLOG 1** (8123685, wt 9:00) – pierwszy wolny temat z `Blog_Tematy` (kol. C pusta; kategorie Prawo oświatowe / Awans
    zawodowy / Podstawa programowa pomijane – te wpisy pisze właściciel po sprawdzeniu w ISAP), gpt-5 medium pisze JSON
    `title/excerpt/category/icon/content`, kol. C = „propozycja – data”, mail z podglądem i Publikuj/Pomiń.
    **CO NOWEGO 1** (8123701, pn 9:00) – commity z 7 dni (GitHub API, bez commitów bota) → gpt-5 wybiera 0–3 zmiany
    widoczne dla nauczycieli → mail. **PUBLIKACJE 2** (webhook) – klik → `repository_dispatch` `add-blog-post` /
    `add-co-nowego` przez zapisany w Make klucz HTTP (keychain 220360, nagłówek Authorization; token NIE w blueprincie). Webhook (8123722)
    sprawdza sekret `t` w linku i status „czeka” – drugi klik daje „link nieaktualny”. Bez kliknięcia nic nie wychodzi.
    **Strona GitHuba:** `scripts/publikacje.js` buduje wpis z danych (AI nie pisze kodu JS): czyści HTML do p/h2/h3/
    ul/ol/li/strong/em/a, linki tylko do istniejących stron z `publicPages`, odrzuca numery przepisów (`art. 5`, `§ 6`,
    `Dz.U.`, `ust.`, `poz.`), 350–1600 słów, unikalny slug; błąd = czerwony przebieg i mail, blog bez zmian. Dawny
    `add-blog-post` wklejał surowy obiekt JS od gpt-4o-mini, a scenariusz „Blog_Tematy_DOBRY” chodził co 15 min bez
    oznaczania tematu (ten sam wpis w kółko) i miał token GitHuba jawnie – usunięty. **Bez AI i bez akceptacji:**
    `co-nowego-auto.yml` (codziennie ~19:17 + push `apps.js`) – nowe pakiety z Firestore (odleżane 2 h, kilka naraz =
    jeden wpis z linkiem `materialy.html?…`) i nowe kafelki z `apps.js`; ogłoszone są w `data/co-nowego-stan.json`.
    Wpisy mają opcjonalne pole `link` („Zobacz →” w `co-nowego.html`). Testy: `publikacje:check` (w `npm test`).
- **GitHub Actions** (`.github/workflows/`):
  `health-check.yml` (co 6h — sprawdza WSZYSTKIE strony .html i endpointy
  /api, alert mailem przez Resend jeśli coś nie odpowiada),
  `costalert.yml` (codziennie — koszty OpenAI/Fal.ai),
  `coffee-check.yml` (co 5 min — wpłaty buycoffee.to → kod PRO),
  `weekly-report.yml` (poniedziałki — raport tygodniowy).
  **Porada dnia** (od 22.10.2026) NIE idzie już przez Make ani AI: `porada-dnia.js` ma stałą pulę
  (`OGOLNE` + `SEZON` na miesiące) i sam wybiera poradę według daty (`pick`, co 3. dzień sezonowa);
  testy `porada:check` (długość, duplikaty, zakaz przepisów i diagnoz, liczba ogólnych niepodzielna przez 7).
  Dawny scenariusz Make 6969697 i workflow `update-porada-dnia.yml` usunięte – porada stała od 18.09.
  **Polecenia:** `EduBox-Referral-Signup` (7007023) po zapisie e-maila od razu tworzy kod `EDU-…` w
  `Referral_Codes` i wysyła go (Gmail edubox.ai); gdy kod czeka niewykorzystany – wysyła go ponownie.
  Dawny osobny `Referral-GenerateCode` był wyłączony od 28.08 i nikt nie dostawał kodów – usunięty.

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
  **Od 18.10.2026 pięć źródeł postów** (zakładki): narzędzie z katalogu, dzień z EduKalendarza (najbliższe 60 dni,
  z pasującymi pakietami; link `edukalendarz.html?m=10&swieto=<nazwa>` otwiera od razu kreator święta), pakiet z Bazy
  Materiałów (katalog czytany REST-em z Firestore; grafiką może być okładka-pin; link `materialy.html?sekcja=…&pakiet=<id>`,
  przy kilku pakietach na jedno święto `materialy.html?szukaj=<nazwa>`), własny temat (AI dobiera 1–2 narzędzia WYŁĄCZNIE
  z listy – `parsujOdpowiedz` odrzuca resztę) i plan tygodnia (`planTygodnia` bez AI: święto ~3 dni wcześniej, pakiet
  najwyżej raz, reszta narzędzia; szkice pisane po kolei, bez zdjęć). Logika i instrukcje w `ewa-tematy.js`
  (`window.EwaTematy`, testy `ewa:check`), daty świąt w `kalendarz-dane.js` – wspólnym z `edukalendarz.html`
  (nowe święto dopisuj TYLKO tam). Pinterest: dodatkowo tytuł pina i słowa kluczowe. Adresy wpisane przez AI w treść
  są wycinane – link dokleja system.
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
Kod PRO znosi limit (`localStorage.eduboxProStatus`, weryfikacja przez `/api/verify-code.js`). **Status ma DWA zapisy:**
`'active'` (menu) i `'PRO'` (strona główna, nowsze narzędzia) – każda własna bramka musi uznawać oba
(`['active', 'PRO'].includes(…)`); 34 narzędzia uznawały tylko `'active'` i dawały limit osobom z kodem ze strony
głównej (naprawione 8.10.2026, `dokumenty:check` pilnuje każdego porównania).
ZanimKlikniesz nie ma limitu dziennego (`freeForever`).
**Limit tylko na generowanie przez AI (decyzja właściciela 8.10.2026, `npm run limits:check`):** druk i publikacja
w Giełdzie NIE zużywają puli, a narzędzia bez AI nie mają limitów wcale – ich kafelki mają `freeForever: true`
(„Zawsze za darmo, bez limitów”: EduGry, BINGO, EduGrupy, EduBystrzak, EduTimer, EduOddech, EduPDF, Baza Druków,
EduKatalog). Wcześniej każde zakręcenie kołem w EduGrupach, druk w EduGrach/EduBystrzaku/EduGeneratorze i publikacja
w 8 narzędziach zabierały 1 z 5 dziennych generowań całego EduBoxa; BINGO miało dla darmowych max 5 plansz.
Test pilnuje, że funkcje `*Print*`/`*Share*`/`*Publish*` nie wołają `executeWithLimitCheck`. **EduGrupy nie mają
Giełdy** – „Udostępnij swoją Listę” publikowało listę klasy z imionami uczniów (Giełda była pusta); lista zostaje
tylko w przeglądarce.

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

**Teczka podopiecznych (`podopieczni.html` + `podopieczni-core.js`, od 21.10.2026):** prywatne narzędzie dla
wychowawczyni przedszkola specjalnego (żona właściciela) – karty dzieci (KS, WWRD, „Za życiem”), dokumenty z poradni
z datą ważności, terminy, obserwacje, generowanie dokumentów i porady. **Dane dzieci tylko w przeglądarce**, w jednym
zaszyfrowanym wpisie `localStorage.eduboxPodopieczniV1` (PBKDF2-SHA256 310 000 iteracji + AES-GCM 256, klucz tylko
w pamięci karty, blokada po 15 min bezczynności, kopia zapasowa = ten sam zaszyfrowany plik; hasła nie da się odzyskać).
Strona celowo NIE ładuje Firebase, GA, `global-core.js`, menu ani cookie-consent (test to pilnuje) i ma przypięte wersje
bibliotek z CDN. Brak kafelka w `apps.js`, `noindex`, w `excludedPages` i `robots.txt`; bez Basic Auth – ochroną jest
szyfrowanie (strona sama nie zawiera danych). **Do AI idzie tylko anonimowy opis:** `aiInput`/`adviceText` budują
wejście dla `EduAsystentDocs.buildUserPrompt` i `EduSosPrompts` (te same sprawdzone instrukcje co Asystent Pedagoga),
`scrub` zamienia imię/nazwisko/zdrobnienia w odmianie na `[imię]`, PESEL, datę urodzenia, numery dokumentów i poradnie
z karty oraz każdy zapis „nr …” na tokeny; grupy, numerów i poradni w ogóle nie wysyłamy. Przed KAŻDYM `streamChat`
jest `assertNoLeak` (`leaks()` – wstrzymuje wysyłkę), a strona pokazuje „Co dokładnie trafi do AI”. Imię wraca dopiero
na kartce (`fillName` + `[imię]` → imię). Testy: `npm run podopieczni:check` (w `npm test`) – także pełne zapytania
dla wszystkich typów dokumentów KS i WWRD bez żadnej danej identyfikującej. Nowe pole z danymi dziecka = albo tylko
lokalne, albo przez `scrub`; nigdy prosto do promptu.
**Teczka – dwa hasła i dokumenty (21.10.2026, wersja sejfu 2):** dane szyfruje losowy klucz danych, „zawinięty”
osobno każdym hasłem (`slots`, max 5: codzienne żony + zapasowe Witolda; `addPassword`/`changePassword`/`removePassword`,
nie da się usunąć jedynego ani tego, którym otwarto). Sejf v1 otwiera się i zapisuje jako v2. **Wczytywanie PDF / Word /
zdjęć / skanów** (`readDocument` w stronie): pdf.js 3.11.174 i mammoth 1.8.0 z cdnjs, skan (PDF bez tekstu, max 15 stron)
i zdjęcie → OCR tesseract.js 5.1.1 (słownik `pol` z jsdelivr) **w przeglądarce** – skanu z PESEL-em i adresem nie wysyłamy
do żadnego OCR w chmurze. Dlatego `vercel.json` ma osobne CSP dla `/podopieczni.html` (`'wasm-unsafe-eval'`,
`worker-src blob:`, bez analityki i Firebase, `no-store`), a globalna reguła ma `source` z wykluczeniem tej strony –
nie dopisuj `wasm-unsafe-eval` do CSP całego serwisu. Dane z nagłówka dokumentu (imię, PESEL → data urodzenia, numer,
daty, poradnia, „ze względu na”) rozpoznaje `extractIdentity` lokalnie; do AI idzie `anonymizeDocText` (wycina linie
z danymi osobowymi, adresy, telefony, e-maile, nazwę poradni w każdej odmianie, „miejscowość, dnia …” + `scrub`)
i AI zwraca JSON opisu do karty (`cardExtractionPrompts`/`parseCardJson`), który nauczycielka zatwierdza (dopisz /
zastąp / pomiń). Treść dokumentów (zaszyfrowana w karcie) idzie jako materiał do kolejnych dokumentów (`docsText`).
`nameVariants` dokleja popularne zdrobnienia (`DIMINUTIVES`: Katarzyna → Kasia…) – realny wyciek z testu: zdrobnienie
z dokumentu nie trafiło do karty; krótkie imiona mają jawne formy odmiany (`shortForms`, żeby „Ala” nie zjadała „ale”).

**Moje Zdrowie (`zdrowie.html` + `zdrowie-core.js`, od 27.10.2026):** prywatna kartoteka zdrowia właściciela (jedna
osoba, nie narzędzie dla nauczycieli): dokumenty ze skanów, terminarz wizyt, leki z dawkowaniem i zapasem,
przypomnienia, kartki do druku. **Dane tylko w przeglądarce**, w jednym zaszyfrowanym wpisie
`localStorage.eduboxZdrowieV1` (ten sam sejf co w Teczce podopiecznych: PBKDF2-SHA256 310 000 + AES-GCM 256,
losowy klucz danych „zawinięty” osobno każdym hasłem, do 5 haseł, klucz tylko w pamięci karty, blokada po
bezczynności, kopia zapasowa = ten sam zaszyfrowany plik; hasła nie da się odzyskać). Strona celowo NIE ładuje
Firebase, GA, `global-core.js`, `apps.js` ani menu, ma przypięte wersje bibliotek i **wychodzi na zewnątrz wyłącznie do własnych
endpointów** `/api/chat` i `/api/describe-image`, i tylko po kliknięciu (test pilnuje adresów i braku XHR). Brak kafelka w `apps.js`, `noindex`, w
`excludedPages` i `robots.txt`; **dodatkowo Basic Auth** – `/zdrowie.html` jest w matcherze `middleware.js`
(`EWA_AUTH_USER`/`EWA_AUTH_PASS`), czyli hasło HTTP to pierwsza warstwa, a hasło szyfrujące druga.
**Wczytywanie PDF / Word / zdjęć / skanów** jak w Teczce (pdf.js 3.11.174, mammoth 1.8.0, OCR tesseract.js 5.1.1
w przeglądarce, max 15 stron) – dlatego `/zdrowie.html` ma w `vercel.json` własne CSP (`'wasm-unsafe-eval'`,
`worker-src blob:`, bez analityki i Firebase, `no-store`), a globalna reguła wyklucza i `podopieczni.html`,
i `zdrowie.html` – nie dopisuj `wasm-unsafe-eval` do CSP całego serwisu. Dane z nagłówka dokumentu (rodzaj, data,
placówka, lekarz, PESEL → data urodzenia) rozpoznaje `extractDocInfo` lokalnie, bez AI.
**Leki:** `dawki` to pory `{pora, ile}`, `dni` to `'codziennie'` albo numery dni tygodnia (1 = pon). Zapas podaje
się RAZ (`zapas: {sztuk, odDnia}`), a `supply()` odlicza go sam – przy dawkowaniu „pon/śr/pt” po średniej
tygodniowej. `alerts()` zbiera kończące się opakowania (domyślnie 14 dni przed) i nadchodzące wizyty.
**Przypomnienia:** pewne daje kalendarz telefonu – `medEvents`/`visitEvents` + `buildIcs` generują plik .ics
z czasem „pływającym” (bez TZID i bez `Z`, czyli w strefie urządzenia – dzięki temu nie trzeba bloku VTIMEZONE)
i z `VALARM`. Głos (`speechSynthesis`) i powiadomienia działają TYLKO przy otwartej karcie – to dodatek, nie
budzik. W pliku .ics celowo nie ma nazwiska ani nazwy choroby (kalendarz bywa synchronizowany z chmurą).
**Sprawdzanie leków jest MECHANICZNE, nie farmakologiczne** (`checkCombo`): ta sama substancja czynna w dwóch
preparatach, dwa NLPZ, NLPZ z lekiem rozrzedzającym krew, dobowa dawka paracetamolu > 4000 mg i uczulenie
wpisane w profilu. Nazwy handlowe mapuje `NAZWY_HANDLOWE` (Apap → paracetamol, Tritace → ramipryl…). Zasada jak
w ZanimKlikniesz: **nigdy „można wziąć” ani „to bezpieczne”** – tylko co sprawdzić i „zapytaj farmaceutę”,
plus link do Rejestru Produktów Leczniczych. Nowa reguła = taka, którą da się policzyć bez wiedzy medycznej.
**Anonimizacja gotowa pod etap 2 (AI):** `aiInput` buduje opis z wieku, płci, chorób, uczuleń i leków, `scrub`
wycina imię, zdrobnienie i nazwisko w odmianie, PESEL, datę urodzenia, telefony, e-maile, adresy, **nazwiska
lekarzy z wizyt i leków** oraz nazwy placówek, a `leaks()` jest ostatnią bramką przed wysyłką. Ustawienia
pokazują podgląd „Co zobaczyłaby sztuczna inteligencja”. Testy: `npm run zdrowie:check` (w `npm test`).
**Urządzenia wszczepione (`TYPY_URZADZEN`, od 27.10.2026):** kardiowerter (ICD), CRT, stymulator, ILR, pompa,
port, zastawka, implanty. Każdy typ ma własny cykl kontroli i gotowe ostrzeżenie o badaniach obrazowych, do tego
pole MRI (warunkowo / niedopuszczone). `nextCheck` liczy termin z ostatniej kontroli i cyklu (ręczna data wygrywa),
kontrola wchodzi do `alerts()` i do `deviceEvents()` → .ics. **Ostrzeżenie o MRI jest na karcie ICE w ramce na samej
górze** – to jedyna informacja, która musi dotrzeć do ratownika i radiologa natychmiast. Protokół z kontroli wczytuje
się jak dokument (OCR lokalnie) i AI objaśnia go słowami; instrukcja ZABRANIA oceniania, czy urządzenie działa
prawidłowo. **Numer seryjny, szpital i lekarz nie wychodzą do AI** (`serialPhrases` w `scrub` i `leaks`), producent
i model wychodzą – mają znaczenie medyczne.

**Zmiany skórne (`skora`, od 27.10.2026):** dziennik obserwacji, nie rozpoznawanie. Zmiana ma oś czasu wpisów
(data, rozmiar w mm, dolegliwości, zdjęcie), checklistę ABCDE i epizody leczenia z podziałem `kto: 'ja' | 'lekarz'`,
czasem trwania i oceną efektu 0–5 – `treatmentSummary` zestawia jedno z drugim. `skinWarnings` liczy **lokalnie,
bez AI**: wzrost rozmiaru między wpisami, „krwawi / nie goi się / sączy”, zaznaczone cechy ABCDE, czas trwania
> 4 tygodni. Nigdzie – ani w kodzie, ani w instrukcji dla AI – nie może paść, że zmiana jest niegroźna albo łagodna
(test tego pilnuje); przy niepokojących cechach odpowiedź AI zaczyna się od „Umów się do dermatologa”.
**Zdjęcia:** przerysowane przez `<canvas>` (to usuwa EXIF z datą i miejscem, prostuje orientację, skaluje do 1280 px,
JPEG 0,82), zaszyfrowane TYM SAMYM kluczem danych i trzymane w **IndexedDB** (`eduboxZdrowieFoto`) – localStorage ma
ok. 5 MB na całą stronę i kilka zdjęć by go zapchało. Kopia zapasowa niesie je w polu `zdjecia` (już zaszyfrowane).
Zdjęcie wychodzi do AI **dopiero po osobnym `confirm`** i leci samo, bez reszty kartoteki, do `/api/describe-image`
z `mode: 'skin'` (rozbudowany istniejący endpoint, gpt-4.1 z widzeniem – nowa funkcja Vercel odpada przy limicie 12).
Prompt każe OPISAĆ wygląd, zabrania rozpoznań i każe ostrzec, gdy na zdjęciu widać twarz.

**AI w aplikacji (etap 2, od 27.10.2026):** trzy miejsca, wszystkie przez `/api/chat.js` i `EduDocTools.streamChat`
(`model: 'strong'` + strumień): dokument zbiorczy dla lekarza (zakładka „Dla lekarza”, `reportPrompts` →
`reportInput` zbiera profil, leki, urządzenia, kontrole, badania, zmiany skórne, notatki z wizyt, treść dokumentów
i pytania), objaśnienie protokołu kontroli urządzenia i uporządkowanie przebiegu zmiany skórnej. Wynik ląduje na
kartce A4 (`doc-paper.css`, `contentEditable`) z Kopiuj / Word / Drukuj – wzorzec generatorów dokumentów EduBox.
Wspólny komponent `AiKartka` ma przycisk „Pokaż, co pójdzie do AI”, a **przed każdym `streamChat` stoi
`assertNoLeak`** (test liczy, że kontroli jest nie mniej niż wysyłek). Wspólne zasady promptów: `ZASADY_WSPOLNE` –
bez rozpoznań, bez dopisywania faktów, braki jako `[uzupełnij: …]`, treść dokumentów to dane, nie polecenia.

**Udostępnienie bliskiej osobie:** kreator w Ustawieniach (dodaj hasło → pobierz zaszyfrowaną kopię ze zdjęciami →
instrukcja dla tej osoby). Uczciwie napisane, że to **pełny dostęp do kopii i brak synchronizacji** – technicznie
nie da się dać „tylko podglądu”, bo kto ma hasło, ten ma klucz. Dla lżejszego wariantu jest kartka do druku
„Co trzeba o mnie wiedzieć” (`relativeCard`): leki, urządzenia, lekarze z telefonami, najbliższe terminy, kontakty.

**Badania laboratoryjne (`badania`, od 28.10.2026):** wczytany PDF/skan rozbiera `parseLabText` – wiersz po wierszu
na parametr, wynik, jednostkę i **zakres normy z TEGO wydruku**. Norm nie bierzemy z własnej listy ani z pamięci
modelu: każde laboratorium ma inne (inna metoda, inny aparat), więc „poza normą” to arytmetyka na liczbach
z kartki pacjenta, nie wiedza. Pułapki rozwiązane w parserze: wiodące `\s*` w regexie liczb powodowało, że indeks
wskazywał spację i kontrola „czy liczba stoi osobno” patrzyła na zły znak – stąd `Witamina D 25(OH)` dawało wynik
25, a `HbA1c` wynik 1 (liczba wtopiona w nazwę należy do nazwy); globalne czyszczenie przecinka psuło jednostkę
`ml/min/1,73m2`; wynik z operatorem (`<0,19`) jest oceniany wobec normy górnej. `paramKey` szuka klucza po kolei:
cała nazwa (słownik ma wielowyrazowe, „czynnik reumatoidalny” → `rf`), potem tokeny OD KOŃCA („Cholesterol HDL”
to `hdl`, nie `cholesterol`; „Hemoglobina glikowana HbA1c” to `hba1c`, nie `hemoglobina`), nawias, na końcu prefiks.
`LAB_SYNONYMS` obejmuje morfologię, wątrobę, nerki, tarczycę, lipidogram, krzepnięcie i panel reumatologiczny
(OB, CRP, RF, anty-CCP, ASO, kwas moczowy). `labSeries` zbiera ten sam parametr z kolejnych badań, `labTrend`
liczy kierunek z dwóch ostatnich pomiarów (próg 5% – mniej to szum metody). Wykres rysuje `WykresTrendu`
**wprost w SVG**, bez biblioteki (CSP; test pilnuje, że nic takiego nie jest dociągane): pasmo normy jako
prostokąt w tle, punkty kolorowane flagą. Tabela porównawcza ma parametry w wierszach i do 6 badań w kolumnach,
przewija się w obrębie karty (nie całą stroną). Do AI idzie `labReportText` – **gotowe liczby i gotowe
porównania**, a instrukcja (`labPrompts`) zabrania podawania własnych norm, rozpoznań, zaleceń leków i diety oraz
oceniania „dobry / zły wynik”. Parametry poza normą w najnowszym badaniu wchodzą do `alerts()`, a na kartę na
wizytę – jako tabela z normami plus osobna tabela „co się zmienia w kolejnych badaniach”.

**Kompletność dokumentów w zapytaniu do AI (naprawione 28.10.2026 po zgłoszeniu właściciela):** dokument dla
lekarza pomijał część kartoteki. Cztery przyczyny, wszystkie naprawione i objęte testami:
1. treść wczytanego **protokołu kontroli urządzenia** (`kontrole[].tekst`) nigdy nie szła do AI – do zapytania
   trafiały tylko pola wpisane ręcznie, więc protokół kardiowertera nie był analizowany; teraz wchodzi przez
   `deviceChecksText` tak samo jak treść dokumentu;
2. kontrole brane przez `slice(-2)` **bez sortowania** – czyli dwie ostatnio DODANE, nie dwie najnowsze;
3. pierwszy długi dokument zjadał limit znaków (`Math.min(6000, left)`), a kolejne wypadały bez śladu
   (`if (left < 400) return`) – teraz `shareBudget` dzieli budżet sprawiedliwie: krótkie dokumenty wchodzą całe,
   nadwyżkę po nich dostają długie po równo, a ucięcie jest w tekście powiedziane wprost;
4. dokument **bez rozpoznanej daty** (częste przy skanach wypisów) lądował na końcu sortowania malejącego i był
   ucinany – `docDate` używa `data || utworzono`.
Dodatkowo `docsIndex` wypisuje SPIS wszystkich dokumentów (także bez wczytanej treści i odznaczonych), instrukcja
`reportPrompts` wymusza akapit o KAŻDYM dokumencie ze spisu i o każdym protokole, a zakładka „Dla lekarza” pozwala
odznaczyć dokumenty (domyślnie zaznaczone są wszystkie – właśnie na pomijaniu wywróciła się pierwsza wersja).
Limit treści dokumentów podniesiony z 16 000 do 45 000 znaków, protokoły mają własne 20 000.

**PDF z uszkodzoną warstwą tekstową (naprawione 28.10.2026 po zgłoszeniu właściciela):** część PDF-ów
z systemów laboratoryjnych osadza czcionkę z własnym kodowaniem i **bez poprawnej mapy ToUnicode** – pdf.js
wyciąga wtedy KODY GLIFÓW zamiast liter („▌▌▌AA (▌▌▌▌ ▌▌@ ▌▌”). Warunek `text.length >= 40 * numPages`
sprawdzał tylko ILE znaków wyszło, więc taki plik (realnie 10 409 znaków) przechodził jako „ma warstwę
tekstową” i **nigdy nie trafiał do OCR**, a do kartoteki wpadały parametry o nazwach z krzaków.
Teraz liczy się też jakość: `textQuality` (w core, testowalna) patrzy na udział znaków z obszaru prywatnego
`U+E000–U+F8FF`, bloków rysunkowych `U+2580–U+25FF` i znaku zastępczego (> 2% = zepsute), na udział samogłosek
wśród liter (polski ma ~40%, < 20% oznacza przestawione kodowanie – ten przypadek nie ma żadnych dziwnych
znaków, więc sam próg na znaki by go nie złapał) i na obecność choć jednego typowego słowa dokumentu
medycznego przy ≥ 200 literach. Gdy tekst jest zły, `readDocument` renderuje strony i rozpoznaje je jak skan,
a użytkownik dostaje komunikat, CO było nie tak z plikiem (`qualityMessage`). Po OCR jakość jest sprawdzana
jeszcze raz – jeśli dalej nic z tego nie ma, leci jasny błąd zamiast zapisania śmieci. To samo dla zdjęć.
Drugi bezpiecznik jest w `parseLabLine`: nazwa parametru zawierająca taki glif nie tworzy pozycji.
Progi dobrane tak, żeby tabela samych liczb z wynikami NIE była fałszywie odrzucana (test tego pilnuje).
Ten sam wzorzec odczytu (`readDocument`) jest skopiowany w `podopieczni.html` – **tam poprawka też jest**,
przez wspólny `tekst-jakosc.js` (patrz niżej).

**Nagłówek wydruku nie może udawać wyników (28.10.2026, drugie zgłoszenie):** po naprawie odczytu parser zaczął
czytać prawdziwe nazwy, ale brał też administrację z góry wydruku – adres laboratorium (numer ulicy jako wynik,
**kod pocztowy `36-222` jako zakres normy**), „Zlecający”, „Kod oddziału”, „Odbiorca wyniku” (rok z daty jako
wynik) i nazwę panelu „Badanie ogólne moczu (ICD-9: …)”, z której `9` wyszło jako wynik. Cztery warstwy obrony,
wszystkie w testach: 1) `LAB_NAGLOWEK` znajduje wiersz nagłówka tabeli (ma „wynik” i jednocześnie „jednostka”,
„norma”, „referencyjne” albo „zakres”) i **wszystko nad nim jest pomijane**; 2) `LAB_SKIP` rozszerzone o etykiety
administracyjne (zlecający, oddział, odbiorca, płatnik, NIP, konto, `ul.`, `al.`, telefon, e-mail…) i `KOD_POCZTOWY`
odrzuca całą linię; 3) `ICD_RE` podmienia numer klasyfikacji na litery **tej samej długości** (`ICD-9` → `ICD-x`),
żeby nie był liczbą, a indeksy zgadzały się z oryginałem – nazwa jest wycinana z linii SUROWEJ, więc „OB (ICD-9: C59)”
zostaje w całości; 4) w `parseLabText` filtr adaptacyjny: jeśli **większość** rozpoznanych pozycji ma jednostkę albo
normę (czyli wydruk ma takie kolumny), wiersze bez jednej i drugiej są odrzucane – a przy wydrukach bez norm nie
odrzucamy niczego. Do tego nazwa dłuższa niż 7 słów to zdanie, nie parametr, a zapasowa ścieżka wyszukiwania wyniku
wymaga spacji przed liczbą (inaczej „A01” w kodzie badania stawało się wynikiem).

**Jednostki i opisy norm (28.10.2026, trzecie zgłoszenie: „źle rozpoznaje jednostki (kreatynina) i normy dopisuje
do pozycji badań”):** trzy osobne usterki. 1) **Norma w osobnym wierszu pod parametrem** („Stężenie zalecane:
poniżej 190 mg/dl” pod cholesterolem, samo „Poniżej 130 mg/dl” pod LDL) zakładała nową pozycję badania –
`LAB_LINIA_NORMY` rozpoznaje taki wiersz PRZED próbą czytania go jako parametru i dopina normę (oraz jednostkę,
jeśli brakowała) do pozycji poprzedniej, nigdy nie nadpisując normy wziętej z wiersza parametru. Wzorzec kończy
się `\p{L}*`, nie `\b` – po `prawid[łl]ow` stoi „e”, więc `\b` nigdy nie trafiało („Norma:” też nie).
2) **Dwie jednostki w jednym wierszu** (kreatynina 1,70 mg/dl i 150,3 µmol/l): `parseRange` brał OSTATNI zakres,
czyli 67–117 µmol/l, i wynik w mg/dl wychodził „poniżej normy”. Teraz zbiera wszystkie zakresy i – znając już
wynik – wybiera ten, w którego rząd wielkości wpada (`od/10 … do*10`); granicą między wynikiem a normą jest
`poczatek`, czyli indeks PIERWSZEGO zakresu, niezależnie od wyboru. Jednostka, gdy nie ma jej przed normą,
jest szukana za nią. 3) `labPodejrzany` oznacza wiersz, w którym wynik odbiega od dwustronnego zakresu o rząd
wielkości – w tabeli zamiast fałszywego „▼ poniżej” pojawia się „⚠ sprawdź”, a do AI idzie wprost uwaga, żeby
nie wyciągać z takiej pozycji wniosków. Nie zgadujemy, która liczba jest zła. Do tego `belkot` odrzuca nazwy
rozsypane przez OCR na jedno- i dwuliterowe kawałki („I por eo jezkowscsgo”) – ale nie nazwę ze słownika
(`OB`, `pH`) i nie kod w nawiasie.

**Skan czytany za grubo (28.10.2026, czwarte zgłoszenie: „dalej kiepsko wczytuje, większość trzeba wpisywać
ręcznie”):** na zrzucie morfologia miała 33 parametry z PUSTYMI jednostkami i normami bez przecinka
(erytrocyty 4,33 przy „normie” 460–650, czyli 4,60–6,50; MPV 99 zamiast 9,9). To nie parser – to odczyt:
strony do rozpoznawania renderowały się przez `getViewport({ scale: 2 })`, czyli **≈145 dpi**, a tesseract
potrzebuje ok. **300 dpi**, żeby nie gubić przecinka dziesiętnego i drobnego druku kolumny jednostek.
Teraz `ocrScale(page)` liczy skalę z `OCR_DPI / 72` z sufitem `MAX_PIKSELI` (przeglądarki mobilne odmawiają
canvasu powyżej ok. 16 mln px). Przy okazji naprawiony drugi błąd: wszystkie strony leżały naraz w tablicy
canvasów – 15 stron A4 w 300 dpi to kilkaset MB, więc strony idą teraz **leniwie** (element tablicy to
funkcja rysująca stronę) i canvas jest zwalniany zaraz po rozpoznaniu. Do tego
`preserve_interword_spaces: '1'`, żeby kolumny nie sklejały się w jedno słowo. **Ta sama poprawka jest
w `podopieczni.html`** (ten sam `readDocument`), a test pilnuje obu stron.
**Liczb po odczycie NIE poprawiamy** – 118 g/l przy normie 135–186 to zapis w jednostkach SI, całkowicie
prawidłowy, a „dzielenie przez 10, gdy nie pasuje” zepsułoby go. Zamiast tego `labReadWarning` nazywa rzecz
po imieniu nad listą parametrów: gdy co najmniej dwa wiersze mają wynik i normę z różnych rzędów wielkości,
gdy żaden wiersz nie ma jednostki albo żaden nie ma normy – aplikacja pisze, że odczyt jest niepełny i że
trzeba go porównać z oryginałem, zanim uzna się strzałki za ocenę wyników.

**Wspólna ocena jakości tekstu (`tekst-jakosc.js`, od 28.10.2026):** `window.EduTekstJakosc` – jeden plik dla
„Mojego Zdrowia” i „Teczki podopiecznych”, bo ten sam `readDocument` jest skopiowany w obu stronach i oba miały
ten sam błąd (orzeczenia z poradni bywają w takich PDF-ach dokładnie jak wyniki z laboratorium). Dołączaj go
PRZED `zdrowie-core.js` / `podopieczni-core.js`; `zdrowie-core.js` ma do niego cienki mostek (`jakoscApi`),
więc `Z.textQuality` nadal działa jak wcześniej. Testy po obu stronach: `zdrowie:check` i `podopieczni:check`.

**PWA „Moje Zdrowie” (od 28.10.2026):** `zdrowie-manifest.json` (osobny od wspólnego `/manifest.json`: inna
ikona, `start_url` i `scope` = `/zdrowie.html`, `display: standalone`), ikony `zdrowie-icon-*.png` (192, 512
i osobna **maskowalna**, bo Android przycina ikonę do własnego kształtu) plus `zdrowie-apple-touch.png`.
**Nie ma własnego Service Workera** – zakres SW to cała domena, więc drugi podmieniłby ten od EduBoxa; strona
rejestruje wspólny `/service-worker.js?v=5`. `shortcuts` w manifeście prowadzą do `?tab=dzis|badania|kartki`,
a strona czyta ten parametr przy starcie (test pilnuje, że każdy skrót trafia w istniejącą zakładkę).
**Service Worker v5:** biblioteki z CDN **z przypiętym numerem wersji** (React, Babel, pdf.js, Phosphor)
wchodzą teraz do cache – wcześniej Worker pomijał wszystkie obce domeny, więc strona otwarta bez internetu
wczytywała się pusta. Przypięta wersja nigdy nie zmienia treści pod tym samym adresem, więc „najpierw cache,
świeża kopia w tle” jest tu bezpieczne; `cdn.tailwindcss.com` i czcionki Google nie mają wersji w adresie,
ale bez nich strona offline jest nieczytelna, więc są na osobnej liście `BEZ_WERSJI` z tą samą strategią.
Adres bez wersji z CDN (np. `unpkg.com/react/…`) i pozostałe obce domeny (fal.media, analityka) nadal nie
wchodzą do cache, `/api/` tak samo jak dotąd omija Workera. Nazwa cache zmieniona na `edubox-cache-v5`,
żeby stara zawartość została wyczyszczona – **rejestracja we WSZYSTKICH stronach to teraz `?v=5`** (test
sprawdza, że żadna strona nie została z `?v=4`). Po zmianie wersji w stronach publicznych trzeba odświeżyć
mapę strony: `npm run seo:sitemap`.

**Etap 3 (do zrobienia):** ewentualne rozpoznawanie układów wielokolumnowych w wydrukach laboratoryjnych
(teraz parser czyta wiersz po wierszu – przy dwóch kolumnach wyników na stronie trzeba sprawdzić odczyt).

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

**EduZadania (od 7.10.2026):** ten sam wzorzec – blok `ZADANIA_PROMPTS_START…END` (testy `npm run zadania:check`),
sekcje TEMAT / KARTA / ROZWIĄZANIA / WYNIKI, motyw (Minecraft, piłka…) tylko jako tło, bez zbędnych liczb „dla zmyłki”
(opis poziomu „wybierz potrzebne dane” sprawiał, że model doklejał je do KAŻDEGO zadania), ułamki zwykłym zapisem 3/4
(model zaczął pisać je indeksami – na kartce za drobne). Kontrola wyników: liczby porównywane po sprowadzeniu zapisu
(`numbersOf`/`sameResult`: 3/4 = 0,75, 1 1/12 = 13/12, 1 000, m², zaokrąglenia). Wspólna pula limitów zamiast dawnych
„2 prób na zawsze”; menu ładuje tylko `EduBoxCore.init` (drugi loader uruchamiał skrypty menu dwa razy).
**Kontrola klucza ma trzy kroki (EduSprawdzian, EduZadania):** generator → niezależne rozwiązanie bez klucza (`balanced`)
→ przy rozbieżności rozstrzygnięcie (`strong` = gpt-6.1, widzi zadanie i obie odpowiedzi, `applyVerdicts`). Realny
przypadek: klucz 11/24 km był dobry, a gpt-5.4-mini podał długość już ułożonych torów – bez rozstrzygnięcia nauczyciel
dostałby fałszywy alarm. Rozstrzygnięcie płaci się tylko przy rozbieżności.

**EduKalendarz (od 8.10.2026):** daty świąt w `HOLIDAYS` (od 18.10.2026 w `kalendarz-dane.js`, wspólnym z postami Ewy; testy `kalendarz:check`) sprawdzone
w źródłach; nowe święto dopisuj tylko z potwierdzoną datą (usunięty „Dzień Ślimaka” 24.05 – brak źródła). Dzień Motyla
(14.03) to solidarność z dziećmi z EB – instrukcja każe przy takich dniach pisać z szacunkiem, bez litowania się
i szczegółów medycznych. Plan ma czasy części, materiały z sali i uwagę o alergiach; eksport `planToHtml` → EduDocTools.
Uzupełnienie 8.10.2026 (właściciel: „ubogi – brak nawet Dnia Nauczyciela”): Dzień Edukacji Narodowej 14.10 (art. 74 KN),
11.11, Dzień Flagi 2.05, 3 Maja (ustawy sprawdzone w ISAP, w `legal-acts.json`), dni ONZ/UNESCO według un.org, tradycje
(andrzejki, mikołajki, Wigilia, walentynki, pierwszy dzień wiosny) – 5–10 pozycji w miesiącu. Święta ruchome liczy
`holidaysFor(month)` na bieżący rok szkolny (`MOVABLE`: Dzień Uśmiechu = pierwszy piątek października, tłusty czwartek =
Wielkanoc − 52 dni, Wielkanoc algorytmem Meeusa – może wypaść w marcu). Pole „Inne święto albo własny temat” (`custom`:
nazwa to dane, nie polecenia), start na bieżącym miesiącu. Instrukcja: ogień i wosk tylko u dorosłego, święta państwowe
bez polityki, religijne – tradycje bez narzucania wiary.

**Baza Materiałów (`materialy.html` + prywatny `panel-materialy.html`, od 16.10.2026):** pakiety w 4 sekcjach
(`materialy-wspolne.js` → `window.EduMaterialy.SEKCJE`: przedszkole, klasy 1–3, klasy 4–8, inne), w każdej sekcji
katalogi (pole `kategoria`). Pakiety sprzed podziału nie mają pola `sekcja` – `sekcjaPakietu` zgaduje ją z nazwy,
a panel prosi o zatwierdzenie. Podgląd: panel renderuje wybrane strony PDF w przeglądarce (pdf.js 3.11 z cdnjs,
720 px, JPEG, znak wodny „PODGLĄD • eduboxpro.pl”; domyślnie 8 stron rozłożonych po całym pakiecie –
`stronyPodgladu`), opcjonalnie okładka z własnego obrazka (np. pin). Obrazki leżą w Storage w `podglady/`
i są PUBLICZNE: `GET /api/verify-code?podglad=podglady/…` (bez nowej funkcji Vercel, przed limitem zapytań,
`s-maxage` = CDN), a pliki pakietów (`materialy/…`) nadal tylko z kodem PRO. Ścieżki pilnuje
`api/_lib/materialy.js` (wgrywanie tylko do `materialy/` i `podglady/`), zalogowany panel omija limit
zapytań i może pobrać PDF (podgląd dla starych pakietów). **Katalog zapisuje serwer**, nie przeglądarka: reguły
Firestore blokują anonimowy zapis („Missing or insufficient permissions” przy pierwszym teście 16.10.2026), więc panel
woła akcję `materialy-zapisz` (`op`: create/update/delete, Basic Auth), a `api/verify-code.js` pisze przez REST
Firestore kontem usługi `FIREBASE_SERVICE_ACCOUNT_KEY` (zakres `datastore`), z białą listą pól `sanitizePakiet`.
Odczyt katalogu nadal z przeglądarki (onSnapshot). **Duże pliki (HTTP 413):** funkcja Vercela przyjmuje i oddaje najwyżej ~4,5 MB, więc pliki pakietów jej omijają:
wgrywanie = akcja `materialy-upload-start` otwiera sesję resumable w Cloud Storage (z nagłówkiem `Origin`, dzięki czemu
GCS odpowiada z CORS bez konfiguracji bucketu), a panel wysyła plik `PUT` bezpośrednio (zapas: base64 dla plików < 3 MB);
pobieranie = `materialy-download` z `mode: 'link'` zwraca podpisany link V4 ważny 5 min (`signedGetUrl`, tylko ścieżki
`materialy/`), strona przechodzi pod niego zwykłym linkiem. Odświeżenie podglądu starego pakietu: link → stara droga →
wybór PDF z dysku. Testy: `materialy:check`, `api/_lib/materialy.test.js`.

**Narzędzia zajęciowe – stan po audycie 8.10.2026:** EduEscape generuje na gpt-6.1 (`strong` + strumień, JSON
wycinany z tekstu) – gpt-5.4-mini dla klas I–III uparcie dawał „12 + 5, podaj cyfrę” (cyfra jedności); każda stacja
ma cyfrę wprost, a `runEscapeCheck` rozwiązuje stacje niezależnie i rozstrzyga różnice (testy `escape:check`).
EduZastępstwo: usunięty awaryjny scenariusz z „czarną historią” o samobójstwie i kanibalizmie (pokazywał się KAŻDEJ
grupie przy błędzie serwera), bez „czarnych historii”, granice tematów debaty (`zastepstwo:check`). Zasada dla całego
portfolio: **przy błędzie API żadnych wbudowanych treści „demo”** – tylko komunikat (wyjątek: plik otwarty lokalnie).
EduFiszki: `json_object` wymaga obiektu – struktura `{"cards": [...]}` opisana w instrukcji. EduGry nie używa AI
(od 8.10.2026 bez żadnych limitów – patrz „Limit tylko na generowanie przez AI”).
Studio: generowanie nie miało ŻADNEGO limitu – teraz wspólna pula; piosenki i escape room na gpt-6.1 (`strong`
+ strumień), scenki wideo na `balanced` z przypomnieniem o pisemnej zgodzie rodziców na wizerunek uczniów (RODO).
EduWakacje: rymowane zagadki gry terenowej i okrzyki na gpt-6.1, plan i gry SOS na `balanced`, wspólne
`WAKACJE_ZASADY` (woda tylko pod nadzorem, upał, wysokość, kryjówki na widoku opiekunów).

**Edukacja obywatelska i zdrowotna (`edukacja2025.html`, od 8.10.2026):** przedmioty i klasy z ramowych planów
nauczania (Dz.U. 2026 poz. 1028, sprawdzone w ISAP): w SP w 2026/27 treści obywatelskie są na WOS w klasie VIII
(starsze roczniki – zał. 15 i 16, do 2029/30), edukacja obywatelska wchodzi do SP w klasach VI–VII, pierwszy raz
w 2028/29 (zał. 1 stosuje się od klas I i IV); w szkołach ponadpodstawowych jest obowiązkowa od 2025/26 (Dz.U. 2025
poz. 363), WOS tylko rozszerzony. Edukacja zdrowotna: klasy IV–VIII i ponadpodstawowe, „zdrowie seksualne” według
odrębnych przepisów. Dawny tekst „przedmiot od 2025/26 zastępujący WOS” przy domyślnych klasach 7–8 był nieprawdziwy,
a domyślny wiek spoza listy sprawiał, że lista pokazywała klasy 4–6, a do AI szły 7–8 (`normAge` naprawia też stare
wzory z Giełdy). Blok `EDUKACJA_PROMPTS` (testy `edukacja:check`): `SUBJECT_CONTEXT` mówi AI, jak nazwać przedmiot
dla danej grupy; fałszywy artykuł do zdemaskowania tylko fikcyjny (bez prawdziwych osób i instytucji) z kluczem;
debata z losowaniem stron; tematy emocji bez diagnoz i zwierzeń + 116 111 / 112.

**Porady SOS (`sos-porady.js`, od 8.10.2026):** jedno miejsce na instrukcje dla EduSOS i zakładki „Porady SOS”
w EduKasi (`window.EduSosPrompts`, testy `sos:check`): hipotezy zamiast diagnoz, bez imion, najpierw bezpieczeństwo
wszystkich dzieci, zakaz kar, izolacji, odbierania posiłku i przymusu fizycznego; przy zagrożeniu życia lub zdrowia
odpowiedź zaczyna się od „⚠️ NAJPIERW BEZPIECZEŃSTWO” (112, osoba wyznaczona w standardach ochrony małoletnich –
art. 22b ustawy, t.j. Dz.U. 2026 poz. 110, procedura „Niebieskie Karty”, 800 12 12 12, 116 111 – cytujemy tylko nazwy
procedur). Rozmowa z rodzicem: nic o innych dzieciach (RODO), bez diagnozowania dziecka, notatka. Model: gpt-6.1
(`strong` + `EduDocTools.streamChat`, ~20 s, pierwsze słowa po 1–3 s). Odpowiedź zaczyna się od anonimowych linii
`TYTUŁ:` i `SYTUACJA:` – `splitSosAnswer` je odcina, a `gieldaEntry` publikuje w Giełdzie TYLKO je i poradę
(po `confirm`). Wcześniej Giełda EduSOS dostawała surowy opis nauczyciela, a przykład w polu podpowiadał imię
i diagnozę („Krzyś, 5 lat z autyzmem”). W EduKasi błąd porady nigdy się nie wyświetlał (`sosError` bez widoku).
Formy: czas teraźniejszy i druga osoba („pokazujesz”) – zakaz neutralnych płciowo form dawał „pokazałoś”.

**Giełda jest publiczna – zasada dla każdego zapisu (od 8.10.2026):** przed `saveToGielda` usuwaj pola z imionami
i podpisami oraz wgrane zdjęcia (`data:`), a przy treściach z wolnego tekstu pytaj `confirm` PRZED zużyciem puli.
Realne przypadki: EduSOS publikował surowy opis z imieniem i diagnozą (teraz anonimowy tytuł/opis od AI), EduWizualizator
– imię z tablicy żetonowej (`withoutChildName`), EduGenerator – imię ucznia z dyplomu, podpis i wgrane zdjęcie
(zostaje tylko grafika AI z adresu https), EduPlakat – plakat ze zdjęcia (image-to-image) może zachować wizerunek,
więc osobne pytanie (`fromPhoto`). Imię dziecka na dyplomie / tablicy wpisuje przeglądarka, nie AI (EduDyplomy).
MagicLetters (25.10.2026): od migracji na global-core (13.08.2026) wołało nieistniejące `EduBoxCore.publishToMarket`/
`fetchMarket` – publikacja i lista Giełdy zawsze padały. Teraz `saveToGielda('magicletters_market')` + `subscribeToGielda`
(wpis `{name, config}`), wgrane z dysku zdjęcia tła/liter zostają lokalnie (flaga `uploaded`), grafiki AI idą, `confirm`
przypomina o imionach w napisie. Stare wzory z `artifacts/edubox-magicletters-v3/…/market` nie są czytane.
Po migracji narzędzia na wspólny silnik sprawdź `grep 'EduBoxCore\.'` – każda wołana funkcja musi istnieć w global-core.js.

**`\b` w JS nie zna polskich liter:** `/\bświatła\b/` nigdy nie trafi (ś, ę, ą to dla `\b` „nie-litery”) – w EduChunku
pogrubianie słów kluczowych z ogonkami po prostu nie działało. Granice słowa: `(^|[^\p{L}\p{N}])(słowo)(?![\p{L}\p{N}])`
z flagą `u` i zamiana `'$1<b>$2</b>'`. Bez lookbehind `(?<!…)` – Safari przed 16.4 (starsze iPady w szkołach) rzuca błędem.

**Terapia – stan po audycie 8.10.2026:** EduWizualizator (blok `WIZUALIZATOR_PROMPTS`, testy `wizualizator:check`):
gpt-6.1 ze strumieniem (2–10 s) – gpt-4.1-mini dawał kroki dorosłego („Płacę za usługę”), rękawiczki przed kurtką i 🧻
przy myciu zębów; karty z perspektywy dziecka, jedna czynność na kartę, zasady w formie „my”. EduChunk (blok
`CHUNK_PROMPTS`, `chunk:check`): balanced trzyma się tekstu (gpt-4.1-mini dopisywał fakty), wspólna pula; Biblioteka
przez EduBoxCore w tej samej kolekcji `chunking_docs` (stare wpisy `title/chunkedData`, nowe `name/config`).
Uwaga: `window.__firebase_config` w nagłówku stron JEST zdefiniowany – osobne inicjalizacje Firebase w starszych
narzędziach działają (łatwo to przeoczyć i uznać Bibliotekę za martwą). EduOddech: oddech kończy się po `maxCycles`
(4-7-8: 4, żwawy: 8; reszta z czasu ćwiczenia) – wcześniej pętla bez końca, a szybki oddech 2/2 s grozi hiperwentylacją.
EduDyplom Wideo: `MediaRecorder` – MP4 najpierw, WebM jako zapas (Safari na iPhonie nie nagrywa WebM, ekran wisiał
na „Nagrywam”), rozszerzenie pliku według formatu.

**Grafika i dyplomy – stan po audycie 8.10.2026 (`grafika:check`):** komunikat „Dzienny limit darmowych obrazków (2/2)”
w 8 narzędziach był nieprawdziwy – jest 1 darmowa grafika na start (`eduboxTrialImageV1`; stare liczniki obsługuje
mostek w global-core.js). EduDyplomy: rymowanki na gpt-6.1 bez imienia i bez form zależnych od płci, „żartobliwe” tytuły
(„gaduła”) życzliwie; podziękowania na balanced bez dopisywania faktów. EduDetox: balanced polecił nieistniejącą książkę,
więc gpt-6.1 (~30 s) z zasadą „tylko prawdziwe tytuły z autorem albo rokiem”; autoresponder uprzejmy wobec rodziców
(`[data powrotu]`, sekretariat). Narzędzia prywatne: posty Ewy i scenariusze Ani na balanced; Ania nie czyta adresu
„…html?mode=…” – link do opisu filmu jest w panelu z przyciskiem Kopiuj.

**EduGenerator 2 (25.10.2026, decyzja właściciela):** kreator 4 kroków (Okazja → Treść → Wygląd → Drukuj) zamiast
zakładek „Teksty/Grafika/AI/Szlify”. Dyplom (`Diploma`) ma STAŁY rozmiar A4 w px (`PAGE`: 1122 × 793 / 793 × 1122)
i tylko skalujemy go na ekranie (`ScaledPreview`) – podgląd, wydruk (`.eg-print`, każda osoba na osobnej kartce),
PDF (html2canvas 1.4.1 + jsPDF 2.5.1 z cdnjs, ładowane po kliknięciu) i PNG to ten sam układ. Tekst edytowalny na
dyplomie (`EditableText`, DOM ustawiany ręcznie, żeby kursor nie skakał); podpowiedzi „Imię i nazwisko” tylko w
`.eg-sheet` (podgląd), nie w druku – puste imię = linia do wpisania długopisem. **Seria z listy imion** tylko w pamięci
karty (bez localStorage, bez Giełdy, nigdy do AI); miejscowość i podpis pamiętane w `localStorage.eduGeneratorPamiec`
(można wyłączyć). Okazja ustawia wygląd BEZ AI (tint koloru tytułu + emoji w rogach); malowanie tła AI to świadomy
przycisk w „Wyglądzie”, darmowa grafika liczona dopiero po udanym obrazku (`countImage` → `executeImageLimitCheck`).
Giełda: nowy zapis `{v: 2, design, studentName: '', diplomaSignature: '', customImage: tylko https}`, stare wzory
czyta `designFromLegacy`, stare girlandy (`activeTab: 'garland'`) odsyłają do MagicLetters. **Girlandy są tylko
w MagicLetters.**
Bez znaku wodnego (decyzja właściciela 25.10.2026): dyplom jest zawsze darmowy, PRO = tylko kolejne grafiki AI.
Miejscowość i datę też poprawia się na dyplomie (`editPlace`: przed pierwszym przecinkiem miejscowość, reszta data).

**CSP a obrazki z fal.media:** `connect-src` NIE obejmuje fal.media, więc `fetch(urlObrazka)` w przeglądarce kończy
się „Failed to fetch” (realny błąd w MagicLetters: obrazek opłacony, użytkownik dostawał błąd, licznik się nie
zwiększał). Obrazek z fal.media zamieniamy na dane przez `<img crossOrigin="anonymous">` + `<canvas>` (img-src
pozwala na https:, fal.media wysyła CORS) – tak robią EduPrezentacja (PPTX) i MagicLetters. Nie dopisuj fal.media do
`connect-src` „na szybko”. Ten sam problem miał EduRymy: zapytanie do pl.wiktionary.org z przeglądarki blokował CSP,
a kod przepuszczał wtedy każde słowo (fail-open) – krok „Sprawdzam w słowniku” od dawna nic nie robił. Teraz pyta serwer:
`api/chat.js` z `mode: 'slownik'` → `api/_lib/wordCheck.js` (testy w `api:check`; Wikimedia nie dostaje IP nauczyciela).
Sama strona w Wikisłowniku to za mało (są tam też słowa obce: „basa”, „pasa”) – liczy się kategoria polskiego hasła
albo polskiej formy fleksyjnej (`clcategories`). Ocena rymów w EduRymach: `strong` ze strumieniem (gpt-6.1).
Przed dodaniem `fetch` do obcej domeny w przeglądarce sprawdź `connect-src` w `vercel.json`.

**CSP bez `'unsafe-eval'`:** `new Function`/`eval` w przeglądarce są blokowane (po cichu w `try`). Redaktor Ogłoszeń
i Redaktor Bloga czytały tak `ogloszenie.js`/`zmiany.js`/`blog-posts.js` i przestały się łączyć („Nie udało się odczytać
pliku ogloszenie.js”, 16.10.2026). Teraz parser literałów `js-literal.js` (`EduJsLiteral.readWindowValue`, bez wykonywania
kodu; testy `jsliteral:check` pilnują też braku eval w redaktorach). Nie dopisuj `'unsafe-eval'` do CSP.

**Wydruk – sprawdzanie bez drukarki:** kopia strony z wstrzykniętymi danymi wyniku → Chrome
headless `--print-to-pdf` → strony PDF do PNG (`pdfjs-dist` + `@napi-rs/canvas`). Tak wyszły:
baner cookies drukujący się na każdej stronie (naprawione w `cookie-consent.js`), cienie jako
czarne pasy (`* { box-shadow:none }` w druku), reguła `.flex { display:block }` psująca wnętrze
stron, siatka EduKomiksu w jednej kolumnie (szerokość wydruku < 768 px = brak `md:`).
EduBajka: ilustracje 170 × 113 mm, tekst do ~110 słów = jedna kartka A4 na stronę.
MagicLetters (25.10.2026): drukowała się tylko 1 strona, bo cała aplikacja siedzi w `h-screen overflow-hidden`
(i `<main>` z `overflow-hidden`), a strona litery miała `height: 100vh` we flexie. Narzędzie z układem „ekran
aplikacji” = w `@media print` zdejmij wysokość/overflow/flex z KAŻDEGO przodka wersji do druku (klasy `ml-app`,
`ml-main`) i łam strony `break-after: page` na `:not(:last-child)`, nie `100vh`.

**Service Worker (`service-worker.js`, v5 od 28.10.2026):** strony, skrypty, style i dane ZAWSZE
najpierw z sieci (cache tylko offline), obrazki/czcionki z cache z odświeżaniem w tle, `/api/` poza SW.
Wcześniej (v3) wszystko poza stroną główną szło „najpierw z cache” – kto raz otworzył narzędzie, nie
dostawał poprawek. **Nie wracaj do cache-first dla HTML/JS.** Od v5 biblioteki z CDN z przypiętą wersją
(oraz Tailwind i czcionki Google) wchodzą do cache, żeby PWA działała bez internetu – szczegóły przy
opisie PWA „Moje Zdrowie”. Rejestracja wszędzie jako `/service-worker.js?v=5`.

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

**Czcionki muszą mieć polskie znaki (od 8.10.2026, `npm run fonts:check`):** Comic Neue i Satisfy mają w Google Fonts
tylko podzbiór `latin` – ą ć ę ł ń ś ź ż telefon brał z innej czcionki (zgłoszenie właściciela, EduTik: „Kajdy”, „zak/ada”).
Zamiennik: Balsamiq Sans (komiksowa, `latin-ext`) w EduTiku, EduTerapii, EduKomiksie, EduChunku i MagicLetters, Satisfy →
Dancing Script. Test przepuszcza tylko rodziny z listy sprawdzonych; nowa czcionka = najpierw zobacz, czy odpowiedź
`https://fonts.googleapis.com/css2?family=Nazwa` (z nagłówkiem przeglądarki) ma blok `/* latin-ext */`, potem dopisz ją do
listy w `scripts/check-fonts.js`. Bez polskich znaków (sprawdzone): Comic Neue, Satisfy, Gaegu, Short Stack, Schoolbell,
Coming Soon, Gochi Hand, Delius, Lobster Two, Cookie, Tangerine.

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
**Aktywacja vs pobieranie (od 21.10.2026):** Make (Coffee-Verify / Referral-Verify) przy sprawdzeniu ZUŻYWA kod
(„used” + data w kolumnie UsedAt), więc wolno go wołać tylko przy aktywacji – i tylko z pasującym prefiksem
(`EDU-` → polecenia, `KAWA-` → kawa). Pobieranie z Bazy Materiałów (`isCodeCurrentlyValid`) czyta arkusz bez zapisu
(`bonusUntilFromRows`: aktywowany kod ważny do dnia użycia + 7, północ UTC – jak w przeglądarce). Wcześniej
pobieranie pytało Make drugi raz i osoby z kodem z kawy/polecenia nie pobierały nic. Kod do pobierania leży
w `localStorage.eduboxProCode` – zapisują go menu, `EduBoxCore.verifyPremiumCode` i każda własna aktywacja w narzędziu
(nowa aktywacja = dopisz zapis kodu); bez niego `materialy.html` prosi o kod przy odmowie 403.
Scenariusze Make zwracają `{"valid": false}` przy nieznanym kodzie (router po wyszukiwaniu – wyszukiwanie
w arkuszu potrafi oddać pustą paczkę, a „Update a Row” bez numeru wiersza sypał błędem `Aundefined:Zundefined`).

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

**Propozycje czekające na decyzję właściciela (stan 8.10.2026 – NIE wdrażać bez zgody):**
- EduBystrzak AI: nazwa ma „AI”, a narzędzie nie używa AI (słówka z gotowych list). Do wyboru: zmienić nazwę albo dodać prawdziwe dobieranie 31 słówek do własnego tematu przez AI (wtedy z limitem dziennym).
- EduGenerator: druk dyplomów jest teraz bez limitu; można przywrócić limit tylko tam jako zachętę do PRO.
- Giełda EduGeneratora: wpis id xzxa1S40JAP53ca9Xvrx („Dyplom - Pasowanie”, 10.06.2026) zawiera imię i nazwisko ucznia – do usunięcia/poprawy w konsoli Firebase (robi właściciel).
- Reguły Firestore dla liczników stats (update blokowany) – zmiana po stronie właściciela.
- Do sprawdzenia na prawdziwym iPhonie: EduDyplom Wideo (nagrywanie MP4 w Safari).
- Wpisy w Giełdach EduBajki/EduKasi (AAC) sprzed 8.10.2026 mogą zawierać imiona – ewentualny przegląd w konsoli Firebase.

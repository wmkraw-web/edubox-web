# SEO Manager 2.0 — instrukcja dla EduBox

## Najważniejsza zasada bezpieczeństwa

Nowy plik `.html` jest **domyślnie niepubliczny**. Samo utworzenie pliku albo
dopisanie go ręcznie nie dodaje go do `sitemap.xml`.

Aby świadomie opublikować stronę:

1. Upewnij się, że strona jest gotowa dla użytkowników.
2. Jeśli to aplikacja, dodaj ją do `apps.js`.
3. Dopisz jej ścieżkę do `publicPages` w `seo.config.js`.
4. Uruchom `npm run seo:fix`.
5. Otwórz raport `seo-reports/seo-report.md` i sprawdź błędy oraz ostrzeżenia.
6. Dopiero wtedy zatwierdź zmiany w Pull Requeście.

Jeśli to panel redakcyjny, test albo szkic, dopisz go do `excludedPages`.
SEO Manager doda `noindex, nofollow`, ale nie będzie uzupełniał ani nadpisywał
jego tytułu, opisu i metadanych społecznościowych.

## Klasyfikacja obecnych stron

- **Publiczne:** strona główna, blog, „Co nowego”, standardy ochrony
  małoletnich oraz 58 unikalnych lokalnych narzędzi z `apps.js`.
- **Publiczny EduKatalog:** `edukatalog.html` jest aplikacją dla użytkowników i
  występuje w katalogu, więc należy do stron publicznych.
- **Prywatne/redakcyjne:** Generator Influencerki (`ewamarketing.html`),
  Generator Wideo Ani (`aniawideo.html`), Kreator Wpisów do Menu,
  Redaktor Ogłoszeń i Redaktor Bloga.
- **Techniczne:** `menu.html`, `api/index.html` i `test-edubiurokrata.html`.

Pełna, wiążąca lista znajduje się w `seo.config.js`.

## Polecenia

- `npm run seo:check` — tylko audyt; niczego nie zmienia.
- `npm run seo:report` — audyt i raport bez zmian w HTML.
- `npm run seo:sitemap` — przebudowuje wyłącznie `sitemap.xml`.
- `npm run seo:fix` — świadomie naprawia metadane stron publicznych, dodaje
  `noindex` stronom wykluczonym oraz przebudowuje sitemap i robots.

Dwuklik `Uruchom-SEO.bat` wykonuje tylko bezpieczny audyt. Nie poprawia plików
samodzielnie.

## Co jest sprawdzane

- jawna klasyfikacja każdego pliku HTML;
- title i meta description;
- canonical zgodny z właściwym adresem strony;
- Open Graph i Twitter Cards;
- robots meta: `index` dla publicznych, `noindex` dla wewnętrznych;
- kompletność i spójność `sitemap.xml` oraz `robots.txt`;
- unikalność slugów, tytuły, opisy i daty wpisów blogowych;
- niedziałające linki wewnętrzne w publicznych stronach i wpisach blogowych;
- obecność dynamicznego SEO dla `blog.html?post=...`.

Daty `lastmod` zmieniają się wtedy, gdy zmienił się odpowiedni plik. Dla
wpisów blogowych źródłem jest `updated`, a gdy go nie ma — `date` z
`blog-posts.js`. Pozostałe niezmienione daty są zachowywane, żeby sitemap nie
udawała codziennych aktualizacji całego serwisu.

## GitHub Actions

Workflow `SEO Manager 2.0` uruchamia audyt po zmianach związanych z SEO i
dołącza raport jako artefakt. Ma wyłącznie prawo odczytu i **nie zapisuje
poprawek do repozytorium**.

Workflow dodający wpis blogowy może zmieniać tylko `blog-posts.js` i
`sitemap.xml`. Korzysta z tego samego generatora sitemap i przed commitem
uruchamia pełną kontrolę.

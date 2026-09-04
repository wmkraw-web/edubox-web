# Panel jakości Make

Panel znajduje się pod adresem `/panel-jakosci.html`. Jest prywatny, chroniony
tym samym Basic Auth co narzędzia Ewy i Ani, ma `noindex` i pozostaje poza sitemapą.

## Konfiguracja Vercel

Panel wymaga jednej nowej tajnej zmiennej:

- `MAKE_API_TOKEN` — token Make z **wyłącznie** zakresem `scenarios:read`.

Opcjonalne zmienne mają bezpieczne wartości domyślne dla obecnego środowiska:

- `MAKE_TEAM_ID=1469669`
- `MAKE_ZONE=eu1.make.com`

Najpierw dodaj token dla Preview i sprawdź panel na podglądzie PR. Dopiero po
udanym teście dodaj go również dla Production. Nigdy nie wolno wklejać tokenu
do HTML, JavaScriptu przeglądarkowego, repozytorium ani komentarza PR.

## Utworzenie tokenu w Make

1. Otwórz Make i kliknij swój avatar w lewym dolnym rogu.
2. Wejdź w **Profile**, a następnie kartę **API**.
3. Kliknij **Add token** i nazwij go `EduBox Panel odczyt`.
4. Zaznacz tylko zakres `scenarios:read`.
5. Zapisz i skopiuj token od razu — Make później nie pokaże go ponownie.
6. Dodaj token w Vercel: projekt `edubox-web` → Settings → Environment Variables.

## Granice bezpieczeństwa

- Panel wykonuje tylko zapytania HTTP `GET`.
- Nie używa endpointów uruchamiania, zatrzymywania ani edycji scenariuszy.
- Nie pobiera zawartości arkuszy, promptów, treści postów ani danych uczniów.
- Wynik jest przechowywany w pamięci funkcji najwyżej 5 minut, żeby ograniczyć liczbę odczytów.
- Brak tokenu lub awaria Make nie wpływa na publiczną część EduBox.


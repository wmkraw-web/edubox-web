# Polityka bezpiecznej muzyki w automatyzacjach wideo

## Skąd to się wzięło

Część filmików Shorts na kanale YouTube dostała oznaczenie "Powiadomienie"
(roszczenie Content ID) do ścieżki dźwiękowej. Utwory pochodziły z serwisu
reklamującego się jako "katalog bezpłatnej muzyki" - w praktyce "bezpłatny"
(darmowy w użyciu, bez opłat licencyjnych) **nie jest tym samym co "bezpieczny
w Content ID"**. Wydawca może swobodnie udostępniać utwór za darmo i
jednocześnie zarejestrować go w systemie Content ID YouTube'a - wtedy każdy
film z tą ścieżką dostaje automatyczne roszczenie, niezależnie od licencji.

Roszczenie samo w sobie zwykle nie usuwa filmu ani nie blokuje kanału - w
większości przypadków oznacza tylko, że część przychodu z reklam trafia do
właściciela praw zamiast do EduBox AI. Ale to niepotrzebne ryzyko, którego
da się całkowicie uniknąć.

## Zasada

**Automatyzacje wideo (Make, i każda przyszła) mogą używać WYŁĄCZNIE muzyki
z YouTube Audio Library** (studio.youtube.com → Materiały audio → Biblioteka
utworów muzycznych), z filtrem **"Nie wymaga podania autora"**.

Dlaczego akurat to źródło: to jedyny katalog, który Google **sam** sprawdza
pod kątem Content ID przed dodaniem utworu do biblioteki - użycie takiego
utworu na YouTube nigdy nie wygeneruje roszczenia, bo Google rości prawa do
własnej, wyczyszczonej biblioteki. Żaden zewnętrzny "darmowy" katalog (np.
Pixabay Music, Uppbeat, itp.) nie daje tej samej gwarancji, nawet jeśli
technicznie ma poprawną licencję - roszczenie Content ID i tak może się
pojawić, jeśli wydawca zarejestrował utwór osobno.

## Zakaz

Nie pobieramy muzyki do filmików z żadnego innego serwisu ("darmowa
muzyka", "royalty-free", "no copyright music" na YouTube/Google), nawet
jeśli strona zapewnia "bezpieczne do użytku komercyjnego" - to nie jest
to samo co "bez roszczeń Content ID".

## Stan obecny (sprawdzone 21.08.2026)

Scenariusz Make "Wrześniowe bóle" (id 6943601) **nie dodaje w ogóle
osobnej ścieżki muzycznej** do filmików - jedyny dźwięk to głos lektorski
(ElevenLabs TTS przez json2video), który nie podlega Content ID. To zero
ryzyka w tym miejscu już teraz, bez żadnych zmian.

Jeśli w przyszłości ktoś (ja albo kolejna automatyzacja) zechce dodać
podkład muzyczny w tle - trzeba najpierw ręcznie pobrać konkretny utwór z
YouTube Audio Library, wgrać go jako plik na publicznie dostępny hosting
(np. ten sam mechanizm co obrazki z fal.ai) i dopiero wtedy podpiąć jego
URL jako element `"type": "audio"` w `movie_json` - nigdy URL prosto z
zewnętrznego "darmowego" serwisu.

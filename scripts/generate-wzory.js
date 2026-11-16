'use strict';

// Generator stron „wzory i przykłady” pod wyszukiwarkę (ruch z Google -> narzędzia EduBox).
// Uruchom: node scripts/generate-wzory.js  (nadpisuje pliki z listy PAGES)
// Nowa strona: dopisz obiekt do PAGES, uruchom generator, dodaj ścieżkę do publicPages
// w seo.config.js, potem `npm run seo:sitemap` i `npm test`.
//
// Zasady treści: przykłady to punkt wyjścia, nie gotowiec do masowego kopiowania; zawsze
// przypominamy o niewpisywaniu danych osobowych dzieci do narzędzi AI.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const UPDATED = '6 października 2026';
const UPDATED_ISO = '2026-10-06';
const BASE = 'https://eduboxpro.pl';

const PAGES = [
  {
    slug: 'ocena-opisowa-przyklady.html',
    title: 'Ocena opisowa – przykłady dla klas 1–3 | EduBox AI',
    description: 'Gotowe przykłady oceny opisowej śródrocznej i rocznej dla klas 1–3: uczeń z bardzo dobrymi wynikami, przeciętnymi i z trudnościami. Zwroty do skopiowania.',
    kicker: 'Wzory i przykłady · Klasy 1–3',
    h1: 'Ocena opisowa – przykłady dla klas 1–3',
    short: 'W klasach 1–3 szkoły podstawowej oceny śródroczne i roczne są ocenami opisowymi. Dobra ocena opisowa mówi, co dziecko już potrafi, jakie zrobiło postępy, nad czym jeszcze pracuje i jak można je wspierać – konkretnie, życzliwie i językiem zrozumiałym dla rodzica. Poniżej znajdziesz trzy pełne przykłady oraz bank zwrotów do skopiowania.',
    rulesTitle: 'Co powinna zawierać dobra ocena opisowa',
    rules: [
      'Osiągnięcia w poszczególnych edukacjach: polonistycznej, matematycznej, przyrodniczej, społecznej, plastycznej, technicznej, muzycznej, informatycznej, w wychowaniu fizycznym (oraz w języku obcym, jeśli opisujesz go Ty).',
      'Mocne strony i postępy dziecka – w odniesieniu do jego możliwości, a nie tylko do reszty klasy.',
      'Trudności opisane konkretnie i życzliwie, np. „jeszcze myli…”, „potrzebuje więcej czasu na…”.',
      'Wskazówki do dalszej pracy – co ćwiczyć w szkole i w domu (szczególnie w ocenie śródrocznej).',
      'Język zrozumiały dla rodzica i dziecka – bez etykiet („leniwy”, „słaby”) i bez żargonu.',
      'Zgodność z wymaganiami edukacyjnymi i zasadami oceniania zapisanymi w statucie Twojej szkoły.'
    ],
    examplesNote: 'Przykłady są punktem wyjścia – dopasuj je do konkretnego dziecka, a formy (uczeń/uczennica) zmień według potrzeby.',
    examples: [
      {
        label: 'Przykład 1: uczennica z bardzo dobrymi osiągnięciami',
        meta: 'Klasa 1 · ocena śródroczna',
        text: `Edukacja polonistyczna: Uczennica zna wszystkie wprowadzone litery, sprawnie łączy je w sylaby i wyrazy. Czyta krótkie teksty płynnie i ze zrozumieniem. Chętnie wypowiada się na temat wysłuchanych opowiadań i ilustracji, używając pełnych zdań. Pisze starannie i poprawnie odwzorowuje litery, wyrazy i krótkie zdania.
Edukacja matematyczna: Sprawnie dodaje i odejmuje w zakresie 10, porównuje liczby i poprawnie używa znaków >, <, =. Samodzielnie rozwiązuje proste zadania z treścią. Rozpoznaje i nazywa podstawowe figury geometryczne.
Edukacja przyrodnicza i społeczna: Zna charakterystyczne cechy pór roku, rozpoznaje wybrane rośliny i zwierzęta. Zna zasady bezpiecznego zachowania w szkole i na drodze. Chętnie i zgodnie współpracuje w grupie.
Edukacja plastyczna, techniczna i muzyczna: Prace plastyczne wykonuje starannie i z pomysłem. Sprawnie posługuje się nożyczkami i klejem. Chętnie śpiewa piosenki i rytmicznie porusza się przy muzyce.
Wychowanie fizyczne: Jest sprawna ruchowo, chętnie uczestniczy w grach i zabawach, przestrzega ustalonych zasad.
Wskazówki do dalszej pracy: Warto rozwijać zainteresowania czytelnicze uczennicy – codzienne czytanie książek dopasowanych do wieku pomoże jej jeszcze swobodniej wypowiadać się na temat tekstów.`
      },
      {
        label: 'Przykład 2: uczeń z przeciętnymi wynikami',
        meta: 'Klasa 2 · ocena roczna',
        text: `Edukacja polonistyczna: W ciągu roku uczeń zrobił wyraźne postępy w czytaniu – czyta coraz płynniej, rozumie krótkie teksty i odpowiada na pytania do nich. Wypowiada się chętnie, choć często krótko. Pisze czytelnie; w pisaniu z pamięci i ze słuchu zdarzają się błędy ortograficzne, nad którymi pracuje.
Edukacja matematyczna: Dodaje i odejmuje w zakresie 100, mnoży i dzieli w poznanym zakresie. Zadania tekstowe rozwiązuje z niewielką pomocą. Mierzy długość, waży przedmioty i odczytuje pełne godziny na zegarze.
Edukacja przyrodnicza i społeczna: Zna wybrane rośliny i zwierzęta różnych środowisk i rozumie potrzebę dbania o przyrodę. Zna prawa i obowiązki ucznia oraz zasady obowiązujące w klasie.
Edukacja plastyczna, techniczna i muzyczna: Prace plastyczne wykonuje samodzielnie, czasem w pośpiechu. Chętnie uczestniczy w zajęciach muzycznych i technicznych.
Edukacja informatyczna: Posługuje się komputerem w podstawowym zakresie, korzysta z prostych programów edukacyjnych.
Wychowanie fizyczne: Jest aktywny i sprawny ruchowo, szczególnie lubi gry zespołowe.
Wskazówki do dalszej pracy: Warto ćwiczyć ortografię w formie krótkich gier słownych i dyktand oraz zachęcać ucznia do dłuższych wypowiedzi, np. opowiadania o przeczytanej książce.`
      },
      {
        label: 'Przykład 3: uczeń z trudnościami w nauce',
        meta: 'Klasa 3 · ocena śródroczna',
        text: `Edukacja polonistyczna: Uczeń czyta wolniej niż większość rówieśników, ale systematycznie robi postępy – coraz rzadziej myli podobne litery i chętniej sięga po krótkie teksty. Rozumie polecenia, gdy są podawane krok po kroku. Wspierany pytaniami potrafi opowiedzieć przeczytany fragment. Pisanie wymaga od niego więcej czasu; pracuje nad ortografią i starannością pisma.
Edukacja matematyczna: Dodaje i odejmuje w zakresie 100, korzystając z pomocy dydaktycznych. Tabliczkę mnożenia opanował częściowo i systematycznie ją utrwala. Najlepiej radzi sobie z zadaniami praktycznymi, np. obliczeniami pieniężnymi i mierzeniem.
Edukacja przyrodnicza i społeczna: Interesuje się przyrodą i chętnie dzieli się swoimi obserwacjami. Jest koleżeński i pomocny.
Edukacja plastyczna, techniczna i muzyczna: Ma duże zdolności manualne – prace techniczne i plastyczne wykonuje starannie i z pomysłem.
Wychowanie fizyczne: Chętnie uczestniczy w zajęciach ruchowych i stara się przestrzegać zasad gier.
Wskazówki do dalszej pracy: Warto codziennie czytać z uczniem na głos przez 10–15 minut, utrwalać tabliczkę mnożenia w formie gier i chwalić go za wysiłek – to buduje wiarę we własne możliwości. Pomocna będzie dalsza współpraca z wychowawcą i specjalistami w szkole.`
      }
    ],
    phrases: [
      ['Edukacja polonistyczna', [
        'Czyta płynnie, z właściwą intonacją, i rozumie czytany tekst.',
        'Czyta poprawnie, ale jeszcze wolno; systematycznie doskonali technikę czytania.',
        'Wypowiada się pełnymi zdaniami, logicznie i na temat.',
        'Ma bogate słownictwo i chętnie dzieli się swoimi przemyśleniami.',
        'Pisze starannie i poprawnie pod względem ortograficznym.',
        'Pracuje nad poprawnością ortograficzną i estetyką pisma.',
        'Z zainteresowaniem słucha czytanych tekstów i trafnie odpowiada na pytania.'
      ]],
      ['Edukacja matematyczna', [
        'Sprawnie dodaje i odejmuje w poznanym zakresie.',
        'Biegle zna tabliczkę mnożenia.',
        'Samodzielnie rozwiązuje zadania tekstowe, także złożone.',
        'Rozwiązuje zadania tekstowe z pomocą nauczyciela.',
        'Poprawnie odczytuje godziny na zegarze i posługuje się kalendarzem.',
        'Rozpoznaje i nazywa figury geometryczne, mierzy długość odcinków.'
      ]],
      ['Edukacja przyrodnicza i społeczna', [
        'Wykazuje duże zainteresowanie przyrodą i chętnie prowadzi obserwacje.',
        'Zna i nazywa rośliny i zwierzęta charakterystyczne dla różnych środowisk.',
        'Rozumie potrzebę ochrony przyrody i dba o środowisko.',
        'Zna i przestrzega zasad obowiązujących w klasie i szkole.',
        'Zgodnie współpracuje w grupie i potrafi słuchać innych.'
      ]],
      ['Edukacja plastyczna, techniczna, muzyczna i informatyczna', [
        'Prace plastyczne wykonuje starannie, z bogactwem szczegółów i pomysłowością.',
        'Sprawnie posługuje się prostymi narzędziami i przestrzega zasad bezpieczeństwa.',
        'Chętnie śpiewa piosenki i rozpoznaje poznane utwory.',
        'Sprawnie posługuje się komputerem i korzysta z programów edukacyjnych.',
        'Zna zasady bezpiecznego korzystania z internetu.'
      ]],
      ['Wychowanie fizyczne', [
        'Jest sprawny ruchowo i chętnie uczestniczy w grach i zabawach.',
        'Przestrzega zasad fair play i bezpieczeństwa podczas zajęć ruchowych.'
      ]],
      ['Wskazówki do dalszej pracy', [
        'Warto codziennie czytać z dzieckiem na głos.',
        'Pomocne będzie utrwalanie tabliczki mnożenia w formie gier.',
        'Warto zachęcać dziecko do dłuższych wypowiedzi ustnych.',
        'Zachęcam do dalszego rozwijania zainteresowań i talentów.',
        'Warto chwalić za wysiłek, nie tylko za efekt.'
      ]]
    ],
    mistakes: [
      'Ta sama ocena dla wielu uczniów – rodzice szybko to zauważą.',
      'Etykiety i oceny charakteru („leniwy”, „słaby”) zamiast opisu umiejętności i zachowań.',
      'Ogólniki („dobrze czyta”) bez konkretu – co dokładnie dziecko potrafi?',
      'Same braki, bez mocnych stron i postępów.',
      'Brak wskazówek, jak pomóc dziecku w dalszej nauce.',
      'Trudne słowa i żargon, których rodzic nie zrozumie.'
    ],
    faq: [
      ['Czy w klasach 1–3 ocena klasyfikacyjna musi być opisowa?', 'Tak. W klasach I–III szkoły podstawowej śródroczne i roczne oceny klasyfikacyjne z obowiązkowych i dodatkowych zajęć edukacyjnych są ocenami opisowymi (art. 44i ust. 1 pkt 2 ustawy o systemie oświaty). Sposób ustalania ocen bieżących określa statut szkoły.'],
      ['Czym różni się ocena śródroczna od rocznej?', 'Ocena śródroczna podsumowuje pierwsze półrocze i zwykle zawiera więcej wskazówek do dalszej pracy. Ocena roczna podsumowuje cały rok szkolny i trafia na świadectwo.'],
      ['Czy w ocenie rocznej trzeba uwzględnić „doświadczenia edukacyjne”?', 'Od 1 września 2026 r. przy ustalaniu rocznej oceny klasyfikacyjnej z zajęć, dla których podstawa programowa przewiduje doświadczenia edukacyjne, bierze się pod uwagę także zaangażowanie ucznia w ich realizację (§ 9 ust. 3 rozporządzenia w sprawie oceniania, dodany rozporządzeniem z 20 sierpnia 2026 r., Dz.U. 2026 poz. 1122). Nowa podstawa programowa obowiązuje w roku szkolnym 2026/2027 w klasach I i IV.'],
      ['Czy mogę użyć AI do pisania ocen opisowych?', 'Tak, jako pomocy w redagowaniu tekstu – ale zawsze na podstawie własnych obserwacji, bez wpisywania danych osobowych dziecka (imię zostaw tylko u siebie – np. w EduOcena imię wpisane w polu nie trafia do AI) i z uważnym sprawdzeniem wyniku. Ocenę wystawia nauczyciel.'],
      ['Jak długa powinna być ocena opisowa?', 'Na tyle, by była konkretna – zwykle kilka zdań na każdą edukację. Ważniejsze od długości są trafność i wskazówki, z których rodzic może skorzystać.']
    ],
    legal: [
      ['Art. 44i ustawy o systemie oświaty (tekst jedn. Dz.U. 2025 poz. 881 ze zm.)', 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20250000881'],
      ['Rozporządzenie w sprawie oceniania, klasyfikowania i promowania uczniów i słuchaczy w szkołach publicznych (tekst jedn. Dz.U. 2023 poz. 2572 ze zm.)', 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20230002572'],
      ['Zmiana od 1.09.2026 – m.in. § 9 ust. 3 (doświadczenia edukacyjne): Dz.U. 2026 poz. 1122', 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20260001122']
    ],
    tool: {
      name: 'EduOcena AI',
      url: 'eduocena.html',
      campaign: 'oceny-opisowe',
      text: 'Wybierz okres (śródroczna lub roczna) i z list poziom ucznia w edukacjach – polonistycznej, matematycznej, społecznej i, jeśli chcesz, pozostałych. Dopisz własne obserwacje, a AI złoży z tego spójny, życzliwy tekst: poziom i postępy oraz to, co dalej rozwijać (§ 8 rozporządzenia o ocenianiu). Tekst poprawisz na kartce i skopiujesz do dziennika. Za darmo, bez rejestracji; imię zostaje w Twojej przeglądarce.'
    }
  },
  {
    slug: 'ocena-zachowania-przyklady.html',
    title: 'Ocena opisowa zachowania klasy 1–3 – przykłady | EduBox AI',
    description: 'Przykłady opisowej oceny zachowania dla klas 1–3: uczennica wzorowa, uczeń z trudnością w przestrzeganiu zasad i dziecko nieśmiałe. Gotowe zwroty do skopiowania.',
    kicker: 'Wzory i przykłady · Klasy 1–3',
    h1: 'Ocena opisowa zachowania w klasach 1–3 – przykłady',
    short: 'W klasach 1–3 śródroczna i roczna ocena zachowania jest oceną opisową. Od 1 września 2026 r. obowiązuje nowa lista podstawowych obszarów oceny zachowania – m.in. odpowiedzialność za własny rozwój, przestrzeganie norm społecznych i zaangażowanie w życie klasy, szkoły i wspólnoty lokalnej. Najważniejsza zasada się nie zmienia: opisuj zachowania, a nie oceniaj dziecka jako osoby.',
    rulesTitle: 'Obszary oceny zachowania od 1 września 2026 r. (§ 11 ust. 1)',
    rules: [
      'Wywiązywanie się z obowiązków ucznia.',
      'Okazywanie szacunku innym osobom, w tym nauczycielom, uczniom i pracownikom szkoły.',
      'Przejmowanie odpowiedzialności za własny rozwój i zaangażowanie w realizację celów rozwojowych.',
      'Przestrzeganie norm społecznych w szkole i poza nią.',
      'Dbałość o kulturę języka.',
      'Dbałość o bezpieczeństwo i zdrowie własne oraz innych osób.',
      'Współpraca oraz dbałość o dobre relacje z innymi.',
      'Zaangażowanie w życie klasy, szkoły i wspólnoty lokalnej.',
      'Wykazywanie się szacunkiem dla własnego narodu i ojczyzny oraz tradycji i kultury innych narodów.',
      'Szczegółowe kryteria i sposób oceniania określa statut szkoły – w klasach 1–3 opisz te obszary językiem zrozumiałym dla rodzica i odpowiednio do wieku dziecka.'
    ],
    examplesNote: 'Przykłady są punktem wyjścia – opisz konkretne zachowania konkretnego dziecka. Nie wpisuj informacji o diagnozach, zdrowiu ani sytuacji rodzinnej.',
    examples: [
      {
        label: 'Przykład 1: uczennica o wzorowym zachowaniu',
        meta: 'Klasa 1 · ocena śródroczna',
        text: 'Uczennica bardzo sumiennie wywiązuje się z obowiązków ucznia – jest zawsze przygotowana do zajęć, starannie wykonuje zadania i dba o swoje przybory. Jest koleżeńska, życzliwa i chętnie pomaga innym. Zna i przestrzega zasad obowiązujących w klasie i szkole. Odnosi się z szacunkiem do dorosłych i rówieśników, używa zwrotów grzecznościowych. Dba o bezpieczeństwo swoje i innych. Chętnie angażuje się w życie klasy, np. w przygotowanie uroczystości.'
      },
      {
        label: 'Przykład 2: uczeń, któremu trudno przestrzegać zasad',
        meta: 'Klasa 2 · ocena śródroczna',
        text: `Uczeń jest pogodny, pomysłowy i chętnie bawi się z rówieśnikami. Zna zasady obowiązujące w klasie, ale nie zawsze ich przestrzega – zdarza mu się przeszkadzać podczas zajęć i wchodzić innym w słowo. W sytuacjach konfliktowych reaguje impulsywnie; z pomocą nauczyciela potrafi przeprosić i naprawić sytuację. Coraz częściej sam pamięta o ustalonych umowach, co jest wyraźnym postępem.
Wskazówki: Warto chwalić ucznia za każdą sytuację, w której zachował spokój i zaczekał na swoją kolej, oraz wspólnie z rodzicami ustalić proste, konsekwentne zasady.`
      },
      {
        label: 'Przykład 3: uczennica nieśmiała',
        meta: 'Klasa 3 · ocena roczna',
        text: 'Uczennica jest spokojna, kulturalna i życzliwa wobec innych. Sumiennie wywiązuje się z obowiązków szkolnych i zawsze jest przygotowana do zajęć. Na forum klasy rzadko zabiera głos, ale w pracy w parach i w małych grupach chętnie współpracuje i dzieli się pomysłami. W ciągu roku stała się odważniejsza w kontaktach z rówieśnikami. Przestrzega zasad bezpieczeństwa i dba o porządek wokół siebie.'
      }
    ],
    phrases: [
      ['Obowiązki ucznia', [
        'Sumiennie wywiązuje się z obowiązków ucznia.',
        'Jest zawsze przygotowany do zajęć i dba o swoje przybory.',
        'Potrzebuje przypominania o przygotowaniu do zajęć.',
        'Starannie i samodzielnie wykonuje powierzone zadania.'
      ]],
      ['Szacunek, współpraca i relacje', [
        'Jest koleżeński, życzliwy i chętnie pomaga innym.',
        'Zgodnie współpracuje w grupie i szanuje zdanie innych.',
        'Uczy się rozwiązywać konflikty bez kłótni – z pomocą dorosłego.',
        'Odnosi się z szacunkiem do rówieśników, nauczycieli i pracowników szkoły.',
        'Coraz lepiej radzi sobie z emocjami w trudnych sytuacjach.'
      ]],
      ['Normy społeczne i kultura języka', [
        'Używa zwrotów grzecznościowych i dba o kulturę słowa.',
        'Przestrzega ustalonych zasad w szkole i poza nią, np. podczas wycieczek.',
        'Czasem potrzebuje przypomnienia o czekaniu na swoją kolej.'
      ]],
      ['Bezpieczeństwo i zdrowie', [
        'Przestrzega zasad bezpieczeństwa w klasie, na korytarzu i na boisku.',
        'Dba o bezpieczeństwo i zdrowie swoje oraz innych.',
        'Uczy się przewidywać skutki swoich działań.'
      ]],
      ['Odpowiedzialność za własny rozwój', [
        'Chętnie podejmuje nowe wyzwania i wytrwale pracuje nad trudniejszymi zadaniami.',
        'Z pomocą nauczyciela wyznacza sobie małe cele i cieszy się z postępów.',
        'Uczy się przyjmować informację zwrotną i poprawiać swoją pracę.'
      ]],
      ['Zaangażowanie i wspólnota', [
        'Chętnie angażuje się w życie klasy i szkoły, np. w przygotowanie uroczystości.',
        'Bierze udział w działaniach na rzecz innych i społeczności lokalnej.',
        'Z szacunkiem i ciekawością poznaje tradycje własnego kraju i innych kultur.'
      ]]
    ],
    mistakes: [
      'Ocenianie dziecka jako osoby („niegrzeczny”, „agresywny”) zamiast opisu zachowań.',
      'Porównywanie z innymi dziećmi.',
      'Opisywanie pojedynczego incydentu jak stałej cechy.',
      'Same problemy, bez mocnych stron i postępów.',
      'Wpisywanie informacji poufnych – diagnoz, zdrowia, sytuacji rodzinnej.'
    ],
    faq: [
      ['Czy ocena zachowania w klasach 1–3 jest opisowa?', 'Tak. W klasach I–III szkoły podstawowej śródroczne i roczne oceny klasyfikacyjne zachowania są ocenami opisowymi (art. 44i ust. 1 pkt 2 ustawy o systemie oświaty).'],
      ['Co zmieniło się w ocenie zachowania od 1 września 2026 r.?', 'Rozporządzenie z 20 sierpnia 2026 r. (Dz.U. 2026 poz. 1122) nadało nowe brzmienie § 11 ust. 1 rozporządzenia w sprawie oceniania, klasyfikowania i promowania. Ocena zachowania uwzględnia teraz 9 podstawowych obszarów – doszły m.in. odpowiedzialność za własny rozwój, przestrzeganie norm społecznych, zaangażowanie w życie klasy, szkoły i wspólnoty lokalnej oraz szacunek dla własnego narodu i innych kultur. Szczegółowe kryteria nadal określa statut szkoły.'],
      ['Czy ocena zachowania wpływa na oceny z zajęć edukacyjnych?', 'Nie. Ocena zachowania nie ma wpływu na oceny klasyfikacyjne z zajęć edukacyjnych ani na promocję (art. 44f ust. 9 ustawy o systemie oświaty).'],
      ['Jak opisać trudne zachowanie, żeby nie urazić rodziców?', 'Opisz konkretne sytuacje i ich częstotliwość, pokaż postępy i mocne strony dziecka oraz zaproponuj, jak wspólnie można mu pomóc. Spokojną wiadomość do rodzica pomoże też przygotować EduDialog.']
    ],
    legal: [
      ['Art. 44i ust. 1 pkt 2 i art. 44f ust. 9 ustawy o systemie oświaty (tekst jedn. Dz.U. 2025 poz. 881 ze zm.)', 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20250000881'],
      ['§ 11 ust. 1 rozporządzenia w sprawie oceniania, klasyfikowania i promowania – nowe brzmienie od 1.09.2026: Dz.U. 2026 poz. 1122', 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20260001122'],
      ['Tekst jednolity rozporządzenia w sprawie oceniania (Dz.U. 2023 poz. 2572 ze zm.)', 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20230002572']
    ],
    tool: {
      name: 'EduOcena AI',
      url: 'eduocena.html?typ=zachowanie',
      campaign: 'ocena-zachowania',
      text: 'Otwiera się od razu w trybie oceny zachowania: wybierz poziom w trzech głównych obszarach (obowiązki, relacje, kultura i bezpieczeństwo) i – jeśli chcesz – w pozostałych z 9 obszarów obowiązujących od 1 września 2026 r., dopisz własne obserwacje, a AI zredaguje spójny, życzliwy opis. Za darmo, bez rejestracji; imię zostaje w Twojej przeglądarce.'
    },
    extraLink: { text: 'Trudna rozmowa z rodzicem? Zobacz przykłady spokojnych wiadomości →', url: 'wiadomosc-do-rodzica-przyklady.html' }
  },
  {
    slug: 'wpisy-do-dziennika-przyklady.html',
    title: 'Wpisy do dziennika – przykłady: przedszkole, świetlica, 1–3',
    description: 'Przykłady wpisów do dziennika dla przedszkola, świetlicy i klas 1–3 – także z indywidualizacją dla dzieci ze SPE. Gotowe zwroty i darmowy generator wpisów.',
    kicker: 'Wzory i przykłady · Przedszkole, świetlica, klasy 1–3',
    h1: 'Wpisy do dziennika – przykłady dla przedszkola, świetlicy i klas 1–3',
    short: 'Dobry wpis do dziennika jest krótki i konkretny: podaje temat, formy aktywności i umiejętności, które dzieci rozwijały. Nie musi być długi – ważne, żeby odzwierciedlał to, co naprawdę działo się na zajęciach. Poniżej znajdziesz przykłady dla różnych grup oraz bank zwrotów do skopiowania.',
    rulesTitle: 'Co powinien zawierać wpis do dziennika',
    rules: [
      'Temat dnia lub zajęć.',
      'Formy aktywności, np. rozmowa kierowana, zabawa ruchowa, praca plastyczna, karta pracy.',
      'Umiejętności i cele, które dzieci rozwijały (np. motoryka mała, przeliczanie, współpraca).',
      'Odniesienie do podstawy programowej – w formie przyjętej w Twojej placówce.',
      'Przy dzieciach ze SPE – ogólna informacja o indywidualizacji pracy, bez danych konkretnego dziecka.'
    ],
    examplesNote: 'Przykłady możesz kopiować i dopasowywać do swoich zajęć. Nie wpisuj do narzędzi AI imion ani danych dzieci.',
    examples: [
      {
        label: 'Przykład 1: przedszkole – starszaki',
        meta: 'Temat: Jesienne liście',
        text: 'Jesienne liście – zabawy badawcze i plastyczne. Rozmowa na temat zmian zachodzących w przyrodzie jesienią na podstawie ilustracji i przyniesionych okazów. Klasyfikowanie liści według kształtu i koloru – rozwijanie umiejętności przeliczania i porównywania. Wykonanie pracy plastycznej techniką odbijania liści – doskonalenie motoryki małej. Zabawa ruchowa przy muzyce „Tańczące liście”.'
      },
      {
        label: 'Przykład 2: przedszkole – młodsza grupa',
        meta: 'Temat: Poznajemy owoce',
        text: 'Poznajemy owoce – zabawy sensoryczne. Rozpoznawanie owoców za pomocą zmysłów wzroku, dotyku i smaku. Nazywanie owoców i ich kolorów – wzbogacanie słownictwa. Zabawa dydaktyczna „Co zniknęło z koszyka?” – ćwiczenie pamięci i uwagi. Wspólne przygotowanie sałatki owocowej – kształtowanie nawyków zdrowego odżywiania i samodzielności.'
      },
      {
        label: 'Przykład 3: świetlica szkolna',
        meta: 'Zajęcia popołudniowe',
        text: 'Zabawy integracyjne w kole – rozwijanie umiejętności współpracy i słuchania innych. Zajęcia plastyczne „Jesienne drzewo” – praca techniką wydzieranki. Gry planszowe w małych grupach – nauka przestrzegania zasad i radzenia sobie z przegraną. Odrabianie zadań domowych pod opieką nauczyciela.'
      },
      {
        label: 'Przykład 4: klasa 2 – zajęcia zintegrowane',
        meta: 'Temat: Bezpieczna droga do szkoły',
        text: 'Bezpieczna droga do szkoły. Rozmowa na temat zasad bezpiecznego poruszania się po drodze, poznanie wybranych znaków drogowych. Czytanie tekstu z podziałem na role. Pisanie zdań z wyrazami z „ó” wymiennym. Dodawanie i odejmowanie w zakresie 20. Praca plastyczna „Mój znak drogowy”.'
      },
      {
        label: 'Przykład 5: wpis z indywidualizacją (SPE)',
        meta: 'Dopisek do dowolnego wpisu',
        text: 'W trakcie zajęć stosowano indywidualizację pracy i dostosowanie wymagań do możliwości psychofizycznych dzieci, m.in. dzieląc polecenia na krótsze etapy, wspierając je instrukcją obrazkową i dając więcej czasu na wykonanie zadań.'
      }
    ],
    phrases: [
      ['Rozwój mowy i komunikacji', [
        'Wzbogacanie słownictwa czynnego i biernego.',
        'Rozwijanie umiejętności wypowiadania się pełnymi zdaniami.',
        'Ćwiczenia słuchu fonemowego – wyodrębnianie głosek w wyrazach.'
      ]],
      ['Myślenie matematyczne', [
        'Przeliczanie elementów w zakresie 10.',
        'Klasyfikowanie przedmiotów według wielkości, koloru i kształtu.',
        'Orientacja w przestrzeni – określanie położenia przedmiotów.'
      ]],
      ['Motoryka i ruch', [
        'Doskonalenie motoryki małej i koordynacji wzrokowo-ruchowej.',
        'Zabawy ruchowe rozwijające ogólną sprawność fizyczną.',
        'Ćwiczenia grafomotoryczne przygotowujące do nauki pisania.'
      ]],
      ['Kompetencje społeczne i emocje', [
        'Rozwijanie umiejętności współpracy w grupie.',
        'Kształtowanie umiejętności nazywania i wyrażania emocji.',
        'Nauka przestrzegania ustalonych zasad i czekania na swoją kolej.'
      ]],
      ['Formy pracy', [
        'Rozmowa kierowana na podstawie ilustracji.',
        'Zabawa dydaktyczna z elementami rywalizacji.',
        'Praca w małych grupach i w parach.',
        'Karta pracy utrwalająca poznane treści.'
      ]]
    ],
    mistakes: [
      'Zbyt ogólne wpisy („zajęcia plastyczne”) bez tematu i celu.',
      'Kopiowanie identycznego wpisu przez wiele dni.',
      'Wpisywanie danych konkretnych dzieci, np. imion czy diagnoz.',
      'Rozbudowane opisy metodyczne zamiast krótkiej, konkretnej informacji.'
    ],
    faq: [
      ['Jak długi powinien być wpis do dziennika?', 'Zwykle wystarczy kilka zdań: temat, najważniejsze aktywności i rozwijane umiejętności. Szczegóły formy (np. numery z podstawy programowej) zależą od zasad przyjętych w Twojej placówce.'],
      ['Czy we wpisie muszę podawać punkty podstawy programowej?', 'To zależy od wewnętrznych ustaleń placówki – w wielu przedszkolach i szkołach się to praktykuje. Sprawdź, jaka forma jest u Ciebie przyjęta.'],
      ['Jak zaznaczyć pracę z dzieckiem ze SPE?', 'Zwykle wystarczy ogólna informacja o indywidualizacji pracy i dostosowaniu wymagań, bez wskazywania konkretnego dziecka. Szczegółowe dostosowania opisuje się w dokumentacji ucznia (np. w IPET) – sprawdź też ustalenia swojej placówki.']
    ],
    tool: {
      name: 'EduWpisy',
      url: 'eduwpisy.html',
      campaign: 'wpisy-dziennik',
      text: 'Podaj temat i aktywności, wybierz grupę wiekową (żłobek, przedszkole, klasy 1–3, 4–8, świetlica) i ewentualne dostosowania SPE – dostaniesz 5 wariantów wpisu do wyboru.'
    }
  },
  {
    slug: 'sprawozdanie-wychowawcy-przyklady.html',
    title: 'Sprawozdanie wychowawcy za I półrocze – wzór i przykłady',
    description: 'Wzór sprawozdania wychowawcy klasy za I półrocze: co powinno zawierać, przykład dla klasy 2 i klasy 6, gotowe wnioski do dalszej pracy i zwroty do skopiowania.',
    kicker: 'Wzory i przykłady · Wychowawca klasy',
    h1: 'Sprawozdanie wychowawcy klasy za I półrocze – wzór i przykłady',
    short: 'Sprawozdanie wychowawcy za I półrocze podsumowuje pracę z klasą: wyniki i frekwencję, zachowanie, realizację programu wychowawczo-profilaktycznego, współpracę z rodzicami i specjalistami oraz wnioski na II półrocze. Nie ma jednego obowiązującego wzoru – zakres i formę ustala zwykle szkoła. Poniżej znajdziesz uniwersalny układ, dwa przykłady i bank zwrotów do skopiowania.',
    rulesTitle: 'Co zwykle zawiera sprawozdanie wychowawcy',
    rules: [
      'Informacje ogólne: klasa, liczba uczniów i okres, którego dotyczy sprawozdanie.',
      'Wyniki nauczania i frekwencję – w klasach 1–3 opisowo, w klasach 4–8 także średnią i rozkład ocen.',
      'Zachowanie uczniów, najważniejsze trudności wychowawcze i podjęte działania.',
      'Realizację programu wychowawczo-profilaktycznego i planu pracy wychowawcy klasy.',
      'Uroczystości, wycieczki, konkursy i osiągnięcia uczniów.',
      'Współpracę z rodzicami, pedagogiem, psychologiem i innymi specjalistami.',
      'Pomoc psychologiczno-pedagogiczną – liczbowo i ogólnie, bez danych wrażliwych.',
      'Wnioski do pracy w II półroczu, wynikające z opisanych problemów.'
    ],
    examplesNote: 'Dane w nawiasach kwadratowych zastąp danymi swojej klasy, a układ dopasuj do wzoru obowiązującego w Twojej szkole.',
    examples: [
      {
        label: 'Przykład 1: klasa 2 (edukacja wczesnoszkolna)',
        meta: 'I półrocze · sprawozdanie wychowawcy',
        text: `Sprawozdanie z pracy wychowawczej w klasie [2a] za I półrocze roku szkolnego [2026/2027]

1. Informacje ogólne
Klasa liczy [22] uczniów: [10] dziewczynek i [12] chłopców. Zespół klasowy jest zżyty – dzieci chętnie się ze sobą bawią i współpracują, choć zdarzają się drobne konflikty podczas przerw.

2. Wyniki nauczania i frekwencja
Wszyscy uczniowie otrzymali śródroczne oceny opisowe. Większość dzieci osiąga dobre i bardzo dobre wyniki. [4] uczniów potrzebuje wsparcia w czytaniu i pisaniu – zostali objęci zajęciami dydaktyczno-wyrównawczymi. Frekwencja w klasie wyniosła [93]%.

3. Zachowanie
Uczniowie znają zasady obowiązujące w klasie i w większości ich przestrzegają. Nad kulturą wypowiedzi i spokojnym rozwiązywaniem sporów pracowano podczas zajęć integracyjnych i rozmów w kręgu.

4. Realizacja programu wychowawczo-profilaktycznego
Zrealizowano zaplanowane działania, m.in. zajęcia o bezpiecznej drodze do szkoły, o emocjach i o zdrowym odżywianiu. Klasa wzięła udział w akcji „Sprzątanie świata” i w szkolnym konkursie plastycznym.

5. Uroczystości i wydarzenia
Uczniowie uczestniczyli w obchodach Dnia Edukacji Narodowej i Narodowego Święta Niepodległości. W klasie zorganizowano andrzejki i wigilię klasową, a także wyjście do [teatru].

6. Współpraca z rodzicami
Odbyły się [2] zebrania z rodzicami oraz konsultacje indywidualne. Rodzice pomagali w organizacji uroczystości klasowych. Kontakt z rodzicami odbywał się na bieżąco przez dziennik elektroniczny.

7. Pomoc psychologiczno-pedagogiczna
[3] uczniów korzysta z pomocy psychologiczno-pedagogicznej, m.in. z zajęć korekcyjno-kompensacyjnych i logopedycznych. Współpracowano z pedagogiem szkolnym.

8. Wnioski do pracy w II półroczu
– Kontynuować ćwiczenia w czytaniu ze zrozumieniem, szczególnie z uczniami objętymi wsparciem.
– Doskonalić umiejętność rozwiązywania konfliktów i pracy w grupie.
– Zachęcać rodziców do udziału w życiu klasy.`
      },
      {
        label: 'Przykład 2: klasa 6',
        meta: 'I półrocze · sprawozdanie wychowawcy',
        text: `Sprawozdanie z pracy wychowawczej w klasie [6b] za I półrocze roku szkolnego [2026/2027]

1. Informacje ogólne
Klasa liczy [26] uczniów: [12] dziewcząt i [14] chłopców. Zespół jest zróżnicowany pod względem możliwości edukacyjnych; w ciągu półrocza wyraźnie poprawiła się współpraca w grupie.

2. Wyniki nauczania
Średnia ocen klasy wynosi [4,12]. [3] uczniów uzyskało średnią co najmniej [4,75]. [2] uczniów otrzymało śródroczną ocenę niedostateczną z [matematyki] – zostali objęci zajęciami wyrównawczymi, a z rodzicami ustalono sposób uzupełnienia braków.

3. Frekwencja
Frekwencja w klasie wyniosła [91,5]%. U [2] uczniów odnotowano liczne nieusprawiedliwione nieobecności – przeprowadzono rozmowy z uczniami i rodzicami we współpracy z pedagogiem szkolnym.

4. Zachowanie
Śródroczne oceny zachowania: wzorowe – [4], bardzo dobre – [9], dobre – [8], poprawne – [4], nieodpowiednie – [1], naganne – [0]. Najczęstsze trudności to konflikty rówieśnicze i niewłaściwe słownictwo. Prowadzono rozmowy indywidualne i zajęcia integracyjne, współpracując z rodzicami.

5. Realizacja programu wychowawczo-profilaktycznego
Na godzinach wychowawczych realizowano tematy dotyczące bezpieczeństwa w sieci, asertywności, zdrowego stylu życia i przeciwdziałania przemocy rówieśniczej. Klasa uczestniczyła w spotkaniu z [dzielnicowym] i w programie profilaktycznym [nazwa programu].

6. Osiągnięcia i wydarzenia
Uczniowie brali udział w konkursach przedmiotowych i zawodach sportowych; [2] uczniów zakwalifikowało się do etapu rejonowego [konkursu]. Klasa przygotowała [apel z okazji Narodowego Święta Niepodległości] i uczestniczyła w wycieczce do [miejsce].

7. Współpraca z rodzicami i specjalistami
Odbyły się [2] zebrania z rodzicami oraz konsultacje indywidualne. Rodzice wspierali organizację wycieczki i imprez klasowych. [5] uczniów ma opinie poradni psychologiczno-pedagogicznej, [1] uczeń – orzeczenie o potrzebie kształcenia specjalnego; zalecenia są realizowane przez nauczycieli uczących w klasie.

8. Wnioski do pracy w II półroczu
– Systematycznie monitorować frekwencję i szybko reagować na nieusprawiedliwione nieobecności.
– Kontynuować działania integrujące zespół klasowy i uczące rozwiązywania konfliktów.
– Motywować uczniów z trudnościami do udziału w zajęciach wyrównawczych.
– Wzmacniać odpowiedzialne korzystanie z internetu i telefonów komórkowych.`
      }
    ],
    phrases: [
      ['Informacje ogólne i klimat klasy', [
        'Zespół klasowy jest zintegrowany, uczniowie chętnie ze sobą współpracują.',
        'W klasie panuje życzliwa atmosfera sprzyjająca nauce.',
        'Klasa jest zróżnicowana pod względem możliwości edukacyjnych i zainteresowań.',
        'W ciągu półrocza wyraźnie poprawiła się współpraca w grupie.'
      ]],
      ['Wyniki i frekwencja', [
        'Frekwencja w klasie wyniosła [ ]%.',
        'Uczniowie mający trudności w nauce zostali objęci zajęciami dydaktyczno-wyrównawczymi.',
        'Rodzice zostali poinformowani o przewidywanych ocenach zgodnie ze statutem szkoły.',
        'Uczniowie osiągający wysokie wyniki rozwijają zainteresowania w kołach i konkursach.'
      ]],
      ['Program wychowawczo-profilaktyczny', [
        'Tematy godzin wychowawczych zrealizowano zgodnie z planem pracy wychowawcy klasy.',
        'Przeprowadzono zajęcia dotyczące bezpieczeństwa w sieci i przeciwdziałania cyberprzemocy.',
        'Uczniowie uczestniczyli w spotkaniu z [policjantem / pielęgniarką szkolną].',
        'Realizowano działania promujące zdrowy styl życia i aktywność fizyczną.'
      ]],
      ['Współpraca z rodzicami', [
        'Odbyły się [ ] zebrania z rodzicami oraz konsultacje indywidualne.',
        'Rodzice aktywnie wspierali organizację uroczystości i wycieczek klasowych.',
        'Kontakt z rodzicami odbywał się na bieżąco przez dziennik elektroniczny.'
      ]],
      ['Pomoc psychologiczno-pedagogiczna', [
        'Realizowano zalecenia zawarte w opiniach i orzeczeniach poradni psychologiczno-pedagogicznej.',
        'Współpracowano z pedagogiem i psychologiem szkolnym.',
        'Wymagania edukacyjne dostosowano do indywidualnych potrzeb i możliwości uczniów.'
      ]],
      ['Wnioski do dalszej pracy', [
        'Kontynuować działania integrujące zespół klasowy.',
        'Systematycznie monitorować frekwencję i punktualność uczniów.',
        'Rozwijać umiejętność rozwiązywania konfliktów bez przemocy.',
        'Motywować uczniów do udziału w konkursach i zajęciach dodatkowych.',
        'Zacieśnić współpracę z rodzicami uczniów mających trudności.'
      ]]
    ],
    mistakes: [
      'Same ogólniki („klasa pracowała dobrze”) bez liczb i przykładów.',
      'Nazwiska uczniów przy informacjach o trudnościach, zdrowiu czy diagnozach – w sprawozdaniu wystarczą liczby i ogólne informacje.',
      'Wnioski niezwiązane z opisanymi problemami albo ich brak.',
      'Kopiowanie zeszłorocznego sprawozdania bez aktualizacji danych.',
      'Rozbudowane opisy zamiast krótkich, konkretnych punktów.'
    ],
    faq: [
      ['Czy istnieje jeden obowiązujący wzór sprawozdania wychowawcy?', 'Nie. Przepisy nie narzucają jednego wzoru – zakres i formę sprawozdania ustala zwykle dyrektor szkoły. Sprawdź, czy w Twojej szkole obowiązuje własny formularz; jeśli tak, wypełnij jego punkty.'],
      ['Kiedy przygotowuje się sprawozdanie za I półrocze?', 'Zwykle po klasyfikacji śródrocznej, na posiedzenie rady pedagogicznej podsumowujące I półrocze. Dokładny termin podaje dyrekcja.'],
      ['Czy mogę napisać sprawozdanie z pomocą AI?', 'Tak, jako pomoc w redagowaniu: podaj liczby i ogólne informacje o klasie, bez nazwisk i danych wrażliwych uczniów. Przeczytaj i popraw wynik – za treść sprawozdania odpowiada wychowawca.'],
      ['Czym różni się sprawozdanie półroczne od rocznego?', 'Półroczne podsumowuje I półrocze i kończy się wnioskami do pracy w II półroczu. Roczne obejmuje cały rok szkolny, a wnioski dotyczą kolejnego roku.']
    ],
    tool: {
      name: 'EduSprawozdawca',
      url: 'edusprawozdania.html',
      campaign: 'sprawozdanie-wychowawcy',
      text: 'Wybierz szkołę lub przedszkole, wklej nagłówki wymagane w Twojej placówce (jeśli są) i dopisz krótkie notatki – liczby, wydarzenia, problemy, bez nazwisk uczniów. AI ułoży z tego sprawozdanie półroczne lub roczne. Za darmo, bez rejestracji.'
    }
  },
  {
    slug: 'wiadomosc-do-rodzica-przyklady.html',
    title: 'Wiadomość do rodziców – 6 gotowych przykładów do skopiowania',
    description: 'Gotowe wiadomości do rodziców ucznia: zachowanie, słabsze oceny, konflikt, nieobecności, pochwała i zaproszenie na rozmowę. Skopiuj, uzupełnij i wyślij przez e-dziennik.',
    kicker: 'Wzory i przykłady · Kontakt z rodzicami',
    h1: 'Wiadomość do rodziców przez e-dziennik – gotowe przykłady na trudne sytuacje',
    short: 'Trudną wiadomość do rodzica najłatwiej napisać według prostego schematu: zacznij od czegoś dobrego o dziecku, opisz konkretną sytuację (fakty, bez ocen), pokaż troskę i zaproponuj wspólny krok – rozmowę, spotkanie albo prostą umowę. Krótko i spokojnie. Poniżej znajdziesz przykłady na najczęstsze sytuacje oraz zwroty do skopiowania.',
    rulesTitle: 'Jak napisać trudną wiadomość do rodzica',
    rules: [
      'Zacznij od mocnej strony dziecka albo od czegoś, co ostatnio się udało.',
      'Opisz konkretną sytuację: co się stało, kiedy i jak często – bez etykiet („niegrzeczny”, „leniwy”).',
      'Pisz o trosce i o dobru dziecka, a nie o swoim zmęczeniu czy irytacji.',
      'Zaproponuj konkretny krok: rozmowę telefoniczną, spotkanie albo wspólną umowę.',
      'Pisz krótko – poważne sprawy lepiej omówić w rozmowie, a wiadomość niech do niej zaprasza.',
      'Przed wysłaniem przeczytaj tekst oczami rodzica: czy po lekturze będzie chciał współpracować?'
    ],
    examplesNote: 'W miejsce [imię] wpisz imię dziecka dopiero w dzienniku i dopasuj formy (on/ona). Do narzędzi AI nie wpisuj imion ani nazwisk.',
    examples: [
      {
        label: 'Przykład 1: przeszkadzanie na lekcjach',
        meta: 'Zachowanie',
        text: `Dzień dobry,
piszę w sprawie [imię]. Widzę, że [imię] jest bardzo pomysłowy i chętnie zabiera głos, co bardzo cenię. W ostatnim tygodniu kilka razy zdarzyło się jednak, że podczas lekcji rozmawiał z kolegami i wstawał z miejsca, co utrudniało pracę jemu i innym uczniom. Rozmawialiśmy o tym w klasie i [imię] obiecał się postarać.
Zależy mi, żeby dobrze wykorzystywał swój potencjał. Czy moglibyśmy porozmawiać telefonicznie w tym tygodniu? Chętnie wspólnie ustalimy, jak możemy mu pomóc – w szkole i w domu.
Pozdrawiam serdecznie
[podpis]`
      },
      {
        label: 'Przykład 2: słabsze wyniki w nauce',
        meta: 'Nauka',
        text: `Dzień dobry,
chciałabym podzielić się obserwacją dotyczącą [imię]. [Imię] świetnie radzi sobie w pracy w grupie i ma ciekawe pomysły. Zauważyłam jednak, że od kilku tygodni trudniej jej skupić się na lekcjach, często nie ma potrzebnych przyborów, a ostatnie sprawdziany z [przedmiotu] wypadły słabiej niż wcześniej.
Chciałabym zrozumieć, co może być przyczyną, i wspólnie z Państwem pomóc jej wrócić do wcześniejszych wyników. Proponuję krótkie spotkanie lub rozmowę telefoniczną – proszę o informację, jaki termin Państwu odpowiada.
Z pozdrowieniami
[podpis]`
      },
      {
        label: 'Przykład 3: konflikt z kolegą na przerwie',
        meta: 'Bezpieczeństwo i relacje',
        text: `Dzień dobry,
chcę poinformować Państwa o sytuacji z dzisiejszej przerwy. Doszło do sprzeczki między [imię] a kolegą z klasy, która zakończyła się popchnięciem. Nikomu nic poważnego się nie stało. Porozmawiałam z obydwoma chłopcami, wyjaśniliśmy sytuację i chłopcy się przeprosili.
Wiem, że [imię] na co dzień jest koleżeński, dlatego zależy mi, żeby takie sytuacje się nie powtarzały. Proszę o rozmowę z synem w domu – warto wspólnie zastanowić się, co może zrobić następnym razem, gdy poczuje złość. W razie pytań jestem do dyspozycji.
Pozdrawiam
[podpis]`
      },
      {
        label: 'Przykład 4: nieobecności i spóźnienia',
        meta: 'Frekwencja',
        text: `Dzień dobry,
zwracam się w sprawie frekwencji [imię]. W ostatnim miesiącu [imię] miała [5] nieusprawiedliwionych nieobecności i kilka spóźnień na pierwszą lekcję. Martwię się, bo omijają ją ważne treści, a w klasie brakuje jej pomysłów.
Proszę o usprawiedliwienie nieobecności zgodnie z zasadami szkoły i o kontakt, jeśli dzieje się coś, o czym powinnam wiedzieć – wspólnie poszukamy rozwiązania.
Z pozdrowieniami
[podpis]`
      },
      {
        label: 'Przykład 5: pochwała',
        meta: 'Dobra wiadomość',
        text: `Dzień dobry,
chcę podzielić się dobrą wiadomością: [imię] w tym tygodniu świetnie poradził sobie z [zadaniem / występem / pracą w grupie]. Widać, że włożył w to dużo pracy, a jego pomysł zainspirował całą klasę. Proszę przekazać mu ode mnie gratulacje – zasłużył na nie!
Pozdrawiam serdecznie
[podpis]`
      },
      {
        label: 'Przykład 6: zaproszenie na rozmowę',
        meta: 'Spotkanie',
        text: `Dzień dobry,
chciałabym porozmawiać z Państwem o tym, jak [imię] odnajduje się w klasie. Mam kilka obserwacji, którymi chcę się podzielić, i jestem ciekawa Państwa spojrzenia – razem łatwiej będzie nam wspierać [imię].
Czy pasowałoby Państwu spotkanie w [dzień] o [godzina] albo krótka rozmowa telefoniczna? Jeśli ten termin nie odpowiada, proszę zaproponować inny.
Z pozdrowieniami
[podpis]`
      }
    ],
    phrases: [
      ['Na początek', [
        'Chcę podzielić się obserwacją dotyczącą [imię].',
        'Widzę, że [imię] chętnie… – bardzo to cenię.',
        'Piszę, bo zależy mi, żeby [imię] dobrze czuł się w klasie.'
      ]],
      ['Opis sytuacji', [
        'W ostatnim tygodniu kilka razy zdarzyło się, że…',
        'Podczas dzisiejszej przerwy doszło do…',
        'Zauważyłam, że od kilku tygodni…'
      ]],
      ['Troska i współpraca', [
        'Zależy mi, żeby [imię] dobrze wykorzystywał swój potencjał.',
        'Chciałabym zrozumieć, co może być przyczyną.',
        'Razem łatwiej będzie nam pomóc [imię].'
      ]],
      ['Propozycja', [
        'Czy moglibyśmy porozmawiać telefonicznie w tym tygodniu?',
        'Proponuję krótkie spotkanie – proszę o informację, jaki termin Państwu odpowiada.',
        'Proponuję prostą umowę, a za dwa tygodnie wspólnie sprawdzimy efekty.'
      ]],
      ['Zakończenie', [
        'W razie pytań jestem do dyspozycji.',
        'Dziękuję za współpracę.',
        'Pozdrawiam serdecznie'
      ]]
    ],
    mistakes: [
      'Etykiety i oceny dziecka („jest niegrzeczny”, „leniwy”) zamiast opisu sytuacji.',
      'Pisanie w emocjach – lepiej odczekać i przeczytać wiadomość jeszcze raz.',
      'Lista wszystkich przewinień z całego semestru w jednej wiadomości.',
      'Przerzucanie odpowiedzialności („proszę coś z tym zrobić”) bez propozycji współpracy.',
      'Wielkie litery, wykrzykniki i ironia – w piśmie brzmią ostrzej niż w rozmowie.',
      'Opisywanie innych dzieci z imienia i nazwiska.'
    ],
    faq: [
      ['Czy trudne sprawy omawiać przez e-dziennik?', 'Wiadomość dobrze sprawdza się do krótkiej informacji i umówienia rozmowy. Poważne sprawy – np. przemoc, zdrowie czy powtarzające się problemy – lepiej omówić osobiście lub telefonicznie, zgodnie z procedurami szkoły.'],
      ['Jak pisać, żeby rodzic nie poczuł się atakowany?', 'Zacznij od mocnej strony dziecka, opisz fakty bez ocen, pokaż troskę i zaproponuj konkretny wspólny krok. Krótka, spokojna wiadomość działa lepiej niż długa lista zarzutów.'],
      ['Co zrobić, gdy rodzic odpowiada nerwowo?', 'Odpowiedz krótko i spokojnie, podziękuj za odpowiedź i zaproponuj rozmowę – w razie potrzeby z udziałem pedagoga lub dyrekcji. Nie prowadź sporu w wiadomościach.'],
      ['Czy mogę użyć AI do napisania wiadomości?', 'Tak – opisz sytuację bez imienia i nazwiska dziecka, a AI pomoże nadać jej spokojny ton. Gotowy tekst przeczytaj, uzupełnij i dopiero wtedy wyślij.']
    ],
    tool: {
      name: 'EduDialog',
      url: 'edudialog.html?mode=nvc',
      campaign: 'wiadomosc-do-rodzica',
      text: 'Wpisz, co się stało – nawet nerwowo, ale bez imienia dziecka – a EduDialog zamieni to w spokojną, profesjonalną wiadomość do rodzica: pozytyw, fakty i propozycja współpracy. Za darmo, bez rejestracji.'
    }
  },
  {
    slug: 'opinia-o-uczniu-do-poradni-przyklady.html',
    title: 'Opinia o uczniu do poradni – wzór i przykłady | EduBox AI',
    description: 'Opinia szkoły o funkcjonowaniu ucznia do poradni: wymagana treść od 1 września 2026 r. (§ 7, obszary ICF), dwa przykłady, zwroty do skopiowania i najczęstsze błędy.',
    kicker: 'Wzory i przykłady · Pomoc psychologiczno-pedagogiczna',
    h1: 'Opinia o uczniu do poradni psychologiczno-pedagogicznej – wzór i przykłady',
    short: 'Opinia przedszkola lub szkoły o funkcjonowaniu dziecka pomaga poradni zrozumieć, jak radzi sobie ono na co dzień. Gdy sprawa trafia do zespołu orzekającego (np. orzeczenie o potrzebie kształcenia specjalnego), dyrektor przekazuje opinię w ciągu 10 dni, a od 1 września 2026 r. jej treść określa § 7 ust. 6–7 rozporządzenia z 2 marca 2026 r. W innych sprawach, np. przy diagnozie trudności w nauce, przepisy nie narzucają treści – poradnie często mają własne formularze. W obu przypadkach liczą się konkretne obserwacje, mocne strony i efekty dotychczasowej pomocy, a nie stawianie diagnoz.',
    rulesTitle: 'Co musi zawierać opinia dla zespołu orzekającego (od 1 września 2026 r.)',
    rules: [
      'Datę wydania opinii oraz imię i nazwisko dziecka lub ucznia (§ 7 ust. 6 pkt 1–2).',
      'Informację o funkcjonowaniu w przedszkolu lub szkole – trudności, mocne strony i uzdolnienia rozpoznane przez nauczycieli i specjalistów (pkt 3).',
      'Opis funkcjonowania w obszarach aktywności i uczestniczenia według ICF: 5 obszarów u dziecka w wieku przedszkolnym, 7 u ucznia (§ 7 ust. 7) – oraz zakres i rodzaj trudności w realizacji programu.',
      'Aktualną WOPFU – u ucznia objętego kształceniem specjalnym (pkt 4); aktualną okresową ocenę funkcjonowania – przy zajęciach rewalidacyjno-wychowawczych (pkt 5).',
      'Działania nauczycieli i specjalistów, formy i zakres udzielonej pomocy, okres jej udzielania i efekty (pkt 6).',
      'Wnioski dotyczące dalszej pracy z dzieckiem lub uczniem (pkt 7).',
      'Termin: 10 dni od prośby przewodniczącego zespołu lub rodzica; kopię otrzymują rodzice (§ 7 ust. 3–5).'
    ],
    examplesNote: 'Dane w nawiasach kwadratowych uzupełnij dopiero w dokumencie szkoły. Do narzędzi AI wpisuj wyłącznie anonimowe obserwacje – bez imienia, nazwiska i diagnoz.',
    examples: [
      {
        label: 'Przykład 1: opinia dla zespołu orzekającego – uczeń klasy 4 z orzeczeniem',
        meta: 'Układ wg § 7 ust. 6–7 · od 1 września 2026 r.',
        text: `Opinia o funkcjonowaniu ucznia w szkole – dla zespołu orzekającego [nazwa poradni]
Data wydania opinii: [data]
Imię i nazwisko ucznia: [imię i nazwisko], klasa [4a], [nazwa szkoły]
Opinia przekazana na prośbę przewodniczącego zespołu orzekającego z dnia [data].

1. Mocne strony i uzdolnienia
Uczeń ma bardzo dobrą pamięć i szeroką wiedzę o przyrodzie i technice, chętnie pracuje z komputerem. Jest słowny i przestrzega zasad, gdy są zapisane i przewidywalne.

2. Funkcjonowanie w obszarach aktywności i uczestniczenia (ICF)
Uczenie się i stosowanie wiedzy: szybko zapamiętuje fakty i definicje; trudniej mu rozumieć teksty literackie i wnioskować o intencjach bohaterów. Najlepiej pracuje z instrukcją zapisaną krok po kroku.
Ogólne zadania i obowiązki: samodzielnie wykonuje zadania o jasnej strukturze; przy zmianie planu dnia potrzebuje wcześniejszej zapowiedzi i wsparcia nauczyciela.
Porozumiewanie się: wypowiada się poprawnie i chętnie na tematy swoich zainteresowań; ma trudność z rozmową na tematy proponowane przez innych i z rozumieniem żartów.
Motoryka, poruszanie się, w tym aktywność manualna: porusza się sprawnie; pismo jest mało czytelne, przy dłuższym pisaniu ręcznym szybko się męczy.
Dbanie o siebie, samoobsługa i samodzielność: jest samodzielny w czynnościach samoobsługowych; potrzebuje przypomnienia o przygotowaniu stroju na wychowanie fizyczne.
Życie domowe (według informacji od rodziców): pomaga w prostych obowiązkach domowych według stałego planu; źle znosi nieprzewidziane zmiany.
Wzajemne kontakty i związki międzyludzkie, życie w społeczności szkolnej i lokalnej: ma jednego bliskiego kolegę; w hałasie na przerwach szuka spokojnego miejsca; przy przeciążeniu wycofuje się lub płacze.

3. Zakres i rodzaj trudności w realizacji programu nauczania
Trudności dotyczą głównie języka polskiego (rozumienie tekstów literackich, dłuższe wypowiedzi pisemne) oraz zajęć wymagających pracy w dużej grupie.

4. Dokumenty stanowiące część opinii
Aktualna wielospecjalistyczna ocena poziomu funkcjonowania ucznia (WOPFU) z dnia [data].

5. Działania, formy pomocy, okres i efekty
Zajęcia rozwijające kompetencje emocjonalno-społeczne (1 godz. tygodniowo, od [września 2025 r.]) – uczeń częściej sygnalizuje potrzebę przerwy, zamiast wychodzić z sali. Zajęcia rewalidacyjne (2 godz. tygodniowo) – poprawa w organizowaniu własnej pracy. Dostosowania: zapowiadanie zmian w planie, wydłużony czas pracy pisemnej, możliwość pisania na komputerze – częściowe efekty.

6. Wnioski dotyczące dalszej pracy
Kontynuować zajęcia rozwijające kompetencje społeczne i rewalidację, utrzymać przewidywalny plan dnia i możliwość krótkich przerw, wykorzystywać zainteresowania przyrodnicze ucznia jako podstawę pracy w grupie.

[podpis dyrektora] – opinię przygotował zespół: [wychowawca, nauczyciel wspomagający, pedagog specjalny]`
      },
      {
        label: 'Przykład 2: informacja dla poradni przy diagnozie – uczeń klasy 2',
        meta: 'Treści nie określa przepis – uniwersalny układ',
        text: `Informacja o funkcjonowaniu ucznia [imię i nazwisko], klasa [2b], [nazwa szkoły]
Okres obserwacji: [wrzesień–listopad 2026]. Informacja przygotowana na prośbę rodziców w związku z diagnozą w poradni.

Funkcjonowanie w nauce
Uczeń czyta głoskując, wolno, często zgaduje końcówki wyrazów; myli litery o podobnym kształcie (b–d, p–g). Rozumie krótkie teksty czytane przez nauczyciela, gorzej – czytane samodzielnie. W pisaniu ze słuchu opuszcza i przestawia litery, pismo jest mało czytelne. Dobrze radzi sobie z liczeniem w zakresie 20 i z zadaniami praktycznymi.

Funkcjonowanie społeczno-emocjonalne
Jest koleżeński i lubiany. Gdy ma czytać na głos przy klasie, widoczne jest napięcie – czasem odmawia lub mówi, że „nie umie”.

Mocne strony
Bogate słownictwo w wypowiedziach ustnych, duża wiedza przyrodnicza, zdolności manualne. Najlepiej pracuje, gdy polecenia są podawane krok po kroku i wsparte obrazkiem.

Dotychczasowa pomoc
Od [października] uczestniczy w zajęciach korekcyjno-kompensacyjnych (1 godz. tygodniowo). Stosowane dostosowania: wydłużony czas pracy, czytanie poleceń przez nauczyciela, ocenianie przede wszystkim treści wypowiedzi pisemnej. Widoczne są niewielkie postępy w technice czytania.

Współpraca z rodzicami
Rodzice są zaangażowani i codziennie czytają z dzieckiem w domu.

Pytania do poradni
Prosimy o diagnozę przyczyn trudności w czytaniu i pisaniu oraz wskazanie form pomocy i dostosowań wymagań edukacyjnych.

[data] [podpis wychowawcy]`
      }
    ],
    phrases: [
      ['Uczenie się i stosowanie wiedzy', [
        'Czyta głoskując, wolno, często zgaduje końcówki wyrazów.',
        'Ma trudności z utrzymaniem uwagi na zadaniu dłużej niż kilka minut.',
        'Lepiej przyswaja treści podawane wizualnie niż słownie.',
        'Rozumie polecenia podawane krok po kroku.'
      ]],
      ['Ogólne zadania i obowiązki', [
        'Samodzielnie wykonuje zadania o jasnej strukturze.',
        'Pracuje w wolnym tempie i potrzebuje dodatkowego czasu na wykonanie poleceń.',
        'Przy zmianie planu dnia potrzebuje wcześniejszej zapowiedzi.'
      ]],
      ['Porozumiewanie się i kontakty z innymi', [
        'Wypowiada się chętnie na tematy swoich zainteresowań.',
        'Nawiązuje pozytywne relacje z rówieśnikami i chętnie pomaga innym.',
        'W większej grupie się wycofuje, lepiej czuje się w pracy w parach.',
        'W sytuacjach niepowodzenia reaguje silnymi emocjami; po wyciszeniu potrafi rozmawiać o sytuacji.'
      ]],
      ['Motoryka, samoobsługa, życie domowe', [
        'Porusza się sprawnie; przy dłuższym pisaniu ręcznym szybko się męczy.',
        'Jest samodzielny w czynnościach samoobsługowych.',
        'Według informacji od rodziców pomaga w prostych obowiązkach domowych według stałego planu.'
      ]],
      ['Pomoc, efekty i wnioski', [
        'Uczestniczy w zajęciach korekcyjno-kompensacyjnych (1 godz. tygodniowo).',
        'Stosowane są dostosowania: wydłużony czas pracy, polecenia dzielone na etapy, miejsce blisko nauczyciela.',
        'Zastosowane działania przynoszą częściowe efekty.',
        'Prosimy o wskazanie form pomocy i dostosowań wymagań edukacyjnych.'
      ]]
    ],
    mistakes: [
      'Stawianie diagnozy („ma ADHD”, „jest dyslektykiem”) zamiast opisu obserwacji – diagnozę stawiają specjaliści.',
      'Same trudności, bez mocnych stron, uzdolnień i warunków, w których uczeń radzi sobie dobrze.',
      'Pominięcie obszarów ICF albo aktualnej WOPFU w opinii dla zespołu orzekającego (od 1 września 2026 r.).',
      'Ogólniki bez przykładów – brak informacji, jak często i w jakich sytuacjach pojawiają się trudności.',
      'Brak informacji o dotychczasowej pomocy i jej efektach.',
      'Wpisywanie imienia, nazwiska lub diagnoz dziecka do narzędzi AI.'
    ],
    faq: [
      ['Kiedy szkoła przygotowuje opinię o funkcjonowaniu ucznia dla poradni?', 'Na prośbę przewodniczącego zespołu orzekającego albo wnioskodawcy (rodzica). Dyrektor przekazuje opinię w terminie 10 dni od otrzymania prośby, a kopię otrzymują rodzice (§ 7 ust. 2–5 rozporządzenia Ministra Edukacji z 2 marca 2026 r., Dz.U. 2026 poz. 428).'],
      ['Czy jest obowiązkowy wzór opinii?', 'Przepisy nie narzucają wzoru graficznego, ale od 1 września 2026 r. określają treść opinii dla zespołu orzekającego (§ 7 ust. 6–7): datę, imię i nazwisko, informację o funkcjonowaniu w obszarach ICF z trudnościami, mocnymi stronami i uzdolnieniami, aktualną WOPFU u ucznia objętego kształceniem specjalnym, podjęte działania z efektami oraz wnioski. W innych sprawach poradnie często mają własne formularze.'],
      ['Czy poradnia wyda opinię o dysleksji uczniowi klasy 2?', 'Opinię o specyficznych trudnościach w uczeniu się poradnia może wydać nie wcześniej niż po ukończeniu klasy III szkoły podstawowej (§ 3 ust. 1 rozporządzenia w sprawie oceniania, klasyfikowania i promowania uczniów). Wcześniej szkoła może opisać obserwacje i objąć dziecko pomocą psychologiczno-pedagogiczną.'],
      ['Czy w opinii mogę napisać, że podejrzewam np. ADHD?', 'Lepiej opisać obserwacje i sformułować pytania do poradni. Diagnozę stawiają specjaliści.'],
      ['Czy mogę użyć AI do napisania opinii?', 'Tak, do uporządkowania i zredagowania anonimowych notatek – bez imienia, nazwiska i diagnoz. Dane ucznia uzupełnij dopiero w dokumencie szkoły, a całość uważnie sprawdź: to szkoła odpowiada za treść opinii.']
    ],
    legal: [
      ['§ 7 rozporządzenia Ministra Edukacji z 2 marca 2026 r. w sprawie orzeczeń i opinii wydawanych przez zespoły orzekające (Dz.U. 2026 poz. 428) – obowiązuje od 14.04.2026, § 7 ust. 6–7 od 1.09.2026', 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20260000428'],
      ['§ 3 ust. 1 rozporządzenia w sprawie oceniania, klasyfikowania i promowania uczniów i słuchaczy (tekst jedn. Dz.U. 2023 poz. 2572 ze zm.)', 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20230002572'],
      ['Gotowy wzór opinii do pobrania (Word) – układ wg § 7 ust. 6–7', 'edudruki.html']
    ],
    tool: {
      name: 'EduDialog',
      url: 'edudialog.html?mode=ppp',
      campaign: 'opinia-do-poradni',
      text: 'Otwiera się od razu w trybie „Opinia (PPP / IPET)”: wpisz potoczne, anonimowe notatki (bez imienia i nazwiska), a AI zamieni je w uporządkowany, profesjonalny fragment opinii – z mocnymi stronami ucznia i obszarami ICF. Za darmo, bez rejestracji.'
    }
  },
  {
    slug: 'opinia-wychowawcy-o-uczniu-przyklady.html',
    updated: '16 listopada 2026',
    updatedIso: '2026-11-16',
    title: 'Opinia wychowawcy o uczniu – przykłady i zwroty | EduBox AI',
    description: 'Opinia wychowawcy o uczniu: trzy gotowe przykłady (klasa 1, klasa 5, klasa 7), układ krok po kroku, zwroty do skopiowania i błędy, których warto unikać.',
    kicker: 'Wzory i przykłady · Opinie o uczniu',
    h1: 'Opinia wychowawcy o uczniu – przykłady dla klas 1–3 i 4–8',
    short: 'Opinia wychowawcy to krótki, rzeczowy opis tego, jak uczeń funkcjonuje w klasie: w nauce, w relacjach i w codziennych obowiązkach. Pisze się ją najczęściej dla poradni, na prośbę rodziców albo innej instytucji. Dobra opinia opiera się na konkretnych obserwacjach z podanym okresem, zaczyna od mocnych stron, opisuje trudności bez etykiet i mówi, jaka pomoc była już stosowana i z jakim skutkiem. Wychowawca opisuje, nie diagnozuje.',
    rulesTitle: 'Jak ułożyć opinię wychowawcy – krok po kroku',
    rules: [
      'Nagłówek: dla kogo i w jakim celu powstaje opinia, okres obserwacji, od kiedy znasz ucznia.',
      'Mocne strony i zainteresowania – co uczniowi wychodzi i w jakich warunkach pracuje najlepiej.',
      'Nauka: tempo pracy, koncentracja, samodzielność, czytanie, pisanie, liczenie – z przykładami sytuacji.',
      'Relacje i emocje: kontakty z rówieśnikami i dorosłymi, reakcje na trudność, porażkę i zmianę.',
      'Dotychczasowa pomoc: zajęcia, dostosowania, rozmowy – od kiedy i z jakim efektem.',
      'Współpraca z rodzicami – krótko i neutralnie, bez ocen rodziny.',
      'Wnioski albo pytania do adresata. Data i podpis; opinię szkoły podpisuje dyrektor, jeśli tak stanowią zasady placówki.'
    ],
    examplesNote: 'Dane w nawiasach kwadratowych uzupełnij dopiero w dokumencie szkoły. Do narzędzi AI wpisuj wyłącznie anonimowe obserwacje – bez imienia, nazwiska i diagnoz.',
    examples: [
      {
        label: 'Przykład 1: uczeń klasy 1 – trudności z koncentracją i adaptacją',
        meta: 'Edukacja wczesnoszkolna · dla poradni, na prośbę rodziców',
        text: `Opinia wychowawcy o uczniu [imię i nazwisko], klasa [1b], [nazwa szkoły]
Okres obserwacji: [wrzesień–listopad 2026]. Opinia przygotowana na prośbę rodziców w związku z wizytą w poradni.

Mocne strony
Uczeń jest ciekawy świata, zadaje dużo pytań i chętnie opowiada o swoich zainteresowaniach (zwierzęta, klocki konstrukcyjne). Dobrze liczy w zakresie 10 i szybko zapamiętuje wierszyki oraz piosenki.

Funkcjonowanie w nauce
Pracuje krótko: po kilku minutach odkłada przybory, wstaje z miejsca albo zagaduje kolegów. Zadanie kończy, gdy nauczyciel siedzi obok i dzieli polecenie na etapy. Rozpoznaje większość poznanych liter, ale myli te o podobnym kształcie. Pisze z dużym naciskiem, szybko się męczy i niechętnie podejmuje ćwiczenia grafomotoryczne.

Funkcjonowanie społeczne i emocjonalne
Chętnie bawi się z rówieśnikami, ma w klasie dwóch stałych kolegów. Trudno mu czekać na swoją kolej; gdy przegrywa w grze, reaguje płaczem lub odejściem od grupy. Uspokaja się po kilku minutach w spokojnym kącie sali.

Dotychczasowa pomoc
Miejsce w pierwszej ławce, krótkie przerwy ruchowe co kilkanaście minut, polecenia podawane pojedynczo, plan dnia w obrazkach. Po wprowadzeniu przerw ruchowych uczeń częściej kończy rozpoczętą pracę.

Współpraca z rodzicami
Rodzice są w stałym kontakcie z wychowawcą i stosują w domu te same zasady pracy.

Pytania do poradni
Prosimy o ocenę przyczyn trudności z koncentracją i grafomotoryką oraz o wskazanie form pomocy.

[data] [podpis wychowawcy]`
      },
      {
        label: 'Przykład 2: uczennica klasy 5 – trudności w relacjach z rówieśnikami',
        meta: 'Klasy 4–8 · dla poradni',
        text: `Opinia wychowawcy o uczennicy [imię i nazwisko], klasa [5a], [nazwa szkoły]
Okres obserwacji: [wrzesień 2025 – listopad 2026]. Wychowawcą klasy jestem od [września 2025 r.].

Mocne strony
Uczennica jest sumienna, starannie prowadzi zeszyty i terminowo oddaje prace. Ma zdolności plastyczne, chętnie przygotowuje dekoracje klasowe. Uzyskuje dobre i bardzo dobre oceny z większości przedmiotów.

Funkcjonowanie w nauce
Pracuje samodzielnie i w równym tempie. Rzadko zgłasza się do odpowiedzi; zapytana odpowiada poprawnie, ale cicho i krótko. Przed sprawdzianami zgłasza ból brzucha.

Funkcjonowanie społeczne i emocjonalne
Od początku roku szkolnego większość przerw spędza sama, najczęściej w bibliotece. W pracy w grupie wykonuje przydzielone zadanie, lecz nie proponuje własnych pomysłów. Dwukrotnie w tym semestrze zgłosiła wychowawcy, że koleżanki nie chcą z nią siedzieć. Na uwagi rówieśników reaguje wycofaniem, nie odpowiada na zaczepki.

Dotychczasowa pomoc
Rozmowy z wychowawcą i pedagogiem szkolnym, zajęcia integracyjne w klasie, praca w stałych małych zespołach dobieranych przez nauczyciela. Uczennica chętniej współpracuje w zespole, w którym jest koleżanka z koła plastycznego.

Współpraca z rodzicami
Rodzice uczestniczą w zebraniach i zgłaszają, że córka niechętnie mówi w domu o szkole.

Wnioski
Wskazane jest dalsze wsparcie w budowaniu relacji z rówieśnikami oraz konsultacja w zakresie radzenia sobie z napięciem przed sprawdzianami.

[data] [podpis wychowawcy]`
      },
      {
        label: 'Przykład 3: uczeń klasy 7 – spadek wyników i nieobecności',
        meta: 'Klasy 4–8 · na prośbę rodziców',
        text: `Opinia wychowawcy o uczniu [imię i nazwisko], klasa [7c], [nazwa szkoły]
Okres obserwacji: [wrzesień–listopad 2026], z odniesieniem do poprzedniego roku szkolnego.

Mocne strony
Uczeń ma dużą wiedzę z historii i informatyki, dobrze wypowiada się ustnie. W klasie jest lubiany, potrafi rozładować napięcie żartem.

Funkcjonowanie w nauce
W poprzednim roku szkolnym uzyskiwał oceny dobre. Od września oceny z matematyki, fizyki i języka polskiego obniżyły się do dopuszczających. Często nie ma zeszytu ani odrobionych zadań. Na lekcjach bywa senny. W tym semestrze ma [18] godzin nieobecności, w większości na pierwszych lekcjach.

Funkcjonowanie społeczne i emocjonalne
W kontaktach z dorosłymi jest uprzejmy. Zapytany o przyczyny trudności odpowiada krótko, że „nie ma siły”. Zrezygnował z zajęć koła informatycznego, w których wcześniej chętnie uczestniczył.

Dotychczasowa pomoc
Rozmowy z wychowawcą i pedagogiem, ustalenie terminów zaliczeń, zajęcia wyrównawcze z matematyki (uczeń był na dwóch z sześciu spotkań).

Współpraca z rodzicami
Rodzice zostali poinformowani o nieobecnościach i ocenach; potwierdzają, że syn późno zasypia i trudno go obudzić.

Wnioski
Zmiana w funkcjonowaniu ucznia jest wyraźna i utrzymuje się od około trzech miesięcy. Prosimy o konsultację i wskazanie, jak szkoła może go wspierać.

[data] [podpis wychowawcy]`
      }
    ],
    phrases: [
      ['Mocne strony', [
        'Jest sumienny i terminowo wykonuje powierzone zadania.',
        'Chętnie dzieli się wiedzą na tematy, które go interesują.',
        'Najlepiej pracuje, gdy zna plan zajęć i kolejne kroki.',
        'Jest lubiany przez rówieśników i chętnie pomaga innym.'
      ]],
      ['Nauka i praca na lekcji', [
        'Pracuje w wolnym tempie i potrzebuje dodatkowego czasu.',
        'Kończy zadanie, gdy polecenie jest podzielone na etapy.',
        'Rzadko zgłasza się do odpowiedzi; zapytany odpowiada poprawnie.',
        'Od początku semestru jego oceny z [przedmiotu] wyraźnie się obniżyły.'
      ]],
      ['Relacje i emocje', [
        'Większość przerw spędza w towarzystwie jednego kolegi.',
        'W sytuacji niepowodzenia wycofuje się i potrzebuje czasu na uspokojenie.',
        'Trudno mu czekać na swoją kolej w zabawie i rozmowie.',
        'W kontaktach z dorosłymi jest uprzejmy i otwarty.'
      ]],
      ['Pomoc i wnioski', [
        'Od [miesiąca] uczestniczy w zajęciach [nazwa] w wymiarze 1 godziny tygodniowo.',
        'Zastosowane dostosowania przynoszą częściowe efekty.',
        'Rodzice są w stałym kontakcie z wychowawcą.',
        'Prosimy o wskazanie form pomocy możliwych do realizacji w szkole.'
      ]]
    ],
    mistakes: [
      'Etykiety zamiast opisu („leniwy”, „agresywny”, „nadpobudliwy”) – napisz, co uczeń robi, kiedy i jak często.',
      'Stawianie diagnozy. Wychowawca opisuje obserwacje, rozpoznanie należy do specjalistów.',
      'Same trudności, bez mocnych stron i bez sytuacji, w których uczeń radzi sobie dobrze.',
      'Brak okresu obserwacji i informacji o tym, co szkoła już zrobiła.',
      'Oceny rodziny i informacje o sytuacji domowej, które nie pochodzą z własnej obserwacji.',
      'Opisywanie innych uczniów z imienia i nazwiska.'
    ],
    faq: [
      ['Kto podpisuje opinię o uczniu?', 'To zależy od adresata i zasad obowiązujących w szkole. Opinię szkoły przekazywaną na zewnątrz zwykle podpisuje dyrektor, a przygotowuje wychowawca, często razem z nauczycielami i specjalistami. Sprawdź, jak reguluje to Twoja placówka.'],
      ['Jak długa powinna być opinia wychowawcy?', 'Zwykle wystarcza jedna strona. Ważniejsze od długości są konkretne przykłady sytuacji, okres obserwacji i informacja o dotychczasowej pomocy.'],
      ['Czy rodzic może zobaczyć opinię?', 'Opinia dotyczy dziecka, więc rodzice powinni znać jej treść. Dlatego warto pisać ją tak, żeby rodzic po lekturze widział w szkole sojusznika.'],
      ['Czy mogę użyć AI do napisania opinii wychowawcy?', 'Tak, do uporządkowania i zredagowania anonimowych notatek – bez imienia, nazwiska i diagnoz. Dane ucznia uzupełnij dopiero w dokumencie szkoły, a całość uważnie sprawdź.']
    ],
    extraLink: { url: 'opinia-o-uczniu-do-poradni-przyklady.html', text: 'Opinia dla zespołu orzekającego ma treść określoną w przepisach – zobacz wzór z obszarami ICF →' },
    tool: {
      name: 'EduDialog',
      url: 'edudialog.html?mode=ppp',
      campaign: 'opinia-wychowawcy',
      text: 'Wpisz potoczne, anonimowe notatki o uczniu (bez imienia i nazwiska), a EduDialog zamieni je w uporządkowany, rzeczowy tekst opinii – z mocnymi stronami i opisem trudności bez etykiet. Za darmo, bez rejestracji.'
    }
  },
  {
    slug: 'opinia-nauczyciela-przedmiotu-o-uczniu-przyklady.html',
    updated: '16 listopada 2026',
    updatedIso: '2026-11-16',
    title: 'Opinia nauczyciela przedmiotu o uczniu – przykłady | EduBox AI',
    description: 'Opinia nauczyciela przedmiotu o uczniu do poradni: przykłady od polonisty, matematyka i nauczyciela języka obcego, zwroty do skopiowania i typowe błędy.',
    kicker: 'Wzory i przykłady · Opinie o uczniu',
    h1: 'Opinia nauczyciela przedmiotu o uczniu – przykłady (język polski, matematyka, język obcy)',
    short: 'Poradnia albo wychowawca często proszą nauczyciela przedmiotu o krótką opinię: jak uczeń radzi sobie właśnie na tych lekcjach. Taka opinia ma być konkretna i przedmiotowa. Opisuje, co uczeń umie, z czym ma trudność, jakie błędy popełnia najczęściej, w jakich warunkach pracuje lepiej i jakie dostosowania nauczyciel już stosuje. Wystarczy pół strony, jeśli zawiera przykłady z zeszytu, sprawdzianów i pracy na lekcji.',
    rulesTitle: 'Co napisać w opinii nauczyciela przedmiotu',
    rules: [
      'Przedmiot, klasa, okres obserwacji i liczba godzin tygodniowo – adresat wie wtedy, na czym opierasz opinię.',
      'Co uczeń opanował i co jest jego mocną stroną na Twoich lekcjach.',
      'Rodzaj trudności z przykładami: typowe błędy w pracach pisemnych, w odpowiedziach ustnych, w zadaniach.',
      'Sposób pracy: tempo, koncentracja, samodzielność, reakcja na pomoc i na ocenę.',
      'Stosowane dostosowania i ich skutek – co pomaga, a co nie przyniosło efektu.',
      'Bez diagnoz i bez porównywania z innymi uczniami z nazwiska.'
    ],
    examplesNote: 'Dane w nawiasach kwadratowych uzupełnij dopiero w dokumencie szkoły. Do narzędzi AI wpisuj wyłącznie anonimowe obserwacje – bez imienia, nazwiska i diagnoz.',
    examples: [
      {
        label: 'Przykład 1: opinia nauczyciela języka polskiego – klasa 5',
        meta: 'Język polski · dla poradni',
        text: `Opinia nauczyciela języka polskiego o uczniu [imię i nazwisko], klasa [5b], [nazwa szkoły]
Okres obserwacji: [wrzesień 2025 – listopad 2026], 5 godzin tygodniowo.

Mocne strony
Uczeń chętnie uczestniczy w rozmowach o lekturach, trafnie opisuje bohaterów i ich motywy. Ma bogate słownictwo w wypowiedziach ustnych i dobrą pamięć słuchową – szybko uczy się tekstów na pamięć.

Czytanie
Czyta wolno, sylabizując dłuższe wyrazy, przekręca końcówki i gubi się w tekście. Tekst przeczytany przez nauczyciela rozumie dobrze; po samodzielnym cichym czytaniu odpowiada na pytania wybiórczo.

Pisanie
W pracach pisemnych popełnia liczne błędy: opuszcza litery i końcówki, myli „b” i „d”, nie stosuje poznanych zasad pisowni „rz/ż” i „ó/u”, choć potrafi je ustnie przytoczyć. Pismo jest mało czytelne, tempo pisania wolne – często nie kończy notatki z tablicy. Treść wypracowań jest ciekawa i logiczna, znacznie lepsza niż ich zapis.

Praca na lekcji
Pracuje chętnie, gdy może odpowiadać ustnie. Przy dłuższym pisaniu zniechęca się i przerywa pracę.

Stosowane dostosowania
Wydłużony czas na prace pisemne, czytanie poleceń przez nauczyciela, ocenianie treści oddzielnie od poprawności zapisu, możliwość odpowiedzi ustnej zamiast części kartkówek. Po wprowadzeniu dostosowań uczeń częściej oddaje ukończone prace.

[data] [podpis nauczyciela]`
      },
      {
        label: 'Przykład 2: opinia nauczyciela matematyki – klasa 6',
        meta: 'Matematyka · dla poradni',
        text: `Opinia nauczyciela matematyki o uczennicy [imię i nazwisko], klasa [6a], [nazwa szkoły]
Okres obserwacji: [wrzesień–listopad 2026], 4 godziny tygodniowo.

Mocne strony
Uczennica jest pracowita, prowadzi staranny zeszyt i regularnie odrabia zadania. Dobrze radzi sobie z geometrią: rysuje dokładnie, rozpoznaje figury i ich własności.

Rodzaj trudności
Nie ma utrwalonej tabliczki mnożenia – wyniki oblicza przez wielokrotne dodawanie albo liczy na palcach. Myli kolejność cyfr przy zapisie liczb wielocyfrowych, w działaniach pisemnych przestawia kolumny. Zadania tekstowe rozwiązuje poprawnie, gdy treść zostanie odczytana na głos i rozrysowana; samodzielnie często nie wie, od czego zacząć. Ułamki rozumie na konkretach (koła, paski), ma trudność z zapisem symbolicznym.

Praca na lekcji i reakcja na ocenę
Pracuje wolno i bardzo się stara. Na sprawdzianach zwykle nie kończy wszystkich zadań. Po słabej ocenie płacze i mówi, że „nigdy tego nie zrozumie”.

Stosowane dostosowania
Wydłużony czas na sprawdzianach, możliwość korzystania z tabliczki mnożenia, zadania tekstowe dzielone na kroki, ocenianie toku rozumowania, a nie tylko wyniku. Efekt: lepsze wyniki w zadaniach wieloetapowych, trudności rachunkowe utrzymują się.

[data] [podpis nauczyciela]`
      },
      {
        label: 'Przykład 3: opinia nauczyciela języka angielskiego – klasa 4',
        meta: 'Język obcy · na prośbę wychowawcy',
        text: `Opinia nauczyciela języka angielskiego o uczniu [imię i nazwisko], klasa [4c], [nazwa szkoły]
Okres obserwacji: [wrzesień–listopad 2026], 3 godziny tygodniowo.

Mocne strony
Uczeń dobrze rozumie polecenia i krótkie nagrania, chętnie powtarza i śpiewa. Ma dobrą wymowę. Aktywnie uczestniczy w zabawach językowych.

Rodzaj trudności
Słówka zapamiętuje ze słuchu, ale ma dużą trudność z ich zapisem – pisze je tak, jak słyszy. Na kartkówkach ze słownictwa uzyskuje oceny niedostateczne, a te same słowa poprawnie wypowiada ustnie. Przepisując z tablicy, opuszcza litery. Czytając na głos, zgaduje wyrazy po pierwszych literach.

Stosowane dostosowania
Sprawdzanie słownictwa ustnie lub przez dopasowanie obrazka do wyrazu, krótsze partie materiału, karty ze słówkami z ilustracjami. Przy sprawdzaniu ustnym uczeń uzyskuje oceny dobre.

[data] [podpis nauczyciela]`
      }
    ],
    phrases: [
      ['Język polski', [
        'Czyta wolno, przekręca końcówki wyrazów i gubi się w tekście.',
        'Zna zasady pisowni, ale nie stosuje ich w pracach pisemnych.',
        'Treść wypracowań jest logiczna, znacznie lepsza niż ich zapis.',
        'Chętnie wypowiada się ustnie i trafnie argumentuje.'
      ]],
      ['Matematyka', [
        'Nie ma utrwalonej tabliczki mnożenia, liczy na konkretach.',
        'W działaniach pisemnych przestawia cyfry i kolumny.',
        'Zadanie tekstowe rozwiązuje po odczytaniu treści na głos i rozrysowaniu.',
        'Rozumuje poprawnie, popełnia błędy rachunkowe.'
      ]],
      ['Języki obce i inne przedmioty', [
        'Słownictwo zapamiętuje ze słuchu, ma trudność z jego zapisem.',
        'Lepiej wypada w odpowiedziach ustnych niż w pracach pisemnych.',
        'Sprawnie wykonuje zadania praktyczne i doświadczenia.',
        'Notatkę z tablicy przepisuje wolno i z błędami.'
      ]],
      ['Dostosowania i ich efekty', [
        'Wydłużony czas pracy pisemnej przynosi wyraźną poprawę.',
        'Polecenia czytane przez nauczyciela uczeń wykonuje poprawnie.',
        'Oceniana jest treść wypowiedzi, a poprawność zapisu osobno.',
        'Mimo dostosowań trudności w [zakres] się utrzymują.'
      ]]
    ],
    mistakes: [
      'Ogólniki („słabo czyta”, „nie radzi sobie z matematyką”) bez przykładów błędów.',
      'Podawanie samych ocen – ocena nie mówi, na czym polega trudność.',
      'Rozpoznania w rodzaju „dysleksja” czy „dyskalkulia”. Nauczyciel opisuje objawy, diagnozę stawia poradnia.',
      'Pominięcie tego, co uczeń umie i w jakich warunkach pracuje lepiej.',
      'Brak informacji o dostosowaniach, które już stosujesz.',
      'Wpisywanie imienia, nazwiska lub diagnoz ucznia do narzędzi AI.'
    ],
    faq: [
      ['Czy opinia nauczyciela przedmiotu jest obowiązkowa?', 'Zwykle jest częścią informacji, którą szkoła przekazuje poradni, albo załącznikiem, o który prosi wychowawca lub rodzice. O tym, kto i w jakiej formie ją przygotowuje, decydują zasady przyjęte w szkole.'],
      ['Co jest najważniejsze dla poradni w opinii polonisty?', 'Konkretne przykłady: jak uczeń czyta, jakie błędy popełnia w pisaniu, czym różni się jego wypowiedź ustna od pisemnej oraz jakie dostosowania już działają. Warto dołączyć kopie kilku prac, jeśli szkoła i rodzice się na to zgadzają.'],
      ['Jak długa powinna być taka opinia?', 'Pół strony do jednej strony. Lepiej krótko i z przykładami niż długo i ogólnie.'],
      ['Czy mogę użyć AI do zredagowania opinii?', 'Tak – wpisz anonimowe obserwacje, bez imienia, nazwiska i diagnoz. Gotowy tekst sprawdź i uzupełnij dane dopiero w dokumencie szkoły.']
    ],
    extraLink: { url: 'opinia-wychowawcy-o-uczniu-przyklady.html', text: 'Zobacz też: opinia wychowawcy o uczniu – przykłady dla klas 1–3 i 4–8 →' },
    tool: {
      name: 'EduDialog',
      url: 'edudialog.html?mode=ppp',
      campaign: 'opinia-nauczyciela-przedmiotu',
      text: 'Wpisz w punktach, co widzisz na swoich lekcjach (anonimowo, bez imienia i nazwiska), a EduDialog ułoży z tego rzeczowy fragment opinii: mocne strony, rodzaj trudności i stosowane dostosowania. Za darmo, bez rejestracji.'
    }
  },
  {
    slug: 'opinia-o-dziecku-przedszkolnym-do-poradni-przyklady.html',
    updated: '16 listopada 2026',
    updatedIso: '2026-11-16',
    title: 'Opinia o dziecku w przedszkolu do poradni – wzór | EduBox AI',
    description: 'Opinia przedszkola o dziecku do poradni: układ w 5 obszarach ICF dla zespołu orzekającego, dwa przykłady (4-latek i 6-latek), zwroty do skopiowania i najczęstsze błędy.',
    kicker: 'Wzory i przykłady · Przedszkole',
    h1: 'Opinia o dziecku przedszkolnym do poradni – wzór i przykłady',
    short: 'Opinia nauczyciela przedszkola pokazuje poradni to, czego nie widać w gabinecie: jak dziecko bawi się, mówi, radzi sobie z emocjami i samoobsługą w grupie. Gdy sprawa trafia do zespołu orzekającego, od 1 września 2026 r. opinia opisuje funkcjonowanie dziecka w pięciu obszarach aktywności i uczestniczenia według ICF. W pozostałych sprawach przepisy nie narzucają układu, ale te same obszary dobrze porządkują obserwacje. Opisuj konkretne sytuacje i mocne strony dziecka, nie stawiaj diagnoz.',
    rulesTitle: 'Pięć obszarów, w których opisuje się dziecko w wieku przedszkolnym (opinia dla zespołu orzekającego)',
    rules: [
      'Uczenie się i stosowanie wiedzy – zabawa, zainteresowania, rozumienie poleceń, uwaga, pamięć.',
      'Zachowania społeczne we wzajemnych kontaktach – przystosowanie społeczne i emocjonalne: relacje z dziećmi i dorosłymi, emocje, reakcje na zmianę i odmowę.',
      'Porozumiewanie się – mowa, rozumienie, inne sposoby komunikowania potrzeb.',
      'Aktywność ruchowa – poruszanie się: sprawność na sali i w ogrodzie, sprawność rąk.',
      'Dbanie o siebie – jedzenie, ubieranie, toaleta, zgłaszanie potrzeb.',
      'Do tego: mocne strony dziecka, udzielana pomoc z okresem i efektami oraz wnioski do dalszej pracy.',
      'Pełną listę wymaganych elementów i terminów znajdziesz we wzorze opinii dla zespołu orzekającego.'
    ],
    examplesNote: 'Dane w nawiasach kwadratowych uzupełnij dopiero w dokumencie przedszkola. Do narzędzi AI wpisuj wyłącznie anonimowe obserwacje – bez imienia, nazwiska i diagnoz.',
    examples: [
      {
        label: 'Przykład 1: opinia dla zespołu orzekającego – dziecko 4-letnie',
        meta: 'Układ w 5 obszarach ICF · od 1 września 2026 r.',
        text: `Opinia o funkcjonowaniu dziecka w przedszkolu – dla zespołu orzekającego [nazwa poradni]
Data wydania opinii: [data]
Imię i nazwisko dziecka: [imię i nazwisko], grupa [4-latków], [nazwa przedszkola]
Dziecko uczęszcza do przedszkola od [września 2025 r.].

1. Mocne strony i uzdolnienia
Dziecko jest pogodne, lubi muzykę i zabawy ruchowe. Długo i z uwagą układa układanki oraz buduje z klocków. Dobrze zapamiętuje stały rytm dnia.

2. Funkcjonowanie w obszarach aktywności i uczestniczenia (ICF)
Uczenie się i stosowanie wiedzy: wybiera stale te same zabawy (klocki, układanki, samochody ustawiane w szeregu). W zajęciach przy stoliku uczestniczy kilka minut, przy wsparciu nauczyciela. Rozumie proste, pojedyncze polecenia poparte gestem lub obrazkiem.
Zachowania społeczne we wzajemnych kontaktach – przystosowanie społeczne i emocjonalne: bawi się obok dzieci, rzadko włącza się do wspólnej zabawy. Na zmianę aktywności lub hałas reaguje płaczem, zasłania uszy; uspokaja się w cichym kąciku sali po kilku minutach. Dobrze reaguje na zapowiedź zmiany pokazaną na planie dnia.
Porozumiewanie się: mówi pojedyncze słowa, potrzeby sygnalizuje gestem lub prowadząc dorosłego za rękę. Reaguje na swoje imię nie za każdym razem. Korzysta z kilku obrazków do wyboru zabawy.
Aktywność ruchowa – poruszanie się: biega i wspina się sprawnie. Niechętnie rysuje, kredkę trzyma całą dłonią.
Dbanie o siebie: je samodzielnie wybrane potrawy, z ograniczoną liczbą produktów. Przy ubieraniu potrzebuje pomocy. Korzysta z toalety z przypomnieniem dorosłego.

3. Działania, formy pomocy, okres i efekty
Od [października 2025 r.]: plan dnia w obrazkach, cichy kącik, zapowiadanie zmian, zajęcia z logopedą (2 razy w tygodniu) i z psychologiem (1 raz w tygodniu). Efekty: dziecko krócej płacze przy zmianie aktywności i zaczęło wskazywać obrazki, by poprosić o zabawę.

4. Wnioski dotyczące dalszej pracy
Kontynuować pracę z planem obrazkowym i komunikacją wspomagającą, stopniowo wydłużać udział w zajęciach grupowych, utrzymać stałą współpracę z rodzicami.

[podpis dyrektora] – opinię przygotowali: [wychowawca grupy, logopeda, psycholog]`
      },
      {
        label: 'Przykład 2: informacja dla poradni – dziecko 6-letnie przed pójściem do szkoły',
        meta: 'Treści nie określa przepis – uniwersalny układ',
        text: `Informacja o funkcjonowaniu dziecka [imię i nazwisko], grupa [6-latków], [nazwa przedszkola]
Okres obserwacji: [wrzesień–listopad 2026]. Informacja przygotowana na prośbę rodziców.

Mocne strony
Dziecko jest towarzyskie, chętnie opowiada, ma bogate słownictwo i dużą wiedzę o świecie. Lubi zabawy tematyczne i konstrukcyjne, często jest ich pomysłodawcą.

Zabawa i uczenie się
W zabawie dowolnej skupia się długo. W zajęciach przy stoliku szybko się zniechęca, zwłaszcza gdy trzeba rysować lub pisać po śladzie. Rozpoznaje kilka liter, liczy do dziesięciu, ma trudność z dzieleniem wyrazów na głoski.

Sprawność rąk
Nieprawidłowo trzyma kredkę, rysuje słabą linią, unika wycinania. Rysunki są ubogie w szczegóły w porównaniu z tym, jak dużo potrafi o nich opowiedzieć.

Emocje i relacje
Jest lubiane przez dzieci. Gdy coś nie wychodzi, mówi „nie umiem” i odkłada pracę; przy zachęcie i podzieleniu zadania na części kończy je.

Samodzielność
W pełni samodzielne w jedzeniu, ubieraniu i toalecie.

Dotychczasowa pomoc
Ćwiczenia usprawniające dłoń w formie zabawy (plastelina, nawlekanie, spinacze) 3 razy w tygodniu, krótsze zadania graficzne. Widoczna niewielka poprawa chwytu.

Pytania do poradni
Prosimy o ocenę sprawności grafomotorycznej i słuchu fonematycznego oraz wskazówki do pracy przed rozpoczęciem nauki w szkole.

[data] [podpis nauczyciela]`
      }
    ],
    phrases: [
      ['Zabawa i uczenie się', [
        'Najchętniej wybiera zabawy konstrukcyjne i układanki.',
        'W zajęciach przy stoliku uczestniczy kilka minut, przy wsparciu nauczyciela.',
        'Rozumie proste polecenia poparte gestem lub obrazkiem.',
        'Długo skupia się na zabawie, którą samo wybrało.'
      ]],
      ['Relacje i emocje', [
        'Bawi się obok dzieci, rzadko włącza się do wspólnej zabawy.',
        'Na zmianę aktywności reaguje płaczem; uspokaja się w cichym kąciku.',
        'Chętnie nawiązuje kontakt z dorosłymi.',
        'Gdy coś się nie udaje, odkłada pracę i potrzebuje zachęty.'
      ]],
      ['Mowa i porozumiewanie się', [
        'Mówi pojedyncze słowa, potrzeby sygnalizuje gestem.',
        'Wypowiada się zdaniami, mowa jest zrozumiała dla otoczenia.',
        'Zniekształca głoski [sz, ż, cz, dż], co utrudnia zrozumienie wypowiedzi.',
        'Korzysta z obrazków, by wybrać zabawę lub poprosić o pomoc.'
      ]],
      ['Ruch, samoobsługa i pomoc', [
        'Sprawnie biega i wspina się; niechętnie rysuje i wycina.',
        'Je samodzielnie, przy ubieraniu potrzebuje pomocy.',
        'Korzysta z toalety z przypomnieniem dorosłego.',
        'Plan dnia w obrazkach wyraźnie ułatwia dziecku zmianę aktywności.'
      ]]
    ],
    mistakes: [
      'Nazwy rozpoznań („autyzm”, „ADHD”, „opóźnienie”) zamiast opisu zachowania – diagnozę stawiają specjaliści.',
      'Porównania do „normy” i do innych dzieci zamiast opisu tego, co dziecko robi samodzielnie, a co z pomocą.',
      'Pominięcie mocnych stron i ulubionych zabaw – to od nich zaczyna się dalsza praca.',
      'Brak informacji, co przedszkole już wprowadziło i z jakim skutkiem.',
      'W opinii dla zespołu orzekającego: pominięcie któregoś z pięciu obszarów.',
      'Wpisywanie imienia, nazwiska lub diagnoz dziecka do narzędzi AI.'
    ],
    faq: [
      ['Kto przygotowuje opinię o dziecku w przedszkolu?', 'Zwykle nauczyciele grupy razem ze specjalistami pracującymi z dzieckiem. Opinię dla zespołu orzekającego przekazuje dyrektor, na prośbę przewodniczącego zespołu albo rodzica.'],
      ['Czym różni się opinia o przedszkolaku od opinii o uczniu?', 'W opinii dla zespołu orzekającego dziecko w wieku przedszkolnym opisuje się w pięciu obszarach, a ucznia w siedmiu. U przedszkolaka więcej miejsca zajmują zabawa, mowa, emocje i samoobsługa.'],
      ['Czy mogę opisać, co mówią rodzice o zachowaniu dziecka w domu?', 'Tak, ale wyraźnie zaznacz, że to informacja od rodziców, a nie Twoja obserwacja.'],
      ['Czy mogę użyć AI do napisania opinii?', 'Tak, do uporządkowania anonimowych notatek – bez imienia, nazwiska i diagnoz. Dane dziecka uzupełnij dopiero w dokumencie przedszkola, a treść sprawdź: za opinię odpowiada placówka.']
    ],
    legal: [
      ['§ 7 rozporządzenia Ministra Edukacji z 2 marca 2026 r. w sprawie orzeczeń i opinii wydawanych przez zespoły orzekające (Dz.U. 2026 poz. 428) – obowiązuje od 14.04.2026, § 7 ust. 6–7 od 1.09.2026', 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20260000428'],
      ['Pełny wzór opinii dla zespołu orzekającego z listą wymaganych elementów i terminami', 'opinia-o-uczniu-do-poradni-przyklady.html']
    ],
    tool: {
      name: 'Asystenta Pedagoga',
      url: 'asystent-pedagoga.html?doc=opinia',
      campaign: 'opinia-przedszkole',
      text: 'Wpisz anonimowe obserwacje z grupy (bez imienia i nazwiska), a Asystent Pedagoga ułoży z nich opinię w obszarach właściwych dla wieku dziecka – z mocnymi stronami, udzielaną pomocą i wnioskami. Za darmo, bez rejestracji.'
    }
  },
  {
    slug: 'opinia-o-uczniu-zdolnym-przyklady.html',
    updated: '16 listopada 2026',
    updatedIso: '2026-11-16',
    title: 'Opinia o uczniu zdolnym – przykłady i zwroty | EduBox AI',
    description: 'Opinia wychowawcy lub nauczyciela o uczniu zdolnym: przykłady do stypendium, konkursu i poradni, zwroty do skopiowania oraz błędy, przez które opinia brzmi pusto.',
    kicker: 'Wzory i przykłady · Opinie o uczniu',
    h1: 'Opinia o uczniu zdolnym – przykłady do stypendium, konkursu i poradni',
    short: 'Opinię o uczniu zdolnym pisze się najczęściej do wniosku o stypendium, do zgłoszenia na konkurs lub program dla uzdolnionych albo dla poradni, gdy rodzice i szkoła szukają dla ucznia odpowiedniej ścieżki. Przekonuje nie liczba przymiotników, tylko konkret: osiągnięcia z datą i szczeblem, przykłady samodzielnej pracy wykraczającej poza program i opis tego, jak uczeń się uczy. Wymagania co do treści i formy zawsze sprawdź w regulaminie, do którego opinia jest załącznikiem.',
    rulesTitle: 'Co powinna zawierać opinia o uczniu zdolnym',
    rules: [
      'Cel opinii i adresat, okres, w którym uczysz ucznia lub jesteś wychowawcą.',
      'Osiągnięcia: konkursy i olimpiady z nazwą, rokiem i szczeblem, średnia ocen, projekty – tylko potwierdzone fakty.',
      'Sposób uczenia się: samodzielność, dociekliwość, tempo, praca z materiałem spoza programu.',
      'Przykład jednej, dwóch sytuacji, które dobrze pokazują uzdolnienie.',
      'Funkcjonowanie w klasie: współpraca, pomoc innym, zaangażowanie w życie szkoły.',
      'Rzetelnie także o tym, co wymaga wsparcia (np. organizacja pracy, relacje) – szczególnie w opinii dla poradni.',
      'Jednoznaczna rekomendacja na końcu.'
    ],
    examplesNote: 'Dane w nawiasach kwadratowych uzupełnij dopiero w dokumencie szkoły. Do narzędzi AI wpisuj wyłącznie anonimowe opisy – bez imienia i nazwiska ucznia.',
    examples: [
      {
        label: 'Przykład 1: opinia wychowawcy do wniosku o stypendium – klasa 8',
        meta: 'Stypendium za wyniki i osiągnięcia',
        text: `Opinia wychowawcy o uczennicy [imię i nazwisko], klasa [8a], [nazwa szkoły]
Opinia do wniosku o [nazwa stypendium]. Wychowawcą klasy jestem od [września 2024 r.].

Uczennica od trzech lat uzyskuje bardzo wysokie wyniki w nauce; w roku szkolnym [2025/2026] jej średnia ocen wyniosła [5,4], a zachowanie oceniono jako wzorowe. Szczególne uzdolnienia przejawia w przedmiotach przyrodniczych. Jest [finalistką Wojewódzkiego Konkursu Biologicznego w roku szkolnym 2025/2026] oraz [laureatką szkolnego konkursu chemicznego].

Uczy się samodzielnie i systematycznie. Sięga po materiały wykraczające poza program – w tym roku przygotowała i przedstawiła klasie własną obserwację [rozwoju roślin w różnych warunkach oświetlenia], prowadzoną przez sześć tygodni z pełną dokumentacją. Potrafi stawiać pytania badawcze i krytycznie oceniać własne wyniki.

W klasie jest życzliwa i chętnie tłumaczy materiał kolegom; z własnej inicjatywy prowadzi cotygodniowe powtórki z biologii przed sprawdzianami. Działa w samorządzie uczniowskim.

Z pełnym przekonaniem popieram wniosek o przyznanie stypendium.

[data] [podpis wychowawcy]`
      },
      {
        label: 'Przykład 2: opinia nauczyciela matematyki – zgłoszenie do programu dla uzdolnionych',
        meta: 'Konkurs, program, zajęcia dla uzdolnionych',
        text: `Opinia nauczyciela matematyki o uczniu [imię i nazwisko], klasa [6b], [nazwa szkoły]
Opinia do zgłoszenia na [nazwa programu / zajęć]. Uczę ucznia od [września 2024 r.], 4 godziny tygodniowo.

Uczeń wyraźnie wyprzedza program klasy szóstej. Zadania typowe rozwiązuje w pamięci, a najwięcej satysfakcji dają mu zadania nietypowe, w których sam szuka metody. Często proponuje drugie, krótsze rozwiązanie i potrafi wyjaśnić, dlaczego jest poprawne. Samodzielnie poznał [równania z jedną niewiadomą i podstawy potęgowania].

W roku szkolnym [2025/2026] uzyskał [wyróżnienie w konkursie Kangur Matematyczny] i zajął [II miejsce w powiatowym konkursie matematycznym]. Uczestniczy w szkolnym kole matematycznym, gdzie pracuje z zadaniami dla klas starszych.

Na lekcjach, gdy skończy pracę przed innymi, otrzymuje zadania dodatkowe; chętnie pomaga kolegom, tłumacząc cierpliwie i bez podawania gotowego wyniku. Wymaga jeszcze pracy nad starannością zapisu rozwiązań – tok rozumowania często zostawia „w głowie”.

Udział w zajęciach o podwyższonym poziomie będzie dla niego właściwym wyzwaniem. Rekomenduję przyjęcie ucznia do programu.

[data] [podpis nauczyciela]`
      },
      {
        label: 'Przykład 3: opinia wychowawcy dla poradni – uczeń zdolny, klasa 3',
        meta: 'Dla poradni · szukanie form wsparcia',
        text: `Opinia wychowawcy o uczniu [imię i nazwisko], klasa [3a], [nazwa szkoły]
Okres obserwacji: [wrzesień 2024 – listopad 2026]. Opinia przygotowana na prośbę rodziców.

Mocne strony i uzdolnienia
Uczeń płynnie czyta ze zrozumieniem teksty przeznaczone dla starszych dzieci, samodzielnie korzysta z encyklopedii i atlasów. Liczy w pamięci w zakresie 1000, rozwiązuje zadania z treścią przewidziane dla klas starszych. Ma bardzo dobrą pamięć i szeroką wiedzę o kosmosie i historii.

Funkcjonowanie na lekcjach
Zadania wykonuje znacznie szybciej niż klasa. Gdy czeka na innych, zaczyna rozmawiać, rysować lub komentować głośno pracę kolegów. Przy zadaniach powtarzalnych mówi, że są „nudne”, i wykonuje je niestarannie. Przy zadaniach trudnych pracuje długo i w skupieniu.

Funkcjonowanie społeczne i emocjonalne
Chętniej rozmawia z dorosłymi niż z rówieśnikami. W zabawie chce ustalać zasady; gdy dzieci się nie zgadzają, odchodzi. Źle znosi własne błędy – potrafi podrzeć kartkę z pomyłką.

Dotychczasowe działania
Zadania dodatkowe o wyższym stopniu trudności, rola „asystenta” przy pracy w parach, udział w szkolnym kole szachowym. Zadania dodatkowe wyraźnie zmniejszyły liczbę sytuacji przeszkadzania na lekcji.

Pytania do poradni
Prosimy o ocenę możliwości ucznia oraz o wskazanie form pracy z uczniem zdolnym i sposobów wspierania go w relacjach z rówieśnikami.

[data] [podpis wychowawcy]`
      }
    ],
    phrases: [
      ['Uzdolnienia i sposób uczenia się', [
        'Wyraźnie wyprzedza program realizowany w klasie.',
        'Samodzielnie sięga po materiały wykraczające poza podręcznik.',
        'Stawia dociekliwe pytania i szuka własnych metod rozwiązania.',
        'Przy zadaniach trudnych pracuje długo i w skupieniu.'
      ]],
      ['Osiągnięcia', [
        'W roku szkolnym [rok] uzyskał tytuł [laureata / finalisty] konkursu [nazwa].',
        'Średnia ocen w roku szkolnym [rok] wyniosła [wartość].',
        'Przygotował i przedstawił projekt [temat].',
        'Reprezentował szkołę w [zawodach / konkursie] na szczeblu [szczebel].'
      ]],
      ['Postawa i współpraca', [
        'Chętnie tłumaczy materiał kolegom, cierpliwie i bez podawania gotowego wyniku.',
        'Angażuje się w życie klasy i szkoły.',
        'Jest odpowiedzialny i dotrzymuje terminów.',
        'Potrafi przyjąć uwagę i poprawić pracę.'
      ]],
      ['Rekomendacja', [
        'Z pełnym przekonaniem popieram wniosek o przyznanie stypendium.',
        'Rekomenduję przyjęcie ucznia do programu.',
        'Udział w zajęciach o podwyższonym poziomie będzie dla niego właściwym wyzwaniem.',
        'Prosimy o wskazanie form pracy z uczniem zdolnym.'
      ]]
    ],
    mistakes: [
      'Same przymiotniki („wybitny”, „wyjątkowy”, „niezwykle utalentowany”) bez jednego konkretnego przykładu.',
      'Osiągnięcia bez nazwy konkursu, roku i szczebla – komisja nie ma jak ich ocenić.',
      'Wpisywanie osiągnięć niepotwierdzonych dokumentem.',
      'Przemilczenie trudności w opinii dla poradni – uczeń zdolny też może potrzebować wsparcia.',
      'Pominięcie wymagań z regulaminu stypendium lub konkursu (forma, długość, załączniki).',
      'Brak jednoznacznej rekomendacji na końcu.'
    ],
    faq: [
      ['Kto pisze opinię o uczniu zdolnym?', 'Najczęściej wychowawca albo nauczyciel przedmiotu, w którym uczeń ma osiągnięcia. Kto ma ją podpisać i czy potrzebny jest podpis dyrektora, określa regulamin stypendium, konkursu lub programu.'],
      ['Jak długa powinna być opinia do stypendium?', 'Zwykle pół strony do jednej strony. Jeśli regulamin podaje limit albo formularz, trzymaj się go.'],
      ['Czy w opinii do stypendium pisać o słabszych stronach ucznia?', 'W opinii popierającej wniosek nie ma takiej potrzeby, o ile regulamin tego nie wymaga. W opinii dla poradni – tak, bo jej celem jest dobranie wsparcia.'],
      ['Czy mogę użyć AI do zredagowania opinii?', 'Tak – opisz anonimowo osiągnięcia i sposób pracy ucznia, bez imienia i nazwiska. AI nie zna faktów, więc każdą nazwę konkursu, datę i wynik wpisz i sprawdź samodzielnie.']
    ],
    extraLink: { url: 'opinia-wychowawcy-o-uczniu-przyklady.html', text: 'Zobacz też: opinia wychowawcy o uczniu – przykłady dla klas 1–3 i 4–8 →' },
    tool: {
      name: 'EduDialog',
      url: 'edudialog.html?mode=ppp',
      campaign: 'opinia-uczen-zdolny',
      text: 'Wpisz w punktach osiągnięcia i obserwacje (anonimowo, bez imienia i nazwiska), a EduDialog ułoży z nich rzeczową opinię z konkretami zamiast ogólników. Za darmo, bez rejestracji.'
    }
  }
];

// ---------------------------------------------------------------------------------------------
// Partia z 16.11.2026: oceny opisowe śródroczne (osobno klasa 1, 2, 3) i wpisy do dziennika
// w przedszkolu. Części wspólne trzech stron o ocenach są w OCENA_SR, żeby poprawka w jednym
// miejscu trafiała do wszystkich.
// ---------------------------------------------------------------------------------------------
const NOWE = { updated: '16 listopada 2026', updatedIso: '2026-11-16' };

const OCENA_SR = {
  kicker: 'Wzory i przykłady · Klasy 1–3 · I półrocze',
  examplesNote: 'Przykłady są punktem wyjścia – dopasuj je do konkretnego dziecka, a formy (uczeń/uczennica) zmień według potrzeby. Imię wpisz dopiero w dzienniku.',
  mistakes: [
    'Ta sama ocena dla kilkorga dzieci z podmienionym imieniem – rodzice porównują i szybko to widzą.',
    'Ocena roczna w przebraniu: po I półroczu opisz, gdzie dziecko jest teraz i nad czym pracować do czerwca.',
    'Etykiety („słaby”, „leniwy”, „niegrzeczny”) zamiast opisu tego, co dziecko robi.',
    'Same braki albo same pochwały – rodzic potrzebuje jednego i drugiego.',
    'Wskazówki nie do wykonania w domu („więcej pracować”) zamiast konkretu („10 minut głośnego czytania dziennie”).',
    'Żargon, którego rodzic nie zrozumie („analiza i synteza słuchowa”) bez wyjaśnienia.'
  ],
  faqWspolne: [
    ['Ile zdań powinna mieć ocena śródroczna?', 'Zwykle wystarcza kilka zdań na każdą edukację i dwie, trzy konkretne wskazówki na koniec. Jeśli dziennik elektroniczny ma limit znaków, sprawdź go przed pisaniem.'],
    ['Czy ocena śródroczna musi obejmować wszystkie edukacje?', 'O tym, co i w jakiej formie zawiera ocena, decydują zasady oceniania zapisane w statucie szkoły. Sprawdź je, zanim przyjmiesz układ dla całej klasy.'],
    ['Czy mogę użyć AI do pisania ocen opisowych?', 'Tak, jako pomocy w redagowaniu – zawsze na podstawie własnych obserwacji i bez wpisywania danych dziecka do narzędzia. W EduOcena imię wpisane w polu nie trafia do AI. Ocenę ustala nauczyciel.']
  ],
  legal: [
    ['Art. 44i ustawy o systemie oświaty (tekst jedn. Dz.U. 2025 poz. 881 ze zm.)', 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20250000881'],
    ['Rozporządzenie w sprawie oceniania, klasyfikowania i promowania uczniów i słuchaczy w szkołach publicznych (tekst jedn. Dz.U. 2023 poz. 2572 ze zm.)', 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20230002572']
  ],
  extraLink: { url: 'ocena-opisowa-przyklady.html', text: 'Zobacz też: ocena opisowa roczna i ogólne zasady dla klas 1–3 →' },
  tool: (campaign) => ({
    name: 'EduOcena AI',
    url: 'eduocena.html',
    campaign,
    text: 'Wybierz klasę i ocenę śródroczną, zaznacz z list poziom ucznia w kolejnych edukacjach i dopisz własne obserwacje. AI złoży z tego spójny, życzliwy tekst, który poprawisz na kartce i skopiujesz do dziennika. Za darmo, bez rejestracji; imię zostaje w Twojej przeglądarce.'
  })
};

PAGES.push(
  {
    slug: 'ocena-opisowa-srodroczna-klasa-1-przyklady.html',
    ...NOWE,
    title: 'Ocena opisowa śródroczna klasa 1 – gotowe przykłady | EduBox AI',
    description: 'Ocena opisowa śródroczna w klasie 1: trzy pełne przykłady (bardzo dobre wyniki, przeciętne, trudności), zwroty do skopiowania i wskazówki dla rodziców po I półroczu.',
    kicker: OCENA_SR.kicker,
    h1: 'Ocena opisowa śródroczna w klasie 1 – przykłady po I półroczu',
    short: 'Pierwsza ocena opisowa w życiu dziecka ma przede wszystkim uspokoić i ukierunkować: pokazać rodzicom, co dziecko już umie po kilku miesiącach szkoły, jak się w niej odnajduje i co ćwiczyć do czerwca. W klasie 1 ważne są nie tylko litery i liczenie, ale też to, jak dziecko pracuje: czy słucha poleceń, kończy zadania, współpracuje. W roku szkolnym 2026/2027 klasa 1 uczy się według nowej podstawy programowej, dlatego w przykładach używamy nazw: edukacja językowa, matematyczna, przyrodnicza, społeczna, artystyczna, techniczna i informatyczna oraz wychowanie fizyczne.',
    rulesTitle: 'Co opisać w ocenie śródrocznej w klasie 1',
    rules: [
      'Adaptacja do szkoły: jak dziecko odnajduje się w klasie, czy zna i stosuje zasady.',
      'Edukacja językowa: poznane litery, czytanie sylab i wyrazów, pisanie po śladzie i samodzielne, wypowiedzi ustne, słuchanie.',
      'Edukacja matematyczna: liczenie, dodawanie i odejmowanie w poznanym zakresie, porównywanie, proste zadania z treścią.',
      'Pozostałe edukacje – krótko, przez to, co dziecko lubi i co mu wychodzi.',
      'Sposób pracy: koncentracja, tempo, samodzielność, kończenie zadań.',
      'Dwie, trzy konkretne wskazówki do pracy w domu na II półrocze.'
    ],
    examplesNote: OCENA_SR.examplesNote,
    examples: [
      {
        label: 'Przykład 1: uczennica z bardzo dobrymi osiągnięciami',
        meta: 'Klasa 1 · ocena śródroczna',
        text: `Uczennica bardzo dobrze odnalazła się w szkole. Zna zasady obowiązujące w klasie i ich przestrzega, chętnie podejmuje nowe zadania.
Edukacja językowa: Zna wszystkie wprowadzone litery, czyta wyrazy i krótkie zdania płynnie i ze zrozumieniem. Uważnie słucha czytanych tekstów i trafnie odpowiada na pytania. Wypowiada się pełnymi zdaniami, ma bogate słownictwo. Pisze starannie, mieści się w liniaturze, poprawnie łączy litery.
Edukacja matematyczna: Sprawnie liczy, dodaje i odejmuje w zakresie 10, także w pamięci. Porównuje liczby i poprawnie stosuje znaki >, <, =. Samodzielnie rozwiązuje proste zadania z treścią i potrafi wyjaśnić swój sposób liczenia.
Edukacja przyrodnicza i społeczna: Z ciekawością obserwuje przyrodę, zna zmiany zachodzące jesienią i zimą. Zgodnie pracuje w parze i w grupie, pomaga innym.
Edukacja artystyczna, techniczna i informatyczna: Prace plastyczne wykonuje starannie i pomysłowo, chętnie śpiewa. Sprawnie posługuje się nożyczkami i klejem, bezpiecznie korzysta z urządzeń na zajęciach.
Wychowanie fizyczne: Jest sprawna ruchowo, chętnie uczestniczy w zabawach i przestrzega ich zasad.
Wskazówki na II półrocze: Warto podsuwać uczennicy książki do samodzielnego czytania i zachęcać, by opowiadała, co przeczytała. Można też proponować jej zagadki i gry logiczne.`
      },
      {
        label: 'Przykład 2: uczeń z przeciętnymi wynikami',
        meta: 'Klasa 1 · ocena śródroczna',
        text: `Uczeń dobrze czuje się w klasie i ma kolegów. Zna zasady, czasem trzeba mu o nich przypomnieć.
Edukacja językowa: Rozpoznaje większość poznanych liter, czasem myli te o podobnym kształcie. Czyta sylabami krótkie wyrazy; dłuższe wyrazy i zdania czyta z pomocą. Chętnie opowiada o swoich przeżyciach, zwykle krótkimi zdaniami. Pisze po śladzie poprawnie, w samodzielnym pisaniu nie zawsze mieści się w liniaturze.
Edukacja matematyczna: Liczy do 10 i dodaje na konkretach (palce, liczmany). Odejmowanie sprawia mu jeszcze trudność. Proste zadania z treścią rozwiązuje z pomocą nauczyciela.
Edukacja przyrodnicza i społeczna: Interesuje się zwierzętami i chętnie o nich mówi. W zabawie jest zgodny, uczy się czekać na swoją kolej.
Edukacja artystyczna, techniczna i informatyczna: Lubi zajęcia plastyczne i muzyczne, prace wykonuje szybko, nie zawsze je kończy. Chętnie pracuje przy komputerze.
Wychowanie fizyczne: Jest aktywny i sprawny, szczególnie lubi gry z piłką.
Wskazówki na II półrocze: Warto codziennie przez 10 minut czytać z uczniem sylabami i wyrazami, utrwalać litery w zabawie (układanki, plastelina) oraz ćwiczyć odejmowanie na przedmiotach codziennego użytku.`
      },
      {
        label: 'Przykład 3: uczeń z trudnościami',
        meta: 'Klasa 1 · ocena śródroczna',
        text: `Uczeń stopniowo przyzwyczaja się do szkolnego rytmu. Jest pogodny i lubiany. Najlepiej pracuje, gdy polecenie jest krótkie i pokazane na przykładzie.
Edukacja językowa: Rozpoznaje część poznanych liter i wciąż je utrwala. Z pomocą nauczyciela łączy litery w proste sylaby. Uważnie słucha czytanych bajek i potrafi powiedzieć, o kim była historia. Mówi chętnie, zwłaszcza o tym, co go interesuje. Pisanie po śladzie wymaga jeszcze ćwiczeń – szybko męczy mu się ręka.
Edukacja matematyczna: Liczy przedmioty do 10. Dodaje w zakresie 5 z użyciem liczmanów. Rozpoznaje podstawowe figury geometryczne.
Edukacja przyrodnicza i społeczna: Lubi zajęcia w terenie i obserwacje przyrody. Uczy się pracy w grupie i przestrzegania ustalonych zasad.
Edukacja artystyczna, techniczna i informatyczna: Chętnie śpiewa i uczestniczy w zabawach przy muzyce. Prace plastyczne wykonuje po swojemu, z zaangażowaniem.
Wychowanie fizyczne: Jest sprawny ruchowo i bardzo lubi zajęcia na sali.
Wskazówki na II półrocze: Warto codziennie, krótko i w formie zabawy, utrwalać litery (np. szukanie liter na szyldach i w książeczkach), ćwiczyć dłoń przez lepienie, wycinanie i rysowanie oraz liczyć z dzieckiem przy codziennych czynnościach. Chwalenie za wysiłek pomoże mu uwierzyć we własne możliwości. Szkoła będzie nadal wspierać ucznia na zajęciach.`
      }
    ],
    phrases: [
      ['Adaptacja i sposób pracy', [
        'Bardzo dobrze odnalazł się w szkole i zna zasady obowiązujące w klasie.',
        'Stopniowo przyzwyczaja się do szkolnego rytmu dnia.',
        'Pracuje w skupieniu i kończy rozpoczęte zadania.',
        'Najlepiej pracuje, gdy polecenie jest krótkie i pokazane na przykładzie.'
      ]],
      ['Edukacja językowa', [
        'Zna wszystkie wprowadzone litery i czyta krótkie zdania.',
        'Czyta sylabami krótkie wyrazy.',
        'Rozpoznaje część poznanych liter i wciąż je utrwala.',
        'Pisze starannie i mieści się w liniaturze.',
        'Uważnie słucha czytanych tekstów i odpowiada na pytania.'
      ]],
      ['Edukacja matematyczna', [
        'Sprawnie dodaje i odejmuje w zakresie 10.',
        'Dodaje na konkretach, odejmowanie jeszcze utrwala.',
        'Poprawnie porównuje liczby i stosuje znaki >, <, =.',
        'Proste zadania z treścią rozwiązuje z pomocą nauczyciela.'
      ]],
      ['Wskazówki na II półrocze', [
        'Warto codziennie przez 10 minut czytać z dzieckiem na głos.',
        'Pomocne będzie utrwalanie liter w zabawie.',
        'Warto ćwiczyć dłoń przez lepienie, wycinanie i rysowanie.',
        'Zachęcam do liczenia przy codziennych czynnościach.'
      ]]
    ],
    mistakes: OCENA_SR.mistakes,
    faq: [
      ['Jakich nazw edukacji użyć w klasie 1 w roku szkolnym 2026/2027?', 'Nowa podstawa programowa obowiązuje w roku szkolnym 2026/2027 w klasach I i IV. W klasie 1 stosuje się nazwy: edukacja językowa, matematyczna, przyrodnicza, społeczna, artystyczna, techniczna i informatyczna oraz wychowanie fizyczne. Sprawdź też, jak edukacje nazywa Twój dziennik elektroniczny.'],
      ...OCENA_SR.faqWspolne
    ],
    legal: OCENA_SR.legal,
    extraLink: OCENA_SR.extraLink,
    tool: OCENA_SR.tool('ocena-srodroczna-klasa-1')
  },
  {
    slug: 'ocena-opisowa-srodroczna-klasa-2-przyklady.html',
    ...NOWE,
    title: 'Ocena opisowa śródroczna klasa 2 – gotowe przykłady | EduBox AI',
    description: 'Ocena opisowa śródroczna w klasie 2: trzy pełne przykłady (bardzo dobre wyniki, przeciętne, trudności), zwroty do skopiowania i wskazówki dla rodziców po I półroczu.',
    kicker: OCENA_SR.kicker,
    h1: 'Ocena opisowa śródroczna w klasie 2 – przykłady po I półroczu',
    short: 'W klasie 2 ocena śródroczna pokazuje, jak dziecko rozwinęło umiejętności z pierwszej klasy: czy czyta płynniej i ze zrozumieniem, jak radzi sobie z pisaniem z pamięci, liczeniem w zakresie 100 i początkami mnożenia. To także moment, w którym warto nazwać pierwsze utrwalone trudności i podać rodzicom proste sposoby pracy w domu. W roku szkolnym 2026/2027 klasa 2 uczy się jeszcze według dotychczasowej podstawy programowej, stąd nazwy edukacji: polonistyczna, matematyczna, przyrodnicza, społeczna, plastyczna, techniczna, muzyczna, informatyczna i wychowanie fizyczne.',
    rulesTitle: 'Co opisać w ocenie śródrocznej w klasie 2',
    rules: [
      'Czytanie: tempo, płynność i rozumienie krótkich tekstów.',
      'Pisanie: przepisywanie, pisanie z pamięci i ze słuchu, pierwsze zasady ortograficzne, staranność.',
      'Wypowiedzi ustne i pisemne: budowanie zdań, opowiadanie.',
      'Matematyka: dodawanie i odejmowanie w zakresie 100, początki mnożenia, zadania z treścią, zegar, kalendarz, pieniądze.',
      'Pozostałe edukacje – krótko, przez mocne strony dziecka.',
      'Postęp od września i konkretne wskazówki do pracy w domu.'
    ],
    examplesNote: OCENA_SR.examplesNote,
    examples: [
      {
        label: 'Przykład 1: uczeń z bardzo dobrymi osiągnięciami',
        meta: 'Klasa 2 · ocena śródroczna',
        text: `Edukacja polonistyczna: Uczeń czyta płynnie, z właściwą intonacją, i rozumie przeczytany tekst. Samodzielnie wyszukuje w nim potrzebne informacje. Wypowiada się rozwiniętymi zdaniami, logicznie i na temat. Pisze starannie; w pisaniu z pamięci i ze słuchu stosuje poznane zasady ortograficzne. Samodzielnie układa i zapisuje kilkuzdaniową wypowiedź.
Edukacja matematyczna: Sprawnie dodaje i odejmuje w zakresie 100, także z przekroczeniem progu dziesiątkowego. Rozumie mnożenie jako dodawanie jednakowych składników i mnoży w poznanym zakresie. Samodzielnie rozwiązuje zadania z treścią. Odczytuje godziny na zegarze i posługuje się kalendarzem.
Edukacja przyrodnicza i społeczna: Ma dużą wiedzę o roślinach i zwierzętach, chętnie dzieli się nią z klasą. Jest koleżeński, potrafi współpracować i słuchać innych.
Edukacja plastyczna, techniczna i muzyczna: Prace wykonuje starannie, z dbałością o szczegóły. Chętnie śpiewa i gra na instrumentach perkusyjnych.
Edukacja informatyczna: Sprawnie posługuje się komputerem i zna zasady bezpiecznej pracy.
Wychowanie fizyczne: Jest sprawny i zaangażowany, przestrzega zasad gier.
Wskazówki na II półrocze: Warto zachęcać ucznia do czytania dłuższych książek i do zapisywania własnych opowiadań. Dobrym wyzwaniem będą zadania matematyczne wymagające kilku kroków.`
      },
      {
        label: 'Przykład 2: uczennica z przeciętnymi wynikami',
        meta: 'Klasa 2 · ocena śródroczna',
        text: `Edukacja polonistyczna: Uczennica czyta poprawnie, w wolnym tempie; krótkie teksty rozumie i odpowiada na pytania do nich. Wypowiada się chętnie, najczęściej krótkimi zdaniami. Przepisuje bezbłędnie, w pisaniu z pamięci i ze słuchu popełnia błędy – pracuje nad zasadami pisowni „ó”, „rz” i wielkiej litery. Pismo jest czytelne.
Edukacja matematyczna: Dodaje i odejmuje w zakresie 100 bez przekroczenia progu; przy przekraczaniu progu dziesiątkowego korzysta z pomocy. Poznaje mnożenie i wykonuje je na konkretach. Proste zadania z treścią rozwiązuje samodzielnie, trudniejsze z pomocą. Odczytuje pełne godziny na zegarze.
Edukacja przyrodnicza i społeczna: Z zainteresowaniem uczestniczy w zajęciach o przyrodzie. Jest życzliwa wobec koleżanek i kolegów, chętnie pracuje w parze.
Edukacja plastyczna, techniczna i muzyczna: Lubi zajęcia plastyczne, prace wykonuje pomysłowo. Chętnie śpiewa w grupie.
Edukacja informatyczna: Posługuje się komputerem w podstawowym zakresie.
Wychowanie fizyczne: Chętnie uczestniczy w zajęciach ruchowych.
Wskazówki na II półrocze: Warto codziennie czytać na głos przez 10–15 minut, ćwiczyć ortografię w krótkich dyktandach i grach słownych oraz utrwalać liczenie z przekroczeniem progu dziesiątkowego, np. przy grach planszowych i zakupach.`
      },
      {
        label: 'Przykład 3: uczeń z trudnościami',
        meta: 'Klasa 2 · ocena śródroczna',
        text: `Edukacja polonistyczna: Uczeń czyta sylabami, wolno; od września robi postępy – rzadziej myli litery i chętniej podejmuje próby czytania. Tekst czytany przez nauczyciela rozumie dobrze i potrafi go opowiedzieć z pomocą pytań. Przepisuje poprawnie krótkie zdania; pisanie z pamięci sprawia mu trudność – opuszcza litery i końcówki wyrazów. Potrzebuje więcej czasu na pracę pisemną.
Edukacja matematyczna: Dodaje i odejmuje w zakresie 20, w zakresie 100 liczy z użyciem pomocy (liczydło, oś liczbowa). Mnożenie poznaje na konkretach. Zadania z treścią rozwiązuje, gdy zostaną odczytane na głos i rozrysowane. Dobrze radzi sobie z mierzeniem i zadaniami praktycznymi.
Edukacja przyrodnicza i społeczna: Lubi zajęcia przyrodnicze i doświadczenia. Jest uczynny i lubiany w klasie.
Edukacja plastyczna, techniczna i muzyczna: Ma zdolności manualne, prace techniczne wykonuje starannie.
Edukacja informatyczna: Chętnie i sprawnie pracuje przy komputerze.
Wychowanie fizyczne: Jest bardzo sprawny ruchowo, odnosi sukcesy w grach zespołowych.
Wskazówki na II półrocze: Warto codziennie czytać z uczniem na zmianę (zdanie dziecko, zdanie dorosły), układać wyrazy z rozsypanek literowych i liczyć na konkretach. Pomocne będzie chwalenie za każdy postęp. Uczeń nadal będzie korzystał ze wsparcia w szkole.`
      }
    ],
    phrases: [
      ['Czytanie i wypowiedzi', [
        'Czyta płynnie, z właściwą intonacją, i rozumie czytany tekst.',
        'Czyta poprawnie, w wolnym tempie.',
        'Czyta sylabami; od września robi wyraźne postępy.',
        'Wypowiada się rozwiniętymi zdaniami, logicznie i na temat.'
      ]],
      ['Pisanie', [
        'W pisaniu z pamięci i ze słuchu stosuje poznane zasady ortograficzne.',
        'Przepisuje bezbłędnie; w pisaniu ze słuchu popełnia błędy.',
        'Pracuje nad pisownią „ó”, „rz” i wielkiej litery.',
        'Potrzebuje więcej czasu na pracę pisemną.'
      ]],
      ['Edukacja matematyczna', [
        'Sprawnie dodaje i odejmuje w zakresie 100, także z przekroczeniem progu.',
        'Przy przekraczaniu progu dziesiątkowego korzysta z pomocy.',
        'Rozumie mnożenie i wykonuje je w poznanym zakresie.',
        'Zadania z treścią rozwiązuje po odczytaniu ich na głos.'
      ]],
      ['Wskazówki na II półrocze', [
        'Warto codziennie czytać na głos przez 10–15 minut.',
        'Pomocne będą krótkie dyktanda i gry słowne.',
        'Warto utrwalać liczenie przy grach planszowych i zakupach.',
        'Zachęcam do zapisywania własnych krótkich opowiadań.'
      ]]
    ],
    mistakes: OCENA_SR.mistakes,
    faq: [
      ['Jakich nazw edukacji użyć w klasie 2 w roku szkolnym 2026/2027?', 'Nowa podstawa programowa obowiązuje w roku szkolnym 2026/2027 w klasach I i IV, więc klasa 2 pracuje jeszcze według dotychczasowej: edukacja polonistyczna, matematyczna, przyrodnicza, społeczna, plastyczna, techniczna, muzyczna, informatyczna i wychowanie fizyczne.'],
      ...OCENA_SR.faqWspolne
    ],
    legal: OCENA_SR.legal,
    extraLink: OCENA_SR.extraLink,
    tool: OCENA_SR.tool('ocena-srodroczna-klasa-2')
  },
  {
    slug: 'ocena-opisowa-srodroczna-klasa-3-przyklady.html',
    ...NOWE,
    title: 'Ocena opisowa śródroczna klasa 3 – gotowe przykłady | EduBox AI',
    description: 'Ocena opisowa śródroczna w klasie 3: trzy pełne przykłady (bardzo dobre wyniki, przeciętne, trudności), zwroty do skopiowania i wskazówki przed przejściem do klasy 4.',
    kicker: OCENA_SR.kicker,
    h1: 'Ocena opisowa śródroczna w klasie 3 – przykłady po I półroczu',
    short: 'Ocena śródroczna w klasie 3 to ostatni moment, żeby spokojnie powiedzieć rodzicom, co warto dopracować przed klasą 4: czytanie ze zrozumieniem dłuższych tekstów, samodzielne pisanie, tabliczkę mnożenia, zadania złożone i organizację własnej pracy. Dobra ocena pokazuje postęp, nazywa trudności bez straszenia i daje konkretny plan na II półrocze. W roku szkolnym 2026/2027 klasa 3 uczy się według dotychczasowej podstawy programowej, stąd nazwy edukacji: polonistyczna, matematyczna, przyrodnicza, społeczna, plastyczna, techniczna, muzyczna, informatyczna i wychowanie fizyczne.',
    rulesTitle: 'Co opisać w ocenie śródrocznej w klasie 3',
    rules: [
      'Czytanie ze zrozumieniem dłuższych tekstów i wyszukiwanie informacji.',
      'Pisanie: samodzielne wypowiedzi (opis, opowiadanie, list), ortografia, interpunkcja, staranność.',
      'Matematyka: tabliczka mnożenia, dzielenie, działania w zakresie 100 i większym, zadania złożone, obliczenia praktyczne.',
      'Samodzielność i organizacja pracy: przygotowanie do lekcji, tempo, kończenie zadań.',
      'Pozostałe edukacje – przez mocne strony i zainteresowania.',
      'Plan na II półrocze: co dopracować przed klasą 4.'
    ],
    examplesNote: OCENA_SR.examplesNote,
    examples: [
      {
        label: 'Przykład 1: uczennica z bardzo dobrymi osiągnięciami',
        meta: 'Klasa 3 · ocena śródroczna',
        text: `Edukacja polonistyczna: Uczennica czyta płynnie i wyraziście, rozumie dłuższe teksty i samodzielnie wyszukuje w nich informacje. Chętnie czyta lektury i książki spoza listy. Jej wypowiedzi ustne są rozbudowane i uporządkowane. Samodzielnie pisze opowiadania, opisy i listy, dbając o poprawność ortograficzną i interpunkcyjną. Zna poznane części mowy.
Edukacja matematyczna: Biegle zna tabliczkę mnożenia i sprawnie dzieli. Wykonuje obliczenia w pamięci i pisemnie w poznanym zakresie. Samodzielnie rozwiązuje zadania złożone i potrafi ułożyć własne. Sprawnie wykonuje obliczenia zegarowe, kalendarzowe i pieniężne.
Edukacja przyrodnicza i społeczna: Ma szeroką wiedzę o przyrodzie, korzysta z atlasów i encyklopedii. Jest odpowiedzialna, chętnie podejmuje dodatkowe zadania i pomaga innym.
Edukacja plastyczna, techniczna i muzyczna: Prace wykonuje starannie i twórczo. Chętnie śpiewa i gra na instrumentach.
Edukacja informatyczna: Sprawnie korzysta z poznanych programów i zna zasady bezpieczeństwa w internecie.
Wychowanie fizyczne: Jest sprawna, zaangażowana i przestrzega zasad fair play.
Wskazówki na II półrocze: Warto rozwijać zainteresowania uczennicy przez udział w konkursach i samodzielne projekty. Dobrym przygotowaniem do klasy 4 będzie sporządzanie krótkich notatek z przeczytanych tekstów.`
      },
      {
        label: 'Przykład 2: uczeń z przeciętnymi wynikami',
        meta: 'Klasa 3 · ocena śródroczna',
        text: `Edukacja polonistyczna: Uczeń czyta poprawnie i w dobrym tempie; krótsze teksty rozumie, w dłuższych potrzebuje pytań pomocniczych, by wskazać najważniejsze informacje. Wypowiada się chętnie. Samodzielne prace pisemne są krótkie; zna zasady ortograficzne, ale nie zawsze stosuje je w praktyce. Pismo jest czytelne.
Edukacja matematyczna: Zna większą część tabliczki mnożenia, trudniejsze przypadki jeszcze utrwala. Dodaje i odejmuje w zakresie 100 sprawnie, obliczenia pisemne wykonuje z drobnymi błędami. Zadania proste rozwiązuje samodzielnie, w złożonych potrzebuje naprowadzenia. Radzi sobie z obliczeniami pieniężnymi i zegarowymi.
Edukacja przyrodnicza i społeczna: Interesuje się przyrodą, aktywnie uczestniczy w doświadczeniach. Jest koleżeński i zgodnie pracuje w grupie.
Edukacja plastyczna, techniczna i muzyczna: Chętnie wykonuje prace techniczne, lubi zajęcia muzyczne.
Edukacja informatyczna: Dobrze radzi sobie z pracą przy komputerze.
Wychowanie fizyczne: Jest aktywny, lubi gry zespołowe.
Wskazówki na II półrocze: Warto utrwalić całą tabliczkę mnożenia (krótko, ale codziennie), czytać dłuższe teksty i po każdym rozdziale opowiadać, o czym był, oraz sprawdzać własne prace pisemne przed oddaniem. Przed klasą 4 pomocne będzie samodzielne pakowanie plecaka i pilnowanie terminów.`
      },
      {
        label: 'Przykład 3: uczennica z trudnościami',
        meta: 'Klasa 3 · ocena śródroczna',
        text: `Edukacja polonistyczna: Uczennica czyta wolno, wyrazami; przy dłuższych tekstach szybko się męczy. Tekst wysłuchany rozumie dobrze i trafnie odpowiada na pytania. W pisaniu z pamięci i ze słuchu popełnia liczne błędy, mimo że zna zasady pisowni. Samodzielnie układa dwa, trzy zdania na podany temat. Od września widać postęp w staranności pisma.
Edukacja matematyczna: Tabliczkę mnożenia opanowała częściowo, liczy z pomocą tabliczki i liczmanów. Dodaje i odejmuje w zakresie 100 z użyciem pomocy. Zadania z treścią rozwiązuje po wspólnym omówieniu i narysowaniu. Dobrze radzi sobie z mierzeniem i ważeniem.
Edukacja przyrodnicza i społeczna: Chętnie uczestniczy w zajęciach przyrodniczych, ma dużą wiedzę o zwierzętach. Jest życzliwa i opiekuńcza wobec innych.
Edukacja plastyczna, techniczna i muzyczna: Ma zdolności plastyczne – jej prace są barwne i pełne szczegółów. Pięknie śpiewa.
Edukacja informatyczna: Chętnie pracuje przy komputerze i korzysta z programów edukacyjnych.
Wychowanie fizyczne: Chętnie ćwiczy i przestrzega zasad.
Wskazówki na II półrocze: Warto codziennie czytać z uczennicą przez 15 minut (na zmianę z dorosłym), utrwalać tabliczkę mnożenia w grach i piosenkach oraz ćwiczyć pisanie krótkich, kilkuzdaniowych tekstów. Uczennica nadal będzie korzystać ze wsparcia w szkole; warto wspólnie zaplanować, jak przygotować ją do wymagań klasy 4.`
      }
    ],
    phrases: [
      ['Czytanie i wypowiedzi', [
        'Rozumie dłuższe teksty i samodzielnie wyszukuje w nich informacje.',
        'W dłuższych tekstach potrzebuje pytań pomocniczych.',
        'Tekst wysłuchany rozumie dobrze i trafnie odpowiada na pytania.',
        'Jej wypowiedzi ustne są rozbudowane i uporządkowane.'
      ]],
      ['Pisanie', [
        'Samodzielnie pisze opowiadania, opisy i listy.',
        'Zna zasady ortograficzne, ale nie zawsze stosuje je w praktyce.',
        'Samodzielne prace pisemne są krótkie.',
        'Od września widać postęp w staranności pisma.'
      ]],
      ['Edukacja matematyczna', [
        'Biegle zna tabliczkę mnożenia i sprawnie dzieli.',
        'Zna większą część tabliczki mnożenia, trudniejsze przypadki utrwala.',
        'Samodzielnie rozwiązuje zadania złożone.',
        'W zadaniach złożonych potrzebuje naprowadzenia.'
      ]],
      ['Przed klasą 4', [
        'Warto ćwiczyć sporządzanie krótkich notatek z przeczytanych tekstów.',
        'Pomocne będzie samodzielne pakowanie plecaka i pilnowanie terminów.',
        'Warto sprawdzać własne prace pisemne przed oddaniem.',
        'Zachęcam do codziennego, krótkiego utrwalania tabliczki mnożenia.'
      ]]
    ],
    mistakes: OCENA_SR.mistakes,
    faq: [
      ['Jakich nazw edukacji użyć w klasie 3 w roku szkolnym 2026/2027?', 'Nowa podstawa programowa obowiązuje w roku szkolnym 2026/2027 w klasach I i IV, więc klasa 3 pracuje jeszcze według dotychczasowej: edukacja polonistyczna, matematyczna, przyrodnicza, społeczna, plastyczna, techniczna, muzyczna, informatyczna i wychowanie fizyczne.'],
      ...OCENA_SR.faqWspolne
    ],
    legal: OCENA_SR.legal,
    extraLink: OCENA_SR.extraLink,
    tool: OCENA_SR.tool('ocena-srodroczna-klasa-3')
  },
  {
    slug: 'wpisy-do-dziennika-przedszkole-przyklady.html',
    ...NOWE,
    title: 'Wpisy do dziennika w przedszkolu – przykłady | EduBox AI',
    description: 'Przykładowe wpisy do dziennika zajęć przedszkola dla 3-, 4-, 5- i 6-latków: tematy zimowe i świąteczne, zajęcia ruchowe, spacer, indywidualizacja. Zwroty do skopiowania.',
    kicker: 'Wzory i przykłady · Przedszkole',
    h1: 'Wpisy do dziennika w przedszkolu – przykłady dla 3-, 4-, 5- i 6-latków',
    short: 'Wpis do dziennika zajęć przedszkola ma w kilku zdaniach oddać to, co naprawdę działo się w grupie: temat dnia, najważniejsze zabawy i zajęcia oraz to, co dzieci dzięki nim ćwiczyły. Nie musi być długi ani uczony. Łatwiej go napisać, gdy myślisz obszarami rozwoju dziecka z podstawy programowej wychowania przedszkolnego: społecznym, osobistym, językowym, matematycznym, przyrodniczym, technicznym, cyfrowym, artystycznym i ruchowym. Poniżej są przykłady dla różnych grup wiekowych i bank zwrotów ułożony według tych obszarów.',
    rulesTitle: 'Jak pisać wpisy w dzienniku przedszkola',
    rules: [
      'Zacznij od tematu dnia, potem wymień 3–4 najważniejsze aktywności.',
      'Przy aktywności dopisz, co dzieci ćwiczyły, np. „– rozwijanie sprawności dłoni”.',
      'Pisz to, co się odbyło, a nie to, co było w planie.',
      'Dopasuj język do wieku grupy: u 3-latków więcej samoobsługi i zabawy, u 6-latków przygotowanie do czytania i liczenia.',
      'Bez imion dzieci i bez informacji o diagnozach – dziennik widzą też inne osoby.',
      'Formę (np. czy podawać obszary podstawy programowej) ustala Twoja placówka – sprawdź, co jest u Was przyjęte.'
    ],
    examplesNote: 'Przykłady możesz kopiować i dopasowywać do swoich zajęć. Nie wpisuj do narzędzi AI imion ani danych dzieci.',
    examples: [
      {
        label: 'Przykład 1: 3-latki – adaptacja i samoobsługa',
        meta: 'Temat: Moja sala, moje przedszkole',
        text: 'Moja sala, moje przedszkole. Zabawa powitalna w kole z piosenką – oswajanie z grupą i nauczycielem. Zwiedzanie sali i łazienki, poznanie swojego znaczka w szatni. Ćwiczenie samodzielnego mycia rąk i korzystania z ręcznika. Zabawy dowolne w kącikach zainteresowań – nauka odkładania zabawek na miejsce. Zabawa ruchowa „Pociąg” – reagowanie na sygnał.'
      },
      {
        label: 'Przykład 2: 3-latki – zima',
        meta: 'Temat: Pada śnieg',
        text: 'Pada śnieg. Słuchanie krótkiego wiersza o zimie, rozmowa przy ilustracjach – nazywanie zimowych ubrań. Zabawa badawcza ze śniegiem przyniesionym do sali: dotykanie, obserwowanie topnienia. Praca plastyczna „Śnieżynki” – stemplowanie palcem białą farbą na niebieskiej kartce. Zabawa ruchowa „Płatki śniegu” przy muzyce. Ćwiczenie samodzielnego zakładania czapki i szalika.'
      },
      {
        label: 'Przykład 3: 4-latki – Mikołajki',
        meta: 'Temat: Czekamy na Mikołaja',
        text: 'Czekamy na Mikołaja. Rozmowa o zwyczaju obdarowywania się prezentami na podstawie opowiadania czytanego przez nauczyciela. Zabawa dydaktyczna „Worek Mikołaja” – rozpoznawanie przedmiotów dotykiem i przeliczanie ich w zakresie 5. Praca plastyczna „Czapka Mikołaja” – wyklejanie watą, ćwiczenie sprawności dłoni. Nauka piosenki z pokazywaniem. Zabawy ruchowe z elementem biegu i podskoku.'
      },
      {
        label: 'Przykład 4: 4-latki – zajęcia ruchowe i spacer',
        meta: 'Temat: Zimowe zabawy na powietrzu',
        text: 'Zimowe zabawy na powietrzu. Zestaw ćwiczeń gimnastycznych z woreczkami – ćwiczenia równowagi i celności. Rozmowa o bezpiecznej zabawie zimą. Spacer w okolicy przedszkola – obserwowanie śladów na śniegu, dokarmianie ptaków w karmniku. Po powrocie: porządkowanie ubrań w szatni – rozwijanie samodzielności. Rysowanie kredkami „Co widziałem na spacerze?”.'
      },
      {
        label: 'Przykład 5: 5-latki – Dzień Babci i Dziadka',
        meta: 'Temat: Niespodzianka dla babci i dziadka',
        text: 'Niespodzianka dla babci i dziadka. Rozmowa kierowana „Za co lubię moją babcię i mojego dziadka” – wypowiadanie się pełnymi zdaniami. Słuchanie wiersza i nauka fragmentu na pamięć. Wykonanie laurki: cięcie po linii, składanie, ozdabianie – doskonalenie sprawności manualnej. Próba piosenki i tańca na uroczystość. Zabawa matematyczna „Bukiet” – przeliczanie i porównywanie liczby elementów w zakresie 8.'
      },
      {
        label: 'Przykład 6: 6-latki – przygotowanie do czytania i liczenia',
        meta: 'Temat: Karnawał',
        text: 'Karnawał. Rozmowa o zwyczajach karnawałowych przy ilustracjach. Zabawy słuchowe: dzielenie wyrazów na sylaby i wyodrębnianie pierwszej głoski (maska, balon, korona). Wprowadzenie litery „k” – wyszukiwanie jej w wyrazach, ćwiczenia grafomotoryczne po śladzie. Zabawa matematyczna „Balony” – dodawanie na konkretach w zakresie 10. Wykonanie maski karnawałowej według własnego pomysłu. Tańce przy muzyce – reagowanie na zmianę tempa.'
      },
      {
        label: 'Przykład 7: grupa mieszana – zajęcia przyrodnicze i techniczne',
        meta: 'Temat: Pomagamy ptakom zimą',
        text: 'Pomagamy ptakom zimą. Oglądanie zdjęć ptaków zimujących w Polsce, nazywanie ich i porównywanie wyglądu. Rozmowa o tym, czym wolno dokarmiać ptaki. Wspólne przygotowanie karmy i napełnienie karmnika – praca w małych zespołach. Młodsze dzieci: kolorowanie sylwety ptaka; starsze: wycinanie i składanie papierowego ptaka według wzoru. Zabawa ruchowa „Wróbelki i kot”.'
      },
      {
        label: 'Przykład 8: dopisek o indywidualizacji',
        meta: 'Do dowolnego wpisu',
        text: 'W trakcie zajęć indywidualizowano pracę z dziećmi, dostosowując stopień trudności zadań i czas ich wykonania do możliwości dzieci, m.in. przez podział poleceń na etapy, pokaz i wsparcie obrazkiem.'
      }
    ],
    phrases: [
      ['Obszar społeczny i osobisty', [
        'Wdrażanie do przestrzegania zasad ustalonych w grupie.',
        'Rozwijanie umiejętności zgodnej zabawy i czekania na swoją kolej.',
        'Nazywanie i rozpoznawanie emocji własnych i innych osób.',
        'Doskonalenie czynności samoobsługowych: mycie rąk, ubieranie się.'
      ]],
      ['Obszar językowy', [
        'Wzbogacanie słownictwa związanego z tematem.',
        'Wypowiadanie się na temat ilustracji i wysłuchanego tekstu.',
        'Zabawy słuchowe: dzielenie wyrazów na sylaby, wyodrębnianie głosek.',
        'Ćwiczenia grafomotoryczne przygotowujące do pisania.'
      ]],
      ['Obszar matematyczny', [
        'Przeliczanie elementów w dostępnym zakresie.',
        'Klasyfikowanie przedmiotów według koloru, kształtu i wielkości.',
        'Porównywanie liczebności zbiorów: więcej, mniej, tyle samo.',
        'Określanie położenia przedmiotów w przestrzeni.'
      ]],
      ['Obszar przyrodniczy, techniczny i cyfrowy', [
        'Obserwowanie zmian zachodzących w przyrodzie.',
        'Zabawy badawcze – wyciąganie prostych wniosków.',
        'Konstruowanie z klocków i materiałów różnego rodzaju.',
        'Poznawanie zasad bezpiecznego korzystania z urządzeń.'
      ]],
      ['Obszar artystyczny i ruchowy', [
        'Wykonanie pracy plastycznej techniką [nazwa] – doskonalenie sprawności dłoni.',
        'Nauka piosenki, zabawy rytmiczne przy muzyce.',
        'Zestaw ćwiczeń gimnastycznych z przyborem.',
        'Zabawy ruchowe na powietrzu, spacer w okolicy przedszkola.'
      ]]
    ],
    mistakes: [
      'Sam temat bez aktywności („Zima”) albo same ogólniki („zajęcia dydaktyczne”).',
      'Przepisywanie planu zamiast tego, co faktycznie się odbyło.',
      'Ten sam wpis kopiowany przez kilka dni.',
      'Imiona dzieci i informacje o ich trudnościach lub diagnozach.',
      'Bardzo długie opisy metodyczne – szczegóły są w scenariuszu, nie w dzienniku.'
    ],
    faq: [
      ['Jak długi powinien być wpis w dzienniku przedszkola?', 'Zwykle wystarczy temat i trzy, cztery zdania o najważniejszych aktywnościach. Szczegółowe wymagania co do formy ustala placówka.'],
      ['Czy we wpisie trzeba podawać obszary podstawy programowej?', 'To zależy od ustaleń w Twoim przedszkolu. W wielu placówkach dopisuje się obszary lub numery z podstawy, w innych wystarcza opis aktywności. Zapytaj dyrektora, jaka forma jest przyjęta.'],
      ['Jak zapisać zajęcia w grupie mieszanej wiekowo?', 'Jednym wpisem ze wspólnym tematem, z krótkim zaznaczeniem, co robiły dzieci młodsze, a co starsze – jak w przykładzie 7.'],
      ['Czy mogę użyć AI do pisania wpisów?', 'Tak – podaj temat i to, co faktycznie robiliście, bez imion i danych dzieci. Gotowy wpis przeczytaj i popraw tak, żeby zgadzał się z przebiegiem dnia.']
    ],
    extraLink: { url: 'wpisy-do-dziennika-przyklady.html', text: 'Zobacz też: wpisy do dziennika dla świetlicy i klas 1–3 →' },
    tool: {
      name: 'EduWpisy',
      url: 'eduwpisy.html',
      campaign: 'wpisy-przedszkole',
      text: 'Podaj temat i aktywności, wybierz grupę przedszkolną – dostaniesz 5 wariantów wpisu do wyboru, z nazwami obszarów rozwoju z podstawy programowej. Za darmo, bez rejestracji.'
    }
  }
);

const BANK_PDF = 'pobierz/bank-zwrotow-nauczyciela.pdf'; // generuje scripts/generate-bank-zwrotow.py

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const bySlug = slug => PAGES.find(p => p.slug === slug);
// Zakresy typu „1–3” w nagłówkach nie łamią się między liniami (span nie zmienia kopiowanego tekstu).
const nowrap = html => html.replace(/(\d+–\d+)/g,'<span class="whitespace-nowrap">$1</span>');

function render(p) {
  const url = `${BASE}/${p.slug}`;
  const toolUrl = `${p.tool.url.replace(/&/g, '&amp;')}${p.tool.url.includes('?') ? '&amp;' : '?'}utm_source=eduboxpro&amp;utm_medium=wzor&amp;utm_campaign=${p.tool.campaign}`;
  const ld = [
    { '@context': 'https://schema.org', '@type': 'Article', headline: p.h1, description: p.description, inLanguage: 'pl-PL', datePublished: p.updatedIso || UPDATED_ISO, dateModified: p.updatedIso || UPDATED_ISO, mainEntityOfPage: url, publisher: { '@type': 'Organization', name: 'EduBox AI', url: `${BASE}/` } },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: p.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }
  ];
  const ctaBox = (variant) => `
    <section class="rounded-2xl p-6 ${variant === 'top' ? 'mb-8' : 'my-10'} text-white" style="background:linear-gradient(135deg,#1e3a8a,#4f46e5 55%,#059669)">
      <h2 class="text-xl font-extrabold mb-2">${variant === 'top' ? 'Wolisz nie pisać od zera?' : 'Przygotuj swój tekst w 2 minuty'}</h2>
      <p class="text-indigo-100 mb-4 leading-relaxed">${esc(p.tool.text)}</p>
      <a href="${toolUrl}" class="inline-block bg-white text-indigo-700 font-extrabold px-5 py-3 rounded-xl hover:bg-indigo-50">Otwórz ${esc(p.tool.name)} →</a>
    </section>`;
  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(p.title)}</title>
  <meta name="description" content="${esc(p.description)}">
  <link rel="canonical" href="${url}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${esc(p.title)}">
  <meta property="og:description" content="${esc(p.description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${BASE}/okladka.jpg">
  <meta property="og:locale" content="pl_PL">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(p.title)}">
  <meta name="twitter:description" content="${esc(p.description)}">
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
  <script type="application/ld+json">${JSON.stringify(ld)}</script>
  <style>body{font-family:'Plus Jakarta Sans',system-ui,sans-serif}.ex-text{white-space:pre-line}</style>
</head>
<body class="min-h-screen bg-slate-50 text-slate-800 antialiased">
  <header class="bg-slate-950">
    <div class="max-w-3xl mx-auto px-5 py-5 flex items-center justify-between gap-4">
      <a href="/index.html" class="text-white font-extrabold text-lg">Edu<span class="text-emerald-400">Box</span> AI</a>
      <a href="${toolUrl}" class="text-sm font-bold text-emerald-300 hover:text-emerald-200">${esc(p.tool.name)} →</a>
    </div>
  </header>

  <main class="max-w-3xl mx-auto px-5 py-10">
    <p class="text-xs font-extrabold uppercase tracking-widest text-indigo-600 mb-3">${esc(p.kicker)}</p>
    <h1 class="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight mb-3">${nowrap(esc(p.h1))}</h1>
    <p class="text-sm text-slate-500 mb-8">Ostatnia aktualizacja: ${p.updated || UPDATED}</p>

    <section class="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 mb-8">
      <h2 class="text-lg font-extrabold text-indigo-900 mb-2">Krótko</h2>
      <p class="leading-relaxed text-indigo-950">${esc(p.short)}</p>
    </section>

    <section class="mb-8">
      <h2 class="text-xl font-extrabold text-slate-900 mb-3">${esc(p.rulesTitle)}</h2>
      <ul class="space-y-2">
${p.rules.map(r => `        <li class="flex gap-3"><span class="text-emerald-600 font-bold">✓</span><span>${esc(r)}</span></li>`).join('\n')}
      </ul>
    </section>
${ctaBox('top')}
    <section class="mb-8">
      <h2 class="text-xl font-extrabold text-slate-900 mb-2">Przykłady</h2>
      <p class="text-sm text-slate-500 mb-4">${esc(p.examplesNote)}</p>
      <div class="space-y-4">
${p.examples.map((ex, i) => `        <article class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div class="flex items-start justify-between gap-3 mb-3">
            <div><h3 class="font-extrabold text-slate-900">${esc(ex.label)}</h3><p class="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">${esc(ex.meta)}</p></div>
            <button type="button" data-copy="ex${i}" class="copy-btn shrink-0 text-sm font-bold bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 px-3 py-2 rounded-lg transition">Kopiuj</button>
          </div>
          <p id="ex${i}" class="ex-text text-[15px] leading-relaxed text-slate-700">${esc(ex.text)}</p>
        </article>`).join('\n')}
      </div>
    </section>

    <section class="mb-8">
      <h2 class="text-xl font-extrabold text-slate-900 mb-2">Bank zwrotów</h2>
      <p class="text-sm text-slate-500 mb-4">Kliknij zwrot, żeby go skopiować.</p>
      <div class="grid sm:grid-cols-2 gap-4">
${p.phrases.map(([group, items]) => `        <div class="bg-white border border-slate-200 rounded-2xl p-4">
          <h3 class="font-extrabold text-slate-900 mb-2 text-sm">${esc(group)}</h3>
          <ul class="space-y-1.5">
${items.map(it => `            <li><button type="button" class="phrase text-left text-sm text-slate-700 hover:text-indigo-700 hover:bg-indigo-50 rounded px-1 -mx-1 transition">${esc(it)}</button></li>`).join('\n')}
          </ul>
        </div>`).join('\n')}
      </div>
    </section>

    <section class="mb-10 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-2xl p-6" id="bank-zwrotow">
      <p class="text-xs font-extrabold uppercase tracking-widest text-indigo-100 mb-2">Prezent na start · PDF</p>
      <h2 class="text-xl font-extrabold mb-2">Bank zwrotów nauczyciela – ponad 250 sformułowań w jednym pliku</h2>
      <p class="text-sm text-indigo-100 mb-4">Opinie, oceny opisowe, wiadomości do rodziców, sprawozdania i wpisy do dziennika. Zostaw e-mail, a plik pobierzesz od razu. Potem dostaniesz tylko krótką wiadomość, gdy pojawi się nowe narzędzie albo nowy zestaw przykładów.</p>
      <form id="nl-form" class="flex flex-col sm:flex-row gap-2">
        <label class="sr-only" for="nl-email">Adres e-mail</label>
        <input id="nl-email" type="email" required autocomplete="email" placeholder="twoj@email.pl" class="flex-1 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none">
        <button type="submit" id="nl-btn" class="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-3 rounded-xl text-sm transition">Zapisz mnie i pobierz PDF</button>
      </form>
      <p id="nl-msg" class="text-sm font-bold mt-3 hidden" role="status"></p>
      <a id="nl-pdf" href="/${BANK_PDF}" download class="hidden mt-3 inline-block bg-white text-indigo-700 font-extrabold px-5 py-3 rounded-xl text-sm hover:bg-indigo-50 transition">Pobierz Bank zwrotów (PDF) ↓</a>
      <p class="text-xs text-indigo-100 mt-3">Zapis jest dobrowolny, bez zakładania konta. Wypiszesz się, odpowiadając na dowolną wiadomość. <a href="polityka-prywatnosci.html" class="underline">Polityka prywatności</a></p>
    </section>

    <section class="mb-8">
      <h2 class="text-xl font-extrabold text-slate-900 mb-3">Najczęstsze błędy</h2>
      <ul class="space-y-2">
${p.mistakes.map(m => `        <li class="flex gap-3"><span class="text-rose-500 font-bold">✗</span><span>${esc(m)}</span></li>`).join('\n')}
      </ul>
    </section>
${ctaBox('bottom')}${p.extraLink ? `
    <p class="-mt-6 mb-10 text-sm"><a href="${p.extraLink.url}" class="text-indigo-700 font-semibold hover:underline">${esc(p.extraLink.text)}</a></p>` : ''}
${p.legal ? `    <section class="mb-8 bg-white border border-slate-200 rounded-2xl p-5">
      <h2 class="text-sm font-extrabold uppercase tracking-widest text-slate-500 mb-3">Podstawa prawna · sprawdzone w ISAP ${UPDATED}</h2>
      <ul class="space-y-2 text-sm">
${p.legal.map(([t, u]) => `        <li class="flex gap-2"><span class="text-indigo-500">§</span><a href="${u}"${/^https?:/.test(u) ? ' target="_blank" rel="noopener"' : ''} class="text-indigo-700 hover:underline">${esc(t)}</a></li>`).join('\n')}
      </ul>
      <p class="text-xs text-slate-500 mt-3">Jak sprawdzamy aktualność przepisów: <a href="przepisy-i-rodo.html" class="text-indigo-700 font-semibold hover:underline">Przepisy i RODO w EduBox</a></p>
    </section>
` : ''}    <section class="mb-10">
      <h2 class="text-xl font-extrabold text-slate-900 mb-3">Najczęstsze pytania</h2>
      <div class="space-y-3">
${p.faq.map(([q, a]) => `        <details class="bg-white border border-slate-200 rounded-xl p-4"><summary class="font-bold text-slate-900 cursor-pointer">${esc(q)}</summary><p class="text-sm leading-relaxed mt-2">${esc(a)}</p></details>`).join('\n')}
      </div>
    </section>

    <section class="border-t border-slate-200 pt-6">
      <h2 class="text-sm font-extrabold uppercase tracking-widest text-slate-500 mb-3">Inne wzory i przykłady</h2>
      <ul class="space-y-2">
${PAGES.filter(o => o.slug !== p.slug).map(o => `        <li><a href="${o.slug}" class="text-indigo-700 font-semibold hover:underline">${nowrap(esc(o.h1))}</a></li>`).join('\n')}
        <li><a href="/index.html" class="text-indigo-700 font-semibold hover:underline">Wszystkie darmowe narzędzia EduBox AI</a></li>
      </ul>
      <p class="text-xs text-slate-500 mt-6 leading-relaxed">Przykłady mają charakter pomocniczy. Ocenę i dokumentację zawsze przygotowuje i zatwierdza nauczyciel, zgodnie ze statutem i zasadami swojej placówki. EduBox AI – darmowe narzędzia, które pomagają nauczycielom na co dzień.</p>
    </section>
  </main>

  <div id="toast" class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-emerald-600 text-white font-bold text-sm px-5 py-3 rounded-xl shadow-lg hidden">Skopiowano ✓</div>
  <script>
    (function () {
      var toast = document.getElementById('toast');
      function copied(kind) {
        toast.classList.remove('hidden');
        setTimeout(function () { toast.classList.add('hidden'); }, 1400);
        try { if (window.gtag) gtag('event', 'wzor_copy', { copy_type: kind }); } catch (e) {}
      }
      function copy(text, kind) {
        if (navigator.clipboard) { navigator.clipboard.writeText(text).then(function () { copied(kind); }); }
      }
      document.querySelectorAll('.copy-btn').forEach(function (btn) {
        btn.addEventListener('click', function () { copy(document.getElementById(btn.dataset.copy).innerText, 'przyklad'); });
      });
      document.querySelectorAll('.phrase').forEach(function (btn) {
        btn.addEventListener('click', function () { copy(btn.innerText, 'zwrot'); });
      });

      // Zapis na listę: adres idzie do naszego serwera (api/verify-code, akcja newsletter-zapisz), plik jest od razu.
      var form = document.getElementById('nl-form');
      if (form) form.addEventListener('submit', function (event) {
        event.preventDefault();
        var msg = document.getElementById('nl-msg');
        var btn = document.getElementById('nl-btn');
        var params = new URLSearchParams(location.search);
        btn.disabled = true; btn.textContent = 'Zapisuję…';
        fetch('/api/verify-code', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'newsletter-zapisz', email: document.getElementById('nl-email').value, page: location.pathname, zrodlo: 'wzory',
            utmSource: params.get('utm_source'), utmMedium: params.get('utm_medium'), utmCampaign: params.get('utm_campaign') })
        }).then(function (res) { return res.json().catch(function () { return {}; }).then(function (data) { return { ok: res.ok, data: data }; }); })
          .then(function (r) {
            msg.classList.remove('hidden');
            if (!r.ok) { msg.textContent = r.data.error || 'Nie udało się zapisać. Spróbuj ponownie za chwilę.'; btn.disabled = false; btn.textContent = 'Zapisz mnie i pobierz PDF'; return; }
            msg.textContent = 'Zapisano! Plik jest gotowy:';
            form.classList.add('hidden');
            document.getElementById('nl-pdf').classList.remove('hidden');
            try { if (window.gtag) gtag('event', 'newsletter_signup', { signup_place: 'wzory' }); } catch (e) {}
          })
          .catch(function () { msg.classList.remove('hidden'); msg.textContent = 'Brak połączenia. Spróbuj ponownie za chwilę.'; btn.disabled = false; btn.textContent = 'Zapisz mnie i pobierz PDF'; });
      });
    })();
  </script>
</body>
</html>
`;
}

for (const p of PAGES) {
  if (p.description.length < 70 || p.description.length > 180) throw new Error(`Opis ${p.slug}: ${p.description.length} znaków (zalecane 70-180)`);
  if (p.title.length > 65) throw new Error(`Tytuł ${p.slug}: ${p.title.length} znaków (zalecane do 65)`);
  fs.writeFileSync(path.join(ROOT, p.slug), render(p));
}
console.log(`[Wzory] Wygenerowano stron: ${PAGES.length} (${PAGES.map(p => p.slug).join(', ')})`);

module.exports = { PAGES };

module.exports = { PAGES };

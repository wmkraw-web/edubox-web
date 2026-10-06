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
      ['Czy mogę użyć AI do pisania ocen opisowych?', 'Tak, jako pomocy w redagowaniu tekstu – ale zawsze na podstawie własnych obserwacji, bez wpisywania danych osobowych dziecka (zamiast imienia użyj inicjału) i z uważnym sprawdzeniem wyniku. Ocenę wystawia nauczyciel.'],
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
      text: 'Wybierz z list poziom ucznia (edukacja polonistyczna, matematyczna, rozwój społeczno-emocjonalny), dopisz własne obserwacje, a AI złoży z tego spójny, życzliwy tekst oceny. Za darmo, bez rejestracji. Zamiast imienia wpisz inicjał.'
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
      text: 'Otwiera się od razu w trybie oceny zachowania: wybierz poziom w trzech obszarach (obowiązki, relacje, kultura i bezpieczeństwo), dopisz własne obserwacje, a AI zredaguje spójny, życzliwy opis z uwzględnieniem obszarów obowiązujących od 1 września 2026 r. Za darmo, bez rejestracji. Zamiast imienia wpisz inicjał.'
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
    title: 'Wiadomość do rodzica – przykłady trudnych sytuacji | EduBox AI',
    description: 'Przykłady wiadomości do rodzica przez e-dziennik: zachowanie, oceny, konflikt, nieobecności i pochwała. Spokojne, życzliwe zwroty do skopiowania i darmowy kreator.',
    kicker: 'Wzory i przykłady · Kontakt z rodzicami',
    h1: 'Wiadomość do rodzica przez e-dziennik – przykłady na trudne sytuacje',
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
  }
];

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const bySlug = slug => PAGES.find(p => p.slug === slug);
// Zakresy typu „1–3” w nagłówkach nie łamią się między liniami (span nie zmienia kopiowanego tekstu).
const nowrap = html => html.replace(/(\d+–\d+)/g,'<span class="whitespace-nowrap">$1</span>');

function render(p) {
  const url = `${BASE}/${p.slug}`;
  const toolUrl = `${p.tool.url.replace(/&/g, '&amp;')}${p.tool.url.includes('?') ? '&amp;' : '?'}utm_source=eduboxpro&amp;utm_medium=wzor&amp;utm_campaign=${p.tool.campaign}`;
  const ld = [
    { '@context': 'https://schema.org', '@type': 'Article', headline: p.h1, description: p.description, inLanguage: 'pl-PL', datePublished: UPDATED_ISO, dateModified: UPDATED_ISO, mainEntityOfPage: url, publisher: { '@type': 'Organization', name: 'EduBox AI', url: `${BASE}/` } },
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
    <p class="text-sm text-slate-500 mb-8">Ostatnia aktualizacja: ${UPDATED}</p>

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

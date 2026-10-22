// Porada dnia na stronie głównej (index.html czyta window.PORADA_DNIA = { text, date }).
// Od 22.10.2026 bez Make i bez AI: stała pula sprawdzonych porad, wybór według daty w przeglądarce.
// Ten sam dzień = ta sama porada dla wszystkich; co trzeci dzień porada sezonowa z bieżącego miesiąca.
// Zasady treści (pilnuje scripts/check-porada.js): maks. 220 znaków, bez numerów przepisów, bez diagnoz,
// bez obietnic, bez nazw innych firm. Nową poradę dopisuj do OGOLNE albo do właściwego miesiąca.
(function () {
    var OGOLNE = [
        // organizacja pracy
        'Zanim wyjdziesz z sali, zapisz na kartce jedną rzecz do zrobienia jutro rano. Rano nie musisz sobie przypominać, od czego zacząć.',
        'Trzymaj jedną teczkę „do podpisu i oddania”. Wszystko, co musi wyjść z Twoich rąk, ląduje tam od razu, a nie w torbie.',
        'Materiały, które przygotowujesz co roku, nazywaj tak samo: przedmiot – temat – klasa. Za rok znajdziesz je w kilka sekund.',
        'Duże zadanie, np. sprawozdanie, podziel na trzy kawałki po 20 minut. Łatwiej zacząć coś, co ma koniec.',
        'Raz w tygodniu przejrzyj kalendarz na dwa tygodnie do przodu. Zebrania i terminy przestaną Cię zaskakiwać.',
        'Ustal sobie godzinę, po której nie sprawdzasz służbowej poczty ani dziennika. Wiadomości poczekają do rana.',
        'Zrób listę „gotowców”: zabawa na 5 minut, karta na zastępstwo, krótka rozgrzewka. Przyda się w dniu, gdy plan się sypie.',
        'Kopie ważnych dokumentów trzymaj w dwóch miejscach, np. na dysku i na pendrive. Awaria komputera zawsze przychodzi w złym momencie.',
        'Przy każdym nowym materiale zapisz od razu, skąd pochodzi. Przy sprawozdaniu albo awansie nie będziesz szukać źródeł.',
        'Jeśli coś zajmuje mniej niż dwie minuty, zrób to od razu: odpisz, podpisz, odłóż na miejsce.',
        'Na koniec tygodnia zrób pięciominutowy przegląd biurka i szuflady. Poniedziałek zaczyna się wtedy dużo spokojniej.',
        'Zamiast jednej długiej listy zadań zrób dwie: „dziś” i „w tym tygodniu”. Na „dziś” wpisz najwyżej trzy rzeczy.',
        'Notatki z zebrań zapisuj w jednym zeszycie albo pliku, zawsze z datą. Po roku to Twoja najlepsza ściągawka.',
        'Wydruki planuj z dniem zapasu. Drukarka w pokoju nauczycielskim najchętniej psuje się rano przed lekcją.',
        // dobrostan
        'Wypij szklankę wody na każdej dłuższej przerwie. Zmęczenie po lekcjach to często zwykłe odwodnienie.',
        'Na przerwie usiądź choć na trzy minuty, nawet jeśli masz dyżur za chwilę. Twoje ciało też potrzebuje pauzy.',
        'Gdy czujesz, że emocje biorą górę, zrób wydech dłuższy niż wdech, np. 4 sekundy wdech i 6 wydech. Trzy takie oddechy wystarczą.',
        'Nie musisz odpowiadać od razu na każdą trudną wiadomość. „Odpowiem jutro po namyśle” to w pełni profesjonalna odpowiedź.',
        'Zapisuj w jednym miejscu miłe słowa od uczniów i rodziców. W gorszy dzień przeczytaj je jeszcze raz.',
        'Po trudnym dniu zrób jedną rzecz, która Cię zamyka: spacer, prysznic, zmiana ubrania. To sygnał dla głowy, że praca się skończyła.',
        'Nie porównuj swojej zwykłej środy z czyimś najlepszym zdjęciem z zajęć w internecie. Tam widać tylko efekt, nie przygotowania.',
        'Jedna lekcja w tygodniu, która daje Ci satysfakcję, to już sukces. Nie każda musi być pokazowa.',
        'Poproś o pomoc, zanim zrobi się naprawdę ciężko. Koleżanka z sali obok często ma gotowy pomysł albo materiał.',
        'Zaplanuj w kalendarzu czas dla siebie tak samo jak zebranie. To, czego nie ma w kalendarzu, zwykle się nie wydarza.',
        'Głos to Twoje narzędzie pracy. Zamiast podnosić go na hałas, spróbuj umówionego sygnału: klaśnięcia, dzwonka, podniesionej ręki.',
        'Na koniec dnia wymień w myślach trzy rzeczy, które się udały. Mózg łatwiej zapamiętuje porażki, więc trzeba mu pomóc.',
        // uczniowie i klasa
        'Witaj dzieci przy drzwiach po imieniu. Te kilka sekund kontaktu na starcie często zmienia przebieg całej lekcji.',
        'Zasady w klasie formułuj w pozytywie: „mówimy po kolei” zamiast „nie przekrzykujemy się”. Dzieci wiedzą wtedy, co mają robić.',
        'Dawaj wybór w małych sprawach: „zaczniesz od zadania A czy B?”. Dziecko, które ma wybór, rzadziej się buntuje.',
        'Polecenia podawaj krótko i po jednym. Przy dłuższych zadaniach zapisz kroki na tablicy, żeby każdy mógł do nich wrócić.',
        'Chwal konkretnie: „sprawdziłeś każde działanie” zamiast „brawo”. Dziecko wie wtedy, co warto powtórzyć.',
        'Zanim zapytasz całą klasę, daj chwilę ciszy na zastanowienie. Odpowiedzą nie tylko najszybsi.',
        'Uczniowi, który często przeszkadza, daj zadanie z odpowiedzialnością: rozdanie kart, pilnowanie czasu. Energia zyska kierunek.',
        'Plan lekcji w kilku obrazkach na tablicy pomaga wszystkim, a dzieciom z trudnościami w szczególności. Mniej pytań „co teraz?”.',
        'Zapowiadaj zmiany: „za dwie minuty kończymy i sprzątamy”. Nagłe przerwanie zabawy to częsty powód płaczu i złości.',
        'Gdy dziecko jest bardzo pobudzone, mów ciszej i wolniej. Spokój dorosłego jest zaraźliwy.',
        'Ruch to nie nagroda, tylko potrzeba. Minuta przeciągania się w połowie lekcji naprawdę pomaga w skupieniu.',
        'Zamiast „dlaczego to zrobiłeś?” zapytaj „co się stało?”. Łatwiej odpowiedzieć na pytanie, które nie brzmi jak oskarżenie.',
        'Rozmowę o złym zachowaniu prowadź w cztery oczy, nie przy klasie. Dziecko nie musi wtedy bronić twarzy przed kolegami.',
        'Prace uczniów wieszaj na wysokości ich oczu. To ich wystawa, nie dorosłych.',
        'Zostaw w sali „kącik wyciszenia”: koc, poduszka, kilka książek. Dziecko może tam odpocząć, zanim emocje wybuchną.',
        'Na zadaniu w grupie każdy powinien mieć rolę: lider, sekretarz, pilnujący czasu. Wtedy pracuje cała grupa, nie jedna osoba.',
        'Błędy pokazuj jako etap nauki. Zdanie „jeszcze tego nie umiesz” brzmi zupełnie inaczej niż „nie umiesz”.',
        'Krótkie powtórki na początku lekcji, nawet trzy pytania, utrwalają więcej niż jedna długa przed sprawdzianem.',
        'Ucznia, który odmawia pracy, zapytaj o pierwszy mały krok: „napiszesz tylko imię i datę?”. Często potem idzie już dalej.',
        'Jedno ciche porozumienie z uczniem, np. umówiony gest, potrafi zastąpić dziesięć upomnień na głos.',
        // SPE i terapia
        'Przy dziecku z trudnościami w komunikacji pokazuj obrazek i mów jednocześnie. Słowo z obrazem łatwiej zrozumieć.',
        'Sekwencja „najpierw – potem” na dwóch kartach pomaga przejść przez mniej lubiane zadanie. Najpierw mycie rąk, potem obiad.',
        'Zapisuj krótkie obserwacje od razu, nawet jedno zdanie z datą. Przy ocenie efektywności masz wtedy fakty zamiast wrażeń.',
        'Dobra obserwacja mówi: co dziecko zrobiło, w jakiej sytuacji i z jaką pomocą. „Sama pokazała obrazek pić” jest cenniejsze niż „było lepiej”.',
        'Hałas i jasne światło męczą niektóre dzieci bardziej, niż widać. Słuchawki wyciszające i miejsce dalej od okna to proste wsparcie.',
        'Zmiany w planie dnia zapowiadaj z wyprzedzeniem i pokazuj na planie. Dla wielu dzieci nieprzewidywalność to największy stres.',
        'Cele w programie pisz tak, żeby dało się je zobaczyć: „wskaże 3 obrazki na prośbę” zamiast „rozwija komunikację”.',
        'Mocne strony dziecka to nie ozdobnik dokumentu. Od nich najłatwiej zaczynać zajęcia i budować motywację.',
        'Nagradzaj od razu i konkretnie, zwłaszcza przy nowej umiejętności. Później nagrody można stopniowo wydłużać i zmniejszać.',
        'Daj dziecku czas na odpowiedź. Policz w myślach do dziesięciu, zanim powtórzysz pytanie albo podpowiesz.',
        'Zaplanuj zajęcia tak, żeby kończyły się czymś, co dziecku wychodzi. Ostatnie wrażenie zostaje na długo.',
        'Pomoce AAC trzymaj zawsze w tym samym miejscu i w zasięgu ręki dziecka. Komunikator w szafie nie pomoże w rozmowie.',
        // rodzice
        'W rozmowie z rodzicem zacznij od czegoś dobrego, co dziecko naprawdę zrobiło. Łatwiej wtedy przyjąć trudną informację.',
        'Mów o zachowaniu, nie o dziecku: „dziś trzy razy uderzył kolegę” zamiast „jest agresywny”. Fakt trudniej odeprzeć niż ocenę.',
        'Na koniec rozmowy z rodzicem ustalcie jedną wspólną rzecz do zrobienia. Jedna konkretna sprawa działa lepiej niż lista pięciu.',
        'Trudną wiadomość do rodziców napisz, odłóż na godzinę i przeczytaj jeszcze raz. Ton, który rano wydaje się neutralny, wieczorem bywa ostry.',
        'Podziel się z rodzicem małym sukcesem dziecka, nawet jednym zdaniem w wiadomości. Kolejna rozmowa o trudnościach pójdzie łatwiej.',
        'Nie rozmawiaj z rodzicem o innych dzieciach, nawet gdy pyta, kto zaczął. Mów tylko o jego dziecku i o tym, co robi szkoła.',
        'Ważne ustalenia z rozmowy zapisz krótko w notatce z datą. Po miesiącu nikt nie pamięta dokładnie, kto co obiecał.',
        'Gdy rodzic jest zdenerwowany, najpierw daj mu się wypowiedzieć bez przerywania. Wysłuchany człowiek szybciej się uspokaja.',
        'Unikaj diagnozowania w rozmowie z rodzicem. Opisz, co widzisz, i powiedz, kto może pomóc to sprawdzić.',
        'Zebranie z rodzicami zacznij od tego, co dzieci już umieją. Organizacyjne sprawy zmieszczą się po pierwszych pięciu minutach.',
        // AI i narzędzia
        'Nie wpisuj do AI imion, nazwisk, PESEL-u ani diagnoz uczniów. Pisz „uczeń z klasy 2” – wynik będzie równie dobry, a dane zostaną bezpieczne.',
        'Tekst od AI traktuj jak szkic koleżanki: sprawdź fakty, popraw ton i dopisz to, co wiesz tylko Ty. Podpisujesz się Ty, nie program.',
        'Im więcej konkretów podasz AI (wiek, cel, czas zajęć), tym lepszy dostaniesz wynik. „Zabawa dla 5-latków na 10 minut, bez materiałów” działa lepiej niż „zabawa”.',
        'Poproś AI o trzy wersje tej samej wiadomości: krótką, ciepłą i formalną. Wybierzesz tę, która pasuje do sytuacji.',
        'AI potrafi się mylić także w przepisach. Numer artykułu albo paragrafu zawsze sprawdź w oficjalnym tekście ustawy.',
        'Gotowy dokument od AI przeczytaj na głos. Zdania, które brzmią sztucznie, od razu wychodzą przy czytaniu.',
        'Karty pracy z AI przetestuj, zanim dasz je dzieciom. Jedno źle sformułowane polecenie potrafi zepsuć całe zajęcia.',
        'Zachowuj dobre polecenia do AI w jednym pliku. Następnym razem wystarczy podmienić temat i klasę.',
        // współpraca
        'Wymieniaj się materiałami z innymi nauczycielami z tego samego poziomu. Pięć osób przygotowujących po jednej rzeczy to pięć gotowych zajęć dla każdej.',
        'Nowej osobie w pokoju nauczycielskim pokaż, gdzie są drukarka, klucze i dziennik. Pamiętasz swój pierwszy tydzień.',
        'Na zespole mów konkretnie, czego potrzebujesz: „potrzebuję pomocy przy dokumentacji do piątku”. Ogólne „jest ciężko” rzadko kończy się pomocą.',
        'Pomysł, który sprawdził się na Twoich zajęciach, opowiedz innym. Ktoś inny może dzięki temu zaoszczędzić tydzień szukania.',
        'Jeśli współpracujesz z pomocą nauczyciela, ustalcie rano jedno zdanie: kto dziś czym się zajmuje. Mniej chaosu w ciągu dnia.',
        // zajęcia
        'Zacznij zajęcia od zagadki, przedmiotu w woreczku albo zdjęcia. Ciekawość działa lepiej niż „dziś będziemy mówić o…”.',
        'Kończ lekcję pytaniem: „czego się dziś nauczyłeś?”. Jedno zdanie od kilku osób to szybkie sprawdzenie, co zostało w głowach.',
        'Zabawa ruchowa z poleceniami („skacz, gdy usłyszysz zwierzę”) to jednocześnie nauka słuchania i rozładowanie energii.',
        'Wykorzystuj to, co jest za oknem: pogodę, liście, kałuże. Najlepsze pomoce dydaktyczne często są za darmo.',
        'Prosta tabela „umiem / jeszcze ćwiczę” na koniec tematu uczy dzieci oceniać własne postępy.',
        'Zadanie domowe ma sens, gdy dziecko poradzi sobie z nim samo. Jeśli potrzebna jest pomoc rodzica, to zadanie dla rodzica.',
        'Jedną lekcję w miesiącu oddaj uczniom: niech przygotują pytania, quiz albo krótką prezentację. Uczą się wtedy najwięcej.',
        'Piosenka z gestami zostaje w pamięci dłużej niż wierszyk powtarzany na sucho. Dzieci uczą się ciałem.',
        'Przy pracy plastycznej pokaż przykład, ale schowaj go, zanim dzieci zaczną. Unikniesz 25 identycznych prac.',
        'Na zajęciach z małymi dziećmi zmieniaj aktywność co 10–15 minut. To nie brak skupienia, tylko normalny etap rozwoju.',
        'Czytaj dzieciom na głos codziennie, choćby pięć minut. To jedna z najprostszych rzeczy, które rozwijają mowę i wyobraźnię.'
    ];
    var SEZON = {
        1: [
            'Styczeń to dobry moment na krótkie podsumowanie z dziećmi: co już umiemy, a czego chcemy się nauczyć do wiosny.',
            'Przed oceną śródroczną przejrzyj swoje notatki i obserwacje. Opis z konkretami pisze się szybciej niż z pamięci.',
            'Po przerwie świątecznej wróćcie do zasad i planu dnia. Dzieci potrzebują kilku dni, żeby znów wejść w rytm.',
            'W ferie zrób coś zupełnie niezwiązanego ze szkołą. Odpoczynek to też część przygotowania do drugiego półrocza.'
        ],
        2: [
            'W lutym przyda się ruch w sali: krótkie zabawy z muzyką pomagają przetrwać zimowe zmęczenie u dzieci i dorosłych.',
            'Po feriach przypomnij zasady i zrób spokojny pierwszy dzień. Nowy materiał zacznij dopiero, gdy grupa się „pozbiera”.',
            'Zimą sprawdzaj, czy w sali da się otworzyć okno na kilka minut. Świeże powietrze to prosty sposób na senność po obiedzie.',
            'Walentynki można zamienić w dzień życzliwości: każde dziecko robi coś miłego dla kogoś z grupy.'
        ],
        3: [
            'Wiosną wyjdźcie na dwór z lupami i pudełkami na skarby. Szukanie pierwszych oznak wiosny to gotowe zajęcia przyrodnicze.',
            'Marzec to dobry moment, żeby zajrzeć do terminów dokumentacji na koniec roku. W czerwcu czasu będzie dużo mniej.',
            'Zasiejcie w sali rzeżuchę albo fasolę i zapisujcie co dzień, jak rośnie. Dzieci uwielbiają obserwować zmiany.',
            'Pierwszy dzień wiosny można świętować bez topienia marzanny: przywołajcie wiosnę piosenką, wierszem albo spacerem.'
        ],
        4: [
            'W kwietniu przypomnij dzieciom zasady bezpieczeństwa przed wycieczkami i wyjściami. Krótkie scenki działają lepiej niż wykład.',
            'Przed przerwą świąteczną zaplanuj spokojniejsze zajęcia. Podekscytowane dzieci gorzej przyjmują nowy materiał.',
            'Dzień Ziemi to okazja do prostych nawyków: segregacja w sali, gaszenie światła, zakręcanie wody przy myciu rąk.',
            'Wiosenne zebrania z rodzicami to dobry moment, żeby pokazać postępy dziecka od września, a nie tylko bieżące sprawy.'
        ],
        5: [
            'W maju zacznij zbierać materiały do sprawozdania i oceny na koniec roku. Przy pięciu minutach dziennie czerwiec przestaje być straszny.',
            'Ciepłe dni sprzyjają zajęciom na dworze. Kreda, skakanka i woreczki z grochem wystarczą na całą godzinę.',
            'Przed Dniem Matki i Dniem Ojca pamiętaj o dzieciach z różnymi sytuacjami rodzinnymi. „Dla bliskiej osoby” brzmi bezpieczniej.',
            'Majówka to dobry moment na odpoczynek bez laptopa. Dokumenty poczekają, a Ty wrócisz z większą energią.'
        ],
        6: [
            'W czerwcu pisz oceny i sprawozdania partiami, po kilka dziennie. Ostatni tydzień zostaw na poprawki i podpisy.',
            'Na koniec roku poproś dzieci o jedno zdanie: co najbardziej zapamiętały. Te odpowiedzi to najlepsza informacja zwrotna.',
            'Zanim zamkniesz szafę na wakacje, opisz pudła i zrób listę, co gdzie leży. We wrześniu podziękujesz sobie.',
            'Dyplomy i pochwały na koniec roku pisz tak, żeby każde dziecko dostało coś za swoją mocną stronę, nie tylko za wyniki.'
        ],
        7: [
            'Wakacje są po to, żeby odpocząć. Pozwól sobie przez kilka tygodni nie myśleć o planach na wrzesień.',
            'Jeśli lubisz szukać pomysłów latem, zapisuj je w jednym miejscu bez porządkowania. We wrześniu wybierzesz najlepsze.',
            'Lato to dobry czas na książkę, która nie jest poradnikiem dla nauczycieli. Zwykła przyjemność też jest ważna.'
        ],
        8: [
            'Pod koniec sierpnia przejrzyj listę dzieci i dokumenty. Wiedza o potrzebach grupy przed pierwszym dniem ułatwia start.',
            'Przygotuj na wrzesień plakat z planem dnia i zasadami. Nowe dzieci szybciej poczują się pewnie.',
            'Zanim zaczniesz rok, zaplanuj sobie pierwszy wolny weekend we wrześniu. Start bywa intensywny.'
        ],
        9: [
            'We wrześniu ważniejsze od materiału jest poczucie bezpieczeństwa. Stały plan dnia i te same rytuały pomagają w adaptacji.',
            'Płacz przy rozstaniu z rodzicem to normalna część adaptacji. Krótkie, spokojne pożegnanie działa lepiej niż długie przedłużanie.',
            'Na pierwszym zebraniu poproś rodziców o jedno zdanie o dziecku: co lubi, czego się boi. To bezcenna wiedza na start.',
            'Na początku roku zrób z dziećmi wspólne zasady grupy i powieście je w widocznym miejscu. Swoich zasad łatwiej przestrzegać.',
            'We wrześniu zaplanuj obserwacje nowych dzieci. Notatki z pierwszych tygodni bardzo przydają się przy dokumentacji.'
        ],
        10: [
            'Jesienne liście, kasztany i żołędzie to darmowe materiały do liczenia, sortowania i prac plastycznych.',
            'W październiku grupa już się zna. To dobry moment na pierwsze zadania w parach i małych zespołach.',
            'Dzień Edukacji Narodowej to także Twoje święto. Przyjmij podziękowania bez tłumaczenia, że „to nic takiego”.',
            'Krótsze dni męczą dzieci i dorosłych. Dobre światło w sali i ruch w połowie zajęć naprawdę pomagają.'
        ],
        11: [
            'W listopadzie łatwo o spadek energii. Zaplanuj w tygodniu jedne zajęcia „dla przyjemności”: muzyka, taniec, zabawa w teatr.',
            'Przed 11 listopada wybierzcie z dziećmi jedną prostą formę: piosenkę, kotylion albo wspólny plakat. Mniej znaczy czasem więcej.',
            'Jesienią często krążą infekcje. Mycie rąk z piosenką trwającą 20 sekund to prosty sposób na nawyk.',
            'Listopad to dobry moment na pierwsze podsumowanie obserwacji. Do oceny śródrocznej zostanie Ci wtedy tylko dopisanie.'
        ],
        12: [
            'Grudzień bywa głośny i pełen przygotowań. Zostaw w planie spokojne chwile: czytanie przy lampce, ciche zabawy.',
            'Przed świętami pamiętaj, że nie wszystkie dzieci obchodzą je tak samo. Zimowe tradycje i życzliwość pasują do każdego.',
            'Przy grudniowych występach wybierz rolę dla każdego dziecka, także dla tych, które nie lubią mówić przy innych.',
            'Przed przerwą świąteczną uporządkuj zaległe dokumenty. Do pracy w styczniu wrócisz bez listy zaległości.'
        ]
    };

    function pick(now) {
        var d = now || new Date();
        var y = d.getFullYear(), m = d.getMonth() + 1;
        var day = Math.floor(Date.UTC(y, d.getMonth(), d.getDate()) / 86400000); // numer dnia wg czasu lokalnego
        var sez = SEZON[m] || [];
        var text = (sez.length && day % 3 === 0)
            ? sez[Math.floor(day / 3) % sez.length]
            : OGOLNE[(day * 7) % OGOLNE.length]; // krok 7 – kolejne dni nie dają porad z tej samej grupy tematycznej
        var mm = String(m).padStart(2, '0'), dd = String(d.getDate()).padStart(2, '0');
        return { text: text, date: y + '-' + mm + '-' + dd };
    }

    var api = { OGOLNE: OGOLNE, SEZON: SEZON, pick: pick };
    if (typeof window !== 'undefined') {
        window.PORADA_DNIA_POOL = api;
        window.PORADA_DNIA = pick();
    }
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();

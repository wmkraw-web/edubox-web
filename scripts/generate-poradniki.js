'use strict';

// Generator statycznych poradników o oszustwach (ruch z Google -> ZanimKlikniesz).
// Uruchom: node scripts/generate-poradniki.js  (nadpisuje pliki oszustwo-*.html / jak-sprawdzic-*.html)
// Nowy poradnik: dopisz obiekt do GUIDES, uruchom generator, dodaj ścieżkę do publicPages
// w seo.config.js, potem `npm run seo:sitemap` i `npm test`.
//
// ZASADA: piszemy o oszustach PODSZYWAJĄCYCH SIĘ pod znane firmy - nigdy, że firma jest oszustem.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const UPDATED = '4 października 2026';
const UPDATED_ISO = '2026-10-04';
const BASE = 'https://eduboxpro.pl';

const GUIDES = [
  {
    slug: 'oszustwo-doplata-do-paczki.html',
    tab: 'text',
    title: 'SMS o dopłacie do paczki – oszustwo? Jak rozpoznać | EduBox AI',
    description: 'SMS o dopłacie 1,49 zł do paczki InPost, DPD czy Poczty Polskiej? Zobacz, jak rozpoznać oszustwo, co zrobić po kliknięciu i sprawdź link za darmo.',
    kicker: 'Fałszywe dopłaty do przesyłek',
    h1: 'SMS o dopłacie do paczki – czy to oszustwo?',
    short: 'Bardzo często tak. To jeden z najczęstszych schematów w Polsce: SMS straszy zwrotem paczki i prosi o drobną dopłatę przez link. Link prowadzi do podrobionej strony płatności, a celem są dane karty albo logowanie do banku. Status przesyłki i ewentualne opłaty sprawdzaj wyłącznie w oficjalnej aplikacji przewoźnika lub na jego stronie, wpisując adres samodzielnie.',
    example: 'InPost: Twoja przesylka zostala wstrzymana z powodu niedoplaty 1,49 zl. Oplac w ciagu 24h, inaczej paczka wroci do nadawcy: inpost-pl-dostawa.top/oplata',
    signals: [
      'Link zawiera nazwę znanej firmy, ale z dodatkami albo dziwną końcówką (np. „-pl-dostawa.top”, „-oplata.shop”).',
      'Bardzo mała kwota (1–3 zł) – ma uśpić czujność, bo „to tylko złotówka”.',
      'Presja czasu: „w ciągu 24 godzin”, „inaczej paczka wróci”.',
      'Brak polskich znaków, błędy, dziwny nadawca albo zwykły numer komórkowy.',
      'Strona prosi o pełne dane karty z kodem CVV albo o zalogowanie się do banku.',
      'Nie spodziewasz się żadnej przesyłki.'
    ],
    ifHappened: [
      ['Kliknąłem, ale nic nie wpisałem', 'Zamknij stronę i nie pobieraj żadnych plików ani aplikacji. Samo otwarcie strony zwykle nie wystarcza do kradzieży pieniędzy.'],
      ['Podałem dane karty', 'Natychmiast zastrzeż kartę w aplikacji banku lub przez infolinię (numer z odwrotu karty). Sprawdź historię transakcji i nieznane płatności zgłoś w banku jako nieautoryzowane.'],
      ['Zalogowałem się do banku przez link', 'Zadzwoń do banku, poproś o zablokowanie dostępu i zmień hasło z zaufanego urządzenia. Sprawdź, czy nie dodano nowego odbiorcy ani urządzenia.'],
      ['Zainstalowałem „aplikację kuriera”', 'Włącz tryb samolotowy, odinstaluj aplikację i z innego telefonu zadzwoń do banku. Taka aplikacja może przechwytywać SMS-y z kodami.']
    ],
    protect: [
      'Paczki sprawdzaj tylko w oficjalnej aplikacji przewoźnika.',
      'Do płatności w internecie używaj karty z niskim limitem albo karty wirtualnej.',
      'Włącz w banku powiadomienia o każdej transakcji.',
      'Podejrzany SMS prześlij bezpłatnie na numer 8080 (CERT Polska).'
    ],
    faq: [
      ['Czy przewoźnicy naprawdę pobierają dopłaty?', 'Czasem tak – np. opłaty celne za paczki spoza Unii Europejskiej. Ale prawdziwą opłatę zawsze sprawdzisz w oficjalnej aplikacji lub na stronie przewoźnika, wpisując adres samodzielnie. Nie płać z linku w SMS-ie.'],
      ['Kliknąłem link, ale nic nie podałem. Czy coś mi grozi?', 'Zwykle nie. Zamknij stronę, nie instaluj niczego, o co prosi strona, i usuń wiadomość. Jeśli coś zostało pobrane lub zainstalowane – postępuj jak w punkcie „Zainstalowałem aplikację kuriera”.'],
      ['Gdzie zgłosić taki SMS?', 'Prześlij go bezpłatnie na numer 8080 – trafi do CERT Polska, który blokuje fałszywe strony i dopisuje je do listy ostrzeżeń.']
    ],
    related: ['oszustwo-telefon-z-banku.html', 'oszustwo-kup-z-olx.html', 'jak-sprawdzic-sklep-internetowy.html']
  },
  {
    slug: 'oszustwo-telefon-z-banku.html',
    tab: 'phone',
    title: 'Telefon „z banku” – jak rozpoznać oszusta i co zrobić | EduBox AI',
    description: 'Dzwoni „konsultant banku” albo „policjant” i każe zainstalować aplikację lub przelać pieniądze? Zobacz, jak działa to oszustwo i co zrobić od razu.',
    kicker: 'Fałszywi konsultanci i policjanci',
    h1: 'Telefon „z banku” – jak rozpoznać oszusta?',
    short: 'Prawdziwy bank nigdy nie prosi o instalację aplikacji do zdalnego dostępu (np. AnyDesk), o przelew na „bezpieczne konto”, o podanie kodów z SMS-ów, kodu BLIK, PIN-u ani hasła. Numer wyświetlany na ekranie można podrobić, więc nawet prawdziwy numer banku nie jest dowodem. Najbezpieczniej: rozłącz się i zadzwoń do banku sam, na numer z karty lub z oficjalnej strony.',
    example: '„Dzień dobry, dział bezpieczeństwa banku. Wykryliśmy próbę wzięcia kredytu na Pana dane. Żeby zablokować przelewy, proszę zainstalować aplikację AnyDesk i podać mi wyświetlony kod. Proszę nikomu o tym nie mówić, także pracownikom oddziału.”',
    signals: [
      'Strach i pośpiech: „ktoś bierze kredyt na Pana dane”, „pieniądze zaraz znikną”.',
      'Prośba o instalację aplikacji (AnyDesk, TeamViewer, QuickSupport) albo o podanie kodu z ekranu.',
      'Polecenie przelewu na „bezpieczne konto” lub wypłaty gotówki i wpłaty do wpłatomatu.',
      'Prośba o kody z SMS-ów, BLIK, PIN, hasło lub zatwierdzenie operacji w aplikacji.',
      'Przełączanie do „policjanta”, „prokuratora” albo „pracownika KNF”.',
      'Prośba o zachowanie tajemnicy – nawet przed rodziną i pracownikami banku.'
    ],
    ifHappened: [
      ['Rozmawiam teraz', 'Rozłącz się. Nie musisz być uprzejmy. Zadzwoń do banku sam, najlepiej z innego telefonu.'],
      ['Zainstalowałem aplikację na prośbę rozmówcy', 'Włącz tryb samolotowy lub odłącz komputer od internetu, odinstaluj aplikację i z innego telefonu zadzwoń do banku. Zmień hasła z zaufanego urządzenia.'],
      ['Przelałem pieniądze lub podałem kody', 'Dzwoń do banku natychmiast – czasem da się zatrzymać przelew. Zgłoś sprawę na policję i zachowaj numer, godzinę i opis rozmowy.'],
      ['Podałem PESEL lub dane dowodu', 'Zastrzeż PESEL w aplikacji mObywatel lub na gov.pl i zgłoś dokument w systemie Dokumenty Zastrzeżone (w każdym banku).']
    ],
    protect: [
      'Zapisz w telefonie numer infolinii banku z karty – i zawsze oddzwaniaj sam.',
      'Ustal w rodzinie zasadę: „bank nigdy nie każe instalować aplikacji ani przelewać na bezpieczne konto”.',
      'Porozmawiaj o tym z rodzicami i dziadkami – to oni najczęściej są celem.',
      'Zastrzeż PESEL w mObywatelu – to bezpłatne i utrudnia wzięcie kredytu na Twoje dane.'
    ],
    faq: [
      ['Na ekranie był prawdziwy numer banku. Czy to na pewno bank?', 'Niekoniecznie. Oszuści potrafią podrobić wyświetlany numer (tzw. spoofing). Liczy się to, czego od Ciebie chcą – a nie numer. Rozłącz się i oddzwoń sam.'],
      ['Czy bank w ogóle dzwoni do klientów?', 'Tak, ale prawdziwy pracownik banku nie poprosi o instalację aplikacji, przelew na inne konto ani o kody i hasła. Możesz zawsze zakończyć rozmowę i oddzwonić na oficjalną infolinię.'],
      ['Co zrobić z zainstalowanym AnyDeskiem?', 'Odinstaluj go, odłącz urządzenie od internetu i zadzwoń do banku z innego telefonu. Jeśli rozmówca widział Twój ekran podczas logowania do banku, koniecznie zmień hasła.']
    ],
    related: ['oszustwo-blik-messenger.html', 'oszustwo-doplata-do-paczki.html', 'falszywe-inwestycje-reklamy.html']
  },
  {
    slug: 'oszustwo-kup-z-olx.html',
    tab: 'text',
    title: 'Oszustwo „na kupującego” w OLX i Vinted | EduBox AI',
    description: 'Kupujący pisze, że już zapłacił, i przysyła link do „odbioru pieniędzy”? Zobacz, jak działa oszustwo na sprzedających w ogłoszeniach i jak się chronić.',
    kicker: 'Oszustwa w ogłoszeniach',
    h1: 'Kupujący przysyła link do „odbioru pieniędzy” – czy to oszustwo?',
    short: 'Tak – to klasyczne oszustwo na sprzedających. Żeby OTRZYMAĆ pieniądze, nigdy nie musisz podawać danych karty, kodu CVV, limitów na koncie ani logować się do banku przez link. Fałszywy „kupujący” przenosi rozmowę na WhatsApp lub e-mail i przysyła stronę udającą serwis ogłoszeniowy albo firmę kurierską. Prowadź transakcję wyłącznie w oficjalnej aplikacji lub serwisie.',
    example: '„Dzień dobry, kupuję! Zapłaciłem już przez bezpieczną transakcję, kurier odbierze paczkę jutro. Żeby odebrać pieniądze, proszę wejść w link i wpisać dane karty: olx-bezpieczna-wyplata.shop/odbior”',
    signals: [
      'Kupujący od razu „zapłacił”, nie zadaje pytań o przedmiot i bardzo się spieszy.',
      'Prosi o przejście na WhatsApp, Telegram lub e-mail.',
      'Przysyła link do „odbioru pieniędzy” lub „potwierdzenia transakcji”.',
      'Strona z linku prosi o dane karty, CVV, saldo albo logowanie do banku.',
      'Adres strony tylko przypomina serwis ogłoszeniowy lub firmę kurierską.',
      'Pojawia się „problem” i druga strona – np. „konsultant” – prosi o kolejne kody.'
    ],
    ifHappened: [
      ['Wpisałem dane karty', 'Zastrzeż kartę natychmiast w aplikacji banku lub przez infolinię i zgłoś nieautoryzowane transakcje.'],
      ['Zalogowałem się do banku przez link', 'Zadzwoń do banku, zablokuj dostęp do bankowości i zmień hasło z zaufanego urządzenia.'],
      ['Wysłałem już towar', 'Zgłoś sprawę w serwisie ogłoszeniowym i na policję. Zachowaj całą rozmowę i dane nadania przesyłki.'],
      ['Chcę zgłosić oszusta', 'Zgłoś konto w serwisie ogłoszeniowym, a fałszywą stronę na incydent.cert.pl.']
    ],
    protect: [
      'Rozmawiaj i rozliczaj się tylko w oficjalnym czacie i systemie płatności serwisu.',
      'Nie klikaj w linki od kupujących – sprawdzaj transakcję, logując się samodzielnie do aplikacji.',
      'Pamiętaj: do otrzymania pieniędzy wystarczy numer konta, nigdy dane karty.',
      'Uprzedź bliskich, którzy sprzedają w internecie po raz pierwszy.'
    ],
    faq: [
      ['Kupujący pisze, że zapłacił i muszę to potwierdzić w linku. Co zrobić?', 'Nie klikaj. Zaloguj się samodzielnie do aplikacji serwisu i sprawdź, czy płatność tam jest. Prawdziwa transakcja nie wymaga od sprzedającego danych karty.'],
      ['Kupujący chce rozmawiać na WhatsAppie. To podejrzane?', 'To częsty pierwszy krok oszustwa – poza serwisem trudniej go zablokować i łatwiej podesłać fałszywy link. Zostań w oficjalnym czacie.'],
      ['Czy oszuści podszywają się tylko pod jeden serwis?', 'Nie – podobne wiadomości dotyczą wielu serwisów ogłoszeniowych i firm kurierskich. Same serwisy nie mają z tym związku; to oszuści wykorzystują ich nazwy.']
    ],
    related: ['oszustwo-doplata-do-paczki.html', 'oszustwo-blik-messenger.html', 'jak-sprawdzic-sklep-internetowy.html']
  },
  {
    slug: 'oszustwo-blik-messenger.html',
    tab: 'text',
    title: 'Prośba o kod BLIK od znajomego – oszustwo? | EduBox AI',
    description: 'Znajomy pisze na Messengerze, że pilnie potrzebuje pieniędzy i prosi o kod BLIK? To częste oszustwo z przejętego konta. Zobacz, jak się chronić.',
    kicker: 'Przejęte konta znajomych',
    h1: 'Znajomy prosi o kod BLIK – czy to oszustwo?',
    short: 'Bardzo często tak. Oszuści przejmują konta na Facebooku, Instagramie czy WhatsAppie i piszą do znajomych z prośbą o „pilną pożyczkę” kodem BLIK. Wystarczy jeden telefon do tej osoby, żeby to sprawdzić. Pamiętaj też, że płatność kodem BLIK zatwierdzasz w swojej aplikacji – nie zatwierdzaj operacji, której nie rozumiesz.',
    example: '„Hej, możesz mi pilnie pomóc? Jestem w sklepie i nie działa mi karta. Wyślij mi kod BLIK na 600 zł, jutro oddam, przysięgam. Tylko szybko proszę, nie mogę teraz rozmawiać!”',
    signals: [
      'Nagła prośba o pieniądze od osoby, która zwykle tak nie pisze.',
      'Pośpiech i „nie mogę teraz rozmawiać”, „rozładował mi się telefon”.',
      'Inny styl pisania niż zwykle, błędy, brak polskich znaków.',
      'Prośba o kilka kodów BLIK po kolei albo o zatwierdzenie płatności w aplikacji.',
      'Prośba o kod z SMS-a „przez pomyłkę wysłany na Twój numer” – to przejmowanie Twojego konta.'
    ],
    ifHappened: [
      ['Wysłałem kod BLIK', 'Zadzwoń do banku natychmiast – czasem da się zatrzymać płatność. Zgłoś sprawę na policję i zachowaj rozmowę.'],
      ['Wysłałem kod z SMS-a', 'Oszust mógł przejąć Twoje konto w serwisie. Zmień hasło, włącz weryfikację dwuetapową i ostrzeż znajomych.'],
      ['Chcę pomóc znajomemu', 'Zadzwoń do niego, powiedz, że jego konto zostało przejęte, i zgłoś profil do serwisu.']
    ],
    protect: [
      'Zawsze potwierdzaj prośbę o pieniądze telefonicznie – zwykłym połączeniem.',
      'Nigdy nie podawaj nikomu kodów z SMS-ów.',
      'Włącz weryfikację dwuetapową na Facebooku, Instagramie i WhatsAppie.',
      'Ustal z rodziną hasło na wypadek prawdziwej, nagłej prośby o pieniądze.'
    ],
    faq: [
      ['Skąd oszust ma konto mojego znajomego?', 'Najczęściej z wyłudzonego hasła (fałszywa strona logowania) albo z kodu SMS, który ktoś nieświadomie przekazał. Dlatego tak ważna jest weryfikacja dwuetapowa.'],
      ['Czy wysłanie kodu BLIK to już przelew?', 'Kod sam w sobie nie przelewa pieniędzy – płatność trzeba zatwierdzić w aplikacji banku. Jeśli coś zatwierdziłeś, dzwoń do banku od razu.'],
      ['Jak zgłosić przejęte konto?', 'W serwisie społecznościowym użyj opcji zgłoszenia profilu (podszywanie się / zhakowane konto) i poproś znajomych, żeby zrobili to samo.']
    ],
    related: ['oszustwo-telefon-z-banku.html', 'oszustwo-kup-z-olx.html', 'oszustwo-doplata-do-paczki.html']
  },
  {
    slug: 'jak-sprawdzic-sklep-internetowy.html',
    tab: 'link',
    title: 'Jak sprawdzić, czy sklep internetowy jest prawdziwy?',
    description: 'Sklep z rabatami 70% z reklamy na Facebooku? Zobacz 8 prostych kroków, jak sprawdzić wiarygodność sklepu internetowego przed zapłatą – i sprawdź go za darmo.',
    kicker: 'Fałszywe sklepy internetowe',
    h1: 'Jak sprawdzić, czy sklep internetowy jest prawdziwy?',
    short: 'Fałszywe sklepy zwykle działają kilka tygodni, kuszą ogromnymi rabatami z reklam w mediach społecznościowych i przyjmują tylko przelewy. Przed zakupem sprawdź: wiek strony, dane firmy (NIP, adres), czy konto do przelewu należy do tej firmy, regulamin i zwroty oraz opinie POZA samą stroną. Część z tych rzeczy ZanimKlikniesz sprawdzi za Ciebie w kilka sekund.',
    example: 'Reklama: „Likwidacja magazynu! Markowe buty -85%, tylko dziś. Darmowa dostawa. Płatność wyłącznie przelewem.” – sklep super-buty-outlet.store',
    signals: [
      'Ceny dużo niższe niż wszędzie indziej (-50% do -90%) i licznik „tylko dziś”.',
      'Strona istnieje od kilku dni lub tygodni.',
      'Brak NIP-u, adresu firmy i numeru telefonu – albo dane cudzej, prawdziwej firmy.',
      'Płatność tylko przelewem, bez karty i bez szybkich płatności z ochroną kupującego.',
      'Regulamin skopiowany z innej strony, z błędami albo z nazwą innego sklepu.',
      'Opinie tylko na samej stronie, same zachwyty, wyłączone komentarze pod reklamą.'
    ],
    ifHappened: [
      ['Zapłaciłem kartą', 'Złóż w banku reklamację (tzw. chargeback) – przy płatności kartą masz na to zwykle kilka tygodni.'],
      ['Zapłaciłem przelewem', 'Natychmiast zadzwoń do banku – czasem udaje się zablokować środki. Zgłoś sprawę na policję.'],
      ['Chcę ostrzec innych', 'Zgłoś stronę na incydent.cert.pl – trafi na listę ostrzeżeń i będzie blokowana przez operatorów.']
    ],
    protect: [
      'Sprawdź NIP w wykazie podatników VAT (biała lista) i porównaj z nazwą sklepu.',
      'Szukaj opinii o sklepie w wyszukiwarce i na forach – nie tylko na stronie sklepu.',
      'Płać kartą lub metodą z ochroną kupującego – unikaj samych przelewów.',
      'Wklej adres sklepu do ZanimKlikniesz – sprawdzi wiek strony, listę CERT i podszywanie się pod marki.'
    ],
    faq: [
      ['Sklep ma dużo pozytywnych opinii na stronie. Czy to wystarczy?', 'Nie – opinie na samej stronie łatwo podrobić. Szukaj ocen w niezależnych miejscach i zwróć uwagę, czy sklep w ogóle istnieje w internecie dłużej niż kilka tygodni.'],
      ['Czy sklep z końcówką .pl jest bezpieczny?', 'Końcówka adresu niczego nie gwarantuje. Oszuści używają różnych domen, także .pl. Liczy się wiek strony, dane firmy i sposób płatności.'],
      ['Zamówiłem, a towar nie przychodzi. Co robić?', 'Skontaktuj się ze sklepem i zachowaj korespondencję. Jeśli kontakt nie działa – zgłoś sprawę w banku (reklamacja płatności), na policję i stronę na incydent.cert.pl.']
    ],
    related: ['falszywe-inwestycje-reklamy.html', 'oszustwo-doplata-do-paczki.html', 'oszustwo-kup-z-olx.html']
  },
  {
    slug: 'falszywe-inwestycje-reklamy.html',
    tab: 'link',
    title: 'Fałszywe inwestycje z celebrytami i AI | EduBox AI',
    description: 'Reklama z celebrytą obiecuje gwarantowany zysk z akcji lub kryptowalut? Zobacz, jak działają fałszywe inwestycje, deepfake i „opiekunowie” – i jak się chronić.',
    kicker: 'Fałszywe inwestycje',
    h1: 'Reklama inwestycji ze znaną osobą – czy to oszustwo?',
    short: 'Bardzo często tak. Oszuści używają wizerunków znanych osób – coraz częściej przerobionych przez AI (deepfake) – i obiecują „gwarantowany” zysk z akcji znanych spółek albo kryptowalut. Po zostawieniu numeru dzwoni „opiekun”, który namawia na wpłatę, a później na kolejne. Gwarantowanych, wysokich zysków nie ma. Firmę sprawdzisz na liście ostrzeżeń publicznych KNF.',
    example: 'Reklama wideo: „Znany dziennikarz poleca: zainwestuj 1000 zł w akcje polskiej spółki energetycznej, gwarantowany zysk 8000 zł miesięcznie! Liczba miejsc ograniczona.”',
    signals: [
      '„Gwarantowany” lub bardzo wysoki zysk w krótkim czasie.',
      'Wizerunek znanej osoby lub logo spółki – często w filmie o nienaturalnym głosie i ruchu ust.',
      'Mała wpłata „na start” (np. 1000 zł) i pośpiech: „ostatnie miejsca”.',
      '„Opiekun” dzwoni z różnych numerów, prowadzi przez WhatsApp lub Telegram.',
      'Prośba o instalację aplikacji do zdalnego pulpitu „żeby pomóc założyć konto”.',
      'Przy wypłacie pojawiają się „podatki”, „prowizje” lub „opłaty odblokowujące”.'
    ],
    ifHappened: [
      ['Zostawiłem numer telefonu', 'Nie odbieraj połączeń od „opiekunów” i nie instaluj żadnych aplikacji. Spodziewaj się wielu telefonów – po prostu je ignoruj.'],
      ['Wpłaciłem pieniądze', 'Przestań wpłacać, zadzwoń do banku i zgłoś sprawę na policję. Nie płać nikomu „podatku od wypłaty”.'],
      ['Ktoś obiecuje odzyskać moje pieniądze', 'To często drugi etap tego samego oszustwa. Nie płać „firmom odzyskującym pieniądze”, które same się do Ciebie zgłosiły.'],
      ['Dałem dostęp do komputera', 'Odłącz go od internetu, odinstaluj aplikację, zmień hasła z innego urządzenia i zadzwoń do banku.']
    ],
    protect: [
      'Sprawdzaj firmy na liście ostrzeżeń publicznych KNF przed jakąkolwiek wpłatą.',
      'Znane osoby nie polecają inwestycji w reklamach z „gwarantowanym zyskiem”.',
      'Nie zostawiaj numeru telefonu w formularzach z takich reklam.',
      'Uprzedź rodziców i dziadków – to oni są częstym celem tych reklam.'
    ],
    faq: [
      ['Skąd wiem, że film ze znaną osobą jest fałszywy?', 'Nienaturalny głos, ruch ust niezgodny ze słowami i obietnica łatwych pieniędzy to typowe sygnały. Ale najprostsza zasada: znane osoby nie sprzedają „gwarantowanych” inwestycji w reklamach.'],
      ['Czy mogę odzyskać wpłacone pieniądze?', 'Zgłoś sprawę jak najszybciej w banku i na policji. Unikaj „firm odzyskujących pieniądze”, które same się zgłaszają – to częsty drugi etap oszustwa.'],
      ['Gdzie sprawdzić firmę inwestycyjną?', 'Na liście ostrzeżeń publicznych Komisji Nadzoru Finansowego (KNF) i w rejestrach KNF.']
    ],
    related: ['jak-sprawdzic-sklep-internetowy.html', 'oszustwo-telefon-z-banku.html', 'oszustwo-blik-messenger.html']
  }
];

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const short = slug => GUIDES.find(g => g.slug === slug);

function render(g) {
  const url = `${BASE}/${g.slug}`;
  const zk = `zanimklikniesz.html?tab=${g.tab}&amp;utm_source=eduboxpro&amp;utm_medium=poradnik&amp;utm_campaign=zanimklikniesz`;
  const ld = [
    {
      '@context': 'https://schema.org', '@type': 'Article', headline: g.h1, description: g.description,
      inLanguage: 'pl-PL', datePublished: UPDATED_ISO, dateModified: UPDATED_ISO, mainEntityOfPage: url,
      publisher: { '@type': 'Organization', name: 'EduBox AI', url: `${BASE}/` }
    },
    {
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: g.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } }))
    }
  ];
  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(g.title)}</title>
  <meta name="description" content="${esc(g.description)}">
  <link rel="canonical" href="${url}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${esc(g.title)}">
  <meta property="og:description" content="${esc(g.description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${BASE}/okladka.jpg">
  <meta property="og:locale" content="pl_PL">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(g.title)}">
  <meta name="twitter:description" content="${esc(g.description)}">
  <meta name="twitter:image" content="${BASE}/okladka.jpg">
  <link rel="icon" href="/icon-96.png" type="image/png">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&amp;display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-3RQ9R0N0K8"></script>
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
    gtag('config', 'G-3RQ9R0N0K8');
  </script>
  <script type="application/ld+json">${JSON.stringify(ld)}</script>
  <style>body{font-family:'Plus Jakarta Sans',system-ui,sans-serif}</style>
</head>
<body class="min-h-screen bg-slate-50 text-slate-800 antialiased">
  <header class="bg-slate-950">
    <div class="max-w-3xl mx-auto px-5 py-5 flex items-center justify-between gap-4">
      <a href="/index.html" class="text-white font-extrabold text-lg">Edu<span class="text-emerald-400">Box</span> AI</a>
      <a href="${zk}" class="text-sm font-bold text-emerald-300 hover:text-emerald-200">ZanimKlikniesz →</a>
    </div>
  </header>

  <main class="max-w-3xl mx-auto px-5 py-10">
    <p class="text-xs font-extrabold uppercase tracking-widest text-indigo-600 mb-3">Poradnik ZanimKlikniesz · ${esc(g.kicker)}</p>
    <h1 class="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight mb-3">${esc(g.h1)}</h1>
    <p class="text-sm text-slate-500 mb-8">Ostatnia aktualizacja: ${UPDATED}</p>

    <section class="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 mb-8">
      <h2 class="text-lg font-extrabold text-indigo-900 mb-2">Krótka odpowiedź</h2>
      <p class="leading-relaxed text-indigo-950">${esc(g.short)}</p>
    </section>

    <section class="mb-8">
      <h2 class="text-xl font-extrabold text-slate-900 mb-3">Jak to zwykle wygląda</h2>
      <blockquote class="bg-white border border-slate-200 rounded-2xl p-5 text-slate-700 italic leading-relaxed shadow-sm">${esc(g.example)}</blockquote>
      <p class="text-xs text-slate-500 mt-2">Przykład poglądowy. Oszuści podszywają się pod znane firmy i instytucje – te firmy nie mają z tym związku.</p>
    </section>

    <section class="mb-8">
      <h2 class="text-xl font-extrabold text-slate-900 mb-3">Sygnały ostrzegawcze</h2>
      <ul class="space-y-2">
${g.signals.map(s => `        <li class="flex gap-3"><span class="text-rose-500 font-bold">⚠</span><span>${esc(s)}</span></li>`).join('\n')}
      </ul>
    </section>

    <section class="rounded-2xl p-6 mb-8 text-white" style="background:linear-gradient(135deg,#312e81,#4f46e5 55%,#059669)">
      <h2 class="text-xl font-extrabold mb-2">Masz podejrzaną wiadomość albo link?</h2>
      <p class="text-indigo-100 mb-4 leading-relaxed">Wklej go do ZanimKlikniesz – sprawdzimy listę ostrzeżeń CERT Polska, wiek strony, podszywanie się pod znane marki i treść wiadomości. Za darmo, bez logowania, bez zapisywania danych.</p>
      <a href="${zk}" class="inline-block bg-white text-indigo-700 font-extrabold px-5 py-3 rounded-xl hover:bg-indigo-50">Sprawdź za darmo →</a>
    </section>

    <section class="mb-8">
      <h2 class="text-xl font-extrabold text-slate-900 mb-3">Już kliknąłem lub zapłaciłem – co teraz?</h2>
      <div class="space-y-3">
${g.ifHappened.map(([t, d]) => `        <div class="bg-white border border-slate-200 rounded-xl p-4"><h3 class="font-bold text-slate-900 mb-1">${esc(t)}</h3><p class="text-sm leading-relaxed">${esc(d)}</p></div>`).join('\n')}
      </div>
      <p class="text-sm text-slate-600 mt-3">Podejrzany SMS prześlij bezpłatnie na numer <b>8080</b>, a fałszywą stronę zgłoś na <b>incydent.cert.pl</b> (CERT Polska).</p>
    </section>

    <section class="mb-8">
      <h2 class="text-xl font-extrabold text-slate-900 mb-3">Jak się chronić</h2>
      <ul class="list-disc pl-5 space-y-1">
${g.protect.map(s => `        <li>${esc(s)}</li>`).join('\n')}
      </ul>
    </section>

    <section class="mb-10">
      <h2 class="text-xl font-extrabold text-slate-900 mb-3">Najczęstsze pytania</h2>
      <div class="space-y-3">
${g.faq.map(([q, a]) => `        <details class="bg-white border border-slate-200 rounded-xl p-4"><summary class="font-bold text-slate-900 cursor-pointer">${esc(q)}</summary><p class="text-sm leading-relaxed mt-2">${esc(a)}</p></details>`).join('\n')}
      </div>
    </section>

    <section class="border-t border-slate-200 pt-6">
      <h2 class="text-sm font-extrabold uppercase tracking-widest text-slate-500 mb-3">Inne poradniki</h2>
      <ul class="space-y-2">
${g.related.map(r => `        <li><a href="${r}" class="text-indigo-700 font-semibold hover:underline">${esc(short(r).h1)}</a></li>`).join('\n')}
        <li><a href="${zk.replace(/tab=\w+/, 'tab=link')}#sos" class="text-indigo-700 font-semibold hover:underline">Pierwsza pomoc: już kliknąłem – co teraz?</a></li>
      </ul>
      <p class="text-xs text-slate-500 mt-6 leading-relaxed">Poradnik ma charakter edukacyjny i nie zastępuje porady prawnej. W razie straty pieniędzy skontaktuj się z bankiem i policją. EduBox AI – darmowe narzędzia, które pomagają na co dzień.</p>
    </section>
  </main>
</body>
</html>
`;
}

for (const g of GUIDES) {
  if (g.description.length < 70 || g.description.length > 180) throw new Error(`Opis ${g.slug}: ${g.description.length} znaków (zalecane 70-180)`);
  for (const r of g.related) if (!short(r)) throw new Error(`Nieznany poradnik w related: ${r}`);
  fs.writeFileSync(path.join(ROOT, g.slug), render(g));
}
console.log(`[Poradniki] Wygenerowano ${GUIDES.length} stron: ${GUIDES.map(g => g.slug).join(', ')}`);

module.exports = { GUIDES };

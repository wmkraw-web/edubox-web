// Dane EduKalendarza: święta (stałe i ruchome) na rok szkolny. Jedno źródło dla edukalendarz.html i generatora
// postów Ewy (ewamarketing.html) – żeby kalendarz i posty nie rozjechały się przy dopisywaniu świąt.
// Zwykły skrypt (bez modułów): w przeglądarce window.EduKalendarzDane, w Node testowany przez vm (kalendarz:check).
(function (global) {
  // Daty sprawdzone 8.10.2026 (m.in. Dzień Jabłka 28.09, Dzień Dinozaura 26.02, Dzień Ryby 20.12, Dzień Pizzy 9.02).
  // Usunięty „Dzień Ślimaka” 24.05 – żadne źródło go nie potwierdza. Dzień Motyla (14.03) to dzień solidarności
  // z dziećmi chorymi na EB („skóra delikatna jak skrzydła motyla”, Fundacja EB Polska), nie lekcja o cyklu życia.
  // Uzupełnienie 8.10.2026 (lista była uboga – brakowało nawet Dnia Edukacji Narodowej), każda data ze źródła:
  // – święta państwowe: Dzień Edukacji Narodowej 14.10 (art. 74 Karty Nauczyciela), Narodowe Święto Niepodległości
  //   11.11 (ustawa z 15.02.1989, art. 1), Dzień Flagi 2.05 (art. 6a ustawy o godle, barwach i hymnie),
  //   Święto Narodowe Trzeciego Maja (ustawa z 6.04.1990) – wszystkie sprawdzone w ISAP;
  // – dni ONZ i UNESCO według listy un.org/en/observances: Pokoju 21.09, Żywności 16.10, Tolerancji 16.11,
  //   Osób z Niepełnosprawnościami 3.12, Języka Ojczystego 21.02, Dzikiej Przyrody 3.03, Kobiet 8.03,
  //   Szczęścia 20.03, Zdrowia 7.04, Książki 23.04, Środowiska 5.06;
  // – Muzyki 1.10 (Międzynarodowa Rada Muzyczna), Teatru 27.03 (ITI), Tańca 29.04, Książki dla Dzieci 2.04 (IBBY,
  //   urodziny Andersena), Dzień Życzliwości i Pozdrowień 21.11, Dzień Kundelka 25.10, andrzejki 29.11, mikołajki
  //   6.12, walentynki 14.02, pierwszy dzień wiosny 21.03 (Wikipedia); Dzień Uśmiechu = pierwszy piątek października,
  //   tłusty czwartek = 52 dni przed Wielkanocą (święta ruchome, liczone niżej dla bieżącego roku szkolnego).
  // Uzupełnienie 14.10.2026: Dzień Dyni 31.10 – święto nieoficjalne, ale obchodzone w polskich przedszkolach i szkołach
  //   właśnie 31 października (np. samorzad.gov.pl, ZS nr 3 w Przytkowicach); tematem jest dynia i jesienne zbiory, nie Halloween.
  const HOLIDAYS = {
      9: [
          { day: 15, name: "Międzynarodowy Dzień Kropki", desc: "Święto kreatywności i odkrywania talentów", icon: "ph-circle" },
          { day: 20, name: "Ogólnopolski Dzień Przedszkolaka", desc: "Zabawy i integracja grupy", icon: "ph-baby" },
          { day: 21, name: "Międzynarodowy Dzień Pokoju", desc: "Przyjaźń, zgoda i rozwiązywanie sporów", icon: "ph-handshake" },
          { day: 28, name: "Światowy Dzień Jabłka", desc: "Zdrowe odżywianie i dary jesieni", icon: "ph-apple-logo" },
          { day: 30, name: "Dzień Chłopaka", desc: "Święto chłopaków w klasie", icon: "ph-baseball" }
      ],
      10: [
          { day: 1, name: "Międzynarodowy Dzień Muzyki", desc: "Instrumenty, rytm i wspólne śpiewanie", icon: "ph-music-notes" },
          { day: 4, name: "Światowy Dzień Zwierząt", desc: "Edukacja o empatii i szacunku do zwierząt", icon: "ph-paw-print" },
          { day: 9, name: "Dzień Znaczka Pocztowego", desc: "Poczta, listy i projektowanie znaczków", icon: "ph-envelope" },
          { day: 10, name: "Święto Drzewa", desc: "Edukacja ekologiczna i dary lasu", icon: "ph-tree" },
          { day: 14, name: "Dzień Edukacji Narodowej", desc: "Święto nauczycieli i wszystkich pracowników przedszkola i szkoły – laurki i podziękowania (w szkołach dzień wolny od zajęć lekcyjnych, więc zajęcia zwykle dzień wcześniej)", icon: "ph-chalkboard-teacher" },
          { day: 15, name: "Dzień Czystych Rąk", desc: "Higiena i dbanie o zdrowie", icon: "ph-drop" },
          { day: 16, name: "Światowy Dzień Żywności", desc: "Zdrowe jedzenie i niemarnowanie żywności", icon: "ph-bowl-food" },
          { day: 25, name: "Dzień Kundelka", desc: "Psy ze schronisk, adopcja i odpowiedzialna opieka", icon: "ph-dog" },
          { day: 31, name: "Dzień Dyni", desc: "Dynia i jesienne zbiory: jak rośnie, co ma w środku, co z niej ugotować (bez motywów Halloween)", icon: "ph-plant" }
      ],
      11: [
          { day: 5, name: "Dzień Postaci z Bajek", desc: "Królewny, smoki i superbohaterowie", icon: "ph-crown" },
          { day: 10, name: "Dzień Jeża", desc: "Zimowy sen zwierząt i jesienne liście", icon: "ph-bug" },
          { day: 11, name: "Narodowe Święto Niepodległości", desc: "Symbole narodowe: flaga, godło, hymn (dzień wolny – zajęcia zwykle dzień wcześniej)", icon: "ph-flag" },
          { day: 16, name: "Międzynarodowy Dzień Tolerancji", desc: "Akceptacja różnic i szacunek dla każdego", icon: "ph-users-three" },
          { day: 20, name: "Ogólnopolski Dzień Praw Dziecka", desc: "Edukacja obywatelska od najmłodszych lat", icon: "ph-scales" },
          { day: 21, name: "Światowy Dzień Życzliwości i Pozdrowień", desc: "Miłe słowa, uśmiech i pozdrowienia", icon: "ph-hand-waving" },
          { day: 25, name: "Światowy Dzień Pluszowego Misia", desc: "Przynosimy misie do szkoły/przedszkola", icon: "ph-heart" },
          { day: 29, name: "Andrzejki", desc: "Wróżby i zabawy andrzejkowe (wosk i świece tylko w rękach dorosłego albo zabawy bez ognia)", icon: "ph-magic-wand" }
      ],
      12: [
          { day: 3, name: "Międzynarodowy Dzień Osób z Niepełnosprawnościami", desc: "Akceptacja, wzajemna pomoc i równe szanse", icon: "ph-wheelchair" },
          { day: 4, name: "Dzień Górnika (Barbórka)", desc: "Węgiel, kopalnie i Śląsk", icon: "ph-pickaxe" },
          { day: 6, name: "Mikołajki", desc: "Dobre uczynki, dzielenie się i drobne upominki", icon: "ph-gift" },
          { day: 15, name: "Międzynarodowy Dzień Herbaty", desc: "Zimowa rozgrzewka i zapachy", icon: "ph-coffee" },
          { day: 20, name: "Dzień Ryby", desc: "Morskie głębiny i wodne zwierzęta", icon: "ph-fish" },
          { day: 24, name: "Wigilia i Boże Narodzenie", desc: "Polskie zwyczaje świąteczne: choinka, życzenia, kolędy (zajęcia przed przerwą świąteczną)", icon: "ph-tree-evergreen" }
      ],
      1: [
          { day: 18, name: "Dzień Kubusia Puchatka", desc: "Przyjaźń, miodek i Stumilowy Las", icon: "ph-book-open-text" },
          { day: 20, name: "Dzień Pingwina", desc: "Zwierzęta egzotyczne i zabawy zimowe", icon: "ph-thermometer-cold" },
          { day: 21, name: "Dzień Babci", desc: "Laurki, wspólne zabawy i wdzięczność", icon: "ph-flower-tulip" },
          { day: 22, name: "Dzień Dziadka", desc: "Opowieści, gry dawniej i dziś", icon: "ph-armchair" },
          { day: 28, name: "Międzynarodowy Dzień Klocków Lego", desc: "Budowanie, architektura i mała motoryka", icon: "ph-squares-four" },
          { day: 31, name: "Dzień Zebry", desc: "Czarno-białe kontrasty i sawanna", icon: "ph-barcode" }
      ],
      2: [
          { day: 9, name: "Międzynarodowy Dzień Pizzy", desc: "Włoska kuchnia, sensoryka i kształty", icon: "ph-pizza" },
          { day: 14, name: "Walentynki", desc: "Dzień przyjaźni i życzliwości – miłe słowa i laurki dla bliskich", icon: "ph-heart-straight" },
          { day: 17, name: "Światowy Dzień Kota", desc: "Puszyste mruczki, kocie ruchy", icon: "ph-cat" },
          { day: 21, name: "Międzynarodowy Dzień Języka Ojczystego", desc: "Piękno polszczyzny, gwary i języki dzieci z grupy", icon: "ph-chat-circle-text" },
          { day: 26, name: "Dzień Dinozaura", desc: "Paleontologia, wykopaliska i giganty", icon: "ph-bone" }
      ],
      3: [
          { day: 3, name: "Światowy Dzień Dzikiej Przyrody", desc: "Dzikie zwierzęta i rośliny, ochrona przyrody", icon: "ph-binoculars" },
          { day: 8, name: "Dzień Kobiet", desc: "Wdzięczność dla mam, babć i pań z przedszkola i szkoły", icon: "ph-flower" },
          { day: 14, name: "Dzień Motyla", desc: "Solidarność z dziećmi z EB (skóra delikatna jak skrzydła motyla) i świat motyli", icon: "ph-butterfly" },
          { day: 20, name: "Międzynarodowy Dzień Szczęścia", desc: "Co sprawia nam radość – emocje i wdzięczność", icon: "ph-smiley-wink" },
          { day: 21, name: "Pierwszy Dzień Wiosny", desc: "Pożegnanie zimy i oznaki wiosny w przyrodzie", icon: "ph-plant" },
          { day: 21, name: "Dzień Kolorowej Skarpetki", desc: "Światowy Dzień Zespołu Downa (Akceptacja)", icon: "ph-sneaker" },
          { day: 22, name: "Światowy Dzień Wody", desc: "Eksperymenty i ekologia", icon: "ph-drop" },
          { day: 27, name: "Międzynarodowy Dzień Teatru", desc: "Teatrzyk, kukiełki i odgrywanie ról", icon: "ph-mask-happy" }
      ],
      4: [
          { day: 2, name: "Światowy Dzień Świadomości Autyzmu", desc: "Na niebiesko dla autyzmu - Integracja", icon: "ph-puzzle-piece" },
          { day: 2, name: "Międzynarodowy Dzień Książki dla Dzieci", desc: "Baśnie Andersena i ulubione książki", icon: "ph-book-open" },
          { day: 4, name: "Dzień Marchewki", desc: "Zdrowie, witaminy i warzywa", icon: "ph-carrot" },
          { day: 7, name: "Światowy Dzień Zdrowia", desc: "Zdrowe nawyki: ruch, sen i jedzenie", icon: "ph-heartbeat" },
          { day: 12, name: "Dzień Czekolady", desc: "Sensoryka, smaki i kuchnia", icon: "ph-cookie" },
          { day: 22, name: "Międzynarodowy Dzień Ziemi", desc: "Recykling, planeta i ekologia", icon: "ph-globe-hemisphere-green" },
          { day: 23, name: "Światowy Dzień Książki", desc: "Czytanie, biblioteka i szacunek dla autorów", icon: "ph-books" },
          { day: 29, name: "Międzynarodowy Dzień Tańca", desc: "Ruch przy muzyce i tańce z różnych stron świata", icon: "ph-sneaker-move" }
      ],
      5: [
          { day: 2, name: "Dzień Flagi Rzeczypospolitej Polskiej", desc: "Barwy narodowe i szacunek dla flagi", icon: "ph-flag-banner" },
          { day: 3, name: "Święto Konstytucji 3 Maja", desc: "Symbole i najważniejsze prawa Polski (dzień wolny – zajęcia zwykle wcześniej)", icon: "ph-scroll" },
          { day: 4, name: "Dzień Strażaka", desc: "Zawody ratunkowe i numery alarmowe", icon: "ph-fire" },
          { day: 15, name: "Dzień Niezapominajki", desc: "Polska przyroda i pamięć o środowisku", icon: "ph-flower" },
          { day: 20, name: "Światowy Dzień Pszczół", desc: "Zapylacze, łąka i plaster miodu", icon: "ph-hexagon" },
          { day: 26, name: "Dzień Matki", desc: "Laurki, wdzięczność i rodzina", icon: "ph-flower-lotus" }
      ],
      6: [
          { day: 1, name: "Międzynarodowy Dzień Dziecka", desc: "Zabawa, prawa dzieci i uśmiech", icon: "ph-balloons" },
          { day: 5, name: "Światowy Dzień Środowiska", desc: "Ekologia na co dzień: segregacja i oszczędzanie wody", icon: "ph-recycle" },
          { day: 8, name: "Światowy Dzień Oceanów", desc: "Woda, żegluga i zwierzęta morskie", icon: "ph-waves" },
          { day: 21, name: "Światowy Dzień Żyrafy", desc: "Najwyższe zwierzęta i Afryka", icon: "ph-arrows-out-line-vertical" },
          { day: 23, name: "Dzień Ojca", desc: "Wspólne zabawy, wdzięczność i rodzina", icon: "ph-medal" }
      ]
  };

  // Święta ruchome – data liczona dla bieżącego roku szkolnego (wrzesień–grudzień: rok początku, styczeń–czerwiec: następny).
  // Wielkanoc: algorytm Meeusa/Jonesa/Butchera (kalendarz gregoriański).
  function easterDate(y) {
      const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
      const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
      const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
      const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
      return new Date(y, month - 1, day);
  }
  const addDays = (date, n) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);
  // Pierwszy dany dzień tygodnia w miesiącu (weekday: 0 = niedziela … 5 = piątek; month: 1–12)
  const firstWeekday = (y, month, weekday) => { const d = new Date(y, month - 1, 1); return addDays(d, (weekday - d.getDay() + 7) % 7); };
  const MOVABLE = [
      { name: "Światowy Dzień Uśmiechu", desc: "Pierwszy piątek października – uśmiech, życzliwość i dobre uczynki", icon: "ph-smiley", date: (y) => firstWeekday(y, 10, 5) },
      { name: "Tłusty Czwartek", desc: "Karnawałowe tradycje: pączki i faworki (uwaga na alergie)", icon: "ph-cake", date: (y) => addDays(easterDate(y), -52) },
      { name: "Wielkanoc – tradycje", desc: "Pisanki i polskie zwyczaje wielkanocne (zajęcia przed świętami)", icon: "ph-egg", date: (y) => easterDate(y) }
  ];
  // Rok szkolny zaczyna się we wrześniu; w sierpniu kalendarz pokazuje już nadchodzący rok.
  const schoolYearStart = (now) => { const d = now || new Date(); return d.getMonth() >= 7 ? d.getFullYear() : d.getFullYear() - 1; };
  function holidaysFor(month, now) {
      const y0 = schoolYearStart(now);
      const year = month >= 9 ? y0 : y0 + 1;
      const list = (HOLIDAYS[month] || []).slice();
      for (const mv of MOVABLE) {
          const d = mv.date(year);
          if (d.getMonth() + 1 === month) list.push({ day: d.getDate(), name: mv.name, desc: mv.desc, icon: mv.icon, movable: true });
      }
      return list.sort((a, b) => a.day - b.day);
  }
  const currentSchoolMonth = (now) => { const m = (now || new Date()).getMonth() + 1; return m === 7 || m === 8 ? 9 : m; };

  const MONTHS = [
      { id: 9, name: "Wrzesień" }, { id: 10, name: "Październik" }, { id: 11, name: "Listopad" }, { id: 12, name: "Grudzień" },
      { id: 1, name: "Styczeń" }, { id: 2, name: "Luty" }, { id: 3, name: "Marzec" }, { id: 4, name: "Kwiecień" },
      { id: 5, name: "Maj" }, { id: 6, name: "Czerwiec" }
  ];
  const MONTH_GEN = { 9: 'września', 10: 'października', 11: 'listopada', 12: 'grudnia', 1: 'stycznia', 2: 'lutego', 3: 'marca', 4: 'kwietnia', 5: 'maja', 6: 'czerwca' };


  global.EduKalendarzDane = { HOLIDAYS, MOVABLE, easterDate, addDays, firstWeekday, schoolYearStart, holidaysFor, currentSchoolMonth, MONTHS, MONTH_GEN };
})(typeof window !== 'undefined' ? window : this);

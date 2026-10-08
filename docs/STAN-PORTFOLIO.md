# Stan portfolio EduBox AI

<!-- PLIK GENEROWANY: node scripts/stan-portfolio.js. Nie edytuj ręcznie. -->

Wygenerowano: 2026-10-08 · stron narzędzi: **60** · kafelków w katalogu: **68** (część to głębokie linki `?mode=` do tej samej strony).

Ten plik odpowiada na pytanie „co jest już zrobione, a co zostało?" bez zgadywania:
powstaje z faktycznych plików, nie z notatek. Po każdej większej zmianie odpal
`npm run stan` i zacommituj — `npm test` sprawdza, czy jest aktualny.

Legenda: ✅ jest · ⚠️ po staremu / do zerknięcia · – brak · · nie dotyczy

⚠️ znaczy „sprawdź”, nie „zepsute”. Przy kolumnie **Czysty wydruk** jest to szczególnie ważne:
wykrycie poprawnego wydruku z samego kodu jest zawodne, bo zależy od tego, jakim kolorem
markup renderuje treść w środku kartki. Traktuj te pozycje jako listę do obejrzenia
w podglądzie wydruku (Ctrl+P), nie jako listę błędów.

## Podsumowanie

| Cecha | Jest | Do zrobienia | Brak | Po co to |
| --- | --- | --- | --- | --- |
| Kartka A4 | 11 | 0 | 49 | wzorzec generatorów dokumentów: AI zwraca czysty HTML, podgląd jako kartka, edycja przed eksportem |
| Strumień | 22 | 0 | 38 | tekst pojawia się na bieżąco; bez tego nauczyciel czeka w ciszy nawet 100 s |
| Prawdziwy .docx | 24 | 0 | 36 | plik „.doc" z HTML-em w środku (mime application/msword) Word otwiera z ostrzeżeniem, a Dokumenty Google potrafią go odrzucić |
| Czysty wydruk | 49 | 0 | 0 | jasnoszary tekst (`text-slate-400` i pokrewne – 1284 wystąpienia) jest na wydruku praktycznie niewidoczny, a `body { color: black }` go nie przebija, bo klasa Tailwinda ma wyższą specyficzność. Od 10.2026 załatwia to wspólna reguła w `edubox-ui.css` w `@media print`, więc wystarcza podpięcie warstwy; `printDoc` albo własna reguła czerni też się liczą. Dekoratory drukują w kolorze – tam `text-white` celowo zostaje białe. |
| Nowy wygląd | 60 | 0 | 0 | wspólna warstwa edubox-ui.css: spokojne powierzchnie z prawdziwym cieniem zamiast neonowych poświat i pływających bąbli z 2021. Neony wpisane w markup wygasza reguła [class*="shadow-[0_0_"] w tym pliku, więc podpięcie linku wystarcza – klas nie trzeba czyścić z markupu. |
| „Jak to działa" | 60 | 0 | 0 | info-box blisko góry formularza - konwencja z CLAUDE.md |
| Wspólna pula | 27 | 0 | 13 | EduBoxCore.executeWithLimitCheck zamiast własnego licznika per-aplikacja |

## Przepisy

Narzędzia cytujące przepisy (`§`, `art.`, `Dz.U.`): **16**, z tego objętych cotygodniową kontrolą ISAP (`scripts/legal-acts.json` → `npm run legal:check`): **16**.

✅ Każde narzędzie cytujące przepisy jest objęte kontrolą.

Ostatnia ręczna weryfikacja aktów w ISAP: **2026-10-07** (19 aktów).

⚠️ **Akty cytowane w kodzie, których NIE MA w `legal-acts.json`** — ich nowelizacja nie wywoła alertu:

- **Dz.U. 2024 poz. 1673** — w 1 plikach: `sos-porady.js`
- **Dz.U. 2025 poz. 363** — w 2 plikach: `edukacja2025.html`, `scripts\check-edukacja.js`

Domknięcie: potwierdź tytuł aktu w ISAP, dopisz go do `scripts/legal-acts.json` (z listą plików w `usedIn`), potem `npm run legal:update`.

Cytowane przez numer tekstu jednolitego lub noweli — pilnowane pod numerem pierwotnym, więc w porządku:

- Dz.U. 2020 poz. 1309 → `DU/2017/1578` (Kształcenie specjalne – IPET i WOPFU (§ 6))
- Dz.U. 2023 poz. 1606 → `DU/2016/862` (Standardy ochrony małoletnich)
- Dz.U. 2023 poz. 1798 → `DU/2017/1591` (Pomoc psychologiczno-pedagogiczna (m.in. § 20 – ocena efektywności))
- Dz.U. 2023 poz. 2572 → `DU/2019/373` (Ocenianie – dostosowanie wymagań (§ 2), zachowanie (§ 11), prace domowe (§ 12a))
- Dz.U. 2024 poz. 50 → `DU/2017/1646` (Dokumentacja przebiegu nauczania – dzienniki (tekst jednolity Dz.U. 2024 poz. 50))
- Dz.U. 2025 poz. 881 → `DU/1991/425` (Ocenianie w ustawie (art. 44c, 44f, 44i))
- Dz.U. 2026 poz. 1012 → `DU/2017/356` (Podstawa programowa z 2017 r. – uchylona od 1.09.2026, ale w 2026/2027 nadal stosowana w klasach II–III i V–VIII (§ 4 ust. 2 Dz.U. 2026 poz. 378))
- Dz.U. 2026 poz. 110 → `DU/2016/862` (Standardy ochrony małoletnich)
- Dz.U. 2026 poz. 1122 → `DU/2019/373` (Ocenianie – dostosowanie wymagań (§ 2), zachowanie (§ 11), prace domowe (§ 12a))
- Dz.U. 2026 poz. 515 → `DU/1982/19` (Karta Nauczyciela (awans zawodowy))
- Dz.U. 2026 poz. 820 → `DU/2017/59` (Prawo oświatowe)

## Porządki (nie błędy)

Stron z martwymi klasami `shadow-[0_0_…]` w markupie: **45**.
Wygasza je reguła w `edubox-ui.css`, więc wyglądu nie psują – to tylko kod do sprzątnięcia
przy okazji innych zmian w danym pliku. Nie ma potrzeby robić z tego osobnej akcji.

## Narzędzia

### Terapia i SPE (11)

| Narzędzie | Plik | Kartka A4 | Strumień | Prawdziwy .docx | Czysty wydruk | Nowy wygląd | „Jak to działa" | Wspólna pula | Przepisy |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| EduChunk AI | `chunking.html` | – | – | ✅ | ✅ | ✅ | ✅ | ✅ | · |
| EduBajka PRO (Ilustrowana) | `edubajka.html` | – | – | – | ✅ | ✅ | ✅ | ✅ | · |
| EduDialog AI (Tłumacz) | `edudialog.html` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | · | ✅ ISAP |
| Asystent Dostosowań | `edudostosowania.html` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | · | ✅ ISAP |
| EduKasia PRO | `edukasia.html` | – | ✅ | – | ✅ | ✅ | ✅ | ✅ | · |
| EduOddech - Chwila dla Nauczyciela | `eduoddech.html` | – | – | – | ✅ | ✅ | ✅ | · | · |
| EduPiktogram | `edupiktogram.html` | – | – | – | · | ✅ | ✅ | ✅ | · |
| EduSOS PRO | `edusos.html` | – | ✅ | – | ✅ | ✅ | ✅ | · | · |
| EduSymbol AI | `edusymbol.html` | – | – | – | · | ✅ | ✅ | – | · |
| EduTerapia PRO (TUS) | `eduterapia.html` | – | – | ✅ | ✅ | ✅ | ✅ | ✅ | · |
| EduWizualizator (AAC) | `eduwizualizator.html` | – | ✅ | – | ✅ | ✅ | ✅ | ✅ | · |

### Dokumenty i biurokracja (16)

| Narzędzie | Plik | Kartka A4 | Strumień | Prawdziwy .docx | Czysty wydruk | Nowy wygląd | „Jak to działa" | Wspólna pula | Przepisy |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Asystent Pedagoga (IPET/WWRD) | `asystent-pedagoga.html` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | – | ✅ ISAP |
| Kreator Awansu AI | `awans.html` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | · | ✅ ISAP |
| EduAwans | `eduawans.html` | – | ✅ | ✅ | ✅ | ✅ | ✅ | · | ✅ ISAP |
| EduBiurokrata AI | `edubiurokrata.html` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | · | ✅ ISAP |
| Baza Druków | `edudruki.html` | – | – | – | ✅ | ✅ | ✅ | · | ✅ ISAP |
| EduKatalog (Generator Ofert) | `edukatalog.html` | – | – | – | ✅ | ✅ | ✅ | · | · |
| EduKorektor AI (NAZU) | `edukorektor.html` | – | – | – | ✅ | ✅ | ✅ | ✅ | · |
| EduNotariusz AI | `edunotariusz.html` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | · | · |
| EduOcena AI | `eduocena.html` | – | ✅ | ✅ | ✅ | ✅ | ✅ | · | ✅ ISAP |
| EduPDF Edytor | `edupdf.html` | – | – | – | ✅ | ✅ | ✅ | · | · |
| EduPrawo AI | `eduprawo.html` | – | – | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ ISAP |
| EduRaport AI | `eduraport.html` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | · | · |
| Asystent Wdrożenia Reformy 2026 | `edureforma.html` | – | – | – | ✅ | ✅ | ✅ | ✅ | ✅ ISAP |
| EduSprawozdawca PRO | `edusprawozdania.html` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | · | ✅ ISAP |
| EduWpisy PRO (Dziennik) | `eduwpisy.html` | – | ✅ | – | ✅ | ✅ | ✅ | · | ✅ ISAP |
| EduWycieczka Organizator | `eduwycieczka.html` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | · | ✅ ISAP |

### Lekcje i zajęcia (22)

| Narzędzie | Plik | Kartka A4 | Strumień | Prawdziwy .docx | Czysty wydruk | Nowy wygląd | „Jak to działa" | Wspólna pula | Przepisy |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| EduBystrzak AI | `edubystrzak.html` | – | – | – | ✅ | ✅ | ✅ | · | · |
| EduDetox AI | `edudetox.html` | – | – | – | ✅ | ✅ | ✅ | – | · |
| EduEscape PRO | `eduescape.html` | – | ✅ | – | ✅ | ✅ | ✅ | – | · |
| EduFiszki i Memory AI | `edufiszki.html` | – | – | – | ✅ | ✅ | ✅ | – | · |
| EduGrupy (Koło Fortuny) | `edugrupy.html` | – | – | – | ✅ | ✅ | ✅ | · | · |
| EduGry (Ja Mam) | `edugry.html` | – | – | – | ✅ | ✅ | ✅ | · | · |
| Edukacja Obywatelska AI | `edukacja2025.html` | – | – | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ ISAP |
| EduKalendarz | `edukalendarz.html` | – | – | ✅ | ✅ | ✅ | ✅ | – | · |
| EduKomiks AI | `edukomiks.html` | – | – | – | ✅ | ✅ | ✅ | ✅ | · |
| EduLekcja 360 | `edulekcja360.html` | – | – | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ ISAP |
| EduMotywator AI | `edumotywator.html` | – | – | ✅ | ✅ | ✅ | ✅ | ✅ | · |
| EduPrezentacja PRO | `eduprezentacja.html` | – | – | – | ✅ | ✅ | ✅ | ✅ | · |
| EduRymy AI | `edurymy.html` | – | ✅ | – | ✅ | ✅ | ✅ | ✅ | · |
| Scenariusz AI PRO | `eduscenariusz.html` | – | – | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ ISAP |
| EduSprawdzian Maker | `edusprawdzian.html` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | · |
| EduTimer PRO | `edustoper.html` | – | – | – | ✅ | ✅ | ✅ | · | · |
| EduTik PRO (Wierszyki i Piosenki) | `edutik.html` | – | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | · |
| EduWakacje PRO | `eduwakacje.html` | – | ✅ | – | ✅ | ✅ | ✅ | – | · |
| EduZadania AI | `eduzadania.html` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | · |
| EduZastępstwo 999 | `eduzastepstwo.html` | – | – | – | ✅ | ✅ | ✅ | ✅ | · |
| EduBoxPro Studio | `studio.html` | – | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | · |
| ZanimKlikniesz | `zanimklikniesz.html` | – | – | – | ✅ | ✅ | ✅ | – | · |

### Grafika i materiały (11)

| Narzędzie | Plik | Kartka A4 | Strumień | Prawdziwy .docx | Czysty wydruk | Nowy wygląd | „Jak to działa" | Wspólna pula | Przepisy |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| EduWystrój AI | `edudekorator.html` | – | – | – | · | ✅ | ✅ | – | · |
| EduDyplom Wideo | `edudyplom.html` | – | – | – | ✅ | ✅ | ✅ | ✅ | · |
| EduDyplomy AI | `edudyplomy.html` | – | – | ✅ | · | ✅ | ✅ | – | · |
| EduGazetka AI | `edugazetka.html` | – | – | – | · | ✅ | ✅ | – | · |
| EduGenerator PRO | `edugenerator.html` | – | – | – | · | ✅ | ✅ | ✅ | · |
| EduMalarz AI | `edumalarz.html` | – | – | – | · | ✅ | ✅ | – | · |
| EduPlakat AI | `eduplakat.html` | – | – | – | · | ✅ | ✅ | ✅ | · |
| EduPodsumowanie | `edupodsumowanie.html` | – | – | – | ✅ | ✅ | ✅ | ✅ | · |
| EduStudio AI | `edustudio.html` | – | – | – | · | ✅ | ✅ | ✅ | · |
| Magic Color AI | `magiccolor.html` | – | – | – | · | ✅ | ✅ | ✅ | · |
| EduBoxPro MagicLetters | `magicletters.html` | – | – | – | · | ✅ | ✅ | – | · |


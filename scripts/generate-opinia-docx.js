'use strict';

// Generator wzoru „Opinia o funkcjonowaniu dziecka lub ucznia” (wzory-drukow/*.docx) – układ zgodny
// z § 7 ust. 2–7 rozporządzenia Ministra Edukacji z 2 marca 2026 r. (Dz.U. 2026 poz. 428).
// Biblioteka docx nie jest zależnością projektu – przed uruchomieniem: npm i --no-save docx@9
// Uruchom: node scripts/generate-opinia-docx.js

const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType
} = require('docx');

const CHECKED = '6.10.2026';
const OUT = path.resolve(__dirname, '..', 'wzory-drukow', 'Opinia-o-funkcjonowaniu-dziecka-wzor-proponowany.docx');
const DOTS = '..........................................................................................................';

const p = (text, opts = {}) => new Paragraph({ spacing: { after: 120 }, ...opts, children: [new TextRun({ text, ...(opts.run || {}) })] });
const label = (bold, rest) => new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: bold, bold: true }), new TextRun({ text: rest })] });
const h = (text) => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 280, after: 120 }, children: [new TextRun({ text })] });
const h3 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 80 }, children: [new TextRun({ text })] });
const lines = (n) => Array.from({ length: n }, () => p(DOTS, { run: { color: '808080' } }));
const area = (n, name, extra = '') => [label(`${n}. ${name}`, extra), ...lines(2)];

const cell = (text, bold = false) => new TableCell({ width: { size: 25, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text, bold })] })] });
const helpTable = new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [
    new TableRow({ children: ['Forma pomocy / podjęte działania', 'Zakres (wymiar godzin)', 'Okres udzielania', 'Efekty'].map(t => cell(t, true)) }),
    ...Array.from({ length: 4 }, () => new TableRow({ children: ['', '', '', ''].map(t => cell(t)) }))
  ]
});

const doc = new Document({
  creator: 'EduBox AI',
  title: 'Opinia o funkcjonowaniu dziecka lub ucznia – wzór przykładowy',
  styles: { default: { document: { run: { font: 'Calibri', size: 22 } } } },
  sections: [{
    children: [
      new Paragraph({ heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: 'WZÓR PRZYKŁADOWY – Opinia o funkcjonowaniu dziecka lub ucznia w przedszkolu / szkole' })] }),
      p('(dla zespołu orzekającego publicznej poradni psychologiczno-pedagogicznej)', { alignment: AlignmentType.CENTER, run: { italics: true } }),
      label('UWAGA: ', 'Opinię przekazuje dyrektor przedszkola lub szkoły na prośbę przewodniczącego zespołu orzekającego albo wnioskodawcy (rodzica lub pełnoletniego ucznia) – w terminie 10 dni od dnia otrzymania prośby (§ 7 ust. 2–4). Kopię opinii przekazuje się rodzicom dziecka lub ucznia albo pełnoletniemu uczniowi (§ 7 ust. 5). Od 1 września 2026 r. treść opinii określa § 7 ust. 6–7 – ten wzór odpowiada kolejnym punktom przepisu. Przepisy nie narzucają wzoru graficznego: układ można dostosować, byle zachować wymaganą treść.'),
      label('Podstawa prawna: ', `§ 7 ust. 2–7 rozporządzenia Ministra Edukacji z dnia 2 marca 2026 r. w sprawie orzeczeń i opinii wydawanych przez zespoły orzekające działające w publicznych poradniach psychologiczno-pedagogicznych (Dz.U. z 2026 r. poz. 428) – rozporządzenie obowiązuje od 14 kwietnia 2026 r., przepisy § 7 ust. 6–7 stosuje się od 1 września 2026 r. Stan prawny sprawdzony w ISAP: ${CHECKED}.`),

      h('1. Dane podstawowe'),
      label('Data wydania opinii (§ 7 ust. 6 pkt 1): ', '.............................................'),
      label('Imię i nazwisko dziecka / ucznia (§ 7 ust. 6 pkt 2): ', '.............................................'),
      label('Przedszkole / szkoła, grupa / klasa: ', '.............................................'),
      label('Prośba o wydanie opinii: ', 'od przewodniczącego zespołu orzekającego / od wnioskodawcy (niepotrzebne skreślić); data otrzymania prośby: ....................'),

      h('2. Informacja o funkcjonowaniu dziecka / ucznia w przedszkolu lub szkole (§ 7 ust. 6 pkt 3)'),
      p('Uwzględnij wyniki obserwacji funkcjonowania dziecka lub ucznia i działań diagnostycznych prowadzonych w placówce (§ 7 ust. 6). Opisuj konkretne, obserwowane zachowania – nie stawiaj diagnoz.', { run: { italics: true } }),
      h3('2.1. Mocne strony i uzdolnienia (rozpoznane przez nauczycieli i specjalistów)'),
      ...lines(3),
      h3('2.2. Trudności'),
      ...lines(3),
      h3('2.3. Aktywność i uczestniczenie – obszary według ICF (§ 7 ust. 7 pkt 1)'),
      p('Dla każdego obszaru opisz: co dziecko lub uczeń robi samodzielnie, z jaką pomocą (np. przypomnienie słowne, instrukcja obrazkowa, pomoc fizyczna), w jakich warunkach funkcjonuje najlepiej, jakie są bariery i co ułatwia funkcjonowanie. Wypełnij część A albo B – odpowiednio do etapu edukacyjnego.', { run: { italics: true } }),
      label('A. Dziecko do ukończenia wychowania przedszkolnego ', '(5 obszarów – § 7 ust. 7 pkt 1 lit. a)'),
      ...area(1, 'Uczenie się i stosowanie wiedzy'),
      ...area(2, 'Zachowania społeczne we wzajemnych kontaktach – przystosowanie społeczne i emocjonalne'),
      ...area(3, 'Porozumiewanie się'),
      ...area(4, 'Aktywność ruchowa – poruszanie się'),
      ...area(5, 'Dbanie o siebie'),
      label('B. Uczeń ', '(7 obszarów – § 7 ust. 7 pkt 1 lit. b)'),
      ...area(1, 'Uczenie się i stosowanie wiedzy'),
      ...area(2, 'Ogólne zadania i obowiązki'),
      ...area(3, 'Porozumiewanie się'),
      ...area(4, 'Motoryka, poruszanie się, w tym mobilność i aktywność manualna'),
      ...area(5, 'Dbanie o siebie, samoobsługa i samodzielność'),
      ...area(6, 'Życie domowe', ' (na podstawie informacji od rodziców)'),
      ...area(7, 'Wzajemne kontakty i związki międzyludzkie, życie w społeczności szkolnej i lokalnej'),
      h3('2.4. Zakres i rodzaj trudności w realizacji programu wychowania przedszkolnego lub programów nauczania (§ 7 ust. 7 pkt 2)'),
      ...lines(3),

      h('3. Dokumenty stanowiące część opinii (§ 7 ust. 6 pkt 4–5)'),
      p('☐ aktualna wielospecjalistyczna ocena poziomu funkcjonowania (WOPFU) – u dziecka lub ucznia objętego kształceniem specjalnym'),
      p('☐ aktualna okresowa ocena funkcjonowania – u dziecka lub ucznia objętego zajęciami rewalidacyjno-wychowawczymi'),
      p('☐ nie dotyczy'),

      h('4. Działania podjęte w celu poprawy funkcjonowania, formy i zakres pomocy, okres jej udzielania i efekty (§ 7 ust. 6 pkt 6)'),
      p('Uwzględnij działania nauczycieli i specjalistów oraz pomoc udzieloną w ramach wczesnego wspomagania rozwoju lub pomocy psychologiczno-pedagogicznej.', { run: { italics: true } }),
      helpTable,

      h('5. Wnioski dotyczące dalszej pracy z dzieckiem / uczniem (§ 7 ust. 6 pkt 7)'),
      ...lines(4),

      h('Opracowali'),
      p('Imiona i nazwiska, funkcje (wychowawca, nauczyciele, specjaliści): ...........................................................'),
      new Paragraph({ spacing: { before: 480 }, children: [new TextRun({ text: 'Miejscowość, data: ..............................          Pieczęć placówki          Podpis dyrektora: ..............................' })] }),
      p(`Wzór przykładowy przygotowany przez EduBox AI (eduboxpro.pl). Stan prawny: ${CHECKED}. Przed użyciem sprawdź aktualność przepisów i ustalenia swojej placówki.`, { run: { italics: true, size: 18, color: '666666' } })
    ]
  }]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(OUT, buf);
  console.log('[Opinia] Zapisano', path.relative(process.cwd(), OUT), buf.length, 'B');
});

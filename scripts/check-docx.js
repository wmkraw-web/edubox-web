'use strict';

// Kontrola eksportu do Worda: uruchamia PRAWDZIWA konwersje HTML -> bloki docx z doc-tools.js
// na atrapie biblioteki docx (CDN jsdelivr jest w sandboxie zablokowany, a i w CI nie chcemy
// sciagac 2 MB na kazdy przebieg). Sprawdza to, co faktycznie wysylaja narzedzia: naglowki,
// akapity, listy, tabele, wysrodkowanie dyplomu i bilety EduMotywatora w dwoch kolumnach.
//
// Wymaga jsdom (DOMParser nie istnieje w Node):
//   npm i --no-save jsdom && npm run docx:check
// Celowo NIE jest czescia `npm test` - ta sama konwencja co docx@9 w generatorze wzorow .docx.

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!doctype html><html><body></body></html>');

const sandbox = { window: {}, DOMParser: dom.window.DOMParser, document: dom.window.document };
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'doc-tools.js'), 'utf8'), sandbox);
const DT = sandbox.window.EduDocTools;

// --- atrapa biblioteki docx: zapisuje, co dostala ---
const node = (kind) => function (o) { this.kind = kind; Object.assign(this, o || {}); };
const D = {
  Paragraph: node('P'), TextRun: node('RUN'), Table: node('TABLE'),
  TableRow: node('ROW'), TableCell: node('CELL'), Footer: node('FOOTER'),
  HeadingLevel: { HEADING_1: 'H1', HEADING_2: 'H2', HEADING_3: 'H3' },
  AlignmentType: { CENTER: 'CENTER', RIGHT: 'RIGHT', JUSTIFIED: 'JUSTIFIED', LEFT: 'LEFT', START: 'START' },
  WidthType: { PERCENTAGE: '%' }, ShadingType: { CLEAR: 'clear' },
  LevelFormat: { DECIMAL: 'dec' }, PageNumber: {}, Document: node('DOC'), Packer: {},
};
sandbox.window.docx = D;

// buildDocx wola loadDocx (CDN) - podstawiamy gotowe D i przechwytujemy drzewo
let captured = null;
D.Document = function (o) { captured = o; };
D.Packer.toBlob = async () => 'blob';
DT.loadDocx = async () => D;

let fail = 0;
const ok = (name, cond, extra) => {
  console.log((cond ? '✅ ' : '❌ ') + name + (cond || extra === undefined ? '' : '  → ' + JSON.stringify(extra)));
  if (!cond) fail++;
};
const build = async (html, opts) => { captured = null; await DT.buildDocx(html, opts || {}); return captured.sections[0].children; };
const text = (n) => (n.children || []).map(r => r.text || '').join('');

(async () => {
  // 1. Zwykly dokument tekstowy (eduocena, eduprawo, scenariusze...)
  let ch = await build('<h1>Ocena opisowa</h1><p>Uczeń <strong>czyta</strong> płynnie.</p><ul><li>mocna strona</li></ul>');
  ok('h1 -> naglowek 1, wysrodkowany', ch[0].heading === 'H1' && ch[0].alignment === 'CENTER');
  ok('tekst naglowka zachowany', text(ch[0]) === 'Ocena opisowa', text(ch[0]));
  ok('akapit z pogrubieniem', ch[1].children.some(r => r.bold && r.text === 'czyta'));
  ok('lista punktowana', !!ch[2].bullet);

  // 2. Dyplom: wysrodkowanie + kursywa + 18 pt (nowe opcje w doc-tools)
  ch = await build('<p>Dyplom dla</p><p>Ani</p>', { align: 'center', italic: true, size: 36 });
  ok('dyplom: akapity wysrodkowane', ch.every(p => p.alignment === 'CENTER'));
  ok('dyplom: kursywa', ch[0].children.every(r => r.italics === true));
  ok('dyplom: rozmiar 18 pt (36 polpunktow)', ch[0].children.every(r => r.size === 36));

  // 3. Podziekowanie: wyjustowane, bez kursywy
  ch = await build('<p>Dziękujemy za pomoc.</p>', { align: 'justify', italic: false, size: 28 });
  ok('podziekowanie: justowanie, bez kursywy', ch[0].alignment === 'JUSTIFIED' && !ch[0].children[0].italics);

  // 4. Domyslnie bez wyrownania - nie psujemy pozostalych narzedzi
  ch = await build('<p>Zwykły akapit.</p>');
  ok('bez opcji: brak narzuconego wyrownania', ch[0].alignment === undefined, ch[0].alignment);

  // 5. Bilety EduMotywatora: dwukolumnowa tabela, komorki z akapitami
  const tickets = '<h1>Karty wyjścia – Ułamki</h1><table>'
    + '<tr><td><p><strong>Bilet #1 · Wiedza</strong></p><p>Co to licznik?</p></td><td><p><strong>Bilet #2 · Refleksja</strong></p><p>Co było trudne?</p></td></tr>'
    + '<tr><td><p><strong>Bilet #3</strong></p><p>Trzy.</p></td><td></td></tr></table><h2>Tajna misja: Operacja O2</h2><p>Zmierz tętno.</p>';
  ch = await build(tickets);
  const table = ch.find(n => n.kind === 'TABLE');
  ok('bilety: powstala tabela', !!table);
  ok('bilety: 2 wiersze', table && table.rows.length === 2, table && table.rows.length);
  ok('bilety: po 2 komorki w wierszu', table && table.rows.every(r => r.children.length === 2));
  const c0 = table.rows[0].children[0];
  ok('bilet: komorka ma akapity, nie zlepek tekstu', c0.children.length >= 2);
  ok('bilet: naglowek biletu pogrubiony', c0.children[0].children.some(r => r.bold));
  ok('bilet: pusta komorka nie wysadza eksportu', table.rows[1].children[1].children.length >= 1);
  ok('misja po tabeli jako naglowek 2', ch.some(n => n.heading === 'H2' && text(n).includes('Operacja O2')));

  // 6. Mikrolekcja z chunking.html: h2/p w divach (div nie jest wspierany -> rozwijany)
  ch = await build('<h1>Tytuł</h1><div class="chunk"><h2>Część 1</h2><p>Treść.</p></div><div class="quiz"><h2>Sprawdź się!</h2><ul><li>pytanie</li></ul></div>');
  ok('div rozwijany, naglowki sekcji zachowane', ch.filter(n => n.heading === 'H2').length === 2);
  ok('tresc w divie nie ginie', ch.some(n => text(n) === 'Treść.'));

  // 7. Sprawdzian: linie do pisania i kazda grupa od nowej strony
  ch = await build('<h1>Sprawdzian – grupa A</h1><p><strong>Zadanie 1. (2 pkt)</strong> Wyjaśnij.</p><p class="linia"></p><p class="linia"></p><div class="page-break"></div><h1>Sprawdzian – grupa B</h1>');
  const lines = ch.filter(n => n.border && n.border.bottom);
  ok('linia do pisania -> akapit z kropkowana dolna krawedzia', lines.length === 2 && lines[0].border.bottom.style === 'dotted', lines.length);
  ok('podzial strony -> akapit z pageBreakBefore', ch.some(n => n.pageBreakBefore === true));
  ok('grupa B po podziale strony jako naglowek 1', ch.filter(n => n.heading === 'H1').length === 2);
  ok('akapit z tekstem i klasa linia nie znika', (await build('<p class="linia">Odp.</p>')).some(n => text(n) === 'Odp.'));
  ch = await build('<p>2<sup>3</sup> i H<sub>2</sub>O</p>');
  ok('indeks gorny -> superScript, dolny -> subScript', ch[0].children.some(r => r.text === '3' && r.superScript === true) && ch[0].children.some(r => r.text === '2' && r.subScript === true));
  ok('zwykly tekst bez indeksow', ch[0].children.filter(r => r.superScript || r.subScript).length === 2);

  console.log('\n[Word] ' + (fail ? fail + ' bledow' : 'OK - eksport .docx daje poprawne naglowki, listy, tabele i wysrodkowany dyplom.'));
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('WYJATEK:', e.message); process.exit(1); });

'use strict';

// Wyszukiwarka przepisów dla EduPrawo (tryb mode:'legal' w api/chat.js).
// Baza: api/_lib/legalCorpus.json – teksty jednolite i późniejsze zmiany kluczowych aktów oświatowych
// pobrane z oficjalnego API Sejmu (scripts/build-legal-corpus.mjs). Model dostaje WYŁĄCZNIE znalezione
// fragmenty i może powoływać się tylko na ich identyfikatory – numery artykułów nie pochodzą z jego pamięci.
// Wyszukiwanie: BM25 na rdzeniach słów (prefiksy 6 i 4 litery – prosta, odporna na polską odmianę),
// słownik pojęć z pokoju nauczycielskiego ("pensum", "nadgodziny"…) i doklejanie zmian do starszego brzmienia.

const corpus = require('./legalCorpus.json');

const STOP = new Set(('oraz albo lub jest są był była było być będzie może mogą moze czy nie tak jak też także który która które których któremu ' +
  'tego tej ten ta te to tym tych przez przy dla pod nad przed po od do na we w z ze za o u a i się sie jego jej ich ma mam mają ' +
  'jeżeli jeśli gdy kiedy oraz który w ramach co ile jaki jaka jakie jakiej czym kto mnie moje mój moja moim musi muszę mogę można ' +
  'czy proszę pytanie chodzi sytuacji sprawie wtedy więc jednak tylko także ust pkt art lit dnia roku poz').split(/\s+/));

const words = (s) => String(s).toLowerCase().normalize('NFC').replace(/[^a-ząćęłńóśźż0-9]+/g, ' ').split(' ')
  .filter(w => w.length >= 3 && !STOP.has(w));
const stem6 = (w) => (w.length > 6 ? w.slice(0, 6) : w);
const stem4 = (w) => (w.length > 4 ? w.slice(0, 4) : w);

// Pojęcia z pokoju nauczycielskiego -> słowa z przepisów (dopisywane do zapytania).
const SYNONYMS = [
  [/urlop\w* (dla )?zdrow|zdrowotn\w* urlop|poratowan/, 'urlop poratowania zdrowia'],
  [/prac\w* domow|zadani\w* domow|zadawa\w* do domu/, 'praca domowa pisemna praca domowa ocenianie bieżące'],
  [/nadgodzin|ponadwymiar/, 'godziny ponadwymiarowe godzin doraźnych zastępstw'],
  [/pensum|ile godzin.*(uczy|pracuj)|wymiar godzin/, 'tygodniowy obowiązkowy wymiar godzin zajęć'],
  [/zachowani/, 'ocena klasyfikacyjna zachowania'],
  [/wycieczk|wyjści\w* (z klasą|grupow)|kierownik wycieczki|opiekun wycieczki/, 'wycieczka kierownik wycieczki opiekun krajoznawstwa turystyki'],
  [/dyżur|przerw/, 'opieka przerwy bezpieczeństwo uczniów'],
  [/dyplomowan|mianowan|początkując|awans/, 'stopień nauczyciela awans zawodowy okres pracy postępowanie kwalifikacyjne egzaminacyjne'],
  [/orzeczeni|poradni|opini\w* o funkcjonowaniu|zespół orzekający/, 'orzeczenie opinia poradnia zespół orzekający funkcjonowaniu'],
  [/\bipet\b/, 'indywidualny program edukacyjno-terapeutyczny'],
  [/wopfu/, 'wielospecjalistyczna ocena poziomu funkcjonowania ucznia'],
  [/poprawk/, 'egzamin poprawkowy'],
  [/nieklasyfik|klasyfikacyjn\w* egzamin|egzamin klasyfikac/, 'egzamin klasyfikacyjny nieklasyfikowany'],
  [/promocj|powtarza\w* klas|drugi rok/, 'promocja klasy programowo wyższej'],
  [/wynagrodz|pensj|płac|dodatek|wysług/, 'wynagrodzenie zasadnicze dodatek wysługę lat'],
  [/urlop\w* wypoczynk|wakacj|ferie/, 'urlop wypoczynkowy ferie'],
  [/ocen\w* pracy/, 'ocena pracy nauczyciela'],
  [/statut/, 'statut szkoły'],
  [/rad\w* pedagogiczn/, 'rada pedagogiczna'],
  [/pomoc\w* psychologiczno|ppp\b|zajęci\w* (korekcyjn|kompensacyjn|rewalidac)/, 'pomoc psychologiczno-pedagogiczna zajęcia'],
  [/dostosow/, 'dostosowanie wymagań edukacyjnych'],
  [/religi|etyk/, 'religia etyka ocena'],
  [/zwolnien\w* z (w-?f|wf|wychowania fizycznego)|wf\b/, 'zwolnienie wychowanie fizyczne'],
  [/wypad/, 'wypadek uczniów'],
  [/dyrektor/, 'dyrektor szkoły']
];

const actsMeta = corpus.acts;

// --- Indeks (budowany raz na ciepłą instancję funkcji) ---
const docs = corpus.units.map(u => {
  const ws = words((u.chapter || '') + ' ' + u.text);
  const tf6 = new Map(); const tf4 = new Map();
  for (const w of ws) {
    const a = stem6(w), b = stem4(w);
    tf6.set(a, (tf6.get(a) || 0) + 1);
    tf4.set(b, (tf4.get(b) || 0) + 1);
  }
  return { u, len: ws.length || 1, tf6, tf4 };
});
const N = docs.length;
const avgLen = docs.reduce((s, d) => s + d.len, 0) / N;
const df = (key) => { const m = new Map(); for (const d of docs) for (const t of d[key].keys()) m.set(t, (m.get(t) || 0) + 1); return m; };
const df6 = df('tf6');
const df4 = df('tf4');

function bm25(doc, terms, tfKey, dfMap) {
  const k1 = 1.2, b = 0.75;
  let s = 0;
  for (const t of terms) {
    const f = doc[tfKey].get(t);
    if (!f) continue;
    const idf = Math.log(1 + (N - dfMap.get(t) + 0.5) / (dfMap.get(t) + 0.5));
    s += idf * (f * (k1 + 1)) / (f + k1 * (1 - b + b * doc.len / avgLen));
  }
  return s;
}

function expandQuery(q) {
  const low = String(q).toLowerCase();
  const extra = SYNONYMS.filter(([re]) => re.test(low)).map(([, add]) => add);
  return low + ' ' + extra.join(' ');
}

// Akt wymieniony w pytaniu ("art. 6 Karty Nauczyciela", "w rozporządzeniu o ocenianiu") – jego jednostki mają pierwszeństwo.
const ACT_NAMES = [
  ['KN', /kart\w* nauczyciela|\bkn\b/],
  ['PO', /prawo oświatowe|prawa oświatowego|prawie oświatowym/],
  ['USO', /systemie oświaty|systemu oświaty/],
  ['OCEN', /rozporządzeni\w* (w sprawie |o )ocenian/],
  ['PPP', /rozporządzeni\w* (w sprawie |o )pomocy psychologiczno/],
  ['KS', /rozporządzeni\w* (w sprawie |o )kształceni\w* specjaln/],
  ['ORZ', /rozporządzeni\w* (w sprawie |o )orzecze/],
  ['AWANS', /rozporządzeni\w* (w sprawie |o )(uzyskiwania stopni|awans)/],
  ['WYC', /rozporządzeni\w* (w sprawie |o )krajoznawstw/],
  ['BHP', /rozporządzeni\w* (w sprawie |o )bezpieczeństw/]
];
const actsIn = (q) => ACT_NAMES.filter(([, re]) => re.test(String(q).toLowerCase())).map(([k]) => k);

// Wprost wskazana jednostka: "art. 73 KN", "§ 12a"
function explicitUnits(q) {
  const out = [];
  const re = /(art\.|§)\s*(\d+[a-z]*)/gi;
  let m;
  while ((m = re.exec(q))) out.push(((m[1].toLowerCase() === 'art.') ? 'art. ' : '§ ') + m[2].toLowerCase());
  return out;
}

// Z długiej jednostki wycinamy ustępy najbliższe pytaniu (zachowując kolejność i początek z numerem).
function excerpt(text, termSet, maxChars) {
  if (text.length <= maxChars) return text;
  const segs = text.split(/ (?=\d{1,2}[a-z]?\. [A-ZĄĆĘŁŃÓŚŹŻ„])/);
  const scored = segs.map((s, i) => ({ s, i, score: words(s).reduce((acc, w) => acc + (termSet.has(stem6(w)) ? 2 : termSet.has(stem4(w)) ? 1 : 0), 0) }));
  const keep = new Set([0]);
  let used = segs[0].length;
  for (const x of [...scored].sort((a, b) => b.score - a.score)) {
    if (x.score === 0 || keep.has(x.i)) continue;
    if (used + x.s.length > maxChars) continue;
    keep.add(x.i); used += x.s.length;
  }
  const idx = [...keep].sort((a, b) => a - b);
  let out = '';
  idx.forEach((i, k) => { out += (k && i !== idx[k - 1] + 1 ? ' […] ' : (k ? ' ' : '')) + segs[i]; });
  if (out.length > maxChars) out = out.slice(0, maxChars) + ' […]';
  return out;
}

const fmtDate = (iso) => { const [y, m, d] = String(iso).split('-'); return d && m && y ? `${Number(d)}.${m}.${y}` : iso; };

function label(u) {
  const a = actsMeta[u.act];
  if (u.kind === 'zmiana') return `zmiana ${a.gen} (${u.source}, obowiązuje od ${fmtDate(u.effective)})${u.targets && u.targets.length ? ' – dotyczy: ' + u.targets.join(', ') : ''}`;
  return `${u.unit} ${a.gen}`;
}

function sourceLine(u) {
  const a = actsMeta[u.act];
  return u.kind === 'zmiana' ? `${a.name} – zmiana ${u.source}` : `${a.name} (${a.source})`;
}

/**
 * Szuka przepisów do pytania.
 * @returns {{ promptBlock: string, sources: Array, corpusDate: string }}
 */
function searchLaw(question, { limit = 8, maxChars = 16000, perUnit = 3200 } = {}) {
  const expanded = expandQuery(question);
  const ws = words(expanded);
  const t6 = [...new Set(ws.map(stem6))];
  const t4 = [...new Set(ws.map(stem4))];
  const termSet = new Set([...t6, ...t4]);
  const wanted = explicitUnits(question);
  const named = actsIn(question);

  const scored = docs.map(d => {
    let s = bm25(d, t6, 'tf6', df6) + 0.5 * bm25(d, t4, 'tf4', df4);
    const inNamedAct = !named.length || named.includes(d.u.act);
    if (wanted.includes(d.u.unit) && inNamedAct) s += 8;
    if (named.length && inNamedAct) s *= 1.5;
    if (d.u.kind === 'zmiana') s *= 1.15; // nowsze brzmienie wygrywa przy podobnym dopasowaniu
    if (/^\(uchylon/.test(d.u.text.replace(/^(Art\.|§)\s*\d+[a-z]*\.\s*/, ''))) s = 0;
    return { d, s };
  }).filter(x => x.s > 0).sort((a, b) => b.s - a.s);

  const best = scored.length ? scored[0].s : 0;
  const chosen = [];
  for (const x of scored) {
    if (chosen.length >= limit || x.s < best * 0.3) break;
    chosen.push(x.d.u);
  }
  // Do jednostki ze starszym brzmieniem doklejamy jej zmiany (od najnowszej daty), żeby model widział aktualny tekst.
  const withAmendments = [];
  const seen = new Set();
  for (const u of chosen) {
    if (seen.has(u.id)) continue;
    withAmendments.push(u); seen.add(u.id);
    if (u.kind !== 'zmiana') {
      corpus.units
        .filter(z => z.kind === 'zmiana' && z.act === u.act && (z.targets || []).includes(u.unit) && !seen.has(z.id))
        .sort((a, b) => String(b.effective).localeCompare(String(a.effective)))
        .forEach(z => { withAmendments.push(z); seen.add(z.id); });
    }
  }

  let used = 0;
  const blocks = [];
  const sources = [];
  for (const u of withAmendments) {
    const room = Math.min(perUnit, maxChars - used);
    if (room < 400) break;
    const text = excerpt(u.text, termSet, room);
    used += text.length;
    blocks.push(`[${u.id}] ${label(u)} – ${sourceLine(u)}${u.chapter ? ' – ' + u.chapter : ''}\n${text}`);
    sources.push({ id: u.id, label: label(u), source: sourceLine(u), amendment: u.kind === 'zmiana', effective: u.effective || '', text: u.text.length > 8000 ? u.text.slice(0, 8000) + ' […]' : u.text });
  }

  const promptBlock = blocks.length ? `PRZEPISY Z BAZY EDUBOX – teksty z Dziennika Ustaw pobrane z oficjalnego API Sejmu (ISAP), stan na ${fmtDate(corpus.builtAt)}:

${blocks.join('\n\n')}

ZASADY KORZYSTANIA Z PRZEPISÓW:
- Odpowiadaj na podstawie powyższych fragmentów. Powołuj się WYŁĄCZNIE na jednostki z nawiasów kwadratowych (np. "art. 73 ust. 8 Karty Nauczyciela"); nie podawaj innych numerów artykułów ani paragrafów z pamięci.
- Fragment oznaczony jako zmiana (z datą "obowiązuje od") ma pierwszeństwo przed starszym brzmieniem tej samej jednostki.
- Jeśli fragmenty nie rozstrzygają pytania, napisz to wprost (np. "W przepisach z bazy EduBox nie ma zapisu, który to rozstrzyga – zwykle reguluje to statut szkoły") i wskaż, gdzie to sprawdzić. Nie zgaduj.
- W polu "cited" zwróć listę identyfikatorów z nawiasów kwadratowych, na których opierasz odpowiedź.` : `PRZEPISY Z BAZY EDUBOX: nie znaleziono przepisów pasujących do pytania. Nie podawaj numerów artykułów ani paragrafów z pamięci; napisz, że w bazie EduBox nie ma przepisu na ten temat, i wskaż, gdzie to sprawdzić (statut szkoły, kuratorium oświaty, ISAP). Pole "cited" zostaw puste.`;

  return { promptBlock, sources, corpusDate: corpus.builtAt };
}

module.exports = { searchLaw, expandQuery, excerpt, words };

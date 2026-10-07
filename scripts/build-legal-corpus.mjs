// Buduje bazę przepisów dla EduPrawo: api/_lib/legalCorpus.json.
//   npm i --no-save pdfjs-dist@4.10.38 && npm run legal:corpus
// Źródło: oficjalne API Sejmu (ELI) – PDF tekstu jednolitego albo aktu pierwotnego + późniejsze zmiany
// (scripts/legal-corpus-sources.json). Teksty dzielimy na jednostki (art. / §) i czyścimy z nagłówków stron,
// przypisów i dzielenia wyrazów. Zmiany (nowelizacje) zapisujemy jako osobne jednostki z datą wejścia w życie
// i listą zmienianych jednostek – wyszukiwarka dokleja je do starszego brzmienia.
// PDF-y trafiają do scripts/.legal-cache/ (poza repozytorium).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CACHE = path.join(__dirname, '.legal-cache');
const OUT = path.join(ROOT, 'api', '_lib', 'legalCorpus.json');
const CONFIG = JSON.parse(fs.readFileSync(path.join(__dirname, 'legal-corpus-sources.json'), 'utf8'));
const API = 'https://api.sejm.gov.pl/eli/acts/';
const onlyExtract = process.argv.includes('--extract-only');

fs.mkdirSync(CACHE, { recursive: true });

async function meta(eli) {
  const r = await fetch(API + eli);
  if (!r.ok) throw new Error(`API Sejmu: ${eli} HTTP ${r.status}`);
  return r.json();
}

async function pdfText(eli) {
  const file = path.join(CACHE, eli.replace(/\//g, '_') + '.txt');
  if (fs.existsSync(file)) return fs.readFileSync(file, 'utf8');
  const r = await fetch(API + eli + '/text.pdf');
  if (!r.ok) throw new Error(`PDF ${eli} HTTP ${r.status}`);
  const data = new Uint8Array(await r.arrayBuffer());
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const doc = await getDocument({ data, useSystemFonts: true }).promise;
  let out = '';
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const tc = await page.getTextContent();
    let line = '', lastY = null;
    for (const it of tc.items) {
      const y = it.transform[5];
      if (lastY !== null && Math.abs(y - lastY) > 2) { out += line.trimEnd() + '\n'; line = ''; }
      line += it.str; lastY = y;
    }
    out += line + '\n\n=== [strona ' + i + '] ===\n\n';
  }
  fs.writeFileSync(file, out);
  return out;
}

// --- Czyszczenie tekstu z PDF ---
const FOOTNOTE_START = /^(Ze zmian|W brzmieniu ustalonym|Dodan[ya]? przez|Uchylon[ya]? przez|Zdanie .{0,40}(uchylone|dodane)|Utracił moc|Uznan[ya] za|Zmiany wymienionej ustawy|Zmiany tekstu jednolitego|Niniejsze rozporządzenie było poprzedzone|Niniejsze rozporządzenie zostało poprzedzone|Minister Edukacji kieruje|Minister Edukacji Narodowej kieruje|Rozporządzenie było poprzedzone)/;

export function cleanPdfText(raw) {
  const pages = raw.split(/\n=== \[strona \d+\] ===\n/);
  const cleaned = pages.map(p => {
    const lines = p.split('\n');
    const keep = [];
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i].trim();
      if (/^Dziennik Ustaw\s+–\s+\d+\s+–\s+Poz\.\s*\d+/.test(l)) continue;
      // Przypis na dole strony: samodzielna linia "70)" i dalej treść przypisu – wycinamy do końca strony.
      if (/^\d{1,3}\)$/.test(l) && i + 1 < lines.length && FOOTNOTE_START.test(lines[i + 1].trim())) break;
      if (/^\d{1,3}\)$/.test(l)) continue; // znacznik przypisu w tekście
      keep.push(lines[i]);
    }
    return keep.join('\n');
  }).join('\n');
  return cleaned
    // dzielenie wyrazów na końcu linii; łącznik zostaje tylko w złożeniach przymiotnikowych typu
    // "psychologiczno-pedagogiczna", "szkolno-wychowawczych" (nie w "ponadwymiaro-wych", "wycho-wawczych")
    .replace(/([A-Za-zÀ-ž]+)-\n(\p{Ll})/gu, (m, left, right) =>
      (left.length >= 7 && /(czn|yjn|ck|sk|ńcz|ln|rn|zn|tn|dn|ow)o$/.test(left) ? left + '-' : left) + right)
    .replace(/[ \t]+\n/g, '\n');
}

// --- Podział na jednostki ---
const UNIT_RE = { ustawa: /^Art\.\s*(\d+[a-z]*)\.\s*/, 'rozporządzenie': /^§\s*(\d+[a-z]*)\.\s*/ };

export function splitUnits(text, kind, { skipUntil } = {}) {
  let lines = text.split('\n');
  if (skipUntil) {
    const idx = lines.findIndex(l => skipUntil.test(l));
    if (idx >= 0) lines = lines.slice(idx + 1);
  }
  const re = UNIT_RE[kind];
  const units = [];
  let cur = null;
  let chapter = '';
  let pendingChapter = false;
  let quoteDepth = 0; // wewnątrz cytatu „…” (nowe brzmienie w nowelizacji) nie zaczynamy nowej jednostki
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (!l) continue;
    const inQuote = quoteDepth > 0;
    quoteDepth = Math.max(0, quoteDepth + (l.match(/„/g) || []).length - (l.match(/”/g) || []).length);
    if (inQuote) { if (cur) cur.text += '\n' + l; continue; }
    // Koniec części normatywnej: załączniki do rozporządzenia
    if (kind === 'rozporządzenie' && units.length && /^Załącznik(i)?( nr \d+)? do rozporządzenia/i.test(l)) break;
    if (/^(Rozdział|DZIAŁ|Dział)\s+[0-9IVXLC]+[a-z]?$/i.test(l)) { chapter = l; pendingChapter = true; continue; }
    if (pendingChapter && !re.test(l)) { chapter += ' – ' + l; pendingChapter = false; continue; }
    pendingChapter = false;
    const m = l.match(re);
    if (m) {
      cur = { unit: (kind === 'ustawa' ? 'art. ' : '§ ') + m[1], chapter, text: l };
      units.push(cur);
    } else if (cur) {
      cur.text += '\n' + l;
    }
  }
  return units.map(u => ({ ...u, text: u.text.replace(/\s*\n\s*/g, ' ').replace(/\s{2,}/g, ' ').trim() }));
}

// --- Zmiany: punkty "N) w § X ..." z części zmieniającej, z podziałem odpornym na cytaty „…” ---
export function splitAmendmentItems(unitText) {
  const start = unitText.search(/wprowadza się następujące zmiany:/);
  if (start < 0) return [{ head: unitText.split('„')[0], text: unitText }];
  const body = unitText.slice(start + 'wprowadza się następujące zmiany:'.length);
  const items = [];
  let depth = 0, buf = '';
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch === '„') depth++;
    if (ch === '”' && depth > 0) depth--;
    // początek kolejnego punktu: " 12) w ..." poza cytatem
    if (depth === 0 && /\s/.test(ch) && /^\s\d{1,3}\)\s/.test(body.slice(i, i + 6)) && buf.trim()) {
      items.push(buf.trim()); buf = '';
    }
    buf += ch;
  }
  if (buf.trim()) items.push(buf.trim());
  return items.map(t => ({ head: t.split('„')[0], text: t }));
}

export function targetsOf(head, kind) {
  // Bez numeru jednostki samej nowelizacji ("Art. 1." / "§ 1.") i bez cytowania aktu zmienianego
  // ("W rozporządzeniu … (Dz. U. …)") – zostaje tylko to, co jest zmieniane.
  let h = String(head).replace(/^(Art\.|§)\s*\d+[a-z]*\.\s*/, '');
  if (/^W (rozporządzeniu|ustawie)/.test(h)) { const k = h.indexOf(')'); if (k > 0) h = h.slice(k + 1); }
  head = h;
  const re = kind === 'ustawa' ? /art\.\s*(\d+[a-z]*)/gi : /§\s*(\d+[a-z]*)/g;
  const out = new Set();
  let m;
  while ((m = re.exec(head))) out.add((kind === 'ustawa' ? 'art. ' : '§ ') + m[1].toLowerCase());
  return [...out];
}

const poz = (eli) => { const [, y, p] = eli.split('/'); return `Dz.U. ${y} poz. ${p}`; };

async function build() {
  const acts = {};
  const units = [];
  for (const s of CONFIG.sources) {
    const tMeta = await meta(s.text);
    const raw = await pdfText(s.text);
    if (onlyExtract) { console.log(s.key, s.text, raw.length, 'znaków'); continue; }
    const isConsolidated = s.text !== s.base;
    const clean = cleanPdfText(raw);
    const parts = splitUnits(clean, s.kind, isConsolidated ? { skipUntil: /^Załącznik do obwieszczenia/i } : {});
    acts[s.key] = { name: s.name, short: s.short, gen: s.gen, base: s.base, text: s.text, source: (isConsolidated ? 'tekst jednolity ' : '') + poz(s.text), title: tMeta.title, units: parts.length };
    for (const p of parts) units.push({ id: `${s.key} ${p.unit}`, act: s.key, unit: p.unit, chapter: p.chapter, text: p.text });
    for (const am of s.amendments || []) {
      const aMeta = await meta(am);
      const aRaw = await pdfText(am);
      const aUnits = splitUnits(cleanPdfText(aRaw), aMeta.type === 'Ustawa' ? 'ustawa' : 'rozporządzenie');
      // Jednostka zmieniająca TEN akt (ustawa zmieniająca kilka ustaw ma po jednym artykule na akt).
      const marker = { KN: /Karta Nauczyciela/, PO: /Prawo oświatowe/, USO: /o systemie oświaty/, OCEN: /w sprawie oceniania/, BHP: /w sprawie bezpieczeństwa i higieny/ }[s.key];
      const changing = aUnits.find(u => /wprowadza się następujące zmiany|otrzymuje brzmienie|dodaje się/.test(u.text) && (!marker || marker.test(u.text.slice(0, 400))));
      if (!changing) { console.warn(`Uwaga: brak części zmieniającej ${s.key} w ${am}`); continue; }
      const items = splitAmendmentItems(changing.text);
      items.forEach((it, i) => units.push({
        id: `${s.key} zmiana ${poz(am)} pkt ${i + 1}`,
        act: s.key, kind: 'zmiana', eli: am, source: poz(am), effective: aMeta.entryIntoForce || '',
        targets: targetsOf(it.head, s.kind), text: it.text
      }));
      acts[s.key].amendments = [...(acts[s.key].amendments || []), { eli: am, source: poz(am), title: aMeta.title, effective: aMeta.entryIntoForce, items: items.length }];
    }
    console.log(`${s.key}: ${parts.length} jednostek` + (s.amendments ? `, zmiany: ${(acts[s.key].amendments || []).map(a => a.source + ' (' + a.items + ' pkt)').join(', ')}` : ''));
  }
  if (onlyExtract) return;
  const corpus = { builtAt: new Date().toISOString().slice(0, 10), acts, units };
  fs.writeFileSync(OUT, JSON.stringify(corpus));
  console.log(`Zapisano ${path.relative(ROOT, OUT)}: ${units.length} jednostek, ${Math.round(fs.statSync(OUT).size / 1024)} KB`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  build().catch(e => { console.error(e); process.exit(1); });
}

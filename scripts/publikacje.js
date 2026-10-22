#!/usr/bin/env node
// Automatyczne wpisy na blogu i w „Co nowego” (od 22.10.2026).
//
//   node scripts/publikacje.js blog        – wpis bloga z env PAYLOAD (JSON od Make, po kliknięciu „Publikuj”)
//   node scripts/publikacje.js co-nowego   – wpisy „Co nowego” z env PAYLOAD ({ entries: [...] }, też po akceptacji)
//   node scripts/publikacje.js auto        – bez AI: nowe pakiety z Bazy Materiałów i nowe kafelki z apps.js
//
// AI (Make) dostarcza TYLKO dane. Kod tutaj sam buduje wpis, czyści HTML, pilnuje linków i odrzuca
// numery przepisów – zły wpis kończy się błędem akcji (mail z GitHuba), a blog dalej działa.
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const BLOG_FILE = path.join(ROOT, 'blog-posts.js');
const ZMIANY_FILE = path.join(ROOT, 'zmiany.js');
const STAN_FILE = path.join(ROOT, 'data', 'co-nowego-stan.json');
const FIRESTORE_KATALOG = 'https://firestore.googleapis.com/v1/projects/edubox-pro/databases/(default)/documents/artifacts/eduboxpro/public/data/materialy_katalog';

const BLOG_CATEGORIES = ['Poradnik', 'Pedagogika specjalna', 'Współpraca z rodzicami', 'Inspiracje', 'Edukacja i Technologia', 'Organizacja pracy'];
const BLOG_ICONS = {
  'ph-compass': 'text-teal-500',
  'ph-shield-check': 'text-rose-500',
  'ph-briefcase': 'text-blue-500',
  'ph-lightbulb': 'text-amber-500',
  'ph-sparkle': 'text-emerald-500',
  'ph-heart': 'text-pink-500',
  'ph-books': 'text-purple-500',
  'ph-chalkboard-teacher': 'text-indigo-500',
};
const TAGS = ['Nowość', 'Ulepszenie', 'Poprawka'];
const SEKCJE = { przedszkole: 'przedszkole', 'klasy-1-3': 'klasy 1–3', 'klasy-4-8': 'klasy 4–8', inne: 'inne' };
const LINK_CLASS = 'text-blue-600 dark:text-blue-400 font-bold hover:underline';
// Numery przepisów piszemy tylko ręcznie, po sprawdzeniu w ISAP (CLAUDE.md) – automat ich nie przepuszcza.
const LEGAL_REF = /(\bart\.\s*\d)|(§\s*\d)|(\bDz\.\s*U\b)|(\bust\.\s*\d)|(\bpoz\.\s*\d)/i;

function fail(msg) { const e = new Error(msg); e.userFacing = true; throw e; }

// ---------- pomocnicze ----------
function loadWindowValue(file, name) {
  const ctx = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js-literal.js'), 'utf8'), ctx);
  return ctx.window.EduJsLiteral.readWindowValue(fs.readFileSync(file, 'utf8'), name);
}

function slugify(text) {
  const map = { ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z' };
  return String(text || '').toLowerCase()
    .replace(/[ąćęłńóśźż]/g, (c) => map[c])
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .slice(0, 70).replace(/-+$/, '');
}

function plainText(s) {
  return String(s == null ? '' : s)
    .replace(/<[^>]*>/g, ' ')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[\u0000-\u0008\u000b-\u001f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function today() { return new Date().toISOString().slice(0, 10); }

function loadApps() {
  const ctx = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'apps.js'), 'utf8'), ctx);
  return (ctx.window.EduBoxData && ctx.window.EduBoxData.APPS) || [];
}

// Strony, do których wolno linkować z wpisu: istniejące pliki .html z publicPages (bez stron prywatnych).
function allowedPages() {
  const cfg = require(path.join(ROOT, 'seo.config.js'));
  const pages = new Set();
  (cfg.publicPages || []).forEach((p) => { const f = typeof p === 'string' ? p : p.path; if (f) pages.add(String(f).replace(/^\//, '')); });
  return new Set([...pages].filter((f) => fs.existsSync(path.join(ROOT, f))));
}

function safeLink(href, pages) {
  const h = String(href || '').trim().replace(/^https:\/\/eduboxpro\.pl\//, '').replace(/^\//, '');
  const m = h.match(/^([a-z0-9-]+\.html)(\?[a-z0-9=&%._-]*)?$/i);
  if (!m || !pages.has(m[1])) return null;
  return m[1] + (m[2] || '');
}

// ---------- HTML wpisu ----------
const ALLOWED_TAGS = new Set(['p', 'h2', 'h3', 'ul', 'ol', 'li', 'strong', 'em', 'b', 'i', 'br', 'a']);

function sanitizeContent(html, pages) {
  let s = String(html || '');
  s = s.replace(/<(script|style|iframe|object|embed|svg|math|template|noscript)[\s\S]*?<\/\1\s*>/gi, '');
  s = s.replace(/<!--[\s\S]*?-->/g, '');
  const stack = [];
  s = s.replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (tag, nameRaw, attrs) => {
    const name = nameRaw.toLowerCase();
    const closing = tag.startsWith('</');
    if (!ALLOWED_TAGS.has(name)) return '';
    if (name === 'br') return closing ? '' : '<br>';
    if (closing) {
      let idx = -1;
      for (let k = stack.length - 1; k >= 0; k -= 1) {
        if (name === 'a' ? stack[k].startsWith('a-') : stack[k] === name) { idx = k; break; }
      }
      if (idx < 0) return '';
      const toClose = stack.splice(idx).reverse();
      return toClose.map((t) => (t === 'a-skip' ? '' : `</${t === 'a-ok' ? 'a' : t}>`)).join('');
    }
    if (name === 'a') {
      const hm = attrs.match(/href\s*=\s*("([^"]*)"|'([^']*)')/i);
      const link = hm ? safeLink(hm[2] != null ? hm[2] : hm[3], pages) : null;
      if (!link) { stack.push('a-skip'); return ''; }
      stack.push('a-ok');
      return `<a href="${link}" class="${LINK_CLASS}">`;
    }
    stack.push(name);
    return `<${name}>`;
  });
  s += stack.reverse().map((t) => (t === 'a-skip' ? '' : `</${t === 'a-ok' ? 'a' : t}>`)).join('');
  s = s.replace(/<(p|h2|h3|li|strong|em|b|i)>\s*<\/\1>/g, '').replace(/\s+/g, ' ').trim();
  return s;
}

function wordCount(html) { return plainText(html).split(/\s+/).filter(Boolean).length; }

// ---------- blog ----------
function buildBlogPost(raw, opts) {
  const o = typeof raw === 'string' ? JSON.parse(raw) : (raw || {});
  const pages = opts.pages;
  const existing = new Set(opts.existingSlugs || []);
  const title = plainText(o.title).slice(0, 120);
  const excerpt = plainText(o.excerpt);
  if (title.length < 15) fail('Tytuł wpisu jest pusty albo za krótki.');
  if (excerpt.length < 40 || excerpt.length > 220) fail(`Zajawka musi mieć 40–220 znaków (ma ${excerpt.length}).`);
  const category = BLOG_CATEGORIES.includes(o.category) ? o.category : 'Poradnik';
  const icon = BLOG_ICONS[o.icon] ? o.icon : 'ph-lightbulb';
  const content = sanitizeContent(o.content, pages);
  const words = wordCount(content);
  if (words < 350 || words > 1600) fail(`Treść musi mieć 350–1600 słów (ma ${words}).`);
  if (!/<h2>/.test(content)) fail('Treść nie ma żadnego śródtytułu <h2>.');
  const all = `${title} ${excerpt} ${plainText(content)}`;
  const legal = all.match(LEGAL_REF);
  if (legal) fail(`Wpis cytuje przepis („${legal[0]}”) – takie wpisy piszemy ręcznie po sprawdzeniu w ISAP.`);
  let slug = slugify(o.slug || title);
  if (!slug) fail('Nie da się zrobić adresu wpisu z tytułu.');
  if (existing.has(slug)) { let n = 2; while (existing.has(`${slug}-${n}`)) n += 1; slug = `${slug}-${n}`; }
  return {
    slug, title, excerpt,
    date: opts.date || today(),
    category,
    readTime: `${Math.max(2, Math.round(words / 200))} min`,
    icon, color: BLOG_ICONS[icon], content,
  };
}

function serializeBlogPost(p) {
  return '  {\n' +
    `    slug: ${JSON.stringify(p.slug)},\n` +
    `    title: ${JSON.stringify(p.title)},\n` +
    `    excerpt: ${JSON.stringify(p.excerpt)},\n` +
    `    date: ${JSON.stringify(p.date)},\n` +
    `    category: ${JSON.stringify(p.category)},\n` +
    `    readTime: ${JSON.stringify(p.readTime)},\n` +
    `    icon: ${JSON.stringify(p.icon)},\n` +
    `    color: ${JSON.stringify(p.color)},\n` +
    `    content: ${JSON.stringify(p.content)}\n` +
    '  }';
}

function insertBlogPost(fileText, post) {
  const marker = 'window.BLOG_POSTS = [';
  if (!fileText.includes(marker)) fail('Nie znaleziono „window.BLOG_POSTS = [” w blog-posts.js.');
  return fileText.replace(marker, `${marker}\n${serializeBlogPost(post)},`);
}

// ---------- co nowego ----------
function buildEntries(list, opts) {
  const pages = opts.pages;
  const date = opts.date || today();
  const used = new Set(opts.existingIds || []);
  return (list || []).slice(0, 5).map((e) => {
    const title = plainText(e.title).slice(0, 100);
    const description = plainText(e.description).slice(0, 420);
    if (title.length < 5 || description.length < 15) fail('Wpis „Co nowego” bez tytułu albo opisu.');
    const legal = `${title} ${description}`.match(LEGAL_REF);
    if (legal) fail(`Wpis „Co nowego” cytuje przepis („${legal[0]}”).`);
    let id = `${date}-${slugify(title)}`.slice(0, 80);
    if (used.has(id)) { let n = 2; while (used.has(`${id}-${n}`)) n += 1; id = `${id}-${n}`; }
    used.add(id);
    const entry = { id, date, tag: TAGS.includes(e.tag) ? e.tag : 'Ulepszenie', title, description };
    const link = e.link ? safeLink(e.link, pages) : null;
    if (link) entry.link = link;
    return entry;
  });
}

function serializeZmiany(data) {
  return '// Plik danych "Co nowego" - historia zmian w EduBox AI.\n' +
    '// Zarządzany przez Redaktor Ogłoszeń (sekcja "Co nowego") - nie edytuj ręcznie bez potrzeby.\n' +
    '// Najnowsze wpisy na początku tablicy.\n' +
    'window.CO_NOWEGO = ' + JSON.stringify(data, null, 4) + ';\n';
}

// ---------- automat: materiały i narzędzia ----------
function fromFirestore(v) {
  if (!v || typeof v !== 'object') return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('timestampValue' in v) return v.timestampValue;
  if ('booleanValue' in v) return v.booleanValue;
  return null;
}

function listQuote(names) {
  const q = names.map((n) => `„${n}”`);
  return q.length < 2 ? q.join('') : `${q.slice(0, -1).join(', ')} i ${q[q.length - 1]}`;
}

// pakiety: [{id,title,sekcja,createdAt}], tools: apps.js; stan: {materialy:[ids], narzedzia:[urls]}
function autoEntries({ pakiety, tools, stan, now }) {
  const known = new Set(stan.materialy || []);
  const knownTools = new Set(stan.narzedzia || []);
  const cutoff = (now || Date.now()) - 2 * 3600 * 1000; // pakiet musi „odleżeć” 2 h – ktoś może go jeszcze poprawiać
  const fresh = pakiety.filter((p) => !known.has(p.id) && p.title && Date.parse(p.createdAt || 0) < cutoff);
  const entries = [];
  if (fresh.length) {
    const bySekcja = {};
    fresh.forEach((p) => { (bySekcja[p.sekcja] = bySekcja[p.sekcja] || []).push(p.title); });
    const parts = Object.keys(bySekcja).map((s) => `${listQuote([...new Set(bySekcja[s])])}${SEKCJE[s] && s !== 'inne' ? ` (${SEKCJE[s]})` : ''}`);
    const titles = [...new Set(fresh.map((p) => p.title))];
    entries.push({
      tag: 'Nowość',
      title: fresh.length === 1 ? 'Nowy pakiet do pobrania' : 'Nowe materiały do pobrania',
      description: `W Bazie Materiałów ${fresh.length === 1 ? 'jest nowy pakiet' : 'są nowe pakiety'}: ${parts.join('; ')}. Podgląd stron jest dla wszystkich, pobieranie z kodem PRO.`,
      link: fresh.length === 1 ? `materialy.html?sekcja=${encodeURIComponent(SEKCJE[fresh[0].sekcja] ? fresh[0].sekcja : 'inne')}&pakiet=${encodeURIComponent(fresh[0].id)}` : (titles.length === 1 ? `materialy.html?szukaj=${encodeURIComponent(titles[0])}` : 'materialy.html'),
    });
  }
  const newTools = tools.filter((a) => a && a.url && !/^https?:/.test(a.url) && !knownTools.has(a.url));
  newTools.slice(0, 3).forEach((a) => {
    entries.push({ tag: 'Nowość', title: `Nowe narzędzie: ${a.title}`, description: plainText(a.desc) || `W katalogu EduBox AI pojawiło się ${a.title}.`, link: a.url });
  });
  return {
    entries,
    stan: {
      materialy: [...new Set([...(stan.materialy || []), ...fresh.map((p) => p.id)])].sort(),
      narzedzia: [...new Set([...(stan.narzedzia || []), ...newTools.map((a) => a.url)])].sort(),
    },
  };
}

async function fetchPakiety() {
  const out = [];
  let token = '';
  for (let page = 0; page < 20; page += 1) {
    const url = `${FIRESTORE_KATALOG}?pageSize=300${token ? `&pageToken=${encodeURIComponent(token)}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) fail(`Firestore: HTTP ${res.status}`);
    const json = await res.json();
    (json.documents || []).forEach((d) => {
      const f = d.fields || {};
      out.push({
        id: d.name.split('/').pop(),
        title: plainText(fromFirestore(f.title)),
        sekcja: fromFirestore(f.sekcja) || 'inne',
        createdAt: fromFirestore(f.createdAt) || d.createTime,
      });
    });
    if (!json.nextPageToken) break;
    token = json.nextPageToken;
  }
  return out;
}

// Pierwsze uruchomienie: wszystko, co już było ogłoszone (do 16.10.2026 włącznie), traktujemy jako znane.
const INIT_CUTOFF = '2026-10-17T00:00:00Z';

// ---------- CLI ----------
function writeZmianyWith(newEntries) {
  const data = loadWindowValue(ZMIANY_FILE, 'CO_NOWEGO') || [];
  const pages = allowedPages();
  const entries = buildEntries(newEntries, { pages, existingIds: data.map((e) => e.id) });
  if (!entries.length) return [];
  fs.writeFileSync(ZMIANY_FILE, serializeZmiany([...entries, ...data]), 'utf8');
  return entries;
}

function readPayload() {
  const raw = process.env.PAYLOAD;
  if (!raw) fail('Brak PAYLOAD.');
  let v = JSON.parse(raw);
  if (typeof v === 'string') v = JSON.parse(v); // Make może wysłać obiekt jako napis
  return v;
}

async function main() {
  const cmd = process.argv[2];
  if (cmd === 'blog') {
    const posts = loadWindowValue(BLOG_FILE, 'BLOG_POSTS') || [];
    const post = buildBlogPost(readPayload(), { pages: allowedPages(), existingSlugs: posts.map((p) => p.slug) });
    fs.writeFileSync(BLOG_FILE, insertBlogPost(fs.readFileSync(BLOG_FILE, 'utf8'), post), 'utf8');
    const check = loadWindowValue(BLOG_FILE, 'BLOG_POSTS');
    if (!check || check[0].slug !== post.slug) fail('Po zapisie blog-posts.js nie czyta się poprawnie.');
    console.log(`Dodano wpis: ${post.title} (${post.slug}, ${wordCount(post.content)} słów)`);
  } else if (cmd === 'co-nowego') {
    const p = readPayload();
    const added = writeZmianyWith(Array.isArray(p) ? p : p.entries);
    console.log(`Dodano wpisów: ${added.length}`);
  } else if (cmd === 'auto') {
    const pakiety = await fetchPakiety();
    const tools = loadApps();
    let stan;
    if (fs.existsSync(STAN_FILE)) stan = JSON.parse(fs.readFileSync(STAN_FILE, 'utf8'));
    else {
      stan = {
        materialy: pakiety.filter((p) => Date.parse(p.createdAt || 0) < Date.parse(INIT_CUTOFF)).map((p) => p.id),
        narzedzia: tools.map((a) => a.url).filter(Boolean),
      };
    }
    const { entries, stan: nowy } = autoEntries({ pakiety, tools, stan });
    const added = entries.length ? writeZmianyWith(entries) : [];
    fs.mkdirSync(path.dirname(STAN_FILE), { recursive: true });
    fs.writeFileSync(STAN_FILE, JSON.stringify(nowy, null, 2) + '\n', 'utf8');
    console.log(added.length ? added.map((e) => `+ ${e.title}: ${e.description}`).join('\n') : 'Brak nowych pakietów i narzędzi.');
  } else {
    console.error('Użycie: node scripts/publikacje.js blog|co-nowego|auto');
    process.exit(2);
  }
}

if (require.main === module) {
  main().catch((e) => { console.error(`BŁĄD: ${e.message}`); process.exit(1); });
}

module.exports = { slugify, plainText, sanitizeContent, buildBlogPost, insertBlogPost, buildEntries, autoEntries, safeLink, serializeZmiany, LEGAL_REF, BLOG_CATEGORIES };

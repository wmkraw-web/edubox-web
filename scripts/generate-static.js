'use strict';

// Statyczna treść w <div id="root"> stron renderowanych przez Reacta.
//
// Po co: strony narzędzi, strona główna i blog budują się dopiero w przeglądarce (React + Babel).
// Google wykonuje JavaScript, ale Bing, podglądy linków i roboty czatów AI (ChatGPT, Perplexity, Claude)
// – nie. Widziały pustą stronę bez nagłówka, opisu i linków. Ten skrypt wstawia do #root zwykły HTML:
// nagłówek, opis i linki do powiązanych stron. React przy starcie podmienia zawartość #root, więc
// użytkownik widzi tę treść tylko przez chwilę ładowania (zamiast białej strony).
//
// Źródła: apps.js (katalog), blog-posts.js, seo.config.js (które strony są publiczne) i znaczniki
// <title>/<meta description> samej strony. Niczego nie wpisujemy ręcznie w HTML.
//
//   node scripts/generate-static.js          – zapisuje zmiany
//   node scripts/generate-static.js --check  – tylko sprawdza, czy pliki są aktualne (npm test)

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const config = require('../seo.config');

const ROOT = path.resolve(__dirname, '..');
const CHECK = process.argv.includes('--check');
const START = '<!-- EDUBOX-STATIC:START – generowane przez scripts/generate-static.js, nie edytuj ręcznie -->';
const END = '<!-- EDUBOX-STATIC:END -->';

const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const exists = (f) => fs.existsSync(path.join(ROOT, f));
const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const unesc = (s) => String(s || '')
  .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const stripTags = (s) => unesc(String(s || '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

function loadWindow(file) {
  const sandbox = { window: {} };
  vm.runInNewContext(read(file), sandbox, { filename: file });
  return sandbox.window;
}

const data = loadWindow('apps.js').EduBoxData || {};
const APPS = data.APPS || [];
const POSTS = exists('blog-posts.js') ? (loadWindow('blog-posts.js').BLOG_POSTS || []) : [];

const publicPaths = new Set(config.publicPages.map((p) => p.path));
const basePath = (url) => String(url || '').split(/[?#]/)[0];
const isLocalPublic = (url) => !/^https?:/i.test(url) && publicPaths.has(basePath(url));

const CATEGORIES = [
  ['zajecia', 'Lekcje i zajęcia', 'centrum-lekcje.html'],
  ['biurokracja', 'Dokumenty i biurokracja szkolna', 'centrum-dokumenty.html'],
  ['terapia', 'Terapia, AAC i wsparcie SPE', 'centrum-spe.html'],
  ['grafika', 'Grafika, dyplomy i dekoracje', 'centrum-grafika.html']
];

// Strony z gotowymi przykładami, które pasują do konkretnego narzędzia.
const WZORY_FOR = {
  'eduocena.html': ['ocena-opisowa-przyklady.html', 'ocena-opisowa-srodroczna-klasa-1-przyklady.html',
    'ocena-opisowa-srodroczna-klasa-2-przyklady.html', 'ocena-opisowa-srodroczna-klasa-3-przyklady.html',
    'ocena-zachowania-przyklady.html'],
  'eduwpisy.html': ['wpisy-do-dziennika-przyklady.html', 'wpisy-do-dziennika-przedszkole-przyklady.html'],
  'edudialog.html': ['wiadomosc-do-rodzica-przyklady.html', 'opinia-o-uczniu-do-poradni-przyklady.html',
    'opinia-wychowawcy-o-uczniu-przyklady.html', 'opinia-nauczyciela-przedmiotu-o-uczniu-przyklady.html',
    'opinia-o-uczniu-zdolnym-przyklady.html'],
  'asystent-pedagoga.html': ['opinia-o-dziecku-przedszkolnym-do-poradni-przyklady.html',
    'opinia-o-uczniu-do-poradni-przyklady.html'],
  'edubiurokrata.html': ['opinia-o-uczniu-do-poradni-przyklady.html'],
  'edusprawozdania.html': ['sprawozdanie-wychowawcy-przyklady.html'],
  'zanimklikniesz.html': ['oszustwo-doplata-do-paczki.html', 'oszustwo-telefon-z-banku.html', 'oszustwo-kup-z-olx.html',
    'oszustwo-blik-messenger.html', 'jak-sprawdzic-sklep-internetowy.html', 'falszywe-inwestycje-reklamy.html']
};

const headCache = new Map();
function head(file) {
  if (!headCache.has(file)) {
    const html = read(file);
    const title = unesc((html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || '').trim();
    const desc = unesc((html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i) || [])[1] || '').trim();
    const h1 = stripTags((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || '');
    headCache.set(file, { title, desc, h1 });
  }
  return headCache.get(file);
}
const shortTitle = (file) => head(file).title.replace(/\s*[|–-]\s*EduBox(\s*AI)?\s*$/i, '').trim();

const WRAP = 'max-width:760px;margin:0 auto;padding:96px 20px 48px;line-height:1.65;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif';
const A = 'color:inherit;text-decoration:underline';
const link = (url, text) => `<a href="${esc(url)}" style="${A}">${esc(text)}</a>`;
const list = (items) => items.length ? `<ul style="padding-left:20px;margin:8px 0 20px">\n${items.map((i) => `  <li>${i}</li>`).join('\n')}\n</ul>` : '';
const h2 = (t) => `<h2 style="font-size:1.15rem;font-weight:700;margin:24px 0 4px">${esc(t)}</h2>`;
const h1 = (t) => `<h1 style="font-size:1.7rem;font-weight:800;line-height:1.25;margin:0 0 12px">${esc(t)}</h1>`;
const p = (html) => `<p style="margin:0 0 12px">${html}</p>`;
const appLine = (a) => `${link(a.url, a.title)} – ${esc(a.desc)}`;
const wzorLine = (f) => link(f, head(f).h1 || shortTitle(f));
const NOSCRIPT = '<noscript><p style="margin:16px 0;font-weight:700">To narzędzie działa w przeglądarce i wymaga włączonej obsługi JavaScript.</p></noscript>';

function appFor(file) {
  const same = APPS.filter((a) => basePath(a.url) === file);
  return same.find((a) => a.url === file) || same[0] || null;
}

function toolBlock(file, app) {
  const meta = head(file);
  const cat = CATEGORIES.find((c) => c[0] === app.category);
  const variants = APPS.filter((a) => basePath(a.url) === file && a !== app);
  const related = APPS.filter((a) => a.category === app.category && basePath(a.url) !== file && isLocalPublic(a.url))
    .filter((a, i, arr) => arr.findIndex((b) => basePath(b.url) === basePath(a.url)) === i)
    .slice(0, 6);
  const wzory = (WZORY_FOR[file] || []).filter((f) => publicPaths.has(f) && exists(f));
  const free = app.freeForever
    ? 'Zawsze za darmo, bez limitów i bez rejestracji.'
    : 'Za darmo i bez rejestracji: 5 generowań tekstu dziennie we wszystkich narzędziach EduBox.';
  const out = [h1(app.title), p(esc(app.desc))];
  const norm = (t) => String(t || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  if (meta.desc && !norm(meta.desc).startsWith(norm(app.desc).slice(0, 30))) out.push(p(esc(meta.desc)));
  out.push(p(esc(free)));
  out.push(p('<em>Ładuję narzędzie…</em>'));
  out.push(NOSCRIPT);
  if (variants.length) { out.push(h2('W tym narzędziu także')); out.push(list(variants.map(appLine))); }
  if (wzory.length) { out.push(h2('Gotowe przykłady do skopiowania')); out.push(list(wzory.map(wzorLine))); }
  if (related.length) { out.push(h2(cat ? `Podobne narzędzia: ${cat[1]}` : 'Podobne narzędzia')); out.push(list(related.map(appLine))); }
  const nav = [link('/', 'Wszystkie narzędzia EduBox AI')];
  if (cat && publicPaths.has(cat[2])) nav.push(link(cat[2], cat[1]));
  out.push(p(nav.join(' · ')));
  return out;
}

function indexBlock(file) {
  const meta = head(file);
  const out = [h1('EduBox AI – darmowe narzędzia AI dla nauczycieli'), p(esc(meta.desc)),
    p('Bez rejestracji i bez konta. 5 darmowych generowań tekstu dziennie; narzędzia, które nie korzystają z AI, są bez limitów.'),
    NOSCRIPT];
  for (const [key, label, center] of CATEGORIES) {
    const apps = APPS.filter((a) => a.category === key && isLocalPublic(a.url));
    if (!apps.length) continue;
    out.push(h2(label));
    out.push(list(apps.map(appLine)));
    if (publicPaths.has(center)) out.push(p(link(center, `Zobacz wszystkie: ${label} →`)));
  }
  const wzory = config.publicPages.map((x) => x.path).filter((f) => /-przyklady\.html$/.test(f) && exists(f));
  if (wzory.length) { out.push(h2('Wzory i przykłady do skopiowania')); out.push(list(wzory.map(wzorLine))); }
  const poradniki = WZORY_FOR['zanimklikniesz.html'].filter((f) => publicPaths.has(f) && exists(f));
  if (poradniki.length) { out.push(h2('Poradniki: jak nie dać się oszukać w internecie')); out.push(list(poradniki.map(wzorLine))); }
  if (POSTS.length && publicPaths.has('blog.html')) {
    out.push(h2('Najnowsze wpisy na blogu'));
    out.push(list(POSTS.slice(0, 5).map((post) => link(`blog.html?post=${encodeURIComponent(post.slug)}`, post.title))));
    out.push(p(link('blog.html', 'Wszystkie wpisy →')));
  }
  return out;
}

function blogBlock(file) {
  const meta = head(file);
  const out = [h1('Blog EduBox AI – porady dla nauczycieli'), p(esc(meta.desc)), NOSCRIPT];
  out.push(list(POSTS.map((post) =>
    `${link(`blog.html?post=${encodeURIComponent(post.slug)}`, post.title)}${post.excerpt ? ` – ${esc(post.excerpt)}` : ''}`)));
  out.push(p(link('/', 'Wszystkie narzędzia EduBox AI')));
  return out;
}

function genericBlock(file) {
  const meta = head(file);
  return [h1(shortTitle(file) || 'EduBox AI'), meta.desc ? p(esc(meta.desc)) : '', p('<em>Ładuję stronę…</em>'), NOSCRIPT,
    p(link('/', 'Wszystkie narzędzia EduBox AI'))].filter(Boolean);
}

function blockFor(file) {
  if (file === 'index.html') return indexBlock(file);
  if (file === 'blog.html') return blogBlock(file);
  const app = appFor(file);
  return app ? toolBlock(file, app) : genericBlock(file);
}

// <div id="root" ...> + (pusto | poprzednio wygenerowany blok) + </div>
const ROOT_RE = /(<div id="root"[^>]*>)(\s*|\s*<!-- EDUBOX-STATIC:START[\s\S]*?<!-- EDUBOX-STATIC:END -->\s*)(<\/div>)/;

let changed = 0;
let done = 0;
const outdated = [];
for (const page of config.publicPages) {
  const file = page.path;
  if (!exists(file)) continue;
  const html = read(file);
  const m = html.match(ROOT_RE);
  if (!m) continue; // strona statyczna albo #root z własną zawartością – nie ruszamy
  const eol = html.includes('\r\n') ? '\r\n' : '\n';
  const indent = (html.slice(0, m.index).match(/[ \t]*$/) || [''])[0];
  const body = blockFor(file).join('\n').split('\n').map((l) => `${indent}    ${l}`).join('\n');
  const block = `${m[1]}\n${indent}  ${START}\n${indent}  <main style="${WRAP}">\n${body}\n${indent}  </main>\n${indent}  ${END}\n${indent}${m[3]}`
    .replace(/\n/g, eol);
  const next = html.slice(0, m.index) + block + html.slice(m.index + m[0].length);
  done += 1;
  if (next !== html) {
    changed += 1;
    outdated.push(file);
    if (!CHECK) fs.writeFileSync(path.join(ROOT, file), next);
  }
}

if (CHECK) {
  if (outdated.length) {
    console.error(`[Static] Nieaktualna treść statyczna w ${outdated.length} plikach: ${outdated.join(', ')}`);
    console.error('[Static] Uruchom: npm run static:generate (a potem npm run seo:sitemap, jeśli zmieniły się strony publiczne).');
    process.exit(1);
  }
  console.log(`static:check OK – ${done} stron ma aktualną treść statyczną`);
} else {
  console.log(`[Static] Stron z treścią statyczną: ${done}, zmienionych: ${changed}`);
}

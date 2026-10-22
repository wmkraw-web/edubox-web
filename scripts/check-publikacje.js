// Testy automatu wpisów (scripts/publikacje.js): blog i „Co nowego” z danych od AI oraz automat
// materiałów i narzędzi. Uruchamiane w npm test (publikacje:check).
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const P = require('./publikacje.js');

const root = path.join(__dirname, '..');
const pages = new Set(['eduocena.html', 'edudialog.html', 'materialy.html', 'blog.html']);
let ok = 0;
const t = (name, fn) => { try { fn(); ok += 1; } catch (e) { console.error(`✗ ${name}`); throw e; } };

const akapit = (n) => `<p>${'Spokojna rozmowa pomaga ustalić fakty i kolejny krok. '.repeat(n)}</p>`;
const dobryWpis = () => ({
  title: 'Trudna wiadomość do rodzica bez eskalacji',
  excerpt: 'Jak napisać do rodzica spokojnie i konkretnie, żeby rozmowa prowadziła do rozwiązania, a nie do sporu.',
  category: 'Współpraca z rodzicami',
  icon: 'ph-heart',
  content: `${akapit(14)}<h2>Najpierw fakty</h2>${akapit(15)}<h2>Konkretny następny krok</h2>${akapit(15)}<p>Pomoże w tym <a href="edudialog.html?mode=nvc" onclick="x()">EduDialog AI</a>.</p>`,
});

t('slug bez polskich znaków', () => {
  assert.strictEqual(P.slugify('Żółć, gęś i „ŁĄKA” – 2026!'), 'zolc-ges-i-laka-2026');
});

t('czyszczenie HTML: skrypty, atrybuty, obce linki', () => {
  const h = P.sanitizeContent('<p onclick="a()">A<script>alert(1)</script> <a href="https://zly.pl">zły</a> <a href="eduocena.html">dobry</a> <img src=x onerror=a()></p><h2 style="x">B</h2><div>C</div>', pages);
  assert.ok(!/script|onclick|onerror|img|style|div|zly\.pl/.test(h), h);
  assert.ok(h.includes('<a href="eduocena.html" class="'), h);
  assert.ok(h.includes('zły') && h.includes('C'), 'tekst zostaje');
  assert.ok(h.includes('<h2>B</h2>'));
});

t('niezamknięte znaczniki są domykane', () => {
  const h = P.sanitizeContent('<p>A <strong>B<a href="eduocena.html">C', pages);
  assert.strictEqual(h, '<p>A <strong>B<a href="eduocena.html" class="text-blue-600 dark:text-blue-400 font-bold hover:underline">C</a></strong></p>');
});

t('link tylko do istniejących stron (także pełny adres eduboxpro.pl)', () => {
  assert.strictEqual(P.safeLink('https://eduboxpro.pl/eduocena.html?typ=zachowanie', pages), 'eduocena.html?typ=zachowanie');
  assert.strictEqual(P.safeLink('nieistnieje.html', pages), null);
  assert.strictEqual(P.safeLink('javascript:alert(1)', pages), null);
  assert.strictEqual(P.safeLink('eduocena.html?x="><script>', pages), null);
});

t('poprawny wpis bloga', () => {
  const p = P.buildBlogPost(dobryWpis(), { pages, existingSlugs: [], date: '2026-10-27' });
  assert.strictEqual(p.slug, 'trudna-wiadomosc-do-rodzica-bez-eskalacji');
  assert.strictEqual(p.color, 'text-pink-500');
  assert.strictEqual(p.date, '2026-10-27');
  assert.ok(/^\d+ min$/.test(p.readTime));
  assert.ok(!p.content.includes('onclick'));
});

t('wpis jako napis JSON też działa, a powtórzony slug dostaje numer', () => {
  const p = P.buildBlogPost(JSON.stringify(dobryWpis()), { pages, existingSlugs: ['trudna-wiadomosc-do-rodzica-bez-eskalacji'] });
  assert.strictEqual(p.slug, 'trudna-wiadomosc-do-rodzica-bez-eskalacji-2');
});

t('nieznana kategoria i ikona → bezpieczne domyślne', () => {
  const w = dobryWpis(); w.category = 'Prawo oświatowe'; w.icon = 'ph-bomb';
  const p = P.buildBlogPost(w, { pages, existingSlugs: [] });
  assert.strictEqual(p.category, 'Poradnik');
  assert.strictEqual(p.icon, 'ph-lightbulb');
});

t('numery przepisów są odrzucane', () => {
  ['zgodnie z art. 44 ustawy', 'na podstawie § 6 rozporządzenia', '(Dz.U. 2026 poz. 428)', 'ust. 2 mówi'].forEach((frag) => {
    const w = dobryWpis(); w.content += `<p>Tak stanowi ${frag}.</p>`;
    assert.throws(() => P.buildBlogPost(w, { pages, existingSlugs: [] }), /przepis/, frag);
  });
  // zwykłe słowa nie są przepisami
  assert.ok(!P.LEGAL_REF.test('artykuł o ustawieniu ławek w klasie, poza tym paragraf tekstu'));
});

t('za krótki wpis albo bez śródtytułów – odrzucony', () => {
  const w = dobryWpis(); w.content = akapit(10);
  assert.throws(() => P.buildBlogPost(w, { pages, existingSlugs: [] }), /słów|h2/);
  const w2 = dobryWpis(); w2.content = akapit(60);
  assert.throws(() => P.buildBlogPost(w2, { pages, existingSlugs: [] }), /h2/);
});

t('wstawienie do prawdziwego blog-posts.js czyta się parserem stron i w Node', () => {
  const text = fs.readFileSync(path.join(root, 'blog-posts.js'), 'utf8');
  const post = P.buildBlogPost(dobryWpis(), { pages, existingSlugs: [] });
  post.content += '<p>Cudzysłów " apostrof \' odwrócony ` i ${nie-wstawka}</p>';
  const out = P.insertBlogPost(text, post);
  const ctx = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'js-literal.js'), 'utf8'), ctx);
  const parsed = ctx.window.EduJsLiteral.readWindowValue(out, 'BLOG_POSTS');
  assert.strictEqual(parsed[0].slug, post.slug);
  assert.strictEqual(parsed[0].content, post.content);
  const sb = { window: {} };
  vm.runInNewContext(out, sb);
  assert.strictEqual(sb.window.BLOG_POSTS.length, parsed.length);
});

t('wpisy „Co nowego”: czyszczenie, tag, link, unikalne id', () => {
  const e = P.buildEntries([
    { tag: 'Ulepszenie', title: 'EduSprawdzian <b>sprawdza</b> klucz', description: 'Po napisaniu sprawdzianu drugi model rozwiązuje zadania i porównuje odpowiedzi. https://zly.pl', link: 'eduocena.html' },
    { tag: 'Hura', title: 'EduSprawdzian sprawdza klucz', description: 'Drugi wpis o tym samym tytule dostaje inne id.', link: 'zly.html' },
  ], { pages, existingIds: [], date: '2026-10-27' });
  assert.strictEqual(e[0].title, 'EduSprawdzian sprawdza klucz');
  assert.ok(!e[0].description.includes('http'));
  assert.strictEqual(e[0].link, 'eduocena.html');
  assert.strictEqual(e[1].tag, 'Ulepszenie');
  assert.ok(!('link' in e[1]));
  assert.notStrictEqual(e[0].id, e[1].id);
  assert.throws(() => P.buildEntries([{ title: 'Ocena', description: 'Zgodnie z § 11 rozporządzenia o ocenianiu.' }], { pages }), /przepis/);
});

t('automat materiałów: grupowanie, 2 h odczekania, stan', () => {
  const now = Date.parse('2026-10-22T19:00:00Z');
  const pakiety = [
    { id: 'A', title: 'Dzień Dyni', sekcja: 'przedszkole', createdAt: '2026-10-22T10:00:00Z' },
    { id: 'B', title: 'Dzień Dyni', sekcja: 'klasy-1-3', createdAt: '2026-10-22T11:00:00Z' },
    { id: 'C', title: 'Andrzejki', sekcja: 'przedszkole', createdAt: '2026-10-22T18:30:00Z' }, // za świeży
    { id: 'D', title: 'Stary', sekcja: 'inne', createdAt: '2026-09-01T10:00:00Z' },
  ];
  const r = P.autoEntries({ pakiety, tools: [{ url: 'eduocena.html', title: 'EduOcena', desc: 'x' }], stan: { materialy: ['D'], narzedzia: ['eduocena.html'] }, now });
  assert.strictEqual(r.entries.length, 1);
  assert.ok(r.entries[0].description.includes('„Dzień Dyni” (przedszkole); „Dzień Dyni” (klasy 1–3)'), r.entries[0].description);
  assert.strictEqual(r.entries[0].link, 'materialy.html?szukaj=Dzie%C5%84%20Dyni');
  assert.deepStrictEqual(r.stan.materialy, ['A', 'B', 'D']);
  const r2 = P.autoEntries({ pakiety, tools: [], stan: r.stan, now: now + 3 * 3600 * 1000 });
  assert.strictEqual(r2.entries.length, 1);
  assert.ok(r2.entries[0].link.includes('pakiet=C') && r2.entries[0].link.includes('sekcja=przedszkole'));
  const r3 = P.autoEntries({ pakiety, tools: [], stan: r2.stan, now: now + 5 * 3600 * 1000 });
  assert.strictEqual(r3.entries.length, 0, 'nic dwa razy');
});

t('automat narzędzi: nowy kafelek z apps.js', () => {
  const r = P.autoEntries({ pakiety: [], tools: [{ url: 'eduocena.html', title: 'EduOcena', desc: 'Stare' }, { url: 'edunowe.html', title: 'EduNowe', desc: 'Robi <b>coś</b> nowego.' }, { url: 'https://zewn.pl', title: 'Zewn' }], stan: { materialy: [], narzedzia: ['eduocena.html'] } });
  assert.strictEqual(r.entries.length, 1);
  assert.strictEqual(r.entries[0].title, 'Nowe narzędzie: EduNowe');
  assert.strictEqual(r.entries[0].description, 'Robi coś nowego.');
  assert.ok(r.stan.narzedzia.includes('edunowe.html'));
});

t('serializacja zmiany.js jak w Redaktorze Ogłoszeń', () => {
  const out = P.serializeZmiany([{ id: 'x', date: '2026-10-27', tag: 'Nowość', title: 'T', description: 'D', link: 'materialy.html' }]);
  const ctx = { window: {} };
  vm.runInNewContext(out, ctx);
  assert.strictEqual(ctx.window.CO_NOWEGO[0].link, 'materialy.html');
});

t('stan automatu (jeśli jest) ma znane narzędzia z apps.js', () => {
  const f = path.join(root, 'data', 'co-nowego-stan.json');
  if (!fs.existsSync(f)) return;
  const stan = JSON.parse(fs.readFileSync(f, 'utf8'));
  assert.ok(Array.isArray(stan.materialy) && Array.isArray(stan.narzedzia) && stan.narzedzia.length > 30);
});

t('strona „Co nowego” pokazuje link wpisu', () => {
  const html = fs.readFileSync(path.join(root, 'co-nowego.html'), 'utf8');
  assert.ok(/entry\.link/.test(html), 'co-nowego.html obsługuje entry.link');
});

console.log(`publikacje:check OK (${ok} testów)`);

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');
const cheerio = require('cheerio');
const config = require('./seo.config');

const ROOT = __dirname;
const TODAY = new Date().toISOString().slice(0, 10);
const VALID_DATE = /^\d{4}-\d{2}-\d{2}$/;
const PUBLIC_ROBOTS = 'index, follow, max-image-preview:large';
const PRIVATE_ROBOTS = 'noindex, nofollow, noarchive';

function normalisePath(value) {
  return value.replaceAll('\\', '/').replace(/^\.\//, '');
}

function absoluteUrl(value) {
  return new URL(value, `${config.baseUrl}/`).href;
}

function pageUrl(page) {
  return absoluteUrl(page.url || `/${page.path}`);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function escapeText(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function insertInHead(html, tag) {
  const eol = html.includes('\r\n') ? '\r\n' : '\n';
  if (!/<\/head\s*>/i.test(html)) return html;
  return html.replace(/<\/head\s*>/i, `  ${tag}${eol}</head>`);
}

function updateDocumentHead(html, updater) {
  const open = html.match(/<head\b[^>]*>/i);
  if (!open || open.index === undefined) return html;
  const start = open.index;
  const close = html.toLowerCase().indexOf('</head>', start + open[0].length);
  if (close === -1) return html;
  const end = close + '</head>'.length;
  return html.slice(0, start) + updater(html.slice(start, end)) + html.slice(end);
}

function replaceSingleton(html, pattern, tag) {
  let found = false;
  const updated = html.replace(pattern, () => {
    if (found) return '';
    found = true;
    return tag;
  });
  return found ? updated : insertInHead(updated, tag);
}

function metaPattern(attribute, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`<meta\\b(?=[^>]*\\b${attribute}\\s*=\\s*["']${escaped}["'])[^>]*>`, 'gi');
}

function repairPublicHtml(html, fallback) {
  const before = html;
  const $ = cheerio.load(html);
  const currentTitle = $('head title').first().text().trim();
  const currentDescription = $('head meta[name="description"]').first().attr('content')?.trim();
  const currentImage = $('head meta[property="og:image"]').first().attr('content')?.trim();
  const title = fallback.seoTitle || currentTitle || `${fallback.title || fallback.name || 'Narzędzie edukacyjne'} | EduBox AI`;
  const description = fallback.seoDescription || currentDescription || fallback.description || fallback.desc || 'Praktyczne narzędzie EduBox AI wspierające nauczycieli w codziennej pracy.';
  const canonical = fallback.canonical;
  const image = absoluteUrl(currentImage || config.defaultImage);

  html = updateDocumentHead(html, (head) => {
    head = replaceSingleton(head, /<title\b[^>]*>[\s\S]*?<\/title\s*>/gi, `<title>${escapeText(title)}</title>`);
    head = replaceSingleton(head, metaPattern('name', 'description'), `<meta name="description" content="${escapeHtml(description)}">`);
    head = replaceSingleton(head, /<link\b(?=[^>]*\brel\s*=\s*["']canonical["'])[^>]*>/gi, `<link rel="canonical" href="${escapeHtml(canonical)}">`);
    head = replaceSingleton(head, metaPattern('name', 'robots'), `<meta name="robots" content="${PUBLIC_ROBOTS}">`);
    head = replaceSingleton(head, metaPattern('property', 'og:title'), `<meta property="og:title" content="${escapeHtml(title)}">`);
    head = replaceSingleton(head, metaPattern('property', 'og:description'), `<meta property="og:description" content="${escapeHtml(description)}">`);
    head = replaceSingleton(head, metaPattern('property', 'og:type'), `<meta property="og:type" content="${escapeHtml(fallback.ogType || 'website')}">`);
    head = replaceSingleton(head, metaPattern('property', 'og:url'), `<meta property="og:url" content="${escapeHtml(canonical)}">`);
    head = replaceSingleton(head, metaPattern('property', 'og:image'), `<meta property="og:image" content="${escapeHtml(image)}">`);
    head = replaceSingleton(head, metaPattern('name', 'twitter:card'), '<meta name="twitter:card" content="summary_large_image">');
    head = replaceSingleton(head, metaPattern('name', 'twitter:title'), `<meta name="twitter:title" content="${escapeHtml(title)}">`);
    head = replaceSingleton(head, metaPattern('name', 'twitter:description'), `<meta name="twitter:description" content="${escapeHtml(description)}">`);
    head = replaceSingleton(head, metaPattern('name', 'twitter:image'), `<meta name="twitter:image" content="${escapeHtml(image)}">`);
    return head;
  });
  return { html, changed: html !== before };
}

function repairExcludedHtml(html) {
  const updated = updateDocumentHead(html, (head) => replaceSingleton(head, metaPattern('name', 'robots'), `<meta name="robots" content="${PRIVATE_ROBOTS}">`));
  return { html: updated, changed: updated !== html };
}

function loadCatalog() {
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'apps.js'), 'utf8'), sandbox, { filename: 'apps.js' });
  const apps = sandbox.window.EduBoxData?.APPS || [];
  const byPath = new Map();
  for (const app of apps) {
    if (!/^https?:\/\//i.test(app.url || '') && !byPath.has(app.url)) byPath.set(normalisePath(app.url), app);
  }
  return { apps, byPath };
}

function loadBlogPosts() {
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, config.blog.dataFile), 'utf8'), sandbox, { filename: config.blog.dataFile });
  return sandbox.window.BLOG_POSTS || [];
}

function listHtmlFiles(directory = ROOT) {
  const result = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...listHtmlFiles(full));
    else if (entry.name.toLowerCase().endsWith('.html')) result.push(normalisePath(path.relative(ROOT, full)));
  }
  return result.sort();
}

function git(args) {
  try {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

function changedFiles() {
  const files = new Set();
  const base = process.env.SEO_BASE_SHA || 'main';
  if (git(['rev-parse', '--verify', base])) {
    for (const file of git(['diff', '--name-only', `${base}...HEAD`]).split(/\r?\n/)) {
      if (file) files.add(normalisePath(file));
    }
  }
  for (const line of git(['status', '--porcelain']).split(/\r?\n/)) {
    if (!line) continue;
    const file = line.slice(3).split(' -> ').pop();
    if (file) files.add(normalisePath(file.replace(/^"|"$/g, '')));
  }
  return files;
}

function parseExistingSitemap() {
  const file = path.join(ROOT, 'sitemap.xml');
  const map = new Map();
  if (!fs.existsSync(file)) return map;
  const xml = fs.readFileSync(file, 'utf8');
  for (const match of xml.matchAll(/<url>[\s\S]*?<loc>([^<]+)<\/loc>[\s\S]*?<lastmod>([^<]+)<\/lastmod>[\s\S]*?<\/url>/g)) {
    map.set(match[1].replaceAll('&amp;', '&'), match[2]);
  }
  return map;
}

function lastmodFor(file, url, changed, existing) {
  if (changed.has(normalisePath(file))) return TODAY;
  const previous = existing.get(url);
  if (VALID_DATE.test(previous || '')) return previous;
  const fromGit = git(['log', '-1', '--format=%cs', '--', file]);
  if (VALID_DATE.test(fromGit)) return fromGit;
  const stat = fs.statSync(path.join(ROOT, file));
  return stat.mtime.toISOString().slice(0, 10);
}

function sitemapEntry({ url, lastmod, changefreq, priority }) {
  return [
    '  <url>',
    `    <loc>${url.replaceAll('&', '&amp;')}</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>',
  ].join('\n');
}

function buildSitemap(posts) {
  const changed = changedFiles();
  const existing = parseExistingSitemap();
  const entries = [];
  for (const page of config.publicPages) {
    const url = pageUrl(page);
    const relatedFiles = page.path === config.blog.page ? [page.path, config.blog.dataFile] : [page.path];
    const pageChanged = relatedFiles.some((file) => changed.has(file));
    const lastmod = pageChanged ? TODAY : lastmodFor(page.path, url, changed, existing);
    entries.push(sitemapEntry({
      url,
      lastmod,
      changefreq: page.changefreq || 'weekly',
      priority: page.priority || '0.8',
    }));

    if (page.path === config.blog.page) {
      for (const post of posts) {
        const postUrl = `${config.baseUrl}/blog.html?post=${encodeURIComponent(post.slug)}`;
        const postLastmod = VALID_DATE.test(post.updated || '') ? post.updated : (VALID_DATE.test(post.date || '') ? post.date : lastmod);
        entries.push(sitemapEntry({
          url: postUrl,
          lastmod: postLastmod,
          changefreq: config.blog.changefreq,
          priority: config.blog.priority,
        }));
      }
    }
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`;
}

function buildRobots() {
  const lines = ['User-agent: *', 'Allow: /'];
  for (const rule of config.robotsDisallow) lines.push(`Disallow: ${rule}`);
  lines.push('', `Sitemap: ${config.baseUrl}/sitemap.xml`, '');
  return lines.join('\n');
}

function addIssue(issues, severity, code, file, message) {
  issues.push({ severity, code, file, message });
}

function singleValue($, selector, attribute, issues, file, code) {
  const elements = $(selector);
  if (elements.length === 0) {
    addIssue(issues, 'error', code, file, `Brak ${selector}.`);
    return '';
  }
  if (elements.length > 1) addIssue(issues, 'error', `${code}_DUPLICATE`, file, `Znaleziono ${elements.length} elementy ${selector}.`);
  return attribute ? (elements.first().attr(attribute) || '').trim() : elements.first().text().trim();
}

function validatePublicPage(page, issues) {
  const file = page.path;
  const full = path.join(ROOT, file);
  if (!fs.existsSync(full)) {
    addIssue(issues, 'error', 'PUBLIC_FILE_MISSING', file, 'Plik oznaczony jako publiczny nie istnieje.');
    return;
  }
  const $ = cheerio.load(fs.readFileSync(full, 'utf8'));
  const title = singleValue($, 'head title', null, issues, file, 'TITLE_MISSING');
  const description = singleValue($, 'head meta[name="description"]', 'content', issues, file, 'DESCRIPTION_MISSING');
  const canonical = singleValue($, 'head link[rel="canonical"]', 'href', issues, file, 'CANONICAL_MISSING');
  const robots = singleValue($, 'head meta[name="robots"]', 'content', issues, file, 'ROBOTS_MISSING');
  const ogType = singleValue($, 'head meta[property="og:type"]', 'content', issues, file, 'OG_TYPE_MISSING');
  const expectedCanonical = pageUrl(page);
  if (canonical && canonical !== expectedCanonical) addIssue(issues, 'error', 'CANONICAL_WRONG', file, `Canonical powinien mieć wartość ${expectedCanonical}.`);
  if (robots && (!/\bindex\b/i.test(robots) || /\bnoindex\b/i.test(robots))) addIssue(issues, 'error', 'ROBOTS_WRONG', file, 'Publiczna strona nie ma dyrektywy index.');
  if (ogType && ogType !== (page.ogType || 'website')) addIssue(issues, 'error', 'OG_TYPE_WRONG', file, `og:type powinien mieć wartość ${page.ogType || 'website'}.`);
  if (title.length && (title.length < 25 || title.length > 65)) addIssue(issues, 'warning', 'TITLE_LENGTH', file, `Tytuł ma ${title.length} znaków (zalecane 25-65).`);
  if (description.length && (description.length < 70 || description.length > 180)) addIssue(issues, 'warning', 'DESCRIPTION_LENGTH', file, `Opis ma ${description.length} znaków (zalecane 70-180).`);

  const expected = {
    'meta[property="og:title"]': title,
    'meta[property="og:description"]': description,
    'meta[property="og:url"]': expectedCanonical,
    'meta[property="og:image"]': null,
    'meta[name="twitter:card"]': 'summary_large_image',
    'meta[name="twitter:title"]': title,
    'meta[name="twitter:description"]': description,
    'meta[name="twitter:image"]': null,
  };
  for (const [selector, value] of Object.entries(expected)) {
    const actual = singleValue($, `head ${selector}`, 'content', issues, file, 'SOCIAL_META_MISSING');
    if (actual && value !== null && actual !== value) addIssue(issues, 'error', 'SOCIAL_META_MISMATCH', file, `${selector} nie zgadza się z podstawowymi metadanymi.`);
    if (actual && value === null && !/^https:\/\//i.test(actual)) addIssue(issues, 'error', 'SOCIAL_IMAGE_NOT_ABSOLUTE', file, `${selector} musi zawierać pełny adres HTTPS.`);
  }
}

function validateExcludedPage(page, issues) {
  const full = path.join(ROOT, page.path);
  if (!fs.existsSync(full)) {
    addIssue(issues, 'error', 'EXCLUDED_FILE_MISSING', page.path, 'Plik wykluczony w konfiguracji nie istnieje.');
    return;
  }
  const $ = cheerio.load(fs.readFileSync(full, 'utf8'));
  const robots = $('head meta[name="robots"]').first().attr('content') || '';
  if (!/\bnoindex\b/i.test(robots) || !/\bnofollow\b/i.test(robots)) {
    addIssue(issues, 'error', 'PRIVATE_PAGE_INDEXABLE', page.path, 'Strona wewnętrzna musi mieć noindex, nofollow.');
  }
}

function validateClassification(catalog, issues) {
  const publicSet = new Set(config.publicPages.map((page) => normalisePath(page.path)));
  const excludedSet = new Set(config.excludedPages.map((page) => normalisePath(page.path)));
  for (const file of publicSet) {
    if (excludedSet.has(file)) addIssue(issues, 'error', 'CLASSIFICATION_CONFLICT', file, 'Plik jest jednocześnie publiczny i wykluczony.');
  }
  for (const file of listHtmlFiles()) {
    if (!publicSet.has(file) && !excludedSet.has(file)) {
      addIssue(issues, 'error', 'UNCLASSIFIED_HTML', file, 'Nowy HTML jest domyślnie niepubliczny. Dopisz świadomą klasyfikację w seo.config.js.');
    }
  }
  for (const file of catalog.byPath.keys()) {
    if (!publicSet.has(file)) addIssue(issues, 'error', 'CATALOG_PAGE_NOT_PUBLIC', file, 'Lokalny adres z apps.js nie jest jawnie oznaczony jako publiczny.');
  }
}

function validateBlog(posts, issues) {
  const seen = new Set();
  for (const [index, post] of posts.entries()) {
    const file = `${config.blog.dataFile}#${index + 1}`;
    if (!post.slug || !/^[\p{L}\p{N}-]+$/u.test(post.slug)) addIssue(issues, 'error', 'BLOG_SLUG_INVALID', file, 'Wpis nie ma prawidłowego sluga.');
    if (seen.has(post.slug)) addIssue(issues, 'error', 'BLOG_SLUG_DUPLICATE', file, `Powtórzony slug: ${post.slug}.`);
    seen.add(post.slug);
    if (!post.title?.trim()) addIssue(issues, 'error', 'BLOG_TITLE_MISSING', file, 'Wpis nie ma tytułu.');
    if (!post.excerpt?.trim()) addIssue(issues, 'error', 'BLOG_DESCRIPTION_MISSING', file, 'Wpis nie ma opisu excerpt.');
    if (!VALID_DATE.test(post.date || '')) addIssue(issues, 'error', 'BLOG_DATE_INVALID', file, 'Data wpisu musi mieć format RRRR-MM-DD.');
    if (post.updated && !VALID_DATE.test(post.updated)) addIssue(issues, 'error', 'BLOG_UPDATED_INVALID', file, 'Data aktualizacji musi mieć format RRRR-MM-DD.');
    if (VALID_DATE.test(post.updated || '') && VALID_DATE.test(post.date || '') && post.updated < post.date) addIssue(issues, 'error', 'BLOG_UPDATED_BEFORE_PUBLISHED', file, 'Data aktualizacji nie może być wcześniejsza niż publikacja.');
  }
  const blogHtml = fs.readFileSync(path.join(ROOT, config.blog.page), 'utf8');
  for (const marker of ['applyBlogSeo', 'og:type', 'twitter:title', 'link[rel="canonical"]']) {
    if (!blogHtml.includes(marker)) addIssue(issues, 'error', 'BLOG_DYNAMIC_SEO_MISSING', config.blog.page, `Brakuje obsługi dynamicznego SEO: ${marker}.`);
  }
}

function validateInternalLinks(posts, issues) {
  const inspect = (source, html) => {
    const $ = cheerio.load(html);
    $('a[href]').each((_, element) => {
      const href = ($(element).attr('href') || '').trim();
      if (!href || /^(#|mailto:|tel:|javascript:|data:)/i.test(href) || href.includes('${')) return;
      let url;
      try { url = new URL(href, `${config.baseUrl}/${source.split('#')[0]}`); } catch { return; }
      if (url.origin !== config.baseUrl || !url.pathname.toLowerCase().endsWith('.html')) return;
      const target = normalisePath(decodeURIComponent(url.pathname).replace(/^\//, ''));
      if (!fs.existsSync(path.join(ROOT, target))) {
        addIssue(issues, 'warning', 'BROKEN_INTERNAL_LINK', source, `Link prowadzi do nieistniejącego pliku: ${href}.`);
      }
    });
  };

  for (const page of config.publicPages) {
    const full = path.join(ROOT, page.path);
    if (fs.existsSync(full)) inspect(page.path, fs.readFileSync(full, 'utf8'));
  }
  for (const post of posts) inspect(`${config.blog.dataFile}#${post.slug}`, post.content || '');
}

function validateGeneratedFiles(posts, issues) {
  const expectedSitemap = buildSitemap(posts).replace(/\r\n/g, '\n').trim();
  const actualSitemap = fs.existsSync(path.join(ROOT, 'sitemap.xml'))
    ? fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8').replace(/\r\n/g, '\n').trim()
    : '';
  if (actualSitemap !== expectedSitemap) addIssue(issues, 'error', 'SITEMAP_OUTDATED', 'sitemap.xml', 'Mapa strony nie zgadza się z jawną klasyfikacją lub datami zmian. Uruchom npm run seo:sitemap.');
  const sitemapUrls = new Set([...actualSitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].replaceAll('&amp;', '&')));
  for (const page of config.excludedPages) {
    if (sitemapUrls.has(absoluteUrl(`/${page.path}`))) addIssue(issues, 'error', 'PRIVATE_PAGE_IN_SITEMAP', page.path, 'Strona wykluczona znalazła się w sitemap.xml.');
  }
  const expectedRobots = buildRobots().trim();
  const actualRobots = fs.existsSync(path.join(ROOT, 'robots.txt')) ? fs.readFileSync(path.join(ROOT, 'robots.txt'), 'utf8').replace(/\r\n/g, '\n').trim() : '';
  if (actualRobots !== expectedRobots) addIssue(issues, 'error', 'ROBOTS_OUTDATED', 'robots.txt', 'robots.txt nie zgadza się z seo.config.js.');
}

function writeReports(mode, issues) {
  const directory = path.join(ROOT, config.reportDirectory);
  fs.mkdirSync(directory, { recursive: true });
  const errors = issues.filter((issue) => issue.severity === 'error');
  const warnings = issues.filter((issue) => issue.severity === 'warning');
  const report = {
    generatedAt: new Date().toISOString(),
    mode,
    summary: {
      publicPages: config.publicPages.length,
      excludedPages: config.excludedPages.length,
      errors: errors.length,
      warnings: warnings.length,
    },
    issues,
  };
  fs.writeFileSync(path.join(directory, 'seo-report.json'), `${JSON.stringify(report, null, 2)}\n`);
  const lines = [
    '# Raport SEO Manager 2.0',
    '',
    `- Wygenerowano: ${report.generatedAt}`,
    `- Strony publiczne: ${report.summary.publicPages}`,
    `- Strony wykluczone: ${report.summary.excludedPages}`,
    `- Błędy: ${errors.length}`,
    `- Ostrzeżenia: ${warnings.length}`,
    '',
  ];
  for (const severity of ['error', 'warning']) {
    const subset = issues.filter((issue) => issue.severity === severity);
    lines.push(`## ${severity === 'error' ? 'Błędy' : 'Ostrzeżenia'}`, '');
    if (subset.length === 0) lines.push('Brak.', '');
    else for (const issue of subset) lines.push(`- **${issue.code}** — \`${issue.file}\`: ${issue.message}`);
    lines.push('');
  }
  fs.writeFileSync(path.join(directory, 'seo-report.md'), `${lines.join('\n')}\n`);
  return report;
}

function applyFixes(catalog) {
  const changed = [];
  for (const page of config.publicPages) {
    const full = path.join(ROOT, page.path);
    if (!fs.existsSync(full)) continue;
    const html = fs.readFileSync(full, 'utf8');
    const app = catalog.byPath.get(page.path) || {};
    const result = repairPublicHtml(html, { ...app, ...page, canonical: pageUrl(page) });
    if (result.changed) {
      fs.writeFileSync(full, result.html, 'utf8');
      changed.push(page.path);
    }
  }
  for (const page of config.excludedPages) {
    const full = path.join(ROOT, page.path);
    if (!fs.existsSync(full)) continue;
    const html = fs.readFileSync(full, 'utf8');
    const result = repairExcludedHtml(html);
    if (result.changed) {
      fs.writeFileSync(full, result.html, 'utf8');
      changed.push(page.path);
    }
  }
  fs.writeFileSync(path.join(ROOT, 'robots.txt'), buildRobots(), 'utf8');
  return changed;
}

function audit(mode) {
  const issues = [];
  let catalog;
  let posts;
  try { catalog = loadCatalog(); } catch (error) { addIssue(issues, 'error', 'APPS_PARSE_ERROR', 'apps.js', error.message); catalog = { apps: [], byPath: new Map() }; }
  try { posts = loadBlogPosts(); } catch (error) { addIssue(issues, 'error', 'BLOG_PARSE_ERROR', config.blog.dataFile, error.message); posts = []; }
  validateClassification(catalog, issues);
  for (const page of config.publicPages) validatePublicPage(page, issues);
  for (const page of config.excludedPages) validateExcludedPage(page, issues);
  validateBlog(posts, issues);
  validateInternalLinks(posts, issues);
  validateGeneratedFiles(posts, issues);
  return { report: writeReports(mode, issues), posts, catalog };
}

function run(mode = 'check') {
  if (!['check', 'fix', 'sitemap', 'report'].includes(mode)) {
    console.error('Użycie: node seo-manager.js check|fix|sitemap|report');
    return 2;
  }
  const catalog = loadCatalog();
  const posts = loadBlogPosts();
  if (mode === 'fix') {
    const files = applyFixes(catalog);
    fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), buildSitemap(posts), 'utf8');
    console.log(`[SEO Manager] Poprawiono ${files.length} plików HTML oraz wygenerowano sitemap.xml i robots.txt.`);
  } else if (mode === 'sitemap') {
    fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), buildSitemap(posts), 'utf8');
    console.log('[SEO Manager] Wygenerowano wyłącznie sitemap.xml. Pliki HTML pozostały nietknięte.');
  }
  const { report } = audit(mode);
  console.log(`[SEO Manager] Publiczne: ${report.summary.publicPages}, wykluczone: ${report.summary.excludedPages}, błędy: ${report.summary.errors}, ostrzeżenia: ${report.summary.warnings}.`);
  console.log(`[SEO Manager] Raport: ${config.reportDirectory}/seo-report.md`);
  return report.summary.errors > 0 ? 1 : 0;
}

if (require.main === module) process.exitCode = run(process.argv[2] || 'check');

module.exports = { run, buildSitemap, buildRobots };

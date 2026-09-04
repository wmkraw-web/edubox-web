'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const config = require('../seo.config');

const root = path.resolve(__dirname, '..');
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'apps.js'), 'utf8'), sandbox, { filename: 'apps.js' });

const data = sandbox.window.EduBoxData || {};
const apps = data.APPS || [];
const journeys = data.JOURNEYS || [];
const centers = data.CENTERS || [];
const errors = [];
const warnings = [];
const categories = new Set(['terapia', 'biurokracja', 'zajecia', 'grafika']);
const privatePaths = new Set(config.excludedPages.map(page => page.path));
const exactUrls = new Set();
const titles = new Set();
const baseCounts = new Map();
const modes = {
  'edudialog.html': new Set(['nvc', 'ppp']),
  'eduterapia.html': new Set(['story', 'tus', 'sensory']),
  'eduwizualizator.html': new Set(['steps', 'first_then']),
  'edubiurokrata.html': new Set(['protokol', 'notatka']),
  'edukacja2025.html': new Set(['civic', 'fake-news']),
  'edugry.html': new Set(['jamam', 'bingo']),
};

function fail(where, message) { errors.push(`${where}: ${message}`); }
function warn(where, message) { warnings.push(`${where}: ${message}`); }
function localUrl(raw) {
  try {
    const parsed = new URL(raw, 'https://eduboxpro.pl/');
    return parsed.origin === 'https://eduboxpro.pl' ? parsed : null;
  } catch { return null; }
}

for (const [index, app] of apps.entries()) {
  const where = `APPS[${index}]${app.title ? ` (${app.title})` : ''}`;
  for (const field of ['title', 'desc', 'url', 'icon', 'color', 'category']) {
    if (typeof app[field] !== 'string' || !app[field].trim()) fail(where, `brak pola ${field}`);
  }
  if (!Array.isArray(app.tags) || app.tags.length === 0) fail(where, 'brak niepustej listy tags');
  if (app.category && !categories.has(app.category)) fail(where, `nieznana kategoria ${app.category}`);
  if (exactUrls.has(app.url)) fail(where, `powtórzony dokładny adres ${app.url}`);
  exactUrls.add(app.url);
  if (titles.has(app.title)) fail(where, `powtórzony tytuł ${app.title}`);
  titles.add(app.title);

  const parsed = localUrl(app.url);
  if (!parsed) continue;
  const base = decodeURIComponent(parsed.pathname.replace(/^\//, ''));
  baseCounts.set(base, (baseCounts.get(base) || 0) + 1);
  if (!fs.existsSync(path.join(root, base))) fail(where, `lokalny plik nie istnieje: ${base}`);
  if (privatePaths.has(base)) fail(where, `katalog wskazuje stronę prywatną: ${base}`);
  if (parsed.searchParams.has('mode')) {
    const allowed = modes[base];
    const mode = parsed.searchParams.get('mode');
    if (!allowed || !allowed.has(mode)) fail(where, `nieobsługiwany tryb ${mode} dla ${base}`);
  }
}

for (const [base, count] of baseCounts) {
  if (count <= 1) continue;
  const entries = apps.filter(app => localUrl(app.url)?.pathname.replace(/^\//, '') === base);
  for (const app of entries) {
    if (!localUrl(app.url).searchParams.get('mode')) fail(app.title, `współdzielona strona ${base} wymaga jawnego parametru mode`);
  }
}

const journeyIds = new Set();
for (const [index, journey] of journeys.entries()) {
  const where = `JOURNEYS[${index}]${journey.label ? ` (${journey.label})` : ''}`;
  if (!journey.id || journeyIds.has(journey.id)) fail(where, 'brak lub powtórzone id');
  journeyIds.add(journey.id);
  if (!journey.label || !journey.answer || !journey.icon) fail(where, 'brak etykiety, odpowiedzi lub ikony');
  if (!Array.isArray(journey.urls) || journey.urls.length < 2 || journey.urls.length > 3) fail(where, 'ścieżka powinna mieć 2-3 kroki');
  for (const url of journey.urls || []) if (!exactUrls.has(url)) fail(where, `adres nie występuje dokładnie w katalogu: ${url}`);
}

const centerUrls = new Set();
for (const [index, center] of centers.entries()) {
  const where = `CENTERS[${index}]${center.title ? ` (${center.title})` : ''}`;
  if (!center.title || !center.desc || !center.url || !center.category) fail(where, 'brak wymaganych danych');
  if (!categories.has(center.category)) fail(where, `nieznana kategoria ${center.category}`);
  if (centerUrls.has(center.url)) fail(where, `powtórzony adres ${center.url}`);
  centerUrls.add(center.url);
  if (!fs.existsSync(path.join(root, center.url))) warn(where, `plik ${center.url} nie został jeszcze wygenerowany`);
}

for (const message of warnings) console.warn(`[Katalog][UWAGA] ${message}`);
if (errors.length) {
  console.error(`[Katalog] Znaleziono ${errors.length} błędów:`);
  for (const message of errors) console.error(`- ${message}`);
  process.exitCode = 1;
} else {
  console.log(`[Katalog] OK — ${apps.length} kafelków, ${journeys.length} ścieżek NOVY, ${centers.length} centra tematyczne.`);
}

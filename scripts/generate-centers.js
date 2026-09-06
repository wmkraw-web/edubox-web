'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const config = require('../seo.config');

const root = path.resolve(__dirname, '..');
const checkOnly = process.argv.includes('--check');
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'apps.js'), 'utf8'), sandbox, { filename: 'apps.js' });
const data = sandbox.window.EduBoxData || {};

function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function pageConfig(file) {
  const page = config.publicPages.find(item => item.path === file);
  if (!page) throw new Error(`${file} nie jest jawnie oznaczony jako publiczny w seo.config.js`);
  return page;
}

function render(center) {
  const page = pageConfig(center.url);
  const canonical = `${config.baseUrl}/${center.url}`;
  const title = page.seoTitle;
  const description = page.seoDescription;
  const apps = (data.APPS || []).filter(app => app.category === center.category);
  const otherCenters = (data.CENTERS || []).filter(item => item.url !== center.url);
  const verifiedYear = data.QUALITY?.verifiedSchoolYear || '2026/2027';
  const checkedAt = data.QUALITY?.catalogCheckedAt || '';

  const cards = apps.map(app => `
        <a href="${esc(app.url)}" class="group flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-400 hover:shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <div class="mb-5 flex items-start justify-between gap-3">
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800"><i class="ph-bold ${esc(app.icon)} ${esc(app.color)} text-2xl"></i></div>
            <div class="flex flex-wrap justify-end gap-1.5">
              <span class="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">Aktywne</span>
              ${app.verified2026 ? `<span class="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">Sprawdzone ${esc(verifiedYear)}</span>` : ''}
            </div>
          </div>
          <h2 class="text-lg font-black text-slate-900 transition group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">${esc(app.title)}</h2>
          <p class="mt-2 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">${esc(app.desc)}</p>
          <span class="mt-5 inline-flex items-center gap-2 text-sm font-black text-blue-600 dark:text-blue-400">Otwórz narzędzie <i class="ph-bold ph-arrow-right transition-transform group-hover:translate-x-1"></i></span>
        </a>`).join('');

  const centerLinks = otherCenters.map(item => `<a href="${esc(item.url)}" class="rounded-full border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-blue-400 hover:text-blue-600 dark:border-slate-700 dark:text-slate-300">${esc(item.title)}</a>`).join('\n          ');

  return `<!DOCTYPE html>
<html lang="pl" class="scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${canonical}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${config.baseUrl}${config.defaultImage}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${config.baseUrl}${config.defaultImage}">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>tailwind.config={darkMode:'class'}</script>
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-3RQ9R0N0K8"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-3RQ9R0N0K8');
  </script>
  <script src="https://unpkg.com/@phosphor-icons/web"></script>
</head>
<body class="min-h-screen bg-slate-50 text-slate-900 antialiased dark:bg-slate-950 dark:text-white">
  <div id="wspolne-menu-kontener"></div>
  <script>
    document.addEventListener('DOMContentLoaded', function () {
      const container = document.getElementById('wspolne-menu-kontener');
      const fallback = function () {
        container.innerHTML = '<nav class="fixed inset-x-0 top-0 z-50 bg-slate-950/95 px-6 py-4 text-white shadow-lg"><a href="/index.html" class="font-black">Edu<span class="text-blue-400">Box</span> AI</a></nav>';
      };
      fetch('/menu.html')
        .then(function (response) { if (!response.ok) throw new Error('menu'); return response.text(); })
        .then(function (html) {
          container.innerHTML = html;
          container.querySelectorAll('script').forEach(function (oldScript) {
            const script = document.createElement('script');
            if (oldScript.src) script.src = oldScript.src;
            script.textContent = oldScript.textContent;
            oldScript.parentNode.replaceChild(script, oldScript);
          });
          if (typeof window.initMenuLogic === 'function') window.initMenuLogic();
        })
        .catch(fallback);
    });
  </script>
  <main>
    <header class="bg-gradient-to-br ${esc(center.color)} px-6 pb-16 pt-32 text-white">
      <div class="mx-auto max-w-6xl">
        <a href="/index.html#narzedzia" class="mb-8 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-bold backdrop-blur transition hover:bg-white/25"><i class="ph-bold ph-arrow-left"></i> Wszystkie narzędzia</a>
        <div class="max-w-3xl">
          <div class="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur"><i class="ph-bold ${esc(center.icon)} text-3xl"></i></div>
          <h1 class="text-4xl font-black tracking-tight md:text-6xl">${esc(center.title)}</h1>
          <p class="mt-5 text-lg leading-relaxed text-white/90 md:text-xl">${esc(center.desc)}</p>
          <p class="mt-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-bold backdrop-blur"><i class="ph-fill ph-check-circle"></i> ${apps.length} aktywnych narzędzi · katalog sprawdzony ${esc(checkedAt)}</p>
        </div>
      </div>
    </header>
    <section class="mx-auto max-w-6xl px-6 py-14">
      <div class="mb-8">
        <p class="text-xs font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">Kliknij konkretny kafelek</p>
        <h2 class="mt-2 text-3xl font-black">Narzędzia w tym centrum</h2>
        <p class="mt-3 text-slate-600 dark:text-slate-400">Skróty prowadzą od razu do odpowiedniej aplikacji, a tam, gdzie to możliwe, także do właściwego trybu pracy.</p>
      </div>
      <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">${cards}
      </div>
    </section>
    <section class="border-t border-slate-200 bg-white px-6 py-12 dark:border-slate-800 dark:bg-slate-900/50">
      <div class="mx-auto max-w-6xl">
        <h2 class="text-xl font-black">Inne centra EduBox</h2>
        <div class="mt-5 flex flex-wrap gap-3">${centerLinks}</div>
      </div>
    </section>
  </main>
</body>
</html>
`.replace(/[ \t]+$/gm, '');
}

const stale = [];
for (const center of data.CENTERS || []) {
  const target = path.join(root, center.url);
  const expected = render(center);
  const actual = fs.existsSync(target) ? fs.readFileSync(target, 'utf8').replace(/\r\n/g, '\n') : '';
  if (actual !== expected) {
    if (checkOnly) stale.push(center.url);
    else fs.writeFileSync(target, expected, 'utf8');
  }
}

if (stale.length) {
  console.error(`[Centra] Nieaktualne lub brakujące: ${stale.join(', ')}. Uruchom npm run centers:generate.`);
  process.exitCode = 1;
} else {
  console.log(`[Centra] ${checkOnly ? 'OK — aktualne' : 'Wygenerowano'}: ${(data.CENTERS || []).map(center => center.url).join(', ')}.`);
}

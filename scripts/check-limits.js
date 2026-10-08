// Limit dzienny tylko na generowanie przez AI (decyzja właściciela 8.10.2026). Druk i publikacja w Giełdzie nie
// zużywają puli, a narzędzia bez AI nie mają limitów w ogóle (kafelek: „Zawsze za darmo”, freeForever w apps.js).
// Wcześniej: zakręcenie kołem w EduGrupach, druk w EduGrach/EduBystrzaku/EduGeneratorze i publikacja w 8 narzędziach
// zabierały 1 z 5 dziennych generowań całego EduBoxa. EduGrupy nie publikują list klas (imiona uczniów).
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
let ok = 0, fail = 0;
const check = (name, cond, extra) => { if (cond) { ok++; console.log('✅ ' + name); } else { fail++; console.log('❌ ' + name + (extra ? '  → ' + extra : '')); } };

// Skaner nawiasów z pominięciem napisów, szablonów, komentarzy i wyrażeń regularnych
function isRegexStart(src, k) { let j = k - 1; while (j >= 0 && /\s/.test(src[j])) j--; return j < 0 || /[(,=:[!&|?{};+\-*%<>~^]/.test(src[j]); }
function skipRegex(src, k) { let inClass = false; for (k++; k < src.length; k++) { const c = src[k]; if (c === '\\') { k++; continue; } if (c === '\n') return k; if (inClass) { if (c === ']') inClass = false; continue; } if (c === '[') { inClass = true; continue; } if (c === '/') { while (/[a-z]/i.test(src[k + 1] || '')) k++; return k; } } return k; }
function skipString(src, k, q) { for (k++; k < src.length; k++) { if (src[k] === '\\') { k++; continue; } if (src[k] === q || src[k] === '\n') return k; } return k; }
function skipTemplate(src, k) { for (k++; k < src.length; k++) { if (src[k] === '\\') { k++; continue; } if (src[k] === '`') return k; if (src[k] === '$' && src[k + 1] === '{') k = matchBracket(src, k + 1); } return k; }
function matchBracket(src, i) {
  let depth = 0;
  for (let k = i; k < src.length; k++) {
    const c = src[k];
    if (c === '/' && src[k + 1] === '/') { k = src.indexOf('\n', k); if (k < 0) return src.length; continue; }
    if (c === '/' && src[k + 1] === '*') { k = src.indexOf('*/', k + 2) + 1; continue; }
    if (c === '/' && isRegexStart(src, k)) { k = skipRegex(src, k); continue; }
    if (c === '"' || c === "'") { k = skipString(src, k, c); continue; }
    if (c === '`') { k = skipTemplate(src, k); continue; }
    if ('({['.includes(c)) depth++;
    else if (')}]'.includes(c)) { depth--; if (depth === 0) return k; }
  }
  return src.length;
}

const LIMIT = /executeWithLimitCheck|updateAndCheckLimit\(\)/;
const AI = /\/api\/(chat|generate|malarz|ewa-generate|upscale|describe-image)|streamChat\(/;
const pages = fs.readdirSync(ROOT).filter(f => f.endsWith('.html'));
const offenders = [];
const noAiWithLimit = [];
for (const f of pages) {
  const src = fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/\r\n/g, '\n');
  for (const m of src.matchAll(/const (\w*(?:[Pp]rint|[Ss]hare|[Pp]ublish)\w*) = (?:async )?\([^)]*\) => \{/g)) {
    const open = m.index + m[0].length - 1;
    const body = src.slice(open, matchBracket(src, open) + 1);
    if (LIMIT.test(body)) offenders.push(`${f}: ${m[1]}`);
  }
  if (!AI.test(src) && (LIMIT.test(src) || /DAILY_LIMIT|eduboxUsage/.test(src.replace(/\/\/[^\n]*/g, '')))) noAiWithLimit.push(f);
}
check('druk i publikacja (funkcje *Print*/*Share*/*Publish*) nie zużywają dziennej puli', offenders.length === 0, offenders.join(', '));
check('narzędzia bez AI nie mają limitów', noAiWithLimit.length === 0, noAiWithLimit.join(', '));

// Kafelki narzędzi bez AI: „Zawsze za darmo, bez limitów”
global.window = {};
eval(fs.readFileSync(path.join(ROOT, 'apps.js'), 'utf8'));
const apps = global.window.EduBoxData.APPS;
const pageOf = (u) => u.split('?')[0].split('#')[0];
const wrongTiles = apps.filter(a => {
  const p = path.join(ROOT, pageOf(a.url));
  return fs.existsSync(p) && !AI.test(fs.readFileSync(p, 'utf8')) && !a.freeForever;
}).map(a => a.title);
check('kafelki narzędzi bez AI mają freeForever (bez napisu „5 dziennie” i „PRO”)', wrongTiles.length === 0, wrongTiles.join(', '));

// EduGrupy: lista klasy to imiona uczniów – nie trafia do Giełdy
const grupy = fs.readFileSync(path.join(ROOT, 'edugrupy.html'), 'utf8');
check('EduGrupy nie publikują ani nie pokazują list klas z Giełdy', !/saveToGielda|subscribeToGielda/.test(grupy));

console.log(`\n[Limity] ${ok} OK, ${fail} błędów`);
process.exit(fail ? 1 : 0);

// Testy filtra słownikowego EduRymów (api/_lib/wordCheck.js, bez sieci). Uruchom: node api/_lib/wordCheck.test.js
const { cleanWords, foundWords, handleWordCheck } = require('./wordCheck');

let ok = 0, fail = 0;
const check = (name, cond, extra) => {
  if (cond) { ok++; console.log('✅ ' + name); } else { fail++; console.log('❌ ' + name + (extra !== undefined ? '  → ' + JSON.stringify(extra) : '')); }
};
const fakeRes = () => { const r = { code: 0, body: null }; r.status = (c) => { r.code = c; return r; }; r.json = (b) => { r.body = b; return r; }; return r; };

// 1. Wejście
check('małe litery, bez duplikatów, polskie znaki', JSON.stringify(cleanWords(['Kot', 'koc', 'kot', 'żółw'])) === '["kot","koc","żółw"]');
check('odrzuca frazy, znaki specjalne i zapytania', cleanWords(['dwa słowa', 'x|y', '<b>', 'a&b=c', '', null, 123]).length === 0);
check('najwyżej 40 słów', cleanWords(Array.from({ length: 60 }, (_, i) => 'slowo' + 'a'.repeat(i % 30) + String.fromCharCode(97 + (i % 26)))).length <= 40);
check('nie-tablica → pusto', cleanWords('kot').length === 0);

// 2. Odpowiedź API Wikimedia
const data = { query: {
  normalized: [{ from: 'koc_', to: 'koc ' }],
  redirects: [{ from: 'kotek', to: 'kot' }],
  pages: { '1': { title: 'kot', categories: [{ title: 'Kategoria:polski (indeks)' }] }, '2': { title: 'koc', categories: [{ title: 'Kategoria:polski (indeks)' }] },
    '3': { title: 'basa' }, '-1': { title: 'fasola', missing: '' }, '-2': { title: 'zła', invalid: '' } }
} };
check('polskie hasła i przekierowania; brakujące odrzucone', JSON.stringify(foundWords(data, ['kot', 'kotek', 'koc', 'fasola', 'zła'])) === '["kot","kotek","koc"]', foundWords(data, ['kot', 'kotek', 'koc', 'fasola', 'zła']));
check('strona bez polskiej kategorii (słowo obce, np. „basa”) odrzucona', foundWords(data, ['basa']).length === 0);
check('pusta odpowiedź → nic', foundWords({}, ['kot']).length === 0);

(async () => {
// 3. Obsługa żądania (atrapa fetch – bez sieci)
let called = null;
const okFetch = async (url, opts) => { called = { url, opts }; return { ok: true, json: async () => data }; };
let res = fakeRes();
await handleWordCheck({ body: { words: ['kot', 'basa', 'kotek'] } }, res, okFetch);
check('zwraca istniejące słowa', res.code === 200 && JSON.stringify(res.body.found) === '["kot","kotek"]', res.body);
check('pyta pl.wiktionary.org z User-Agentem EduBox (zasady Wikimedia)', called.url.startsWith('https://pl.wiktionary.org/w/api.php?') && /EduBoxAI/.test(called.opts.headers['User-Agent']) && called.url.includes('redirects=1'));
check('pyta tylko o kategorie polskich haseł i form', called.url.includes('prop=categories') && decodeURIComponent(called.url).includes('Kategoria:polski (indeks)') && decodeURIComponent(called.url).includes('Formy czasowników polskich'));
res = fakeRes();
await handleWordCheck({ body: { words: [] } }, res, okFetch);
check('brak słów → 400', res.code === 400);
res = fakeRes();
await handleWordCheck({ body: { words: ['kot'] } }, res, async () => { throw new Error('sieć'); });
check('błąd sieci → found: null (przeglądarka przepuszcza i mówi o tym)', res.code === 200 && res.body.found === null);
res = fakeRes();
await handleWordCheck({ body: { words: ['kot'] } }, res, async () => ({ ok: false, status: 503 }));
check('błąd serwera słownika → found: null', res.body.found === null);

console.log(`\n[Słownik rymów] ${ok} OK, ${fail} błędów`);
process.exit(fail ? 1 : 0);
})();

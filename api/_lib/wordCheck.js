// EduRymy: czy słowa (kandydaci na rymy) mają hasło w Wikisłowniku – twardy filtr zmyślonych słów niezależny od AI.
// Pytamy z serwera, nie z przeglądarki: CSP strony (connect-src) blokowało pl.wiktionary.org, więc filtr w przeglądarce
// po cichu przepuszczał wszystko, a przy okazji Wikimedia nie dostaje adresu IP nauczyciela.
// Plik w api/_lib – nie liczy się do limitu 12 funkcji Vercel (wywołuje go api/chat.js z mode: 'slownik').

const WIKI_URL = 'https://pl.wiktionary.org/w/api.php';
// Tylko pojedyncze polskie słowa (z łącznikiem) – żadnych znaków sterujących ani zapytań w treści.
const WORD_RE = /^[a-ząćęłńóśźż][a-ząćęłńóśźż-]{0,39}$/i;
const MAX_WORDS = 40; // API Wikimedia przyjmuje do 50 tytułów naraz

function cleanWords(input) {
  if (!Array.isArray(input)) return [];
  const out = [];
  for (const w of input) {
    const t = String(w == null ? '' : w).trim().toLowerCase();
    if (WORD_RE.test(t) && !out.includes(t)) out.push(t);
    if (out.length >= MAX_WORDS) break;
  }
  return out;
}

// Słowa z pytania, które mają stronę – z uwzględnieniem normalizacji i przekierowań zwracanych przez API.
function foundWords(data, asked) {
  const q = (data && data.query) || {};
  const existing = new Set();
  Object.values(q.pages || {}).forEach(p => {
    if (p && p.missing === undefined && p.invalid === undefined && p.title) existing.add(String(p.title).toLowerCase());
  });
  const hop = new Map();
  (q.normalized || []).forEach(n => hop.set(String(n.from).toLowerCase(), String(n.to).toLowerCase()));
  (q.redirects || []).forEach(r => hop.set(String(r.from).toLowerCase(), String(r.to).toLowerCase()));
  return asked.filter(w => {
    let t = w;
    for (let i = 0; i < 3 && !existing.has(t) && hop.has(t); i++) t = hop.get(t);
    return existing.has(t);
  });
}

// found: lista istniejących słów; null = słownik niedostępny (przeglądarka przepuszcza wtedy słowa dalej,
// ale mówi o tym nauczycielowi – kolejny krok AI i tak je ocenia).
async function handleWordCheck(req, res, fetchImpl = fetch) {
  const words = cleanWords(req.body && req.body.words);
  if (!words.length) return res.status(400).json({ message: 'Brak słów do sprawdzenia' });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const url = `${WIKI_URL}?action=query&format=json&redirects=1&titles=${encodeURIComponent(words.join('|'))}`;
    const r = await fetchImpl(url, {
      headers: { 'User-Agent': 'EduBoxAI/1.0 (https://eduboxpro.pl; slownik rymow dla nauczycieli)' },
      signal: controller.signal
    });
    if (!r.ok) return res.status(200).json({ found: null });
    const data = await r.json();
    return res.status(200).json({ found: foundWords(data, words) });
  } catch (e) {
    return res.status(200).json({ found: null });
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { cleanWords, foundWords, handleWordCheck };

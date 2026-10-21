// Teczka podopiecznych – rdzeń bez interfejsu (szyfrowanie, model danych, anonimizacja danych wysyłanych do AI).
// Zwykły skrypt: w przeglądarce window.EduPodopieczni, w Node module.exports (testy: scripts/check-podopieczni.js).
//
// ZASADY (od 21.10.2026, prywatne narzędzie dla wychowawczyni przedszkola specjalnego):
// - Dane dzieci są TYLKO w przeglądarce, zaszyfrowane hasłem (PBKDF2-SHA256 + AES-GCM 256, Web Crypto).
//   Żadnego serwera, Firebase ani chmury. Bez hasła nie da się ich odczytać – także po kopii zapasowej.
// - Do AI idzie wyłącznie anonimowy opis: bez imienia, nazwiska, zdrobnienia, daty urodzenia, PESEL, numerów
//   orzeczeń i nazw poradni. Imię wstawia przeglądarka dopiero na kartce dokumentu (EduDocTools.fillName).
// - Strona pokazuje DOKŁADNIE to, co zostanie wysłane („Co trafi do AI”), zanim cokolwiek wyjdzie z komputera.
(function () {
  const root = typeof window !== 'undefined' ? window : globalThis;
  const subtle = () => {
    const c = root.crypto || (typeof globalThis !== 'undefined' && globalThis.crypto);
    if (!c || !c.subtle) throw new Error('Ta przeglądarka nie obsługuje szyfrowania (Web Crypto). Użyj aktualnego Chrome, Edge albo Firefoksa.');
    return c.subtle;
  };
  const randomBytes = (n) => {
    const a = new Uint8Array(n);
    (root.crypto || globalThis.crypto).getRandomValues(a);
    return a;
  };

  const VAULT_KEY = 'eduboxPodopieczniV1';
  const ITERATIONS = 310000;
  const DAY_MS = 24 * 60 * 60 * 1000;
  const SOON_DAYS = 60;

  // ---------- base64 (przeglądarka i Node) ----------
  function toB64(bytes) {
    let s = '';
    const u = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
    return btoa(s);
  }
  function fromB64(b64) {
    const s = atob(String(b64 || ''));
    const u = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i);
    return u;
  }

  // ---------- szyfrowanie ----------
  async function deriveKey(password, salt, iterations) {
    if (!password || String(password).length < 8) throw new Error('Hasło musi mieć co najmniej 8 znaków.');
    const base = await subtle().importKey('raw', new TextEncoder().encode(String(password)), 'PBKDF2', false, ['deriveKey']);
    return subtle().deriveKey(
      { name: 'PBKDF2', salt, iterations: iterations || ITERATIONS, hash: 'SHA-256' },
      base,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  // Nowy sejf: klucz zostaje tylko w pamięci otwartej karty (sesja), nigdy w localStorage.
  async function createSession(password) {
    const salt = randomBytes(16);
    return { key: await deriveKey(password, salt, ITERATIONS), salt, iterations: ITERATIONS };
  }

  async function seal(data, session) {
    const iv = randomBytes(12);
    const plain = new TextEncoder().encode(JSON.stringify(data));
    const ct = await subtle().encrypt({ name: 'AES-GCM', iv }, session.key, plain);
    return { v: 1, app: 'edubox-podopieczni', kdf: 'PBKDF2-SHA256', iter: session.iterations, salt: toB64(session.salt), iv: toB64(iv), ct: toB64(new Uint8Array(ct)), saved: new Date().toISOString() };
  }

  // Złe hasło = AES-GCM odrzuca dane (uwierzytelnione szyfrowanie), więc nie ma „częściowego” odczytu.
  async function open(blob, password) {
    if (!blob || blob.app !== 'edubox-podopieczni' || !blob.ct) throw new Error('To nie jest plik Teczki podopiecznych.');
    const salt = fromB64(blob.salt);
    const key = await deriveKey(password, salt, blob.iter);
    let plain;
    try {
      plain = await subtle().decrypt({ name: 'AES-GCM', iv: fromB64(blob.iv) }, key, fromB64(blob.ct));
    } catch (e) {
      throw new Error('Nieprawidłowe hasło.');
    }
    return { data: migrate(JSON.parse(new TextDecoder().decode(plain))), session: { key, salt, iterations: blob.iter } };
  }

  // ---------- model danych ----------
  const PROGRAMY = [
    { id: 'ks', label: 'Kształcenie specjalne (orzeczenie)' },
    { id: 'wwrd', label: 'Wczesne wspomaganie (WWRD)' },
    { id: 'zazyciem', label: 'Program „Za życiem”' }
  ];
  const RODZAJE_DOKUMENTOW = [
    { id: 'orzeczenie', label: 'Orzeczenie o potrzebie kształcenia specjalnego' },
    { id: 'opinia_wwrd', label: 'Opinia o potrzebie wczesnego wspomagania' },
    { id: 'opinia', label: 'Opinia poradni' },
    { id: 'ipet', label: 'IPET' },
    { id: 'wopfu', label: 'WOPFU' },
    { id: 'ipww', label: 'IPWW' },
    { id: 'inne', label: 'Inny dokument' }
  ];

  const uid = () => toB64(randomBytes(9)).replace(/[+/=]/g, '').slice(0, 12);
  const nowIso = () => new Date().toISOString();

  function emptyVault() {
    return { version: 1, children: [], settings: { placowka: 'przedszkole', oddzial: 'specjalny' } };
  }

  function newChild() {
    return {
      id: uid(), imie: '', nazwisko: '', zdrobnienie: '', plec: '', dataUr: '', grupa: '',
      programy: [], orzeczenie: '', rozpoznanie: '', mocneStrony: '', trudnosci: '', zalecenia: '',
      dokumenty: [], terminy: [], notatki: [], wygenerowane: [],
      utworzono: nowIso(), zmieniono: nowIso()
    };
  }

  // Starszy albo niekompletny zapis → pełny kształt (żeby interfejs nigdy nie trafił na undefined).
  function migrate(v) {
    const out = Object.assign(emptyVault(), v || {});
    out.settings = Object.assign(emptyVault().settings, out.settings || {});
    out.children = (Array.isArray(out.children) ? out.children : []).map(c => {
      const base = newChild();
      const m = Object.assign(base, c || {});
      ['programy', 'dokumenty', 'terminy', 'notatki', 'wygenerowane'].forEach(k => { if (!Array.isArray(m[k])) m[k] = []; });
      return m;
    });
    return out;
  }

  const fullName = (c) => [c && c.imie, c && c.nazwisko].filter(Boolean).join(' ').trim();

  // ---------- wiek i terminy ----------
  function parseDate(s) {
    const t = String(s || '').trim();
    let m = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return Date.UTC(+m[1], +m[2] - 1, +m[3]);
    m = t.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (m) return Date.UTC(+m[3], +m[2] - 1, +m[1]);
    return NaN;
  }

  function ageYears(dataUr, now) {
    const b = parseDate(dataUr);
    if (!Number.isFinite(b)) return '';
    const d = new Date(now == null ? Date.now() : now);
    const bd = new Date(b);
    let y = d.getUTCFullYear() - bd.getUTCFullYear();
    const before = d.getUTCMonth() < bd.getUTCMonth() || (d.getUTCMonth() === bd.getUTCMonth() && d.getUTCDate() < bd.getUTCDate());
    if (before) y--;
    return y >= 0 && y < 30 ? y : '';
  }

  function daysUntil(date, now) {
    const t = parseDate(date);
    if (!Number.isFinite(t)) return null;
    const n = new Date(now == null ? Date.now() : now);
    const today = Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate());
    return Math.round((t - today) / DAY_MS);
  }

  const statusOf = (days) => days == null ? 'brak' : days < 0 ? 'po terminie' : days <= SOON_DAYS ? 'wkrótce' : 'ok';

  // Terminy jednego dziecka: ważność dokumentów + własne terminy (ewaluacja IPET, spotkanie zespołu…).
  function deadlines(child, now) {
    const c = child || {};
    const out = [];
    (c.dokumenty || []).forEach(d => {
      if (!d || !d.wazneDo) return;
      const rodzaj = (RODZAJE_DOKUMENTOW.find(r => r.id === d.rodzaj) || {}).label || 'Dokument';
      const days = daysUntil(d.wazneDo, now);
      out.push({ childId: c.id, kind: 'dokument', label: `${rodzaj} – ważne do`, date: d.wazneDo, days, status: statusOf(days) });
    });
    (c.terminy || []).forEach(t => {
      if (!t || !t.data || t.zrobione) return;
      const days = daysUntil(t.data, now);
      out.push({ childId: c.id, kind: 'termin', label: t.co || 'Termin', date: t.data, days, status: statusOf(days) });
    });
    return out.filter(x => x.days != null).sort((a, b) => a.days - b.days);
  }

  // Na ekran główny: tylko to, co wymaga uwagi (po terminie albo w ciągu 60 dni), najpilniejsze najpierw.
  function alerts(children, now) {
    return (children || [])
      .flatMap(c => deadlines(c, now).map(d => Object.assign({ name: fullName(c) || 'Bez imienia' }, d)))
      .filter(d => d.status === 'po terminie' || d.status === 'wkrótce')
      .sort((a, b) => a.days - b.days);
  }

  // ---------- anonimizacja ----------
  // Warianty imienia: imię, nazwisko (też dwuczłonowe), zdrobnienia (po przecinku). Krótsze niż 3 litery pomijamy.
  function nameVariants(child) {
    const c = child || {};
    return [c.imie, c.nazwisko, c.zdrobnienie]
      .flatMap(x => String(x || '').split(/[\s,;/-]+/))
      .map(x => x.trim().toLocaleLowerCase('pl'))
      .filter(x => x.length >= 3)
      .filter((x, i, a) => a.indexOf(x) === i);
  }

  // Czy słowo jest odmianą jednego z wariantów (Kasia → Kasi, Kasię, Kasią; Kowalski → Kowalskiego; Ola → Oli, Olą).
  // Celowo wolimy podmienić o jedno słowo za dużo niż wysłać imię – i tak widać wszystko w podglądzie „Co trafi do AI”.
  function matchesVariant(word, variants) {
    const w = word.toLocaleLowerCase('pl');
    return variants.some(v => {
      if (w === v) return true;
      const stem = v.length <= 4 ? v.slice(0, -1) : v.slice(0, Math.max(4, v.length - 2));
      const maxLen = v.length <= 4 ? v.length + 1 : v.length + 4;
      return stem.length >= 2 && w.startsWith(stem) && w.length <= maxLen && w.length >= stem.length + (v.length <= 4 ? 1 : 0);
    });
  }

  function formatDatePl(iso) {
    const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? `${m[3]}.${m[2]}.${m[1]}` : '';
  }

  // Teksty z karty dziecka, które identyfikują je przez dokumenty: numery orzeczeń/opinii, poradnie, grupa.
  // Realny przypadek z testu: „Zalecenia z orzeczenia nr 123/2025…” przepisane do pola zaleceń.
  function identifyingPhrases(child) {
    const c = child || {};
    const out = [];
    (c.dokumenty || []).forEach(d => {
      if (d && String(d.numer || '').trim().length >= 2) out.push([String(d.numer).trim(), '[numer]']);
      if (d && String(d.poradnia || '').trim().length >= 3) out.push([String(d.poradnia).trim(), '[poradnia]']);
    });
    if (String(c.grupa || '').trim().length >= 3) out.push([String(c.grupa).trim(), '[grupa]']);
    return out.sort((a, b) => b[0].length - a[0].length);
  }
  const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // „nr 123/2025”, „numer W/45/2024”, „nr. 7-2026” → „nr [numer]” (zawsze z cyfrą, żeby nie ruszać zwykłych słów).
  const DOC_NO_RE = /(^|[^\p{L}])(nr\.?|numer|numerem|numeru)\s*(?=[\p{L}\d/.\-]*\d)[\p{L}\d][\p{L}\d/.\-]*/giu;

  // Granice słowa bez \b (nie zna polskich liter) i bez lookbehind (stare Safari na szkolnych iPadach).
  function scrub(text, child) {
    let t = String(text || '');
    if (!t.trim()) return '';
    identifyingPhrases(child).forEach(([phrase, token]) => { t = t.replace(new RegExp(escapeRe(phrase), 'giu'), token); });
    t = t.replace(DOC_NO_RE, (m, pre, word) => `${pre}${word} [numer]`);
    const variants = nameVariants(child);
    if (variants.length) t = t.replace(/[\p{L}]+/gu, (w) => matchesVariant(w, variants) ? '[imię]' : w);
    t = t.replace(/(^|[^\d])\d{11}(?!\d)/g, '$1[PESEL]');
    const du = child && child.dataUr;
    if (du) {
      [du, formatDatePl(du), formatDatePl(du).replace(/^0/, '').replace(/\.0/, '.')]
        .filter(Boolean)
        .forEach(d => { t = t.split(d).join('[data urodzenia]'); });
    }
    return t.replace(/\[imię\](\s+\[imię\])+/g, '[imię]').trim();
  }

  // Notatki z obserwacji (najnowsze najpierw), już bez imion – materiał źródłowy dla dokumentu.
  function notesText(child, limit) {
    return (child.notatki || [])
      .slice()
      .sort((a, b) => String(b.data).localeCompare(String(a.data)))
      .slice(0, limit || 20)
      .map(n => `- ${formatDatePl(n.data) || 'bez daty'}: ${scrub(n.tekst, child)}`)
      .join('\n');
  }

  // Dane wejściowe dla EduAsystentDocs.buildUserPrompt – WYŁĄCZNIE pola bez tożsamości.
  // Imię, nazwisko, zdrobnienie, data urodzenia, grupa, numery dokumentów, poradnie i daty ważności nie wychodzą.
  function aiInput(child, opts) {
    const c = child || {};
    const o = opts || {};
    const age = ageYears(c.dataUr, o.now);
    const ageTxt = age === '' ? '' : `Wiek: ${age} ${age === 1 ? 'rok' : (age % 10 >= 2 && age % 10 <= 4 && (age % 100 < 10 || age % 100 >= 20)) ? 'lata' : 'lat'}. `;
    const programy = (c.programy || []).map(p => (PROGRAMY.find(x => x.id === p) || {}).label).filter(Boolean);
    const files = [
      programy.length ? `OBJĘTE FORMY WSPARCIA: ${programy.join('; ')}` : '',
      c.zalecenia ? `ZALECENIA Z ORZECZENIA / OPINII (przepisane przez nauczyciela):\n${scrub(c.zalecenia, c)}` : '',
      o.withNotes !== false && (c.notatki || []).length ? `NOTATKI Z OBSERWACJI:\n${notesText(c, o.notesLimit)}` : '',
      o.extra ? `DODATKOWE INFORMACJE OD NAUCZYCIELA:\n${scrub(o.extra, c)}` : ''
    ].filter(Boolean).join('\n\n');
    const common = {
      diagnoza: (ageTxt + scrub(c.rozpoznanie, c)).trim(),
      mocneStrony: scrub(c.mocneStrony, c),
      trudnosci: scrub(c.trudnosci, c),
      files
    };
    if (o.module === 'wwrd') {
      return Object.assign({ module: 'wwrd', docType: o.docType, ageGroup: age === '' ? '' : String(age), cel: scrub(o.cel, c) }, common);
    }
    return Object.assign({
      module: 'dokumenty', docType: o.docType, etap: 'przedszkole', klasa: '',
      oddzial: o.oddzial || 'specjalny', orzeczenie: c.orzeczenie || '',
      plec: c.plec === 'k' ? 'uczennica' : c.plec === 'm' ? 'uczen' : ''
    }, common);
  }

  // Pytanie o radę (EduSosPrompts): opis sytuacji bez imion + wiek.
  function adviceText(child, question) {
    const c = child || {};
    const age = ageYears(c.dataUr);
    const ctx = [
      age === '' ? '' : `Dziecko w wieku ${age} lat, przedszkole specjalne.`,
      c.rozpoznanie ? `Funkcjonowanie (słowami nauczyciela): ${scrub(c.rozpoznanie, c)}` : '',
      c.trudnosci ? `Trudności: ${scrub(c.trudnosci, c)}` : '',
      c.mocneStrony ? `Mocne strony: ${scrub(c.mocneStrony, c)}` : ''
    ].filter(Boolean).join('\n');
    return `${ctx}\n\nPytanie / sytuacja:\n${scrub(question, c)}`.trim();
  }

  // Ostatnia linia obrony przed wysłaniem: czy w tekście nie został żaden wariant imienia albo PESEL.
  function leaks(text, child) {
    const t = String(text || '');
    const found = [];
    const variants = nameVariants(child);
    (t.match(/[\p{L}]+/gu) || []).forEach(w => { if (variants.length && matchesVariant(w, variants)) found.push(w); });
    if (/(^|[^\d])\d{11}(?!\d)/.test(t)) found.push('PESEL');
    const lower = t.toLocaleLowerCase('pl');
    identifyingPhrases(child).forEach(([phrase]) => { if (lower.includes(phrase.toLocaleLowerCase('pl'))) found.push(phrase); });
    (child && child.dataUr ? [child.dataUr, formatDatePl(child.dataUr)] : []).filter(Boolean).forEach(d => { if (t.includes(d)) found.push(d); });
    return found.filter((x, i, a) => a.indexOf(x) === i);
  }

  const api = {
    VAULT_KEY, ITERATIONS, SOON_DAYS, PROGRAMY, RODZAJE_DOKUMENTOW,
    toB64, fromB64, createSession, seal, open,
    emptyVault, newChild, migrate, fullName, uid,
    parseDate, ageYears, daysUntil, deadlines, alerts, formatDatePl,
    nameVariants, scrub, notesText, aiInput, adviceText, leaks
  };
  if (typeof window !== 'undefined') window.EduPodopieczni = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();

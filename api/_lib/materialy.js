// Ścieżki obrazków podglądu w Bazie Materiałów. Podgląd jest PUBLICZNY (bez kodu PRO), więc
// endpoint może oddać wyłącznie pliki z katalogu podglady/ o ściśle określonej nazwie – nigdy
// pliki pakietów (materialy/…), które są dostępne tylko z ważnym kodem.
const PREVIEW_PATH = /^podglady\/[A-Za-z0-9_-]{1,80}\.jpg$/;

function isPreviewPath(path) {
  return typeof path === 'string' && PREVIEW_PATH.test(path);
}

// Wgrywać można tylko do dwóch katalogów: pliki pakietów i obrazki podglądu.
function isUploadPath(path) {
  return typeof path === 'string'
    && !path.includes('..')
    && (/^materialy\/[^/]{1,200}$/.test(path) || isPreviewPath(path));
}

// ---- Zapis katalogu przez serwer (od 16.10.2026) ----
// Reguły Firestore nie pozwalają anonimowym użytkownikom zmieniać katalogu (i dobrze – katalog jest publiczny),
// więc panel zapisuje pakiety przez /api/verify-code (akcja „materialy-zapisz”, tylko z Basic Auth), a serwer
// pisze do Firestore kontem usługi. Tu: biała lista pól i zamiana na format REST Firestore.
const SEKCJE = ['przedszkole', 'klasy-1-3', 'klasy-4-8', 'inne'];

function tekst(v, max) {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

function liczba(v) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : 0;
}

function obrazek(o) {
  if (!o || !isPreviewPath(o.path)) return null;
  const wynik = { path: o.path, w: liczba(o.w), h: liczba(o.h) };
  if (o.strona) wynik.strona = liczba(o.strona);
  return wynik;
}

// Zwraca tylko dozwolone pola; pola, których nie podano, pomija (żeby update zmieniał tylko to, co trzeba).
function sanitizePakiet(dane) {
  const d = dane || {};
  const wynik = {};
  if ('title' in d) wynik.title = tekst(d.title, 200);
  if ('opis' in d) wynik.opis = tekst(d.opis, 2000);
  if ('kategoria' in d) wynik.kategoria = tekst(d.kategoria, 120);
  if ('sekcja' in d) {
    if (!SEKCJE.includes(d.sekcja)) throw new Error('Nieznana sekcja.');
    wynik.sekcja = d.sekcja;
  }
  if ('pliki' in d) {
    if (!Array.isArray(d.pliki)) throw new Error('Pliki muszą być listą.');
    wynik.pliki = d.pliki.slice(0, 50).map((p) => {
      if (!p || typeof p.path !== 'string' || !/^materialy\/[^/]{1,200}$/.test(p.path) || p.path.includes('..')) throw new Error('Nieprawidłowa ścieżka pliku.');
      return { name: tekst(p.name, 200), size: liczba(p.size), path: p.path };
    });
  }
  if ('podglad' in d) {
    if (!Array.isArray(d.podglad)) throw new Error('Podgląd musi być listą.');
    wynik.podglad = d.podglad.slice(0, 12).map(obrazek).filter(Boolean);
  }
  if ('okladka' in d) wynik.okladka = d.okladka ? obrazek(d.okladka) : null;
  if ('stron' in d) wynik.stron = liczba(d.stron);
  return wynik;
}

function toValue(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (v instanceof Date) return { timestampValue: v.toISOString() };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toValue) } };
  if (typeof v === 'object') return { mapValue: { fields: toFields(v) } };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  return { stringValue: String(v) };
}

function toFields(obj) {
  const fields = {};
  Object.keys(obj).forEach((k) => { fields[k] = toValue(obj[k]); });
  return fields;
}

const FIRESTORE_DOCS = 'https://firestore.googleapis.com/v1/projects/edubox-pro/databases/(default)/documents';
const KATALOG_PATH = 'artifacts/eduboxpro/public/data/materialy_katalog';
const DOC_ID = /^[A-Za-z0-9_-]{1,100}$/;

// ---- Duże pliki (od 16.10.2026) ----
// Vercel przyjmuje i oddaje najwyżej ~4,5 MB w jednym zapytaniu (HTTP 413). Dlatego pliki pakietów nie
// przechodzą już przez funkcję: pobieranie = krótko ważny podpisany link V4 do Cloud Storage (przeglądarka
// pobiera plik bezpośrednio), wgrywanie = sesja „resumable” otwarta przez serwer, do której przeglądarka
// wysyła plik sama (PUT).
const crypto = require('crypto');

function rfc3986(str) {
  return encodeURIComponent(str).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

function signedGetUrl({ bucket, path, clientEmail, privateKey, fileName, now = new Date(), expiresSeconds = 300 }) {
  const iso = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); // 20261016T150000Z
  const date = iso.slice(0, 8);
  const scope = `${date}/auto/storage/goog4_request`;
  const params = {
    'X-Goog-Algorithm': 'GOOG4-RSA-SHA256',
    'X-Goog-Credential': `${clientEmail}/${scope}`,
    'X-Goog-Date': iso,
    'X-Goog-Expires': String(expiresSeconds),
    'X-Goog-SignedHeaders': 'host',
  };
  if (fileName) params['response-content-disposition'] = `attachment; filename*=UTF-8''${rfc3986(fileName)}`;
  const query = Object.keys(params).sort().map((k) => `${rfc3986(k)}=${rfc3986(params[k])}`).join('&');
  const resource = `/${bucket}/${path.split('/').map(rfc3986).join('/')}`;
  const canonical = ['GET', resource, query, 'host:storage.googleapis.com', '', 'host', 'UNSIGNED-PAYLOAD'].join('\n');
  const toSign = ['GOOG4-RSA-SHA256', iso, scope, crypto.createHash('sha256').update(canonical).digest('hex')].join('\n');
  const signature = crypto.createSign('RSA-SHA256').update(toSign).sign(privateKey, 'hex');
  return `https://storage.googleapis.com${resource}?${query}&X-Goog-Signature=${signature}`;
}

// Origin, z którego przeglądarka wyśle plik do sesji resumable (Cloud Storage zwraca nagłówki CORS
// tylko dla originu podanego przy otwieraniu sesji). Tylko nasza domena i podglądy Vercela.
function allowedOrigin(origin) {
  return typeof origin === 'string' && /^https:\/\/((www\.)?eduboxpro\.pl|[a-z0-9-]+\.vercel\.app)$/.test(origin) ? origin : 'https://eduboxpro.pl';
}

module.exports = { signedGetUrl, allowedOrigin, rfc3986, PREVIEW_PATH, isPreviewPath, isUploadPath, SEKCJE, sanitizePakiet, toFields, FIRESTORE_DOCS, KATALOG_PATH, DOC_ID };

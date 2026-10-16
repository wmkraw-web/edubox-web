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

module.exports = { PREVIEW_PATH, isPreviewPath, isUploadPath, SEKCJE, sanitizePakiet, toFields, FIRESTORE_DOCS, KATALOG_PATH, DOC_ID };

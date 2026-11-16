'use strict';

// Lista mailingowa – zapis po stronie serwera (od 16.11.2026).
//
// Wcześniej przeglądarka pisała adres prosto do Firestore, do kolekcji
// artifacts/eduboxpro/public/data/newsletter_signups. Cała gałąź public/data jest czytelna dla
// każdego (tak działa Giełda Wzorów), więc ADRESY E-MAIL DAŁO SIĘ ODCZYTAĆ BEZ LOGOWANIA.
// Teraz zapis idzie przez /api/verify-code (akcja newsletter-zapisz) kontem usługi do kolekcji
// newsletter_signups na najwyższym poziomie – reguły Firestore nie dają do niej dostępu z przeglądarki
// (sprawdzone 16.11.2026: odczyt bez logowania i z kontem anonimowym = 403).
// Stare wpisy przenosi akcja newsletter-lista (panel, Basic Auth) i usuwa je z miejsca publicznego.

const crypto = require('crypto');

const KOLEKCJA = 'newsletter_signups';
const STARA_KOLEKCJA = 'artifacts/eduboxpro/public/data/newsletter_signups';
const EMAIL_RE = /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[^\s@<>"',;]{2,}$/;

function normalizeEmail(value) {
  const email = String(value == null ? '' : value).trim().toLowerCase();
  if (email.length < 6 || email.length > 254 || !EMAIL_RE.test(email)) return null;
  return email;
}

// Identyfikator dokumentu nie zawiera adresu (adres w ścieżce trafiałby do logów).
function docId(email) {
  return crypto.createHash('sha256').update(email).digest('hex').slice(0, 40);
}

const krotki = (v, max) => {
  const s = String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim();
  return s ? s.slice(0, max) : null;
};

// Tylko znane pola, przycięte – reszta body jest ignorowana.
function signupData(body, now) {
  const email = normalizeEmail(body && body.email);
  if (!email) return null;
  return {
    email,
    page: krotki(body.page, 120),
    zrodlo: krotki(body.zrodlo, 40),
    utmSource: krotki(body.utmSource, 80),
    utmMedium: krotki(body.utmMedium, 80),
    utmCampaign: krotki(body.utmCampaign, 80),
    createdAt: now || new Date(),
  };
}

// Dokument Firestore (REST) → płaski wpis listy.
function fromDocument(doc) {
  const f = (doc && doc.fields) || {};
  const text = (k) => (f[k] && typeof f[k].stringValue === 'string' ? f[k].stringValue : '');
  return {
    email: text('email'),
    page: text('page'),
    zrodlo: text('zrodlo'),
    utmSource: text('utmSource'),
    createdAt: (f.createdAt && (f.createdAt.timestampValue || f.createdAt.stringValue)) || '',
  };
}

module.exports = { KOLEKCJA, STARA_KOLEKCJA, normalizeEmail, docId, signupData, fromDocument };

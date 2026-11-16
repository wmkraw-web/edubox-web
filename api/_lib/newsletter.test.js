'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { KOLEKCJA, STARA_KOLEKCJA, normalizeEmail, docId, signupData, fromDocument } = require('./newsletter.js');

assert.strictEqual(normalizeEmail('  Anna.Kowalska@Szkola.PL '), 'anna.kowalska@szkola.pl');
for (const zly of ['', 'anna', 'anna@', '@szkola.pl', 'anna@szkola', 'a b@szkola.pl', 'anna@szkola.pl, inny@x.pl', '<anna@szkola.pl>', null, undefined, 'x'.repeat(260) + '@a.pl']) {
  assert.strictEqual(normalizeEmail(zly), null, `powinien odrzucić: ${zly}`);
}

const id = docId('anna.kowalska@szkola.pl');
assert.ok(/^[a-f0-9]{40}$/.test(id), 'identyfikator to skrót, nie adres');
assert.ok(!id.includes('anna'));
assert.strictEqual(id, docId('anna.kowalska@szkola.pl'), 'ten sam adres = ten sam dokument (bez duplikatów)');
assert.notStrictEqual(id, docId('inna@szkola.pl'));

const now = new Date('2026-11-16T10:00:00Z');
const d = signupData({ email: 'Anna@Szkola.pl', page: '/index.html', zrodlo: 'wzory', utmSource: 'x'.repeat(200), obce: 'pole', role: 'admin' }, now);
assert.deepStrictEqual(Object.keys(d).sort(), ['createdAt', 'email', 'page', 'utmCampaign', 'utmMedium', 'utmSource', 'zrodlo']);
assert.strictEqual(d.email, 'anna@szkola.pl');
assert.strictEqual(d.utmSource.length, 80);
assert.strictEqual(d.utmCampaign, null);
assert.strictEqual(d.createdAt, now);
assert.strictEqual(signupData({ email: 'nie-mail' }, now), null);
assert.strictEqual(signupData(null, now), null);

assert.deepStrictEqual(
  fromDocument({ fields: { email: { stringValue: 'a@b.pl' }, page: { stringValue: '/x.html' }, createdAt: { timestampValue: '2026-11-16T10:00:00Z' }, utmSource: { nullValue: null } } }),
  { email: 'a@b.pl', page: '/x.html', zrodlo: '', utmSource: '', createdAt: '2026-11-16T10:00:00Z' }
);
assert.deepStrictEqual(fromDocument({}), { email: '', page: '', zrodlo: '', utmSource: '', createdAt: '' });

// Nowa kolekcja nie może leżeć w gałęzi czytelnej publicznie.
assert.ok(!KOLEKCJA.includes('public'), 'kolekcja listy poza public/data');
assert.ok(STARA_KOLEKCJA.includes('/public/data/'));

// Przeglądarka nie może już pisać adresów prosto do Firestore.
const core = fs.readFileSync(path.join(__dirname, '..', '..', 'global-core.js'), 'utf8');
const fn = core.slice(core.indexOf('subscribeNewsletter:'), core.indexOf('// Giełda Wzorów - ZAPIS'));
assert.ok(fn.includes("action: 'newsletter-zapisz'"), 'zapis idzie przez serwer');
assert.ok(!/setDoc|newsletter_signups/.test(fn), 'bez zapisu do Firestore z przeglądarki');

console.log('newsletter.test OK');

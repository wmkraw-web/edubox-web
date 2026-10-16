// Testy ścieżek Bazy Materiałów (bez sieci). Uruchom: node api/_lib/materialy.test.js
const assert = require('assert');
const { isPreviewPath, isUploadPath, sanitizePakiet, toFields } = require('./materialy');

let passed = 0;
let failed = 0;
function test(name, fn) {
    try { fn(); console.log(`✅ ${name}`); passed++; }
    catch (err) { console.log(`❌ ${name}\n   ${err.message}`); failed++; }
}

test('podgląd: tylko podglady/<nazwa>.jpg', () => {
    assert.ok(isPreviewPath('podglady/1729000000000_ab12_3.jpg'));
    assert.ok(!isPreviewPath('materialy/1729_pakiet.pdf'), 'plik pakietu nie może być publiczny');
    assert.ok(!isPreviewPath('podglady/../materialy/x.jpg'));
    assert.ok(!isPreviewPath('podglady/a/b.jpg'));
    assert.ok(!isPreviewPath('podglady/x.pdf'));
    assert.ok(!isPreviewPath(''));
    assert.ok(!isPreviewPath(undefined));
});

test('wgrywanie: pliki pakietów i podgląd, nic poza tym', () => {
    assert.ok(isUploadPath('materialy/1729_Dzień Jeża – przedszkole.pdf'));
    assert.ok(isUploadPath('podglady/1729_ab_1.jpg'));
    assert.ok(!isUploadPath('materialy/../index.html'));
    assert.ok(!isUploadPath('materialy/a/b.pdf'));
    assert.ok(!isUploadPath('inne/x.pdf'));
});

test('zapis katalogu: tylko dozwolone pola i ścieżki', () => {
    const d = sanitizePakiet({ title: ' Dzień Jeża ', sekcja: 'klasy-1-3', podglad: [{ path: 'podglady/1_a_s1.jpg', w: 720, h: 1018, strona: 1 }, { path: 'materialy/x.pdf' }], admin: true });
    assert.deepStrictEqual(Object.keys(d).sort(), ['podglad', 'sekcja', 'title']);
    assert.strictEqual(d.title, 'Dzień Jeża');
    assert.strictEqual(d.podglad.length, 1, 'plik pakietu nie może trafić do publicznego podglądu');
    assert.throws(() => sanitizePakiet({ sekcja: 'vip' }));
    assert.throws(() => sanitizePakiet({ pliki: [{ name: 'x', path: '../x' }] }));
});

test('format REST Firestore', () => {
    const f = toFields({ stron: 31, sekcja: 'inne', okladka: null, createdAt: new Date('2026-10-16T10:00:00Z'), podglad: [{ path: 'p', w: 1 }] });
    assert.deepStrictEqual(f.stron, { integerValue: '31' });
    assert.deepStrictEqual(f.okladka, { nullValue: null });
    assert.deepStrictEqual(f.createdAt, { timestampValue: '2026-10-16T10:00:00.000Z' });
    assert.strictEqual(f.podglad.arrayValue.values[0].mapValue.fields.w.integerValue, '1');
});

console.log(`\n[Materiały – ścieżki] ${passed} OK, ${failed} błędów`);
if (failed) process.exit(1);

// ---- Duże pliki: podpisany link V4 i origin sesji wgrywania ----
{
  const crypto = require('crypto');
  const { signedGetUrl, allowedOrigin } = require('./materialy.js');
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  const pem = privateKey.export({ type: 'pkcs8', format: 'pem' });
  const args = { bucket: 'b.firebasestorage.app', path: 'materialy/1_Pakiet ś.pdf', clientEmail: 'sa@x.iam.gserviceaccount.com', privateKey: pem, fileName: 'Pakiet ś.pdf', now: new Date('2026-10-16T15:00:00Z') };
  const url = signedGetUrl(args);
  const assert = require('assert');
  assert.strictEqual(url, signedGetUrl(args), 'link deterministyczny');
  assert.ok(url.startsWith('https://storage.googleapis.com/b.firebasestorage.app/materialy/1_Pakiet%20%C5%9B.pdf?'), url);
  assert.ok(url.includes('X-Goog-Expires=300'));
  assert.ok(url.includes('X-Goog-Date=20261016T150000Z'));
  assert.ok(url.includes("response-content-disposition=attachment%3B%20filename%2A%3DUTF-8%27%27Pakiet%2520%25C5%259B.pdf"), url);
  const sig = url.split('X-Goog-Signature=')[1];
  assert.match(sig, /^[0-9a-f]{512}$/);
  assert.strictEqual(allowedOrigin('https://eduboxpro.pl'), 'https://eduboxpro.pl');
  assert.strictEqual(allowedOrigin('https://edubox-web-abc.vercel.app'), 'https://edubox-web-abc.vercel.app');
  assert.strictEqual(allowedOrigin('https://zly.pl'), 'https://eduboxpro.pl');
  assert.strictEqual(allowedOrigin(undefined), 'https://eduboxpro.pl');
  void publicKey;
  console.log('materialy: podpisany link i origin – OK');
}

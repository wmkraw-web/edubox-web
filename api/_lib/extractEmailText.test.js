const assert = require('assert');
const { extractEmailText } = require('./extractEmailText');

let passed = 0, failed = 0;
function test(name, fn) {
    try { fn(); console.log(`✅ ${name}`); passed++; }
    catch (e) { console.log(`❌ ${name}\n   ${e.message}`); failed++; }
}

// Prosty, referencyjny koder quoted-printable - używany TYLKO w tych testach do zbudowania
// realistycznych próbek (produkcyjny kod tylko DEKODUJE, koderem się nie zajmuje).
function qpEncode(str) {
    return Buffer.from(str, 'utf-8')
        .toString('latin1')
        .split('')
        .map(ch => {
            const code = ch.charCodeAt(0);
            if (code === 61 || code < 32 || code > 126) {
                return '=' + code.toString(16).toUpperCase().padStart(2, '0');
            }
            return ch;
        })
        .join('');
}

const polishText = 'Wspierający Katarzyna Sęk (wmkraw@gmail.com)\r\nwłaśnie przekazał Ci wsparcie w wysokości 5,00 zł.';

// --- Test 1: prosta wiadomość jednoczęściowa, quoted-printable ---
const simple = [
    'From: Buycoffee <notifications@buycoffee.to>',
    'To: edubox.ai@gmail.com',
    'Subject: Nowe wsparcie',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: quoted-printable',
    '',
    qpEncode(polishText)
].join('\r\n');

test('Wiadomość jednoczęściowa (quoted-printable, polskie znaki) - poprawnie zdekodowana', () => {
    const result = extractEmailText(simple);
    assert.strictEqual(result.replace(/\r\n/g, '\n'), polishText.replace(/\r\n/g, '\n'));
});

// --- Test 2: multipart/alternative (text/plain + text/html), typowe dla maili transakcyjnych ---
const boundary = 'BoundaryABC123';
const multipart = [
    'From: Buycoffee <notifications@buycoffee.to>',
    'To: edubox.ai@gmail.com',
    'Subject: Nowe wsparcie',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: quoted-printable',
    '',
    qpEncode(polishText),
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: quoted-printable',
    '',
    qpEncode(`<html><body><p>${polishText.replace(/\r\n/g, '<br>')}</p></body></html>`),
    '',
    `--${boundary}--`
].join('\r\n');

test('Multipart/alternative - wybiera text/plain (nie html)', () => {
    const result = extractEmailText(multipart);
    assert.strictEqual(result.replace(/\r\n/g, '\n'), polishText.replace(/\r\n/g, '\n'));
});

// --- Test 3: tylko text/html (bez text/plain) - fallback ze zdjętymi tagami ---
const htmlOnlyBoundary = 'BoundaryHTMLOnly';
const htmlOnly = [
    'From: Buycoffee <notifications@buycoffee.to>',
    `Content-Type: multipart/alternative; boundary="${htmlOnlyBoundary}"`,
    '',
    `--${htmlOnlyBoundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: quoted-printable',
    '',
    qpEncode('<p>Wspierający Jan (jan@example.com)</p><p>wysokości 3,00 zł.</p>'),
    '',
    `--${htmlOnlyBoundary}--`
].join('\r\n');

test('Tylko text/html (brak text/plain) - fallback zdejmuje tagi', () => {
    const result = extractEmailText(htmlOnly);
    assert.ok(result.includes('Wspierający Jan (jan@example.com)'));
    assert.ok(result.includes('wysokości 3,00 zł.'));
    assert.ok(!result.includes('<p>'));
});

// --- Test 4: base64 ---
const base64msg = [
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    Buffer.from(polishText, 'utf-8').toString('base64')
].join('\r\n');

test('Base64 - poprawnie zdekodowany', () => {
    const result = extractEmailText(base64msg);
    assert.strictEqual(result.replace(/\r\n/g, '\n'), polishText.replace(/\r\n/g, '\n'));
});

// --- Test 5: pusty / śmieciowy input nie wywala się ---
test('Pusty input - nie wywala się', () => {
    assert.strictEqual(extractEmailText(''), '');
    assert.strictEqual(extractEmailText(null), '');
});

console.log(`\n${passed} zaliczone, ${failed} niezaliczone`);
if (failed > 0) process.exit(1);

const assert = require('assert');
const { extractEmailText } = require('./extractEmailText');

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`✅ ${name}`);
        passed++;
    } catch (e) {
        console.log(`❌ ${name}`);
        console.log(`   ${e.message}`);
        failed++;
    }
}

// --- Prosta wiadomość tekstowa (bez multipart) ---
const simple = [
    'From: powiadomienia@buycoffee.to',
    'To: edubox.ai@gmail.com',
    'Subject: Nowe wsparcie!',
    'Content-Type: text/plain; charset=UTF-8',
    '',
    'Wspierający Jan Kowalski (jan@example.com)',
    'właśnie przekazał Ci wsparcie w wysokości 5,00 zł.'
].join('\r\n');

test('Prosta wiadomość text/plain - wyciąga treść', () => {
    const text = extractEmailText(simple);
    assert.ok(text.includes('Wspierający Jan Kowalski (jan@example.com)'));
    assert.ok(text.includes('5,00 zł'));
});

// --- Wieloczęściowa (multipart/alternative: text/plain + text/html), tak jak realnie wysyła Buycoffee ---
const multipart = [
    'From: powiadomienia@buycoffee.to',
    'To: edubox.ai@gmail.com',
    'Subject: Nowe wsparcie!',
    'Content-Type: multipart/alternative; boundary="BOUNDARY123"',
    '',
    '--BOUNDARY123',
    'Content-Type: text/plain; charset=UTF-8',
    '',
    'Wspierający Anna Nowak (anna@example.com)',
    'właśnie przekazał Ci wsparcie w wysokości 10,00 zł.',
    '',
    '--BOUNDARY123',
    'Content-Type: text/html; charset=UTF-8',
    '',
    '<html><body><p>Wspierający <b>Anna Nowak</b> (anna@example.com)</p><p>wsparcie 10,00 zł</p></body></html>',
    '',
    '--BOUNDARY123--'
].join('\r\n');

test('Wieloczęściowa wiadomość (plain + html) - preferuje text/plain', () => {
    const text = extractEmailText(multipart);
    assert.ok(text.includes('Wspierający Anna Nowak (anna@example.com)'));
    assert.ok(!text.includes('<html>'), 'Nie powinno zawierać znaczników HTML');
});

// --- Tylko HTML (bez text/plain) - fallback ze zdjętymi tagami ---
const htmlOnly = [
    'From: powiadomienia@buycoffee.to',
    'Content-Type: text/html; charset=UTF-8',
    '',
    '<html><body><p>Wspierający Piotr Zi&oacute;łkowski (piotr@example.com)</p><p>wysoko&#347;ci 7,00 z&#322;.</p></body></html>'
].join('\r\n');

test('Wiadomość tylko HTML - zdejmuje tagi jako fallback', () => {
    const text = extractEmailText(htmlOnly);
    assert.ok(text.includes('Wspierający Piotr'));
    assert.ok(!text.includes('<p>'), 'Nie powinno zawierać znaczników HTML');
});

// --- Base64 - dekodowanie ---
const base64Body = Buffer.from('Wspierający Ewa Test (ewa@example.com)\r\nwsparcie 3,00 zł.', 'utf-8').toString('base64');
const base64Msg = [
    'From: powiadomienia@buycoffee.to',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    base64Body
].join('\r\n');

test('Wiadomość zakodowana base64 - poprawnie dekoduje', () => {
    const text = extractEmailText(base64Msg);
    assert.ok(text.includes('Wspierający Ewa Test (ewa@example.com)'));
});

// --- Puste / brakujące dane ---
test('Pusty tekst wejściowy - nie wywala się', () => {
    assert.strictEqual(extractEmailText(''), '');
    assert.strictEqual(extractEmailText(null), '');
});

console.log(`\n${passed} zaliczone, ${failed} niezaliczone`);
if (failed > 0) process.exit(1);

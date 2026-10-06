// Testy minimalizacji danych przed AI (bez sieci). Uruchom: node api/_lib/pii.test.js
const assert = require('assert');
const { isValidPesel, scrubPersonalData } = require('./pii');

let passed = 0;
let failed = 0;
function test(name, fn) {
    try { fn(); console.log(`✅ ${name}`); passed++; }
    catch (err) { console.log(`❌ ${name}\n   ${err.message}`); failed++; }
}

// Numery wygenerowane do testów (poprawna suma kontrolna), nie należą do realnych osób.
const VALID = ['44051401359', '02070803628', '17322601154'];

test('rozpoznaje poprawne numery PESEL (w tym urodzonych po 2000 r.)', () => {
    VALID.forEach(p => assert.strictEqual(isValidPesel(p), true, p));
});

test('odrzuca złą sumę kontrolną i niemożliwą datę', () => {
    assert.strictEqual(isValidPesel('44051401358'), false);
    assert.strictEqual(isValidPesel('44135401359'), false);
    assert.strictEqual(isValidPesel('1234567890'), false);
});

test('usuwa PESEL z tekstu i liczy usunięcia', () => {
    const r = scrubPersonalData(`Uczeń ${VALID[0]}, klasa 2b. Siostra: ${VALID[1]}.`);
    assert.strictEqual(r.removed, 2);
    assert.ok(!r.text.includes(VALID[0]) && !r.text.includes(VALID[1]));
    assert.ok(r.text.includes('[PESEL usunięty]'));
});

test('nie rusza telefonów, kont, kwot, dat i numerów aktów', () => {
    const t = 'Kontakt: 601 234 567, konto szkoły 12 1020 1026 0000 0402 0123 4567, zbiórka 1250 zł, ' +
        'Dz.U. 2026 poz. 428, termin 30.09.2026, numer 12345678901 (zła suma).';
    const r = scrubPersonalData(t);
    assert.strictEqual(r.removed, 0);
    assert.strictEqual(r.text, t);
});

test('nie łapie fragmentu dłuższego ciągu cyfr', () => {
    const t = `ID zamówienia 9${VALID[0]}2`;
    assert.strictEqual(scrubPersonalData(t).text, t);
});

test('bezpieczny dla pustych i nietekstowych wartości', () => {
    assert.deepStrictEqual(scrubPersonalData(''), { text: '', removed: 0 });
    assert.deepStrictEqual(scrubPersonalData(undefined), { text: undefined, removed: 0 });
});

console.log(`\n${passed} ok, ${failed} błędów`);
process.exit(failed ? 1 : 0);

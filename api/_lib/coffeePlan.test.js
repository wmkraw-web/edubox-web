// Testy planu wsparcia (bez sieci). Uruchom: node api/_lib/coffeePlan.test.js
const assert = require('assert');
const { YEAR_CODE_PATTERN, parseAmountPLN, planForAmount, yearCodeUntil } = require('./coffeePlan');

let passed = 0;
let failed = 0;
function test(name, fn) {
    try { fn(); console.log(`✅ ${name}`); passed++; }
    catch (err) { console.log(`❌ ${name}\n   ${err.message}`); failed++; }
}

test('kwoty z maila Buycoffee (przecinek, kropka, spacje)', () => {
    assert.strictEqual(parseAmountPLN('49,00'), 49);
    assert.strictEqual(parseAmountPLN('10'), 10);
    assert.strictEqual(parseAmountPLN('1 000,50'), 1000.5);
    assert.strictEqual(parseAmountPLN('abc'), 0);
    assert.strictEqual(parseAmountPLN(undefined), 0);
});

test('drobna kawa = 7 dni, od 49 zł = rok', () => {
    assert.deepStrictEqual(planForAmount('5,00'), { prefix: 'KAWA', days: 7, label: '7 dni' });
    assert.strictEqual(planForAmount('48,99').days, 7);
    assert.strictEqual(planForAmount('49,00').days, 365);
    assert.strictEqual(planForAmount('100').prefix, 'ROK');
});

test('kod roczny wygasa 365 dni po wygenerowaniu', () => {
    assert.strictEqual(yearCodeUntil('2026-10-06T10:00:00.000Z'), '2027-10-06T10:00:00.000Z');
    assert.strictEqual(yearCodeUntil('nie-data'), null);
});

test('format kodu rocznego', () => {
    assert.ok(YEAR_CODE_PATTERN.test('ROK-1A2B3C4D'));
    assert.ok(!YEAR_CODE_PATTERN.test('KAWA-1A2B3C4D'));
    assert.ok(!YEAR_CODE_PATTERN.test('ROK-1A2B'));
});

console.log(`\n${passed} ok, ${failed} błędów`);
process.exit(failed ? 1 : 0);

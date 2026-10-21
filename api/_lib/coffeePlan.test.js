// Testy planu wsparcia (bez sieci). Uruchom: node api/_lib/coffeePlan.test.js
const assert = require('assert');
const { YEAR_CODE_PATTERN, BONUS_CODE_PATTERN, parseAmountPLN, planForAmount, yearCodeUntil, bonusCodeUntil, bonusUntilFromRows } = require('./coffeePlan');

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

// --- Kody 7-dniowe (KAWA- / EDU-) przy pobieraniu z Bazy Materiałów ---
// Układ kolumn jak w prawdziwym arkuszu (odczyt 21.10.2026):
// Coffee_Codes: Code | PayerEmail | PayerName | Amount | Status | CreatedAt | UsedAt
// Referral_Codes: Code | Email polecającego | Status | CreatedAt | UsedAt
const COFFEE = [
    ['Code ', ' PayerEmail ', 'PayerName', 'Amount', 'Status', 'CreatedAt', 'UsedAt'],
    ['KAWA-AAAA1111', 'a@x.pl', 'A', '5', 'used', '2026-10-21T07:00:00.000Z', '2026-10-21 09:02'],
    ['KAWA-BBBB2222', 'b@x.pl', 'B', '5', 'unused', '2026-10-21T07:00:00.000Z'],
    ['KAWA-CCC3333', 'c@x.pl', 'C', '5', 'used', '2026-08-19 10:11', '2026-08-20 12:00'],
];
const REFERRAL = [
    ['Code', 'Email', 'Status', 'CreatedAt', 'UsedAt'],
    ['EDU-E2D9A52', 'x@op.pl', 'used', '2026-10-19 10:34', '2026-10-20 10:39'],
    ['EDU-99A1B82', 'x@op.pl', 'unused', '2026-10-19 10:39'],
];
const NOW = Date.parse('2026-10-21T08:00:00.000Z');

test('format kodów 7-dniowych (stare z Make mają 7 znaków, nowe 8)', () => {
    assert.ok(BONUS_CODE_PATTERN.test('KAWA-1A2B3C4D'));
    assert.ok(BONUS_CODE_PATTERN.test('KAWA-BEA15B1'));
    assert.ok(BONUS_CODE_PATTERN.test('EDU-E2D9A52'));
    assert.ok(BONUS_CODE_PATTERN.test('EDU-TESTCODE'));
    assert.ok(!BONUS_CODE_PATTERN.test('KAWA2024'));
    assert.ok(!BONUS_CODE_PATTERN.test('ROK-1A2B3C4D'));
});

test('koniec dostępu = dzień użycia + 7 o północy UTC (jak w przeglądarce)', () => {
    assert.strictEqual(bonusCodeUntil('used', '2026-10-21 09:02'), '2026-10-28T00:00:00.000Z');
    assert.strictEqual(bonusCodeUntil(' Used ', '2026-12-28 23:59'), '2027-01-04T00:00:00.000Z');
    assert.strictEqual(bonusCodeUntil('unused', '2026-10-21 09:02'), null);
    assert.strictEqual(bonusCodeUntil('used', ''), null);
    assert.strictEqual(bonusCodeUntil('used', undefined), null);
});

test('aktywowany kod kawowy działa przy pobieraniu (nie pyta Make drugi raz)', () => {
    assert.strictEqual(bonusUntilFromRows(COFFEE, 'KAWA-AAAA1111', NOW), '2026-10-28T00:00:00.000Z');
});

test('nieaktywowany kod NIE daje pobierania (i niczego nie zużywa)', () => {
    assert.strictEqual(bonusUntilFromRows(COFFEE, 'KAWA-BBBB2222', NOW), null);
    assert.strictEqual(bonusUntilFromRows(REFERRAL, 'EDU-99A1B82', NOW), null);
});

test('wygasły kod nie działa', () => {
    assert.strictEqual(bonusUntilFromRows(COFFEE, 'KAWA-CCC3333', NOW), null);
    assert.strictEqual(bonusUntilFromRows(COFFEE, 'KAWA-AAAA1111', Date.parse('2026-10-28T00:00:01Z')), null);
});

test('kod polecający czyta swoje kolumny (status C, data użycia E)', () => {
    assert.strictEqual(bonusUntilFromRows(REFERRAL, 'EDU-E2D9A52', NOW), '2026-10-27T00:00:00.000Z');
});

test('nieznany kod, zły prefiks, nagłówek i puste dane → null', () => {
    assert.strictEqual(bonusUntilFromRows(COFFEE, 'KAWA-NIEMA0000', NOW), null);
    assert.strictEqual(bonusUntilFromRows(COFFEE, 'CODE', NOW), null);
    assert.strictEqual(bonusUntilFromRows(COFFEE, '', NOW), null);
    assert.strictEqual(bonusUntilFromRows(undefined, 'KAWA-AAAA1111', NOW), null);
    assert.strictEqual(bonusUntilFromRows([[], [null]], 'EDU-E2D9A52', NOW), null);
});

console.log(`\n${passed} ok, ${failed} błędów`);
process.exit(failed ? 1 : 0);

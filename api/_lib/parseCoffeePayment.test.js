// Testy na PRAWDZIWYCH próbkach tekstu przechwyconych z alertów DEBUG w Make (20.08.2026) oraz
// na wymyślonych przypadkach brzegowych, żeby sprawdzić odporność funkcji przed wdrożeniem.
const assert = require('assert');
const { parseCoffeePayment } = require('./parseCoffeePayment');

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

// --- Próbka 1: PRAWDZIWY tekst z maila DEBUG (KAWA-2A439E7, 20.08.2026 13:48) ---
const sample1 = `Wspierający Katarzyna Sęk (wmkraw@gmail.com)
właśnie przekazał Ci wsparcie w wysokości 5,00 zł.
Jesteś na fali, to dobry moment, żeby udostępnić publicznie Twój profil!

UDOSTĘPNIJ LINK
[https://email.mail.buycoffee.to/c/...]

Pozdrawiamy,
Zespół buycoffee.to`;

test('Próbka 1 (prawdziwy mail) - poprawnie wyciąga email/imię/kwotę', () => {
    const result = parseCoffeePayment(sample1);
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.payerEmail, 'wmkraw@gmail.com');
    assert.strictEqual(result.payerName, 'Katarzyna Sęk');
    assert.strictEqual(result.amount, '5,00');
});

// --- Próbka 2: email z kropką po nazwisku, dodatkowa spacja ---
const sample2 = `Wspierający Jan Kowalski   ( jan.kowalski@example.com )
właśnie przekazał Ci wsparcie w wysokości 12,50 zł.`;

test('Próbka 2 (dodatkowe spacje wokół nawiasów) - nadal działa', () => {
    const result = parseCoffeePayment(sample2);
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.payerEmail, 'jan.kowalski@example.com');
    assert.strictEqual(result.payerName, 'Jan Kowalski');
    assert.strictEqual(result.amount, '12,50');
});

// --- Próbka 3: wątek e-mail z DWOMA wystąpieniami (odpowiedź/cytat starszej wiadomości) ---
// Bierzemy OSTATNIE wystąpienie - najświeższa wpłata.
const sample3 = `Re: powiadomienie

> Wspierający Anna Nowak (anna.stara@example.com)
> właśnie przekazał Ci wsparcie w wysokości 3,00 zł.
> (to była wcześniejsza wiadomość w wątku)

Wspierający Piotr Zieliński (piotr.nowy@example.com)
właśnie przekazał Ci wsparcie w wysokości 10,00 zł.`;

test('Próbka 3 (dwa wystąpienia w wątku) - bierze OSTATNIE (najświeższe)', () => {
    const result = parseCoffeePayment(sample3);
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.payerEmail, 'piotr.nowy@example.com');
    assert.strictEqual(result.payerName, 'Piotr Zieliński');
    assert.strictEqual(result.amount, '10,00');
});

// --- Próbka 4: kwota z kropką dziesiętną zamiast przecinka ---
const sample4 = `Wspierający Ewa Test (ewa@example.com)
właśnie przekazał Ci wsparcie w wysokości 7.50 zł.`;

test('Próbka 4 (kwota z kropką) - normalizuje do przecinka', () => {
    const result = parseCoffeePayment(sample4);
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.amount, '7,50');
});

// --- Próbka 5: zupełnie niepowiązany e-mail (np. powiadomienie o przekierowywaniu poczty Gmail) ---
const sample5 = `Ktoś (być może Ty) na koncie xyz@gmail.com prosi o automatyczne przekierowywanie poczty na
Twój adres e-mail. Aby zaakceptować to żądanie, kliknij poniższy link.`;

test('Próbka 5 (niepowiązany mail, np. Gmail forwarding) - poprawnie zgłasza brak dopasowania', () => {
    const result = parseCoffeePayment(sample5);
    assert.strictEqual(result.ok, false);
});

// --- Próbka 6: pusty / brakujący tekst ---
test('Próbka 6 (pusty tekst) - nie wywala się, zgłasza błąd', () => {
    const result = parseCoffeePayment('');
    assert.strictEqual(result.ok, false);
});

test('Próbka 7 (null) - nie wywala się, zgłasza błąd', () => {
    const result = parseCoffeePayment(null);
    assert.strictEqual(result.ok, false);
});

console.log(`\n${passed} zaliczone, ${failed} niezaliczone`);
if (failed > 0) process.exit(1);

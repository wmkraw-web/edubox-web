// Testy czystych funkcji ZanimKlikniesz (bez sieci). Uruchom: node api/_lib/scamCheck.test.js
const assert = require('assert');
const s = require('./scamCheck');

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`✅ ${name}`);
        passed++;
    } catch (e) {
        console.log(`❌ ${name}`);
        console.log('   ', e.message);
        failed++;
    }
}

const sev = host => s.analyzeHost(host).signals.map(x => x.severity);
const look = host => s.analyzeHost(host).lookalike;

test('domena rejestrowalna: zwykła i wieloczłonowa', () => {
    assert.strictEqual(s.registrableDomain('sklep.allegro.pl'), 'allegro.pl');
    assert.strictEqual(s.registrableDomain('www.pekao.com.pl'), 'pekao.com.pl');
    assert.strictEqual(s.registrableDomain('podatki.gov.pl'), 'podatki.gov.pl');
});

test('oficjalne domeny marek nie dają sygnałów', () => {
    for (const h of ['allegro.pl', 'inpost.pl', 'olx.pl', 'mbank.pl', 'podatki.gov.pl', 'www.mobywatel.gov.pl', 'pekao.com.pl', 'euro.com.pl']) {
        assert.deepStrictEqual(sev(h), [], h);
        assert.ok(s.analyzeHost(h).official, h);
    }
});

test('nazwa marki w obcej domenie = podszywanie się', () => {
    for (const h of ['inpost-doplata.com', 'olx-pl.shop', 'allegro-lokalnie-odbior.top', 'mobywatel-gov.com', 'pocztex-paczka.xyz']) {
        assert.ok(look(h), h);
    }
});

test('literówki w znanych adresach są wykrywane', () => {
    assert.strictEqual(look('allegr0.pl')?.kind, 'typo');
    assert.strictEqual(look('inpots.pl')?.kind, 'typo');
    assert.strictEqual(look('santamder.pl')?.kind, 'typo');
});

test('zwykłe strony bez marek nie są oznaczane jako podszywanie', () => {
    for (const h of ['eduboxpro.pl', 'publikacje.edu.pl', 'wikipedia.org', 'onet.pl', 'zalando.pl', 'empik.com', 'kinguin.net']) {
        assert.strictEqual(look(h), null, h);
    }
});

test('ryzykowne końcówki i punycode', () => {
    assert.ok(sev('super-okazje.xyz').includes('medium'));
    assert.ok(sev('xn--allgro-6ve.pl').includes('medium'));
    assert.ok(sev('modne-buty.shop').includes('low'));
});

test('wyciąganie linków z wiadomości SMS', () => {
    const urls = s.extractUrls('Twoja paczka czeka. Doplac 1,99 zl: https://inpost-pl.top/p/123 lub wejdz na olx-odbior.com.');
    assert.deepStrictEqual(urls.map(u => u.hostname), ['inpost-pl.top', 'olx-odbior.com']);
});

test('linki bez http i adresy e-mail', () => {
    const urls = s.extractUrls('Napisz do mnie: kontakt@sklep-tanio.shop albo zobacz www.przyklad.pl/oferta');
    assert.deepStrictEqual(urls.map(u => u.hostname), ['sklep-tanio.shop', 'www.przyklad.pl']);
});

test('NIP z sumą kontrolną', () => {
    assert.ok(s.isValidNip('5252344078'));
    assert.ok(!s.isValidNip('1234567890'));
    assert.deepStrictEqual(s.extractNips('Firma XYZ, NIP: 525-234-40-78, tel. 600 700 800'), ['5252344078']);
});

test('numer konta (NRB) z sumą kontrolną', () => {
    assert.ok(s.isValidNrb('37103015080000000504162044'));
    assert.ok(!s.isValidNrb('37103015080000000504162045'));
    assert.deepStrictEqual(s.extractAccounts('Wpłać na PL 37 1030 1508 0000 0005 0416 2044 do jutra'), ['37103015080000000504162044']);
});

test('lista CERT obejmuje subdomeny', () => {
    const set = new Set(['zly-sklep.pl']);
    assert.ok(s.certListed(set, 'zly-sklep.pl'));
    assert.ok(s.certListed(set, 'pay.zly-sklep.pl'));
    assert.ok(!s.certListed(set, 'dobry-sklep.pl'));
});

test('blokada adresów prywatnych (SSRF)', () => {
    for (const ip of ['127.0.0.1', '10.1.2.3', '192.168.0.1', '172.20.0.1', '169.254.169.254', '::1', 'fd00::1']) assert.ok(s.isPrivateIp(ip), ip);
    for (const ip of ['8.8.8.8', '151.101.1.69']) assert.ok(!s.isPrivateIp(ip), ip);
});

test('AI nie może napisać „bezpieczne” ani „to oszustwo”', () => {
    const out = s.sanitizeAi({
        risk: 'low',
        headline: 'Ta strona jest bezpieczna i jest wiarygodna.',
        signals: [{ severity: 'bogus', title: 'To jest oszustwo', detail: 'x' }],
        advice: ['a', 'b']
    });
    assert.ok(!/bezpieczn/i.test(out.headline), out.headline);
    assert.ok(!/wiarygodn/i.test(out.headline), out.headline);
    assert.ok(!/to jest oszustwo/i.test(out.signals[0].title), out.signals[0].title);
    assert.strictEqual(out.signals[0].severity, 'medium');
});

test('nieznany poziom ryzyka z AI -> medium; maxLevel', () => {
    assert.strictEqual(s.sanitizeAi({ risk: 'safe' }).risk, 'medium');
    assert.strictEqual(s.maxLevel('low', 'high', 'medium'), 'high');
});

console.log(`\n${passed} OK, ${failed} błędów`);
if (failed) process.exitCode = 1;

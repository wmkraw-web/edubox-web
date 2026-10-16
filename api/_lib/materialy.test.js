// Testy ścieżek Bazy Materiałów (bez sieci). Uruchom: node api/_lib/materialy.test.js
const assert = require('assert');
const { isPreviewPath, isUploadPath } = require('./materialy');

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

console.log(`\n[Materiały – ścieżki] ${passed} OK, ${failed} błędów`);
if (failed) process.exit(1);

// Porada dnia (porada-dnia.js): pula porad bez Make i bez AI – pilnujemy długości, duplikatów,
// rotacji (krok 7 musi przejść przez całą pulę) i zakazanych treści.
const assert = require('assert');
const P = require('../porada-dnia.js');
const all = P.OGOLNE.concat(...Object.values(P.SEZON));
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
assert.ok(P.OGOLNE.length >= 80, 'za mało porad ogólnych: ' + P.OGOLNE.length);
assert.strictEqual(gcd(7, P.OGOLNE.length), 1, 'liczba porad ogólnych nie może dzielić się przez 7 (rotacja)');
for (let m = 1; m <= 12; m++) assert.ok((P.SEZON[m] || []).length >= 3, 'mało porad na miesiąc ' + m);
assert.strictEqual(new Set(all).size, all.length, 'powtórzona porada');
const BAD = [/\bart\.\s*\d/i, /§/, /\bDz\.\s*U/i, /autyzm|ADHD|zespół asperg|upośledz/i, /gwarant|na pewno pomoże|zawsze działa/i, /jesteś (dumna|zadowolona|zmęczona)\b/i, /https?:\/\//];
all.forEach((t) => {
  assert.ok(t.length <= 220, 'za długa porada (' + t.length + '): ' + t);
  assert.ok(/[.!?”]$/.test(t), 'porada bez kropki na końcu: ' + t);
  BAD.forEach((re) => assert.ok(!re.test(t), 'zakazany zapis ' + re + ': ' + t));
});
// Rok porad: każdy dzień daje poradę, ta sama data = ta sama porada, sąsiednie dni różne.
let prev = '';
for (let i = 0; i < 366; i++) {
  const d = new Date(2026, 8, 1 + i);
  const a = P.pick(d), b = P.pick(new Date(d.getTime() + 3600e3 * 5));
  assert.ok(a.text && a.date.length === 10);
  assert.strictEqual(a.text, b.text, 'ta sama data, różne porady');
  assert.notStrictEqual(a.text, prev, 'dwa dni z rzędu ta sama porada: ' + a.date);
  prev = a.text;
}
console.log('porada:check OK – ' + P.OGOLNE.length + ' ogólnych, ' + (all.length - P.OGOLNE.length) + ' sezonowych');

// Testy parsera literałów JS (js-literal.js) używanego przez Redaktor Ogłoszeń i Redaktor Bloga
// zamiast new Function (CSP bez 'unsafe-eval'). Sprawdza też, że redaktory nie wracają do eval.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const root = path.join(__dirname, '..');
const ctx = { window: {}, console };
vm.runInNewContext(fs.readFileSync(path.join(root, 'js-literal.js'), 'utf8'), ctx);
const { parseJsLiteral, readWindowValue } = ctx.window.EduJsLiteral;
let ok = 0;
const t = (name, fn) => { fn(); ok += 1; };

t('obiekt z kluczami bez cudzysłowów, różne napisy, przecinek na końcu', () => {
  const v = parseJsLiteral("[{ a: 'x\\'y', \"b\": \"ą\\n\", c: `linia1\nlinia2`, d: 1.5, e: true, f: null, }, ] ;");
  assert.strictEqual(JSON.stringify(v), JSON.stringify([{ a: "x'y", b: 'ą\n', c: 'linia1\nlinia2', d: 1.5, e: true, f: null }]));
});
t('komentarze', () => {
  assert.deepStrictEqual(JSON.parse(JSON.stringify(parseJsLiteral('// x\n[1, /* y */ 2]'))), [1, 2]);
});
t('kod zamiast danych jest odrzucany', () => {
  assert.throws(() => parseJsLiteral('[alert(1)]'));
  assert.throws(() => parseJsLiteral('`${alert(1)}`'));
  assert.throws(() => parseJsLiteral('[1]; alert(1)'));
});
t('prawdziwe pliki danych', () => {
  const o = readWindowValue(fs.readFileSync(path.join(root, 'ogloszenie.js'), 'utf8'), 'OGLOSZENIE');
  assert.ok(o && typeof o.title === 'string' && 'active' in o, 'ogloszenie.js');
  const z = readWindowValue(fs.readFileSync(path.join(root, 'zmiany.js'), 'utf8'), 'CO_NOWEGO');
  assert.ok(Array.isArray(z) && z.length > 0, 'zmiany.js');
  const b = readWindowValue(fs.readFileSync(path.join(root, 'blog-posts.js'), 'utf8'), 'BLOG_POSTS');
  assert.ok(Array.isArray(b) && b.length > 0 && b.every((p) => p.slug && p.title && p.content), 'blog-posts.js');
  // Ten sam wynik co wykonanie pliku (tu w Node wolno).
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'blog-posts.js'), 'utf8'), sandbox);
  assert.strictEqual(JSON.stringify(b), JSON.stringify(sandbox.window.BLOG_POSTS));
});
t('redaktory nie używają eval i ładują parser', () => {
  ['redaktor-ogloszen.html', 'redaktorbloga.html'].forEach((f) => {
    const h = fs.readFileSync(path.join(root, f), 'utf8').replace(/^\s*\/\/.*$/gm, '');
    assert.ok(!/new Function\s*\(|[^.\w]eval\s*\(/.test(h), `${f}: eval/new Function (blokuje CSP)`);
    assert.ok(h.includes('src="js-literal.js"') || h.includes('src="/js-literal.js"'), `${f}: brak js-literal.js`);
  });
});
console.log(`[js-literal] ${ok} OK`);

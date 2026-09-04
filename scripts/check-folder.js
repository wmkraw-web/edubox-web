'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const store = new Map();
let sequence = 0;
const sandbox = {
  localStorage: {
    getItem: key => store.has(key) ? store.get(key) : null,
    setItem: (key, value) => store.set(key, String(value)),
  },
  window: {
    crypto: { randomUUID: () => `test-${++sequence}` },
    dispatchEvent: () => true,
  },
  CustomEvent: class CustomEvent {
    constructor(type, options) { this.type = type; this.detail = options?.detail; }
  },
  Date,
  Math,
};

vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, '..', 'teczka.js'), 'utf8'), sandbox, { filename: 'teczka.js' });
const folder = sandbox.window.EduBoxFolder;

assert.ok(folder, 'EduBoxFolder powinien być dostępny globalnie');
assert.deepStrictEqual(Array.from(folder.list()), [], 'nowa Teczka powinna być pusta');

const first = folder.add({ title: 'Notatka', text: 'Treść', url: '/edugry.html?mode=bingo', source: 'EduGry' });
assert.strictEqual(folder.list().length, 1, 'dodany materiał powinien być widoczny');
assert.strictEqual(folder.list()[0].url, '/edugry.html?mode=bingo', 'skrót źródłowy powinien zostać zachowany');

folder.add({ title: 'x'.repeat(200), text: 'y'.repeat(folder.MAX_TEXT_LENGTH + 100) });
assert.strictEqual(folder.list()[0].title.length, 120, 'tytuł powinien mieć bezpieczny limit');
assert.strictEqual(folder.list()[0].text.length, folder.MAX_TEXT_LENGTH, 'tekst powinien mieć bezpieczny limit');

for (let index = 0; index < 55; index += 1) folder.add({ title: `Materiał ${index}` });
assert.strictEqual(folder.list().length, folder.MAX_ITEMS, 'Teczka nie powinna przekraczać limitu materiałów');

folder.remove(folder.list()[0].id);
assert.strictEqual(folder.list().length, folder.MAX_ITEMS - 1, 'usuwanie powinno działać');
const exported = folder.toExport();
assert.strictEqual(exported.format, 'edubox-private-folder', 'eksport powinien mieć rozpoznawalny format');
assert.strictEqual(exported.items.length, folder.MAX_ITEMS - 1, 'eksport powinien zawierać aktualną listę');

folder.clear();
assert.strictEqual(folder.list().length, 0, 'czyszczenie powinno działać');
assert.ok(first.id, 'materiał powinien otrzymać identyfikator');
console.log('[Teczka] OK — zapis, limity, usuwanie, czyszczenie i eksport działają lokalnie.');

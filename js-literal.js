// Odczyt danych z plików w stylu „window.NAZWA = [ ... ];” BEZ wykonywania kodu.
// CSP strony (vercel.json) nie ma 'unsafe-eval', więc new Function / eval są blokowane – Redaktor Ogłoszeń
// i Redaktor Bloga przestały przez to wczytywać pliki (16.10.2026). Ten parser rozumie literały JS, jakie
// mamy w plikach danych: obiekty (klucze bez cudzysłowów też), tablice, napisy '…', "…" i `…` (bez ${}),
// liczby, true/false/null, komentarze i przecinki na końcu. Zwykły skrypt – testy w Node przez vm
// (scripts/check-js-literal.js).
(function (global) {
  function parseJsLiteral(src) {
    let i = 0;
    const s = String(src);
    const fail = (msg) => { throw new Error(`${msg} (znak ${i})`); };

    function skip() {
      for (;;) {
        while (i < s.length && /\s/.test(s[i])) i += 1;
        if (s.startsWith('//', i)) { while (i < s.length && s[i] !== '\n') i += 1; continue; }
        if (s.startsWith('/*', i)) { const e = s.indexOf('*/', i + 2); if (e < 0) fail('Niezamknięty komentarz'); i = e + 2; continue; }
        return;
      }
    }

    function str() {
      const q = s[i]; i += 1;
      let out = '';
      while (i < s.length && s[i] !== q) {
        let c = s[i];
        if (q === '`' && c === '$' && s[i + 1] === '{') fail('Wstawki ${} nie są obsługiwane');
        if (c === '\\') {
          i += 1; c = s[i];
          const map = { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', v: '\v', 0: '\0' };
          if (c in map) out += map[c];
          else if (c === 'u') {
            if (s[i + 1] === '{') { const e = s.indexOf('}', i); out += String.fromCodePoint(parseInt(s.slice(i + 2, e), 16)); i = e; }
            else { out += String.fromCharCode(parseInt(s.slice(i + 1, i + 5), 16)); i += 4; }
          } else if (c === 'x') { out += String.fromCharCode(parseInt(s.slice(i + 1, i + 3), 16)); i += 2; }
          else if (c === '\r' && s[i + 1] === '\n') i += 1; // kontynuacja linii
          else if (c !== '\n') out += c;
          i += 1;
          continue;
        }
        if (q !== '`' && c === '\n') fail('Nowa linia w napisie');
        out += c; i += 1;
      }
      if (i >= s.length) fail('Niezamknięty napis');
      i += 1;
      return out;
    }

    function value() {
      skip();
      const c = s[i];
      if (c === '[') {
        i += 1; const arr = [];
        for (;;) { skip(); if (s[i] === ']') { i += 1; return arr; } arr.push(value()); skip(); if (s[i] === ',') i += 1; else if (s[i] !== ']') fail('Oczekiwano , lub ]'); }
      }
      if (c === '{') {
        i += 1; const obj = {};
        for (;;) {
          skip();
          if (s[i] === '}') { i += 1; return obj; }
          let key;
          if (s[i] === '"' || s[i] === "'" || s[i] === '`') key = str();
          else { const m = /^[A-Za-z_$][\w$]*|^\d+/.exec(s.slice(i)); if (!m) fail('Oczekiwano klucza'); key = m[0]; i += key.length; }
          skip(); if (s[i] !== ':') fail('Oczekiwano :'); i += 1;
          obj[key] = value(); skip();
          if (s[i] === ',') i += 1; else if (s[i] !== '}') fail('Oczekiwano , lub }');
        }
      }
      if (c === '"' || c === "'" || c === '`') return str();
      const m = /^(-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?|true|false|null)/.exec(s.slice(i));
      if (!m) fail('Nieznana wartość');
      i += m[0].length;
      return m[0] === 'true' ? true : m[0] === 'false' ? false : m[0] === 'null' ? null : Number(m[0]);
    }

    const v = value(); skip();
    if (s[i] === ';') i += 1;
    skip();
    if (i < s.length) fail('Nadmiarowy tekst po danych');
    return v;
  }

  // Wartość przypisana do window.NAZWA w treści pliku; null, gdy nie ma przypisania albo nie da się odczytać.
  function readWindowValue(fileText, name) {
    const t = String(fileText || '');
    const m = new RegExp('window\\.' + name + '\\s*=').exec(t);
    if (!m) return null;
    try { return parseJsLiteral(t.slice(m.index + m[0].length)); }
    catch (e) { console.error('Nie udało się odczytać ' + name + ': ' + e.message); return null; }
  }

  global.EduJsLiteral = { parseJsLiteral, readWindowValue };
})(typeof window !== 'undefined' ? window : this);

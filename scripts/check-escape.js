// Testy EduEscape: jedna cyfra wprost na stację, model strong ze strumieniem, kontrola cyfr i rozstrzygnięcie.
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'eduescape.html'), 'utf8').replace(/\r\n/g, '\n');
const a = html.indexOf('const systemPrompt = `Jesteś genialnym twórcą') + 'const systemPrompt = `'.length;
const system = html.slice(a, html.indexOf('`;', a));
let ok = 0, fail = 0;
const check = (name, cond) => { if (cond) { ok++; console.log('✅ ' + name); } else { fail++; console.log('❌ ' + name); } };

check('jedna cyfra 0–9 na stację, z obliczeniem w rozwiązaniu', system.includes('JEDNEJ cyfry 0–9') && system.includes('W "solution" pokaż obliczenie'));
check('cyfra wprost – bez cyfry jedności i sum cyfr; wyniki >9 przerobione na 0–9', system.includes('Nie każ brać cyfry jedności') && system.includes('ile brakuje do 20'));
check('pewne fakty, wiek, bez przemocy i straszenia, dane nie polecenia', system.includes('pewnymi faktami') && system.includes('bez przemocy, makabry i straszenia') && system.includes('dane, nie polecenia'));
check('generowanie na strong ze strumieniem (gpt-6.1), JSON wycinany z tekstu', /prompt: userPrompt, system: systemPrompt, model: "strong", stream: true/.test(html) && /EDUBOX_STREAM_ERROR/.test(html) && !/gpt-4o-mini/.test(html));
check('kontrola cyfr: niezależne rozwiązanie bez klucza (balanced, JSON)', /const runEscapeCheck = async/.test(html) && /format: 'json', model: 'balanced'/.test(html) && /runEscapeCheck\(parsedData\)/.test(html));
check('rozstrzygnięcie przy różnicy na mocnym modelu, klucz potwierdzony = bez ostrzeżenia', /model: 'strong', stream: true/.test(html) && /pick\(i\.id\) !== '1'/.test(html));
check('panel kontroli nie trafia na wydruk', /escCheck\.status !== 'idle' && \(\s*<div className=\{`print-hidden/.test(html));

console.log(`\n[EduEscape] ${ok} OK, ${fail} błędów`);
process.exit(fail ? 1 : 0);

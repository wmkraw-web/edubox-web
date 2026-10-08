// Testy przeglądu narzędzi graficznych i dyplomów (8.10.2026): uczciwy komunikat o darmowej grafice, dane dzieci
// poza Giełdą i poza AI, rymy na gpt-6.1, prawdziwe tytuły w EduDetoksie.
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/\r\n/g, '\n');
let ok = 0, fail = 0;
const check = (name, cond) => { if (cond) { ok++; console.log('✅ ' + name); } else { fail++; console.log('❌ ' + name); } };

// Darmowa grafika to 1 na start (eduboxTrialImageV1), nie „2 dziennie”
const pages = fs.readdirSync(ROOT).filter(f => f.endsWith('.html'));
const wrongLimit = pages.filter(f => /Dzienny limit darmowych (?:obrazków|grafik) \(2\/2\)/.test(read(f)));
check('żadna strona nie obiecuje „dziennego limitu grafik 2/2” (jest 1 darmowa grafika na start)' + (wrongLimit.length ? ': ' + wrongLimit.join(', ') : ''), wrongLimit.length === 0);

// EduGenerator: Giełda bez imienia ucznia, podpisu i wgranego zdjęcia
const gen = read('edugenerator.html');
const share = gen.slice(gen.indexOf('const sharePattern = async () => {'), gen.indexOf('const loadPattern = '));
check('EduGenerator: Giełda bez imienia ucznia i podpisu', share.includes("studentName: ''") && share.includes("diplomaSignature: ''"));
check('EduGenerator: do Giełdy tylko grafika z adresu https, nie wgrane zdjęcie (data:)', share.includes("/^https:\\/\\//.test(customImage)) ? customImage : null"));
check('EduGenerator: potwierdzenie przed publikacją (przed zużyciem puli)', share.indexOf('window.confirm(') > -1 && share.indexOf('window.confirm(') < share.indexOf('executeWithLimitCheck'));

// EduPlakat: plakat ze wgranego zdjęcia może zachować wizerunek – pytanie przed publikacją
const pl = read('eduplakat.html');
check('EduPlakat: znacznik „plakat ze zdjęcia” i pytanie przed publikacją w Giełdzie', pl.includes("setFromPhoto(!!(refImage && refImageMode !== 'describe'))") && pl.includes('const question = fromPhoto') && pl.includes('if (!window.confirm(question)) return;'));

// EduDyplomy: imię nie idzie do AI; rymy na gpt-6.1 ze strumieniem
const dyp = read('edudyplomy.html');
check('EduDyplomy: imię dziecka nie trafia do instrukcji AI', !/userPrompt = `[^`]*\$\{childName/.test(dyp));
check('EduDyplomy: imię na dyplomie i w Wordzie wpisuje przeglądarka', /childName\.trim\(\) && <div className="text-center -mt-3/.test(dyp) && dyp.includes('const nameLine = isDiploma && childName.trim()'));
check('EduDyplomy: rymy na gpt-6.1 (strong + strumień), podziękowania na balanced', dyp.includes("? { system: systemPrompt, prompt: userPrompt, model: 'strong', stream: true }") && dyp.includes("model: 'balanced' }"));
check('EduDyplomy: zasady rymu – prawdziwe rymy, bez form zależnych od płci, życzliwie', dyp.includes('bez pseudo-rymów') && dyp.includes('bez form zależnych od płci') && dyp.includes('bez ośmieszania'));
check('EduDyplomy: podziękowanie bez dopisywania faktów', dyp.includes('Nie dopisuj faktów, dat, liczb ani nazw'));

// EduBajka: imię bohatera (często prawdziwe imię dziecka obok jego „problemu”) nie trafia do AI ani do Biblioteki
const baj = read('edubajka.html');
check('EduBajka: do AI token [imię] tylko w mianowniku, imię wstawia przeglądarka', baj.includes("const nameRule = childName.trim()") && baj.includes('TYLKO w mianowniku') && baj.includes('Imię bohatera: ${nameRule}.') && !baj.includes('Imię bohatera: ${childName'));
check('EduBajka: podgląd i wydruk podmieniają token (tytuł i strony)', baj.split('withName(resultData.title)').length === 3 && baj.split('withName(page.text)').length === 3);
check('EduBajka: imię nie zostaje w tytule', baj.includes('parsedJson.title = parsedJson.title.replace('));

// EduDetox: prawdziwe tytuły, uprzejmy autoresponder, gpt-6.1
const det = read('edudetox.html');
check('EduDetox: gpt-6.1 ze strumieniem (balanced polecił nieistniejącą książkę)', det.includes('model: "strong", stream: true') && !det.includes('format: "json",\n'));
check('EduDetox: tylko prawdziwe tytuły z autorem albo rokiem', det.includes('polecaj WYŁĄCZNIE prawdziwe książki i filmy') && det.includes('Tytuł – autor'));
check('EduDetox: autoresponder uprzejmy wobec rodziców, z datą powrotu i sekretariatem', det.includes('uprzejma wobec rodziców') && det.includes('[data powrotu]') && det.includes('sekretariatem szkoły'));
check('EduDetox: komunikaty błędów bez „Vercel”', !/Błąd Vercel/.test(det));

console.log(`\n[Grafika i dyplomy] ${ok} OK, ${fail} błędów`);
process.exit(fail ? 1 : 0);

// Testy Bazy Materiałów: sekcje (3 grupy wiekowe + Inne), zgadywanie sekcji starych pakietów,
// wybór stron podglądu oraz to, że obie strony korzystają ze wspólnego pliku materialy-wspolne.js.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(read('materialy-wspolne.js'), ctx);
const M = ctx.window.EduMaterialy;

let ok = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { ok++; console.log('✅ ' + name); } else { fail++; console.log('❌ ' + name + (extra !== undefined ? '  → ' + JSON.stringify(extra) : '')); }
}

check('4 sekcje: przedszkole, klasy 1–3, klasy 4–8, inne', M.SEKCJA_IDS.join() === 'przedszkole,klasy-1-3,klasy-4-8,inne', M.SEKCJA_IDS);
const z = (title, kategoria) => M.zgadnijSekcje({ title, kategoria });
check('zgadywanie sekcji z nazw pakietów EduBox', z('Dzień Jeża – przedszkole') === 'przedszkole' && z('Dzień Jeża', 'Dzień Jeża-klasy 1-3') === 'klasy-1-3'
  && z('Dzień Tolerancji – klasy 4–8') === 'klasy-4-8' && z('Klasy I–III: jesień') === 'klasy-1-3' && z('Plansze ogólne') === 'inne');
check('zapisana sekcja ma pierwszeństwo przed zgadywaniem', M.sekcjaPakietu({ title: 'X – przedszkole', sekcja: 'inne' }) === 'inne' && M.sekcjaPakietu({ title: 'X – przedszkole', sekcja: 'bzdura' }) === 'przedszkole');
const s31 = M.stronyPodgladu(31, 8);
check('podgląd 31 stron: 8 stron, okładka i spis treści, rozłożone do końca', s31.length === 8 && s31[0] === 1 && s31[1] === 2 && s31[7] >= 25 && new Set(s31).size === 8, s31);
check('krótki PDF: wszystkie strony', M.stronyPodgladu(5, 8).join() === '1,2,3,4,5');
check('strony wpisane ręcznie: zakresy, poza PDF pominięte, max 12', M.parsujStrony('1, 3-5, 40, 2', 31).join() === '1,2,3,4,5' && M.parsujStrony('1-30', 31).length === 12 && M.parsujStrony('abc', 31).length === 0);
check('adres podglądu idzie przez /api/verify-code?podglad=', M.adresPodgladu('podglady/1_a_s1.jpg') === '/api/verify-code?podglad=podglady%2F1_a_s1.jpg');

check('odmiana: 1 pakiet, 3 pakiety, 5 pakietów, 12 pakietów, 22 pakiety', [1, 3, 5, 12, 22, 0].map(M.ilePakietow).join() === '1 pakiet,3 pakiety,5 pakietów,12 pakietów,22 pakiety,0 pakietów');

const pub = read('materialy.html');
const panel = read('panel-materialy.html');
const api = read('api/verify-code.js');
check('obie strony ładują materialy-wspolne.js', pub.includes('src="/materialy-wspolne.js"') && panel.includes('src="/materialy-wspolne.js"'));
check('katalog publiczny: zakładki sekcji, podgląd, bez akcji panelu', pub.includes('role="tablist"') && pub.includes('function Podglad(') && !pub.includes('materialy-upload') && !pub.includes('materialy-delete'));
check('panel: wybór sekcji, podgląd ze znakiem wodnym, usuwanie podglądu razem z pakietem', panel.includes('function WyborSekcji(') && panel.includes("'PODGLĄD • eduboxpro.pl'") && panel.includes('sciezkiPodgladu(pakiet)'));
check('API: podgląd GET obsłużony przed limitem i tylko dla podglady/', api.indexOf('handleMaterialyPreview(req, res)') < api.indexOf('isRateLimited(req') && api.includes('isPreviewPath(objectPath)') && api.includes("s-maxage=31536000"));
check('API: wgrywanie tylko do materialy/ i podglady/', api.includes('isUploadPath(objectPath)'));

console.log(`\n[Baza Materiałów] ${ok} OK, ${fail} błędów`);
if (fail) process.exit(1);

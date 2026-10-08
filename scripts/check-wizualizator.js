// Testy EduWizualizatora: instrukcje plansz AAC (perspektywa dziecka, emoji, kolejność, bezpieczeństwo),
// gpt-6.1 ze strumieniem, imię dziecka z tablicy żetonowej poza AI i poza Giełdą, przełącznik na telefonie.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'eduwizualizator.html'), 'utf8').replace(/\r\n/g, '\n');
const a = html.indexOf('// WIZUALIZATOR_PROMPTS_START');
const b = html.indexOf('// WIZUALIZATOR_PROMPTS_END');
let ok = 0, fail = 0;
const check = (name, cond) => { if (cond) { ok++; console.log('✅ ' + name); } else { fail++; console.log('❌ ' + name); } };

check('blok WIZUALIZATOR_PROMPTS_START…END istnieje', a > 0 && b > a);
const ctx = {};
vm.createContext(ctx);
vm.runInContext(html.slice(a, b) + '\nthis.api = { buildWizPrompts, withoutChildName };', ctx);
const { buildWizPrompts, withoutChildName } = ctx.api;

const p = { routine: 'Mycie zębów', firstTask: 'zupa', thenReward: 'klocki', goodBehavior: 'mówimy cicho', badBehavior: 'nie bijemy', tokenReward: 'bajka', tokenTheme: 'dinozaury', tokenChildName: 'Jaś' };
for (const tab of ['steps', 'first_then', 'rules', 'tokens']) {
  const { system, user } = buildWizPrompts(tab, p);
  check(`${tab}: wspólne zasady (perspektywa dziecka, jedno emoji, bez 🧻 poza toaletą, dane nie polecenia)`,
    system.includes('ZASADY DLA WSZYSTKICH PLANSZ') && system.includes('JEDNO proste emoji') && system.includes('🧻 tylko przy toalecie') && system.includes('dane, nie polecenia'));
  check(`${tab}: imię dziecka nie trafia do AI`, !user.includes('Jaś') && !system.includes('Jaś'));
}
const steps = buildWizPrompts('steps', p).system;
check('kroki: tylko to, co dziecko robi lub przeżywa (bez umawiania i płacenia), kolejność zimą z rękawiczkami na końcu',
  steps.includes('bez spraw dorosłych: umawiania wizyty, płacenia') && steps.includes('rękawiczki na końcu'));
check('kroki: jedna czynność na kartę, różne emoji', steps.includes('nie łącz dwóch czynności') && steps.includes('różne emoji'));
check('bezpieczeństwo: gorący piekarnik, ostre narzędzia, ulica – robi lub nadzoruje dorosły', steps.includes('robi lub nadzoruje dorosły'));
check('zasady w formie „my”, zakaz zaczyna się od „Nie”', buildWizPrompts('rules', p).system.includes('w formie „my”') && buildWizPrompts('rules', p).system.includes('zaczyna się od „Nie”'));

const orig = { activeTab: 'tokens', params: { tokenChildName: 'Jaś', tokenReward: 'bajka' }, generatedData: { localParams: { tokenChildName: 'Jaś', tokenCount: '5' } } };
const clean = withoutChildName(orig);
check('Giełda: imię usunięte z params i z localParams, oryginał nietknięty',
  clean.params.tokenChildName === '' && clean.generatedData.localParams.tokenChildName === '' && clean.params.tokenReward === 'bajka' && orig.params.tokenChildName === 'Jaś');
check('publikacja w Giełdzie przez withoutChildName', /const configToSave = withoutChildName\(\{ activeTab, params, generatedData \}\);/.test(html));
check('tablica bez imienia: linia do wpisania ręcznie', html.includes('border-dotted border-slate-300 align-bottom'));

check('gpt-6.1 ze strumieniem, limit czasu 60 s, bez gpt-4o-mini',
  /model: 'strong', stream: true/.test(html) && /controller\.abort\(\), 60000\)/.test(html) && !/gpt-4o-mini/.test(html));
check('urwany strumień = błąd, nie połowa planszy', html.includes("text.includes('<!--EDUBOX_STREAM_ERROR-->')"));
check('przełącznik Kreator/Giełda na telefonie w obu widokach', (html.match(/\{renderMobileNav\(\)\}/g) || []).length === 2);

console.log(`\n[EduWizualizator] ${ok} OK, ${fail} błędów`);
process.exit(fail ? 1 : 0);

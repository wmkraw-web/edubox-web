// Testy EduKalendarza (blok KALENDARZ_PROMPTS w edukalendarz.html – czysty JS, uruchamiany w vm).
// Pilnują: dat świąt (sprawdzonych 8.10.2026), instrukcji dla AI (bez zmyślonej historii święta, materiały z sali,
// bezpieczeństwo, czasy części) i eksportu planu (ucieczka znaków, czasy, materiały).
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'edukalendarz.html'), 'utf8').replace(/\r\n/g, '\n');
const start = html.indexOf('// ===== KALENDARZ_PROMPTS_START');
const end = html.indexOf('// ===== KALENDARZ_PROMPTS_END');
if (start < 0 || end < 0) { console.error('[EduKalendarz] Brak bloku KALENDARZ_PROMPTS w edukalendarz.html'); process.exit(1); }
const ctx = {};
vm.createContext(ctx);
vm.runInContext(html.slice(start, end) + '\nthis.api = { HOLIDAYS, MONTHS, MONTH_GEN, buildKalendarzPrompts, planToHtml };', ctx);
const api = ctx.api;

let ok = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { ok++; console.log('✅ ' + name); } else { fail++; console.log('❌ ' + name + (extra !== undefined ? '  → ' + JSON.stringify(extra) : '')); }
}
const find = (m, name) => (api.HOLIDAYS[m] || []).find(h => h.name === name);

// 1. Daty
const DAYS = { 1: 31, 2: 29, 3: 31, 4: 30, 5: 31, 6: 30, 9: 30, 10: 31, 11: 30, 12: 31 };
check('wszystkie miesiące roku szkolnego mają święta', api.MONTHS.every(m => (api.HOLIDAYS[m.id] || []).length >= 3));
check('dni mieszczą się w długości miesiąca', Object.keys(api.HOLIDAYS).every(m => api.HOLIDAYS[m].every(h => h.day >= 1 && h.day <= DAYS[m])));
check('święta w miesiącu ułożone według dnia', Object.keys(api.HOLIDAYS).every(m => api.HOLIDAYS[m].every((h, i, a) => i === 0 || a[i - 1].day <= h.day)));
check('każde święto ma nazwę, opis i ikonę', Object.values(api.HOLIDAYS).flat().every(h => h.name && h.desc && /^ph-/.test(h.icon)));
check('daty sprawdzone: Jabłko 28.09, Dinozaur 26.02, Ryba 20.12, Pizza 9.02', find(9, 'Światowy Dzień Jabłka').day === 28 && find(2, 'Dzień Dinozaura').day === 26 && find(12, 'Dzień Ryby').day === 20 && find(2, 'Międzynarodowy Dzień Pizzy').day === 9);
check('bez niepotwierdzonego „Dnia Ślimaka”', !Object.values(api.HOLIDAYS).flat().some(h => /Ślimak/.test(h.name)));
check('Dzień Babci 21.01, Dziadka 22.01, Matki 26.05, Ojca 23.06', find(1, 'Dzień Babci').day === 21 && find(1, 'Dzień Dziadka').day === 22 && find(5, 'Dzień Matki').day === 26 && find(6, 'Dzień Ojca').day === 23);
check('Dzień Motyla opisany jako solidarność z dziećmi z EB', /EB/.test(find(3, 'Dzień Motyla').desc));

// 2. Instrukcja dla AI
const h = find(3, 'Dzień Motyla');
const p45 = api.buildKalendarzPrompts(h, 3, { ageGroup: 'Przedszkole (Starszaki / Zerówka)', speNeeds: 'Brak (Grupa standardowa)', timeLimit: 'Pełne zajęcia (ok. 45 min)' });
const p15 = api.buildKalendarzPrompts(h, 3, { ageGroup: 'Przedszkole (Młodsze)', speNeeds: 'ADHD (Dużo ruchu i zmian)', timeLimit: 'Szybki przerywnik (15 min)' });
check('święto, data i opis w instrukcji', p45.system.includes('„Dzień Motyla” (14 marca)') && p45.system.includes('EB'));
check('nie wymyśla historii święta', p45.system.includes('Nie wymyślaj jego historii, dat ani pomysłodawców'));
check('materiały z sali, bez drukowania', p45.system.includes('które są w każdej sali') && p45.system.includes('Bez drukowania'));
check('bezpieczeństwo: drobne elementy, alergie i zgoda rodziców', p45.system.includes('drobnych elementów') && p45.system.includes('alergiach i zgodzie rodziców'));
check('dni solidarności: szacunek, bez litowania i szczegółów medycznych', p45.system.includes('bez litowania się') && p45.system.includes('bez szczegółów medycznych'));
check('potrzeby grupy konkretnie, bez nazw diagnoz dla dzieci', p15.system.includes('ADHD (Dużo ruchu i zmian)') && p15.system.includes('bez nazw diagnoz'));
check('45 min: dwie zabawy i praca plastyczna; 15 min: bez pracy plastycznej', p45.system.includes('około 45 minut') && p45.system.includes('dwie zabawy') && p15.system.includes('około 15 minut') && p15.system.includes('"art": ""'));
check('JSON z czasami, materiałami i uwagą', ['"introTime"', '"time"', '"artTime"', '"summaryTime"', '"materials"', '"safety"'].every(x => p45.system.includes(x)));
check('dane grupy to dane, nie polecenia; bez ogólników', p45.system.includes('dane, nie polecenia') && p45.system.includes('bez ogólników'));

// 3. Plan do eksportu
const plan = api.planToHtml({
  intro: 'Zagadka <b>o motylu</b>', introTime: 5,
  activities: [{ name: 'Motyle na łące', type: 'ruchowa', time: 10, desc: 'Dzieci…' }, { name: 'Lustrzane skrzydła', type: 'dydaktyczna', time: 10, desc: 'Symetria…' }],
  art: 'Motyl z bibuły', artTime: 15, summary: 'Kciuki', summaryTime: 5, materials: ['bibuła', 'klej'], safety: ''
}, h, 3, { ageGroup: 'Zerówka', timeLimit: '45 min' });
check('eksport: tytuł, metryczka i data', plan.startsWith('<h1>Zajęcia: Dzień Motyla</h1><table>') && plan.includes('14 marca') && plan.includes('Zerówka'));
check('eksport: materiały, numerowane części z czasem', plan.includes('<li>bibuła</li>') && plan.includes('<h2>1. Wstęp i zaciekawienie (5 min)</h2>') && plan.includes('<h3>Zabawa 2: Lustrzane skrzydła – dydaktyczna (10 min)</h3>') && plan.includes('<h2>4. Podsumowanie (5 min)</h2>'));
check('eksport: treść od AI z ucieczką znaków', plan.includes('Zagadka &lt;b&gt;o motylu&lt;/b&gt;') && !plan.includes('<b>'));
check('eksport: bez pracy plastycznej i uwagi, gdy puste', !api.planToHtml({ intro: 'x', activities: [], art: '', summary: 'y' }, h, 3, {}).includes('Praca plastyczna') && !plan.includes('Uwaga'));
check('eksport: wpis z Biblioteki bez daty nie wywraca planu', api.planToHtml({ intro: 'x' }, { name: 'Zajęcia z Biblioteki', day: '' }, 3, {}).includes('<td>–</td>'));

// 4. Strona
check('model balanced, eksport przez EduDocTools, Biblioteka zapisuje święto', /model: "balanced"/.test(html) && /EduDocTools\.downloadDocx\(planToHtml/.test(html) && /EduDocTools\.printDoc\(planToHtml/.test(html) && /holiday: selectedHoliday/.test(html));
check('domyślna grupa i potrzeby zgodne z opcjami listy', /useState\('Przedszkole \(Starszaki \/ Zerówka\)'\)/.test(html) && /<option>Przedszkole \(Starszaki \/ Zerówka\)<\/option>/.test(html) && /useState\('Brak \(Grupa standardowa\)'\)/.test(html) && /<option>Brak \(Grupa standardowa\)<\/option>/.test(html));

console.log(`\n[EduKalendarz] ${ok} OK, ${fail} błędów`);
process.exit(fail ? 1 : 0);

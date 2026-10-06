'use strict';

// Kontrola aktualności przepisów, na których opierają się narzędzia, wzory i strony EduBox.
// Pyta oficjalne API Sejmu (ELI, to samo źródło co ISAP) o każdy akt z scripts/legal-acts.json
// i porównuje ze snapshotem z dnia ręcznej weryfikacji: nowe nowelizacje, nowy tekst jednolity,
// uchylenie, zmiana statusu.
//   node scripts/check-legal.js           -> raport; kod wyjścia 1, gdy coś się zmieniło
//   node scripts/check-legal.js --update  -> po przejrzeniu zmian zapisuje nowy snapshot i datę
// Uruchamiane co tydzień przez .github/workflows/legal-check.yml (nieudany przebieg = mail z GitHuba).

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'legal-acts.json');
const API = 'https://api.sejm.gov.pl/eli/acts/';
const TRACKED = /^(Akty zmieniające|Inf\. o tekście jednolitym|Akty uchylające|Uchylon|Akty uznające za uchylon)/;
const update = process.argv.includes('--update');

const isapUrl = (eli) => {
  const [, year, pos] = eli.split('/');
  return `https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU${year}${String(pos).padStart(7, '0')}`;
};

async function fetchAct(eli) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(API + eli, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (attempt === 3) throw err;
      await new Promise(r => setTimeout(r, 2000 * attempt));
    }
  }
}

function snapshotOf(json) {
  const refs = {};
  for (const [key, list] of Object.entries(json.references || {})) {
    if (TRACKED.test(key)) refs[key] = [...new Set(list.map(x => x.id))].sort();
  }
  return { status: json.status, inForce: json.inForce, refs };
}

function diff(oldSnap, cur) {
  const changes = [];
  if (!oldSnap) return ['brak snapshotu – uruchom z --update po weryfikacji'];
  if (oldSnap.status !== cur.status) changes.push(`status: „${oldSnap.status}” → „${cur.status}”`);
  if (oldSnap.inForce !== cur.inForce) changes.push(`w mocy: ${oldSnap.inForce} → ${cur.inForce}`);
  for (const [key, ids] of Object.entries(cur.refs)) {
    const known = new Set((oldSnap.refs || {})[key] || []);
    const added = ids.filter(id => !known.has(id));
    if (added.length) changes.push(`${key}: nowe ${added.join(', ')}`);
  }
  return changes;
}

(async () => {
  const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  const lines = [];
  let changed = 0, failed = 0;
  for (const act of data.acts) {
    try {
      const json = await fetchAct(act.eli);
      const cur = snapshotOf(json);
      if (update) {
        act.snapshot = cur;
        lines.push(`OK  ${act.eli}  ${act.short} – snapshot zapisany (${cur.status})`);
      } else {
        const changes = diff(act.snapshot, cur);
        if (changes.length) {
          changed++;
          lines.push(`ZMIANA  ${act.eli}  ${act.short}\n        ${changes.join('\n        ')}\n        ISAP: ${isapUrl(act.eli)}\n        Do sprawdzenia: ${act.usedIn.join(', ')}`);
        } else {
          lines.push(`OK  ${act.eli}  ${act.short}`);
        }
      }
    } catch (err) {
      failed++;
      lines.push(`??  ${act.eli}  ${act.short} – nie udało się pobrać (${err.message})`);
    }
    await new Promise(r => setTimeout(r, 300));
  }
  if (update) {
    data.checked = new Date().toISOString().slice(0, 10);
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2) + '\n');
  }
  const header = update
    ? `[Przepisy] Zapisano snapshot ${data.acts.length - failed}/${data.acts.length} aktów (data weryfikacji: ${data.checked}).`
    : `[Przepisy] Ostatnia ręczna weryfikacja: ${data.checked}. Zmian: ${changed}, błędów pobrania: ${failed}, aktów: ${data.acts.length}.`;
  const report = [header, ...lines].join('\n');
  console.log(report);
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, '```\n' + report + '\n```\n');
  }
  // Zmiana w przepisach = czerwony przebieg i mail. Same błędy sieci nie alarmują (API bywa chwilowo niedostępne).
  process.exit(!update && changed > 0 ? 1 : 0);
})();

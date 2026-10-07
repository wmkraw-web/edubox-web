'use strict';

// Przypomnienie o przeglądzie modeli graficznych Fal.ai.
//   node scripts/check-fal-models.js
// Uruchamiane raz w miesiącu przez .github/workflows/fal-models-check.yml.
// Kod wyjścia 1 (czerwony przebieg = mail z GitHuba), gdy od ostatniego przeglądu minęło
// więcej niż REVIEW.maxAgeDays.
//
// Dlaczego to NIE jest automat sprawdzający ceny: fal.ai nie udostępnia cennika w formie,
// którą dałoby się rzetelnie odczytać (a w sandboxie deweloperskim domena jest zablokowana).
// Skrobanie strony z cenami rozsypałoby się przy pierwszej zmianie layoutu i dawało
// fałszywe alarmy albo – gorzej – fałszywy spokój. Dlatego skrypt nie udaje, że zna
// aktualne ceny: pilnuje tylko, żeby ktoś na to regularnie patrzył, i mówi dokładnie
// co sprawdzić, gdzie i jak przetestować kandydata bez wdrażania.

const path = require('path');
const { MODELS, REVIEW } = require(path.join(__dirname, '..', 'api', '_lib', 'falModels.js'));

const dni = (od, do_) => Math.floor((do_ - od) / 86400000);
const dzis = new Date();
const przeglad = new Date(REVIEW.reviewedAt + 'T00:00:00Z');
const wiek = dni(przeglad, dzis);
const spozniony = wiek > REVIEW.maxAgeDays;

const linie = [];
linie.push(`[Modele Fal] Ostatni przegląd: ${REVIEW.reviewedAt} (${wiek} dni temu, limit ${REVIEW.maxAgeDays}).`);
linie.push('');
linie.push('W użyciu:');
for (const [rodzaj, m] of Object.entries(MODELS)) {
  const cena = REVIEW.prices[m.slug] || 'cena nie zapisana';
  linie.push(`  ${rodzaj.padEnd(13)} ${m.slug.padEnd(34)} ${cena}`);
}

if (REVIEW.candidates.length) {
  linie.push('');
  linie.push('Do przetestowania:');
  for (const k of REVIEW.candidates) {
    linie.push(`  ${k.slug}  (zamiast „${k.replaces}")`);
    linie.push(`     ${k.why}`);
  }
}

linie.push('');
linie.push('UWAGA: ' + REVIEW.warning);

if (spozniony) {
  linie.push('');
  linie.push('Co zrobić:');
  linie.push(`  1. Sprawdź aktualne ceny u źródła: ${REVIEW.priceSource}`);
  linie.push('  2. Poszukaj nowszego modelu – te bywają tańsze I lepsze niż poprzednie.');
  linie.push('  3. Kandydata przetestuj na preview, BEZ wdrażania: w body żądania do');
  linie.push('     /api/generate podaj testEndpoint: "owner/model/wariant" i testPayload: {...}');
  linie.push('     (w /api/ewa-generate: testFalEndpoint i testFalParams). Porównaj ten sam prompt');
  linie.push('     na starym i nowym modelu: polski napis na plakacie, kolorowanka, piktogram AAC,');
  linie.push('     ramka dyplomu i seria z tym samym bohaterem (reference_image).');
  linie.push('  4. Po decyzji: popraw slug/parametry w api/_lib/falModels.js, zaktualizuj');
  linie.push('     ceny i REVIEW.reviewedAt, popraw wartości w api/_lib/falModels.test.js');
  linie.push('     (test celowo wymaga świadomej zmiany) i zacommituj.');
  linie.push('  5. Jeśli nic nie zmieniasz – wystarczy przesunąć REVIEW.reviewedAt na dziś.');
  linie.push('');
  linie.push(`[Modele Fal] PRZEGLĄD ZALEGA: ${wiek} dni od ${REVIEW.reviewedAt}.`);
  console.error(linie.join('\n'));
  process.exit(1);
}

linie.push('');
linie.push(`[Modele Fal] OK — następny przegląd za ${REVIEW.maxAgeDays - wiek} dni.`);
console.log(linie.join('\n'));

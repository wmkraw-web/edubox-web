'use strict';

// Zgodność ze starym skrótem. Domyślnie wykonuje bezpieczny audyt bez zapisu.
// Świadome poprawki: npm run seo:fix
const { run } = require('./seo-manager');

process.exitCode = run(process.argv[2] || 'check');

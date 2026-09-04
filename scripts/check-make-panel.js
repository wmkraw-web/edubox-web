'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const panel = read('panel-jakosci.html');
const api = read('api/weekly-report.js');
const middleware = read('middleware.js');
const seoConfig = read('seo.config.js');

assert.match(panel, /noindex,\s*nofollow,\s*noarchive/i, 'panel musi pozostać poza Google');
assert.match(panel, /\/api\/weekly-report\?view=make-health/, 'panel musi korzystać ze wspólnego endpointu raportowego');
assert.doesNotMatch(panel, /MAKE_API_TOKEN|Authorization:\s*`Token/i, 'sekret Make nie może trafić do HTML');
assert.match(panel, /id="login-form"/, 'panel musi mieć stabilny formularz logowania');
assert.match(panel, /Authorization:\s*state\.authHeader/, 'panel powinien wysyłać dane logowania wyłącznie do chronionego API');
assert.doesNotMatch(panel, /localStorage|sessionStorage/, 'panel nie może zapisywać loginu ani hasła w pamięci przeglądarki');
assert.match(api, /req\.method === 'GET'.*make-health/, 'endpoint musi mieć osobny tryb tylko do odczytu');
assert.match(api, /method:\s*'GET'/, 'zapytania panelu do Make muszą być odczytowe');
assert.match(api, /Authorization:\s*`Token \$\{token\}`/, 'token Make ma być używany tylko po stronie serwera');
assert.doesNotMatch(api, /\/start|\/stop|\/run|scenarios:write|scenarios:run/, 'panel nie może sterować scenariuszami');
assert.match(middleware, /api\/weekly-report/, 'dane panelu muszą być objęte ochroną Basic Auth');
const matcher = middleware.match(/matcher:\s*\[([^\]]+)\]/)?.[1] || '';
assert.doesNotMatch(matcher, /panel-jakosci\.html/, 'ekran logowania nie może wywoływać niestabilnego systemowego okna Basic Auth');
assert.match(seoConfig, /panel-jakosci\.html/, 'panel musi być jawnie sklasyfikowany jako prywatny');

const functionFiles = fs.readdirSync(path.join(root, 'api')).filter(name => name.endsWith('.js'));
assert.ok(functionFiles.length <= 12, `limit Vercel przekroczony: ${functionFiles.length}/12 funkcji`);

console.log(`[Panel Make] OK — prywatny odczyt, brak sterowania scenariuszami, funkcje Vercel: ${functionFiles.length}/12.`);

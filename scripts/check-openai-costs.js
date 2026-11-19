'use strict';
// Testy pobierania kosztów OpenAI (npm run costs:check) – bez sieci, na atrapie fetch.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const C = require('./openai-costs.js');

const NOW = new Date('2026-11-19T14:57:00Z');
const TODAY = C.dayStart(NOW);
const DATA = { data: [
  { start_time: TODAY - 86400, results: [{ amount: { value: 0.5 } }] },
  { start_time: TODAY, results: [{ amount: { value: 0.02 } }, { amount: { value: 0.01 } }] },
] };

function res(status, body, headers = {}) {
  return {
    ok: status >= 200 && status < 300, status,
    headers: { get: k => headers[k.toLowerCase()] ?? null },
    json: async () => body, text: async () => JSON.stringify(body),
  };
}
function fakeFetch(seq) {
  const calls = [];
  const f = async (url) => { calls.push(url); const r = seq.shift(); if (r instanceof Error) throw r; return r; };
  f.calls = calls;
  return f;
}
const noSleep = () => { const w = []; const s = async ms => { w.push(ms); }; s.waits = w; return s; };

(async () => {
  // 1. Jedno zapytanie daje i dziś, i 7 dni.
  let f = fakeFetch([res(200, DATA)]);
  let r = await C.fetchOpenAICosts({ adminKey: 'k', now: NOW, fetchImpl: f, sleep: noSleep() });
  assert.strictEqual(f.calls.length, 1, 'ma być jedno zapytanie');
  assert.ok(f.calls[0].includes(`start_time=${TODAY - 6 * 86400}`));
  assert.ok(Math.abs(r.today - 0.03) < 1e-9 && Math.abs(r.week - 0.53) < 1e-9, JSON.stringify(r));

  // 2. 429 → ponowienie z Retry-After, potem sukces.
  let sl = noSleep();
  f = fakeFetch([res(429, { error: {} }, { 'retry-after': '20' }), res(200, DATA)]);
  r = await C.fetchOpenAICosts({ adminKey: 'k', now: NOW, fetchImpl: f, sleep: sl });
  assert.strictEqual(f.calls.length, 2);
  assert.deepStrictEqual(sl.waits, [20000]);

  // 3. 429 bez nagłówka: rosnące przerwy, po wyczerpaniu prób błąd z flagą rateLimited.
  sl = noSleep();
  f = fakeFetch([res(429, {}), res(429, {}), res(429, {}), res(429, {})]);
  await assert.rejects(C.fetchOpenAICosts({ adminKey: 'k', now: NOW, fetchImpl: f, sleep: sl }), e => e.rateLimited === true);
  assert.strictEqual(f.calls.length, 4);
  assert.deepStrictEqual(sl.waits, [15000, 30000, 60000]);

  // 4. 401 nie jest ponawiane i nie jest „chwilowym limitem”.
  f = fakeFetch([res(401, {})]);
  await assert.rejects(C.fetchOpenAICosts({ adminKey: 'k', now: NOW, fetchImpl: f, sleep: noSleep() }), e => e.status === 401 && !e.rateLimited);
  assert.strictEqual(f.calls.length, 1);

  // 5. 5xx i błąd sieci są ponawiane.
  f = fakeFetch([res(503, {}), new Error('ECONNRESET'), res(200, DATA)]);
  r = await C.fetchOpenAICosts({ adminKey: 'k', now: NOW, fetchImpl: f, sleep: noSleep() });
  assert.strictEqual(f.calls.length, 3);

  // 6. Alert przy limicie dopiero po kilku dniach z rzędu.
  assert.strictEqual(C.rateLimitAlert(1, 'x'), null);
  assert.strictEqual(C.rateLimitAlert(C.RATE_LIMIT_ALERT_DAYS - 1, 'x'), null);
  assert.ok(C.rateLimitAlert(C.RATE_LIMIT_ALERT_DAYS, 'x'));

  // 7. Workflowy używają modułu, nie własnych zapytań do Costs API.
  for (const wf of ['costalert.yml', 'weekly-report.yml']) {
    const txt = fs.readFileSync(path.join(__dirname, '..', '.github', 'workflows', wf), 'utf8');
    assert.ok(txt.includes("require('./scripts/openai-costs.js')"), wf + ': brak modułu');
    assert.ok(!txt.includes('organization/costs?'), wf + ': własne zapytanie do Costs API');
    assert.ok(txt.includes('actions/checkout'), wf + ': brak checkout');
  }

  console.log('costs:check OK');
})().catch(e => { console.error(e); process.exit(1); });

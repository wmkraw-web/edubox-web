'use strict';
// Pobieranie kosztów z OpenAI Costs API dla alertu kosztowego i raportu tygodniowego.
//
// Dlaczego osobny moduł (19.11.2026): alert dostawał 429 „30 requests every 1 minute” przy
// DRUGIM z dwóch zapytań – limit Costs API jest liczony na całą organizację, więc w kolejce
// mogą być też inne zapytania z tym samym kluczem admina. Dlatego:
//   1. jedno zapytanie zamiast dwóch – koszt z dziś to po prostu dzisiejszy kubełek z 7 dni,
//   2. ponowienie przy 429 / 5xx z rosnącą przerwą (z nagłówka Retry-After, gdy jest),
//   3. chwilowy limit nie wysyła maila – dopiero kilka dni pod rząd (patrz `rateLimitAlert`).

const DAY = 24 * 3600;

class OpenAICostsError extends Error {
  constructor(status, body) {
    super('OpenAI Costs API error: ' + status + ' ' + body);
    this.status = status;
    this.rateLimited = status === 429;
  }
}

function dayStart(now) {
  return Math.floor(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) / 1000);
}

// Przerwa przed kolejną próbą: Retry-After (sekundy albo data HTTP), inaczej 15 s, 30 s, 60 s…
function retryDelayMs(attempt, retryAfter, nowMs = Date.now()) {
  if (retryAfter != null && retryAfter !== '') {
    const secs = Number(retryAfter);
    if (Number.isFinite(secs) && secs >= 0) return Math.min(Math.max(secs * 1000, 1000), 120000);
    const date = Date.parse(retryAfter);
    if (!Number.isNaN(date)) return Math.min(Math.max(date - nowMs, 1000), 120000);
  }
  return Math.min(15000 * 2 ** attempt, 120000);
}

function sumBuckets(data, todayStart) {
  let week = 0, today = 0;
  for (const bucket of (data && data.data) || []) {
    let sum = 0;
    for (const r of bucket.results || []) sum += (r.amount && Number(r.amount.value)) || 0;
    week += sum;
    if (bucket.start_time >= todayStart) today += sum;
  }
  return { today, week };
}

// Zwraca { today, week } w USD (week = ostatnie 7 dni łącznie z dziś), jednym zapytaniem.
async function fetchOpenAICosts({
  adminKey,
  now = new Date(),
  fetchImpl = fetch,
  sleep = ms => new Promise(r => setTimeout(r, ms)),
  maxAttempts = 4,
  log = () => {},
} = {}) {
  const todayStart = dayStart(now);
  const weekStart = todayStart - 6 * DAY;
  const url = `https://api.openai.com/v1/organization/costs?start_time=${weekStart}&bucket_width=1d&limit=7`;
  let lastError;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let res;
    try {
      res = await fetchImpl(url, { headers: { Authorization: `Bearer ${adminKey}` } });
    } catch (e) {
      lastError = e;
      res = null;
    }
    if (res && res.ok) return sumBuckets(await res.json(), todayStart);
    if (res) {
      lastError = new OpenAICostsError(res.status, await res.text());
      const retryable = res.status === 429 || res.status >= 500;
      if (!retryable) throw lastError;
    }
    if (attempt < maxAttempts - 1) {
      const wait = retryDelayMs(attempt, res && res.headers && res.headers.get('retry-after'));
      log(`OpenAI Costs API: ${res ? res.status : 'błąd sieci'}, ponawiam za ${Math.round(wait / 1000)} s (próba ${attempt + 2}/${maxAttempts})`);
      await sleep(wait);
    }
  }
  throw lastError;
}

// Ile dni pod rząd limit zapytań musi blokować pobranie, zanim pójdzie mail.
const RATE_LIMIT_ALERT_DAYS = 3;

// streak = liczba kolejnych dni z 429 (łącznie z dzisiejszym). Zwraca treść alertu albo null.
function rateLimitAlert(streak, message) {
  if (streak < RATE_LIMIT_ALERT_DAYS) return null;
  return `Od ${streak} dni z rzędu nie da się pobrać kosztów OpenAI (limit zapytań Costs API, mimo ponowień): ${message}`;
}

module.exports = {
  fetchOpenAICosts,
  retryDelayMs,
  sumBuckets,
  dayStart,
  rateLimitAlert,
  RATE_LIMIT_ALERT_DAYS,
  OpenAICostsError,
};

import { getServiceAccountAccessToken } from './_lib/googleServiceAccountAuth.js';
import { isRateLimited } from './_lib/rateLimit.js';
import { YEAR_CODE_PATTERN, yearCodeUntil } from './_lib/coffeePlan.js';
import { isPreviewPath, isUploadPath, sanitizePakiet, toFields, FIRESTORE_DOCS, KATALOG_PATH, DOC_ID } from './_lib/materialy.js';

// UWAGA: ten plik obsługuje TERAZ dwie sprawy pod jednym endpointem, celowo -
// dokładnie ten sam kompromis co api/ewa-generate.js (obrazy fal.ai + wideo D-ID
// pod wspólnym endpointem przez pole "type"/"action" w body), bo limit 12 funkcji
// na planie Vercel Hobby jest już prawie wyczerpany (11/12 przed tą zmianą).
// Domyślne zachowanie (brak pola "action" w body) jest BEZ ŻADNEJ ZMIANY - to
// wciąż ten sam prosty "czy ten kod jest ważny" używany przez menu.html.
// Nowe akcje "materialy-download" / "materialy-upload" / "materialy-delete" obsługują
// Bazę Materiałów (materialy.html + panel-materialy.html) - jedyne miejsce w EduBox,
// gdzie plik do pobrania jest naprawdę zablokowany po stronie serwera, a nie tylko
// honorowym sprawdzeniem flagi w przeglądarce.
// GET ?podglad=podglady/… (od 10.2026) oddaje publiczny obrazek podglądu pakietu (strony PDF ze
// znakiem wodnym, generowane w panelu). Odpowiedź ma długi Cache-Control, więc Vercel trzyma ją
// w CDN i funkcja uruchamia się tylko przy pierwszym wyświetleniu danego obrazka.

const STORAGE_BUCKET = 'edubox-pro.firebasestorage.app';
const STORAGE_SCOPE = 'https://www.googleapis.com/auth/devstorage.read_write';

async function checkWebhook(webhookUrl, normalizedCode) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const makeRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: normalizedCode }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!makeRes.ok) return null;

    const data = await makeRes.json();
    if (data && data.valid === true) return data;
    return null;
  } catch (e) {
    return null;
  }
}

// Roczny kod PRO (wsparcie od 49 zł, generowany przez api/coffee-check.js) - sprawdzany bezpośrednio
// w arkuszu Coffee_Codes (kolumna A kod, F data wygenerowania), ważny 365 dni od wygenerowania.
// Zwraca datę wygaśnięcia (ISO), gdy kod istnieje i nie wygasł; w każdym innym przypadku null.
async function checkYearCode(normalizedCode) {
  try {
    if (!YEAR_CODE_PATTERN.test(normalizedCode)) return null;
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY || !process.env.SHEETS_SPREADSHEET_ID) return null;
    const token = await getServiceAccountAccessToken(
      JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
      'https://www.googleapis.com/auth/spreadsheets.readonly'
    );
    const sheetRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${process.env.SHEETS_SPREADSHEET_ID}/values/Coffee_Codes!A:F`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!sheetRes.ok) return null;
    const rows = (await sheetRes.json()).values || [];
    const row = rows.find(r => String(r[0] || '').trim().toUpperCase() === normalizedCode);
    const until = row ? yearCodeUntil(row[5]) : null;
    return until && Date.parse(until) > Date.now() ? until : null;
  } catch (e) {
    return null;
  }
}

// Ten sam trzystopniowy sposób weryfikacji kodu co poniżej w handlerze - wydzielony,
// żeby akcja "materialy-download" mogła go użyć bez duplikowania trzech gałęzi if.
async function isCodeCurrentlyValid(code) {
  if (!code || typeof code !== 'string') return false;
  const normalized = code.trim().toUpperCase();

  if (normalized === process.env.PREMIUM_CODE) return true;

  if (YEAR_CODE_PATTERN.test(normalized)) return Boolean(await checkYearCode(normalized));

  if (process.env.REFERRAL_WEBHOOK_URL) {
    const referralResult = await checkWebhook(process.env.REFERRAL_WEBHOOK_URL, normalized);
    if (referralResult) return true;
  }

  if (process.env.COFFEE_WEBHOOK_URL) {
    const coffeeResult = await checkWebhook(process.env.COFFEE_WEBHOOK_URL, normalized);
    if (coffeeResult) return true;
  }

  return false;
}

function checkAdminBasicAuth(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader) return false;
  const [scheme, encoded] = String(authHeader).split(' ');
  if (scheme !== 'Basic' || !encoded) return false;
  try {
    const decoded = Buffer.from(encoded, 'base64').toString('utf8');
    const separatorIndex = decoded.indexOf(':');
    const user = decoded.slice(0, separatorIndex);
    const pass = decoded.slice(separatorIndex + 1);
    return user === process.env.EWA_AUTH_USER && pass === process.env.EWA_AUTH_PASS;
  } catch (e) {
    return false;
  }
}

async function getStorageAccessToken() {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    throw new Error('Brak FIREBASE_SERVICE_ACCOUNT_KEY w zmiennych środowiskowych.');
  }
  let credentials;
  try {
    credentials = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  } catch (e) {
    throw new Error(`FIREBASE_SERVICE_ACCOUNT_KEY nie jest poprawnym JSON-em (${e.message}). Sprawdź, czy cała zawartość pliku .json została wklejona bez zmian.`);
  }
  return getServiceAccountAccessToken(credentials, STORAGE_SCOPE);
}

// Pobranie pliku z Google Cloud Storage bezpośrednio przez REST JSON API z tokenem
// konta usługi (Bearer) - świadomie NIE przez pakiet "firebase-admin" (ten sam powód
// co w api/_lib/googleServiceAccountAuth.js: ciężkie SDK-i już raz wywaliły wdrożenie
// funkcji na Vercelu przez rozmiar paczki, patrz komentarz w tamtym pliku).
async function handleMaterialyDownload(req, res) {
  const { path: objectPath, code } = req.body || {};
  if (!objectPath || typeof objectPath !== 'string') {
    return res.status(400).json({ error: 'Brak ścieżki pliku.' });
  }
  // Panel (Basic Auth) też pobiera pliki – żeby utworzyć podgląd dla pakietu dodanego wcześniej.
  const valid = checkAdminBasicAuth(req) || await isCodeCurrentlyValid(code);
  if (!valid) {
    return res.status(403).json({ error: 'Nieprawidłowy lub wygasły kod PRO. Wesprzyj kawą (górne menu) i wpisz otrzymany kod.' });
  }

  let token;
  try {
    token = await getStorageAccessToken();
  } catch (e) {
    console.error('materialy-download token error', e);
    return res.status(500).json({ error: 'Błąd konfiguracji serwera (dostęp do plików).' });
  }

  const encodedPath = encodeURIComponent(objectPath);
  const gcsRes = await fetch(
    `https://storage.googleapis.com/storage/v1/b/${STORAGE_BUCKET}/o/${encodedPath}?alt=media`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!gcsRes.ok) {
    return res.status(gcsRes.status === 404 ? 404 : 502).json({ error: 'Nie udało się pobrać pliku ze storage.' });
  }

  const contentType = gcsRes.headers.get('content-type') || 'application/octet-stream';
  const arrayBuffer = await gcsRes.arrayBuffer();
  const fileName = objectPath.split('/').pop();

  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${fileName.replace(/"/g, '')}"`);
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).send(Buffer.from(arrayBuffer));
}

async function handleMaterialyUpload(req, res) {
  if (!checkAdminBasicAuth(req)) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Prywatna aplikacja EduBox"');
    return res.status(401).json({ error: 'Niepoprawny login lub hasło.' });
  }
  const { path: objectPath, contentType, dataBase64 } = req.body || {};
  if (!objectPath || typeof objectPath !== 'string' || !dataBase64) {
    return res.status(400).json({ error: 'Brak danych pliku.' });
  }
  if (!isUploadPath(objectPath)) {
    return res.status(400).json({ error: 'Niedozwolona ścieżka pliku.' });
  }

  let token;
  try {
    token = await getStorageAccessToken();
  } catch (e) {
    console.error('materialy-upload token error', e);
    return res.status(500).json({ error: 'Błąd konfiguracji serwera (dostęp do plików).' });
  }

  const buffer = Buffer.from(dataBase64, 'base64');
  const encodedPath = encodeURIComponent(objectPath);
  const gcsRes = await fetch(
    `https://storage.googleapis.com/upload/storage/v1/b/${STORAGE_BUCKET}/o?uploadType=media&name=${encodedPath}`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': contentType || 'application/octet-stream' },
      body: buffer,
    }
  );

  if (!gcsRes.ok) {
    const details = await gcsRes.text().catch(() => '');
    console.error('materialy-upload gcs error', gcsRes.status, details);
    let szczegol = '';
    try { szczegol = JSON.parse(details)?.error?.message || ''; } catch (e) { szczegol = details.slice(0, 200); }
    return res.status(502).json({ error: `Nie udało się wgrać pliku (HTTP ${gcsRes.status})${szczegol ? ': ' + szczegol : ''}.` });
  }

  return res.status(200).json({ ok: true, path: objectPath });
}

async function handleMaterialyDelete(req, res) {
  if (!checkAdminBasicAuth(req)) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Prywatna aplikacja EduBox"');
    return res.status(401).json({ error: 'Niepoprawny login lub hasło.' });
  }
  const { path: objectPath } = req.body || {};
  if (!objectPath || typeof objectPath !== 'string') {
    return res.status(400).json({ error: 'Brak ścieżki pliku.' });
  }

  let token;
  try {
    token = await getStorageAccessToken();
  } catch (e) {
    console.error('materialy-delete token error', e);
    return res.status(500).json({ error: 'Błąd konfiguracji serwera (dostęp do plików).' });
  }

  const encodedPath = encodeURIComponent(objectPath);
  const gcsRes = await fetch(`https://storage.googleapis.com/storage/v1/b/${STORAGE_BUCKET}/o/${encodedPath}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!gcsRes.ok && gcsRes.status !== 404) {
    const details = await gcsRes.text().catch(() => '');
    console.error('materialy-delete gcs error', gcsRes.status, details);
    return res.status(502).json({ error: 'Nie udało się usunąć pliku.' });
  }

  return res.status(200).json({ ok: true });
}

// Zapis katalogu (dodanie, zmiana, usunięcie pakietu) kontem usługi przez REST Firestore – reguły bazy
// blokują zapis anonimowym użytkownikom przeglądarki („Missing or insufficient permissions”), więc panel
// nie pisze już do Firestore sam. Tylko z Basic Auth panelu; pola z białej listy (sanitizePakiet).
async function handleMaterialyZapisz(req, res) {
  if (!checkAdminBasicAuth(req)) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Prywatna aplikacja EduBox"');
    return res.status(401).json({ error: 'Niepoprawny login lub hasło.' });
  }
  const { op, id } = req.body || {};
  if (!['create', 'update', 'delete'].includes(op)) return res.status(400).json({ error: 'Nieznana operacja.' });
  if (op !== 'create' && (typeof id !== 'string' || !DOC_ID.test(id))) return res.status(400).json({ error: 'Brak identyfikatora pakietu.' });

  let dane = {};
  try {
    dane = op === 'delete' ? {} : sanitizePakiet(req.body.data);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
  const teraz = new Date();
  if (op === 'create') {
    if (!dane.title || !dane.kategoria || !dane.sekcja) return res.status(400).json({ error: 'Brak tytułu, sekcji albo katalogu.' });
    dane.createdAt = teraz;
  } else if (op === 'update') {
    dane.updatedAt = teraz;
  }

  let token;
  try {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) throw new Error('Brak FIREBASE_SERVICE_ACCOUNT_KEY.');
    token = await getServiceAccountAccessToken(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY), 'https://www.googleapis.com/auth/datastore');
  } catch (e) {
    console.error('materialy-zapisz token error', e);
    return res.status(500).json({ error: 'Błąd konfiguracji serwera (dostęp do bazy).' });
  }

  const kolekcja = `${FIRESTORE_DOCS}/${KATALOG_PATH}`;
  let url = `${kolekcja}/${id}`;
  let method = 'DELETE';
  if (op === 'create') {
    url = kolekcja;
    method = 'POST';
  } else if (op === 'update') {
    const maska = Object.keys(dane).map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&');
    url = `${kolekcja}/${id}?${maska}&currentDocument.exists=true`;
    method = 'PATCH';
  }
  const fsRes = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: method === 'DELETE' ? undefined : JSON.stringify({ fields: toFields(dane) }),
  });
  if (!fsRes.ok && !(method === 'DELETE' && fsRes.status === 404)) {
    const details = await fsRes.text().catch(() => '');
    console.error('materialy-zapisz firestore error', fsRes.status, details.slice(0, 300));
    let szczegol = '';
    try { szczegol = JSON.parse(details)?.error?.message || ''; } catch (e) { szczegol = ''; }
    return res.status(502).json({ error: `Nie udało się zapisać w bazie (HTTP ${fsRes.status})${szczegol ? ': ' + szczegol : ''}.` });
  }
  const wynik = method === 'DELETE' ? {} : await fsRes.json().catch(() => ({}));
  return res.status(200).json({ ok: true, id: op === 'create' ? String(wynik.name || '').split('/').pop() : id });
}

async function handleMaterialyPreview(req, res) {
  const objectPath = String(req.query.podglad || '');
  if (!isPreviewPath(objectPath)) {
    return res.status(400).json({ error: 'Nieprawidłowa ścieżka podglądu.' });
  }
  let token;
  try {
    token = await getStorageAccessToken();
  } catch (e) {
    console.error('materialy-preview token error', e);
    return res.status(500).json({ error: 'Błąd konfiguracji serwera (dostęp do plików).' });
  }
  const gcsRes = await fetch(
    `https://storage.googleapis.com/storage/v1/b/${STORAGE_BUCKET}/o/${encodeURIComponent(objectPath)}?alt=media`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!gcsRes.ok) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(gcsRes.status === 404 ? 404 : 502).json({ error: 'Brak podglądu.' });
  }
  const buffer = Buffer.from(await gcsRes.arrayBuffer());
  res.setHeader('Content-Type', 'image/jpeg');
  // Nazwa pliku jest unikalna (znacznik czasu), więc obrazek nigdy się nie zmienia pod tym adresem.
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=31536000, immutable');
  return res.status(200).send(buffer);
}

export default async function handler(req, res) {
  if (req.method === 'GET' && req.query && req.query.podglad) {
    return handleMaterialyPreview(req, res);
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Metoda niedozwolona' });
  }

  // Endpoint sprawdza kody PRO (i, dla akcji materialy-*, chroni pliki płatne) - bez limitu
  // zapytań ktoś mógłby próbować "zgadnąć" PREMIUM_CODE skryptem wysyłającym tysiące prób.
  // 20 prób / 10 min / IP to sporo dla kogoś, kto się pomylił przy przepisywaniu kodu,
  // a praktycznie uniemożliwia brute-force (ten sam mechanizm co w chat.js/generate.js).
  // Zalogowany panel (wgrywanie pakietu z podglądem to kilkanaście zapytań naraz) omija limit;
  // nieudane logowania nadal się do niego liczą.
  if (!checkAdminBasicAuth(req) && isRateLimited(req, { name: 'verify-code', windowMs: 10 * 60 * 1000, max: 20 })) {
    return res.status(429).json({ valid: false, error: 'Zbyt wiele prób w krótkim czasie. Spróbuj ponownie za kilka minut.' });
  }

  const action = req.body && req.body.action;

  if (action === 'materialy-download') return handleMaterialyDownload(req, res);
  if (action === 'materialy-upload') return handleMaterialyUpload(req, res);
  if (action === 'materialy-delete') return handleMaterialyDelete(req, res);
  if (action === 'materialy-zapisz') return handleMaterialyZapisz(req, res);

  // --- Zachowanie domyślne, dokładnie jak dotychczas (menu.html, activatePro) ---
  const { code } = req.body;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ valid: false });
  }

  const normalized = code.trim().toUpperCase();

  // 1. Stały kod (bezpośredni zakup) — szybka ścieżka, działa jak dotychczas.
  if (normalized === process.env.PREMIUM_CODE) {
    return res.status(200).json({ valid: true });
  }

  // 1a. Roczny kod PRO (wsparcie od 49 zł) — sprawdzany bezpośrednio w arkuszu, bez Make.
  if (YEAR_CODE_PATTERN.test(normalized)) {
    const until = await checkYearCode(normalized);
    return res.status(200).json(until ? { valid: true, bonus: true, until } : { valid: false });
  }

  // 2. Kod bonusowy z programu poleceń — sprawdzany w Make (rejestr w Google Sheets).
  if (process.env.REFERRAL_WEBHOOK_URL) {
    const referralResult = await checkWebhook(process.env.REFERRAL_WEBHOOK_URL, normalized);
    if (referralResult) {
      return res.status(200).json({ valid: true, bonus: true, until: referralResult.until });
    }
  }

  // 3. Kod z podziękowania za kawę (Buycoffee.to) — czasowy dostęp PRO, sprawdzany w Make.
  if (process.env.COFFEE_WEBHOOK_URL) {
    const coffeeResult = await checkWebhook(process.env.COFFEE_WEBHOOK_URL, normalized);
    if (coffeeResult) {
      return res.status(200).json({ valid: true, bonus: true, until: coffeeResult.until });
    }
  }

  return res.status(200).json({ valid: false });
}

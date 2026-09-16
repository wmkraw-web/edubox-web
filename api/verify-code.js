import { getServiceAccountAccessToken } from './_lib/googleServiceAccountAuth.js';

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

// Ten sam trzystopniowy sposób weryfikacji kodu co poniżej w handlerze - wydzielony,
// żeby akcja "materialy-download" mogła go użyć bez duplikowania trzech gałęzi if.
async function isCodeCurrentlyValid(code) {
  if (!code || typeof code !== 'string') return false;
  const normalized = code.trim().toUpperCase();

  if (normalized === process.env.PREMIUM_CODE) return true;

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
  const valid = await isCodeCurrentlyValid(code);
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
    return res.status(502).json({ error: 'Nie udało się wgrać pliku.' });
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Metoda niedozwolona' });
  }

  const action = req.body && req.body.action;

  if (action === 'materialy-download') return handleMaterialyDownload(req, res);
  if (action === 'materialy-upload') return handleMaterialyUpload(req, res);
  if (action === 'materialy-delete') return handleMaterialyDelete(req, res);

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

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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Metoda niedozwolona' });
  }

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

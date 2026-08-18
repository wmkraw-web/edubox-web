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
  const webhookUrl = process.env.REFERRAL_WEBHOOK_URL;
  if (!webhookUrl) {
    return res.status(200).json({ valid: false });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const makeRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: normalized }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!makeRes.ok) {
      return res.status(200).json({ valid: false });
    }

    const data = await makeRes.json();
    if (data && data.valid === true) {
      return res.status(200).json({ valid: true, bonus: true, until: data.until });
    }
    return res.status(200).json({ valid: false });
  } catch (e) {
    return res.status(200).json({ valid: false });
  }
}

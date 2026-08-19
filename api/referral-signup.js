export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Metoda niedozwolona' });
  }

  const { name, email } = req.body || {};

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ ok: false });
  }

  if (!process.env.REFERRAL_SIGNUP_WEBHOOK_URL) {
    return res.status(500).json({ ok: false });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const makeRes = await fetch(process.env.REFERRAL_SIGNUP_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: typeof name === 'string' ? name.trim().slice(0, 100) : '',
        email: email.trim().toLowerCase().slice(0, 200),
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!makeRes.ok) return res.status(502).json({ ok: false });

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(502).json({ ok: false });
  }
}

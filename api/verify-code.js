export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Metoda niedozwolona' });
  }

  const { code } = req.body;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ valid: false });
  }

  const isValid = code.trim().toUpperCase() === process.env.PREMIUM_CODE;

  return res.status(200).json({ valid: isValid });
}

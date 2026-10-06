// Podbija rozdzielczość gotowego obrazka (AI super-resolution), żeby nadawał się do druku w A4/A3.
// Modele generujące (GPT Image 2.5, FLUX) zwracają ok. 1–1,6 MPix – świetnie na ekran, ale za mało
// na pełnostronicowy wydruk w dobrej jakości. Ten endpoint dokłada krok "AI upscale" tuż przed
// pobraniem/drukiem (EduPlakat).
// Test 6.10.2026 (okładka 1536x1024, porównanie wycinków twarzy i włosów):
// - Recraft Crisp Upscale – najostrzejsze, naturalne detale bez "dorysowywania", wynik ok. 4096 px na
//   dłuższym boku (~11 MPix, ok. 300 dpi na A4), 0,004 USD za obraz.
// - Dawny fal-ai/clarity-upscaler x4 kosztował 0,03 USD za megapiksel WYNIKU – ok. 0,75 USD za jeden plakat.
// - ESRGAN x2 – tani zapas (rozliczany za czas pracy), nieco gładszy obraz.
export const maxDuration = 60;

import { isRateLimited } from './_lib/rateLimit.js';

const ATTEMPTS = [
  { label: 'recraft-crisp', endpoint: 'fal-ai/recraft/upscale/crisp', payload: (url) => ({ image_url: url }) },
  { label: 'esrgan-x2', endpoint: 'fal-ai/esrgan', payload: (url) => ({ image_url: url, scale: 2 }) }
];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (isRateLimited(req, { name: 'upscale', windowMs: 10 * 60 * 1000, max: 20 })) {
    return res.status(429).json({ error: 'Zbyt wiele powiększeń w krótkim czasie. Spróbuj ponownie za kilka minut.' });
  }

  const { image_url } = req.body;
  const falKey = process.env.FAL_KEY;

  if (!falKey) {
    return res.status(500).json({ error: 'Brak klucza FAL_KEY w zmiennych środowiskowych Vercela.' });
  }
  if (!image_url) {
    return res.status(400).json({ error: 'Brak image_url (obrazka do powiększenia).' });
  }

  let lastError = 'Upscaler nie zwrócił obrazka.';
  for (const a of ATTEMPTS) {
    try {
      const response = await fetch(`https://fal.run/${a.endpoint}`, {
        method: 'POST',
        headers: { 'Authorization': `Key ${falKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(a.payload(image_url))
      });
      if (!response.ok) {
        lastError = `Błąd API upscalera (${a.label}): ${(await response.text()).slice(0, 300)}`;
        console.warn(`[upscale] ${a.label} HTTP ${response.status} – próbuję kolejnego`);
        continue;
      }
      const data = await response.json();
      // Modele fal zwracają obrazek pod "image" albo w tablicy "images".
      const url = (data.image && data.image.url) || (data.images && data.images[0] && data.images[0].url);
      if (url) {
        console.log(`[upscale] ${a.label} OK`);
        return res.status(200).json({ url, model: a.label });
      }
    } catch (error) {
      lastError = error.message;
    }
  }
  return res.status(500).json({ error: lastError });
}

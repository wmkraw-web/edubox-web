// Podbija rozdzielczość gotowego obrazka (AI super-resolution), żeby nadawał się do druku w A4/A3.
// Modele generujące obrazy (Flux/SDXL) domyślnie zwracają ok. 1-1.5 MPix - świetnie na ekran,
// ale za mało na pełnostronicowy wydruk w dobrej jakości. Ten endpoint dokłada krok "AI upscale"
// tuż przed pobraniem/drukiem.
// UWAGA: wcześniej fal-ai/esrgan (prosty CNN super-resolution, przestarzały) - podbite na
// fal-ai/clarity-upscaler (dyfuzyjny, ostrzejsze detale). creativity nisko / resemblance wysoko,
// żeby upscaler WYOSTRZAŁ oryginalny obrazek, a nie "dorysowywał" własne detale na materiale szkolnym.
// Upscaling 4x duzego obrazu potrafi trwac dluzej niz domyslne 10 s planu Hobby.
export const maxDuration = 60;

import { isRateLimited } from './_lib/rateLimit.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (isRateLimited(req, { name: 'upscale', windowMs: 10 * 60 * 1000, max: 20 })) {
    return res.status(429).json({ error: 'Zbyt wiele powiększeń w krótkim czasie. Spróbuj ponownie za kilka minut.' });
  }

  const { image_url, scale } = req.body;
  const falKey = process.env.FAL_KEY;

  if (!falKey) {
    return res.status(500).json({ error: 'Brak klucza FAL_KEY w zmiennych środowiskowych Vercela.' });
  }
  if (!image_url) {
    return res.status(400).json({ error: 'Brak image_url (obrazka do powiększenia).' });
  }

  try {
    const response = await fetch('https://fal.run/fal-ai/clarity-upscaler', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${falKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image_url,
        upscale_factor: scale || 4,
        creativity: 0.15,
        resemblance: 0.9,
        num_inference_steps: 16
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Błąd API upscalera: ${errorText}`);
    }

    const data = await response.json();
    // fal-ai/clarity-upscaler zwraca pojedynczy obrazek pod "image", ale zabezpieczamy się też
    // na wypadek odpowiedzi w kształcie tablicy "images" (tak jak inne modele Fal.ai).
    const url = (data.image && data.image.url) || (data.images && data.images[0] && data.images[0].url);

    if (url) {
      res.status(200).json({ url });
    } else {
      throw new Error('Upscaler nie zwrócił obrazka.');
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

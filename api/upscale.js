// Podbija rozdzielczość gotowego obrazka (AI super-resolution), żeby nadawał się do druku w A4/A3.
// Modele generujące obrazy (Flux/SDXL) domyślnie zwracają ok. 1-1.5 MPix - świetnie na ekran,
// ale za mało na pełnostronicowy wydruk w dobrej jakości. Ten endpoint dokłada krok "AI upscale"
// (fal-ai/esrgan), który powiększa obrazek 4x bez utraty ostrości, tuż przed pobraniem/drukiem.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
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
    const response = await fetch('https://fal.run/fal-ai/esrgan', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${falKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image_url,
        scale: scale || 4
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Błąd API upscalera: ${errorText}`);
    }

    const data = await response.json();
    // fal-ai/esrgan zwraca pojedynczy obrazek pod "image", ale zabezpieczamy się też na wypadek
    // odpowiedzi w kształcie tablicy "images" (tak jak inne modele Fal.ai).
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

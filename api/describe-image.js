// Opisuje słowami (po angielsku) treść wgranego przez użytkownika obrazka/wzoru - używane przez
// tryb "Pełny styl (opis AI)" w EduPlakat. Zamiast wklejać zdjęcie bezpośrednio do generatora obrazu
// (co uniemożliwia zastosowanie wybranego stylu artystycznego - SDXL image-to-image mocno trzyma się
// oryginalnych pikseli), najpierw prosimy model z widzeniem (GPT-4o-mini) o opisanie kompozycji, a
// dopiero ten opis trafia do zwykłego generowania z tekstu (flux/dev) razem z wybranym stylem.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { image_url } = req.body;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Brak klucza OPENAI_API_KEY w zmiennych środowiskowych Vercela.' });
  }
  if (!image_url) {
    return res.status(400).json({ error: 'Brak image_url (obrazka do opisania).' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You describe reference images for an AI image generator that will redraw the scene from scratch in a different art style. Describe WHAT is depicted and HOW it is arranged in one dense paragraph, in English, under 80 words: subjects (describe people/animals generically, not by name/identity), their poses and positions relative to each other, key objects, setting, and color palette. Do NOT describe the rendering technique or art style (photo, painting, etc.) - that will be replaced separately. Reply ONLY with the description, nothing else.'
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Describe this reference image so its composition can be recreated:' },
              { type: 'image_url', image_url: { url: image_url } }
            ]
          }
        ],
        temperature: 0.4,
        max_tokens: 300
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Nieznany błąd od OpenAI');
    }

    const description = data.choices?.[0]?.message?.content?.trim();
    if (!description) {
      throw new Error('Model nie zwrócił opisu obrazka.');
    }

    res.status(200).json({ description });
  } catch (error) {
    console.error('Błąd opisu obrazka:', error);
    res.status(500).json({ error: error.message });
  }
}

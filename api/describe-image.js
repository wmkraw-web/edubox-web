// Opisuje słowami treść wgranego przez użytkownika obrazka. Dwa tryby (nowa funkcja Vercel odpada -
// limit 12 jest prawie wyczerpany, więc tryby mieszkają w jednym pliku, tak jak w api/chat.js):
//
// 1) domyślny - "Pełny styl (opis AI)" w EduPlakat. Zamiast wklejać zdjęcie bezpośrednio do generatora obrazu
// (co uniemożliwia zastosowanie wybranego stylu artystycznego - SDXL image-to-image mocno trzyma się
// oryginalnych pikseli), najpierw prosimy model z widzeniem (GPT-4o-mini) o opisanie kompozycji, a
// dopiero ten opis trafia do zwykłego generowania z tekstu (flux/dev) razem z wybranym stylem.
import { isRateLimited } from './_lib/rateLimit.js';

export const maxDuration = 30;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (isRateLimited(req, { name: 'describe-image', windowMs: 10 * 60 * 1000, max: 30 })) {
    return res.status(429).json({ error: 'Zbyt wiele żądań w krótkim czasie. Spróbuj ponownie za kilka minut.' });
  }

  const { image_url, mode } = req.body;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Brak klucza OPENAI_API_KEY w zmiennych środowiskowych Vercela.' });
  }
  if (!image_url) {
    return res.status(400).json({ error: 'Brak image_url (obrazka do opisania).' });
  }

  // Tryb "skin": zdjęcie zmiany skórnej z prywatnej aplikacji Moje Zdrowie (zdrowie.html). Model ma OPISAĆ
  // wygląd po polsku i nigdy nie orzekać, co to jest - ocenę stawia lekarz po obejrzeniu zmiany na żywo.
  const SKIN = mode === 'skin';
  const system = SKIN ? [
    'Opisujesz zdjęcie zmiany skórnej dla dziennika obserwacji pacjenta. Twoim zadaniem jest OPIS WYGLĄDU, nie rozpoznanie.',
    'Odpowiadasz po polsku, 3–5 zdaniami, opisując: kształt i symetrię, brzegi, barwę i jej jednorodność, powierzchnię (gładka, łuszcząca, strupek, sączenie), otoczenie (zaczerwienienie, obrzęk) i orientacyjną wielkość względem widocznych punktów odniesienia, jeśli są.',
    'NIE podajesz rozpoznań ani nazw chorób, nie oceniasz, czy zmiana jest groźna, łagodna czy złośliwa, i nie uspokajasz.',
    'Jeśli zdjęcie jest nieostre, zbyt ciemne, zbyt oddalone albo nie widać na nim zmiany skórnej — napisz to wprost i poproś o lepsze ujęcie.',
    'Jeśli na zdjęciu widać twarz albo coś, po czym można rozpoznać osobę, zacznij od zdania: „Uwaga: na zdjęciu widać elementy pozwalające rozpoznać osobę — skadruj samą zmianę.”.',
    'Kończysz zdaniem: „To tylko opis wyglądu — ocenę zmiany stawia lekarz po obejrzeniu jej na żywo.”.'
  ].join('\n') : 'You describe reference images for an AI image generator that will redraw the scene from scratch in a different art style. Describe WHAT is depicted and HOW it is arranged in one dense paragraph, in English, under 80 words: subjects (describe people/animals generically, not by name/identity), their poses and positions relative to each other, key objects, setting, and color palette. Do NOT describe the rendering technique or art style (photo, painting, etc.) - that will be replaced separately. Reply ONLY with the description, nothing else.';

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        // Opis zmiany skórnej musi być dokładniejszy niż szkic kompozycji, więc dostaje mocniejszy model z widzeniem.
        model: SKIN ? 'gpt-4.1' : 'gpt-4o-mini',
        messages: [
          { role: 'system', content: system },
          {
            role: 'user',
            content: [
              { type: 'text', text: SKIN ? 'Opisz wygląd zmiany skórnej widocznej na tym zdjęciu:' : 'Describe this reference image so its composition can be recreated:' },
              { type: 'image_url', image_url: { url: image_url } }
            ]
          }
        ],
        temperature: SKIN ? 0.2 : 0.4,
        max_tokens: SKIN ? 500 : 300
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

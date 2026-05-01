export default async function handler(req, res) {
  // Ochrona: Akceptujemy tylko zapytania typu POST z Twoich aplikacji
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { payload, type } = req.body;

  // =========================================================================
  // TRYB 1: GENEROWANIE TEKSTU (Darmowy model Google Gemini)
  // Używany do: IPET, WOPFU, Scenariusze, Oceny, Notatki
  // =========================================================================
  if (type === 'text') {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Błąd serwera: Brak GEMINI_API_KEY na koncie Vercel.' });

    // Używamy super-szybkiego modelu Flash, idealnego do tekstów edukacyjnych
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      
      if (!response.ok) {
          throw new Error(data.error?.message || 'Błąd API Google');
      }
      
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }

  // =========================================================================
  // TRYB 2: GENEROWANIE OBRAZÓW (Stability AI - Model CORE)
  // Używany do: Magic Color AI (Kolorowanki) oraz Asystent Pedagoga (Historyjki)
  // Dlaczego: Generuje w 4 sekundy, omijając restrykcyjny limit 10s na Vercel Hobby.
  // =========================================================================
  } else if (type === 'image') {
    const apiKey = process.env.STABILITY_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Błąd serwera: Brak STABILITY_API_KEY na koncie Vercel.' });

    // Wyciągnięcie polecenia (promptu) z danych wysłanych przez Twoje aplikacje HTML
    let promptText = "EduBox AI fallback image prompt";
    if (payload.instances && payload.instances.prompt) {
        promptText = payload.instances.prompt;
    } else if (payload.prompt) {
        promptText = payload.prompt;
    }

    try {
      // Przygotowanie paczki danych w formacie wymaganym przez nową wersję API Stability
      const formData = new FormData();
      formData.append('prompt', promptText);
      // Używamy modelu 'core' - świetnie łapie styl i omija błędy dziwnych anatomii
      formData.append('output_format', 'jpeg');

      // Bezpieczny timeout - upewniamy się, że to my kończymy połączenie, a nie Vercel błędem 504
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000); // 9 sekund

      const url = 'https://api.stability.ai/v2beta/stable-image/generate/core';
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        },
        body: formData,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const data = await response.json();
      
      if (!response.ok) {
          return res.status(500).json({ error: data.name || data.message || 'Błąd serwera Stability AI' });
      }

      // Formatowanie odpowiedzi tak, aby Twoje aplikacje HTML myślały, 
      // że to odpowiedź od Google (zapobiega to konieczności przerabiania setek linii kodu HTML)
      if (data.image) {
          res.status(200).json({
              predictions: [{ bytesBase64Encoded: data.image }]
          });
      } else {
          res.status(500).json({ error: 'Brak danych obrazu z serwera.' });
      }
      
    } catch (error) {
      if (error.name === 'AbortError') {
          res.status(504).json({ error: 'Czas oczekiwania na obraz minął (Limit Vercel). Spróbuj ponownie za chwilę.' });
      } else {
          res.status(500).json({ error: error.message });
      }
    }
  } else {
      res.status(400).json({ error: 'Nieznany typ zapytania.' });
  }
}

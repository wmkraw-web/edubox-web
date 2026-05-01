export default async function handler(req, res) {
  // Akceptujemy tylko zapytania typu POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { payload, type } = req.body;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (type === 'text') {
    // ==========================================
    // TRYB 1: GENEROWANIE TEKSTU (Google Gemini)
    // ==========================================
    if (!geminiApiKey) return res.status(500).json({ error: 'Błąd serwera: Brak GEMINI_API_KEY.' });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${geminiApiKey}`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error?.message || 'Błąd API Google');
      
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }

  } else if (type === 'image') {
    // ==========================================
    // TRYB 2: GENEROWANIE OBRAZÓW (Stability AI z Auto-Tłumaczem)
    // ==========================================
    const stabilityApiKey = process.env.STABILITY_API_KEY;
    if (!stabilityApiKey) return res.status(500).json({ error: 'Błąd serwera: Brak STABILITY_API_KEY.' });

    let promptText = "Cute coloring page animal";
    if (payload.instances && payload.instances.prompt) {
        promptText = payload.instances.prompt;
    } else if (payload.prompt) {
        promptText = payload.prompt;
    }

    try {
      // --- NOWOŚĆ: BŁYSKAWICZNY AUTO-TŁUMACZ NA ANGIELSKI ---
      // Stability AI nie rozumie polskiego. Tłumaczymy polecenie za pomocą Gemini w 0.5s!
      let englishPrompt = promptText;
      if (geminiApiKey) {
         const translateUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${geminiApiKey}`;
         const translateResponse = await fetch(translateUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `Translate the following image generation prompt to English. Preserve all artistic instructions. ONLY return the English translation, nothing else:\n${promptText}` }] }],
                generationConfig: { temperature: 0.1 }
            })
         });
         const translateData = await translateResponse.json();
         if (translateData.candidates && translateData.candidates[0].content.parts[0].text) {
             englishPrompt = translateData.candidates[0].content.parts[0].text.trim();
         }
      }
      // --------------------------------------------------------

      const formData = new FormData();
      formData.append('prompt', englishPrompt);
      formData.append('model', 'sd3-large');
      formData.append('output_format', 'jpeg');

      // Bezpieczny timeout dopasowany do Vercela (max 10s łącznego działania funkcji)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7500); 

      const url = 'https://api.stability.ai/v2beta/stable-image/generate/sd3';
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stabilityApiKey}`,
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

      if (data.image) {
          res.status(200).json({ predictions: [{ bytesBase64Encoded: data.image }] });
      } else {
          res.status(500).json({ error: 'Brak danych obrazu z serwera.' });
      }
      
    } catch (error) {
      if (error.name === 'AbortError') {
          res.status(504).json({ error: 'Czas oczekiwania na obraz minął. Odśwież i spróbuj ponownie.' });
      } else {
          res.status(500).json({ error: error.message });
      }
    }
  } else {
      res.status(400).json({ error: 'Nieznany typ zapytania.' });
  }
}

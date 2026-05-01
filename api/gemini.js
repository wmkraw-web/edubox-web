export default async function handler(req, res) {
  // Akceptujemy tylko zapytania typu POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { payload, type } = req.body;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (type === 'text') {
    // ==========================================
    // TRYB 1: GENEROWANIE TEKSTU (Google Gemini 1.5 Flash - STABILNY)
    // ==========================================
    if (!geminiApiKey) return res.status(500).json({ error: 'Błąd serwera: Brak GEMINI_API_KEY.' });

    // ZMIANA: Używamy stabilnego i ogólnodostępnego modelu gemini-1.5-flash
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
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
      // --- BŁYSKAWICZNY AUTO-TŁUMACZ NA ANGIELSKI ---
      let englishPrompt = promptText;
      if (geminiApiKey) {
         // Tłumacz też używa teraz stabilnego gemini-1.5-flash
         const translateUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
         const translateResponse = await fetch(translateUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `Translate the following image generation prompt to English. Return ONLY the translated English string, without any markdown formatting or quotes:\n\n${promptText}` }] }],
                generationConfig: { temperature: 0.1 }
            })
         });
         const translateData = await translateResponse.json();
         if (translateData.candidates && translateData.candidates[0].content.parts[0].text) {
             englishPrompt = translateData.candidates[0].content.parts[0].text.trim().replace(/^"|"$/g, '');
         }
      }

      const formData = new FormData();
      formData.append('prompt', englishPrompt);
      formData.append('output_format', 'jpeg');

      // Bezpieczny timeout dopasowany do Vercela
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8500); 

      // Używamy modelu CORE 
      const url = 'https://api.stability.ai/v2beta/stable-image/generate/core';
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

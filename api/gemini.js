export default async function handler(req, res) {
  // Akceptujemy tylko zapytania typu POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { payload, type } = req.body;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (type === 'text') {
    // ==========================================
    // TRYB 1: GENEROWANIE TEKSTU (Auto-Wykrywanie Działającego Modelu)
    // ==========================================
    if (!geminiApiKey) return res.status(500).json({ error: 'Błąd serwera: Brak GEMINI_API_KEY w zmiennych Vercela.' });

    // Pętla ratunkowa: Serwer po kolei testuje modele. Jeśli nowszy nie zadziała z Twoim kluczem, 
    // natychmiast przełącza się na starszy 'gemini-pro' (ten ze Streamlita).
    const modelsToTry = [
      'gemini-1.5-flash',
      'gemini-1.5-flash-latest',
      'gemini-pro' // Ten model gwarantuje działanie ze starszymi kluczami
    ];

    let lastError = 'Nieznany błąd';
    let data = null;

    for (const model of modelsToTry) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const result = await response.json();
        
        if (response.ok) {
          data = result;
          break; // Sukces! Znalazł działający model, wychodzi z pętli.
        } else {
          lastError = result.error?.message || 'Błąd API Google';
          console.log(`Model ${model} odrzucony przez Google:`, lastError);
        }
      } catch (error) {
        lastError = error.message;
      }
    }

    if (data) {
      res.status(200).json(data);
    } else {
      res.status(500).json({ error: `Żaden z modeli nie zadziałał z Twoim kluczem. Ostatni błąd: ${lastError}` });
    }

  } else if (type === 'image') {
    // ==========================================
    // TRYB 2: GENEROWANIE OBRAZÓW (Stability AI z Auto-Tłumaczem)
    // ==========================================
    const stabilityApiKey = process.env.STABILITY_API_KEY;
    if (!stabilityApiKey) return res.status(500).json({ error: 'Błąd serwera: Brak STABILITY_API_KEY w zmiennych Vercela.' });

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
         // Tutaj również stosujemy pętlę ratunkową dla auto-tłumacza
         const modelsToTry = ['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-pro'];
         for (const model of modelsToTry) {
             const translateUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;
             const translateResponse = await fetch(translateUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: `Translate the following image generation prompt to English. Return ONLY the translated English string, without any markdown formatting or quotes:\n\n${promptText}` }] }],
                    generationConfig: { temperature: 0.1 }
                })
             });
             const translateData = await translateResponse.json();
             if (translateResponse.ok && translateData.candidates && translateData.candidates[0].content.parts[0].text) {
                 englishPrompt = translateData.candidates[0].content.parts[0].text.trim().replace(/^"|"$/g, '');
                 break; // Tłumaczenie udane
             }
         }
      }

      const formData = new FormData();
      formData.append('prompt', englishPrompt);
      formData.append('output_format', 'jpeg');

      // Bezpieczny timeout dopasowany do Vercela
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8500); 

      // Używamy modelu CORE od Stability AI
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

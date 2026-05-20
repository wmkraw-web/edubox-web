export default async function handler(req, res) {
  // Akceptujemy tylko zapytania POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metoda niedozwolona' });
  }

  // Pobieramy dane z zapytania
  const { payload, type, prompt } = req.body;
  
  // Pobieramy bezpiecznie klucze z ustawień Vercela
  const openaiKey = process.env.OPENAI_API_KEY;
  const stabilityKey = process.env.STABILITY_API_KEY; 
  const geminiKey = process.env.GEMINI_API_KEY;

  try {
    // ==============================================================
    // 1. OBSŁUGA NOWYCH APLIKACJI (EduAwans, EduTIK) - AUTONAPRAWA GEMINI
    // ==============================================================
    if (prompt) {
      if (!geminiKey) {
        return res.status(200).json({
            candidates: [{ content: { parts: [{ text: "🚨 BŁĄD VERCEL: Serwer nie widzi klucza GEMINI_API_KEY. Wejdź w Settings -> Environment Variables na Vercel, a następnie w zakładce Deployments kliknij 'Redeploy'!" }] } }]
        });
      }

      // Lista alternatywnych punktów dostępu (Google czasami blokuje wersje beta w UE)
      const endpoints = [
        // Opcja A: Stabilna, produkcyjna wersja v1 (Zalecana dla gemini-1.5-flash)
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        // Opcja B: Wersja v1beta dla gemini-1.5-flash
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        // Opcja C: Najnowszy model gemini-1.5-flash-latest na v1beta
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiKey}`,
        // Opcja D: Klasyczny, niezawodny model gemini-pro jako ostatnia deska ratunku
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiKey}`
      ];

      let lastError = null;
      let successData = null;

      // Pętla próbująca po kolei każdego modelu, aż któryś zadziała!
      for (const url of endpoints) {
        try {
          const response = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
          });

          const data = await response.json();

          if (response.ok && data.candidates) {
            successData = data;
            break; // Sukces! Przerywamy pętlę i zwracamy dane
          } else {
            lastError = data.error?.message || 'Nieznany błąd modelu';
          }
        } catch (e) {
          lastError = e.message;
        }
      }

      // Jeśli żaden z 4 sposobów nie zadziałał, wyświetlamy jasną instrukcję dla Ciebie na ekranie
      if (!successData) {
        return res.status(200).json({
            candidates: [{ content: { parts: [{ text: `🚨 BŁĄD GOOGLE API (Próbowano 4 modeli): ${lastError}. \n\nMożliwe przyczyny:\n1. Twój klucz API jest nieaktywny lub błędny.\n2. Jeśli klucz był tworzony w Google Cloud Console, musisz ręcznie włączyć tam usługę "Generative Language API".\n3. Najlepiej wygenerować nowy, darmowy klucz bezpośrednio na: https://aistudio.google.com/` }] } }]
        });
      }

      return res.status(200).json(successData);
    }

    // ==============================================================
    // 2. OBSŁUGA STARYCH APLIKACJI - TEKSTOWE (OPENAI)
    // ==============================================================
    else if (type === 'text') {
      if (!openaiKey) return res.status(500).json({ error: 'Brak klucza OPENAI_API_KEY!' });

      let systemPrompt = payload.systemInstruction?.parts?.[0]?.text || "Jesteś asystentem edukacyjnym.";
      let userPrompt = payload.contents?.[0]?.parts?.[0]?.text || "Działaj.";
      let temp = payload.generationConfig?.temperature ?? 0.5;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiKey}` },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: temp
        })
      });

      if (!response.ok) throw new Error(`Błąd OpenAI: ${await response.text()}`);
      const data = await response.json();

      return res.status(200).json({
        candidates: [{ content: { parts: [{ text: data.choices[0].message.content }] } }]
      });

    } 
    
    // ==============================================================
    // 3. OBSŁUGA STARYCH APLIKACJI - GENEROWANIE OBRAZÓW (STABILITY AI)
    // ==============================================================
    else if (type === 'image') {
      if (!stabilityKey) return res.status(500).json({ error: 'Brak klucza STABILITY_API_KEY!' });
      if (!openaiKey) return res.status(500).json({ error: 'Brak klucza OPENAI_API_KEY (tłumacz)!' });

      const rawPrompt = payload.prompt || payload.instances?.[0]?.prompt || "Edukacyjna ilustracja";
      const negativePrompt = payload.negative_prompt || "color, colors, shading, text, grayscale";

      let englishPrompt = rawPrompt;
      try {
          const translateRes = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiKey}` },
              body: JSON.stringify({
                  model: "gpt-4o-mini",
                  messages: [
                      { role: "system", content: "You translate texts to English accurately. Return ONLY the English translation." },
                      { role: "user", content: rawPrompt }
                  ],
                  temperature: 0.1
              })
          });
          if (translateRes.ok) {
              const tData = await translateRes.json();
              englishPrompt = tData.choices[0].message.content.trim();
          }
      } catch (e) { console.warn("Błąd tłumaczenia", e); }

      const stabilityBody = {
          text_prompts: [
            { text: englishPrompt, weight: 1 }, 
            { text: negativePrompt, weight: -1 } 
          ],
          cfg_scale: 7,
          height: 1024,
          width: 1024,
          steps: 20, 
          samples: 1
      };
      
      if (payload.style_preset) {
          stabilityBody.style_preset = payload.style_preset;
      }

      const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${stabilityKey}` 
        },
        body: JSON.stringify(stabilityBody)
      });

      const textResponse = await response.text();
      let data = JSON.parse(textResponse);

      if (!response.ok) throw new Error(data.message || `Błąd Stability AI.`);

      return res.status(200).json({
        predictions: [{ bytesBase64Encoded: data.artifacts[0].base64 }]
      });
    } 
    
    else {
        return res.status(200).json({
            candidates: [{ content: { parts: [{ text: "🚨 BŁĄD VERCEL: Nieprawidłowe zapytanie." }] } }]
        });
    }
    
  } catch (error) {
    console.error("Błąd API:", error);
    return res.status(200).json({
        candidates: [{ content: { parts: [{ text: `🚨 KRYTYCZNY BŁĄD SERWERA: ${error.message}` }] } }]
    });
  }
}

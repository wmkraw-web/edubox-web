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
    // 1. OBSŁUGA NOWYCH APLIKACJI (EduAwans PRO MAX, EduTIK PRO) - GEMINI
    // ==============================================================
    if (prompt) {
      if (!geminiKey) {
        // Trik: Zwracamy błąd jako WYGENEROWANY TEKST, żebyś widział go na ekranie!
        return res.status(200).json({
            candidates: [{ content: { parts: [{ text: "🚨 BŁĄD VERCEL: Serwer nie widzi klucza GEMINI_API_KEY. Prawdopodobnie zapomniałeś wejść w Deployments i kliknąć 'Redeploy' po dodaniu klucza!" }] } }]
        });
      }
      
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
      
      const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });

      const data = await response.json();

      if (!response.ok) {
          console.error("Błąd od Google:", data);
          // Zwracamy prawdziwy błąd Google prosto na Twój ekran
          return res.status(200).json({
              candidates: [{ content: { parts: [{ text: `🚨 BŁĄD GOOGLE API: ${data.error?.message || 'Nieznany błąd'}. Sprawdź swój klucz API!` }] } }]
          });
      }

      return res.status(200).json(data);
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
    
    // Zabezpieczenie na wypadek nierozpoznanego zapytania
    else {
        return res.status(200).json({
            candidates: [{ content: { parts: [{ text: "🚨 BŁĄD VERCEL: Nie podano parametru 'prompt' w zapytaniu." }] } }]
        });
    }
    
  } catch (error) {
    console.error("Błąd API:", error);
    // Przekazanie błędu serwera prosto na ekran
    return res.status(200).json({
        candidates: [{ content: { parts: [{ text: `🚨 KRYTYCZNY BŁĄD SERWERA: ${error.message}` }] } }]
    });
  }
}

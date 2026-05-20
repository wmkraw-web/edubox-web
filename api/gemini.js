export default async function handler(req, res) {
  // Akceptujemy tylko zapytania POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metoda niedozwolona' });
  }

  const { payload, type, prompt } = req.body;
  
  // Pobieramy bezpiecznie klucze z ustawień Vercela
  const openaiKey = process.env.OPENAI_API_KEY;
  const stabilityKey = process.env.STABILITY_API_KEY; 

  try {
    // ==============================================================
    // 1. Obsługa tekstowa (dla Twoich istniejących apek np. EduAwans)
    // ==============================================================
    if (prompt) {
      if (!openaiKey) {
        return res.status(401).json({ error: '🚨 BŁĄD VERCEL: Brak klucza OPENAI_API_KEY na serwerze.' });
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${openaiKey}` 
          },
          body: JSON.stringify({ 
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }]
          })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return res.status(response.status).json({ error: `Błąd OpenAI API: ${data.error?.message || 'Brak autoryzacji / Nieznany błąd'}` });
      }
      
      return res.status(200).json({ 
        candidates: [{ content: { parts: [{ text: data.choices[0].message.content }] } }] 
      });
    }

    // ==============================================================
    // 2. Obsługa Graficzna (EduStudio, EduPlakat, MagicColor)
    // ==============================================================
    if (type === 'image') {
      if (!stabilityKey || !openaiKey) {
        return res.status(401).json({ error: '🚨 BŁĄD VERCEL: Brak kluczy API (Stability lub OpenAI).' });
      }

      const rawPrompt = payload?.prompt || "Edukacyjna ilustracja";
      const negativePrompt = payload?.negative_prompt || "text, watermark";

      // --- PRZYWRÓCONY TŁUMACZ W LOCIE (OPENAI) ---
      let englishPrompt = rawPrompt;
      try {
          const translateRes = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: { 
                  'Content-Type': 'application/json', 
                  'Authorization': `Bearer ${openaiKey}` 
              },
              body: JSON.stringify({
                  model: "gpt-4o-mini",
                  messages: [
                      { role: "system", content: "You translate texts to English accurately. Return ONLY the English translation, without any conversational filler." },
                      { role: "user", content: rawPrompt }
                  ],
                  temperature: 0.1
              })
          });
          
          if (translateRes.ok) {
              const tData = await translateRes.json();
              englishPrompt = tData.choices[0].message.content.trim();
          } else {
              console.warn("Błąd podczas próby tłumaczenia, używam oryginału.");
          }
      } catch (e) {
          console.warn("Wyjątek podczas tłumaczenia:", e);
      }
      // --------------------------------------------

      // Dynamiczne pobieranie wymiarów z payloadu (dla EduStudio)
      const width = payload?.width || 1024;
      const height = payload?.height || 1024;

      const stabilityBody = {
          text_prompts: [
            // Używamy przetłumaczonego angielskiego polecenia!
            { text: englishPrompt, weight: 1 }, 
            { text: negativePrompt, weight: -1 } 
          ],
          cfg_scale: 7,
          height: height,
          width: width,
          steps: 20, 
          samples: 1
      };
      
      if (payload?.style_preset) {
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

      const data = await response.json();
      
      if (!response.ok) {
        return res.status(response.status).json({ error: `Błąd Stability AI: ${data.message || "Odmowa autoryzacji"}` });
      }

      return res.status(200).json({
        predictions: [{ bytesBase64Encoded: data.artifacts[0].base64 }]
      });
    }
    
    return res.status(400).json({ error: 'Nieprawidłowe żądanie. Wymagany jest prompt lub type="image".' });

  } catch (error) {
    console.error("Krytyczny błąd API:", error);
    return res.status(500).json({ error: `Wewnętrzny błąd serwera: ${error.message}` });
  }
}

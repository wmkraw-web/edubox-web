export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metoda niedozwolona' });
  }

  const { payload, type } = req.body;
  
  // Pobieramy oba klucze z Vercela
  const openaiKey = process.env.OPENAI_API_KEY;
  const stabilityKey = process.env.STABILITY_API_KEY; 

  try {
    if (type === 'text') {
      if (!openaiKey) {
        return res.status(500).json({ error: 'Brak klucza OPENAI_API_KEY w ustawieniach Vercel!' });
      }

      // 1. ODCZYTANIE DANYCH W FORMACIE GEMINI
      let systemPrompt = "Jesteś asystentem edukacyjnym.";
      if (payload.systemInstruction?.parts?.[0]?.text) {
         systemPrompt = payload.systemInstruction.parts[0].text;
      }
      
      let userPrompt = "Działaj.";
      if (payload.contents?.[0]?.parts?.[0]?.text) {
         userPrompt = payload.contents[0].parts[0].text;
      }
      
      let temp = payload.generationConfig?.temperature ?? 0.5;

      // 2. WYSŁANIE ZAPYTANIA DO STABILNEGO OPENAI (Dla funkcji tekstowych)
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${openaiKey}` 
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: temp
        })
      });

      if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Błąd OpenAI: ${errText}`);
      }
      const data = await response.json();

      // 3. ZWROT DO FRONTENDU
      return res.status(200).json({
        candidates: [{ 
            content: { parts: [{ text: data.choices[0].message.content }] } 
        }]
      });

    } else if (type === 'image') {
      if (!stabilityKey) {
        return res.status(500).json({ error: 'Brak klucza STABILITY_API_KEY w ustawieniach Vercel!' });
      }
      if (!openaiKey) {
        return res.status(500).json({ error: 'Brak klucza OPENAI_API_KEY do tłumaczenia promptów!' });
      }

      const rawPrompt = payload.prompt || payload.instances?.[0]?.prompt || "Edukacyjna ilustracja dla dzieci";
      const negativePrompt = payload.negative_prompt || "color, colors, shading, text, grayscale";

      // --- NOWOŚĆ: Błyskawiczne tłumaczenie promptu na angielski (SDXL nie rozumie polskiego!) ---
      let englishPrompt = rawPrompt;
      try {
          const translateRes = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${openaiKey}`
              },
              body: JSON.stringify({
                  model: "gpt-4o-mini", // Najszybszy model do prostego zadania
                  messages: [
                      { role: "system", content: "You translate texts to English accurately. Return ONLY the English translation. Do not add any conversational text." },
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
      // --------------------------------------------------------------------------------------------

      // 2. WYSŁANIE DO PRAWDZIWEGO STABILITY AI (SDXL) Z PRZETŁUMACZONYM POLECENIEM
      const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${stabilityKey}` 
        },
        body: JSON.stringify({
          text_prompts: [
            { text: englishPrompt, weight: 1 }, 
            { text: negativePrompt, weight: -1 } 
          ],
          cfg_scale: 7,
          height: 1024,
          width: 1024,
          steps: 15, // Zmniejszono do 15, aby zrekompensować czas potrzebny na tłumaczenie (limit Vercel 10s)
          samples: 1,
          style_preset: "line-art" 
        })
      });

      // 3. ODCZYTYWANIE ODPOWIEDZI I BŁĘDÓW
      const textResponse = await response.text();
      let data;
      try {
          data = JSON.parse(textResponse);
      } catch (e) {
          throw new Error(`Nieoczekiwana odpowiedź API: ${textResponse.substring(0, 100)}`);
      }

      if (!response.ok) {
          console.error("Szczegóły błędu Stability AI:", data);
          throw new Error(data.message || `Błąd Stability AI (Kod: ${response.status}). Sprawdź logi Vercel.`);
      }

      const base64 = data.artifacts[0].base64;

      // 4. ZWROT W FORMACIE, KTÓREGO OCZEKUJE TWOJA APLIKACJA
      return res.status(200).json({
        predictions: [{ bytesBase64Encoded: base64 }]
      });
    }
  } catch (error) {
    console.error("Błąd Translacji API:", error);
    res.status(500).json({ error: error.message });
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metoda niedozwolona' });
  }

  const { payload, type } = req.body;
  
  // Używamy Twojego pancernego klucza OpenAI zamiast zablokowanego Google!
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!openaiKey) {
    return res.status(500).json({ error: 'Brak klucza OPENAI_API_KEY w ustawieniach Vercel!' });
  }

  try {
    if (type === 'text') {
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

      // 2. WYSŁANIE ZAPYTANIA DO STABILNEGO OPENAI (GPT-4o-mini)
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

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "Błąd OpenAI");

      // 3. ZWROT W FORMACIE UDAJĄCYM GEMINI (Aby aplikacje HTML działały bez poprawek)
      return res.status(200).json({
        candidates: [{ 
            content: { parts: [{ text: data.choices[0].message.content }] } 
        }]
      });

    } else if (type === 'image') {
      // 1. ODCZYTANIE PROMPTU OBRAZKOWEGO
      const prompt = payload.instances?.[0]?.prompt || "Edukacyjna ilustracja dla dzieci";

      // 2. WYSŁANIE DO NOWEGO MODELU OPENAI (gpt-image-1-mini)
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${openaiKey}` 
        },
        body: JSON.stringify({
          model: "gpt-image-1-mini",
          prompt: prompt,
          n: 1,
          size: "1024x1024",
          response_format: "b64_json"
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "Błąd modelu gpt-image-1-mini");

      // 3. ZWROT W FORMACIE UDAJĄCYM IMAGEN
      return res.status(200).json({
        predictions: [{ bytesBase64Encoded: data.data[0].b64_json }]
      });
    }
  } catch (error) {
    console.error("Błąd Translacji API:", error);
    res.status(500).json({ error: error.message });
  }
}

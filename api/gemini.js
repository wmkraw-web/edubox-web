export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metoda niedozwolona' });
  }

  const { payload, type, prompt } = req.body;
  const openaiKey = process.env.OPENAI_API_KEY;
  const stabilityKey = process.env.STABILITY_API_KEY; 

  try {
    // 1. Obsługa tekstowa (dla Twoich istniejących apek)
    if (prompt) {
      if (!openaiKey) return res.status(200).json({ candidates: [{ content: { parts: [{ text: "🚨 BŁĄD VERCEL: Brak klucza OPENAI." }] } }] });

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiKey}` },
          body: JSON.stringify({ 
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }]
          })
      });
      const data = await response.json();
      return res.status(200).json({ candidates: [{ content: { parts: [{ text: data.choices[0].message.content }] } }] });
    }

    // 2. Obsługa Graficzna (zaktualizowana dla EduStudio)
    if (type === 'image') {
      if (!stabilityKey || !openaiKey) return res.status(500).json({ error: 'Brak kluczy API' });

      // Dynamiczne pobieranie wymiarów z payloadu (dzięki temu EduStudio zadziała!)
      const width = payload.width || 1024;
      const height = payload.height || 1024;

      const stabilityBody = {
          text_prompts: [
            { text: payload.prompt, weight: 1 }, 
            { text: payload.negative_prompt || "text, watermark", weight: -1 } 
          ],
          cfg_scale: 7,
          height: height, // <-- Zmiana: dynamiczna wysokość
          width: width,   // <-- Zmiana: dynamiczna szerokość
          steps: 20, 
          samples: 1
      };
      
      if (payload.style_preset) stabilityBody.style_preset = payload.style_preset;

      const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Authorization': `Bearer ${stabilityKey}` },
        body: JSON.stringify(stabilityBody)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Błąd Stability AI");

      return res.status(200).json({
        predictions: [{ bytesBase64Encoded: data.artifacts[0].base64 }]
      });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

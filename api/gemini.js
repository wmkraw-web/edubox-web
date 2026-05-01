export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { payload, type } = req.body;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (type === 'text') {
    if (!geminiApiKey) return res.status(500).json({ error: 'Błąd: Brak GEMINI_API_KEY w Vercel.' });

    // WRACAMY DO KORZENI: Stary, niezawodny model gemini-pro (ten sam co w Streamlit)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`;
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
    const stabilityApiKey = process.env.STABILITY_API_KEY;
    if (!stabilityApiKey) return res.status(500).json({ error: 'Błąd: Brak STABILITY_API_KEY w Vercel.' });

    let promptText = "Cute educational illustration";
    if (payload.instances && payload.instances.prompt) promptText = payload.instances.prompt;
    else if (payload.prompt) promptText = payload.prompt;

    try {
      let englishPrompt = promptText;
      if (geminiApiKey) {
         // Auto-tłumacz również na starym modelu gemini-pro
         const translateUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`;
         const translateResponse = await fetch(translateUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `Translate to English. Return ONLY the translation:\n\n${promptText}` }] }],
                generationConfig: { temperature: 0.1 }
            })
         });
         const translateData = await translateResponse.json();
         if (translateData.candidates?.[0]?.content?.parts?.[0]?.text) {
             englishPrompt = translateData.candidates[0].content.parts[0].text.trim().replace(/^"|"$/g, '');
         }
      }

      const formData = new FormData();
      formData.append('prompt', englishPrompt);
      formData.append('output_format', 'jpeg');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8500); 

      const url = 'https://api.stability.ai/v2beta/stable-image/generate/core';
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${stabilityApiKey}`, 'Accept': 'application/json' },
        body: formData,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const data = await response.json();
      
      if (!response.ok) return res.status(500).json({ error: data.name || data.message || 'Błąd Stability AI' });
      if (data.image) res.status(200).json({ predictions: [{ bytesBase64Encoded: data.image }] });
      else res.status(500).json({ error: 'Brak obrazu z serwera.' });
      
    } catch (error) {
      if (error.name === 'AbortError') res.status(504).json({ error: 'Czas oczekiwania minął.' });
      else res.status(500).json({ error: error.message });
    }
  } else {
      res.status(400).json({ error: 'Nieznany typ zapytania.' });
  }
}

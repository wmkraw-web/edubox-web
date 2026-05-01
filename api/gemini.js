export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { payload, type } = req.body;

  if (type === 'text') {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) return res.status(500).json({ error: 'Błąd: Brak klucza OPENAI_API_KEY w Vercel.' });

    // Tłumaczymy format zapytania ze starego na profesjonalne OpenAI
    let systemPrompt = "Jesteś ekspertem edukacyjnym.";
    if (payload.systemInstruction?.parts?.[0]?.text) {
        systemPrompt = payload.systemInstruction.parts[0].text;
    }

    let userPrompt = "";
    if (payload.contents?.[0]?.parts?.[0]?.text) {
        userPrompt = payload.contents[0].parts[0].text;
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini', // Błyskawiczny, niezawodny model dla profesjonalistów
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: payload.generationConfig?.temperature || 0.4
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Błąd API OpenAI');

      // Oszukujemy pliki HTML, że format odpowiedzi jest po staremu, by nic nie popsuć
      res.status(200).json({
        candidates: [{ content: { parts: [{ text: data.choices[0].message.content }] } }]
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }

  } else if (type === 'image') {
    const stabilityApiKey = process.env.STABILITY_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!stabilityApiKey) return res.status(500).json({ error: 'Błąd: Brak klucza STABILITY_API_KEY w Vercel.' });

    let promptText = "Cute educational illustration";
    if (payload.instances && payload.instances.prompt) promptText = payload.instances.prompt;
    else if (payload.prompt) promptText = payload.prompt;

    try {
      let englishPrompt = promptText;
      if (openaiKey) {
         // Auto-tłumacz również używa niezawodnego OpenAI
         const translateResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiKey}` },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: "system", content: "Translate to English. Return ONLY the translation, no quotes." },
                    { role: "user", content: promptText }
                ],
                temperature: 0.1
            })
         });
         const translateData = await translateResponse.json();
         if (translateResponse.ok && translateData.choices?.[0]) {
             englishPrompt = translateData.choices[0].message.content.trim();
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

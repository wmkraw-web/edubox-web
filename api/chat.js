export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Metoda niedozwolona' });
  }

  const { prompt, system, temperature = 0.5, format = "text", model = "gpt-4o-mini" } = req.body;

  if (!prompt) {
    return res.status(400).json({ message: 'Brak polecenia (promptu)' });
  }

  try {
    const payload = {
      model: model, 
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt }
      ],
      temperature: temperature
    };

    if (format === "json") {
      payload.response_format = { type: "json_object" };
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      // Przekazujemy dokładny błąd od OpenAI, żeby wiedzieć, co się zepsuło
      throw new Error(data.error?.message || "Nieznany błąd od OpenAI");
    }

    res.status(200).json({ text: data.choices[0].message.content });

  } catch (error) {
    console.error("Szczegóły błędu w API:", error);
    res.status(500).json({ message: 'Błąd serwera API', details: error.message });
  }
}

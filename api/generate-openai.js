export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Metoda niedozwolona' });
  }

  const { prompt, size } = req.body;

  if (!prompt) {
    return res.status(400).json({ message: 'Brak polecenia (promptu)' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ message: 'Brak klucza OPENAI_API_KEY w zmiennych środowiskowych Vercela.' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: prompt,
        size: size || '1024x1536',
        n: 1
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `Błąd API OpenAI (status ${response.status})`;
      throw new Error(errorMessage);
    }

    const data = await response.json();

    if (data.data && data.data.length > 0 && data.data[0].b64_json) {
      res.status(200).json({ imageUrl: `data:image/png;base64,${data.data[0].b64_json}` });
    } else if (data.data && data.data.length > 0 && data.data[0].url) {
      res.status(200).json({ imageUrl: data.data[0].url });
    } else {
      throw new Error('Pusta odpowiedź z OpenAI - nie wygenerowano obrazka.');
    }

  } catch (error) {
    console.error('Szczegóły błędu OpenAI Images API:', error);
    res.status(500).json({ message: error.message });
  }
}

export default async function handler(req, res) {
  // Akceptujemy tylko zapytania POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Metoda niedozwolona' });
  }

  // Odczytujemy prompt i wymiary (size) wysyłane z Twoich aplikacji
  const { prompt, size } = req.body;

  if (!prompt) {
    return res.status(400).json({ message: 'Brak polecenia (promptu)' });
  }

  const imageSize = size || "1024x1024";

  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "dall-e-3", 
        prompt: prompt,
        n: 1,
        size: imageSize,
        quality: "standard" 
      })
    });

    if (!response.ok) {
      // Pobieramy DOKŁADNY obiekt błędu od OpenAI
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || "Odrzucono zapytanie przez serwery OpenAI.");
    }

    const data = await response.json();
    res.status(200).json({ imageUrl: data.data[0].url });

  } catch (error) {
    console.error("Szczegóły błędu OpenAI:", error);
    // KLUCZOWA ZMIANA: Wysyłamy dokładną treść błędu z powrotem do Twojej przeglądarki!
    res.status(500).json({ message: `Błąd OpenAI: ${error.message}` });
  }
}

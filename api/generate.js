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

  // OpenAI DALL-E 3 akceptuje tylko sztywne wymiary:
  // "1024x1024" (Kwadrat), "1024x1792" (Pion), "1792x1024" (Poziom)
  // Jeżeli aplikacja nie wyśle wymiaru, dajemy domyślnie kwadrat.
  const imageSize = size || "1024x1024";

  try {
    // Łączymy się z serwerami OpenAI
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "dall-e-3", // Główny, najlepszy model OpenAI do obrazów
        prompt: prompt,
        n: 1,
        size: imageSize,
        quality: "standard" // Można zmienić na "hd", ale "standard" jest w zupełności wystarczające i tańsze
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Błąd OpenAI: ${errorData}`);
    }

    const data = await response.json();
    
    // Zwracamy adres URL wygenerowanego obrazka do frontendu
    // DALL-E 3 umieszcza go w data.data[0].url
    res.status(200).json({ imageUrl: data.data[0].url });

  } catch (error) {
    console.error("Błąd podczas łączenia z OpenAI:", error);
    res.status(500).json({ message: 'Wystąpił błąd serwera podczas generowania obrazu.' });
  }
}

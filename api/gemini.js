export default async function handler(req, res) {
  // Akceptujemy tylko zapytania POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metoda niedozwolona' });
  }

  const { payload, type } = req.body;
  
  // Odczytujemy klucz z ustawień Twojego Vercela! (Zakładka Settings -> Environment Variables)
  // Upewnij się, że masz tam dodaną zmienną o nazwie GEMINI_API_KEY
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Brak klucza GEMINI_API_KEY w ustawieniach Vercel!' });
  }

  try {
    // Rozdzielamy zapytania na tekstowe (Gemini 2.5) i graficzne (Imagen 4.0)
    const url = type === 'text' 
        ? `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`
        : `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || "Błąd bezpośrednio od Google API" });
    }

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Krytyczny błąd serwera Vercel: ' + error.message });
  }
}

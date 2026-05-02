export default async function handler(req, res) {
  // Akceptujemy tylko zapytania POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metoda niedozwolona' });
  }

  const { payload, type } = req.body;
  
  // Pobieramy Twój klucz z zaplecza Vercela
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Brak klucza GEMINI_API_KEY na Vercelu!' });
  }

  try {
    // ZMIANA: Używamy stabilnych, publicznie dostępnych modeli Google (1.5 Flash)
    const url = type === 'text' 
        ? `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`
        : `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || "Błąd API Google" });
    }

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Krytyczny błąd serwera Vercel: ' + error.message });
  }
}

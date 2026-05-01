// Plik: api/gemini.js (Twoje bezpieczne zaplecze na Vercel)
export default async function handler(req, res) {
  // Akceptujemy tylko metodę POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Odbieramy dane z Twojej strony (payload to instrukcje dla AI, type to rodzaj: tekst czy obraz)
  const { payload, type } = req.body;
  
  // Pobieramy ukryty klucz ze Zmiennych Środowiskowych Vercela! (BEZPIECZEŃSTWO 100%)
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Błąd serwera: Brak klucza API w Vercel Environment Variables.' });
  }

  // Decydujemy z jakim adresem Google się połączyć
  let url = '';
  if (type === 'text') {
    url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  } else if (type === 'image') {
    url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    res.status(200).json(data); // Odsyłamy wynik z powrotem do Twojej strony
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

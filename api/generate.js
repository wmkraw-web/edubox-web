export default async function handler(req, res) {
  // Akceptujemy tylko zapytania POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Metoda niedozwolona' });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ message: 'Brak polecenia (promptu)' });
  }

  try {
    // Łączymy się z szybkim serwerem Fal.ai (model Schnell)
    const response = await fetch('https://fal.run/fal-ai/flux/schnell', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${process.env.FAL_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: prompt,
        image_size: "square_hd",
        num_inference_steps: 4, 
        num_images: 1,
        enable_safety_checker: true
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Błąd Fal.ai: ${errorData}`);
    }

    const data = await response.json();
    
    // Zwracamy adres URL wygenerowanego obrazka
    res.status(200).json({ imageUrl: data.images[0].url });

  } catch (error) {
    console.error("Błąd podczas łączenia z Fal:", error);
    res.status(500).json({ message: 'Wystąpił błąd serwera podczas generowania obrazu.' });
  }
}

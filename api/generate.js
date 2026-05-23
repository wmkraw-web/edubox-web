export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Metoda niedozwolona' });
  }

  // Odczytujemy prompt ORAZ wybrany format z frontendu
  const { prompt, aspect_ratio } = req.body;

  if (!prompt) {
    return res.status(400).json({ message: 'Brak polecenia (promptu)' });
  }

  // Mapujemy Twoje opcje z frontendu na formaty akceptowane przez Fal.ai (Flux)
  // Dostępne w Fal/Flux: "square_hd", "16:9", "4:3", "3:2", "2:3", "9:16"
  let falAspectRatio = "square_hd"; // Domyślnie
  
  if (aspect_ratio === '3:4') {
    falAspectRatio = "3:4"; // Pionowy plakat
  } else if (aspect_ratio === '4:3') {
    falAspectRatio = "4:3"; // Poziomy
  }

  try {
    const response = await fetch('https://fal.run/fal-ai/flux/schnell', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${process.env.FAL_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: prompt,
        image_size: falAspectRatio, // Teraz to będzie dynamiczne!
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

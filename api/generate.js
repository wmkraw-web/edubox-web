export default async function handler(req, res) {
  // Akceptujemy tylko zapytania POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Metoda niedozwolona' });
  }

  // Odczytujemy prompt i wybrane proporcje z frontendu
  const { prompt, aspect_ratio } = req.body;

  if (!prompt) {
    return res.status(400).json({ message: 'Brak polecenia (promptu)' });
  }

  // Mapowanie formatów z EduPlakatu i EduPrezentacji na język zrozumiały dla modelu Flux
  let falImageSize = "square_hd"; // Domyślnie kwadrat
  
  if (aspect_ratio === '3:4') {
    falImageSize = "3:4";   // EduPlakat Pionowy
  } else if (aspect_ratio === '4:3') {
    falImageSize = "4:3";   // EduPlakat Poziomy
  } else if (aspect_ratio === '16:9') {
    falImageSize = "16:9";  // EduPrezentacja (Slajdy panoramiczne)
  } else if (aspect_ratio === '1:1') {
    falImageSize = "1:1";   // Kwadrat
  }

  try {
    // Łączymy się z superszybkim serwerem Fal.ai (model Flux Schnell)
    const response = await fetch('https://fal.run/fal-ai/flux/schnell', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${process.env.FAL_KEY}`, // Używamy Twojego klucza Fal
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: prompt,
        image_size: falImageSize, // Przekazujemy dynamiczne proporcje
        num_inference_steps: 4,   // 4 kroki to standard dla superszybkiego modelu Schnell
        num_images: 1,
        enable_safety_checker: true
      })
    });

    // Najpierw sprawdzamy błędy
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.message || "Odrzucono zapytanie przez Fal.ai");
    }

    const data = await response.json();
    
    // Zwracamy adres URL wygenerowanego obrazka do frontendu
    // Fal.ai umieszcza go w tablicy images[0].url
    if (data.images && data.images.length > 0) {
        res.status(200).json({ imageUrl: data.images[0].url });
    } else {
        throw new Error("Pusta odpowiedź - nie wygenerowano obrazka.");
    }

  } catch (error) {
    console.error("Szczegóły błędu Fal.ai:", error);
    // Wysyłamy dokładną treść błędu z powrotem do przeglądarki
    res.status(500).json({ message: `Błąd serwera: ${error.message}` });
  }
}

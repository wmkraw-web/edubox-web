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

  // Fal.ai (model Flux) akceptuje tylko bardzo konkretne nazwy formatów.
  // Tłumaczymy wartości z EduPlakatu i EduPrezentacji na język serwera:
  let falImageSize = "square_hd"; // Domyślnie kwadrat
  
  if (aspect_ratio === '3:4') {
    falImageSize = "portrait_4_3";   // Fal.ai: Pion 
  } else if (aspect_ratio === '4:3') {
    falImageSize = "landscape_4_3";  // Fal.ai: Poziom
  } else if (aspect_ratio === '16:9') {
    falImageSize = "landscape_16_9"; // Fal.ai: Panorama (EduPrezentacja)
  } else if (aspect_ratio === '1:1') {
    falImageSize = "square_hd";      // Fal.ai: Kwadrat
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
        image_size: falImageSize, // Używamy poprawnych nazw wymiarów Fal
        num_inference_steps: 4,   // 4 kroki (standard dla szybkiego Flux)
        num_images: 1,
        enable_safety_checker: true
      })
    });

    // Inteligentny system wyłapywania błędów - likwiduje [object Object]
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      let errorMessage = errorData.message || "Fal.ai odrzucił zapytanie.";
      
      // Rozpakowanie szczegółów błędu jeśli istnieją
      if (errorData.detail) {
        if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map(e => e.msg).join(', ');
        } else if (typeof errorData.detail === 'object') {
          errorMessage = JSON.stringify(errorData.detail);
        } else {
          errorMessage = errorData.detail;
        }
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    // Zwracamy adres URL wygenerowanego obrazka do frontendu
    if (data.images && data.images.length > 0) {
        res.status(200).json({ imageUrl: data.images[0].url });
    } else {
        throw new Error("Pusta odpowiedź z Fal.ai - nie wygenerowano obrazka.");
    }

  } catch (error) {
    console.error("Szczegóły błędu:", error);
    // Zwracamy czysty tekst, gotowy do wyświetlenia na czerwonym pasku błędów
    res.status(500).json({ message: error.message });
  }
}

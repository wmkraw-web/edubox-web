export default async function handler(req, res) {
  // Akceptujemy tylko zapytania POST[cite: 5]
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Metoda niedozwolona' });
  }

  // Odczytujemy prompt, wymiary ORAZ nowe parametry dla zdjęć
  const { prompt, aspect_ratio, init_image, image_strength } = req.body;

  if (!prompt) {
    return res.status(400).json({ message: 'Brak polecenia (promptu)' });
  }

  // Tłumaczymy wartości wymiarów na język serwera Fal.ai[cite: 5]
  let falImageSize = "square_hd"; // Domyślnie kwadrat[cite: 5]
  if (aspect_ratio === '3:4') {
    falImageSize = "portrait_4_3";   // Pion[cite: 5]
  } else if (aspect_ratio === '4:3') {
    falImageSize = "landscape_4_3";  // Poziom[cite: 5]
  } else if (aspect_ratio === '16:9') {
    falImageSize = "landscape_16_9"; // Panorama[cite: 5]
  }

  try {
    // Domyślna konfiguracja dla normalnego generowania tekstu (Text-to-Image)
    let endpointUrl = 'https://fal.run/fal-ai/flux/schnell';
    let payload = {
      prompt: prompt,
      image_size: falImageSize,
      num_inference_steps: 4,   // 4 kroki dla modelu Schnell[cite: 5]
      num_images: 1, //[cite: 5]
      enable_safety_checker: true //[cite: 5]
    };

    // INTELIGENTNE PRZEŁĄCZANIE: Jeśli otrzymaliśmy wgrane zdjęcie
    if (init_image) {
      endpointUrl = 'https://fal.run/fal-ai/flux/dev/image-to-image'; // Specjalny endpoint dla obrazów
      payload = {
        prompt: prompt,
        image_url: init_image, // Przekazujemy zdjęcie z przeglądarki
        strength: image_strength || 0.45, // Jak bardzo AI ma trzymać się oryginału
        image_size: falImageSize,
        num_inference_steps: 25, // Model Dev potrzebuje więcej kroków dla precyzji
        enable_safety_checker: true
      };
    }

    // Łączymy się z serwerem Fal.ai używając dynamicznego endpointu i payloadu
    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${process.env.FAL_KEY}`, //[cite: 5]
        'Content-Type': 'application/json' //[cite: 5]
      },
      body: JSON.stringify(payload)
    });

    // Inteligentny system wyłapywania błędów[cite: 5]
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      let errorMessage = errorData.message || "Fal.ai odrzucił zapytanie.";
      
      if (errorData.detail) { //[cite: 5]
        if (Array.isArray(errorData.detail)) { //[cite: 5]
          errorMessage = errorData.detail.map(e => e.msg).join(', '); //[cite: 5]
        } else if (typeof errorData.detail === 'object') { //[cite: 5]
          errorMessage = JSON.stringify(errorData.detail); //[cite: 5]
        } else {
          errorMessage = errorData.detail; //[cite: 5]
        }
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    // Zwracamy adres URL wygenerowanego obrazka do frontendu[cite: 5]
    if (data.images && data.images.length > 0) { //[cite: 5]
        res.status(200).json({ imageUrl: data.images[0].url }); //[cite: 5]
    } else {
        throw new Error("Pusta odpowiedź z Fal.ai - nie wygenerowano obrazka."); //[cite: 5]
    }

  } catch (error) {
    console.error("Szczegóły błędu:", error); //[cite: 5]
    res.status(500).json({ message: error.message }); //[cite: 5]
  }
}

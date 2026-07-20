export default async function handler(req, res) {
  // Akceptujemy tylko zapytania POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Metoda niedozwolona' });
  }

  // Odczytujemy wszystkie parametry, w tym nowe (init_image dla zdjęć)
  const { prompt, aspect_ratio, init_image, image_strength } = req.body;

  if (!prompt) {
    return res.status(400).json({ message: 'Brak polecenia (promptu)' });
  }

  // Tłumaczenie wymiarów
  let falImageSize = "square_hd"; 
  if (aspect_ratio === '3:4') {
    falImageSize = "portrait_4_3";   
  } else if (aspect_ratio === '4:3') {
    falImageSize = "landscape_4_3";  
  } else if (aspect_ratio === '16:9') {
    falImageSize = "landscape_16_9"; 
  }

  try {
    // ---------------------------------------------------------
    // TRYB 1: GENEROWANIE Z TEKSTU (Model: FLUX Schnell)
    // ---------------------------------------------------------
    let endpointUrl = 'https://fal.run/fal-ai/flux/schnell';
    let payload = {
      prompt: prompt,
      image_size: falImageSize,
      num_inference_steps: 4,
      num_images: 1,
      enable_safety_checker: true
    };

    // ---------------------------------------------------------
    // TRYB 2: GENEROWANIE ZE ZDJĘCIA (Model: FAST SDXL)
    // ---------------------------------------------------------
    if (init_image) {
      // SDXL jest znacznie lepszy w trzymaniu się stylu line-art bez niszczenia twarzy
      endpointUrl = 'https://fal.run/fal-ai/fast-sdxl/image-to-image';
      payload = {
        prompt: prompt,
        image_url: init_image,
        strength: 0.65, // 65% to idealny balans dla SDXL (trzyma twarz, ale zmienia styl)
        image_size: falImageSize,
        style_preset: "line-art", // Parametr, którego Flux nie obsługuje, a SDXL tak!
        num_inference_steps: 30, // Większa precyzja
        enable_safety_checker: true
      };
    }

    // Wysłanie zapytania do chmury FAL
    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${process.env.FAL_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    // Inteligentny system wyłapywania błędów
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      let errorMessage = errorData.message || "Fal.ai odrzucił zapytanie.";
      
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
    console.error("Szczegóły błędu API:", error);
    res.status(500).json({ message: error.message });
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, style, format, customText, init_image, image_strength } = req.body;
  const falKey = process.env.FAL_KEY;

  if (!falKey) {
    return res.status(500).json({ error: 'Brak klucza FAL_KEY w zmiennych środowiskowych Vercela.' });
  }

  // Modyfikatory stylu
  let styleModifier = "";
  if (style === 'akwarela') styleModifier = "beautiful watercolor illustration, soft pastel colors, artistic, highly detailed";
  if (style === 'wektor') styleModifier = "flat vector illustration, clean lines, vibrant colors, 2D game asset style, no gradients";
  if (style === 'disney') styleModifier = "3D Pixar Disney style render, cute, magical, highly detailed, vivid colors, volumetric lighting";
  if (style === 'kolorowanka') styleModifier = "black and white line art, coloring book page, clear outlines, no shading, pure white background";

  // Modyfikatory formatu
  let formatModifier = "";
  let imageSize = "square_hd";
  if (format === 'medal') {
      formatModifier = "perfectly circular badge design, isolated on pure white background, easy to cut out with scissors, centered";
      imageSize = "square_hd";
  } else if (format === 'zaproszenie') {
      formatModifier = "vertical composition, elegant layout, leaving empty negative space for writing text";
      imageSize = "portrait_4_3";
  } else if (format === 'dyplom') {
      formatModifier = "horizontal composition, decorative border framing, leaving empty negative space in the center for writing text";
      imageSize = "landscape_4_3";
  } else if (format === 'naklejka') {
      formatModifier = "sticker design, isolated on pure white background, centered";
      imageSize = "square_hd";
  }

  // Zabezpieczenie przed "wymyślaniem" dziwnego języka przez AI
  let textModifier = "";
  if (customText && customText.trim() !== "") {
      textModifier = `The image MUST prominently feature the exact text: "${customText.trim()}". The typography must be beautiful, legible, and well-integrated into the design.`;
  } else {
      textModifier = `DO NOT include any text, letters, or words in the image.`;
  }

  const finalPrompt = `Subject: ${prompt}. ${textModifier} ${styleModifier}. ${formatModifier}. High quality, professional educational material for kindergarten.`;

  // TRYB "WŁASNE ZDJĘCIE": jeśli przyszło init_image (zdjęcie/rysunek wgrane przez użytkownika),
  // zamiast czystego generowania z tekstu (Flux) używamy SDXL image-to-image, żeby AI przemalowało
  // DOKŁADNIE ten obrazek w wybranym stylu, zamiast wymyślać coś od zera.
  // UWAGA: celowo NIE wysyłamy tu "style_preset" (wcześniej było na sztywno "line-art" niezależnie
  // od wyboru użytkownika, co ignorowało np. styl Disney/akwarela) - opis stylu jest już w finalPrompt
  // (styleModifier), tak samo jak w trybie tekstowym, więc SDXL trzyma się wybranego stylu poprawnie.
  const endpointUrl = init_image
    ? "https://fal.run/fal-ai/fast-sdxl/image-to-image"
    : "https://fal.run/fal-ai/flux/schnell";

  const payload = init_image
    ? {
        prompt: finalPrompt,
        image_url: init_image,
        strength: typeof image_strength === 'number' ? image_strength : 0.65,
        image_size: imageSize,
        num_inference_steps: 30,
        enable_safety_checker: true
      }
    : {
        prompt: finalPrompt,
        image_size: imageSize,
        num_inference_steps: 4
      };

  try {
    const response = await fetch(endpointUrl, {
      method: "POST",
      headers: {
        "Authorization": `Key ${falKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Błąd API Fal.ai: ${errorText}`);
    }

    const data = await response.json();

    // WAŻNE: model SDXL (używany w trybie ze zdjęciem) w razie wykrycia "niebezpiecznej" treści
    // NIE zwraca błędu - podmienia obrazek na całkowicie czarny i ustawia has_nsfw_concepts[0]=true.
    // Bez tego sprawdzenia taki czarny obrazek wyglądał jak poprawny wynik. To częsty "fałszywy alarm"
    // przy zdjęciach realnych osób/dzieci, dlatego dajemy użytkownikowi zrozumiały komunikat zamiast
    // po cichu wstawiać czarny kwadrat.
    const flagged = Array.isArray(data.has_nsfw_concepts) && data.has_nsfw_concepts[0];
    if (flagged) {
      return res.status(422).json({ error: 'Zdjęcie zostało zablokowane przez automatyczny filtr bezpieczeństwa AI (to częsty "fałszywy alarm" przy zdjęciach osób/dzieci). Spróbuj: użyć rysunku zamiast zdjęcia, przyciąć kadr do samej zabawki/maskotki, albo wybrać inne zdjęcie.' });
    }

    if (data.images && data.images.length > 0) {
      res.status(200).json({ url: data.images[0].url });
    } else {
      throw new Error("Model nie wygenerował obrazka.");
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

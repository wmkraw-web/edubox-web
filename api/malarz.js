// Plik: api/malarz.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, style, format } = req.body;
  const falKey = process.env.FAL_KEY;

  if (!falKey) {
    return res.status(500).json({ error: 'Brak klucza FAL_KEY w zmiennych środowiskowych Vercela.' });
  }

  // Zaawansowany Prompt Engineering dla najwyższej jakości
  let styleModifier = "";
  if (style === 'akwarela') styleModifier = "beautiful watercolor illustration, soft pastel colors, artistic, painted by a master illustrator, highly detailed";
  if (style === 'wektor') styleModifier = "flat vector illustration, clean lines, vibrant colors, 2D game asset style, no gradients, clear and sharp";
  if (style === 'disney') styleModifier = "3D Pixar Disney style render, cute, magical, highly detailed, vivid colors, 8k resolution, volumetric lighting";
  if (style === 'kolorowanka') styleModifier = "black and white line art, coloring book page, clear outlines, no shading, pure white background";

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
  }

  const finalPrompt = `${styleModifier}. Subject: ${prompt}. ${formatModifier}. High quality, professional educational material for kindergarten.`;

  try {
    // Używamy modelu Flux Schnell przez Fal.ai dla niesamowitej jakości i szybkości
    const response = await fetch("https://fal.run/fal-ai/flux/schnell", {
      method: "POST",
      headers: {
        "Authorization": `Key ${falKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt: finalPrompt,
        image_size: imageSize,
        num_inference_steps: 4
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Błąd API Fal.ai: ${errorText}`);
    }

    const data = await response.json();
    
    if (data.images && data.images.length > 0) {
      res.status(200).json({ url: data.images[0].url });
    } else {
      throw new Error("Model nie wygenerował obrazka.");
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

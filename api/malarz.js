// GPT Image 2.5 rysuje ~15–20 s, a przy awarii łańcuch próbuje kolejnych modeli (imageModels.js).
import { isRateLimited } from './_lib/rateLimit.js';
import { runImageChain } from './_lib/imageModels.js';

export const maxDuration = 300;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (isRateLimited(req, { name: 'malarz', windowMs: 10 * 60 * 1000, max: 25 })) {
    return res.status(429).json({ error: 'Zbyt wiele generacji obrazków w krótkim czasie. Spróbuj ponownie za kilka minut.' });
  }

  const { prompt, style, format, customText, init_image, image_strength, model, seed, reference_images, reference_image } = req.body;
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

  // Dobór modelu (api/_lib/imageModels.js): model:'recraft' bez zdjęcia -> Recraft V4.1 (medale, ramki,
  // dyplomy – czysta kompozycja z miejscem na tekst); zdjęcie/rysunek użytkownika -> GPT Image 2.5 edit
  // (przerabia DOKŁADNIE ten obrazek w wybranym stylu); pozostałe -> GPT Image 2.5, który poprawnie pisze
  // polskie teksty z customText. Przy błędzie lub odmowie modelu łańcuch próbuje kolejnych.
  let recraftStyle = 'digital_illustration';
  if (style === 'wektor') recraftStyle = 'vector_illustration';
  else if (style === 'akwarela') recraftStyle = 'digital_illustration/hand_drawn';

  try {
    const result = await runImageChain({
      prompt: finalPrompt, preset: imageSize, seed,
      initImage: init_image, imageStrength: image_strength,
      referenceImages: Array.isArray(reference_images) ? reference_images : (reference_image ? [reference_image] : []),
      kind: model === 'recraft' && !init_image ? 'design' : 'text',
      style: recraftStyle, falKey
    });
    res.status(200).json({ url: result.url, model: result.model });
  } catch (error) {
    if (error.status === 422) return res.status(422).json({ error: error.message });
    res.status(500).json({ error: error.message });
  }
}

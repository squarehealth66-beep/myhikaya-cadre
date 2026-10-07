exports.handler = async function (event) {
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store"
  };

  try {
    // Autoriser uniquement GET pour ce test
    if (event.httpMethod !== "GET") {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({
          success: false,
          error: "Méthode non autorisée."
        })
      };
    }

    // Récupération de la clé Gemini depuis Netlify
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: "GEMINI_API_KEY non configurée dans Netlify."
        })
      };
    }

    // Prompt de test
    const prompt = `
Create a premium original children's storybook illustration.

Scene:
A joyful little explorer having an adventure in outer space.

Style:
Premium cinematic 3D children's illustration,
high quality,
beautiful lighting,
detailed environment,
expressive character,
professional composition,
colorful but elegant,
suitable for a premium children's book.

Important:
Create an original scene.
Do not use copyrighted characters, logos or existing franchises.
`;

    // Appel Gemini
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/interactions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          model: "gemini-nano-banana-2.1",

          input: [
            {
              type: "text",
              text: prompt
            }
          ],

          response_format: {
            type: "image",
            mime_type: "image/jpeg",
            aspect_ratio: "1:1",
            image_size: "1K"
          }
        })
      }
    );

    const result = await response.json();

    // Erreur Gemini
    if (!response.ok) {
      console.error(
        "Gemini API error:",
        JSON.stringify(result)
      );

      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({
          success: false,
          error: "Gemini a refusé la génération.",
          details: result
        })
      };
    }

    // Vérification de l'image
    const image = result?.output_image;

    if (!image || !image.data) {
      console.error(
        "Réponse Gemini sans image:",
        JSON.stringify(result)
      );

      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({
          success: false,
          error: "Gemini n'a pas retourné d'image.",
          details: result
        })
      };
    }

    // Succès
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: "Gemini fonctionne correctement.",
        mimeType: image.mime_type || "image/jpeg",
        imageBase64: image.data
      })
    };

  } catch (error) {
    console.error(
      "Erreur serveur:",
      error?.message || error
    );

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: "Erreur serveur lors de la communication avec Gemini."
      })
    };
  }
};

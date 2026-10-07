exports.handler = async function (event) {
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store"
  };

  try {
    // ─────────────────────────────────────────────
    // 1. Autoriser uniquement GET pour notre test
    // ─────────────────────────────────────────────
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

    // ─────────────────────────────────────────────
    // 2. Récupérer la clé secrète Netlify
    // ─────────────────────────────────────────────
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

    // ─────────────────────────────────────────────
    // 3. Appel Gemini
    // ─────────────────────────────────────────────
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

          input:
            "Create a premium original children's storybook illustration of a little explorer having a joyful adventure in outer space. Beautiful cinematic 3D style, expressive character, detailed environment, professional composition, suitable for a high-quality children's book.",

          response_format: {
            type: "image",
            mime_type: "image/jpeg",
            aspect_ratio: "1:1",
            image_size: "1K"
          }
        })
      }
    );

    // ─────────────────────────────────────────────
    // 4. Lire la réponse Gemini
    // ─────────────────────────────────────────────
    const result = await response.json();

    if (!response.ok) {
      console.error(
        "Gemini API error:",
        JSON.stringify(result)
      );

      return {
        statusCode: response.status >= 400 && response.status < 500
          ? 400
          : 502,

        headers,

        body: JSON.stringify({
          success: false,
          error: "Gemini a refusé la génération.",
          details: result?.error?.message || "Erreur Gemini."
        })
      };
    }

    // ─────────────────────────────────────────────
    // 5. Vérifier que Gemini a réellement généré
    //    une image
    // ─────────────────────────────────────────────
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
          error: "Gemini n'a pas retourné d'image."
        })
      };
    }

    // ─────────────────────────────────────────────
    // 6. Succès
    // ─────────────────────────────────────────────
    return {
      statusCode: 200,

      headers,

      body: JSON.stringify({
        success: true,
        message: "Gemini fonctionne.",
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

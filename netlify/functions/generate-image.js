exports.handler = async function (event) {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          success: false,
          error: "Méthode non autorisée."
        })
      };
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          success: false,
          error: "GEMINI_API_KEY non configurée."
        })
      };
    }

    const data = JSON.parse(event.body || "{}");

    const childName = String(data.childName || "").trim();
    const theme = String(data.theme || "").trim();
    const photoBase64 = String(data.photoBase64 || "").trim();
    const mimeType = String(data.mimeType || "image/jpeg").trim();

    if (!childName || !theme || !photoBase64) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          success: false,
          error: "Prénom, thème et photo sont nécessaires."
        })
      };
    }

    const prompt = `
Create a premium personalized children's storybook-style illustration.

Child's first name: ${childName}
Theme: ${theme}

Use the supplied child photo as the visual reference for the child.
Preserve the child's recognizable facial characteristics without making identity claims.

Create an original, warm, joyful and premium children's illustration.
The child must be naturally integrated into the chosen theme.
Do not add logos, copyrighted characters, brands or franchise characters.

Leave a clean, bright upper area suitable for adding the child's story text later.
Place the main illustrated scene in the lower portion.
High-quality cinematic 3D children's-book aesthetic.
Beautiful lighting, polished composition, print-ready appearance.
`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt
            },
            {
              inline_data: {
                mime_type: mimeType,
                data: photoBase64
              }
            }
          ]
        }
      ],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"]
      }
    };

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify(requestBody)
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("Gemini error:", JSON.stringify(result));

      return {
        statusCode: 502,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          success: false,
          error: "La génération Gemini a échoué."
        })
      };
    }

    const parts = result?.candidates?.[0]?.content?.parts || [];

    const imagePart = parts.find(
      part => part.inlineData || part.inline_data
    );

    if (!imagePart) {
      return {
        statusCode: 502,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          success: false,
          error: "Gemini n'a pas retourné d'image."
        })
      };
    }

    const generated = imagePart.inlineData || imagePart.inline_data;

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        success: true,
        mimeType: generated.mimeType || generated.mime_type || "image/png",
        imageBase64: generated.data
      })
    };

  } catch (error) {
    console.error("Server error:", error);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        success: false,
        error: "Erreur serveur."
      })
    };
  }
};

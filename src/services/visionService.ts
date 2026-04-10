// src/services/visionService.ts

const API_KEY = "AIzaSyDCCamdXw6w9_uDmpX7TVEZt6ajrwO8BEk";
const API_URL = `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`;

/**
 * Converts an image file from a URL to a base64 string.
 */
async function imageToBase64(imageUrl: string): Promise<string> {
  const response = await fetch(imageUrl);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () =>
      resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Hardcoded fallback response (mock Vision API output)
 */
function getFallbackVisionResponse() {
  return {
    responses: [
      {
        labelAnnotations: [
          { description: "red", score: 0.92 },
          { description: "orange", score: 0.88 },
          { description: "yellow", score: 0.84 },
        ],
        localizedObjectAnnotations: [
          {
            name: "Truck",
            score: 0.90,
            boundingPoly: {
              normalizedVertices: [
                { x: 0.1, y: 0.4 },
                { x: 0.8, y: 0.4 },
                { x: 0.8, y: 0.7 },
                { x: 0.1, y: 0.7 },
              ],
            },
          },
        ],
        imagePropertiesAnnotation: {
          dominantColors: {
            colors: [
              {
                color: { red: 40, green: 40, blue: 40 },
                score: 0.6,
                pixelFraction: 0.5,
              },
              {
                color: { red: 120, green: 60, blue: 180 },
                score: 0.4,
                pixelFraction: 0.3,
              },
            ],
          },
        },
        cropHintsAnnotation: {
          cropHints: [
            {
              boundingPoly: {
                normalizedVertices: [
                  { x: 0.05, y: 0.05 },
                  { x: 0.95, y: 0.05 },
                  { x: 0.95, y: 0.95 },
                  { x: 0.05, y: 0.95 },
                ],
              },
            },
          ],
        },
        safeSearchAnnotation: {
          adult: "VERY_UNLIKELY",
          violence: "UNLIKELY",
          racy: "VERY_UNLIKELY",
        },
      },
    ],
    _fallback: true, // helpful flag for UI/debug
  };
}

/**
 * Analyzes an image using the Google Cloud Vision API.
 * Falls back to hardcoded values if API fails.
 */
export async function analyzeImage(imageUrl: string) {
  try {
    const base64ImageData = await imageToBase64(imageUrl);

    const requestBody = {
      requests: [
        {
          image: { content: base64ImageData },
          features: [
            { type: "LABEL_DETECTION", maxResults: 10 },
            { type: "OBJECT_LOCALIZATION", maxResults: 10 },
            { type: "IMAGE_PROPERTIES" },
            { type: "CROP_HINTS", maxResults: 1 },
            { type: "SAFE_SEARCH_DETECTION" },
          ],
        },
      ],
    };

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      console.error("Google Vision API Error:", errorBody);
      throw new Error("Vision API failed");
    }

    return await response.json();
  } catch (error) {
    console.warn("⚠️ Using fallback Vision data:", error);
    return getFallbackVisionResponse();
  }
}

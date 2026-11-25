
const genAI = require("../config/gemini");

// Retry Gemini API on temporary errors
const generateContentWithRetry = async (request) => {
  const maxRetries = 3;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await genAI.models.generateContent(request);
    } catch (error) {
      const status = Number(error.status);

      const retryableErrors = [429, 500, 502, 503, 504];

      if (
        !retryableErrors.includes(status) ||
        attempt === maxRetries
      ) {
        throw error;
      }

      const delay = 2000 * Math.pow(2, attempt);

      console.log(
        `Gemini retry ${attempt + 1}/${maxRetries} after ${delay}ms`
      );

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

const analyzeViolationImage = async (imageBuffer, mimeType) => {
  try {
    if (!imageBuffer || !Buffer.isBuffer(imageBuffer)) {
      throw new Error("Valid image buffer is required");
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];

    if (!allowedTypes.includes(mimeType)) {
      throw new Error("Unsupported image format");
    }

    const base64Image = imageBuffer.toString("base64");

    const prompt = `
You are an AI assistant for an HOA Bylaw Violation Monitoring System.

Analyze the provided property evidence image.

Return a JSON object with these fields:

{
  "isViolationDetected": true,
  "suggestion": "Description of the possible violation",
  "severity": "low",
  "confidence": 75,
  "observations": "What is visibly present in the image",
  "reason": "Why this may be a violation",
  "recommendation": "What an HOA inspector should verify"
}

Rules:
1. severity must be low, medium, high, or critical.
2. confidence must be a number between 0 and 100.
3. Do not invent details that are not visible.
4. If no possible violation is visible, set isViolationDetected to false.
5. Do not claim that a violation is confirmed.
6. Return only valid JSON without markdown.
7. An image alone cannot establish whether an HOA rule was violated.
`;

    const response = await generateContentWithRetry({
      model: "gemini-3.8-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType,
                data: base64Image
              }
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    const responseText = response.text;

    if (!responseText) {
      throw new Error("Empty response received from Gemini AI");
    }

    const result = JSON.parse(responseText);

    const validSeverities = [
      "low",
      "medium",
      "high",
      "critical"
    ];

    if (
      typeof result.isViolationDetected !== "boolean" ||
      typeof result.suggestion !== "string" ||
      typeof result.confidence !== "number" ||
      !validSeverities.includes(result.severity)
    ) {
      throw new Error("Invalid AI response format");
    }

    if (
      result.confidence < 0 ||
      result.confidence > 100
    ) {
      throw new Error("Invalid AI confidence score");
    }

    return result;

  } catch (error) {
    console.error("AI Image Analysis Error:", error.message);
    throw error;
  }
};

module.exports = {
  analyzeViolationImage
};

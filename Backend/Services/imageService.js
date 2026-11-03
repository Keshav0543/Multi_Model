import { GoogleGenAI } from "@google/genai";
import fs from "fs/promises";

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

const ImageExtract = async (filePath, mimeType) => {
  try {
    // Read image from uploads
    const readImageBuffer = await fs.readFile(filePath);

    // Convert image into Base64
    const base64Image = readImageBuffer.toString("base64");

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Image,
              },
            },
            {
              text: `
Analyze this image in detail.

Describe:
- What objects or people are visible
- Any important text visible in the image
- Important context that could help answer questions about this image later

Be factual and don't make up information.
              `,
            },
          ],
        },
      ],
    });

    return response.text;

  } catch (err) {
    console.error("Image extraction error:", err.message);
    throw err; 
  }
};

export default ImageExtract;
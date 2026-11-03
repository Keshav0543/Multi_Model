import { PDFParse } from "pdf-parse";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

const MIN_TEXT_CHARS = 50;

const ocrPdf = async (data, filename) => {
  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: "application/pdf",
              data: data.toString("base64"),
            },
          },
          {
            text: `This PDF is a scanned document. Transcribe all of its text exactly as written, page by page, preserving names, dates, numbers and table contents. Do not summarize or add information.`,
          },
        ],
      },
    ],
  });

  const text = response.text || "";
  console.log(`OCR extracted ${text.length} chars from ${filename}`);
  return text;
};

const readFile = async (filePath, filename) => {
  const data = fs.readFileSync(filePath);
  const parser = new PDFParse({
    data: data,
  });

  let text;
  try {
    const result = await parser.getText();
    // pdf-parse inserts "-- N of M --" page markers even when a page has no text layer
    text = result.text.replace(/--\s*\d+\s+of\s+\d+\s*--/g, "").trim();
    console.log(`Extracted ${text.length} chars from ${filename}`);
  } finally {
    await parser.destroy();
  }

  if (text.length >= MIN_TEXT_CHARS) return text;

  console.log(`${filename} has no text layer, falling back to OCR`);
  return ocrPdf(data, filename);
};

export default readFile;
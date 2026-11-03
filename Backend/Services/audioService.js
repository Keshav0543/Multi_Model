import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
});


const audioExtract = async (filePath, fileType) => {
  try {
    console.log("STEP 1: Uploading audio to Gemini");

    const extractFile = await ai.files.upload({
      file: filePath,
      config: {
        mimeType: fileType,
      },
    });

    console.log("STEP 2: Audio uploaded successfully");
    console.log("Gemini file URI:", extractFile.uri);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              fileData: {
                fileUri: extractFile.uri,
                mimeType: extractFile.mimeType,
              },
            },
            {
              text: "Transcribe this audio completely and accurately. Return only the transcription text.",
            },
          ],
        },
      ],
    });

    console.log("STEP 3: Transcription completed");

    return response.text;

  } catch (err) {
    console.error("Audio error:", err);
    console.error("Error cause:", err.cause);
    console.error("Error stack:", err.stack);

    throw err;
  }
};


export default audioExtract;

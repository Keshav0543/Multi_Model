import mammoth from "mammoth";

const extractText = async (filePath) => {
  console.log("Processing file path:", filePath);
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    console.log("Extracted text successfully!");
    return result.value;
  } catch (error) {
    console.error("Mammoth failed to parse:", error.message);
    throw error;
  }
};

export default extractText;
import { GoogleGenAI } from "@google/genai";

const ai=new GoogleGenAI({
    apiKey:process.env.GOOGLE_API_KEY
});

async function createEmbedding(text){
    try{
        const response=await ai.models.embedContent({
        model:"gemini-embedding-001",
        contents:text
        });

        return response.embeddings[0].values;
    }
    catch(err){
        console.log(err.message);
        throw err;
    }
};

export default createEmbedding;
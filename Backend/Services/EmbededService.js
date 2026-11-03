import createEmbedding from "../config/EmbededModel.js";
import chunkschema from "../models/chunk.js";

async function generateEmbedding(chunks,sessionId,documentId){
    try{
        const docs=[];
        for(let i=0;i<chunks.length;i++){
            const embedding=await createEmbedding(chunks[i]);
            docs.push({ sessionId, documentId, chunkIndex: i, text:chunks[i], embedding });
        }
        await chunkschema.insertMany(docs,{ordered:true});
        return { inserted: docs.length };
    }
    catch(err){
        console.log(err.message);
        throw err;
    }
};

export default generateEmbedding;
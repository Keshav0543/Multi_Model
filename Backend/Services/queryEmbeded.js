import createEmbedding from "../config/EmbededModel.js";

async function queryEmbedding(question){
    return createEmbedding(question);
}

export default queryEmbedding;
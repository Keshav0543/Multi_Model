import mongoose from "mongoose";
import chunkschema from "../models/chunk.js";
import cosineCalculation from "../config/cosineSimilarity.js";
import Document from "../models/document.js";

async function SimilaritySearch(sessionId, queryEmbeded, docId) {
  try {
    let resultResponse = [];

    const filter = { sessionId };

    if (docId) {
      if (!mongoose.Types.ObjectId.isValid(docId)) {
        return [];
      }
      filter.documentId = docId;
    }

    const chunks = await chunkschema.find(filter);

    if (chunks.length === 0) {
      return [];
    }

    // Step 1: Calculate similarity
    for (let i = 0; i < chunks.length; i++) {
      const result = cosineCalculation(queryEmbeded, chunks[i].embedding);

      resultResponse.push({
        chunk: chunks[i].text,
        documentId: chunks[i].documentId,
        chunkIndex: chunks[i].chunkIndex,
        similarity: result,
      });
    }

    // Step 2: Get Top 3
    resultResponse.sort((a, b) => b.similarity - a.similarity);

    const newResult = resultResponse.slice(0, 3);

    // Step 3: Get unique document IDs
    const document_Id = new Set();

    newResult.forEach((data) => {
      document_Id.add(data.documentId.toString());
    });

    // Step 4: Fetch document metadata
    const newDocResult = await Document.find({
      _id: { $in: [...document_Id] },
    }).select("fileName fileType");

    // Step 5: Create Map
    const mp = new Map();

    for (let i = 0; i < newDocResult.length; i++) {
      mp.set(newDocResult[i]._id.toString(), newDocResult[i]);
    }

    // Step 6: Attach metadata
    for (let i = 0; i < newResult.length; i++) {
      const answer = mp.get(newResult[i].documentId.toString());

      newResult[i].metaData = answer
        ? {
            fileName: answer.fileName,
            fileType: answer.fileType,
          }
        : null;
    }

    return newResult;
  } catch (err) {
    console.log(err.message);
    throw err;
  }
};

export default SimilaritySearch;

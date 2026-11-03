import "dotenv/config";
import fs from "fs/promises";
import express from "express";
import mongoose from "mongoose";
import upload from "./server.js";
import bcrypt from "bcrypt";
import readFile from "./Services/pdfService.js";
import extractText from "./Services/docService.js";
import ImageExtract from "./Services/imageService.js";
import main from "./config/mongoconfig.js";
import { v4 as uuidv4 } from "uuid";
import generateHash from "./Services/hashService.js";
import Document from "./models/document.js";
import Session from "./models/session.js";
import chunkschema from "./models/chunk.js";
import chunkText from "./Services/chunkService.js";
import generateEmbedding from "./Services/EmbededService.js";
import queryEmbedding from "./Services/queryEmbeded.js";
import SimilaritySearch from "../Backend/Services/similarityService.js";
import ChatModel from "./config/chatModel.js";
import audioExtract from "./Services/audioService.js";
import userschema from "../Backend/models/user.js";
const app = express();

app.use(express.json());

const allowedAudioType = [
  "audio/mpeg",
  "audio/wav",
  "audio/mp4",
  "audio/aac",
  "audio/ogg",
  "audio/webm",
  "audio/flac",
];

app.post(
  "/api/upload/:sessionId",
  upload.array("myfiles", 3),
  async (req, res) => {
    try {
      if (!req.files || req.files.length == 0) {
        return res.status(404).json({
          message: "Document Not found Try again...",
        });
      }

      const { sessionId } = req.params;

      if (!sessionId) {
        return res.status(400).json({
          message: "First Create Session...",
        });
      }
      let uploaded_res = [];
      let response;
      for (const file of req.files) {
        const hashres = await generateHash(file.path);

        const existingdoc = await Document.findOne({
          sessionId,
          fileHash: hashres,
        });
        if (existingdoc) {
          const chunkCount = await chunkschema.countDocuments({
            documentId: existingdoc._id,
          });
          if (chunkCount > 0) {
            console.log("Duplicate file skipped:", file.originalname);
            await fs.unlink(file.path).catch(() => {});
            continue;
          }
          await Document.deleteOne({ _id: existingdoc._id });
        }

        const new_doc = await Document.create({
          sessionId,
          fileName: file.originalname,
          fileType: file.mimetype,
          fileHash: hashres,
        });

        try {
          if (file.mimetype === "application/pdf") {
            response = await readFile(file.path, file.originalname);
          } else if (
            file.mimetype ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          ) {
            response = await extractText(file.path);
          } else if (allowedAudioType.includes(file.mimetype)) {
            response = await audioExtract(file.path, file.mimetype);
          } else {
            response = await ImageExtract(file.path, file.mimetype);
          }

          const newChunk = chunkText(response, 200, 100);
          if (newChunk.length === 0) {
            throw new Error(`No readable text found in ${file.originalname}`);
          }

          const embededResult = await generateEmbedding(
            newChunk,
            sessionId,
            new_doc._id,
          );
          uploaded_res.push({
            docId: new_doc._id.toString(),
            sessionId,
            filename: file.filename,
            originalname: file.originalname,
            size: file.size,
            totalChunks: newChunk.length,
            embeddingResult: embededResult,
          });
        } catch (err) {
          await chunkschema.deleteMany({ documentId: new_doc._id });
          await Document.deleteOne({ _id: new_doc._id });
          await fs.unlink(file.path).catch(() => {});
          throw err;
        }
      }
      if (uploaded_res.length > 0) {
        await Session.updateOne(
          { sessionId },
          { $set: { lastActivityAt: new Date() } },
          { upsert: true },
        );
      }
      res.status(200).json({
        uploaded_res: uploaded_res,
      });
    } catch (err) {
      console.error("Upload error:", err);

      res.status(500).json({
        message: "Upload failed",
        error: err.message,
      });
    }
  },
);

app.post("/api/session", async (req, res) => {
  try {
    const sessionId = uuidv4();
    await Session.create({ sessionId });
    res.status(200).json({
      sessionId,
      message: "New Session Id Created...",
    });
  } catch (err) {
    console.error("Session create error:", err);
    res.status(500).json({
      message: "Failed to create session",
      error: err.message,
    });
  }
});

app.post("/api/chat/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { question, docId } = req.body;

    if (!question) {
      return res.status(400).json({
        message: "Question is required",
      });
    }

    // Step 1: Convert question into embedding
    const queryEmbedded = await queryEmbedding(question);
    // Step 2: Find relevant chunks (scoped to the selected document when sent)
    const relevantChunks = await SimilaritySearch(
      sessionId,
      queryEmbedded,
      docId,
    );

    if (relevantChunks.length === 0) {
      return res.status(404).json({
        message: "No documents found for this session",
      });
    }

    // Step 3: Extract text from top chunks
    const context = relevantChunks.map((item) => item.chunk).join("\n\n");
    console.log(context);
    const prompt = `Context from uploaded documents:
${context}

User question:
${question}

Answer the question using only the provided context.
`;
    const answer = await ChatModel(prompt);

    await Session.updateOne(
      { sessionId },
      { $set: { lastActivityAt: new Date() } },
      { upsert: true },
    );

    res.status(200).json({
      question,
      answer,
      results: relevantChunks.map((item) => ({
        similarity: item.similarity,
        text: item.chunk,
        fileName: item.metaData?.fileName || null,
        chunkIndex: item.chunkIndex,
      })),
    });
  } catch (err) {
    console.error("Chat error:", err.message);

    res.status(500).json({
      message: "Chat failed",
      error: err.message,
    });
  }
});

app.get("/api/docId", async (req, res) => {
  try {
    const documents = await Document.find({})
      .select("sessionId fileName fileType createdAt")
      .sort({ createdAt: -1 })
      .lean();

    if (documents.length === 0) {
      return res.status(200).json({ documents: [] });
    }

    const counts = await chunkschema.aggregate([
      { $group: { _id: "$documentId", count: { $sum: 1 } } },
    ]);
    const countByDoc = new Map(
      counts.map((item) => [item._id.toString(), item.count]),
    );

    return res.status(200).json({
      documents: documents.map((doc) => ({
        docId: doc._id.toString(),
        sessionId: doc.sessionId,
        fileName: doc.fileName,
        fileType: doc.fileType,
        createdAt: doc.createdAt,
        chunks: countByDoc.get(doc._id.toString()) || 0,
      })),
    });
  } catch (err) {
    console.error("Document list error:", err.message);
    return res.status(500).json({
      message: "Failed to load documents",
      error: err.message,
    });
  }
});

app.get("/api/sId/:docId", async (req, res) => {
  try {
    const { docId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(docId)) {
      return res.status(400).json({ message: "Invalid document id" });
    }

    const document = await Document.findById(docId)
      .select("sessionId fileName fileType createdAt")
      .lean();

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    const chunksData = await chunkschema
      .find({ documentId: docId })
      .select("chunkIndex text -_id")
      .sort({ chunkIndex: 1 })
      .lean();

    if (chunksData.length === 0) {
      return res.status(404).json({
        message: "No indexed data found for this document",
      });
    }

    return res.status(200).json({
      document: {
        docId: document._id.toString(),
        sessionId: document.sessionId,
        fileName: document.fileName,
        fileType: document.fileType,
        createdAt: document.createdAt,
      },
      chunksData,
    });
  } catch (err) {
    console.error("Document data error:", err.message);
    return res.status(500).json({
      message: "Failed to load document data",
      error: err.message,
    });
  }
});

app.post("/api/register", async (req, res) => {
  try {
    const { EmailId, Password, UserId } = req.body;

    if (!EmailId || !Password || !UserId) {
      return res.status(400).json({
        message: "Enter all required credentials",
      });
    }

    const existingUser = await userschema.findOne({
      $or: [{ EmailId }, { UserId }],
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email or UserId already registered",
      });
    }

    // Hash password
    const hash = await bcrypt.hash(Password, 10);

    // Create user
    const result = await userschema.create({
      EmailId,
      Password: hash,
      UserId,
    });

    const sessionId = uuidv4();

    await Session.create({
      sessionId,
      userId: result._id,
    });

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: result._id,
        EmailId: result.EmailId,
        UserId: result.UserId,
      },
      sessionId,
    });
  } catch (err) {
    console.error("Registration error:", err);

    return res.status(500).json({
      message: "Registration failed",
    });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { userId, Password } = req.body;
    if (!userId || !Password) {
      return res.status(404).json({
        message: "Enter Full data...",
      });
    }

    const response = await userschema.findOne({ userId }).lean();
    if (!response) {
      return res.status(404).json({
        message: "User Not Found...",
      });
    }

    const isValid = bcrypt.compare(Password, response.Password);
    if (!isValid) {
      return res.status(404).json({
        message: "Enter correct credentials...",
      });
    }
    const sessionId = uuidv4();
    await Session.create({ sessionId, userId: response._id });

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: result._id,
        EmailId: response.EmailId,
        UserId: response.userId,
      },
      sessionId,
    });
  } catch (err) {
    console.log(err.message);
    throw err;
  }
});

const InitializeConnection = async () => {
  try {
    await main();
    console.log("MongoDb connected...");
    app.listen(3000, () => {
      console.log("Server Listining On port:3000");
    });
  } catch (err) {
    console.error("Startup failed:", err.message);
    process.exit(1);
  }
};

InitializeConnection();
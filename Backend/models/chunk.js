import mongoose, { Mongoose } from "mongoose";
const { Schema } = mongoose;

const ChunkSchema = new Schema(
  {
    sessionId: {
      type: String,
      required: true,
    },

    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
    },

    chunkIndex: {
      type: Number,
      required: true,
    },

    text: {
      type: String,
      required: true,
    },

    embedding: {
      type: [Number],
      required: true,
    },
  },
  { timestamps: true },
);

ChunkSchema.index({ documentId: 1, chunkIndex: 1 }, { unique: true });
const chunkschema = mongoose.model("chunkschema", ChunkSchema);

export default chunkschema;
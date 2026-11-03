import mongoose from "mongoose";
const { Schema } = mongoose;

const DocumentSchema = new Schema(
  {
    sessionId: {
      type: String,
      required: true,
    },

    fileName: {
      type: String,
      required: true,
    },

    fileType: {
      type: String,
      required: true,
    },

    fileHash: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);


DocumentSchema.index({ sessionId: 1, fileHash: 1 }, { unique: true });
const Document = mongoose.model("Document", DocumentSchema);

export default Document;

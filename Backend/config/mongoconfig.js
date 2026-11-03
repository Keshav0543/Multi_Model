import mongoose from "mongoose";

const main = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set in .env");
  }

  await mongoose.connect(uri);
};

export default main;

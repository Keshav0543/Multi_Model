import crypto from "crypto";
import fs from "fs/promises";

const generateHash= async (filePath)=>{
    const fileBuffer=await fs.readFile(filePath);
    return crypto.createHash("sha256").update(fileBuffer).digest("hex");
};

export default generateHash;
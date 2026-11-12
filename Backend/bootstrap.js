import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.join(process.cwd(), "Backend/.env"),
});

// Import the application only after loading environment variables
await import("./index.js");
import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.join(process.cwd(), "Multi_modal/Backend/.env"),
});

// Import the application only after loading environment variables
await import("./index.js");
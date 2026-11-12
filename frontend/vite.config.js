import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const AZURE_API =
  "https://multimodal-rag-api-a3ahc2erbddxckcj.indiasouthcentral-01.azurewebsites.net";

// API_PROXY_TARGET=http://localhost:3000 npm run dev to hit a local backend.
const apiTarget = process.env.API_PROXY_TARGET || AZURE_API;

const proxy = {
  "/api": {
    target: apiTarget,
    changeOrigin: true,
  },
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy,
  },
  preview: {
    port: 4173,
    proxy,
  },
});

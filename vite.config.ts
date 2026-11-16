import { defineConfig } from "vite";
export default defineConfig({
  base: "./",
  build: { target: "es2022", chunkSizeWarningLimit: 1600 },
  server: { host: "127.0.0.1" },
  preview: { host: "127.0.0.1", port: 4173 },
});

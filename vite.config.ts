import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  // Relative base so the built assets work both at the domain root
  // (Firebase Hosting) and under a subpath (GitHub Pages: /usuario.github.io/repo/).
  base: "./",
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base defaults to "/" which is correct for Netlify, Vercel, and Cloudflare Pages.
// GitHub Pages project sites serve from /<repo-name>/ — set VITE_BASE=/forcecamp/ there.
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE || "/",
  build: { outDir: "dist" },
});

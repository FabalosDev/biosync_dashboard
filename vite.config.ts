// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  server: {
    port: 8080,
    proxy: {
      // Content / Regenerated
      "/api/webhook/content": {
        target: "http://localhost:5678", // your n8n base
        changeOrigin: true,
        rewrite: (p) => "/webhook/CONTENT_UUID_HERE",
      },
      // News (non-RSS)
      "/api/webhook/news": {
        target: "http://localhost:5678",
        changeOrigin: true,
        rewrite: (p) => "/webhook/NEWS_UUID_HERE",
      },
      // Dentistry (non-RSS)
      "/api/webhook/dentistry": {
        target: "http://localhost:5678",
        changeOrigin: true,
        rewrite: (p) => "/webhook/DENTISTRY_UUID_HERE",
      },
      // RSS — HNN
      "/api/webhook/rss-news": {
        target: "http://localhost:5678",
        changeOrigin: true,
        rewrite: (p) => "/webhook/HNN_RSS_UUID_HERE",
      },
      // RSS — Media (Thumbnail System)
      "/api/webhook/rss-media": {
        target: "http://localhost:5678",
        changeOrigin: true,
        rewrite: (p) => "/webhook/MEDIA_RSS_UUID_HERE",
      },
      // RSS — Dentistry
      "/api/webhook/rss-dentistry": {
        target: "http://localhost:5678",
        changeOrigin: true,
        rewrite: (p) => "/webhook/DENTAL_RSS_UUID_HERE",
      },
    },
  },
});

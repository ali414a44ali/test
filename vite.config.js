import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon-192.png", "icon-512.png", "sound-notify.mp3"],
      manifest: false,
      workbox: { globPatterns: ["**/*.{js,css,html,mp3,png}"] },
    }),
  ],
});

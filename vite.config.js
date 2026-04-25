import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import svgr from "vite-plugin-svgr";

export default defineConfig({
  plugins: [
    svgr(),
    react({
      jsxImportSource: undefined,
      babel: { plugins: [] }
    }),
    tailwindcss()
  ],
  resolve: {
    dedupe: ["react", "react-dom"],
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://api.aussiemate.com.au',
        changeOrigin: true,
        secure: false,
      },
    },
    hmr: { overlay: true, port: 5173 },
    watch: { usePolling: false, interval: 100 }
  },
  build: {
    chunkSizeWarningLimit: 1500,
  },
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // sockjs-client references Node's `global` — polyfill it for the browser
  define: {
    global: "globalThis",
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      "/api": {
        target: process.env.VITE_API_PROXY || "http://localhost:4000",
        changeOrigin: true,
      },
      "/ebia-audio": {
        target: "http://localhost:9000",
        changeOrigin: true,
      },
      // SockJS/STOMP WebSocket for messaging + notifications
      "/ws": {
        target: "http://localhost:4000",
        ws: true,
      },
    },
  },
  build: {
    outDir: "dist",
  },
});

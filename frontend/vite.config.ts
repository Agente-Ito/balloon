import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // Buffer is the main culprit from @erc725/erc725.js → hash-base → md5.js
      include: ["buffer", "stream", "util", "process"],
      globals: { Buffer: true, global: true, process: true },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "es2020",
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          lukso: ["viem", "@erc725/erc725.js"],
        },
      },
    },
  },
  optimizeDeps: {
    include: ["@lukso/up-provider"],
  },
});

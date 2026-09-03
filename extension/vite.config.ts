import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: [
            "node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.mjs",
            "node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.wasm"
          ],
          dest: "ocr/ort",
          rename: { stripBase: true }
        }
      ]
    })
  ],
  define: {
    "process.env.NODE_ENV": JSON.stringify("production")
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    copyPublicDir: true,
    lib: {
      entry: resolve(import.meta.dirname, "src/content/index.tsx"),
      name: "JustListenContent",
      formats: ["iife"],
      fileName: () => "content.js"
    }
  }
});

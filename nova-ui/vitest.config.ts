import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(root, "src"),
    },
  },
  test: {
    root,
    environment: "jsdom",
    globals: true,
    setupFiles: [resolve(root, "src/test/setup.ts")],
    css: false,
  },
});
